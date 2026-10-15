import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { AuthError, openAuthStore } from "../src/lib/auth.ts";
import { topics } from "../src/lib/catalog.ts";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { getPracticeBank, practiceBankCoverage, publicPracticeQuestions } from "../src/lib/practice.ts";
import { comparePracticeSessions } from "../src/lib/practice-history.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-practice-test-"));
  const dbPath = path.join(dir, "practice.sqlite");
  const stores = [];
  t.after(() => { for (const store of stores) store.close(); rmSync(dir, { recursive: true, force: true }); });
  return () => { const store = openAuthStore(dbPath); stores.push(store); return store; };
}

test("26 temas tienen seis preguntas provisionales, dos niveles y dos subtemas, sin clave pública", () => {
  assert.equal(topics.length, 26);
  const ids = new Set();
  for (const topic of topics) {
    const bank = getPracticeBank(topic.gradeId, topic.subjectId, topic.id);
    assert.equal(bank?.length, 6, topic.id);
    assert.notEqual(bank[0].prompt, bank[1].prompt, topic.id);
    assert.equal(new Set(bank.map((question) => question.prompt)).size, 6, topic.id);
    assert.equal(new Set(bank.map((question) => question.skillId)).size, 2, topic.id);
    assert.deepEqual(practiceBankCoverage(topic.gradeId, topic.subjectId, topic.id).byDifficulty, { 1: 4, 2: 2 });
    assert.equal(practiceBankCoverage(topic.gradeId, topic.subjectId, topic.id).sufficientForTwoDistinctRounds, true);
    const diagnostic = getDiagnostic(topic.gradeId, topic.subjectId, topic.id, "demo");
    assert.equal(diagnostic.status, 200);
    assert.ok(!diagnostic.questions.some((question) => question.prompt === bank[1].prompt), topic.id);
    for (const question of bank) {
      assert.ok(!ids.has(question.id)); ids.add(question.id);
      assert.equal(question.topicId, topic.id);
      assert.ok(question.options.some((option) => option.id === question.correctOptionId));
      assert.ok(question.explanation.length > 0);
      assert.deepEqual(Object.keys(publicPracticeQuestions([question])[0]).sort(), ["difficulty", "id", "options", "prompt", "skillId"]);
    }
  }
  assert.equal(ids.size, 156);
  assert.equal(getPracticeBank("G05", "FIS", "G05-MAT"), null);
  assert.equal(getPracticeBank("G05", "MAT", "G05-MAT", {}), null, "sin segunda pregunta no debe mezclar otro tema");
  const shortBank = getPracticeBank("G05", "MAT", "G05-MAT").slice(0, 3);
  const insufficient = practiceBankCoverage("G05", "MAT", "G05-MAT", shortBank);
  assert.equal(insufficient.total, 3);
  assert.equal(insufficient.sufficientForTwoDistinctRounds, false);
  assert.equal(practiceBankCoverage("G05", "MAT", "G05-MAT", null).sufficientForTwoDistinctRounds, false);
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

test("finalizar sin respuestas conserva resumen vacío, es idempotente y bloquea respuestas tardías", async (t) => {
  const store = fixture(t)();
  const { user } = await store.register({ email: "empty@example.test", password: "clave-segura-123", adultConfirmed: true });
  const other = await store.register({ email: "other@example.test", password: "clave-segura-123", adultConfirmed: true });
  const started = store.startPractice(user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  assert.throws(() => store.finishPractice(other.user.id, { sessionId: started.session.id }), (error) => error instanceof AuthError && error.status === 404);
  const finished = store.finishPractice(user.id, { sessionId: started.session.id });
  assert.equal(finished.status, "completed");
  assert.equal(finished.answered, 0);
  assert.equal(finished.correctCount, 0);
  assert.equal(store.finishPractice(user.id, { sessionId: started.session.id }).completedAt, finished.completedAt);
  const first = getPracticeBank("G05", "MAT", "G05-MAT")[0];
  assert.throws(() => store.answerPractice(user.id, { sessionId: started.session.id, questionId: first.id, optionId: first.correctOptionId }),
    (error) => error instanceof AuthError && error.status === 409);
  assert.deepEqual(store.listProgress(user.id), []);
  assert.deepEqual(store.listPracticeSessions(other.user.id), []);
});

test("la comparación usa solo intentos respondidos del mismo tema", async (t) => {
  const store = fixture(t)();
  const { user } = await store.register({ email: "compare@example.test", password: "clave-segura-123", adultConfirmed: true });
  const bank = getPracticeBank("G05", "MAT", "G05-MAT");
  const first = store.startPractice(user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  for (const selected of first.questions) {
    const question = bank.find((item) => item.id === selected.id);
    store.answerPractice(user.id, { sessionId: first.session.id, questionId: question.id, optionId: question.correctOptionId });
  }
  const otherTopic = store.startPractice(user.id, { gradeId: "G05", subjectId: "ESP", topicId: "G05-ESP" });
  store.finishPractice(user.id, { sessionId: otherTopic.session.id });
  const second = store.startPractice(user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  for (const selected of second.questions) {
    const question = bank.find((item) => item.id === selected.id);
    const wrong = question.options.find((option) => option.id !== question.correctOptionId);
    store.answerPractice(user.id, { sessionId: second.session.id, questionId: question.id, optionId: wrong.id });
  }
  const items = store.listPracticeSessions(user.id);
  const comparison = comparePracticeSessions(items, "G05-MAT");
  assert.equal(comparison.status, "ready");
  assert.equal(comparison.deltaPoints, -100);
  assert.equal(comparison.latest.id, second.session.id);
  assert.equal(comparison.previous.id, first.session.id);
  assert.equal(comparePracticeSessions(items, "G05-ESP").status, "insufficient");
  assert.equal(comparePracticeSessions(items, "G10-FIS").status, "insufficient");
});

test("rondas nuevas evitan repetición inmediata y suben de nivel tras dos aciertos", async (t) => {
  const open = fixture(t);
  const store = open();
  const { user } = await store.register({ email: "rounds@example.test", password: "clave-segura-123", adultConfirmed: true });
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  const bank = getPracticeBank(selection.gradeId, selection.subjectId, selection.topicId);
  const first = store.startPractice(user.id, selection);
  assert.deepEqual(first.questions.map((question) => question.difficulty), [1, 1]);
  assert.throws(() => store.startPractice(user.id, selection),
    (error) => error instanceof AuthError && error.status === 409);
  const firstIds = new Set(first.questions.map((question) => question.id));
  for (const selected of first.questions) {
    const question = bank.find((item) => item.id === selected.id);
    store.answerPractice(user.id, { sessionId: first.session.id, questionId: question.id, optionId: question.correctOptionId });
  }
  const second = store.startPractice(user.id, selection);
  assert.equal(second.session.targetDifficulty, 2);
  assert.deepEqual(second.questions.map((question) => question.difficulty), [2, 2]);
  assert.ok(second.questions.every((question) => !firstIds.has(question.id)));
  assert.equal(store.getPracticeSession(user.id, first.session.id).session.correctCount, 2);
  const restarted = open();
  assert.deepEqual(restarted.getPracticeSession(user.id, second.session.id).questions, second.questions);
  for (const selected of second.questions) {
    const question = bank.find((item) => item.id === selected.id);
    restarted.answerPractice(user.id, { sessionId: second.session.id, questionId: question.id, optionId: question.correctOptionId });
  }
  assert.throws(() => restarted.startPractice(user.id, selection),
    (error) => error instanceof AuthError && error.status === 409 && /nivel 2/.test(error.message));
  assert.equal(restarted.listPracticeSessions(user.id).length, 2, "el error no crea una ronda incompleta");
  assert.equal(restarted.getPracticeSession(user.id, second.session.id).session.status, "completed");
});

test("si falla, otra ronda permanece en nivel 1 y usa otras preguntas", async (t) => {
  const store = fixture(t)();
  const { user } = await store.register({ email: "retry@example.test", password: "clave-segura-123", adultConfirmed: true });
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  const first = store.startPractice(user.id, selection);
  const firstIds = new Set(first.questions.map((question) => question.id));
  store.finishPractice(user.id, { sessionId: first.session.id });
  const second = store.startPractice(user.id, selection);
  assert.equal(second.session.targetDifficulty, 1);
  assert.deepEqual(second.questions.map((question) => question.difficulty), [1, 1]);
  assert.ok(second.questions.every((question) => !firstIds.has(question.id)));
  assert.deepEqual(store.listPracticeSessions(user.id)[1].skills, []);
});

test("migra sesiones antiguas de dos preguntas sin alterar sus respuestas ni mostrar justificación provisional", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-practice-legacy-"));
  let store;
  t.after(() => { store?.close(); rmSync(dir, { recursive: true, force: true }); });
  const dbPath = path.join(dir, "legacy.sqlite");
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`CREATE TABLE practice_sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, grade_id TEXT NOT NULL,
    subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
    status TEXT NOT NULL, total INTEGER NOT NULL,
    started_at TEXT NOT NULL, completed_at TEXT
  );
  CREATE TABLE practice_answers (
    session_id TEXT NOT NULL, question_id TEXT NOT NULL, option_id TEXT NOT NULL,
    correct INTEGER NOT NULL, correct_option_id TEXT NOT NULL,
    explanation TEXT NOT NULL, answered_at TEXT NOT NULL,
    PRIMARY KEY(session_id,question_id)
  );`);
  legacy.close();
  const firstStore = openAuthStore(dbPath);
  const { user } = await firstStore.register({ email: "legacy@example.test", password: "clave-segura-123", adultConfirmed: true });
  const bank = getPracticeBank("G05", "MAT", "G05-MAT");
  const sessionId = "a".repeat(32);
  const connection = new DatabaseSync(dbPath);
  connection.prepare(`INSERT INTO practice_sessions
    (id,user_id,grade_id,subject_id,topic_id,status,total,started_at)
    VALUES (?,?,?,?,?,'open',2,?)`)
    .run(sessionId, user.id, "G05", "MAT", "G05-MAT", new Date().toISOString());
  connection.prepare(`INSERT INTO practice_answers
    (session_id,question_id,option_id,correct,correct_option_id,explanation,answered_at)
    VALUES (?,?,?,?,?,?,?)`)
    .run(sessionId, bank[0].id, bank[0].correctOptionId, 1, bank[0].correctOptionId, bank[0].explanation, new Date().toISOString());
  connection.close();
  firstStore.close();
  store = openAuthStore(dbPath);
  const resumed = store.getPracticeSession(user.id, sessionId);
  assert.deepEqual(resumed.questions.map((question) => question.id), bank.slice(0, 2).map((question) => question.id));
  assert.equal(resumed.session.answered, 1);
  assert.equal(resumed.answers[0].skillId, bank[0].skillId);
  assert.equal(resumed.answers[0].explanation, null);
  assert.equal(resumed.answers[0].explanationStatus, "pending-review");
  const finished = store.answerPractice(user.id, { sessionId, questionId: bank[1].id, optionId: bank[1].correctOptionId });
  assert.equal(finished.session.status, "completed");
  assert.equal(finished.feedback.explanation, null);
});

test("totales por subtema abarcan todo el histórico aunque la lista visual muestre 200 rondas", async (t) => {
  const store = fixture(t)();
  const { user } = await store.register({ email: "all-history@example.test", password: "clave-segura-123", adultConfirmed: true });
  const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" };
  const bank = getPracticeBank(selection.gradeId, selection.subjectId, selection.topicId);
  for (let round = 0; round < 201; round++) {
    const started = store.startPractice(user.id, selection);
    for (const selected of started.questions) {
      const question = bank.find((item) => item.id === selected.id);
      const wrong = question.options.find((option) => option.id !== question.correctOptionId);
      store.answerPractice(user.id, { sessionId: started.session.id, questionId: question.id, optionId: wrong.id });
    }
  }
  assert.equal(store.listPracticeSessions(user.id).length, 200);
  const totals = store.listPracticeSkillTotals(user.id);
  assert.equal(totals.length, 2);
  assert.deepEqual(totals.map((value) => [value.completeAttempts, value.answered, value.correctCount]),
    [[201, 201, 0], [201, 201, 0]]);
});
