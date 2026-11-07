import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openAuthStore, SESSION_COOKIE } from "../src/lib/auth.ts";
import { demoExplanationId, openDemoFeedbackStore } from "../src/lib/explanation-demo-feedback.ts";
import { handleDemoFeedback } from "../src/lib/explanation-demo-feedback-http.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { getAdaptiveDiagnosticBank } from "../src/lib/diagnostic-adaptive.ts";

test("la valoración de una explicación se actualiza una sola vez y queda aislada por cuenta", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "apoyo-feedback-"));
  const dbPath = path.join(directory, "apoyo.sqlite");
  const previous = process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
  process.env.APOYO_ENABLE_ADULT_ACCOUNTS = "true";
  const auth = openAuthStore(dbPath);
  const feedback = openDemoFeedbackStore(dbPath);
  const password = "clave-segura-de-prueba-123";
  try {
    const alice = await auth.register({ email: "alice-feedback@example.test", password, adultConfirmed: true });
    const bob = await auth.register({ email: "bob-feedback@example.test", password, adultConfirmed: true });
    const topicId = "G05-MAT";
    const explanationId = demoExplanationId(topicId);
    const deps = {
      userId: (request) => {
        const token = request.headers.get("cookie")?.split("=")[1];
        return auth.sessionUser(token)?.id ?? null;
      }, get: feedback.get, put: feedback.put,
    };
    const request = (token, method, body, origin = "http://localhost:3000", requestedId) => new Request(
      `http://localhost:3000/api/explanation/demo-feedback?topicId=${topicId}${requestedId ? `&explanationId=${encodeURIComponent(requestedId)}` : ""}`,
      { method, headers: { host: "localhost:3000", origin, cookie: token ? `${SESSION_COOKIE}=${token}` : "",
        ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) },
    );
    const first = await handleDemoFeedback(request(alice.token, "POST", { topicId, explanationId, value: "helped" }), deps);
    assert.equal(first.status, 200);
    const second = await handleDemoFeedback(request(alice.token, "POST", { topicId, explanationId, value: "confused" }), deps);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).feedback.value, "confused");
    assert.equal((await (await handleDemoFeedback(request(bob.token, "GET"), deps)).json()).feedback, null);
    assert.equal((await (await handleDemoFeedback(request(alice.token, "GET"), deps)).json()).feedback.value, "confused");

    const savedSkill = getAdaptiveDiagnosticBank("G05", "MAT", topicId)[0].skill;
    const savedSkillId = demoExplanationId(topicId, savedSkill, 0);
    assert.equal((await handleDemoFeedback(request(alice.token, "POST",
      { topicId, explanationId: savedSkillId, value: "helped" }), deps)).status, 200);
    assert.equal((await (await handleDemoFeedback(request(alice.token, "GET", null,
      "http://localhost:3000", savedSkillId), deps)).json()).feedback.value, "helped");

    const skill = getDiagnostic("G05", "MAT", topicId, "demo").questions[0].skill;
    const firstExampleId = demoExplanationId(topicId, skill, 0);
    const secondExampleId = demoExplanationId(topicId, skill, 1);
    assert.notEqual(firstExampleId, secondExampleId);
    assert.equal((await handleDemoFeedback(request(alice.token, "POST",
      { topicId, explanationId: firstExampleId, value: "helped" }), deps)).status, 200);
    assert.equal((await handleDemoFeedback(request(alice.token, "POST",
      { topicId, explanationId: secondExampleId, value: "confused" }), deps)).status, 200);
    assert.equal((await (await handleDemoFeedback(request(alice.token, "GET", null,
      "http://localhost:3000", firstExampleId), deps)).json()).feedback.value, "helped");
    assert.equal((await (await handleDemoFeedback(request(alice.token, "GET", null,
      "http://localhost:3000", secondExampleId), deps)).json()).feedback.value, "confused");
    assert.equal((await (await handleDemoFeedback(request(alice.token, "GET"), deps)).json()).feedback.value, "confused");
    assert.equal((await handleDemoFeedback(request(alice.token, "POST",
      { topicId, explanationId: demoExplanationId(topicId, "habilidad-inventada", 0), value: "helped" }), deps)).status, 400);

    const readOnly = new DatabaseSync(dbPath);
    try {
      const count = readOnly.prepare("SELECT COUNT(*) AS count FROM explanation_demo_feedback WHERE user_id=? AND explanation_id=?")
        .get(alice.user.id, explanationId);
      assert.equal(count.count, 1);
    } finally { readOnly.close(); }

    auth.logout(alice.token);
    const reentry = await auth.login({ email: "alice-feedback@example.test", password });
    assert.equal((await (await handleDemoFeedback(request(reentry.token, "GET"), deps)).json()).feedback.value, "confused");
    assert.equal((await handleDemoFeedback(request(null, "GET"), deps)).status, 401);
    assert.equal((await handleDemoFeedback(request(bob.token, "POST", { topicId, explanationId, value: "helped" }, "https://evil.test"), deps)).status, 403);
    assert.equal((await handleDemoFeedback(request(bob.token, "POST", { topicId, explanationId: demoExplanationId("G10-MAT"), value: "helped" }), deps)).status, 400);
    assert.equal((await handleDemoFeedback(request(bob.token, "POST", { topicId: "G12-MAT", explanationId, value: "helped" }), deps)).status, 400);
  } finally {
    feedback.close(); auth.close();
    if (previous === undefined) delete process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
    else process.env.APOYO_ENABLE_ADULT_ACCOUNTS = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});
