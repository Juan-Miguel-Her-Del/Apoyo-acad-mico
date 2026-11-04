import { readFileSync } from "node:fs";
import { auditAiReviews } from "../src/lib/ai-quality-review.ts";

const filename = process.argv[2];
if (!filename) { console.error("Uso: npm run review:ai -- ruta/a/revisiones.json"); process.exitCode = 2; }
else {
  try {
    const records = JSON.parse(readFileSync(filename, "utf8"));
    const report = auditAiReviews(records);
    console.log(JSON.stringify(report, null, 2));
    if (!report.reviewGatePassed) process.exitCode = 1;
  } catch (error) { console.error(error instanceof Error ? error.message : "Archivo inválido."); process.exitCode = 2; }
}
