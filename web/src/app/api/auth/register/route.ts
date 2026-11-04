import { authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "@/lib/auth-http";
import { deliverEmailVerification, emailVerificationConfigured } from "@/lib/email-verification-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    if (!emailVerificationConfigured()) return Response.json({ error: "El envío de confirmación por correo aún no está configurado." }, { status: 503, headers: noStore });
    await authStore().requestRegistration(await readJson(request), deliverEmailVerification);
    return Response.json({ message: "Si podemos crear la cuenta, recibirás un correo para confirmarla." },
      { status: 202, headers: noStore });
  } catch (error) { return apiError(error); }
}
