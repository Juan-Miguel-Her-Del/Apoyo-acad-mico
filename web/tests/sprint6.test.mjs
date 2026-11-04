import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AuthError, openAuthStore } from "../src/lib/auth.ts";
import { availableSelection, recommendStudy, studyStreak } from "../src/lib/study-planning.ts";
import { topics } from "../src/lib/catalog.ts";
import { deliverPasswordReset, recoveryConfigured } from "../src/lib/password-reset-delivery.ts";
import { openDiagnosticAttemptStore } from "../src/lib/diagnostic-attempts.ts";
import { openDemoFeedbackStore } from "../src/lib/explanation-demo-feedback.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-sprint6-"));
  const dbPath = path.join(dir, "app.sqlite");
  const stores = [];
  t.after(() => { for (const store of stores) store.close(); rmSync(dir, { recursive: true, force: true }); });
  return { dbPath, open: () => { const store = openAuthStore(dbPath); stores.push(store); return store; },
    track: (store) => { stores.push(store); return store; } };
}

test("última selección persiste, se aísla por cuenta y se invalida si el tema se retira", async (t) => {
  const { open } = fixture(t);
  const first = open();
  const a = await first.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await first.register({ email: "b@example.test", password: "clave-segura-123", adultConfirmed: true });
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  first.saveProfile(a.user.id, { displayName: "Ana", gradeId: "G05" });
  first.saveLastSelection(a.user.id, selection);
  assert.equal(first.getLastSelection(b.user.id).selection, null);
  assert.deepEqual(open().getLastSelection(a.user.id).selection, selection);
  assert.throws(() => first.saveLastSelection(a.user.id, { ...selection, subjectId: "ESP" }),
    (error) => error instanceof AuthError && error.status === 400);
  assert.equal(availableSelection(selection, topics.map((topic) => topic.id === "G05-MAT" ? { ...topic, active: false } : topic)), null);
});

test("recomendación usa dificultad persistible y no atribuye dificultad sin evidencia", () => {
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  const neutral = recommendStudy(selection, [{ skillId: "G05-MAT:suma-distinto-denominador", completeAttempts: 1, answered: 1, correctCount: 0 }]);
  assert.equal(neutral.kind, "neutral");
  const weak = recommendStudy(selection, [{ skillId: "G05-MAT:suma-distinto-denominador", completeAttempts: 2, answered: 4, correctCount: 1 }]);
  assert.equal(weak.kind, "difficulty");
  assert.equal(weak.topicId, "G05-MAT");
  assert.equal(weak.skillId, "G05-MAT:suma-distinto-denominador");
  assert.equal(recommendStudy(selection, [{ skillId: "G10-MAT:seno", completeAttempts: 3, answered: 6, correctCount: 0 }]).kind, "neutral");
});

test("racha usa días únicos de Bogotá, tolera ayer y corta tras un día sin práctica", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  assert.equal(studyStreak([], now).days, 0);
  assert.equal(studyStreak(["2026-10-19T03:30:00Z", "2026-10-18T16:00:00Z"], now).days, 1);
  assert.equal(studyStreak(["2026-10-19T05:30:00Z", "2026-10-18T16:00:00Z", "2026-10-18T20:00:00Z"], now).days, 2);
  assert.equal(studyStreak(["2026-10-17T16:00:00Z"], now).days, 0);
});

test("recuperación: correo desconocido neutro, tasa limitada, token de un uso, vencimiento y revocación", async (t) => {
  const { open } = fixture(t);
  const store = open();
  const account = await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const sent = [];
  const deliver = async (email, token) => sent.push({ email, token });
  const now = Date.now();
  await store.requestPasswordReset({ email: "absent@example.test" }, deliver, now);
  assert.equal(sent.length, 0);
  await store.requestPasswordReset({ email: "a@example.test" }, deliver, now);
  const first = sent.at(-1).token;
  await assert.rejects(store.resetPassword({ token: first, password: "nueva-clave-456" }, now + 1800001),
    (error) => error instanceof AuthError && error.status === 400);
  await store.requestPasswordReset({ email: "a@example.test" }, deliver, now);
  const second = sent.at(-1).token;
  await store.requestPasswordReset({ email: "a@example.test" }, deliver, now);
  assert.equal(sent.length, 3);
  const latest = sent.at(-1).token;
  await store.requestPasswordReset({ email: "a@example.test" }, deliver, now);
  assert.equal(sent.length, 3);
  await assert.rejects(store.resetPassword({ token: first, password: "nueva-clave-456" }, now),
    (error) => error instanceof AuthError && error.status === 400);
  await assert.rejects(store.resetPassword({ token: second, password: "nueva-clave-456" }, now),
    (error) => error instanceof AuthError && error.status === 400);
  await store.resetPassword({ token: latest, password: "nueva-clave-456" }, now);
  assert.equal(store.sessionUser(account.token), null);
  await assert.rejects(store.resetPassword({ token: latest, password: "otra-clave-789" }, now),
    (error) => error instanceof AuthError && error.status === 400);
  await assert.rejects(store.login({ email: "a@example.test", password: "clave-segura-123" }),
    (error) => error instanceof AuthError && error.status === 401);
  assert.equal((await store.login({ email: "a@example.test", password: "nueva-clave-456" })).user.id, account.user.id);
});

