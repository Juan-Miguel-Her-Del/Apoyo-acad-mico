import { topics, type Topic } from "./catalog.ts";

export type ExplanationSelection = {
  gradeId: string;
  subjectId: string;
  topicId: string;
  subskillId: string;
};

export type DifficultyEvidence = {
  status: "detected" | "indeterminate";
  answered: number;
  correct: number;
  ruleVersion: string;
};

export type ReviewedExplanationSource = {
  topicId: string;
  subskillId: string;
  version: string;
  approvalEvidenceId: string;
  reviewedBy: string;
  reviewedAt: string;
  reference: string;
  explanation: string;
  example: string;
};

type ContextResult =
  | { status: "ready"; context: {
      gradeId: string;
      subjectId: string;
      topicId: string;
      topicName: string;
      subskillId: string;
      difficultyEvidence: DifficultyEvidence;
      source: ReviewedExplanationSource;
    } }
  | { status: "unavailable"; reason: "invalid_selection" | "insufficient_evidence" | "content_not_approved" | "source_unavailable" };

// Solo recibe fuentes de un depósito confiable del servidor. No expone una ruta HTTP.
// En producción, el catálogo no tiene temas aprobados y no existe depósito de fuentes.
export function prepareExplanationContext(
  selection: ExplanationSelection,
  evidence: DifficultyEvidence,
  source: ReviewedExplanationSource | undefined,
  catalog: readonly Topic[] = topics,
): ContextResult {
  const topic = catalog.find((item) => item.id === selection.topicId);
  if (!topic || topic.gradeId !== selection.gradeId || topic.subjectId !== selection.subjectId || !selection.subskillId) {
    return { status: "unavailable", reason: "invalid_selection" };
  }
  if (evidence.status !== "detected" || !Number.isInteger(evidence.answered) || evidence.answered < 1 ||
      !Number.isInteger(evidence.correct) || evidence.correct < 0 || evidence.correct > evidence.answered ||
      !evidence.ruleVersion.trim()) {
    return { status: "unavailable", reason: "insufficient_evidence" };
  }
  if (!topic.approvedForPublication || !topic.explanationApproved || topic.validatedQuestionCount < 1) {
    return { status: "unavailable", reason: "content_not_approved" };
  }
  if (!source || source.topicId !== topic.id || source.subskillId !== selection.subskillId ||
      !source.version.trim() || !source.approvalEvidenceId.trim() || !source.reviewedBy.trim() || !source.reviewedAt.trim() ||
      !source.reference.trim() || !source.explanation.trim() || !source.example.trim()) {
    return { status: "unavailable", reason: "source_unavailable" };
  }
  return {
    status: "ready",
    context: {
      gradeId: topic.gradeId,
      subjectId: topic.subjectId,
      topicId: topic.id,
      topicName: topic.name,
      subskillId: selection.subskillId,
      difficultyEvidence: evidence,
      source,
    },
  };
}
