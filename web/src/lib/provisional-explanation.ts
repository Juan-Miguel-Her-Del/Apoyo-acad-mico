import { getDiagnostic } from "./diagnostic.ts";
import { explanationLevelForGrade, words } from "./explanation-adaptation.ts";
import type { ExplanationProviderInput } from "./explanation-service.ts";
import { getStudyDemo, pickStudyChapter } from "./study-demo.ts";

export type ProvisionalExplanation = {
  topicId: string;
  subskillId: string;
  gradeId: string;
  explanation: string;
  example: string;
  sourceVersion: string;
  provisional: true;
};

export function provisionalExplanationInput(
  gradeId: string, subjectId: string, topicId: string, subskillId: string,
): ExplanationProviderInput | null {
  const diagnostic = getDiagnostic(gradeId, subjectId, topicId, "demo");
  if (diagnostic.status !== 200 || !diagnostic.questions.some((question) => question.skill === subskillId)) return null;
  const lesson = getStudyDemo(gradeId, subjectId, topicId);
  const level = explanationLevelForGrade(gradeId);
  if (!lesson || !level) return null;
  const chapter = pickStudyChapter(lesson, subskillId);
  return {
    gradeId, subjectId, topicId, topicName: lesson.title, subskillId,
    sourceVersion: "study-draft-v1", sourceStatus: "provisional",
    explanation: chapter.explanation,
    example: chapter.example,
    reference: "Borrador local de Apoyo académico", level, exampleIndex: 0,
  };
}

export function validateProvisionalExplanation(output: unknown, input: ExplanationProviderInput): ProvisionalExplanation | null {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  const data = output as Record<string, unknown>;
  if (data.topicId !== input.topicId || data.subskillId !== input.subskillId ||
      data.sourceVersion !== input.sourceVersion ||
      typeof data.explanation !== "string" || typeof data.example !== "string" ||
      data.explanation !== data.explanation.trim() || data.example !== data.example.trim() ||
      data.explanation.length < 20 || data.example.length < 20 ||
      !input.explanation.includes(data.explanation) || !input.example.includes(data.example) ||
      words(data.explanation) > input.level.maxExplanationWords || words(data.example) > input.level.maxExampleWords) return null;
  return {
    topicId: input.topicId, subskillId: input.subskillId, gradeId: input.gradeId,
    explanation: data.explanation, example: data.example,
    sourceVersion: input.sourceVersion, provisional: true,
  };
}
