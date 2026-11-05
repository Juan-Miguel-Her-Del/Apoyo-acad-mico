import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/lib/catalog.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { handleProvisionalExplanationRequest } from "../src/lib/provisional-explanation-http.ts";
import { provisionalExplanationInput, validateProvisionalExplanation } from "../src/lib/provisional-explanation.ts";

function request(body) {
  return new Request("http://localhost:3000/api/explanation/provisional", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  });
}

test("cada tema de prueba tiene fuente provisional vinculada a un subtema real", () => {
  for (const topic of topics.filter((item) => item.active && item.pilotCandidate)) {
    const diagnostic = getDiagnostic(topic.gradeId, topic.subjectId, topic.id, "demo");
    assert.equal(diagnostic.status, 200, topic.id);
    const source = provisionalExplanationInput(topic.gradeId, topic.subjectId, topic.id, diagnostic.questions[0].skill);
    assert.ok(source, topic.id);
    assert.equal(source.sourceStatus, "provisional");
    assert.ok(source.explanation.length >= 20 && source.example.length >= 20);
    assert.equal(provisionalExplanationInput(topic.gradeId, topic.subjectId, topic.id, "subtema-inventado"), null);
  }
});

test("respuesta Gemini provisional usa solo fragmentos de la fuente y no se marca aprobada", async () => {
  const input = provisionalExplanationInput("G10", "MAT", "G10-MAT", "razón trigonométrica");
  assert.ok(input);
  const expected = { topicId: input.topicId, subskillId: input.subskillId,
    sourceVersion: input.sourceVersion, explanation: input.explanation, example: input.example };
  const valid = validateProvisionalExplanation(expected, input);
  assert.equal(valid?.provisional, true);
  assert.equal("approvalEvidenceId" in valid, false);
  assert.equal(validateProvisionalExplanation({ ...expected, explanation: "Texto nuevo no presente en la fuente." }, input), null);
  assert.equal(validateProvisionalExplanation({ ...expected, subskillId: "otro" }, input), null);

  let calls = 0;
  const deps = { enabled: true, consumeQuota: () => true,
    provider: async (received) => { calls += 1; assert.equal(received.sourceStatus, "provisional"); return expected; } };
  const response = await handleProvisionalExplanationRequest(request({ gradeId: "G10", subjectId: "MAT", topicId: "G10-MAT", subskillId: "razón trigonométrica" }), deps);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provisional, true);
  assert.equal(calls, 1);

  const injected = await handleProvisionalExplanationRequest(request({ gradeId: "G10", subjectId: "MAT", topicId: "G10-MAT", subskillId: "razón trigonométrica", studentName: "Falso" }), deps);
  assert.equal(injected.status, 400);
  assert.equal(calls, 1);
  const invalid = await handleProvisionalExplanationRequest(request({ gradeId: "G10", subjectId: "MAT", topicId: "G10-MAT", subskillId: "tema ajeno" }), deps);
  assert.equal(invalid.status, 400);
  assert.equal(calls, 1);
});

test("proveedor caído deja la explicación local y ruta deshabilitada no consume cuota", async () => {
  const body = { gradeId: "G10", subjectId: "MAT", topicId: "G10-MAT", subskillId: "razón trigonométrica" };
  let calls = 0;
  const disabled = await handleProvisionalExplanationRequest(request(body), { enabled: false,
    consumeQuota: () => { calls += 1; return true; }, provider: async () => { throw new Error("secreto"); } });
  assert.equal(disabled.status, 503);
  assert.equal(calls, 0);
  const failed = await handleProvisionalExplanationRequest(request(body), { enabled: true,
    consumeQuota: () => true, provider: async () => { throw new Error("secreto"); } });
  assert.equal(failed.status, 503);
  assert.equal(JSON.stringify(await failed.json()).includes("secreto"), false);
});
