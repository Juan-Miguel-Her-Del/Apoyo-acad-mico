import { authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, noStore, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const user = authStore().sessionUser(requestToken(request));
    return Response.json({ user }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
