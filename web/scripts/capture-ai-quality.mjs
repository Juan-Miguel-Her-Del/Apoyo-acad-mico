import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { PILOT_TOPICS } from "../src/lib/ai-quality-review.ts";
import { provisionalExplanationInput, validateProvisionalExplanation } from "../src/lib/provisional-explanation.ts";
import { geminiExplanationProvider } from "../src/lib/explanation-gemini.ts";

if (!process.env.GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY.");
const filename = path.resolve(process.argv[2] ?? "data/ai-quality-captures.json");
mkdirSync(path.dirname(filename), { recursive: true });
let captures = [];
try { captures = JSON.parse(readFileSync(filename, "utf8")); }
catch (error) { if (error?.code !== "ENOENT") throw error; }
if (!Array.isArray(captures)) throw new Error("El archivo de capturas no es una lista.");

const scenarios = ["normal", "wrong-answer", "boundary"];
for (const topicId of PILOT_TOPICS) {
  const gradeId = topicId.slice(0, 3);
  const subjectId = topicId.slice(4);
  const diagnostic = getDiagnostic(gradeId, subjectId, topicId, "demo");
  if (diagnostic.status !== 200 || !diagnostic.questions.length) throw new Error(`Falta diagnóstico: ${topicId}`);
  const question = diagnostic.questions[0];
  for (const [index, kind] of scenarios.entries()) {
    const caseId = `${topicId}-${kind}`;
    if (captures.some((item) => item.caseId === caseId && item.status === "captured")) continue;
    const input = provisionalExplanationInput(gradeId, subjectId, topicId, question.skill);
    if (!input) throw new Error(`Falta fuente provisional: ${caseId}`);
    input.exampleIndex = index;
    // Las respuestas del diagnóstico no se transmiten al proveedor en el producto.
    // La captura permite evaluar esta limitación sin enviar datos de estudiantes.
    const scenario = kind === "wrong-answer"
      ? "Dos respuestas diagnósticas ficticias erróneas activan esta habilidad; el proveedor solo ve la habilidad."
      : kind === "boundary"
        ? "Caso límite: sin evidencia suficiente el producto debe bloquear la llamada; esta salida directa mide el proveedor, no el flujo publicado."
        : "Selección válida y fuente provisional local.";
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const output = await geminiExplanationProvider(input);
        result = { caseId, topicId, kind, scenario, providerSawScenario: false,
          sourceVersion: input.sourceVersion, promptVersion: "gemini-literal-extract-v1",
          model: process.env.APOYO_GEMINI_MODEL || "gemini-3.5-flash-lite",
          capturedAt: new Date().toISOString(), status: "captured",
          input: { gradeId, subjectId, topicId, subskillId: question.skill,
            explanation: input.explanation, example: input.example, exampleIndex: index },
          output, passedStructuralValidation: !!validateProvisionalExplanation(output, input) };
        break;
      } catch (error) {
        if (attempt === 3) result = { caseId, topicId, kind, scenario,
          capturedAt: new Date().toISOString(), status: "error",
          error: error instanceof Error ? error.message : "Error desconocido" };
        else await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    captures = captures.filter((item) => item.caseId !== caseId);
    captures.push(result);
    writeFileSync(filename, `${JSON.stringify(captures, null, 2)}\n`, "utf8");
    console.log(`${caseId}: ${result.status}${result.status === "captured" ? result.passedStructuralValidation ? " (estructura válida)" : " (estructura inválida)" : ""}`);
  }
}
const successful = captures.filter((item) => item.status === "captured").length;
console.log(`Capturas reales: ${successful}/18. Archivo local: ${filename}`);
if (successful < 18) process.exitCode = 1;
