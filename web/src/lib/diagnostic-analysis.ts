export type SkillQuestion = { id: string; skill?: string };
export type EvaluatedAnswer = { questionId: string; correct: boolean };
export type SkillResult = {
  skill: string;
  questionIds: string[];
  answered: number;
  correct: number;
  status: "dificultad-demo" | "sin-senal-demo" | "indeterminado";
};

// Regla provisional para la demostración, no un criterio académico validado.
// Con menos de dos respuestas o con un acierto de dos, no inferimos dificultad.
export function analyzeDemoSkills(questions: readonly SkillQuestion[], answers: readonly EvaluatedAnswer[]) {
  const answerByQuestion = new Map<string, boolean>();
  for (const answer of answers) {
    if (!answerByQuestion.has(answer.questionId)) answerByQuestion.set(answer.questionId, answer.correct);
  }

  const groups = new Map<string, SkillResult>();
  const questionIds = new Set<string>();
  const unmappedQuestionIds: string[] = [];
  for (const question of questions) {
    if (questionIds.has(question.id)) continue;
    questionIds.add(question.id);
    const skill = question.skill?.trim();
    if (!skill) {
      unmappedQuestionIds.push(question.id);
      continue;
    }
    const group = groups.get(skill) ?? { skill, questionIds: [], answered: 0, correct: 0, status: "indeterminado" as const };
    group.questionIds.push(question.id);
    const correct = answerByQuestion.get(question.id);
    if (typeof correct === "boolean") {
      group.answered += 1;
      if (correct) group.correct += 1;
    }
    groups.set(skill, group);
  }

  for (const answer of answerByQuestion.keys()) {
    if (!questionIds.has(answer)) unmappedQuestionIds.push(answer);
  }
  const results = [...groups.values()].map((group): SkillResult => ({
    ...group,
    status: group.answered < 2 || (group.correct > 0 && group.correct < group.answered)
      ? "indeterminado"
      : group.correct === 0 ? "dificultad-demo" : "sin-senal-demo",
  }));
  return { results, unmappedQuestionIds };
}
