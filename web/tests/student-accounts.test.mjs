import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openStudentAccountStore, StudentAccountError } from "../src/lib/student-accounts.ts";

const policy = { noticeVersion: "test-review-1", noticeDigest: "a".repeat(64), approvedMethod: "synthetic-verifier" };
function syntheticGrant(evidenceRef = "synthetic-evidence-1") {
  return { representativeRef: "synthetic-representative", evidenceRef,
    verificationMethod: policy.approvedMethod, studentHeard: true,
    noticeVersion: policy.noticeVersion, noticeDigest: policy.noticeDigest,
    purposes: ["educational_account", "progress_storage"], verifiedAt: new Date().toISOString() };
}
function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-student-test-"));
  const dbPath = path.join(dir, "students.sqlite");
  const stores = [];
  t.after(() => { stores.forEach((store) => store.close()); rmSync(dir, { recursive: true, force: true }); });
  const open = (review = policy) => { const store = openStudentAccountStore(dbPath, review); stores.push(store); return store; };
  return { open };
}
const blocked = (status) => (error) => error instanceof StudentAccountError && error.status === status;

test("sin revisión formal configurada no se emite autorización, cuenta ni sesión", async (t) => {
  const { open } = fixture(t);
  const store = open(null);
  assert.throws(() => store.issueAuthorization(syntheticGrant()), blocked(503));
  await assert.rejects(store.register({ email: "menor@example.test", password: "clave-segura-123", authorizationId: "0".repeat(32) }), blocked(503));
  await assert.rejects(store.login({ email: "menor@example.test", password: "clave-segura-123" }), blocked(503));
  assert.throws(() => store.currentStudent("0".repeat(64)), blocked(503));
});

test("autorización sintética válida permite registro, sesión y progreso entre reinicios", async (t) => {
  const { open } = fixture(t);
  const store = open();
  const authorizationId = store.issueAuthorization(syntheticGrant());
  const user = await store.register({ email: " ESTUDIANTE@example.test ", password: "clave-segura-123", authorizationId });
  const { token } = await store.login({ email: "estudiante@example.test", password: "clave-segura-123" });
  assert.equal(store.currentStudent(token).id, user.id);
  const first = store.saveProgress(token, { topicId: "G05-MAT", kind: "practice", correctCount: 1, answered: 2,
    completedAt: "2026-10-01T10:00:00.000Z" });
  assert.equal(store.compareProgress(token, "G05-MAT").status, "insufficient");
  const second = store.saveProgress(token, { topicId: "G05-MAT", kind: "practice", correctCount: 2, answered: 2,
    completedAt: "2026-10-02T10:00:00.000Z" });
  const reopened = open();
  assert.deepEqual(reopened.listProgress(token).map((item) => item.id), [second.id, first.id]);
  const comparison = reopened.compareProgress(token, "G05-MAT");
  assert.equal(comparison.status, "ready");
  assert.equal(comparison.percentagePointChange, 50);
  assert.equal(comparison.current.id, second.id);
  assert.equal(comparison.previous.id, first.id);
});

test("faltante, finalidades parciales, duplicado y aviso distinto bloquean activación", async (t) => {
  const { open } = fixture(t);
  const store = open();
  assert.throws(() => store.issueAuthorization({ ...syntheticGrant(), purposes: ["educational_account"] }), blocked(403));
  assert.throws(() => store.issueAuthorization({ ...syntheticGrant(), noticeDigest: "b".repeat(64) }), blocked(403));
  const authorizationId = store.issueAuthorization(syntheticGrant());
  assert.throws(() => store.issueAuthorization(syntheticGrant()), (error) => String(error).includes("UNIQUE constraint failed"));
  await assert.rejects(store.register({ email: "otro@example.test", password: "clave-segura-123", authorizationId: "0".repeat(32) }), blocked(403));
  await store.register({ email: "otro@example.test", password: "clave-segura-123", authorizationId });
  await assert.rejects(store.register({ email: "otro@example.test", password: "clave-segura-123", authorizationId }), blocked(409));
  await assert.rejects(store.login({ email: "otro@example.test", password: "equivocada-123" }), blocked(401));
});

test("progreso y sesión quedan aislados; revocar corta lecturas y escrituras", async (t) => {
  const { open } = fixture(t);
  const store = open();
  const authorizationA = store.issueAuthorization(syntheticGrant("synthetic-evidence-A"));
  const authorizationB = store.issueAuthorization(syntheticGrant("synthetic-evidence-B"));
  await store.register({ email: "a@example.test", password: "clave-segura-123", authorizationId: authorizationA });
  await store.register({ email: "b@example.test", password: "clave-segura-123", authorizationId: authorizationB });
  const a = await store.login({ email: "a@example.test", password: "clave-segura-123" });
  const b = await store.login({ email: "b@example.test", password: "clave-segura-123" });
  store.saveProgress(a.token, { topicId: "G05-MAT", kind: "diagnostic", correctCount: 1, answered: 2,
    completedAt: "2026-10-01T10:00:00.000Z" });
  assert.equal(store.listProgress(b.token).length, 0);
  assert.equal(store.compareProgress(b.token, "G05-MAT").current, null);
  store.revoke(authorizationA);
  assert.throws(() => store.currentStudent(a.token), blocked(401));
  assert.throws(() => store.listProgress(a.token), blocked(401));
  assert.throws(() => store.saveProgress(a.token, { topicId: "G05-MAT", kind: "practice", correctCount: 1,
    answered: 2, completedAt: "2026-10-02T10:00:00.000Z" }), blocked(401));
  await assert.rejects(store.login({ email: "a@example.test", password: "clave-segura-123" }), blocked(403));
  assert.equal(store.currentStudent(b.token).email, "b@example.test");
  store.logout(b.token);
  assert.throws(() => store.currentStudent(b.token), blocked(401));
});
