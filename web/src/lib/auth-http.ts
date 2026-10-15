import { AuthError, SESSION_COOKIE } from "./auth.ts";

export const noStore = { "Cache-Control": "no-store" };

export function ensureAccountsEnabled(request: Request) {
  const hostname = new URL(request.url).hostname;
  const localDev = process.env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  if (!localDev && process.env.APOYO_ENABLE_ADULT_ACCOUNTS !== "true") {
    throw new AuthError(503, "Las cuentas están desactivadas en este entorno.");
  }
}

export function ensureSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  let originHost: string | null = null;
  try {
    if (origin) {
      const parsed = new URL(origin);
      if (parsed.protocol === new URL(request.url).protocol && parsed.origin === origin) originHost = parsed.host;
    }
  } catch { /* Invalid Origin is rejected below. */ }
  if (!originHost || originHost !== host || fetchSite === "cross-site") {
    throw new AuthError(403, "Origen no permitido.");
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new AuthError(415, "Se requiere JSON.");
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 4096) throw new AuthError(413, "Solicitud demasiado grande.");
  const body = await request.text();
  if (body.length > 4096) throw new AuthError(413, "Solicitud demasiado grande.");
  try { return JSON.parse(body) as unknown; }
  catch { throw new AuthError(400, "Solicitud no válida."); }
}

export function requestToken(request: Request): string | null {
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return pair?.slice(SESSION_COOKIE.length + 1) ?? null;
}

export function sessionCookie(token: string, request: Request, expire = false) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${expire ? "" : token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${expire ? 0 : 604800}${secure}`;
}

export function apiError(error: unknown) {
  if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status, headers: noStore });
  return Response.json({ error: "Error del servidor." }, { status: 500, headers: noStore });
}
