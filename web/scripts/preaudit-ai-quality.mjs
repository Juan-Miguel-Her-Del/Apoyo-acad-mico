import { readFileSync, writeFileSync } from "node:fs";
import { auditAiReviews } from "../src/lib/ai-quality-review.ts";

const source = process.argv[2] ?? "data/ai-quality-captures-v2.json";
const destination = process.argv[3] ?? "data/ai-quality-preaudit-v2.json";
const captures = JSON.parse(readFileSync(source, "utf8"));
if (!Array.isArray(captures) || captures.length !== 24 ||
  captures.some((item) => !item.passedStructuralValidation ||
    (item.kind === "no-evidence" ? item.status !== "blocked" || item.providerCalls !== 0
      : item.status !== "captured" || item.providerCalls !== 1))) {
  throw new Error("Se requieren 18 respuestas reales válidas y 6 bloqueos sin llamada.");
}
const records = captures.filter((item) => item.kind !== "no-evidence").map((item) => {
  const finding = item.kind === "boundary"
    ? "La ruta entregó el último ejemplo y no ofreció un tercero inexistente; Gemini recibió solo el extracto curricular."
    : item.kind === "wrong-answer"
      ? "Gemini recibió solo texto curricular; la corrección específica salió del banco local. Falta aprobación curricular independiente."
      : "Extracto literal válido del borrador local; falta aprobación curricular independiente.";
  return { topicId: item.topicId, caseId: item.caseId, kind: item.kind,
    sourceVersion: item.sourceVersion, sourceStatus: "provisional",
    promptVersion: item.promptVersion, model: item.model,
    input: JSON.stringify({ scenario: item.scenario, providerInput: item.input }),
    output: JSON.stringify(item.output), reviewer: "Codex - preauditoría técnica, no docente",
    reviewedAt: new Date().toISOString(),
    scores: { accuracy: 3, gradeFit: 3, clarity: 3, safety: 4, sourceFidelity: 4 },
    severity: "minor", decision: "block",
    findings: finding };
});
writeFileSync(destination, `${JSON.stringify(records, null, 2)}\n`, "utf8");
const report = auditAiReviews(records);
console.log(JSON.stringify(report, null, 2));
console.log(`Preauditoría local: ${destination}`);
if (report.invalid.length || report.reviewed !== 18 || report.reviewGatePassed) process.exitCode = 1;
