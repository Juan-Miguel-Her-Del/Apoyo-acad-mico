import { AuthError } from "./auth.ts";
import { apiError, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import type { ExplanationProvider } from "./explanation-service.ts";
import type { ExplanationReviewEvent } from "./explanation-review.ts";
import { provisionalExplanationInput, validateProvisionalExplanation } from "./provisional-explanation.ts";

export async function handleProvisionalExplanationRequest(request: Request, deps: {
  enabled: boolean;
  provider: ExplanationProvider;
  consumeQuota: () => boolean;
  evidence: (request: Request, attemptId: string, subskillId: string) => {
    gradeId: string; subjectId: string; topicId: string; subskillId: string; correction: string;
  } | null;
  review?: (event: ExplanationReviewEvent) => void;
}) {
  try {
    ensureSameOrigin(request);
    if (!deps.enabled) return Response.json({ error: "La explicación con IA no está disponible en esta instalación." }, { status: 503, headers: noStore });
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["gradeId", "subjectId", "topicId", "subskillId", "exampleIndex", "attemptId"].includes(key))) {
      throw new AuthError(400, "Solicitud no válida.");
    }
    const { gradeId, subjectId, topicId, subskillId, attemptId, exampleIndex = 0 } = body as Record<string, unknown>;
    if (![gradeId, subjectId, topicId, subskillId].every((value) => typeof value === "string" && value.length > 0 && value.length <= 120)) {
      throw new AuthError(400, "Selección no válida.");
    }
    if (!Number.isInteger(exampleIndex) || (exampleIndex !== 0 && exampleIndex !== 1)) {
      throw new AuthError(400, "Índice de ejemplo no válido.");
    }
    if (typeof attemptId !== "string" || !/^[0-9a-f]{32}$/.test(attemptId)) {
      throw new AuthError(400, "Intento no válido.");
    }
    const evidence = deps.evidence(request, attemptId, subskillId as string);
    if (!evidence || evidence.gradeId !== gradeId || evidence.subjectId !== subjectId ||
        evidence.topicId !== topicId || evidence.subskillId !== subskillId) {
      throw new AuthError(409, "El diagnóstico aún no ofrece evidencia suficiente para consultar la IA.");
    }
    const baseInput = provisionalExplanationInput(gradeId as string, subjectId as string, topicId as string, subskillId as string);
    if (!baseInput) throw new AuthError(400, "El subtema no pertenece a este diagnóstico de prueba.");
    const input = exampleIndex === 0 ? baseInput : provisionalExplanationInput(gradeId as string,
      subjectId as string, topicId as string, subskillId as string, 1);
    if (!input) throw new AuthError(409, "No hay otro ejemplo disponible para este subtema.");
    if (!deps.consumeQuota()) return Response.json({ error: "Límite de pruebas con IA alcanzado. Sigue con la explicación local." }, { status: 429, headers: noStore });
    let output: unknown;
    try { output = await deps.provider(input); }
    catch { return Response.json({ error: "Gemini no respondió. Puedes continuar con la explicación local." }, { status: 503, headers: noStore }); }
    const result = validateProvisionalExplanation(output, input);
    if (!result) {
      try {
        deps.review?.({ topicId: input.topicId, subskillId: input.subskillId,
          sourceVersion: input.sourceVersion, exampleIndex: input.exampleIndex,
          reason: "invalid_provider_response" });
      } catch {
        return Response.json({ error: "No pudimos registrar la revisión de la respuesta de Gemini. Continúa con la explicación local." },
          { status: 503, headers: noStore });
      }
      return Response.json({ error: "La respuesta de Gemini no pasó la comprobación. Continúa con la explicación local." }, { status: 503, headers: noStore });
    }
    return Response.json({ ...result, correction: evidence.correction }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
