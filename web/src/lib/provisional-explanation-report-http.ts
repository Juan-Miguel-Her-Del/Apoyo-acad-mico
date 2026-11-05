import { AuthError } from "./auth.ts";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import { provisionalExplanationInput } from "./provisional-explanation.ts";
import type { ExplanationReviewEvent } from "./explanation-review.ts";

const reasons = ["inaccurate", "confusing", "inappropriate"] as const;
type ReportReason = typeof reasons[number];

export async function handleProvisionalExplanationReport(request: Request, deps: {
  authenticated: (request: Request) => boolean;
  record: (event: ExplanationReviewEvent) => void;
}) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    if (!deps.authenticated(request)) throw new AuthError(401, "Inicia sesión para enviar el reporte.");
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["gradeId", "subjectId", "topicId", "subskillId", "sourceVersion", "reason"].includes(key))) {
      throw new AuthError(400, "Reporte no válido.");
    }
    const { gradeId, subjectId, topicId, subskillId, sourceVersion, reason } = body as Record<string, unknown>;
    if (typeof gradeId !== "string" || typeof subjectId !== "string" ||
      typeof topicId !== "string" || typeof subskillId !== "string" ||
      sourceVersion !== "study-draft-v1" || !reasons.includes(reason as ReportReason) ||
      !provisionalExplanationInput(gradeId, subjectId, topicId, subskillId)) {
      throw new AuthError(400, "Reporte no válido.");
    }
    deps.record({ topicId, subskillId, sourceVersion, exampleIndex: 0,
      reason: `reported_${reason as ReportReason}` });
    return Response.json({ message: "Gracias. Ocultamos esta respuesta y registramos el problema para revisión." }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
