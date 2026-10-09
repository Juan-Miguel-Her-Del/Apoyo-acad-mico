import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/lib/catalog.ts";
import { prepareExplanationContext } from "../src/lib/explanation-context.ts";

const selection = { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", subskillId: "fraction-equivalence" };
const evidence = { status: "detected", answered: 3, correct: 1, ruleVersion: "fixture-1" };
const source = {
  topicId: "G05-MAT", subskillId: "fraction-equivalence", version: "fixture-1", approvalEvidenceId: "fixture-only",
  reviewedBy: "fixture-teacher", reviewedAt: "2026-10-08", reference: "fixture-only",
  explanation: "Fixture explanation", example: "Fixture example",
};
const approvedFixture = topics.map((topic) => topic.id === "G05-MAT"
  ? { ...topic, approvedForPublication: true, explanationApproved: true, validatedQuestionCount: 3 }
  : topic);

test("prepara contexto trazable solo con fuente revisada del mismo tema y subhabilidad", () => {
  const result = prepareExplanationContext(selection, evidence, source, approvedFixture);
  assert.equal(result.status, "ready");
  assert.equal(result.context.topicId, "G05-MAT");
  assert.equal(result.context.source.version, "fixture-1");
  assert.equal("studentId" in result.context, false);
});

test("catálogo real bloquea toda explicación sin aprobación curricular", () => {
  assert.deepEqual(prepareExplanationContext(selection, evidence, source),
    { status: "unavailable", reason: "content_not_approved" });
});

test("rechaza selección cruzada, evidencia indeterminada y fuente ausente o de otro tema", () => {
  assert.equal(prepareExplanationContext({ ...selection, subjectId: "ESP" }, evidence, source, approvedFixture).reason, "invalid_selection");
  assert.equal(prepareExplanationContext(selection, { ...evidence, status: "indeterminate" }, source, approvedFixture).reason, "insufficient_evidence");
  assert.equal(prepareExplanationContext(selection, evidence, undefined, approvedFixture).reason, "source_unavailable");
  assert.equal(prepareExplanationContext(selection, evidence, { ...source, topicId: "G10-MAT" }, approvedFixture).reason, "source_unavailable");
  assert.equal(prepareExplanationContext(selection, evidence, { ...source, approvalEvidenceId: "" }, approvedFixture).reason, "source_unavailable");
});
