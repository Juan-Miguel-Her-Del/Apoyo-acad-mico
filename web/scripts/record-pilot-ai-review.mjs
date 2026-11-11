import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { auditAiReviews } from "../src/lib/ai-quality-review.ts";

const capturePath = process.argv[2] ?? "data/ai-quality-captures-v2.json";
const outputPath = process.argv[3] ?? "data/ai-quality-reviews-v2.json";
const capturedBytes = readFileSync(capturePath);
const sha256 = createHash("sha256").update(capturedBytes).digest("hex");
if (sha256 !== "662838997479b9fa452dd19af628b28807853112094c04ca6285c565bec81b8b") {
  throw new Error("La captura cambió. Vuelve a revisar cada salida antes de generar el registro.");
}
const captures = JSON.parse(capturedBytes.toString("utf8"));
const findings = {
  "G05-MAT-normal-v2": ["La suma 1/2 + 1/4 = 3/4 y la corrección de cuartos son correctas. La pista permite rehacer la operación.", "none", 4],
  "G05-MAT-wrong-answer-v2": ["El ejemplo 1/2 + 1/6 = 2/3 es correcto y la corrección local responde al error distinto 1/3 + 1/6 = 1/2.", "none", 4],
  "G05-MAT-boundary-v2": ["El segundo ejemplo es correcto y hasAnotherExample=false. La corrección se mantiene vinculada a la pregunta del intento, no al ejemplo alterno.", "none", 4],
  "G05-ESP-normal-v2": ["Explica planificación y redacción; la corrección del subtítulo es pertinente. Falta evaluación independiente del texto que escriba el estudiante.", "minor", 3],
  "G05-ESP-wrong-answer-v2": ["El ejemplo alterno sobre abejas y la corrección del subtítulo sobre reciclaje son coherentes; la actividad escrita sigue siendo de autoevaluación.", "minor", 3],
  "G05-ESP-boundary-v2": ["El último ejemplo no ofrece un tercero. La corrección del subtítulo es correcta, pero no demuestra por sí sola producción textual.", "minor", 3],
  "G10-MAT-normal-v2": ["El modelo h(t)=4+2·sen(2πt/10) corresponde a centro 4, amplitud 2, período 10 e inicio ascendente. Se explicita que los extremos no fijan la fase.", "none", 4],
  "G10-MAT-wrong-answer-v2": ["Centro 20 °C, amplitud 2 °C y período 24 h son correctos. La corrección local de la rueda responde a 12 s sin enviar la respuesta a Gemini.", "none", 4],
  "G10-MAT-boundary-v2": ["El último ejemplo no ofrece otro inexistente; conserva la advertencia correcta sobre la fase. El caso comprueba agotamiento de ejemplos.", "none", 4],
  "G10-ESP-normal-v2": ["Distingue tesis y razón en el ejemplo de biblioteca; la corrección identifica la tesis. La lectura crítica completa requiere textos y evidencia más complejos.", "minor", 3],
  "G10-ESP-wrong-answer-v2": ["El ejemplo de residuos reconoce una razón que aún requiere evidencia; la corrección de tesis es correcta. Sigue siendo un ejercicio introductorio.", "minor", 3],
  "G10-ESP-boundary-v2": ["Se agotan los ejemplos sin inventar otro. La corrección de la pregunta original es pertinente aunque el ejemplo alterno trate otro argumento.", "minor", 3],
  "G10-FIS-normal-v2": ["F=m×a y 2 kg×3 m/s²=6 N son correctos; la corrección conserva unidades. El caso evalúa cálculo, no todas las leyes de Newton.", "minor", 3],
  "G10-FIS-wrong-answer-v2": ["El ejemplo alterno 4 kg×2 m/s²=8 N es correcto y la corrección local de 2 kg×4 m/s² también da 8 N.", "none", 4],
  "G10-FIS-boundary-v2": ["El último ejemplo conserva F=ma y no promete otro; la corrección original 6 N sigue siendo correcta.", "none", 4],
  "G10-QUI-normal-v2": ["2 H₂ + O₂ → 2 H₂O conserva cuatro H y dos O a cada lado; la corrección identifica la ecuación balanceada.", "none", 4],
  "G10-QUI-wrong-answer-v2": ["N₂ + 3 H₂ → 2 NH₃ conserva dos N y seis H; H₂ + Cl₂ → 2 HCl se corrige con coeficiente 2.", "none", 4],
  "G10-QUI-boundary-v2": ["El segundo balanceo es correcto y no se ofrece un tercero; la corrección original mantiene las cantidades de átomos.", "none", 4],
};
const records = captures.filter((item) => item.kind !== "no-evidence").map((item) => {
  if (item.status !== "captured" || item.providerCalls !== 1 || !item.passedStructuralValidation) {
    throw new Error(`Captura inválida: ${item.caseId}`);
  }
  const assessment = findings[item.caseId];
  if (!assessment) throw new Error(`Falta revisión individual: ${item.caseId}`);
  const [finding, severity, clarity] = assessment;
  return {
    topicId: item.topicId, caseId: item.caseId, kind: item.kind,
    sourceVersion: item.sourceVersion, sourceStatus: "provisional",
    promptVersion: item.promptVersion, model: item.model,
    input: JSON.stringify({ scenario: item.scenario, providerInput: item.input }),
    output: JSON.stringify(item.output),
    reviewer: "Codex - revisión editorial interna; no humana ni docente",
    reviewedAt: new Date().toISOString(),
    scores: { accuracy: 4, gradeFit: item.topicId === "G10-ESP" ? 3 : 4,
      clarity, safety: 4, sourceFidelity: 2 },
    severity, decision: "block",
    findings: `${finding} Fuente curricular provisional; requiere revisión humana antes de publicar.`,
  };
});
if (records.length !== 18 || captures.filter((item) => item.kind === "no-evidence" &&
  item.status === "blocked" && item.providerCalls === 0).length !== 6) {
  throw new Error("Se requieren 18 salidas reales y seis bloqueos sin proveedor.");
}
const report = auditAiReviews(records);
if (report.invalid.length || report.reviewed !== 18 || report.reviewGatePassed) {
  throw new Error("La auditoría interna no coincide con el estado provisional esperado.");
}
writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Revisión interna: ${records.length} casos; seis bloqueos sin proveedor. Archivo: ${outputPath}`);
