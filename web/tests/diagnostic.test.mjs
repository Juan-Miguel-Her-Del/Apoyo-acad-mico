import test from "node:test";
import assert from "node:assert/strict";
import { createDiagnosticReader, evaluateDemoAnswer, getDiagnostic } from "../src/lib/diagnostic.ts";
import { topics } from "../src/lib/catalog.ts";

test("las 26 combinaciones ofrecen dos preguntas demo únicas y sin soluciones en GET", () => {
  const allQuestionIds = new Set();
  for (const topic of topics) {
    const result = getDiagnostic(topic.gradeId, topic.subjectId, topic.id, "demo");
    assert.equal(result.status, 200);
    assert.equal(result.questions.length, 2, topic.id);
    assert.equal(new Set(result.questions.map((question) => question.id)).size, 2);
    assert.ok(result.questions.every((question) => question.options.length === 3));
    assert.ok(result.questions.every((question) => typeof question.skill === "string" && question.skill.length > 0));
    assert.ok(result.questions.every((question) => !("correctOptionId" in question) && !("explanation" in question)));
    for (const question of result.questions) {
      assert.equal(allQuestionIds.has(question.id), false, question.id);
      allQuestionIds.add(question.id);
      for (const option of question.options) {
        const evaluated = evaluateDemoAnswer(topic.gradeId, topic.subjectId, topic.id, question.id, option.id);
        assert.equal(evaluated.status, 200);
        assert.ok(evaluated.explanation.length > 0);
        assert.ok(question.options.some((candidate) => candidate.id === evaluated.correctOptionId));
      }
    }
  }
  assert.equal(allQuestionIds.size, 104);
});

test("no permite combinaciones cruzadas, grado desconocido ni modo desconocido", () => {
  assert.equal(getDiagnostic("G05", "FIS", "G10-FIS", "demo").status, 400);
  assert.equal(getDiagnostic("G12", "MAT", "G12-MAT", "demo").status, 400);
  assert.equal(getDiagnostic("G05", "MAT", "G05-ESP", "demo").status, 400);
  assert.equal(getDiagnostic("G05", "MAT", "G05-MAT", "other").status, 400);
});

test("el modo publicado permanece bloqueado sin aprobación curricular", () => {
  const result = getDiagnostic("G05", "MAT", "G05-MAT", "published");
  assert.equal(result.status, 409);
  assert.match(result.error, /aprobado/);
  assert.equal("questions" in result, false);
});

test("un tema piloto sin preguntas demo devuelve estado vacío sin resultado ni publicar contenido", () => {
  const readEmptyBank = createDiagnosticReader([]);
  const empty = readEmptyBank("G05", "MAT", "G05-MAT", "demo");
  assert.equal(empty.status, 409);
  assert.match(empty.error, /no hay preguntas de demostración/);
  assert.equal("questions" in empty, false);
  assert.equal("correct" in empty, false);
  const published = readEmptyBank("G05", "MAT", "G05-MAT", "published");
  assert.equal(published.status, 409);
  assert.equal("questions" in published, false);
  assert.equal(getDiagnostic("G05", "MAT", "G05-MAT", "demo").status, 200);
});

test("solo evalúa una opción existente de la pregunta y tema enviados", () => {
  assert.equal(evaluateDemoAnswer("G05", "MAT", "G05-MAT", "demo-g05-mat-01", "b").correct, true);
  assert.equal(evaluateDemoAnswer("G05", "MAT", "G05-MAT", "demo-g05-mat-01", "a").correct, false);
  assert.equal(evaluateDemoAnswer("G05", "MAT", "G05-MAT", "demo-g05-esp-01", "a").status, 400);
  assert.equal(evaluateDemoAnswer("G05", "MAT", "G05-MAT", "demo-g05-mat-01", "").status, 400);
  assert.equal(evaluateDemoAnswer("G05", "MAT", "G05-MAT", "demo-g05-mat-01", "z").status, 400);
});
