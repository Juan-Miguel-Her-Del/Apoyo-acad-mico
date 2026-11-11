import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/lib/catalog.ts";
import {
  getAdaptiveDiagnosticBank,
  selectNextDiagnosticQuestion,
} from "../src/lib/diagnostic-adaptive.ts";

function question(id, difficulty) {
  return {
    id,
    prompt: `Pregunta ${id}`,
    options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
    skill: "test:skill",
    difficulty,
    correctOptionId: "a",
    provisional: true,
  };
}

const bank = [question("easy-1", 1), question("easy-2", 1), question("hard-1", 2), question("hard-2", 2)];

test("26 temas tienen un banco diagnóstico provisional con dos niveles e IDs propios", () => {
  const ids = new Set();
  for (const topic of topics) {
    const questions = getAdaptiveDiagnosticBank(topic.gradeId, topic.subjectId, topic.id);
    assert.equal(questions?.length, 6, topic.id);
    assert.deepEqual(questions.map((item) => item.difficulty).sort(), [1, 1, 1, 1, 2, 2], topic.id);
    for (const item of questions) {
      assert.equal(item.provisional, true);
      assert.ok(item.id.startsWith("diagnostic-"));
      assert.equal(ids.has(item.id), false, item.id);
      assert.ok(item.options.some((option) => option.id === item.correctOptionId));
      ids.add(item.id);
    }
  }
  assert.equal(ids.size, 312);
  assert.equal(getAdaptiveDiagnosticBank("G05", "FIS", "G05-MAT"), null);
  assert.equal(getAdaptiveDiagnosticBank("G12", "MAT", "G12-MAT"), null);
});

test("cada tema admite cuatro preguntas distintas tanto con aciertos como con errores", () => {
  for (const topic of topics) {
    const questions = getAdaptiveDiagnosticBank(topic.gradeId, topic.subjectId, topic.id);
    for (const correct of [true, false]) {
      const answers = [];
      for (let turn = 0; turn < 4; turn++) {
        const next = selectNextDiagnosticQuestion({ questions, answers });
        assert.equal(next.status, "selected", `${topic.id}, turno ${turn}, correct=${correct}`);
        answers.push({ questionId: next.question.id, correct });
      }
      assert.equal(new Set(answers.map((answer) => answer.questionId)).size, 4, topic.id);
    }
  }
});

test("sube al acertar, baja al errar y respeta ambos límites", () => {
  const first = selectNextDiagnosticQuestion({ questions: bank, answers: [] });
  assert.deepEqual([first.status, first.question.id, first.requestedDifficulty], ["selected", "easy-1", 1]);

  const second = selectNextDiagnosticQuestion({
    questions: bank, answers: [{ questionId: "easy-1", correct: true }],
  });
  assert.deepEqual([second.question.id, second.requestedDifficulty, second.fallback], ["hard-1", 2, false]);

  const third = selectNextDiagnosticQuestion({
    questions: bank,
    answers: [{ questionId: "easy-1", correct: true }, { questionId: "hard-1", correct: false }],
  });
  assert.deepEqual([third.question.id, third.requestedDifficulty], ["easy-2", 1]);

  const atTop = selectNextDiagnosticQuestion({
    questions: bank, answers: [{ questionId: "hard-1", correct: true }],
  });
  assert.equal(atTop.requestedDifficulty, 2);
  assert.equal(atTop.question.id, "hard-2");

  const atBottom = selectNextDiagnosticQuestion({
    questions: bank, answers: [{ questionId: "easy-1", correct: false }],
  });
  assert.equal(atBottom.requestedDifficulty, 1);
  assert.equal(atBottom.question.id, "easy-2");
});

test("sin pregunta del nivel solicitado, usa otro nivel sin repetir", () => {
  const selected = selectNextDiagnosticQuestion({
    questions: bank,
    answers: [
      { questionId: "easy-1", correct: true },
      { questionId: "hard-1", correct: true },
      { questionId: "hard-2", correct: true },
    ],
  });
  assert.deepEqual([selected.status, selected.question.id, selected.requestedDifficulty, selected.selectedDifficulty, selected.fallback],
    ["selected", "easy-2", 2, 1, true]);
  assert.deepEqual(selectNextDiagnosticQuestion({
    questions: bank,
    answers: bank.map((item) => ({ questionId: item.id, correct: true })),
  }), { status: "exhausted", reason: "bank-exhausted" });
  assert.deepEqual(selectNextDiagnosticQuestion({ questions: [], answers: [] }),
    { status: "exhausted", reason: "bank-exhausted" });
});

test("rechaza datos corruptos en vez de elegir una pregunta o resultado ficticio", () => {
  assert.throws(() => selectNextDiagnosticQuestion({ questions: bank, answers: [], startDifficulty: 3 }), RangeError);
  assert.throws(() => selectNextDiagnosticQuestion({ questions: [...bank, question("easy-1", 2)], answers: [] }), /Banco/);
  assert.throws(() => selectNextDiagnosticQuestion({ questions: [question("bad", 3)], answers: [] }), /Banco/);
  assert.throws(() => selectNextDiagnosticQuestion({ questions: bank, answers: [{ questionId: "not-in-bank", correct: true }] }), /Historial/);
  assert.throws(() => selectNextDiagnosticQuestion({ questions: bank,
    answers: [{ questionId: "easy-1", correct: true }, { questionId: "easy-1", correct: false }] }), /Historial/);
});
