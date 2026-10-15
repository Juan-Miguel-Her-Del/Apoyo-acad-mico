import test from "node:test";
import assert from "node:assert/strict";
import { evaluateShortCheck, prepareShortCheck, updateRating } from "../src/lib/explanation-followup.ts";

const source = {
  id: "q-1", explanationId: "explanation-v1:topic-1", prompt: "¿Cuánto es 1/2 + 1/4?",
  referenceAnswer: "3/4", validation: "demo-unreviewed",
};

test("la pregunta breve pertenece a la explicación mostrada y requiere solución", () => {
  const ready = prepareShortCheck(source, source.explanationId);
  assert.equal(ready.status, "ready");
  assert.equal(prepareShortCheck(source, "otra-explicacion").status, "invalid-source");
  const withoutSolution = prepareShortCheck({ ...source, referenceAnswer: null }, source.explanationId);
  assert.equal(withoutSolution.status, "missing-reference");
  assert.deepEqual(evaluateShortCheck(withoutSolution, "3/4"), { status: "missing-reference" });
});

test("la comparación breve usa la solución y no inventa una calificación", () => {
  const ready = prepareShortCheck(source, source.explanationId);
  assert.deepEqual(evaluateShortCheck(ready, " 3/4 "), { status: "correct" });
  assert.deepEqual(evaluateShortCheck(ready, "2/4"), { status: "incorrect", referenceAnswer: "3/4" });
  assert.deepEqual(evaluateShortCheck(ready, ""), { status: "invalid-answer" });
  assert.deepEqual(evaluateShortCheck(ready, "a".repeat(201)), { status: "invalid-answer" });
});

test("una segunda valoración actualiza la de la misma explicación", () => {
  const first = updateRating(null, source.explanationId, "helped");
  const second = updateRating(first, source.explanationId, "confused");
  assert.deepEqual(second, { explanationId: source.explanationId, value: "confused" });
  assert.equal(updateRating(second, "", "helped"), second);
});
