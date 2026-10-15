import { AuthError } from "./auth.ts";
import { apiError, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import { openStudentAccountStore, StudentAccountError,
  type ReviewedConsentPolicy, type VerifiedAuthorization } from "./student-accounts.ts";

type StudentStore = Pick<ReturnType<typeof openStudentAccountStore>, "registerAuthorized" | "close">;
export type StudentRegistrationDependencies = {
  reviewedPolicy: ReviewedConsentPolicy | null;
  verifyRepresentative: ((proof: string) => Promise<VerifiedAuthorization | null>) | null;
  openStore: (policy: ReviewedConsentPolicy) => StudentStore;
};

export async function handleStudentRegistration(request: Request, deps: StudentRegistrationDependencies) {
  try {
    ensureSameOrigin(request);
    // Both dependencies are supplied by reviewed server code, never by JSON or an env toggle.
    if (!deps.reviewedPolicy || !deps.verifyRepresentative) {
      throw new StudentAccountError(503, "El registro de estudiantes aún no está disponible.");
    }
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["email", "password", "authorizationProof"].includes(key))) {
      throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
    }
    const data = body as Record<string, unknown>;
    if (typeof data.authorizationProof !== "string" || data.authorizationProof.length < 1 ||
        data.authorizationProof.length > 2048) throw new StudentAccountError(403, "Autorización requerida.");
    let grant: VerifiedAuthorization | null;
    try { grant = await deps.verifyRepresentative(data.authorizationProof); }
    catch { throw new StudentAccountError(503, "No pudimos verificar la autorización. Inténtalo de nuevo más tarde."); }
    if (!grant) throw new StudentAccountError(403, "Autorización requerida.");
    const store = deps.openStore(deps.reviewedPolicy);
    try {
      await store.registerAuthorized({ email: data.email, password: data.password }, grant);
      return Response.json({ created: true }, { status: 201, headers: noStore });
    } finally { store.close(); }
  } catch (error) {
    if (error instanceof StudentAccountError) {
      return Response.json({ error: error.message }, { status: error.status, headers: noStore });
    }
    if (error instanceof AuthError) return apiError(error);
    return Response.json({ error: "No pudimos crear la cuenta. Inténtalo de nuevo más tarde." },
      { status: 503, headers: noStore });
  }
}
