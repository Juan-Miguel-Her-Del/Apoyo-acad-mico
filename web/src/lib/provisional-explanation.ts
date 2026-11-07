import { demoDiagnosticSkills } from "./diagnostic-skills.ts";
import { explanationLevelForGrade, words } from "./explanation-adaptation.ts";
import type { ExplanationProviderInput } from "./explanation-service.ts";
import { getStudyDemo, pickStudyChapter } from "./study-demo.ts";
import { selectReviewedExample } from "./explanation-examples.ts";

export type ProvisionalExplanation = {
  topicId: string;
  subskillId: string;
  gradeId: string;
  explanation: string;
  example: string;
  sourceVersion: string;
  exampleIndex: number;
  hasAnotherExample: boolean;
  provisional: true;
};

export function provisionalExplanationInput(
  gradeId: string, subjectId: string, topicId: string, subskillId: string,
  exampleIndex = 0,
): ExplanationProviderInput | null {
  if (!demoDiagnosticSkills(gradeId, subjectId, topicId)?.has(subskillId)) return null;
  const lesson = getStudyDemo(gradeId, subjectId, topicId);
  const level = explanationLevelForGrade(gradeId);
  if (!lesson || !level) return null;
  const chapter = pickStudyChapter(lesson, subskillId);
  const chosen = selectReviewedExample({ example: chapter.example,
    alternateExamples: chapter.alternateExample ? [chapter.alternateExample] : [] }, exampleIndex);
  if (chosen.status !== "ready") return null;
  return {
    gradeId, subjectId, topicId, topicName: lesson.title, subskillId,
    sourceVersion: "study-draft-v1", sourceStatus: "provisional",
    explanation: chapter.explanation,
    example: chosen.example,
    reference: "Borrador local de Apoyo académico", level, exampleIndex: chosen.index,
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
    sourceVersion: input.sourceVersion, exampleIndex: input.exampleIndex,
    hasAnotherExample: input.exampleIndex === 0 && !!provisionalExplanationInput(input.gradeId,
      input.subjectId, input.topicId, input.subskillId, 1), provisional: true,
  };
}
