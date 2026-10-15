import type { ExplanationProvider, ExplanationProviderInput } from "./explanation-service.ts";
import { openAIExplanationProvider } from "./explanation-openai.ts";

// La dirección y credencial son exclusivamente del servidor. Nunca provienen del navegador.
export const configuredExplanationProvider: ExplanationProvider = async (input: ExplanationProviderInput) => {
  if (process.env.OPENAI_API_KEY) return openAIExplanationProvider(input);
  const endpoint = process.env.APOYO_EXPLANATION_PROVIDER_URL;
  const token = process.env.APOYO_EXPLANATION_PROVIDER_TOKEN;
  if (!endpoint || !token) throw new Error("Explanation provider unavailable");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid provider URL");
  const response = await fetch(url, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      format: "approved-extract-v1", topicId: input.topicId, subskillId: input.subskillId,
      sourceVersion: input.sourceVersion, topicName: input.topicName,
      approvedText: { explanation: input.explanation, example: input.example },
      level: { gradeId: input.gradeId, vocabulary: input.level.vocabulary,
        depth: input.level.depth, maxExplanationWords: input.level.maxExplanationWords,
        maxExampleWords: input.level.maxExampleWords },
      exampleIndex: input.exampleIndex,
      instruction: "Choose literal contiguous excerpts from each approvedText field suitable for this grade. Respect word limits. Do not paraphrase or add facts.",
    }),
  });
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 8192) {
    throw new Error("Provider failed");
  }
  const raw = await response.text();
  if (raw.length > 8192) throw new Error("Provider response too large");
  return JSON.parse(raw) as unknown;
};
