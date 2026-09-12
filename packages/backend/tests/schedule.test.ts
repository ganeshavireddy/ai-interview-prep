import { describe, it, expect } from "vitest";
import { generateSchedule } from "../src/services/schedule";
import { Question, Requirement } from "@ai-interview-prep/shared";

describe("Deterministic Schedule Engine", () => {
  const sampleRequirements: Requirement[] = [
    { id: "req-1", text: "Distributed Systems", kind: "technical", priority: "must" },
    { id: "req-2", text: "Database Locks", kind: "technical", priority: "must" },
    { id: "req-3", text: "Kubernetes", kind: "technical", priority: "nice" },
  ];

  const sampleQuestions: Question[] = [
    {
      id: "q-1",
      requirement_ids: ["req-1"],
      category: "technical",
      prompt: "Explain 2PC vs Paxos",
      answer_outline: "Outline...",
      difficulty: 3,
    },
    {
      id: "q-2",
      requirement_ids: ["req-2"],
      category: "technical",
      prompt: "Explain PostgreSQL isolation levels",
      answer_outline: "Outline...",
      difficulty: 2,
    },
    {
      id: "q-3",
      requirement_ids: ["req-3"],
      category: "technical",
      prompt: "Describe Kubernetes Pod Lifecycle",
      answer_outline: "Outline...",
      difficulty: 1,
    },
    {
      id: "q-4",
      requirement_ids: ["req-1"],
      category: "system-design",
      prompt: "Design high throughput payment ledger",
      answer_outline: "Outline...",
      difficulty: 3,
    },
  ];

  it("strictly matches the requested days_available count", () => {
    const daysAvailable = 5;
    const schedule = generateSchedule(sampleQuestions, sampleRequirements, daysAvailable);

    expect(schedule.days_available).toBe(5);
    expect(schedule.days.length).toBe(5);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[4].day).toBe(5);
  });

  it("ensures all time durations are non-negative integers", () => {
    const schedule = generateSchedule(sampleQuestions, sampleRequirements, 3);
    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(0);
    }
  });

  it("prioritizes must-have and high-difficulty questions earlier", () => {
    const schedule = generateSchedule(sampleQuestions, sampleRequirements, 3);
    // Day 1 should include high priority / high difficulty questions
    const day1QuestionIds = schedule.days[0].question_ids;
    expect(day1QuestionIds.includes("q-1") || day1QuestionIds.includes("q-4")).toBe(true);
  });
});
