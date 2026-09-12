import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { generatePrepKit } from "../services/pipeline";
import { generateLLMJSON } from "../services/llm";
import { generateSchedule } from "../services/schedule";
import { calculateCoverage } from "../services/coverage";
import { KitModel } from "../models/Kit";
import { Question, Kit } from "@ai-interview-prep/shared";

// In-memory fallback map if MongoDB is not connected
const localKitStore = new Map<string, Kit>();

export async function generate(req: AuthenticatedRequest, res: Response) {
  try {
    const { company, company_url, role, location, jd_text, days_available } = req.body;
    if (!company || !role || !jd_text) {
      return res.status(400).json({ error: "Missing required fields: company, role, jd_text" });
    }

    const kit = await generatePrepKit({
      company,
      company_url: company_url || "https://none",
      role,
      location,
      jd_text,
      days_available: days_available || 7,
    });

    const userId = req.user?.userId;
    try {
      const doc = await KitModel.create({ ...kit, userId });
      kit.id = doc._id.toString();
    } catch (err) {
      // Local fallback
      localKitStore.set(kit.id!, kit);
    }

    return res.status(201).json(kit);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Kit generation failed." });
  }
}

export async function getKits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (userId) {
      const docs = await KitModel.find({ userId }).sort({ createdAt: -1 });
      if (docs.length > 0) {
        const kits = docs.map((d) => ({ ...d.toObject(), id: d._id.toString() }));
        return res.json(kits);
      }
    }
    const localKits = Array.from(localKitStore.values());
    return res.json(localKits);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch kits." });
  }
}

export async function getKitById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    try {
      const doc = await KitModel.findById(id);
      if (doc) {
        return res.json({ ...doc.toObject(), id: doc._id.toString() });
      }
    } catch (e) {}

    const localKit = localKitStore.get(id);
    if (localKit) {
      return res.json(localKit);
    }

    return res.status(404).json({ error: "Kit not found." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch kit." });
  }
}

export async function updateKit(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const updatedKitData: Kit = req.body;
    updatedKitData.updated_at = new Date().toISOString();

    try {
      const doc = await KitModel.findByIdAndUpdate(id, updatedKitData, { new: true });
      if (doc) {
        return res.json({ ...doc.toObject(), id: doc._id.toString() });
      }
    } catch (e) {}

    localKitStore.set(id, updatedKitData);
    return res.json(updatedKitData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update kit." });
  }
}

/**
 * Selective Section Regeneration Endpoint.
 * Preserves questions where `isEdited: true` or `isPinned: true`.
 * Generates replacements for unpinned/unedited questions in target category and merges them back.
 */
export async function regenerateSection(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { category } = req.body; // "technical" | "behavioural" | "system-design" | "company-fit"

    if (!category) {
      return res.status(400).json({ error: "Missing target category for regeneration." });
    }

    let kit: Kit | null = null;
    try {
      const doc = await KitModel.findById(id);
      if (doc) kit = { ...doc.toObject(), id: doc._id.toString() };
    } catch (e) {}

    if (!kit) {
      kit = localKitStore.get(id) || null;
    }

    if (!kit) {
      return res.status(404).json({ error: "Kit not found." });
    }

    // Filter questions: preserve pinned or edited items
    const preservedQuestions: Question[] = [];
    const questionsToReplaceCount: number = kit.questions.filter((q) => {
      if (q.category === category) {
        if (q.isEdited || q.isPinned) {
          preservedQuestions.push(q);
          return false;
        }
        return true; // replace
      } else {
        preservedQuestions.push(q); // preserve other categories
        return false;
      }
    }).length;

    const countToGenerate = Math.max(1, questionsToReplaceCount);

    // Call LLM for targeted section replacement
    const prompt = `
Generate ${countToGenerate} fresh interview questions for section category "${category}".
Role: ${kit.role.title} at ${kit.source.company}.
Requirements: ${JSON.stringify(kit.role.requirements)}

Return JSON:
{
  "questions": Array of ${countToGenerate} Question objects matching:
  { id: string, requirement_ids: string[], category: "${category}", prompt: string, answer_outline: string, difficulty: 1|2|3 }
}
`;

    const replacementResult = await generateLLMJSON<{ questions: Question[] }>({
      prompt,
      systemInstruction: `Generate fresh ${category} interview questions.`,
    });

    const newQuestions = (replacementResult.questions || []).map((q, idx) => ({
      ...q,
      id: `q-${category}-regen-${Date.now()}-${idx + 1}`,
      category: category as any,
    }));

    // Merge preserved questions + new replacement questions
    const finalQuestions = [...preservedQuestions, ...newQuestions];
    kit.questions = finalQuestions;

    // Recalculate coverage & schedule deterministically
    kit.coverage = calculateCoverage(kit.role.requirements, kit.questions, kit.coverage.passes);
    kit.schedule = generateSchedule(kit.questions, kit.role.requirements, kit.schedule.days_available);
    kit.updated_at = new Date().toISOString();

    // Persist
    try {
      await KitModel.findByIdAndUpdate(id, kit);
    } catch (e) {}
    localKitStore.set(id, kit);

    return res.json(kit);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to regenerate section." });
  }
}
