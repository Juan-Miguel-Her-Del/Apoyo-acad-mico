import test from "node:test";
import assert from "node:assert/strict";
import { diagnosticSkillInsights } from "../src/lib/diagnostic-analysis.ts";

const questions = Array.from({ length: 4 }, (_, index) => ({ id: `q${index + 1}`, skill: "fracciones" }));
const answer = (questionId, correct) => ({ questionId, correct });

test("sin respuestas o con una sola respuesta no declara fortaleza ni porcentaje", () => {
  const empty = diagnosticSkillInsights(questions, []);
  assert.deepEqual(empty.skills, []);
  assert.deepEqual(empty.strengths, []);
  const one = diagnosticSkillInsights(questions, [answer("q1", true)]);
  assert.equal(one.skills[0].confidence, null);
  assert.equal(one.skills[0].confidenceLevel, "insuficiente");
  assert.equal(one.skills[0].strength, false);
  assert.deepEqual(one.strengths, []);
});

test("dos aciertos muestran fortaleza observada y confianza reproducible de 50 %", () => {
  const result = diagnosticSkillInsights(questions, [answer("q1", true), answer("q2", true)]);
  assert.equal(result.skills[0].confidence, 50);
  assert.equal(result.skills[0].confidenceLevel, "media");
  assert.equal(result.skills[0].strength, true);
  assert.deepEqual(result.strengths.map(({ skill }) => skill), ["fracciones"]);
});

test("dos errores indican dificultad; un resultado mixto queda indeterminado con confianza 0", () => {
  const errors = diagnosticSkillInsights(questions, [answer("q1", false), answer("q2", false)]);
  assert.equal(errors.skills[0].status, "dificultad-demo");
  assert.equal(errors.skills[0].confidence, 50);
  assert.equal(errors.skills[0].strength, false);
  const mixed = diagnosticSkillInsights(questions, [answer("q1", true), answer("q2", false)]);
  assert.equal(mixed.skills[0].status, "indeterminado");
  assert.equal(mixed.skills[0].confidence, 0);
  assert.equal(mixed.skills[0].confidenceLevel, "baja");
  assert.deepEqual(mixed.strengths, []);
});

test("cuatro respuestas elevan confianza cuando la señal es uniforme y bajan si es inconsistente", () => {
  const allCorrect = diagnosticSkillInsights(questions, questions.map((item) => answer(item.id, true)));
  assert.equal(allCorrect.skills[0].confidence, 67);
  assert.equal(allCorrect.skills[0].strength, true);
  const inconsistent = diagnosticSkillInsights(questions, [true, true, true, false].map((correct, index) => answer(questions[index].id, correct)));
  assert.equal(inconsistent.skills[0].confidence, 33);
  assert.equal(inconsistent.skills[0].strength, false);
});

test("no cuenta duplicados ni respuestas ajenas al banco", () => {
  const result = diagnosticSkillInsights(questions, [answer("q1", true), answer("q1", false), answer("extra", true), answer("q2", true)]);
  assert.equal(result.skills[0].answered, 2);
  assert.equal(result.skills[0].correct, 2);
  assert.equal(result.skills[0].confidence, 50);
  assert.deepEqual(result.unmappedQuestionIds, ["extra"]);
});
