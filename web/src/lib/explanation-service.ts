import { analyzeDemoSkills } from "./diagnostic-analysis.ts";
import { prepareExplanationContext, type ReviewedExplanationSource } from "./explanation-context.ts";
import { topics, type Topic } from "./catalog.ts";
import { explanationLevelForGrade, words, type ExplanationLevel } from "./explanation-adaptation.ts";
import { selectReviewedExample } from "./explanation-examples.ts";

export type ExplanationAttempt = {
  attempt: {
    gradeId: string; subjectId: string; topicId: string;
    status: "open" | "completed"; mode: string; validation: string;
  };
  answers: { questionId: string; skill: string; correct: boolean }[];
};

export type ExplanationRequest = { attemptId: string; subskillId: string; exampleIndex?: number };
export type ExplanationProviderInput = {
  gradeId: string; subjectId: string; topicId: string; topicName: string; subskillId: string;
  sourceVersion: string; explanation: string; example: string; reference: string;
  level: ExplanationLevel; exampleIndex: number;
};
export type ExplanationProvider = (input: ExplanationProviderInput) => Promise<unknown>;
export type ExplanationResult = {
  topicId: string; subskillId: string; explanation: string; example: string;
  reference: string; sourceVersion: string; approvalEvidenceId: string;
  levelId: ExplanationLevel["id"]; gradeId: string;
  exampleIndex: number; hasAnotherExample: boolean;
};

export class ExplanationError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  constructor(status: number, code: string, message: string, retryable = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

function approvedText(value: unknown, original: string) {
  return typeof value === "string" && value.length >= 20 && value.length <= 1200 &&
    value === value.trim() && original.includes(value);
}

// A provider may extract approved text; it may not introduce new academic claims.
export function validateGeneratedExplanation(output: unknown, input: ExplanationProviderInput,
  source: ReviewedExplanationSource, hasAnotherExample = false): ExplanationResult {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    throw new ExplanationError(503, "invalid_provider_response", "No pudimos cargar la explicación ahora. Inténtalo de nuevo.", true);
  }
  const data = output as Record<string, unknown>;
  if (data.topicId !== input.topicId || data.subskillId !== input.subskillId ||
      data.sourceVersion !== source.version || !approvedText(data.explanation, source.explanation) ||
      !approvedText(data.example, input.example) ||
      words(data.explanation as string) > input.level.maxExplanationWords ||
      words(data.example as string) > input.level.maxExampleWords) {
    throw new ExplanationError(503, "invalid_provider_response", "No pudimos cargar la explicación ahora. Inténtalo de nuevo.", true);
  }
  return {
    topicId: input.topicId, subskillId: input.subskillId,
    explanation: data.explanation as string, example: data.example as string,
    reference: source.reference, sourceVersion: source.version,
    approvalEvidenceId: source.approvalEvidenceId,
    levelId: input.level.id, gradeId: input.gradeId,
    exampleIndex: input.exampleIndex, hasAnotherExample,
  };
}

export async function generateExplanation(args: {
  attempt: ExplanationAttempt;
  subskillId: string;
  exampleIndex?: number;
  source: ReviewedExplanationSource | undefined;
  provider: ExplanationProvider;
  catalog?: readonly Topic[];
}): Promise<ExplanationResult> {
  const { attempt, subskillId, source, provider } = args;
  if (attempt.attempt.status !== "completed" ||
      attempt.attempt.mode !== "published" || attempt.attempt.validation !== "approved") {
    throw new ExplanationError(409, "academic_review_pending", "La explicación requiere un diagnóstico y contenido revisados académicamente.");
  }
  if (typeof subskillId !== "string" || subskillId.length < 1 || subskillId.length > 120) {
    throw new ExplanationError(400, "invalid_subskill", "Subtema no válido.");
  }
  const related = attempt.answers.filter((answer) => answer.skill === subskillId);
  const analysis = analyzeDemoSkills(related.map((answer) => ({ id: answer.questionId, skill: answer.skill })), related);
  const result = analysis.results.find((item) => item.skill === subskillId);
  const evidence = {
    status: result?.status === "dificultad-demo" ? "detected" as const : "indeterminate" as const,
    answered: result?.answered ?? 0, correct: result?.correct ?? 0,
    ruleVersion: "skill-evidence-v1",
  };
  const prepared = prepareExplanationContext({
    gradeId: attempt.attempt.gradeId, subjectId: attempt.attempt.subjectId,
    topicId: attempt.attempt.topicId, subskillId,
  }, evidence, source, args.catalog ?? topics);
  if (prepared.status !== "ready") {
    const reason = prepared.reason;
    if (reason === "invalid_selection") throw new ExplanationError(400, reason, "Subtema no válido para este diagnóstico.");
    if (reason === "insufficient_evidence") throw new ExplanationError(409, reason, "El diagnóstico no identificó una dificultad suficiente en este subtema.");
    throw new ExplanationError(409, reason, "La explicación de este subtema está pendiente de revisión académica.");
  }
  const level = explanationLevelForGrade(prepared.context.gradeId);
  if (!level) throw new ExplanationError(400, "invalid_grade", "Escoge un grado válido para pedir la explicación.");
  const choice = selectReviewedExample(source!, args.exampleIndex ?? 0);
  if (choice.status !== "ready") {
    if (choice.reason === "invalid_index") throw new ExplanationError(400, choice.reason, "Ejemplo solicitado no válido.");
    if (choice.reason === "no_alternative_example") {
      throw new ExplanationError(409, choice.reason, "No hay otro ejemplo revisado disponible para este subtema.");
    }
    throw new ExplanationError(409, choice.reason, "Los ejemplos revisados necesitan corrección antes de publicarse.");
  }
  const input: ExplanationProviderInput = {
    gradeId: prepared.context.gradeId, subjectId: prepared.context.subjectId,
    topicId: prepared.context.topicId, topicName: prepared.context.topicName,
    subskillId, sourceVersion: source!.version,
    explanation: source!.explanation, example: choice.example, reference: source!.reference,
    level, exampleIndex: choice.index,
  };
  let output: unknown;
  try { output = await provider(input); }
  catch { throw new ExplanationError(503, "provider_unavailable", "No pudimos cargar la explicación ahora. Inténtalo de nuevo.", true); }
  return validateGeneratedExplanation(output, input, source!, choice.hasAnotherExample);
}
