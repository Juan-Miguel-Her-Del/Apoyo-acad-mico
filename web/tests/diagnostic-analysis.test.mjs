import test from "node:test";
import assert from "node:assert/strict";
import { analyzeDemoSkills } from "../src/lib/diagnostic-analysis.ts";

const questions = [
  { id: "q1", skill: "fracciones" },
  { id: "q2", skill: "fracciones" },
  { id: "q3", skill: "equivalencias" },
];

test("clasifica solo evidencia suficiente y deja una pregunta aislada indeterminada", () => {
  const result = analyzeDemoSkills(questions, [
    { questionId: "q1", correct: false },
    { questionId: "q2", correct: false },
    { questionId: "q3", correct: false },
  ]);
  assert.deepEqual(result.results.map(({ skill, status, questionIds }) => ({ skill, status, questionIds })), [
    { skill: "fracciones", status: "dificultad-demo", questionIds: ["q1", "q2"] },
    { skill: "equivalencias", status: "indeterminado", questionIds: ["q3"] },
  ]);
  assert.deepEqual(result.unmappedQuestionIds, []);
});

test("distingue aciertos completos de resultado mixto sin inventar dominio", () => {
  const allCorrect = analyzeDemoSkills(questions.slice(0, 2), [{ questionId: "q1", correct: true }, { questionId: "q2", correct: true }]);
  assert.equal(allCorrect.results[0].status, "sin-senal-demo");
  const mixed = analyzeDemoSkills(questions.slice(0, 2), [{ questionId: "q1", correct: true }, { questionId: "q2", correct: false }]);
  assert.equal(mixed.results[0].status, "indeterminado");
});

test("excluye preguntas sin vínculo y respuestas ajenas; no duplica un reintento", () => {
  const result = analyzeDemoSkills([{ id: "q1", skill: "fracciones" }, { id: "q2", skill: " " }], [
    { questionId: "q1", correct: false },
    { questionId: "q1", correct: false },
    { questionId: "q2", correct: false },
    { questionId: "desconocida", correct: false },
  ]);
  assert.equal(result.results[0].answered, 1);
  assert.equal(result.results[0].status, "indeterminado");
  assert.deepEqual(result.unmappedQuestionIds, ["q2", "desconocida"]);
});
