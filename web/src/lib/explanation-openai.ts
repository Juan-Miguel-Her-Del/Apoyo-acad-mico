import type { ExplanationProviderInput } from "./explanation-service.ts";

type ModelResponse = {
  status?: string;
  output?: { type?: string; role?: string; content?: { type?: string; text?: string }[] }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topicId: { type: "string" },
    subskillId: { type: "string" },
    sourceVersion: { type: "string" },
    explanation: { type: "string" },
    example: { type: "string" },
  },
  required: ["topicId", "subskillId", "sourceVersion", "explanation", "example"],
} as const;

// El servidor solo envía texto curricular aprobado y los IDs del tema; nunca datos de cuenta.
// El resultado vuelve a pasar por validateGeneratedExplanation antes de mostrarse.
export async function openAIExplanationProvider(input: ExplanationProviderInput): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key unavailable");
  const model = process.env.APOYO_EXPLANATION_MODEL || "gpt-6-luna";
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(model)) throw new Error("Invalid OpenAI model");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model, store: false, max_output_tokens: 350,
      reasoning: { effort: "low" },
      instructions: "Extrae solo fragmentos literales contiguos de los campos explanation y example aprobados. No parafrasees ni agregues hechos. Devuelve los identificadores exactamente iguales a la entrada. Responde en JSON según el esquema.",
      input: JSON.stringify({
        topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
        topicName: input.topicName, approvedText: { explanation: input.explanation, example: input.example },
      }),
      text: { format: { type: "json_schema", name: "approved_explanation_extract", strict: true, schema } },
    }),
  });
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 8192) throw new Error("OpenAI unavailable");
  const raw = await response.text();
  if (raw.length > 8192) throw new Error("OpenAI response too large");
  const body = JSON.parse(raw) as ModelResponse;
  if (body.status !== "completed") throw new Error("OpenAI response incomplete");
  const parts = body.output?.filter((item) => item.type === "message" && item.role === "assistant")
    .flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text");
  if (parts?.length !== 1 || typeof parts[0].text !== "string") throw new Error("OpenAI response invalid");
  return JSON.parse(parts[0].text) as unknown;
}
