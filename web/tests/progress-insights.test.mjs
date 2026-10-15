import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { openAuthStore } from "../src/lib/auth.ts";
import { getPracticeBank } from "../src/lib/practice.ts";
import { skillInsight } from "../src/lib/progress-insights.ts";

const topicId = "G05-MAT";
const skillId = "G05-MAT:suma-mismo-denominador";
function attempt(id, correctCount, answered = 1, total = 2, completedAt = "2026-10-15T12:00:00.000Z", skill = skillId) {
  return { id, gradeId: "G05", subjectId: "MAT", topicId, status: "completed", total,
    answered: total, correctCount, startedAt: completedAt, completedAt,
    skills: [{ skillId: skill, answered, correctCount }] };
}

test("sin respuestas del subtema o con una medición mantiene dominio indeterminado", () => {
  assert.deepEqual(skillInsight([], topicId, skillId, []), {
    topicId, skillId, points: [], completeAttempts: 0, answered: 0, correct: 0,
    observedPercent: null, level: "indeterminate", historyAvailable: true,
  });
  const one = skillInsight([attempt("a", 1)], topicId, skillId,
    [{ skillId, completeAttempts: 1, answered: 1, correctCount: 1 }]);
  assert.equal(one.level, "indeterminate");
  assert.equal(one.points.length, 1);
  assert.equal(one.points[0].percent, 100);
  assert.equal(skillInsight([attempt("a", 1)], topicId, skillId, null).historyAvailable, false);
});

test("dominio y gráfica usan solo respuestas del mismo subtema y prácticas completas", () => {
  const items = [
    attempt("new", 0, 1, 2, "2026-10-15T13:00:00.000Z"),
    attempt("old", 1, 1, 2, "2026-10-15T12:00:00.000Z"),
    { ...attempt("partial", 0, 1, 2, "2026-10-15T14:00:00.000Z"), answered: 1 },
    attempt("other-skill", 0, 1, 2, "2026-10-15T15:00:00.000Z", "G05-MAT:suma-distinto-denominador"),
    { ...attempt("other-topic", 0), topicId: "G05-ESP" },
  ];
  const result = skillInsight(items, topicId, skillId,
    [{ skillId, completeAttempts: 2, answered: 2, correctCount: 1 }]);
  assert.equal(result.level, "developing");
  assert.equal(result.observedPercent, 50);
  assert.equal(result.correct, 1);
  assert.equal(result.answered, 2);
  assert.equal(result.completeAttempts, 2);
  assert.deepEqual(result.points.map((point) => [point.id, point.percent, point.complete]),
    [["old", 100, true], ["new", 0, true], ["partial", 0, false]]);
});

test("sin respuestas, datos anteriores sin skills y cifras corruptas quedan indeterminados", () => {
  const empty = { ...attempt("empty", 0, 0), answered: 0, skills: [] };
  const legacy = { ...attempt("legacy", 1), skills: undefined };
  const bad = attempt("bad", 2);
  const result = skillInsight([empty, legacy, bad], topicId, skillId, []);
  assert.equal(result.points.length, 0);
  assert.equal(result.level, "indeterminate");
});

test("agregados por subtema provienen de respuestas persistidas y se aíslan por cuenta", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-skill-progress-"));
  const store = openAuthStore(path.join(dir, "progress.sqlite"));
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const a = await store.register({ email: "skill-a@example.test", password: "clave-segura-123", adultConfirmed: true });
  const b = await store.register({ email: "skill-b@example.test", password: "clave-segura-123", adultConfirmed: true });
  const bank = getPracticeBank("G05", "MAT", topicId);
  assert.ok(bank?.length >= 4);
  assert.ok(bank.filter((question) => question.skillId === skillId).length >= 2);

  for (let attemptNumber = 0; attemptNumber < 2; attemptNumber += 1) {
    const session = store.startPractice(a.user.id, { gradeId: "G05", subjectId: "MAT", topicId });
    for (const question of session.questions) {
      const privateQuestion = bank.find((candidate) => candidate.id === question.id);
      assert.ok(privateQuestion);
      const wrong = privateQuestion.options.find((option) => option.id !== privateQuestion.correctOptionId);
      const optionId = attemptNumber === 1 && privateQuestion.skillId === skillId
        ? wrong.id : privateQuestion.correctOptionId;
      store.answerPractice(a.user.id, { sessionId: session.session.id, questionId: question.id, optionId });
    }
  }

  const sessions = store.listPracticeSessions(a.user.id);
  assert.equal(sessions.length, 2);
  assert.ok(sessions.every((session) => session.skills.length === 2));
  const result = skillInsight(sessions, topicId, skillId, store.listPracticeSkillTotals(a.user.id));
  assert.equal(result.completeAttempts, 2);
  assert.equal(result.answered, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.level, "developing");
  assert.equal(skillInsight(store.listPracticeSessions(b.user.id), topicId, skillId,
    store.listPracticeSkillTotals(b.user.id)).level, "indeterminate");
});

test("agregado completo incluye intentos fuera de la ventana de 200 del gráfico", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "apoyo-skill-window-"));
  const dbPath = path.join(dir, "window.sqlite");
  const store = openAuthStore(dbPath);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  const { user } = await store.register({ email: "window@example.test", password: "clave-segura-123", adultConfirmed: true });
  const db = new DatabaseSync(dbPath);
  const insertSession = db.prepare(`INSERT INTO practice_sessions
    (id,user_id,grade_id,subject_id,topic_id,status,total,started_at,completed_at)
    VALUES (?,?,'G05','MAT',?,'completed',2,?,?)`);
  const insertAnswer = db.prepare(`INSERT INTO practice_answers
    (session_id,question_id,option_id,correct,correct_option_id,explanation,answered_at,skill_id)
    VALUES (? ,?,'a',?,'a','prueba',?,?)`);
  db.exec("BEGIN");
  for (let index = 0; index < 201; index += 1) {
    const id = index.toString(16).padStart(32, "0");
    const date = new Date(Date.UTC(2026, 9, 1, 0, index)).toISOString();
    insertSession.run(id, user.id, topicId, date, date);
    insertAnswer.run(id, `q-${index}-skill`, index > 0 && index <= 159 ? 1 : 0, date, skillId);
    insertAnswer.run(id, `q-${index}-other`, 0, date, "G05-MAT:suma-distinto-denominador");
  }
  db.exec("COMMIT");
  db.close();

  const visible = store.listPracticeSessions(user.id);
  const totals = store.listPracticeSkillTotals(user.id);
  assert.equal(visible.length, 200);
  const visibleCorrect = visible.reduce((sum, item) => sum +
    (item.skills.find((skill) => skill.skillId === skillId)?.correctCount ?? 0), 0);
  assert.equal(visibleCorrect, 159);
  assert.equal(Math.round(visibleCorrect / visible.length * 100), 80, "ventana aislada parecería alta");
  const result = skillInsight(visible, topicId, skillId, totals);
  assert.equal(result.points.length, 200);
  assert.equal(result.completeAttempts, 201);
  assert.equal(result.answered, 201);
  assert.equal(result.correct, 159);
  assert.equal(result.observedPercent, 79);
  assert.equal(result.level, "developing", "historial completo evita subir de nivel por truncamiento");
});
