import { AuthError } from "./auth.ts";

export function emailVerificationConfigured() {
  return !!(process.env.RESEND_API_KEY &&
    (process.env.APOYO_EMAIL_FROM || process.env.APOYO_RECOVERY_FROM) && process.env.APOYO_PUBLIC_URL);
}

export async function deliverEmailVerification(email: string, token: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.APOYO_EMAIL_FROM || process.env.APOYO_RECOVERY_FROM;
  const base = process.env.APOYO_PUBLIC_URL;
  if (!key || !from || !base) throw new AuthError(503, "El envío de confirmación por correo aún no está configurado.");
  let url: URL;
  try { url = new URL(base); }
  catch { throw new AuthError(503, "La URL pública de la aplicación no es válida."); }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV === "development" && url.hostname === "localhost")) {
    throw new AuthError(503, "La URL pública de confirmación debe usar HTTPS.");
  }
  const link = new URL("/verificar", url);
  // El fragmento no se envía al servidor en una petición GET ni queda en sus registros.
  link.hash = token;
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "Confirma tu correo en Apoyo académico",
        text: `Confirma tu correo para activar tu cuenta de estudiante mayor de edad. El enlace vence en 24 horas y solo se puede usar una vez: ${link.toString()}\n\nSi no solicitaste esta cuenta, ignora el mensaje.` }),
      cache: "no-store",
    });
  } catch { throw new AuthError(503, "No se pudo enviar el correo de confirmación."); }
  if (!response.ok) throw new AuthError(503, "No se pudo enviar el correo de confirmación.");
}
