import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, noStore, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    return Response.json(await store.getPracticeSession(user.id, sessionId), { headers: noStore });
  } catch (error) { return apiError(error); }
}
