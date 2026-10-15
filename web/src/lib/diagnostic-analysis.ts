export type SkillQuestion = { id: string; skill?: string };
export type EvaluatedAnswer = { questionId: string; correct: boolean };
export type SkillResult = {
  skill: string;
  questionIds: string[];
  answered: number;
  correct: number;
  status: "dificultad-demo" | "sin-senal-demo" | "indeterminado";
};

export type DiagnosticSkillInsight = SkillResult & {
  strength: boolean;
  confidence: number | null;
  confidenceLevel: "insuficiente" | "baja" | "media" | "alta";
};

export const MIN_DIAGNOSTIC_SKILL_ANSWERS = 2;

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

/**
 * Heurística provisional de confianza en la señal observada, no probabilidad
 * de dominio: 100 × n/(n+2) × |2 × aciertos/n − 1|, redondeada. El primer
 * factor penaliza muestras pequeñas y el segundo resultados contradictorios.
 * Con menos de dos respuestas no se muestra porcentaje ni fortaleza.
 */
export function diagnosticSkillInsights(
  questions: readonly SkillQuestion[], answers: readonly EvaluatedAnswer[],
) {
  const analysis = analyzeDemoSkills(questions, answers);
  const skills: DiagnosticSkillInsight[] = analysis.results.filter((item) => item.answered > 0).map((item) => {
    const n = item.answered;
    const confidence = n < MIN_DIAGNOSTIC_SKILL_ANSWERS ? null
      : Math.round(100 * n / (n + 2) * Math.abs(2 * item.correct / n - 1));
    const confidenceLevel = confidence === null ? "insuficiente"
      : confidence < 50 ? "baja" : confidence < 75 ? "media" : "alta";
    return {
      ...item,
      strength: n >= MIN_DIAGNOSTIC_SKILL_ANSWERS && item.correct === n,
      confidence,
      confidenceLevel,
    };
  });
  return { skills, strengths: skills.filter((item) => item.strength),
    unmappedQuestionIds: analysis.unmappedQuestionIds };
}
