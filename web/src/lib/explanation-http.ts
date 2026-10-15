import { AuthError } from "./auth.ts";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import type { Topic } from "./catalog.ts";
import type { ReviewedExplanationSource } from "./explanation-context.ts";
import { ExplanationError, generateExplanation, type ExplanationAttempt, type ExplanationProvider } from "./explanation-service.ts";
import type { ExplanationReviewEvent } from "./explanation-review.ts";

export type ExplanationDependencies = {
  userId: (request: Request) => string | null;
  attempt: (userId: string, attemptId: string) => ExplanationAttempt;
  source: (topicId: string, subskillId: string) => ReviewedExplanationSource | undefined;
  provider: ExplanationProvider;
  catalog?: readonly Topic[];
  review?: (event: ExplanationReviewEvent) => void;
};

export async function handleExplanationRequest(request: Request, deps: ExplanationDependencies) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const userId = deps.userId(request);
    if (!userId) throw new AuthError(401, "Sesión requerida.");
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["attemptId", "subskillId", "exampleIndex"].includes(key))) {
      throw new AuthError(400, "Solicitud no válida.");
    }
    const { attemptId, subskillId, exampleIndex } = body as Record<string, unknown>;
    if (typeof attemptId !== "string" || !/^[0-9a-f]{32}$/.test(attemptId) ||
        typeof subskillId !== "string" || subskillId.length < 1 || subskillId.length > 120 ||
        (exampleIndex !== undefined && exampleIndex !== 0 && exampleIndex !== 1)) {
      throw new AuthError(400, "Solicitud no válida.");
    }
    const attempt = deps.attempt(userId, attemptId);
    const source = deps.source(attempt.attempt.topicId, subskillId);
    let result;
    try {
      result = await generateExplanation({ attempt, subskillId, source, provider: deps.provider,
        catalog: deps.catalog, exampleIndex: exampleIndex as number | undefined });
    } catch (error) {
      if (error instanceof ExplanationError &&
          (error.code === "invalid_provider_response" || error.code === "duplicate_example") && source) {
        try {
          deps.review?.({ topicId: attempt.attempt.topicId, subskillId,
            sourceVersion: source.version, exampleIndex: (exampleIndex as number | undefined) ?? 0,
            reason: error.code });
        } catch {
          throw new ExplanationError(503, "review_log_unavailable", "No pudimos guardar la revisión del ejemplo. Inténtalo después.");
        }
      }
      throw error;
    }
    return Response.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof ExplanationError) {
      return Response.json({ error: error.message, code: error.code, retryable: error.retryable },
        { status: error.status, headers: noStore });
    }
    return apiError(error);
  }
}
