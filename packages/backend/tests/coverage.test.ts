import { describe, it, expect } from "vitest";
import { calculateCoverage } from "../src/services/coverage";
import { Question, Requirement } from "@ai-interview-prep/shared";

describe("Deterministic Coverage Calculator", () => {
  const requirements: Requirement[] = [
    { id: "req-1", text: "Go concurrency", kind: "technical", priority: "must" },
    { id: "req-2", text: "Distributed consensus", kind: "technical", priority: "must" },
    { id: "req-3", text: "Team mentoring", kind: "behavioural", priority: "must" },
    { id: "req-4", text: "Docker containers", kind: "technical", priority: "nice" },
  ];

  it("identifies uncovered must requirements accurately via programmatic set operations", () => {
    const questions: Question[] = [
      {
        id: "q-1",
        requirement_ids: ["req-1"],
        category: "technical",
        prompt: "Channels vs Mutex in Go",
        answer_outline: "Outline...",
        difficulty: 2,
      },
    ];

    const coverage = calculateCoverage(requirements, questions, 1);

    expect(coverage.passes).toBe(1);
    // req-2 and req-3 are "must" requirements not covered in questions
    expect(coverage.uncovered_requirement_ids).toContain("req-2");
    expect(coverage.uncovered_requirement_ids).toContain("req-3");
    // req-4 is "nice", so it should NOT be flagged as uncovered
    expect(coverage.uncovered_requirement_ids).not.toContain("req-4");
  });

  it("returns empty uncovered_requirement_ids when all must requirements are covered", () => {
    const questions: Question[] = [
      {
        id: "q-1",
        requirement_ids: ["req-1", "req-2"],
        category: "technical",
        prompt: "Raft consensus in Go",
        answer_outline: "Outline...",
        difficulty: 3,
      },
      {
        id: "q-2",
        requirement_ids: ["req-3"],
        category: "behavioural",
        prompt: "Describe mentoring a junior engineer",
        answer_outline: "Outline...",
        difficulty: 2,
      },
    ];

    const coverage = calculateCoverage(requirements, questions, 2);

    expect(coverage.passes).toBe(2);
    expect(coverage.uncovered_requirement_ids.length).toBe(0);
  });
});
