import { AuthError } from "./auth.ts";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import type { Topic } from "./catalog.ts";
import type { ReviewedExplanationSource } from "./explanation-context.ts";
import { ExplanationError, generateExplanation, type ExplanationAttempt, type ExplanationProvider } from "./explanation-service.ts";

export type ExplanationDependencies = {
  userId: (request: Request) => string | null;
  attempt: (userId: string, attemptId: string) => ExplanationAttempt;
  source: (topicId: string, subskillId: string) => ReviewedExplanationSource | undefined;
  provider: ExplanationProvider;
  catalog?: readonly Topic[];
};

export async function handleExplanationRequest(request: Request, deps: ExplanationDependencies) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const userId = deps.userId(request);
    if (!userId) throw new AuthError(401, "Sesión requerida.");
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["attemptId", "subskillId"].includes(key))) {
      throw new AuthError(400, "Solicitud no válida.");
    }
    const { attemptId, subskillId } = body as Record<string, unknown>;
    if (typeof attemptId !== "string" || !/^[0-9a-f]{32}$/.test(attemptId) ||
        typeof subskillId !== "string" || subskillId.length < 1 || subskillId.length > 120) {
      throw new AuthError(400, "Solicitud no válida.");
    }
    const attempt = deps.attempt(userId, attemptId);
    const source = deps.source(attempt.attempt.topicId, subskillId);
    const result = await generateExplanation({ attempt, subskillId, source, provider: deps.provider, catalog: deps.catalog });
    return Response.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof ExplanationError) {
      return Response.json({ error: error.message, code: error.code, retryable: error.retryable },
        { status: error.status, headers: noStore });
    }
    return apiError(error);
  }
}
