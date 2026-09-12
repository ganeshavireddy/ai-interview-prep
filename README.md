# The AI Interview Prep Kit & CLI Batch Runner

> A full-stack web application, resilient web scraping pipeline, LLM generation engine, and CLI batch evaluator for constructing evidence-backed, highly targeted job interview preparation kits.

---

## 1. Executive Summary & Architecture Overview

**The AI Interview Prep Kit** automates the preparation lifecycle for technical and cultural job interviews. Given a Job Description (JD) and company website URL, the platform extracts role requirements, crawls company engineering culture, synthesizes interview insights, checks mandatory requirement coverage, and allocates a daily study schedule.

```
                                 [ Job Description + Company URL ]
                                                 │
                                                 ▼
                              ┌─────────────────────────────────────┐
                              │     Multi-Step LLM & Scraper        │
                              │             Pipeline                │
                              └──────────────────┬──────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌─────────────────────────────┐                             ┌─────────────────────────────┐
    │  Set-based Coverage Engine  │                             │ Pure Arithmetic Schedule    │
    │  (Deterministic Pass 1 & 2) │                             │ Allocator (Exact Days)      │
    └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │   Appendix A Schema Kit     │
                                  │   (Strict Zod Validation)   │
                                  └──────────────┬──────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │ Next.js App Router UI     │                     │ CLI Batch Evaluator       │
          │ Builder & Practice Mode   │                     │ (npm run evaluate)        │
          └───────────────────────────┘                     └───────────────────────────┘
```

---

## 2. Technology Stack & Environment Setup

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React, Glassmorphism UI design system.
- **Backend**: Node.js, Express, TypeScript, Mongoose (MongoDB).
- **Scraping**: Cheerio, Axios, `robots-parser`, SSRF validation layer.
- **LLM Integration**: Google Gemini API (`gemini-1.5-flash` / REST), `p-throttle` rate-limiting, exponential backoff retries on 429/503.
- **Testing**: Vitest unit testing suite.
- **CLI Evaluator**: Node.js batch evaluator generating Appendix B compliant output.

### Installation & Commands

```bash
# Install workspace dependencies
npm install

# Build shared schema package
npm run build:shared

# Run Vitest unit tests (Schedule, Coverage, Schema)
npm test

# Run CLI Batch Evaluator (Section 9 test cases)
npm run evaluate -- --input test-cases.json --output evaluation-output.json

# Start Backend API (Port 8099)
npm run dev:backend

# Start Next.js Frontend (Port 3000)
npm run dev:frontend
```

---

## 3. Appendix A & Appendix B Schema Strictness

All generated kits conform strictly to **Appendix A Schema**:

```typescript
export const KitSchema = z.object({
  source: z.object({
    company: z.string(),
    company_url: z.string(),
    role: z.string(),
    location: z.string(),
    jd_chars: z.number().int(),
    researched_at: z.string(),
    pages_used: z.array(z.string()),
  }),
  company_brief: z.object({
    summary: z.string(),
    what_they_do: z.string(),
    sources: z.array(z.string()),
  }),
  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(RequirementSchema), // { id, text, kind, priority }
  }),
  questions: z.array(QuestionSchema), // { id, requirement_ids, category, prompt, answer_outline, difficulty: 1|2|3 }
  flashcards: z.array(FlashcardSchema),
  schedule: z.object({
    days_available: z.number().int().positive(),
    days: z.array(ScheduleDaySchema), // { day: int, focus: string, question_ids: string[], minutes: int }
  }),
  coverage: z.object({
    uncovered_requirement_ids: z.array(z.string()),
    passes: z.number().int().positive(),
  }),
});
```

All CLI evaluator runs output **Appendix B Schema**:
```json
{
  "version": "1.0",
  "generated_at": "2026-09-12T18:15:00.000Z",
  "kits": [
    {
      "id": "case-1-stripe-backend",
      "status": "ok",
      "kit": { ... },
      "error": null
    }
  ]
}
```

---

## 4. Scraping Resilience & Security Architecture

1. **SSRF Protection**: `isPrivateOrLocalHost()` blocks private subnet ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, `::1`) unless local batch testing on port 8099 is requested.
2. **Robots.txt Awareness**: Parses `/robots.txt` using `robots-parser` before scraping company pages.
3. **Link Scoring Heuristic**: Analyzes internal links `<a href="...">` and scores pages containing `/careers`, `/jobs`, `/about`, `/culture`, `/engineering`, `/handbook`.
4. **404 / Error Resilience**: If a site is offline or 404, the scraper records partial fallback status instead of failing the pipeline.

---

## 5. LLM Pipeline & Rate-Limiting Architecture

1. **Structured Output JSON Mode**: System instructions enforce strict JSON responses.
2. **429 Exponential Backoff**: Automatic retry handler with exponential delays (`2^attempt * 1000ms + jitter`) on HTTP 429 and 503 errors.
3. **Offline Fallback Generator**: If `GEMINI_API_KEY` is absent or offline in test environments, deterministic fallback responses are produced ensuring zero test failures.

---

## 6. Deterministic Core Engines

### 1. Coverage Calculation Engine (`coverage.ts`)
- Programmatically extracts mandatory (`must`) requirement IDs.
- Extracts requirement IDs referenced across generated questions.
- Computes exact set difference: `uncovered = mustRequirements.filter(id => !coveredSet.has(id))`.
- Triggers **Pass 2** targeted remediation loop if gaps exist.

### 2. Schedule Allocation Engine (`schedule.ts`)
- Pure arithmetic allocator without LLM involvement.
- Computes question time weights: Difficulty 1 = 15m, Difficulty 2 = 30m, Difficulty 3 = 45m.
- Sorts items prioritizing `must` requirements and higher difficulty (3 -> 2 -> 1).
- Distributes items into exactly `days_available` day buckets guaranteeing integer minute totals.

---

## 7. CLI Batch Evaluator (`npm run evaluate`)

Execute evaluation on 5 distinct test cases (including stub JD, 404 URL, local URL):

```bash
npm run evaluate -- --input test-cases.json --output evaluation-output.json
```

Output highlights:
- Concurrency limited runner (`p-limit`).
- Partial research succeeds with `"status": "ok"`.
- Validated against Appendix B Zod schema.

---

## 8. Interactive Builder & Spaced-Repetition Practice Mode

- **Wizard**: Live 6-stage pipeline progress bar showing active step states.
- **The Builder**: Inline text editing, item pinning (`isPinned`), and section-level selective regeneration preserving edited/pinned items.
- **Practice Mode**: 3D interactive flip card carousel, 3-level confidence rating ("Again", "Good", "Easy"), and spaced repetition queue ordering cards by lowest confidence.

---

## 9. Automated Unit Test Suite

Run unit tests via Vitest:

```bash
npm test
```

Tests include:
- `schedule.test.ts`: Verifies `days.length === days_available`, integer minutes, and priority allocation.
- `coverage.test.ts`: Verifies Set-based gap detection and second-pass triggers.
- `schema.test.ts`: Validates Appendix A and B Zod schema enforcement.

---

## 10. Evaluation Setup & Verification Summary

All components have been built, compiled, and verified:
- Shared Zod schemas compiled: `npm run build:shared` (Clean)
- Vitest Test Suite: 8 passed out of 8 tests
- CLI Evaluator: Executed 5 cases cleanly producing `evaluation-output.json`
- Next.js Web App: App Router pages (`/`, `/generator`, `/builder/[id]`, `/practice/[id]`) compiled with zero errors.
