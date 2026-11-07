import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { topics } from "../src/lib/catalog.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { getAdaptiveDiagnosticBank } from "../src/lib/diagnostic-adaptive.ts";
import { handleProvisionalExplanationRequest } from "../src/lib/provisional-explanation-http.ts";
import { provisionalExplanationInput, validateProvisionalExplanation } from "../src/lib/provisional-explanation.ts";
import { openExplanationReviewStore } from "../src/lib/explanation-review.ts";

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

test("el subtema del diagnóstico guardado también recibe explicación y rechaza uno ajeno", async () => {
  for (const topic of topics.filter((item) => item.active && item.pilotCandidate)) {
    const bank = getAdaptiveDiagnosticBank(topic.gradeId, topic.subjectId, topic.id);
    for (const skillId of new Set(bank.map((question) => question.skill))) {
      assert.ok(provisionalExplanationInput(topic.gradeId, topic.subjectId, topic.id, skillId),
        `${topic.id}: ${skillId}`);
    }
  }
  const skill = getAdaptiveDiagnosticBank("G10", "MAT", "G10-MAT")[0].skill;
  const input = provisionalExplanationInput("G10", "MAT", "G10-MAT", skill);
  assert.ok(input);
  assert.equal(input.subskillId, skill);
  const response = await handleProvisionalExplanationRequest(request({ gradeId: "G10", subjectId: "MAT",
    topicId: "G10-MAT", subskillId: skill }), { enabled: true, consumeQuota: () => true,
    provider: async (source) => ({ topicId: source.topicId, subskillId: source.subskillId,
      sourceVersion: source.sourceVersion, explanation: source.explanation, example: source.example }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).subskillId, skill);
  assert.equal(provisionalExplanationInput("G05", "MAT", "G05-MAT", skill), null);
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
  const invented = await handleProvisionalExplanationRequest(request(body), { enabled: true,
    consumeQuota: () => true, provider: async (source) => ({ topicId: source.topicId,
      subskillId: source.subskillId, sourceVersion: source.sourceVersion,
      explanation: "Esta explicación fue inventada por el proveedor y no está en la fuente.",
      example: source.example }) });
  assert.equal(invented.status, 503);
  assert.equal(JSON.stringify(await invented.json()).includes("Esta explicación fue inventada"), false);
});

test("salida provisional inválida se bloquea y registra solo metadatos de revisión", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "apoyo-provisional-review-"));
  const store = openExplanationReviewStore(path.join(directory, "review.sqlite"));
  try {
    const input = provisionalExplanationInput("G10", "MAT", "G10-MAT", "razón trigonométrica", 1);
    assert.ok(input);
    const response = await handleProvisionalExplanationRequest(request({
      gradeId: input.gradeId, subjectId: input.subjectId, topicId: input.topicId,
      subskillId: input.subskillId, exampleIndex: 1,
    }), { enabled: true, consumeQuota: () => true, review: (event) => store.record(event),
      provider: async (source) => ({ topicId: source.topicId, subskillId: source.subskillId,
        sourceVersion: source.sourceVersion, explanation: source.explanation,
        example: "Un ejemplo inventado que no pertenece a la fuente." }) });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.includes("ejemplo inventado"), false);
    const rows = store.list();
    assert.equal(rows.length, 1);
    assert.deepEqual({ topicId: rows[0].topicId, subskillId: rows[0].subskillId,
      sourceVersion: rows[0].sourceVersion, exampleIndex: rows[0].exampleIndex,
      reason: rows[0].reason }, {
      topicId: input.topicId, subskillId: input.subskillId,
      sourceVersion: input.sourceVersion, exampleIndex: 1,
      reason: "invalid_provider_response",
    });
    assert.equal(JSON.stringify(rows).includes("ejemplo inventado"), false);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("seis temas piloto ofrecen un segundo ejemplo distinto; sin alternativa no llama a Gemini", async () => {
  for (const topicId of ["G05-MAT", "G05-ESP", "G10-MAT", "G10-ESP", "G10-FIS", "G10-QUI"]) {
    const gradeId = topicId.slice(0, 3);
    const subjectId = topicId.slice(4);
    const diagnostic = getDiagnostic(gradeId, subjectId, topicId, "demo");
    const subskillId = diagnostic.questions[0].skill;
    const first = provisionalExplanationInput(gradeId, subjectId, topicId, subskillId);
    const second = provisionalExplanationInput(gradeId, subjectId, topicId, subskillId, 1);
    assert.ok(first && second, topicId);
    assert.notEqual(first.example, second.example, topicId);
    assert.equal(second.exampleIndex, 1);
    const response = await handleProvisionalExplanationRequest(request({ gradeId, subjectId,
      topicId, subskillId, exampleIndex: 1 }), { enabled: true, consumeQuota: () => true,
      provider: async (input) => ({ topicId: input.topicId, subskillId: input.subskillId,
        sourceVersion: input.sourceVersion, explanation: input.explanation, example: input.example }) });
    assert.equal(response.status, 200, topicId);
    const body = await response.json();
    assert.equal(body.exampleIndex, 1);
    assert.equal(body.hasAnotherExample, false);
    assert.equal(body.example, second.example);
  }
  const missing = { gradeId: "G01", subjectId: "MAT", topicId: "G01-MAT",
    subskillId: getDiagnostic("G01", "MAT", "G01-MAT", "demo").questions[0].skill, exampleIndex: 1 };
  let quotaCalls = 0;
  const absent = await handleProvisionalExplanationRequest(request(missing), { enabled: true,
    consumeQuota: () => { quotaCalls += 1; return true; }, provider: async () => { throw new Error("no debe llamar"); } });
  assert.equal(absent.status, 409);
  assert.equal(quotaCalls, 0);
  assert.match((await absent.json()).error, /No hay otro ejemplo/);
});
