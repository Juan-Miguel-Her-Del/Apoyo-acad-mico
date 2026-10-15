import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
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
  assert.deepEqual(skillInsight([], topicId, skillId), {
    topicId, skillId, points: [], completeAttempts: 0, answered: 0, correct: 0,
    observedPercent: null, level: "indeterminate",
  });
  const one = skillInsight([attempt("a", 1)], topicId, skillId);
  assert.equal(one.level, "indeterminate");
  assert.equal(one.points.length, 1);
  assert.equal(one.points[0].percent, 100);
});

test("dominio y gráfica usan solo respuestas del mismo subtema y prácticas completas", () => {
  const items = [
    attempt("new", 0, 1, 2, "2026-10-15T13:00:00.000Z"),
    attempt("old", 1, 1, 2, "2026-10-15T12:00:00.000Z"),
    { ...attempt("partial", 0, 1, 2, "2026-10-15T14:00:00.000Z"), answered: 1 },
    attempt("other-skill", 0, 1, 2, "2026-10-15T15:00:00.000Z", "G05-MAT:suma-distinto-denominador"),
    { ...attempt("other-topic", 0), topicId: "G05-ESP" },
  ];
  const result = skillInsight(items, topicId, skillId);
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
  const result = skillInsight([empty, legacy, bad], topicId, skillId);
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
  const result = skillInsight(sessions, topicId, skillId);
  assert.equal(result.completeAttempts, 2);
  assert.equal(result.answered, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.level, "developing");
  assert.equal(skillInsight(store.listPracticeSessions(b.user.id), topicId, skillId).level, "indeterminate");
});
