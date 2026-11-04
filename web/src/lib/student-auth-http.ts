import { AuthError } from "./auth.ts";
import { ensureSameOrigin, readJson } from "./auth-http.ts";
import { StudentAccountError, type openStudentAccountStore } from "./student-accounts.ts";

const COOKIE = "apoyo_student_session";
const NO_STORE = { "Cache-Control": "no-store" };
const UNAVAILABLE = "Las cuentas de menores aún no están disponibles.";
type StudentStore = Pick<ReturnType<typeof openStudentAccountStore>, "login" | "currentStudent" | "logout">;

function tokenFrom(request: Request) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) ?? null;
}

function cookie(token: string, request: Request, clear = false) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${clear ? "" : token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 604800}${secure}`;
}

function errorResponse(error: unknown) {
  if (error instanceof StudentAccountError || error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status, headers: NO_STORE });
  }
  return Response.json({ error: "Error del servidor." }, { status: 500, headers: NO_STORE });
}

/** A real route receives null until AP-304 and the independent verifier are approved. */
export function createStudentAuthHandlers(store: StudentStore | null) {
  function requireStore() {
    if (!store) throw new StudentAccountError(503, UNAVAILABLE);
    return store;
  }
  return {
    async login(request: Request) {
      try {
        const activeStore = requireStore();
        ensureSameOrigin(request);
        const result = await activeStore.login(await readJson(request));
        return Response.json({ user: result.user }, {
          headers: { ...NO_STORE, "Set-Cookie": cookie(result.token, request) },
        });
      } catch (error) { return errorResponse(error); }
    },
    me(request: Request) {
      try {
        const user = requireStore().currentStudent(tokenFrom(request));
        return Response.json({ user }, { headers: NO_STORE });
      } catch (error) { return errorResponse(error); }
    },
    logout(request: Request) {
      try {
        const activeStore = requireStore();
        ensureSameOrigin(request);
        activeStore.logout(tokenFrom(request));
        return Response.json({ ok: true }, {
          headers: { ...NO_STORE, "Set-Cookie": cookie("", request, true) },
        });
      } catch (error) { return errorResponse(error); }
    },
  };
}
