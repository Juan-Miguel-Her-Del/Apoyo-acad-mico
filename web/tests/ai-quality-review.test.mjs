import test from "node:test";
import assert from "node:assert/strict";
import { auditAiReviews, PILOT_TOPICS } from "../src/lib/ai-quality-review.ts";

function synthetic(topicId, kind, index) {
  return { topicId, caseId: `synthetic-${index}`, kind,
    sourceVersion: "source-test", sourceStatus: "reviewed", promptVersion: "prompt-test", model: "model-test",
    input: "Entrada sintética", output: "Salida sintética", reviewer: "Revisor sintético",
    reviewedAt: "2026-10-19T12:00:00Z", scores: { accuracy: 4, gradeFit: 4, clarity: 4, safety: 4, sourceFidelity: 4 },
    severity: "none", decision: "accept", findings: "Sin defecto en este caso sintético" };
}

test("auditoría exige tres salidas por combinación, error del estudiante y caso límite", () => {
  assert.equal(auditAiReviews([]).reviewGatePassed, false);
  const records = PILOT_TOPICS.flatMap((topicId) => ["normal", "wrong-answer", "boundary"].map((kind, index) => synthetic(topicId, kind, index)));
  assert.equal(auditAiReviews(records).reviewed, 18);
  assert.equal(auditAiReviews(records).reviewGatePassed, true);
  assert.equal(auditAiReviews(records.filter((item) => item.kind !== "boundary")).reviewGatePassed, false);
  assert.equal(auditAiReviews([...records, records[0]]).invalid.length, 1);
});

test("fallo grave o decisión de corrección bloquea publicación aunque haya cobertura", () => {
  const records = PILOT_TOPICS.flatMap((topicId) => ["normal", "wrong-answer", "boundary"].map((kind, index) => synthetic(topicId, kind, index)));
  records[0].severity = "critical";
  records[0].decision = "block";
  assert.equal(auditAiReviews(records).reviewGatePassed, false);
  assert.deepEqual(auditAiReviews(records).blockers, ["G05-MAT:synthetic-0"]);
});

test("una fuente provisional bloquea la puerta aunque las 18 salidas tengan puntuación alta", () => {
  const records = PILOT_TOPICS.flatMap((topicId) => ["normal", "wrong-answer", "boundary"].map((kind, index) => synthetic(topicId, kind, index)));
  records[0].sourceStatus = "provisional";
  assert.equal(auditAiReviews(records).reviewGatePassed, false);
  assert.deepEqual(auditAiReviews(records).blockers, ["G05-MAT:synthetic-0"]);
});
