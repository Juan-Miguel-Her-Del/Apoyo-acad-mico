import { authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, sessionCookie } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const result = authStore().verifyRegistration(await readJson(request));
    return Response.json({ user: result.user }, {
      headers: { ...noStore, "Set-Cookie": sessionCookie(result.token, request) },
    });
  } catch (error) { return apiError(error); }
}
