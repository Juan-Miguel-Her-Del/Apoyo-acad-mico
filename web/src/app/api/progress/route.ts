import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json({ items: await store.listProgress(user.id) }, { headers: noStore });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const item = await store.saveProgress(user.id, await readJson(request));
    return Response.json({ item }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
