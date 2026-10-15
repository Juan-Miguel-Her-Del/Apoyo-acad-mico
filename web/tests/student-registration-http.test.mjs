import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStudentAccountStore } from "../src/lib/student-accounts.ts";
import { handleStudentRegistration } from "../src/lib/student-registration-http.ts";

const policy = { noticeVersion: "synthetic-v1", noticeDigest: "a".repeat(64), approvedMethod: "test-verifier" };
function grant(evidenceRef) {
  return { representativeRef: "test-representative", evidenceRef, verificationMethod: policy.approvedMethod,
    studentHeard: true, noticeVersion: policy.noticeVersion, noticeDigest: policy.noticeDigest,
    purposes: ["educational_account", "progress_storage"], verifiedAt: new Date().toISOString() };
}
function request(body, origin = "https://example.test") {
  return new Request("https://example.test/api/student/register", {
    method: "POST", headers: { "Content-Type": "application/json", origin, host: "example.test" },
    body: JSON.stringify(body),
  });
}
const form = (email = "student@example.test", proof = "proof-1") =>
  ({ email, password: "clave-segura-123", authorizationProof: proof });

test("ruta real permanece cerrada sin política y verificador aprobados", async () => {
  let opened = 0;
  const response = await handleStudentRegistration(request(form()), {
    reviewedPolicy: null, verifyRepresentative: null, openStore: () => { opened++; throw Error("unexpected"); },
  });
  assert.equal(response.status, 503);
  assert.equal(opened, 0);
  assert.equal(JSON.stringify(await response.json()).includes("proof-1"), false);
});

test("contrato HTTP sintético: alta, errores neutrales y transacción reintentable", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-student-http-test-"));
  const dbPath = path.join(dir, "students.sqlite");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const deps = {
    reviewedPolicy: policy,
    verifyRepresentative: async (proof) => proof.startsWith("proof-") ? grant(proof) : null,
    openStore: (review) => openStudentAccountStore(dbPath, review),
  };
  const created = await handleStudentRegistration(request(form()), deps);
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { created: true });
  assert.equal(created.headers.get("cache-control"), "no-store");
  const duplicate = await handleStudentRegistration(request(form()), deps);
  assert.equal(duplicate.status, 400);
  const invalid = await handleStudentRegistration(request({ ...form(), password: "corta" }), deps);
  assert.equal(invalid.status, 400);
  assert.equal((await duplicate.json()).error, (await invalid.json()).error);
  assert.equal((await handleStudentRegistration(request(form("other@example.test", "bad-proof")), deps)).status, 403);
  assert.equal((await handleStudentRegistration(request({ ...form(), birthDate: "2010-01-01" }), deps)).status, 400);
  assert.equal((await handleStudentRegistration(request(form(), "https://evil.test"), deps)).status, 403);

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`CREATE TRIGGER fail_registration BEFORE INSERT ON student_users
      BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;`);
    const retryForm = form("retry@example.test", "proof-retry");
    const failure = await handleStudentRegistration(request(retryForm), deps);
    assert.equal(failure.status, 503);
    assert.equal(JSON.stringify(await failure.json()).includes("synthetic failure"), false);
    db.exec("DROP TRIGGER fail_registration");
    assert.equal((await handleStudentRegistration(request(retryForm), deps)).status, 201);
  } finally { db.close(); }
});
