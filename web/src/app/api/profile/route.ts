import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json({ profile: await store.getProfile(user.id) }, { headers: noStore });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json({ profile: await store.saveProfile(user.id, await readJson(request)) }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