test("eliminación exige contraseña y borra cuenta, sesión, selección y registros vinculados", async (t) => {
  const { open, dbPath, track } = fixture(t);
  const store = open();
  const a = await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await store.register({ email: "b@example.test", password: "clave-segura-123", adultConfirmed: true });
  store.saveProfile(a.user.id, { displayName: "Ana", gradeId: "G05" });
  store.saveLastSelection(a.user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  track(openDiagnosticAttemptStore(dbPath));
  track(openDemoFeedbackStore(dbPath));
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys=ON");
  db.prepare(`INSERT INTO diagnostic_attempts(id,user_id,grade_id,subject_id,topic_id,status,started_at)
    VALUES ('attempt-test',?,?,?,?,'open',?)`).run(a.user.id, "G05", "MAT", "G05-MAT", new Date().toISOString());
  db.prepare(`INSERT INTO explanation_demo_feedback(user_id,topic_id,explanation_id,value,updated_at)
    VALUES (?,?,?,'helped',?)`).run(a.user.id, "G05-MAT", "study-draft-v1:G05-MAT", new Date().toISOString());
  db.prepare(`INSERT INTO practice_sessions(id,user_id,grade_id,subject_id,topic_id,status,total,started_at)
    VALUES ('practice-test',?,?,?,?,'open',2,?)`).run(a.user.id, "G05", "MAT", "G05-MAT", new Date().toISOString());
  await assert.rejects(store.deleteOwnAccount(a.user.id, { confirmation: "ELIMINAR", password: "errónea" }),
    (error) => error instanceof AuthError && error.status === 401);
  assert.ok(store.sessionUser(a.token));
  await store.deleteOwnAccount(a.user.id, { confirmation: "ELIMINAR", password: "clave-segura-123" });
  assert.equal(store.sessionUser(a.token), null);
  for (const table of ["diagnostic_attempts", "explanation_demo_feedback", "practice_sessions", "last_selections", "sessions"]) {
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id=?`).get(a.user.id).n, 0, table);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM last_selections WHERE user_id=?").get(a.user.id).n, 0);
  assert.deepEqual(store.sessionUser(b.token), b.user);
  db.close();
});

test("correo de recuperación usa API de servidor y fragmento para no enviar token en petición web", async (t) => {
  const saved = { key: process.env.RESEND_API_KEY, from: process.env.APOYO_RECOVERY_FROM,
    base: process.env.APOYO_PUBLIC_URL, fetch: globalThis.fetch };
  t.after(() => {
    if (saved.key === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = saved.key;
    if (saved.from === undefined) delete process.env.APOYO_RECOVERY_FROM; else process.env.APOYO_RECOVERY_FROM = saved.from;
    if (saved.base === undefined) delete process.env.APOYO_PUBLIC_URL; else process.env.APOYO_PUBLIC_URL = saved.base;
    globalThis.fetch = saved.fetch;
  });
  process.env.RESEND_API_KEY = "key-test";
  process.env.APOYO_RECOVERY_FROM = "Apoyo <cuentas@example.test>";
  process.env.APOYO_PUBLIC_URL = "https://apoyo.example.test";
  let submitted;
  globalThis.fetch = async (url, options) => { submitted = { url, options }; return new Response("{}", { status: 200 }); };
  assert.equal(recoveryConfigured(), true);
  await deliverPasswordReset("a@example.test", "a".repeat(64));
  assert.equal(submitted.url, "https://api.resend.com/emails");
  const email = JSON.parse(submitted.options.body);
  assert.match(email.text, /https:\/\/apoyo\.example\.test\/recuperar#a{64}/);
  assert.equal(email.to[0], "a@example.test");
});
