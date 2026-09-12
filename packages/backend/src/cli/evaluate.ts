import fs from "fs";
import path from "path";
import pLimit from "p-limit";
import { EvaluationCase, BatchOutput, BatchKitResult, BatchOutputSchema } from "@ai-interview-prep/shared";
import { generatePrepKit } from "../services/pipeline";

async function main() {
  const args = process.argv.slice(2);
  let inputPath = "test-cases.json";
  let outputPath = "evaluation-output.json";

  const positionalArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--input" || args[i] === "-i") && args[i + 1]) {
      inputPath = args[i + 1];
      i++;
    } else if ((args[i] === "--output" || args[i] === "-o") && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith("-")) {
      positionalArgs.push(args[i]);
    }
  }

  if (positionalArgs.length >= 1 && inputPath === "test-cases.json") {
    inputPath = positionalArgs[0];
  }
  if (positionalArgs.length >= 2 && outputPath === "evaluation-output.json") {
    outputPath = positionalArgs[1];
  }

  // Resolve input path trying current working directory first, then monorepo root fallback
  let resolvedInputPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedInputPath)) {
    const rootFallback = path.resolve(__dirname, "../../../", inputPath);
    if (fs.existsSync(rootFallback)) {
      resolvedInputPath = rootFallback;
    }
  }

  let resolvedOutputPath = path.resolve(process.cwd(), outputPath);
  if (!fs.existsSync(path.dirname(resolvedOutputPath))) {
    resolvedOutputPath = path.resolve(__dirname, "../../../", outputPath);
  }

  console.log(`[CLI Evaluator] Reading input cases from: ${resolvedInputPath}`);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`[CLI Evaluator] Error: Input file not found at ${resolvedInputPath}`);
    process.exit(1);
  }

  const rawInput = fs.readFileSync(resolvedInputPath, "utf-8");
  const cases: EvaluationCase[] = JSON.parse(rawInput);

  console.log(`[CLI Evaluator] Loaded ${cases.length} evaluation cases.`);

  // Limit concurrency to 2 parallel tasks to protect API rate limits
  const limit = pLimit(2);
  const kitResults: BatchKitResult[] = [];

  const tasks = cases.map((testCase, index) =>
    limit(async () => {
      console.log(`\n[CLI Evaluator] [Case ${index + 1}/${cases.length}] Starting ID: "${testCase.id}" (${testCase.company} - ${testCase.role})...`);

      try {
        const kit = await generatePrepKit({
          company: testCase.company,
          company_url: testCase.company_url,
          role: testCase.role,
          jd_text: testCase.jd_text,
          days_available: testCase.days_available || 7,
          onProgress: (p) => {
            console.log(`  └─ [${testCase.id}] Step ${p.step}/6 [${p.stage}]: ${p.detail}`);
          },
        });

        console.log(`  ✔ [${testCase.id}] Successfully generated Kit (Passes: ${kit.coverage.passes}, Uncovered: ${kit.coverage.uncovered_requirement_ids.length})`);

        return {
          id: testCase.id,
          status: "ok" as const,
          kit,
          error: null,
        };
      } catch (err: any) {
        console.error(`  ✖ [${testCase.id}] Case execution failed: ${err.message}`);
        return {
          id: testCase.id,
          status: "failed" as const,
          kit: null,
          error: err.message || "Unknown pipeline execution error",
        };
      }
    })
  );

  const results = await Promise.all(tasks);
  kitResults.push(...results);

  const batchOutput: BatchOutput = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits: kitResults,
  };

  // Validate output against Appendix B Zod schema
  const validation = BatchOutputSchema.safeParse(batchOutput);
  if (!validation.success) {
    console.warn("[CLI Evaluator] Warning: Batch output validation failed:", validation.error.format());
  } else {
    console.log("[CLI Evaluator] Batch output passed Appendix B Zod Schema validation!");
  }

  fs.writeFileSync(resolvedOutputPath, JSON.stringify(batchOutput, null, 2), "utf-8");
  console.log(`\n[CLI Evaluator] Evaluation completed! Saved results to ${resolvedOutputPath}`);
}

main().catch((err) => {
  console.error("[CLI Evaluator] Fatal error:", err);
  process.exit(1);
});
