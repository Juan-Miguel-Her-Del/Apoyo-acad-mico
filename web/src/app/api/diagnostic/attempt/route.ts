import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, noStore, requestToken } from "@/lib/auth-http";
import { diagnosticAttemptStore } from "@/lib/diagnostic-attempts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const user = await authStore().sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const params = new URL(request.url).searchParams;
    const store = diagnosticAttemptStore();
    const result = params.has("attemptId") ? await store.get(user.id, params.get("attemptId"))
      : await store.latestOpen(user.id, params.get("gradeId"), params.get("subjectId"), params.get("topicId"));
    return Response.json(result, { headers: noStore });
  } catch (error) { return apiError(error); }
}
