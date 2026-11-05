import { readFileSync, writeFileSync } from "node:fs";
import { auditAiReviews } from "../src/lib/ai-quality-review.ts";

const source = process.argv[2] ?? "data/ai-quality-captures.json";
const destination = process.argv[3] ?? "data/ai-quality-preaudit.json";
const captures = JSON.parse(readFileSync(source, "utf8"));
if (!Array.isArray(captures) || captures.length !== 18 ||
  captures.some((item) => item.status !== "captured" || !item.passedStructuralValidation)) {
  throw new Error("Se requieren 18 capturas reales estructuralmente válidas.");
}
const records = captures.map((item) => {
  const normal = captures.find((candidate) => candidate.topicId === item.topicId && candidate.kind === "normal");
  const identical = JSON.stringify(item.output) === JSON.stringify(normal?.output);
  const finding = item.kind === "wrong-answer"
    ? `La salida ${identical ? "es idéntica a" : "no usa la respuesta ficticia de"} la variante normal: el proveedor no recibe la respuesta del estudiante. No demuestra corrección personalizada.`
    : item.kind === "boundary"
      ? "Esta llamada directa produjo salida pese a que, sin evidencia suficiente, el producto debe bloquear la generación. Es una prueba del proveedor y no acredita el flujo completo."
      : "Los fragmentos coinciden literalmente con el borrador local; falta comprobar cobertura curricular y revisión independiente.";
  return { topicId: item.topicId, caseId: item.caseId, kind: item.kind,
    sourceVersion: item.sourceVersion, sourceStatus: "provisional",
    promptVersion: item.promptVersion, model: item.model,
    input: JSON.stringify({ scenario: item.scenario, providerInput: item.input }),
    output: JSON.stringify(item.output), reviewer: "Codex - preauditoría técnica, no docente",
    reviewedAt: new Date().toISOString(),
    scores: { accuracy: 3, gradeFit: 2, clarity: item.kind === "normal" ? 2 : 1,
      safety: 4, sourceFidelity: 4 },
    severity: item.kind === "normal" ? "minor" : "major", decision: "block",
    findings: finding };
});
writeFileSync(destination, `${JSON.stringify(records, null, 2)}\n`, "utf8");
const report = auditAiReviews(records);
console.log(JSON.stringify(report, null, 2));
console.log(`Preauditoría local: ${destination}`);
if (report.invalid.length || report.reviewed !== 18 || report.reviewGatePassed) process.exitCode = 1;
