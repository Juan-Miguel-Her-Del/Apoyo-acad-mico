import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { openAuthStore, AuthError } from "../src/lib/auth.ts";
import { openDiagnosticAttemptStore } from "../src/lib/diagnostic-attempts.ts";
import { getAdaptiveDiagnosticBank } from "../src/lib/diagnostic-adaptive.ts";

function fixture(t, bankReader = getAdaptiveDiagnosticBank) {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-diagnostic-attempt-"));
  const dbPath = path.join(dir, "test.sqlite");
  const auth = openAuthStore(dbPath);
  const store = openDiagnosticAttemptStore(dbPath, bankReader);
  t.after(() => { store.close(); auth.close(); rmSync(dir, { recursive: true, force: true }); });
  return { auth, store, dbPath };
}

async function account(auth, prefix) {
  return (await auth.register({ email: `${prefix}@example.test`, password: "clave-segura-123", adultConfirmed: true })).user;
}
const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", mode: "demo" };

test("comparación diagnóstica conserva dos intentos de un tema fuera del historial visible", async (t) => {
  const { auth, store, dbPath } = fixture(t);
  const user = await account(auth, "old-diagnostic");
  const db = new DatabaseSync(dbPath);
  try {
    const insertAttempt = db.prepare(`INSERT INTO diagnostic_attempts
      (id,user_id,grade_id,subject_id,topic_id,status,started_at,completed_at)
      VALUES (?,?,?,?,?,'completed',?,?)`);
    const insertAnswer = db.prepare(`INSERT INTO diagnostic_attempt_answers
      (attempt_id,question_id,option_id,correct,skill,answered_at)
      VALUES (?,'q','a',?,'skill',?)`);
    db.exec("BEGIN");
    for (let index = 0; index < 102; index += 1) {
      const id = index.toString(16).padStart(32, "0");
      const subjectId = index < 2 ? "MAT" : "ESP";
      const date = new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString();
      insertAttempt.run(id, user.id, "G05", subjectId, `G05-${subjectId}`, date, date);
      insertAnswer.run(id, index === 0 ? 1 : 0, date);
    }
    db.exec("COMMIT");
  } finally { db.close(); }
  assert.equal(store.list(user.id).some((item) => item.topicId === "G05-MAT"), false);
  const matched = store.listComparisonSessions(user.id).filter((item) => item.topicId === "G05-MAT");
  assert.equal(matched.length, 2);
  assert.deepEqual(matched.map((item) => item.correctCount), [0, 1]);
  assert.equal(store.listComparisonSessions(user.id).length, 4);
  const other = await account(auth, "other-diagnostic");
  assert.deepEqual(store.listComparisonSessions(other.id), []);
});

test("intento diagnóstico de cuatro preguntas guarda respuestas y resultado sin publicar explicaciones", async (t) => {
  const { auth, store, dbPath } = fixture(t);
  const user = await account(auth, "uno");
  let state = store.start(user.id, selection);
  assert.equal(state.attempt.answered, 0);
  assert.equal(state.question.difficulty, 1);
  assert.equal(state.attempt.validation, "demo-unreviewed");
  assert.equal("correctOptionId" in state.question, false);
  assert.equal("questions" in state, false);
  assert.match(state.attempt.bankVersion, /^diagnostic-demo:/);
  const seen = new Set();
  for (let n = 0; n < 4; n++) {
    const question = state.question;
    assert.ok(question);
    assert.equal(seen.has(question.id), false);
    seen.add(question.id);
    state = store.answer(user.id, { attemptId: state.attempt.id, questionId: question.id, optionId: question.options[0].id });
    assert.equal(state.feedback.questionId, question.id);
    assert.equal(state.feedback.explanation, null);
    assert.equal(state.feedback.explanationStatus, "pending-review");
    assert.equal(state.attempt.answered, n + 1);
  }
  assert.equal(state.attempt.status, "completed");
  assert.equal(state.question, null);
  assert.equal(auth.listProgress(user.id).filter((item) => item.kind === "diagnostic").length, 1);
  const reopened = openDiagnosticAttemptStore(dbPath);
  try {
    assert.deepEqual(reopened.get(user.id, state.attempt.id), { attempt: state.attempt, question: null, answers: state.answers });
  } finally { reopened.close(); }
});

test("propiedad, orden, formato y doble respuesta se validan en servidor", async (t) => {
  const { auth, store } = fixture(t);
  const alice = await account(auth, "alice");
  const bob = await account(auth, "bob");
  assert.throws(() => store.start("sin-cuenta", selection), (error) => error instanceof AuthError && error.status === 401);
  const first = store.start(alice.id, selection);
  assert.throws(() => store.start(alice.id, selection), (error) => error instanceof AuthError && error.status === 409);
  assert.throws(() => store.get(bob.id, first.attempt.id), (error) => error instanceof AuthError && error.status === 404);
  assert.throws(() => store.answer(bob.id, { attemptId: first.attempt.id, questionId: first.question.id, optionId: "a" }),
    (error) => error instanceof AuthError && error.status === 404);
  assert.throws(() => store.answer(alice.id, { attemptId: first.attempt.id, questionId: "foreign", optionId: "a" }),
    (error) => error instanceof AuthError && error.status === 400);
  assert.throws(() => store.answer(alice.id, { attemptId: first.attempt.id, questionId: first.question.id, optionId: "invalid" }),
    (error) => error instanceof AuthError && error.status === 400);
  const answered = store.answer(alice.id, { attemptId: first.attempt.id, questionId: first.question.id, optionId: first.question.options[0].id });
  assert.throws(() => store.answer(alice.id, { attemptId: first.attempt.id, questionId: first.question.id, optionId: first.question.options[0].id }),
    (error) => error instanceof AuthError && error.status === 409);
  assert.equal(store.get(alice.id, first.attempt.id).attempt.answered, 1);
  assert.equal(store.latestOpen(alice.id, selection.gradeId, selection.subjectId, selection.topicId).question.id, answered.question.id);
  assert.deepEqual(auth.listProgress(alice.id), []);
});

