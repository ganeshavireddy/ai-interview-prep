import { describe, it, expect } from "vitest";
import { KitSchema, BatchOutputSchema } from "@ai-interview-prep/shared";

describe("Appendix A & B Zod Schema Strictness", () => {
  it("validates a compliant Appendix A Kit object", () => {
    const validKit = {
      source: {
        company: "Stripe",
        company_url: "https://stripe.com",
        role: "Senior Backend Engineer",
        location: "Remote",
        jd_chars: 1250,
        researched_at: new Date().toISOString(),
        pages_used: ["https://stripe.com/about", "https://stripe.com/jobs"],
      },
      company_brief: {
        summary: "Stripe builds economic infrastructure for the internet.",
        what_they_do: "Processes online payments and billing solutions globally.",
        sources: ["https://stripe.com/about"],
      },
      role: {
        title: "Senior Backend Engineer",
        seniority: "Senior",
        responsibilities: ["Architect high throughput APIs", "Ensure 99.999% uptime"],
        requirements: [
          {
            id: "req-1",
            text: "5+ years backend distributed systems experience",
            kind: "technical" as const,
            priority: "must" as const,
          },
        ],
      },
      questions: [
        {
          id: "q-1",
          requirement_ids: ["req-1"],
          category: "technical" as const,
          prompt: "How do you guarantee idempotent payment execution?",
          answer_outline: "Use unique idempotency keys in Redis/SQL with atomic transactions.",
          difficulty: 3 as const,
        },
      ],
      flashcards: [
        {
          id: "fc-1",
          front: "What is an Idempotency Key?",
          back: "A unique identifier that guarantees an API request executes at most once.",
          requirement_ids: ["req-1"],
        },
      ],
      schedule: {
        days_available: 7,
        days: [
          {
            day: 1,
            focus: "Payment Idempotency & Distributed Transactions",
            question_ids: ["q-1"],
            minutes: 45,
          },
        ],
      },
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
      },
    };

    const parsed = KitSchema.safeParse(validKit);
    expect(parsed.success).toBe(true);
  });

  it("rejects non-integer difficulty or invalid requirement kind", () => {
    const invalidKit = {
      source: {
        company: "Test",
        company_url: "https://test.com",
        role: "Dev",
        location: "Remote",
        jd_chars: 100,
        researched_at: new Date().toISOString(),
        pages_used: [],
      },
      company_brief: { summary: "", what_they_do: "", sources: [] },
      role: {
        title: "Dev",
        seniority: "Junior",
        responsibilities: [],
        requirements: [
          {
            id: "req-1",
            text: "Coding",
            kind: "invalid-kind", // invalid enum
            priority: "must",
          },
        ],
      },
      questions: [
        {
          id: "q-1",
          requirement_ids: ["req-1"],
          category: "technical",
          prompt: "Test?",
          answer_outline: "Test",
          difficulty: 2.5, // invalid float difficulty
        },
      ],
      flashcards: [],
      schedule: { days_available: 1, days: [] },
      coverage: { uncovered_requirement_ids: [], passes: 1 },
    };

    const parsed = KitSchema.safeParse(invalidKit);
    expect(parsed.success).toBe(false);
  });

  it("validates Appendix B BatchOutputSchema structure", () => {
    const validBatchOutput = {
      version: "1.0" as const,
      generated_at: new Date().toISOString(),
      kits: [
        {
          id: "case-1",
          status: "ok" as const,
          error: null,
        },
        {
          id: "case-2",
          status: "failed" as const,
          error: "Scraping timeout",
        },
      ],
    };

    const parsed = BatchOutputSchema.safeParse(validBatchOutput);
    expect(parsed.success).toBe(true);
  });
});
