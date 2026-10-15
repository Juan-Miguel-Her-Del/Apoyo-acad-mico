import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/lib/catalog.ts";
import { checkStudyAnswer, getStudyDemo } from "../src/lib/study-demo.ts";

test("las 26 combinaciones tienen explicación, ejemplo y pregunta con respuesta definida", () => {
  assert.equal(topics.length, 26);
  for (const topic of topics) {
    const lesson = getStudyDemo(topic.gradeId, topic.subjectId, topic.id);
    assert.ok(lesson, topic.id);
    assert.equal(lesson.title, topic.name);
    assert.equal(lesson.provisional, true);
    assert.ok(lesson.explanation.length > 35, topic.id);
    assert.ok(lesson.example.length > 20, topic.id);
    assert.ok(lesson.question.prompt.length > 10, topic.id);
    assert.equal(lesson.question.options.length, 3, topic.id);
    assert.equal(new Set(lesson.question.options).size, 3, topic.id);
    assert.ok(lesson.question.feedback.length > 10, topic.id);
    const correct = checkStudyAnswer(lesson, lesson.question.correctIndex);
    assert.deepEqual(correct, { correct: true, feedback: lesson.question.feedback });
    for (const index of [0, 1, 2]) {
      assert.equal(checkStudyAnswer(lesson, index)?.correct, index === lesson.question.correctIndex, topic.id);
    }
  }
});

test("no mezcla un tema con otro grado o materia ni acepta respuestas inválidas", () => {
  assert.equal(getStudyDemo("G05", "ESP", "G05-MAT"), null);
  assert.equal(getStudyDemo("G05", "FIS", "G10-FIS"), null);
  assert.equal(getStudyDemo("G12", "MAT", "G12-MAT"), null);
  const lesson = getStudyDemo("G10", "QUI", "G10-QUI");
  assert.ok(lesson);
  for (const value of [-1, 3, 1.5, Number.NaN]) assert.equal(checkStudyAnswer(lesson, value), null);
});
