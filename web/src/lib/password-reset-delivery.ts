import { AuthError } from "./auth.ts";

export function recoveryConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.APOYO_RECOVERY_FROM && process.env.APOYO_PUBLIC_URL);
}

export async function deliverPasswordReset(email: string, token: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.APOYO_RECOVERY_FROM;
  const base = process.env.APOYO_PUBLIC_URL;
  if (!key || !from || !base) throw new AuthError(503, "La recuperación por correo aún no está configurada.");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV === "development" && url.hostname === "localhost")) {
    throw new AuthError(503, "La URL pública de recuperación debe usar HTTPS.");
  }
  const link = new URL("/recuperar", url);
  // El fragmento no se envía al servidor ni aparece en los registros HTTP.
  link.hash = token;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Restablecer contraseña de Apoyo académico",
      text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta de Apoyo académico. Abre este enlace durante los próximos 30 minutos: ${link.toString()}\n\nSi no hiciste la solicitud, ignora este correo.` }),
    cache: "no-store",
  });
  if (!response.ok) throw new AuthError(503, "No se pudo enviar el correo de recuperación.");
}
