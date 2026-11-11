import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getAdaptiveDiagnosticBank } from "../src/lib/diagnostic-adaptive.ts";
import { PILOT_TOPICS } from "../src/lib/ai-quality-review.ts";
import { provisionalExplanationInput, validateProvisionalExplanation } from "../src/lib/provisional-explanation.ts";
import { handleProvisionalExplanationRequest } from "../src/lib/provisional-explanation-http.ts";
import { geminiExplanationProvider } from "../src/lib/explanation-gemini.ts";

if (!process.env.GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY.");
const filename = path.resolve(process.argv[2] ?? "data/ai-quality-captures-v2.json");
mkdirSync(path.dirname(filename), { recursive: true });
let captures = [];
try { captures = JSON.parse(readFileSync(filename, "utf8")); }
catch (error) { if (error?.code !== "ENOENT") throw error; }
if (!Array.isArray(captures)) throw new Error("El archivo de capturas no es una lista.");

function correction(question) {
  const correct = question.options.find((option) => option.id === question.correctOptionId);
  if (!correct) throw new Error(`Clave incompleta: ${question.id}`);
  return `En «${question.prompt}», la respuesta de referencia es «${correct.text}». ${question.explanation}`;
}

for (const topicId of PILOT_TOPICS) {
  const gradeId = topicId.slice(0, 3);
  const subjectId = topicId.slice(4);
  const bank = getAdaptiveDiagnosticBank(gradeId, subjectId, topicId);
  if (!bank?.length) throw new Error(`Falta banco diagnóstico: ${topicId}`);
  const subskillId = bank.find((question) => bank.filter((item) => item.skill === question.skill).length >= 2)?.skill;
  if (!subskillId) throw new Error(`Falta un subtema con dos preguntas: ${topicId}`);
  const sameSkill = bank.filter((question) => question.skill === subskillId);
  if (sameSkill.length < 2) throw new Error(`Faltan dos preguntas del subtema: ${topicId}:${subskillId}`);
  for (const kind of ["normal", "wrong-answer", "boundary", "no-evidence"]) {
    const caseId = `${topicId}-${kind}-v2`;
    if (captures.some((item) => item.caseId === caseId &&
      item.status === (kind === "no-evidence" ? "blocked" : "captured"))) continue;
    const exampleIndex = kind === "wrong-answer" || kind === "boundary" ? 1 : 0;
    const input = provisionalExplanationInput(gradeId, subjectId, topicId, subskillId, exampleIndex);
    if (!input) throw new Error(`Falta fuente provisional: ${caseId}`);
    const syntheticCorrection = correction(sameSkill[kind === "wrong-answer" ? 1 : 0]);
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      let providerCalls = 0;
      let providerOutput;
      try {
        const request = new Request("http://localhost:3000/api/explanation/provisional", {
          method: "POST", headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
          body: JSON.stringify({ gradeId, subjectId, topicId, subskillId,
            attemptId: "a".repeat(32), exampleIndex }),
        });
        const response = await handleProvisionalExplanationRequest(request, {
          enabled: true, consumeQuota: () => true,
          evidence: () => kind === "no-evidence" ? null : { gradeId, subjectId, topicId, subskillId,
            correction: syntheticCorrection },
          provider: async (source) => {
            providerCalls += 1;
            providerOutput = await geminiExplanationProvider(source);
            return providerOutput;
          },
        });
        const output = await response.json();
        if (kind === "no-evidence" ? response.status !== 409 || providerCalls !== 0
          : response.status !== 200 || providerCalls !== 1 ||
            !validateProvisionalExplanation(providerOutput, input) || output.correction !== syntheticCorrection) {
          throw new Error(`Resultado inesperado: HTTP ${response.status}, llamadas ${providerCalls}`);
        }
        result = { caseId, topicId, kind, scenario: kind === "no-evidence"
          ? "Diagnóstico ficticio sin evidencia suficiente; no debe llamar a Gemini."
          : kind === "boundary" ? "Último ejemplo disponible de la fuente; no debe ofrecer un tercero inexistente."
          : kind === "wrong-answer" ? "Segundo error ficticio del mismo subtema; corrección local distinta."
            : "Primer error ficticio del mismo subtema tras completar el diagnóstico.",
          sourceVersion: input.sourceVersion, sourceStatus: "provisional",
          promptVersion: "gemini-literal-extract-v1+local-correction-v2",
          model: process.env.APOYO_GEMINI_MODEL || "gemini-3.5-flash-lite",
          capturedAt: new Date().toISOString(), status: kind === "no-evidence" ? "blocked" : "captured",
          input: { gradeId, subjectId, topicId, subskillId,
            explanation: input.explanation, example: input.example, exampleIndex },
          output, providerOutput, providerCalls,
          passedStructuralValidation: kind === "no-evidence" || !!validateProvisionalExplanation(providerOutput, input) };
        break;
      } catch (error) {
        if (attempt === 3) result = { caseId, topicId, kind, capturedAt: new Date().toISOString(),
          status: "error", error: error instanceof Error ? error.message : "Error desconocido" };
        else await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    captures = captures.filter((item) => item.caseId !== caseId);
    captures.push(result);
    writeFileSync(filename, `${JSON.stringify(captures, null, 2)}\n`, "utf8");
    console.log(`${caseId}: ${result.status}`);
  }
}
const valid = captures.filter((item) => item.status === "captured" || item.status === "blocked");
console.log(`Casos completos: ${valid.length}/24; llamadas reales a Gemini: ${valid.reduce((sum, item) => sum + item.providerCalls, 0)}. Archivo: ${filename}`);
if (valid.length !== 24) process.exitCode = 1;
