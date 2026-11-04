import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "@/lib/auth-http";
import { deliverPasswordReset, recoveryConfigured } from "@/lib/password-reset-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    if (!recoveryConfigured()) return Response.json({ error: "La recuperación por correo aún no está configurada." }, { status: 503, headers: noStore });
    const body = await readJson(request);
    try { await authStore().requestPasswordReset(body, deliverPasswordReset); }
    catch (error) { if (error instanceof AuthError && error.status === 400) throw error;
      // La respuesta no revela si existía la cuenta o si falló el proveedor.
    }
    return Response.json({ message: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña." }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
