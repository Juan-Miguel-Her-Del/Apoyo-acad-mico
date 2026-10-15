import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { AuthError, openAuthStore } from "../src/lib/auth.ts";
import { topics } from "../src/lib/catalog.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { getPracticeBank, publicPracticeQuestions } from "../src/lib/practice.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-practice-test-"));
  const dbPath = path.join(dir, "practice.sqlite");
  const stores = [];
  t.after(() => { for (const store of stores) store.close(); rmSync(dir, { recursive: true, force: true }); });
  return () => { const store = openAuthStore(dbPath); stores.push(store); return store; };
}

test("26 temas tienen dos preguntas de práctica distintas al diagnóstico, sin clave pública", () => {
  assert.equal(topics.length, 26);
  const ids = new Set();
  for (const topic of topics) {
    const bank = getPracticeBank(topic.gradeId, topic.subjectId, topic.id);
    assert.equal(bank?.length, 2, topic.id);
    assert.notEqual(bank[0].prompt, bank[1].prompt, topic.id);
    const diagnostic = getDiagnostic(topic.gradeId, topic.subjectId, topic.id, "demo");
    assert.equal(diagnostic.status, 200);
    assert.ok(!diagnostic.questions.some((question) => question.prompt === bank[1].prompt), topic.id);
    for (const question of bank) {
      assert.ok(!ids.has(question.id)); ids.add(question.id);
      assert.equal(question.topicId, topic.id);
      assert.ok(question.options.some((option) => option.id === question.correctOptionId));
      assert.ok(question.explanation.length > 0);
      assert.deepEqual(Object.keys(publicPracticeQuestions([question])[0]).sort(), ["id", "options", "prompt"]);
    }
  }
  assert.equal(ids.size, 52);
  assert.equal(getPracticeBank("G05", "FIS", "G05-MAT"), null);
  assert.equal(getPracticeBank("G05", "MAT", "G05-MAT", {}), null, "sin segunda pregunta no debe mezclar otro tema");
});

test("sesión persiste tras reinicio, califica y completa progreso solo con dos respuestas", async (t) => {
  const open = fixture(t);
  const store = open();
  const { user } = await store.register({ email: "practice@example.test", password: "clave-segura-123", adultConfirmed: true });
  const started = store.startPractice(user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  assert.equal(started.session.status, "open");
  assert.equal(started.session.answered, 0);
  assert.equal(started.questions.length, 2);
  assert.ok(!("correctOptionId" in started.questions[0]));
  const bank = getPracticeBank("G05", "MAT", "G05-MAT");
  const first = store.answerPractice(user.id, { sessionId: started.session.id, questionId: bank[0].id, optionId: bank[0].correctOptionId });
  assert.equal(first.feedback.correct, true);
  assert.equal(first.session.answered, 1);
  assert.deepEqual(store.listProgress(user.id), []);
  const reopened = open();
  const resumed = reopened.getPracticeSession(user.id, started.session.id);
  assert.equal(resumed.answers.length, 1);
  assert.equal(resumed.answers[0].correctOptionId, bank[0].correctOptionId);
  assert.equal(resumed.session.status, "open");
  const wrong = bank[1].options.find((option) => option.id !== bank[1].correctOptionId);
  const second = reopened.answerPractice(user.id, { sessionId: started.session.id, questionId: bank[1].id, optionId: wrong.id });
  assert.equal(second.feedback.correct, false);
  assert.equal(second.session.status, "completed");
  assert.equal(second.session.correctCount, 1);
  assert.ok(second.session.completedAt);
  assert.deepEqual(reopened.listProgress(user.id).map((item) => [item.topicId, item.kind]), [["G05-MAT", "study"]]);
  assert.equal(reopened.getPracticeSession(user.id, started.session.id).answers.length, 2);
  assert.equal(reopened.listPracticeSessions(user.id)[0].id, started.session.id);
});

test("rechaza otra cuenta, opciones inválidas, preguntas ajenas, duplicados y sesión cerrada sin mutar", async (t) => {
  const open = fixture(t);
  const store = open();
  const a = await store.register({ email: "a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await store.register({ email: "b@example.test", password: "clave-segura-123", adultConfirmed: true });
  const started = store.startPractice(a.user.id, { gradeId: "G01", subjectId: "ESP", topicId: "G01-ESP" });
  const bank = getPracticeBank("G01", "ESP", "G01-ESP");
  const fail = (operation, status) => assert.throws(operation, (error) => error instanceof AuthError && error.status === status);
  fail(() => store.getPracticeSession(b.user.id, started.session.id), 404);
  fail(() => store.answerPractice(b.user.id, { sessionId: started.session.id, questionId: bank[0].id, optionId: "a" }), 404);
  fail(() => store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: "practice-g05-mat-01", optionId: "a" }), 400);
  fail(() => store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: bank[0].id, optionId: "z" }), 400);
  fail(() => store.startPractice(a.user.id, { gradeId: "G01", subjectId: "FIS", topicId: "G01-ESP" }), 400);
  assert.equal(store.getPracticeSession(a.user.id, started.session.id).session.answered, 0);
  store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: bank[0].id, optionId: "a" });
  fail(() => store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: bank[0].id, optionId: "a" }), 409);
  store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: bank[1].id, optionId: "a" });
  fail(() => store.answerPractice(a.user.id, { sessionId: started.session.id, questionId: bank[1].id, optionId: "a" }), 409);
  fail(() => store.saveProgress(b.user.id, { gradeId: "G01", subjectId: "ESP", topicId: "G01-ESP", kind: "study", completed: true }), 400);
  assert.deepEqual(store.listProgress(b.user.id), []);
  assert.deepEqual(store.listPracticeSessions(b.user.id), []);
  assert.equal(store.listPracticeSessions(a.user.id).length, 1);
  store.disableUser(a.user.id);
  fail(() => store.getPracticeSession(a.user.id, started.session.id), 401);
});
