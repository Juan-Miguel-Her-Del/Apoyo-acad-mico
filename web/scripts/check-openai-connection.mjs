import { openAIExplanationProvider } from "../src/lib/explanation-openai.ts";
import { explanationLevelForGrade } from "../src/lib/explanation-adaptation.ts";

const level = explanationLevelForGrade("G05");
if (!level) throw new Error("No se encontró el grado de prueba");

const input = {
  gradeId: "G05",
  subjectId: "MAT",
  topicId: "G05-MAT",
  topicName: "Fracciones de prueba",
  subskillId: "suma-fracciones-prueba",
  sourceVersion: "conexion-prueba-v1",
  explanation: "Para sumar fracciones con el mismo denominador, se suman los numeradores y se conserva el denominador. El denominador indica en cuántas partes iguales se divide la unidad.",
  example: "Un medio más un medio son dos medios, que equivalen a una unidad completa. Esta oración es solo material ficticio para comprobar la conexión.",
  reference: "Prueba técnica local; no es material aprobado",
  level,
  exampleIndex: 0,
};

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en el entorno del proceso.");
  process.exitCode = 1;
} else {
  const originalFetch = globalThis.fetch;
  let responseStatus;
  let responseCode;
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (String(args[0]) === "https://api.openai.com/v1/responses") {
      responseStatus = response.status;
      if (!response.ok) {
        const body = await response.clone().json().catch(() => null);
        const code = body?.error?.code ?? body?.error?.type;
        if (typeof code === "string" && /^[a-z0-9_]{1,60}$/i.test(code)) responseCode = code;
      }
    }
    return response;
  };
  try {
    const output = await openAIExplanationProvider(input);
    const valid = output && typeof output === "object" &&
      output.topicId === input.topicId && output.subskillId === input.subskillId &&
      output.sourceVersion === input.sourceVersion &&
      typeof output.explanation === "string" && input.explanation.includes(output.explanation) &&
      typeof output.example === "string" && input.example.includes(output.example);
    if (!valid) throw new Error("La respuesta no coincide con la fuente de prueba");
    console.log("OK: conexión real y extracción de fragmentos de prueba correctas.");
  } catch (error) {
    if (responseCode === "credit_balance_exhausted") {
      console.error("La clave funciona, pero la organización de OpenAI no tiene créditos disponibles para generar respuestas.");
      console.error("Añade créditos en la facturación de la API y vuelve a ejecutar esta prueba.");
    } else {
      console.error(`Falló la conexión de prueba: ${error instanceof Error ? error.message : "error desconocido"}`);
      if (responseStatus) console.error(`Respuesta de la API: HTTP ${responseStatus}${responseCode ? ` (${responseCode})` : ""}.`);
    }
    process.exitCode = 1;
  } finally {
    globalThis.fetch = originalFetch;
  }
}
