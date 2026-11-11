import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { setPostgresTestBackend } from "../src/lib/postgres.ts";
import { authStore } from "../src/lib/auth.ts";
import { diagnosticAttemptStore } from "../src/lib/diagnostic-attempts.ts";
import { demoFeedbackStore } from "../src/lib/explanation-demo-feedback.ts";
import { explanationReviewStore } from "../src/lib/explanation-review.ts";
import { demoExplanationId } from "../src/lib/explanation-id.ts";

test("PostgreSQL conserva cuenta, perfil, diagnóstico, práctica y valoración", async (t) => {
  const oldUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://test:in-memory@localhost/test";
  const database = new PGlite();
  const query = (client, sql, values = []) => client.query(sql, values, { parsers: { 20: Number } });
  setPostgresTestBackend({
    schema: async (sql) => { await database.exec(sql); },
    query: (sql, values) => query(database, sql, values),
    transaction: (work) => database.transaction((tx) => work({ query: (sql, values) => query(tx, sql, values) })),
  });
  t.after(async () => {
    setPostgresTestBackend(undefined);
    if (oldUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldUrl;
    await database.close();
  });

  const auth = authStore();
  let verificationToken = "";
  await auth.requestRegistration({ email: "adulto@example.test", password: "Clave-ficticia-123!",
    adultConfirmed: true, displayName: "Estudiante", gradeId: "G05" },
  async (_email, token) => { verificationToken = token; });
  assert.equal(verificationToken.length, 64);
  const created = await auth.verifyRegistration({ token: verificationToken });
  await assert.rejects(() => auth.verifyRegistration({ token: verificationToken }), (error) => error.status === 400);
  assert.equal((await auth.sessionUser(created.token))?.id, created.user.id);
  assert.equal((await auth.getProfile(created.user.id))?.gradeId, "G05");
  assert.deepEqual(await auth.saveLastSelection(created.user.id,
    { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" }),
  { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });

  const diagnostic = diagnosticAttemptStore();
  let attempt = await diagnostic.start(created.user.id,
    { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", mode: "demo" });
  await assert.rejects(() => diagnostic.start(created.user.id,
    { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", mode: "demo" }), (error) => error.status === 409);
  for (let index = 0; index < 4; index++) {
    attempt = await diagnostic.answer(created.user.id, { attemptId: attempt.attempt.id,
      questionId: attempt.question.id, optionId: attempt.question.options[0].id });
  }
  assert.equal(attempt.attempt.status, "completed");
  assert.equal((await diagnostic.list(created.user.id)).length, 1);

  const round = await auth.startPractice(created.user.id,
    { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT" });
  for (const question of round.questions) {
    await auth.answerPractice(created.user.id, { sessionId: round.session.id,
      questionId: question.id, optionId: question.options[0].id });
  }
  await assert.rejects(() => auth.answerPractice(created.user.id, { sessionId: round.session.id,
    questionId: round.questions[0].id, optionId: round.questions[0].options[0].id }), (error) => error.status === 409);
  assert.equal((await auth.getPracticeSession(created.user.id, round.session.id)).session.status, "completed");
  assert.ok((await auth.listProgress(created.user.id)).some((item) => item.kind === "study"));
  assert.equal((await auth.listPracticeComparisonSessions(created.user.id)).length, 1);
  assert.equal((await diagnostic.listComparisonSessions(created.user.id)).length, 1);
  assert.ok((await auth.studySummary(created.user.id)).recommendation);

  const feedback = demoFeedbackStore();
  const explanationId = demoExplanationId("G05-MAT");
  const saved = await feedback.put(created.user.id, { topicId: "G05-MAT", explanationId, value: "helped" });
  assert.equal(saved.value, "helped");
  const review = explanationReviewStore();
  await review.record({ topicId: "G05-MAT", subskillId: "G05-MAT:suma-distinto-denominador",
    sourceVersion: "test", exampleIndex: 0, reason: "reported_confusing" });
  assert.equal((await review.list()).length, 1);

  await auth.logout(created.token);
  assert.equal(await auth.sessionUser(created.token), null);
  const relogin = await auth.login({ email: "adulto@example.test", password: "Clave-ficticia-123!" });
  assert.equal(relogin.user.id, created.user.id);
  assert.equal((await auth.listPracticeSessions(relogin.user.id)).length, 1);

  let resetToken = "";
  await auth.requestPasswordReset({ email: "adulto@example.test" },
    async (_email, token) => { resetToken = token; });
  await auth.resetPassword({ token: resetToken, password: "Clave-ficticia-nueva-123!" });
  assert.equal(await auth.sessionUser(relogin.token), null);
  await assert.rejects(() => auth.login({ email: "adulto@example.test", password: "Clave-ficticia-123!" }),
    (error) => error.status === 401);
  const newLogin = await auth.login({ email: "adulto@example.test", password: "Clave-ficticia-nueva-123!" });
  await auth.deleteOwnAccount(newLogin.user.id,
    { confirmation: "ELIMINAR", password: "Clave-ficticia-nueva-123!" });
  assert.equal(await auth.sessionUser(newLogin.token), null);
  assert.equal((await database.query("SELECT count(*)::int AS count FROM practice_sessions")).rows[0].count, 0);
});
