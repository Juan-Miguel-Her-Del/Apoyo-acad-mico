import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json(await store.getLastSelection(user.id), { headers: noStore });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const selection = await store.saveLastSelection(user.id, await readJson(request));
    return Response.json({ selection }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
