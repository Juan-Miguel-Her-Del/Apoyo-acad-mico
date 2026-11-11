import { AuthError, authStore } from "@/lib/auth";
import { apiError, ensureAccountsEnabled, noStore, requestToken } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    ensureAccountsEnabled(request);
    const store = authStore();
    const user = await store.sessionUser(requestToken(request));
    if (!user) throw new AuthError(401, "Sesión requerida.");
    return Response.json({ items: await store.listPracticeSessions(user.id),
      comparisonItems: await store.listPracticeComparisonSessions(user.id),
      skillTotals: await store.listPracticeSkillTotals(user.id) }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
