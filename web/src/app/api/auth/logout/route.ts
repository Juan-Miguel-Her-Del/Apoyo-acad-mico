import { authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, requestToken, sessionCookie } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    await authStore().logout(requestToken(request));
    return Response.json({ ok: true }, {
      headers: { ...noStore, "Set-Cookie": sessionCookie("", request, true) },
    });
  } catch (error) { return apiError(error); }
}