test("historial diagnóstico lista solo intentos propios y conserva resultados tras recarga", async (t) => {
  const { auth, store, dbPath } = fixture(t);
  const alice = await account(auth, "historial-alice");
  const bob = await account(auth, "historial-bob");
  let current = store.start(alice.id, selection);
  assert.equal(store.list(bob.id).length, 0);
  assert.equal(store.list(alice.id)[0].status, "open");
  for (let i = 0; i < 4; i++) {
    current = store.answer(alice.id, { attemptId: current.attempt.id,
      questionId: current.question.id, optionId: current.question.options[0].id });
  }
  const reopened = openDiagnosticAttemptStore(dbPath);
  try {
    const own = reopened.list(alice.id);
    assert.equal(own.length, 1);
    assert.equal(own[0].id, current.attempt.id);
    assert.equal(own[0].status, "completed");
    assert.equal(own[0].answered, 4);
    assert.equal(own[0].answers.length, 4);
    assert.equal(own[0].correctCount, current.attempt.correctCount);
    assert.equal("question" in own[0], false);
    assert.equal("correctOptionId" in own[0].answers[0], false);
    assert.deepEqual(reopened.list(bob.id), []);
  } finally { reopened.close(); }
});

test("rechaza modo publicado, selección ajena al catálogo y banco insuficiente sin crear resultado", async (t) => {
  const { auth, store } = fixture(t);
  const user = await account(auth, "uno");
  assert.throws(() => store.start(user.id, { ...selection, mode: "published" }),
    (error) => error instanceof AuthError && error.status === 409);
  assert.throws(() => store.start(user.id, { ...selection, gradeId: "G01" }),
    (error) => error instanceof AuthError && error.status === 400);
  assert.deepEqual(auth.listProgress(user.id), []);
});

test("preguntas de un intento conservan snapshot aunque cambie el banco", async (t) => {
  let bank = getAdaptiveDiagnosticBank("G05", "MAT", "G05-MAT");
  const { auth, store } = fixture(t, () => bank);
  const user = await account(auth, "uno");
  const first = store.start(user.id, selection);
  bank = null;
  const continued = store.answer(user.id, { attemptId: first.attempt.id,
    questionId: first.question.id, optionId: first.question.options[0].id });
  assert.equal(continued.attempt.answered, 1);
  assert.ok(continued.question);
});

test("respuestas reales del store suben de nivel al acertar y bajan al errar", async (t) => {
  const { auth, store } = fixture(t);
  const user = await account(auth, "uno");
  const bank = getAdaptiveDiagnosticBank(selection.gradeId, selection.subjectId, selection.topicId);
  let state = store.start(user.id, selection);
  const first = bank.find((item) => item.id === state.question.id);
  state = store.answer(user.id, { attemptId: state.attempt.id,
    questionId: first.id, optionId: first.correctOptionId });
  assert.equal(state.feedback.correct, true);
  assert.equal(state.question.difficulty, 2);
  const second = bank.find((item) => item.id === state.question.id);
  const wrong = second.options.find((option) => option.id !== second.correctOptionId);
  state = store.answer(user.id, { attemptId: state.attempt.id,
    questionId: second.id, optionId: wrong.id });
  assert.equal(state.feedback.correct, false);
  assert.equal(state.question.difficulty, 1);
});

test("banco insuficiente devuelve conflicto sin abrir intento ni inventar progreso", async (t) => {
  const shortBank = getAdaptiveDiagnosticBank("G05", "MAT", "G05-MAT").slice(0, 2);
  const { auth, store } = fixture(t, () => shortBank);
  const user = await account(auth, "uno");
  assert.throws(() => store.start(user.id, selection), (error) => error instanceof AuthError && error.status === 409);
  assert.throws(() => store.latestOpen(user.id, selection.gradeId, selection.subjectId, selection.topicId),
    (error) => error instanceof AuthError && error.status === 404);
  assert.deepEqual(auth.listProgress(user.id), []);
});

test("banco corrupto tampoco abre intento ni devuelve un error interno", async (t) => {
  const bank = getAdaptiveDiagnosticBank("G05", "MAT", "G05-MAT");
  const invalid = [...bank];
  invalid[1] = { ...invalid[1], id: invalid[0].id };
  const { auth, store } = fixture(t, () => invalid);
  const user = await account(auth, "banco-corrupto");
  assert.throws(() => store.start(user.id, selection),
    (error) => error instanceof AuthError && error.status === 409 && /preguntas suficientes/.test(error.message));
  assert.deepEqual(store.list(user.id), []);
  assert.deepEqual(auth.listProgress(user.id), []);
});
