import { Requirement, Question, Coverage } from "@ai-interview-prep/shared";

/**
 * Deterministic Gap Check / Coverage Calculator.
 * MUST NOT be delegated to an LLM.
 * Programmatically compares generated questions' requirement_ids against mandatory role requirement IDs.
 */
export function calculateCoverage(
  requirements: Requirement[],
  questions: Question[],
  passes: number = 1
): Coverage {
  // Extract mandatory requirement IDs
  const mustRequirementIds = new Set(
    requirements
      .filter((req) => req.priority === "must")
      .map((req) => req.id)
  );

  // Extract all requirement IDs referenced across generated questions
  const coveredRequirementIds = new Set<string>();
  for (const question of questions) {
    if (Array.isArray(question.requirement_ids)) {
      for (const reqId of question.requirement_ids) {
        coveredRequirementIds.add(reqId);
      }
    }
  }

  // Programmatic set difference for uncovered mandatory requirements
  const uncovered: string[] = [];
  for (const mustId of mustRequirementIds) {
    if (!coveredRequirementIds.has(mustId)) {
      uncovered.push(mustId);
    }
  }

  return {
    uncovered_requirement_ids: uncovered,
    passes: Math.max(1, passes),
  };
}
