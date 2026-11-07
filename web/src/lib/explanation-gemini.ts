import type { ExplanationProviderInput } from "./explanation-service.ts";

type GeminiInteraction = {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
};

const schema = {
  type: "object",
  properties: {
    topicId: { type: "string" },
    subskillId: { type: "string" },
    sourceVersion: { type: "string" },
    explanation: { type: "string" },
    example: { type: "string" },
  },
  required: ["topicId", "subskillId", "sourceVersion", "explanation", "example"],
} as const;

// Solo recibe texto académico aprobado e identificadores curriculares; no datos de cuenta.
// La salida vuelve a pasar por validateGeneratedExplanation antes de mostrarse.
export async function geminiExplanationProvider(input: ExplanationProviderInput): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key unavailable");
  const model = process.env.APOYO_GEMINI_MODEL || "gemini-3.5-flash-lite";
  if (!/^gemini-[a-zA-Z0-9._-]{1,70}$/.test(model)) throw new Error("Invalid Gemini model");

  const request = {
    method: "POST", cache: "no-store" as const,
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model, store: false,
      system_instruction: input.sourceStatus === "provisional"
        ? "Esta fuente es un borrador educativo no revisado. Para el subtema solicitado, extrae solo fragmentos literales contiguos de explanation y example, adecuados para el grado y dentro de los límites de palabras. No parafrasees, no agregues hechos y no afirmes que el material está aprobado. Devuelve los identificadores exactamente iguales a la entrada."
        : "Extrae solo fragmentos literales contiguos de explanation y example revisados, adecuados para el grado y dentro de los límites de palabras. No parafrasees ni agregues hechos. Devuelve los identificadores exactamente iguales a la entrada.",
      input: JSON.stringify({
        topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
        sourceStatus: input.sourceStatus ?? "reviewed",
        topicName: input.topicName, approvedText: { explanation: input.explanation, example: input.example },
        level: { gradeId: input.gradeId, vocabulary: input.level.vocabulary,
          depth: input.level.depth, maxExplanationWords: input.level.maxExplanationWords,
          maxExampleWords: input.level.maxExampleWords }, exampleIndex: input.exampleIndex,
      }),
      response_format: { type: "text", mime_type: "application/json", schema },
    }),
  };
  let response: Response | undefined;
  // Un 503 indica indisponibilidad temporal del proveedor. Los reintentos son
  // acotados para no bloquear demasiado tiempo la explicación local.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      ...request, signal: AbortSignal.timeout(12000),
    });
    if (response.status !== 503 || attempt === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
  }
  if (!response) throw new Error("Gemini unavailable");
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 8192) throw new Error("Gemini unavailable");
  const raw = await response.text();
  if (raw.length > 8192) throw new Error("Gemini response too large");
  const body = JSON.parse(raw) as GeminiInteraction;
  if (body.status !== "completed") throw new Error("Gemini response incomplete");
  const parts = body.steps?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? []).filter((part) => part.type === "text");
  if (parts?.length !== 1 || typeof parts[0].text !== "string") throw new Error("Gemini response invalid");
  return JSON.parse(parts[0].text) as unknown;
}
