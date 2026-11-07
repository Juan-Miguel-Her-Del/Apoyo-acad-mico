import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, noStore, requestToken } from "@/lib/auth-http";
import { diagnosticAttemptStore } from "@/lib/diagnostic-attempts";

export const runtime = "nodejs";

export function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const user = authStore().sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const store = diagnosticAttemptStore();
    return Response.json({ items: store.list(user.id), comparisonItems: store.listComparisonSessions(user.id) },
      { headers: noStore });
  } catch (error) { return apiError(error); }
}
