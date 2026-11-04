import { authStore, AuthError } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken, sessionCookie } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const user = authStore().sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Inicia sesión para eliminar tu cuenta.");
    await authStore().deleteOwnAccount(user.id, await readJson(request));
    return Response.json({ message: "Cuenta eliminada." }, {
      headers: { ...noStore, "Set-Cookie": sessionCookie("", request, true) },
    });
  } catch (error) { return apiError(error); }
}
