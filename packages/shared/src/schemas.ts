import { z } from "zod";

// Requirement Kind & Priority Enums
export const RequirementKindSchema = z.enum(["technical", "behavioural", "domain"]);
export const RequirementPrioritySchema = z.enum(["must", "nice"]);

// Single Requirement Schema
export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
});

// Role Schema
export const RoleSchema = z.object({
  title: z.string().min(1),
  seniority: z.string().default("Mid-Senior"),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(RequirementSchema).min(1),
});

// Source Schema
export const SourceSchema = z.object({
  company: z.string().min(1),
  company_url: z.string(),
  role: z.string().min(1),
  location: z.string().default("Remote"),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(), // ISO string
  pages_used: z.array(z.string()).default([]),
});

// Company Brief Schema
export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()).default([]),
  isEdited: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

// Question Category & Difficulty
export const QuestionCategorySchema = z.enum([
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
]);
export const QuestionDifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

// Question Schema
export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: QuestionDifficultySchema,
  isEdited: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isManual: z.boolean().optional(),
});

// Flashcard Schema
export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  confidence: z.enum(["Again", "Good", "Easy"]).optional(),
  isEdited: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isManual: z.boolean().optional(),
});

// Schedule Day Schema
export const ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative(),
});

// Schedule Schema
export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema),
});

// Coverage Schema
export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().positive(),
});

// Full Appendix A Kit Schema
export const KitSchema = z.object({
  id: z.string().optional(),
  source: SourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Appendix B Single Evaluator Case Item
export const EvaluationCaseSchema = z.object({
  id: z.string(),
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  jd_text: z.string(),
  days_available: z.number().int().positive().default(7),
});

// Appendix B Batch Output Result
export const BatchKitResultSchema = z.object({
  id: z.string(),
  status: z.enum(["ok", "failed"]),
  kit: KitSchema.nullable().optional(),
  error: z.string().nullable().optional(),
});

export const BatchOutputSchema = z.object({
  version: z.literal("1.0"),
  generated_at: z.string(),
  kits: z.array(BatchKitResultSchema),
});

export type RequirementKind = z.infer<typeof RequirementKindSchema>;
export type RequirementPriority = z.infer<typeof RequirementPrioritySchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;
export type QuestionDifficulty = z.infer<typeof QuestionDifficultySchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Coverage = z.infer<typeof CoverageSchema>;
export type Kit = z.infer<typeof KitSchema>;
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
export type BatchKitResult = z.infer<typeof BatchKitResultSchema>;
export type BatchOutput = z.infer<typeof BatchOutputSchema>;
