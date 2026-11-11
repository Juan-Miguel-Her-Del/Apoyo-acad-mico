import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    const input = await readJson(request);
    await store.assertCurrentGrade(user.id, (input as Record<string, unknown> | null)?.gradeId);
    return Response.json(await store.startPractice(user.id, input), { status: 201, headers: noStore });
  } catch (error) { return apiError(error); }
}
