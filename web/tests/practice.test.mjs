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
import { getPracticeSkills } from "../src/lib/practice-skills.ts";
import { compareCompletedSessions, comparePracticeSessions } from "../src/lib/practice-history.ts";

function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-practice-test-"));
  const dbPath = path.join(dir, "practice.sqlite");
  const stores = [];
  t.after(() => { for (const store of stores) store.close(); rmSync(dir, { recursive: true, force: true }); });
  return () => { const store = openAuthStore(dbPath); stores.push(store); return store; };
}

test("26 temas tienen seis preguntas provisionales, dos niveles y subtemas coherentes, sin clave pública", () => {
  assert.equal(topics.length, 26);
  const ids = new Set();
  for (const topic of topics) {
    const bank = getPracticeBank(topic.gradeId, topic.subjectId, topic.id);
    assert.equal(bank?.length, 6, topic.id);
    assert.notEqual(bank[0].prompt, bank[1].prompt, topic.id);
    assert.equal(new Set(bank.map((question) => question.prompt)).size, 6, topic.id);
    const skills = getPracticeSkills(topic.id);
    assert.equal(new Set(bank.map((question) => question.skillId)).size, skills.length, topic.id);
    assert.ok(bank.every((question) => skills.some((skill) => skill.id === question.skillId)), topic.id);
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

test("correcciones técnicas del piloto conservan IDs y claves mientras ajustan subtemas y enunciados", () => {
  const ids = ["G05-MAT", "G05-ESP", "G10-MAT", "G10-ESP", "G10-FIS", "G10-QUI"];
  const banks = Object.fromEntries(ids.map((id) => {
    const topic = topics.find((item) => item.id === id);
    return [id, getPracticeBank(topic.gradeId, topic.subjectId, id)];
  }));
  const question = (topic, number) => banks[topic][number - 1];
  assert.equal(question("G05-MAT", 1).skillId, "G05-MAT:suma-distinto-denominador");
  assert.equal(question("G05-ESP", 1).skillId, "G05-ESP:frase-introductoria");
  assert.equal(question("G10-MAT", 2).skillId, "G10-MAT:seno");
  assert.match(question("G10-MAT", 4).prompt, /ángulo agudo formado por el cateto de 8 y la hipotenusa/);
  assert.equal(question("G10-MAT", 4).options.find((option) => option.id === question("G10-MAT", 4).correctOptionId).text, "8/10");
  assert.equal(question("G10-ESP", 2).skillId, "G10-ESP:identificar-razon");
  assert.equal(question("G10-QUI", 1).skillId, "G10-QUI:balanceo-coeficientes");
  assert.equal(question("G10-QUI", 2).skillId, "G10-QUI:atomos-en-formulas");
  const physics = getDiagnostic("G10", "FIS", "G10-FIS", "demo");
  const chemistry = getDiagnostic("G10", "QUI", "G10-QUI", "demo");
  assert.match(physics.questions[0].prompt, /misma dirección y el mismo sentido/);
  assert.match(chemistry.questions[0].prompt, /coeficientes enteros mínimos/);
});

test("respuestas y sesiones antiguas conservan su clave y actualizan el subtema corregido", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-skill-correction-"));
  const dbPath = path.join(dir, "practice.sqlite");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let store = openAuthStore(dbPath);
  const { user } = await store.register({ email: "skill-correction@example.test", password: "clave-segura-123", adultConfirmed: true });
  const started = store.startPractice(user.id, { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  store.close();

  const db = new DatabaseSync(dbPath);
  const row = db.prepare("SELECT snapshot_json FROM practice_session_questions WHERE session_id=? AND question_id=?")
    .get(started.session.id, "practice-g05-mat-01");
  const snapshot = { ...JSON.parse(row.snapshot_json), skillId: "G05-MAT:suma-mismo-denominador" };
  db.prepare("UPDATE practice_session_questions SET snapshot_json=? WHERE session_id=? AND question_id=?")
    .run(JSON.stringify(snapshot), started.session.id, "practice-g05-mat-01");
  db.close();

  store = openAuthStore(dbPath);
  const answered = store.answerPractice(user.id, { sessionId: started.session.id,
    questionId: "practice-g05-mat-01", optionId: "b" });
  assert.equal(answered.feedback.correct, true);
  assert.equal(store.getPracticeSession(user.id, started.session.id).answers[0].skillId,
    "G05-MAT:suma-distinto-denominador");
  store.close();

  const legacy = new DatabaseSync(dbPath);
  legacy.prepare("UPDATE practice_answers SET skill_id=? WHERE session_id=? AND question_id=?")
    .run("G05-MAT:suma-mismo-denominador", started.session.id, "practice-g05-mat-01");
  legacy.close();
  store = openAuthStore(dbPath);
  assert.equal(store.getPracticeSession(user.id, started.session.id).answers[0].skillId,
    "G05-MAT:suma-distinto-denominador");
  store.close();
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

test("diagnósticos comparan dos sesiones del mismo tema sin inventar mejora con una sola", () => {
  const base = { status: "completed", answered: 4, completedAt: "2026-11-01T12:00:00.000Z" };
  const items = [
    { ...base, id: "a", topicId: "G10-MAT", correctCount: 1 },
    { ...base, id: "b", topicId: "G10-ESP", correctCount: 4 },
    { ...base, id: "c", topicId: "G10-MAT", correctCount: 3, completedAt: "2026-11-02T12:00:00.000Z" },
    { ...base, id: "d", topicId: "G10-MAT", correctCount: 0, answered: 0,
      completedAt: "2026-11-03T12:00:00.000Z" },
  ];
  const comparison = compareCompletedSessions(items, "G10-MAT");
  assert.equal(comparison.status, "ready");
  assert.equal(comparison.previous.id, "a");
  assert.equal(comparison.latest.id, "c");
  assert.equal(comparison.deltaPoints, 50);
  assert.deepEqual(compareCompletedSessions(items, "G10-ESP"), {
    status: "insufficient", latest: items[1], previous: null, deltaPoints: null,
  });
  assert.equal(compareCompletedSessions(items, "G05-MAT").status, "insufficient");
});

test("comparación de práctica consulta sesiones antiguas aunque el historial visible termine en 200", async (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "apoyo-practice-comparison-"));
  const dbPath = path.join(directory, "test.sqlite");
  const store = openAuthStore(dbPath);
  t.after(() => { store.close(); rmSync(directory, { recursive: true, force: true }); });
  const { user } = await store.register({ email: "old-practice@example.test",
    password: "clave-segura-123", adultConfirmed: true });
  const db = new DatabaseSync(dbPath);
  try {
    const insertSession = db.prepare(`INSERT INTO practice_sessions
      (id,user_id,grade_id,subject_id,topic_id,status,total,started_at,completed_at)
      VALUES (?,?,?,?,?,'completed',1,?,?)`);
    const insertAnswer = db.prepare(`INSERT INTO practice_answers
      (session_id,question_id,option_id,correct,correct_option_id,explanation,answered_at)
      VALUES (?,'q','a',?,'a','',?)`);
    db.exec("BEGIN");
    for (let index = 0; index < 202; index += 1) {
      const id = index.toString(16).padStart(32, "0");
      const subjectId = index < 2 ? "MAT" : "ESP";
      const topicId = `G05-${subjectId}`;
      const date = new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString();
      insertSession.run(id, user.id, "G05", subjectId, topicId, date, date);
      insertAnswer.run(id, index === 0 ? 1 : 0, date);
    }
    db.exec("COMMIT");
  } finally { db.close(); }
  assert.equal(store.listPracticeSessions(user.id).some((item) => item.topicId === "G05-MAT"), false);
  const comparison = compareCompletedSessions(store.listPracticeComparisonSessions(user.id), "G05-MAT");
  assert.equal(comparison.status, "ready");
  assert.equal(comparison.deltaPoints, -100);
  assert.equal(store.listPracticeComparisonSessions(user.id).length, 4);
  const other = await store.register({ email: "other-practice@example.test",
    password: "clave-segura-123", adultConfirmed: true });
  assert.deepEqual(store.listPracticeComparisonSessions(other.user.id), []);
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
  const selection = { gradeId: "G04", subjectId: "MAT", topicId: "G04-MAT" };
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
