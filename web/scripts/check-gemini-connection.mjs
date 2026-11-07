import { geminiExplanationProvider } from "../src/lib/explanation-gemini.ts";
import { explanationLevelForGrade } from "../src/lib/explanation-adaptation.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { provisionalExplanationInput } from "../src/lib/provisional-explanation.ts";

const level = explanationLevelForGrade("G05");
if (!level) throw new Error("No se encontró el grado de prueba");

const fixtureInput = {
  gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT",
  topicName: "Fracciones de prueba", subskillId: "suma-fracciones-prueba",
  sourceVersion: "conexion-prueba-v1",
  explanation: "Para sumar fracciones con el mismo denominador, se suman los numeradores y se conserva el denominador. El denominador indica en cuántas partes iguales se divide la unidad.",
  example: "Un medio más un medio son dos medios, que equivalen a una unidad completa. Esta oración es solo material ficticio para comprobar la conexión.",
  reference: "Prueba técnica local; no es material aprobado", level, exampleIndex: 0,
};
const alternate = process.argv.includes("--alternate");
const firstSkill = getDiagnostic("G05", "MAT", "G05-MAT", "demo").questions[0].skill;
const input = alternate
  ? provisionalExplanationInput("G05", "MAT", "G05-MAT", firstSkill, 1)
  : fixtureInput;
if (!input) throw new Error("No se encontró el segundo ejemplo provisional de prueba");

if (!process.env.GEMINI_API_KEY) {
  console.error("Falta GEMINI_API_KEY en web/.env.local.");
  process.exitCode = 1;
} else {
  const originalFetch = globalThis.fetch;
  let responseStatus;
  let providerError;
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (String(args[0]) === "https://generativelanguage.googleapis.com/v1beta/interactions") {
      responseStatus = response.status;
      if (!response.ok) {
        const body = await response.clone().json().catch(() => null);
        const details = body?.error;
        if (details && typeof details === "object") {
          providerError = [details.status, details.code,
            typeof details.message === "string" ? details.message.replaceAll(process.env.GEMINI_API_KEY, "[clave oculta]").slice(0, 300) : null]
            .filter((value) => value !== undefined && value !== null).join(" · ");
        }
      }
    }
    return response;
  };
  try {
    const output = await geminiExplanationProvider(input);
    const valid = output && typeof output === "object" &&
      output.topicId === input.topicId && output.subskillId === input.subskillId &&
      output.sourceVersion === input.sourceVersion &&
      typeof output.explanation === "string" && input.explanation.includes(output.explanation) &&
      typeof output.example === "string" && input.example.includes(output.example);
    if (!valid) throw new Error("La respuesta no coincide con la fuente de prueba");
    console.log(alternate
      ? "OK: Gemini respondió con un segundo ejemplo provisional válido."
      : "OK: Gemini respondió con fragmentos de prueba válidos.");
  } catch (error) {
    console.error(`Falló la prueba de Gemini: ${error instanceof Error ? error.message : "error desconocido"}`);
    if (responseStatus) console.error(`Respuesta de la API: HTTP ${responseStatus}.`);
    if (providerError) console.error(`Detalle de la API: ${providerError}`);
    if (!responseStatus && error instanceof Error && error.cause && typeof error.cause === "object" && "code" in error.cause) {
      console.error(`Causa de red: ${String(error.cause.code)}`);
    }
    process.exitCode = 1;
  } finally {
    globalThis.fetch = originalFetch;
  }
}
