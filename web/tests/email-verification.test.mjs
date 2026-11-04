import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AuthError, openAuthStore } from "../src/lib/auth.ts";
import { deliverEmailVerification, emailVerificationConfigured } from "../src/lib/email-verification-delivery.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-verify-"));
  const store = openAuthStore(path.join(dir, "auth.sqlite"));
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  return store;
}

const registration = { email: "adulto@example.test", password: "clave-segura-123",
  displayName: "Ana", gradeId: "G10", adultConfirmed: true };

test("el registro guarda perfil pendiente y solo activa cuenta tras confirmar correo", async (t) => {
  const store = fixture(t);
  const sent = [];
  const now = Date.now();
  await store.requestRegistration(registration, async (email, token) => sent.push({ email, token }), now);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, registration.email);
  await assert.rejects(store.login({ email: registration.email, password: registration.password }),
    (error) => error instanceof AuthError && error.status === 401);
  assert.throws(() => store.verifyRegistration({ token: "a".repeat(64) }, now + 1000),
    (error) => error instanceof AuthError && error.status === 400);
  const { user, token } = store.verifyRegistration({ token: sent[0].token }, now + 1000);
  assert.equal(store.sessionUser(token)?.id, user.id);
  assert.equal(store.getProfile(user.id)?.gradeId, "G10");
  assert.equal(store.getProfile(user.id)?.displayName, "Ana");
  assert.equal((await store.login({ email: registration.email, password: registration.password })).user.id, user.id);
  assert.throws(() => store.verifyRegistration({ token: sent[0].token }, now + 2000),
    (error) => error instanceof AuthError && error.status === 400);
});

test("el enlace vence, el reenvío invalida el anterior y limita los intentos", async (t) => {
  const store = fixture(t);
  const sent = [];
  const deliver = async (_email, token) => { sent.push(token); };
  const now = Date.now();
  await store.requestRegistration(registration, deliver, now);
  await store.requestRegistration({ ...registration, displayName: "Intruso", gradeId: "G05" }, deliver, now + 1000);
  assert.equal(sent.length, 2);
  assert.throws(() => store.verifyRegistration({ token: sent[0] }, now + 2000),
    (error) => error instanceof AuthError && error.status === 400);
  await store.requestRegistration(registration, deliver, now + 2000);
  await store.requestRegistration(registration, deliver, now + 3000);
  assert.equal(sent.length, 3, "máximo tres envíos por hora y correo");
  assert.throws(() => store.verifyRegistration({ token: sent[2] }, now + 86400000 + 2000),
    (error) => error instanceof AuthError && error.status === 400);
  const result = store.verifyRegistration({ token: sent[2] }, now + 4000);
  assert.equal(store.getProfile(result.user.id)?.gradeId, "G10", "un segundo solicitante no altera el perfil pendiente");
});

test("si falla el envío no queda una cuenta pendiente sin correo", async (t) => {
  const store = fixture(t);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await assert.rejects(store.requestRegistration(registration, async () => { throw new Error("sin correo"); }), /sin correo/);
  }
  const sent = [];
  await store.requestRegistration(registration, async (_email, token) => sent.push(token));
  assert.equal(sent.length, 1);
  assert.equal(store.getProfile(store.verifyRegistration({ token: sent[0] }).user.id)?.gradeId, "G10");
});

test("Resend recibe solo el correo y un enlace de un uso por HTTPS", async (t) => {
  const previous = { key: process.env.RESEND_API_KEY, from: process.env.APOYO_EMAIL_FROM,
    base: process.env.APOYO_PUBLIC_URL, fetch: globalThis.fetch };
  t.after(() => {
    if (previous.key === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous.key;
    if (previous.from === undefined) delete process.env.APOYO_EMAIL_FROM; else process.env.APOYO_EMAIL_FROM = previous.from;
    if (previous.base === undefined) delete process.env.APOYO_PUBLIC_URL; else process.env.APOYO_PUBLIC_URL = previous.base;
    globalThis.fetch = previous.fetch;
  });
  process.env.RESEND_API_KEY = "test-key";
  process.env.APOYO_EMAIL_FROM = "Apoyo <cuentas@example.test>";
  process.env.APOYO_PUBLIC_URL = "https://apoyo.example.test";
  let submitted;
  globalThis.fetch = async (url, options) => { submitted = { url, options }; return new Response(null, { status: 200 }); };
  assert.equal(emailVerificationConfigured(), true);
  await deliverEmailVerification("adulto@example.test", "a".repeat(64));
  assert.equal(submitted.url, "https://api.resend.com/emails");
  const body = JSON.parse(submitted.options.body);
  assert.deepEqual(body.to, ["adulto@example.test"]);
  assert.match(body.text, /https:\/\/apoyo\.example\.test\/verificar#a{64}/);
  assert.doesNotMatch(body.text, /Ana|G10/);
});
