import { authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    await authStore().resetPassword(await readJson(request));
    return Response.json({ message: "Contraseña actualizada. Inicia sesión de nuevo." }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
