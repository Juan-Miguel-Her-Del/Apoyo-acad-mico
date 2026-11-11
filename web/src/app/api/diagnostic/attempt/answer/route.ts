import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken } from "@/lib/auth-http";
import { diagnosticAttemptStore } from "@/lib/diagnostic-attempts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const user = await authStore().sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json(await diagnosticAttemptStore().answer(user.id, await readJson(request)), { headers: noStore });
  } catch (error) { return apiError(error); }
}
