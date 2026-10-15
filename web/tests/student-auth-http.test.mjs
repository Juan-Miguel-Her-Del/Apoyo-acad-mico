import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createStudentAuthHandlers } from "../src/lib/student-auth-http.ts";
import { openStudentAccountStore } from "../src/lib/student-accounts.ts";

const url = "https://apoyo.example.test/api/student/auth/login";
function post(body, cookie = "") {
  return new Request(url, { method: "POST", headers: {
    origin: "https://apoyo.example.test", host: "apoyo.example.test", "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
  }, body: JSON.stringify(body) });
}

test("rutas sin verificador aprobado permanecen cerradas y no instancian la tienda", async () => {
  const handlers = createStudentAuthHandlers(null);
  assert.equal((await handlers.login(post({ email: "alguien@example.test", password: "secreta" }))).status, 503);
  assert.equal(handlers.me(new Request(url)).status, 503);
  assert.equal(handlers.logout(post({})).status, 503);
});

test("contrato HTTP sintético protege cookie, perfil, cierre y origen", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-student-http-"));
  const policy = { noticeVersion: "test-1", noticeDigest: "a".repeat(64), approvedMethod: "synthetic" };
  const store = openStudentAccountStore(path.join(dir, "student.sqlite"), policy);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const authorizationId = store.issueAuthorization({ representativeRef: "fixture", evidenceRef: "fixture-1",
    verificationMethod: "synthetic", studentHeard: true, noticeVersion: "test-1",
    noticeDigest: "a".repeat(64), purposes: ["educational_account", "progress_storage"],
    verifiedAt: new Date().toISOString() });
  await store.register({ email: "estudiante@example.test", password: "clave-segura-123", authorizationId });
  const handlers = createStudentAuthHandlers(store);
  const invalid = await handlers.login(post({ email: "estudiante@example.test", password: "mal" }));
  assert.equal(invalid.status, 401);
  assert.deepEqual(await invalid.json(), { error: "No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo." });
  const crossOrigin = new Request(url, { method: "POST", headers: {
    origin: "https://otra.example.test", host: "apoyo.example.test", "content-type": "application/json",
  }, body: JSON.stringify({ email: "estudiante@example.test", password: "clave-segura-123" }) });
  assert.equal((await handlers.login(crossOrigin)).status, 403);
  const login = await handlers.login(post({ email: "estudiante@example.test", password: "clave-segura-123" }));
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), { user: { id: store.currentStudent(login.headers.get("set-cookie").match(/apoyo_student_session=([0-9a-f]{64})/)[1]).id,
    email: "estudiante@example.test" } });
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly; SameSite=Strict; Path=\/; Max-Age=604800; Secure/);
  assert.equal(login.headers.get("cache-control"), "no-store");
  const browserCookie = cookie.split(";")[0];
  assert.equal(handlers.me(new Request(url, { headers: { cookie: browserCookie } })).status, 200);
  const logout = handlers.logout(post({}, browserCookie));
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0; Secure/);
  assert.equal(handlers.me(new Request(url, { headers: { cookie: browserCookie } })).status, 401);
});
