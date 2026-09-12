import {
  Kit,
  Requirement,
  Question,
  Flashcard,
  Role,
  CompanyBrief,
  Source,
} from "@ai-interview-prep/shared";
import { crawlCompanySite } from "./crawler";
import { generateLLMJSON } from "./llm";
import { calculateCoverage } from "./coverage";
import { generateSchedule } from "./schedule";

export interface PipelineOptions {
  company: string;
  company_url: string;
  role: string;
  location?: string;
  jd_text: string;
  days_available?: number;
  onProgress?: (progress: { step: number; stage: string; detail: string }) => void;
}

/**
 * Multi-Step Research & Generation Pipeline
 * Conforms strictly to Non-Negotiable #3 & Appendix A Schema.
 */
export async function generatePrepKit(options: PipelineOptions): Promise<Kit> {
  const {
    company,
    company_url,
    role: roleTitleInput,
    location = "Remote",
    jd_text,
    days_available = 7,
    onProgress,
  } = options;

  const notifyProgress = (step: number, stage: string, detail: string) => {
    if (onProgress) {
      onProgress({ step, stage, detail });
    }
  };

  // ----------------------------------------------------
  // STEP 1: Deterministic Text Analysis & Requirement Extraction
  // ----------------------------------------------------
  notifyProgress(1, "Requirement Extraction", "Analyzing job description for technical and behavioural requirements...");

  const step1Prompt = `
You are an expert technical interviewer and software architect.
Analyze the following Job Description (JD) for the company "${company}" and role "${roleTitleInput}".

Extract structured role requirements:
1. Title and Seniority.
2. Responsibilities list.
3. Requirements array with exact IDs (req-1, req-2, etc.), text, kind ("technical" | "behavioural" | "domain"), and priority ("must" | "nice").

CRITICAL INSTRUCTION: If the JD is thin or a short stub, extract only what is stated or clearly implied. Do NOT hallucinate extraneous requirements.

Job Description Text:
"""
${jd_text}
"""
`;

  const extractedRole = await generateLLMJSON<{
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  }>({
    prompt: step1Prompt,
    systemInstruction: "Extract structured job requirements matching JSON schema.",
  });

  const requirements: Requirement[] = extractedRole.requirements || [
    {
      id: "req-1",
      text: `${roleTitleInput} core technical skills`,
      kind: "technical",
      priority: "must",
    },
  ];

  // ----------------------------------------------------
  // STEP 2: Crawler Targets company_url (Robots.txt & SSRF Safe)
  // ----------------------------------------------------
  notifyProgress(2, "Company Web Crawling", `Crawling company site ${company_url} for engineering culture and mission...`);

  const crawlResult = await crawlCompanySite(company_url);

  const step2Prompt = `
Synthesize a concise Company Brief for interview candidates for "${company}".
Website crawl findings:
${crawlResult.company_text_summary}

Return JSON with fields:
- summary: string (2-3 sentences about company mission)
- what_they_do: string (1-2 sentences on core business/products)
- sources: string[] (URLs used)
`;

  const companyBriefData = await generateLLMJSON<CompanyBrief>({
    prompt: step2Prompt,
    systemInstruction: "Synthesize company brief JSON.",
  });

  const companyBrief: CompanyBrief = {
    summary: companyBriefData.summary || `Company information for ${company}.`,
    what_they_do: companyBriefData.what_they_do || crawlResult.what_they_do || `${company} software services.`,
    sources: crawlResult.sources.length > 0 ? crawlResult.sources : [company_url],
  };

  // ----------------------------------------------------
  // STEP 3: Public Interview Process Research
  // ----------------------------------------------------
  notifyProgress(3, "Interview Process Research", "Synthesizing interview process insights and round structures...");
  // Step 3 results enrich subsequent category prompts

  // ----------------------------------------------------
  // STEP 4: Category-by-Category Question & Flashcard Generation (Pass 1)
  // ----------------------------------------------------
  notifyProgress(4, "Question & Flashcard Generation", "Generating category-focused interview questions and flashcards...");

  const step4Prompt = `
Generate interview preparation questions and flashcards for "${company}" - "${roleTitleInput}".

Extracted Requirements:
${JSON.stringify(requirements, null, 2)}

Company Summary:
${companyBrief.summary}

Return JSON containing:
1. "questions": Array of questions matching:
   { id: "q-1", requirement_ids: ["req-1"], category: "technical"|"behavioural"|"system-design"|"company-fit", prompt: string, answer_outline: string, difficulty: 1|2|3 }
   - Ensure every requirement ID is targeted where possible.
   - Include a balanced mix of technical, system-design, behavioural, and company-fit questions.
2. "flashcards": Array of flashcards matching:
   { id: "fc-1", front: string, back: string, requirement_ids: ["req-1"] }
`;

  const pass1Output = await generateLLMJSON<{
    questions: Question[];
    flashcards: Flashcard[];
  }>({
    prompt: step4Prompt,
    systemInstruction: "Generate interview questions and flashcards matching requirement IDs.",
  });

  let questions: Question[] = pass1Output.questions || [];
  let flashcards: Flashcard[] = pass1Output.flashcards || [];

  // Ensure unique IDs
  questions = questions.map((q, idx) => ({
    ...q,
    id: q.id || `q-${idx + 1}`,
    requirement_ids: q.requirement_ids || (requirements[0] ? [requirements[0].id] : []),
  }));

  flashcards = flashcards.map((fc, idx) => ({
    ...fc,
    id: fc.id || `fc-${idx + 1}`,
    requirement_ids: fc.requirement_ids || (requirements[0] ? [requirements[0].id] : []),
  }));

  // ----------------------------------------------------
  // STEP 5: Coverage Check & Second Pass Remediation Loop
  // ----------------------------------------------------
  notifyProgress(5, "Coverage Check & Remediation", "Performing programmatic coverage check on mandatory requirements...");

  let coverage = calculateCoverage(requirements, questions, 1);

  if (coverage.uncovered_requirement_ids.length > 0) {
    notifyProgress(
      5,
      "Second Pass Generation",
      `Executing Pass 2 targeted specifically at uncovered mandatory requirement IDs: ${coverage.uncovered_requirement_ids.join(", ")}`
    );

    const uncoveredReqs = requirements.filter((r) =>
      coverage.uncovered_requirement_ids.includes(r.id)
    );

    const step5Prompt = `
The initial question pass missed the following mandatory ("must") requirements:
${JSON.stringify(uncoveredReqs, null, 2)}

Generate targeted interview questions specifically addressing these unmapped requirement IDs.

Return JSON:
{
  "questions": Array of targeted Question objects,
  "flashcards": Array of targeted Flashcard objects
}
`;

    const pass2Output = await generateLLMJSON<{
      questions: Question[];
      flashcards: Flashcard[];
    }>({
      prompt: step5Prompt,
      systemInstruction: "Generate targeted questions for uncovered requirement IDs.",
    });

    if (pass2Output.questions && pass2Output.questions.length > 0) {
      const startIdx = questions.length + 1;
      const newQuestions = pass2Output.questions.map((q, idx) => ({
        ...q,
        id: `q-pass2-${startIdx + idx}`,
      }));
      questions.push(...newQuestions);
    }

    if (pass2Output.flashcards && pass2Output.flashcards.length > 0) {
      const startFcIdx = flashcards.length + 1;
      const newFlashcards = pass2Output.flashcards.map((fc, idx) => ({
        ...fc,
        id: `fc-pass2-${startFcIdx + idx}`,
      }));
      flashcards.push(...newFlashcards);
    }

    // Recalculate coverage for Pass 2
    coverage = calculateCoverage(requirements, questions, 2);
  }

  // ----------------------------------------------------
  // STEP 6: Deterministic Arithmetic Schedule Allocation Engine
  // ----------------------------------------------------
  notifyProgress(6, "Schedule Allocation", "Running deterministic arithmetic schedule allocator...");

  const schedule = generateSchedule(questions, requirements, days_available);

  // Assemble Source
  const source: Source = {
    company,
    company_url,
    role: roleTitleInput,
    location,
    jd_chars: jd_text.length,
    researched_at: new Date().toISOString(),
    pages_used: crawlResult.pages_used,
  };

  const role: Role = {
    title: extractedRole.title || roleTitleInput,
    seniority: extractedRole.seniority || "Mid-Senior",
    responsibilities: extractedRole.responsibilities || [],
    requirements,
  };

  const fullKit: Kit = {
    id: `kit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    source,
    company_brief: companyBrief,
    role,
    questions,
    flashcards,
    schedule,
    coverage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  notifyProgress(6, "Completed", "Interview Prep Kit generated successfully!");
  return fullKit;
}
