import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { openAuthStore, AuthError } from "../src/lib/auth.ts";
import { ensureAccountsEnabled, ensureSameOrigin, requestToken, sessionCookie } from "../src/lib/auth-http.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-auth-test-"));
  const dbPath = path.join(dir, "auth.sqlite");
  const stores = [];
  t.after(() => {
    for (const store of stores) store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const open = () => { const store = openAuthStore(dbPath); stores.push(store); return store; };
  return { open };
}

test("registro adulto persiste y sesiones sobreviven reinicio del almacén", async (t) => {
  const { open } = fixture(t);
  const first = open();
  const { user, token } = await first.register({ email: " Demo@Example.test ", password: "clave-segura-123", adultConfirmed: true });
  assert.equal(user.email, "demo@example.test");
  assert.equal(first.sessionUser(token)?.id, user.id);
  const second = open();
  assert.deepEqual(second.sessionUser(token), user);
  const loggedIn = await second.login({ email: "DEMO@example.test", password: "clave-segura-123" });
  assert.equal(loggedIn.user.id, user.id);
  assert.ok(loggedIn.token !== token);
  assert.deepEqual(second.sessionUser(loggedIn.token), user);
});

test("duplicado, credenciales erróneas y registro de menores o datos de identidad fallan", async (t) => {
  const { open } = fixture(t);
  const store = open();
  await assert.rejects(store.register({ email: "menor@example.test", password: "clave-segura-123", adultConfirmed: false }),
    (error) => error instanceof AuthError && error.status === 403);
  await assert.rejects(store.register({ email: "menor@example.test", password: "clave-segura-123", adultConfirmed: true, birthDate: "2015-01-01" }),
    (error) => error instanceof AuthError && error.status === 400);
  await assert.rejects(store.login({ email: "menor@example.test", password: "clave-segura-123" }),
    (error) => error instanceof AuthError && error.status === 401);
  await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  await assert.rejects(store.register({ email: "A@example.test", password: "clave-segura-123", adultConfirmed: true }),
    (error) => error instanceof AuthError && error.status === 409);
  await assert.rejects(store.login({ email: "a@example.test", password: "incorrecta-123" }),
    (error) => error instanceof AuthError && error.status === 401);
});

test("progreso aislado por usuario, combinación válida y revocación de sesión", async (t) => {
  const { open } = fixture(t);
  const store = open();
  const a = await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await store.register({ email: "b@example.test", password: "clave-segura-123", adultConfirmed: true });
  assert.deepEqual(store.listProgress(b.user.id), []);
  assert.throws(() => store.saveProgress(a.user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", kind: "diagnostic", completed: true }),
    (error) => error instanceof AuthError && error.status === 409);
  assert.equal(store.listProgress(a.user.id).length, 0);
  assert.deepEqual(store.listProgress(b.user.id), []);
  await assert.rejects(async () => store.saveProgress(b.user.id, { gradeId: "G05", subjectId: "FIS", topicId: "G05-MAT", kind: "study", completed: true }),
    (error) => error instanceof AuthError && error.status === 400);
  store.logout(a.token);
  assert.equal(store.sessionUser(a.token), null);
  assert.deepEqual(store.sessionUser(b.token), b.user);
  store.disableUser(b.user.id);
  assert.equal(store.sessionUser(b.token), null);
  assert.throws(() => store.saveProgress(b.user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", kind: "diagnostic", completed: true }),
    (error) => error instanceof AuthError && error.status === 401);
});

test("perfil adulto conserva nombre y grado por cuenta y reinicia el tema al cambiar grado", async (t) => {
  const { open } = fixture(t);
  const store = open();
  const a = await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await store.register({ email: "b@example.test", password: "clave-segura-123", adultConfirmed: true });
  assert.equal(store.getProfile(a.user.id), null);
  const profile = store.saveProfile(a.user.id, { displayName: " Ana  María ", gradeId: "G05" });
  assert.equal(profile.role, "adult_student");
  assert.equal(profile.displayName, "Ana María");
  assert.equal(open().getProfile(a.user.id).gradeId, "G05");
  assert.equal(store.getProfile(b.user.id), null);
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  store.saveLastSelection(a.user.id, selection);
  const earlierSessionId = store.startPractice(a.user.id, selection).session.id;
  store.finishPractice(a.user.id, { sessionId: earlierSessionId });
  store.saveProfile(a.user.id, { displayName: "Ana", gradeId: "G05" });
  assert.deepEqual(store.getLastSelection(a.user.id).selection, selection);
  store.saveProfile(a.user.id, { displayName: "Ana", gradeId: "G10" });
  assert.equal(store.getLastSelection(a.user.id).selection, null);
  assert.equal(store.listPracticeSessions(a.user.id)[0].id, earlierSessionId, "el historial del grado anterior permanece");
  assert.equal(store.studySummary(a.user.id).recommendation.topicId.startsWith("G10-"), true);
  assert.throws(() => store.saveLastSelection(a.user.id, selection),
    (error) => error instanceof AuthError && error.status === 403);
  assert.throws(() => store.assertCurrentGrade(a.user.id, "G05"),
    (error) => error instanceof AuthError && error.status === 403);
  assert.equal(store.assertCurrentGrade(a.user.id, "G10"), "G10");
  assert.throws(() => store.assertCurrentGrade(b.user.id, "G05"),
    (error) => error instanceof AuthError && error.status === 409);
  store.saveProfile(b.user.id, { displayName: "Beto", gradeId: "G05" });
  store.saveLastSelection(b.user.id, selection);
  store.saveProfile(b.user.id, { displayName: "Beto", gradeId: "G10" });
  assert.equal(store.getLastSelection(b.user.id).selection, null, "la preparación de una cuenta antigua limpia un tema de otro grado");
  assert.throws(() => store.saveProfile(a.user.id, { displayName: "Ana", gradeId: "G12" }),
    (error) => error instanceof AuthError && error.status === 400);
  assert.throws(() => store.saveProfile("not-the-owner", { displayName: "Ana", gradeId: "G05" }),
    (error) => error instanceof AuthError && error.status === 401);
  assert.equal(store.getProfile(b.user.id).gradeId, "G10");
});

test("origen y cookie restringen escrituras entre sitios", () => {
  const same = new Request("http://localhost:3000/api/progress", { method: "POST", headers: { origin: "http://localhost:3000", cookie: "apoyo_session=token" } });
  assert.doesNotThrow(() => ensureSameOrigin(same));
  assert.equal(requestToken(same), "token");
  assert.match(sessionCookie("token", same), /HttpOnly; SameSite=Strict/);
  const cross = new Request("http://localhost:3000/api/progress", { method: "POST", headers: { origin: "https://attacker.example" } });
  assert.throws(() => ensureSameOrigin(cross), (error) => error instanceof AuthError && error.status === 403);
  const proxied = new Request("http://127.0.0.1:3000/api/progress", { method: "POST", headers: {
    origin: "https://preview.example.test", host: "127.0.0.1:3000", "x-forwarded-host": "preview.example.test",
    "sec-fetch-site": "same-origin",
  } });
  assert.doesNotThrow(() => ensureSameOrigin(proxied), "un proxy puede cambiar la URL interna y el protocolo");
  assert.match(sessionCookie("token", proxied), /Secure/, "la cookie del túnel HTTPS debe ser segura");
  const tunnelWithoutForwardedHost = new Request("http://127.0.0.1:3000/api/progress", { method: "POST", headers: {
    origin: "https://preview.example.test", host: "127.0.0.1:3000", "sec-fetch-site": "same-origin",
  } });
  assert.doesNotThrow(() => ensureSameOrigin(tunnelWithoutForwardedHost), "la solicitud del mismo origen pasa aunque el túnel no reenvíe el host público");
  const forgedProxy = new Request("http://127.0.0.1:3000/api/progress", { method: "POST", headers: {
    origin: "https://attacker.example", host: "127.0.0.1:3000", "x-forwarded-host": "attacker.example",
    "sec-fetch-site": "cross-site",
  } });
  assert.throws(() => ensureSameOrigin(forgedProxy), (error) => error instanceof AuthError && error.status === 403);
  const differentScheme = new Request("http://localhost:3000/api/progress", { method: "POST", headers: {
    origin: "https://localhost:3000", host: "localhost:3000", "sec-fetch-site": "same-site",
  } });
  assert.throws(() => ensureSameOrigin(differentScheme), (error) => error instanceof AuthError && error.status === 403);
  const noFetchMetadata = new Request("http://localhost:3000/api/progress", { method: "POST", headers: {
    origin: "https://localhost:3000", host: "localhost:3000",
  } });
  assert.throws(() => ensureSameOrigin(noFetchMetadata), (error) => error instanceof AuthError && error.status === 403);
  const secure = new Request("https://example.test/api/progress");
  assert.match(sessionCookie("token", secure), /Secure/);
  assert.throws(() => ensureAccountsEnabled(secure), (error) => error instanceof AuthError && error.status === 503);
});
