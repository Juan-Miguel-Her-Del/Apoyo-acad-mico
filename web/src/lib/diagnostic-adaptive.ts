import { getPracticeBank } from "./practice.ts";

export type DiagnosticDifficulty = 1 | 2;

export type AdaptiveDiagnosticQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  skill: string;
  difficulty: DiagnosticDifficulty;
  correctOptionId: string;
  explanation?: string;
  provisional: true;
};

export type DiagnosticAnswerForSelection = {
  questionId: string;
  correct: boolean;
};

export type AdaptiveSelection =
  | {
      status: "selected";
      question: AdaptiveDiagnosticQuestion;
      requestedDifficulty: DiagnosticDifficulty;
      selectedDifficulty: DiagnosticDifficulty;
      fallback: boolean;
    }
  | { status: "exhausted"; reason: "bank-exhausted" };

/**
 * Questions remain a demonstration fixture. The diagnostic uses independent IDs,
 * although the provisional prompts currently come from the practice fixture.
 * Never pass this server-side bank directly to a client: it includes answer keys.
 */
export function getAdaptiveDiagnosticBank(
  gradeId: string,
  subjectId: string,
  topicId: string,
): AdaptiveDiagnosticQuestion[] | null {
  const provisional = getPracticeBank(gradeId, subjectId, topicId);
  if (!provisional) return null;
  return provisional.map(({ id, prompt, options, skillId, difficulty, correctOptionId, explanation }) => ({
    id: id.replace(/^practice-/, "diagnostic-"),
    prompt,
    options: options.map((option) => ({ ...option })),
    skill: skillId,
    difficulty,
    correctOptionId,
    explanation,
    provisional: true,
  }));
}

/**
 * Deterministic rule: begin at level 1; a correct answer requests one level
 * harder, an incorrect answer one level easier, clamped to 1..2. Select the
 * first unanswered question of the requested level. If that level is empty,
 * choose the first unanswered question in the other level. Never repeat an ID.
 */
export function selectNextDiagnosticQuestion({
  questions,
  answers,
  startDifficulty = 1,
}: {
  questions: readonly AdaptiveDiagnosticQuestion[];
  answers: readonly DiagnosticAnswerForSelection[];
  startDifficulty?: DiagnosticDifficulty;
}): AdaptiveSelection {
  if (startDifficulty !== 1 && startDifficulty !== 2) {
    throw new RangeError("La dificultad inicial debe ser 1 o 2.");
  }
  const questionsById = new Map<string, AdaptiveDiagnosticQuestion>();
  for (const question of questions) {
    if (!question.id || (question.difficulty !== 1 && question.difficulty !== 2)
      || questionsById.has(question.id)
      || !question.options.some((option) => option.id === question.correctOptionId)) {
      throw new Error("Banco diagnóstico inválido.");
    }
    questionsById.set(question.id, question);
  }
  const answeredIds = new Set<string>();
  for (const answer of answers) {
    if (typeof answer.correct !== "boolean" || !questionsById.has(answer.questionId)
      || answeredIds.has(answer.questionId)) {
      throw new Error("Historial diagnóstico inválido.");
    }
    answeredIds.add(answer.questionId);
  }

  const lastAnswer = answers.at(-1);
  const lastDifficulty = lastAnswer ? questionsById.get(lastAnswer.questionId)!.difficulty : startDifficulty;
  const requestedDifficulty: DiagnosticDifficulty = !lastAnswer
    ? startDifficulty
    : lastAnswer.correct
      ? Math.min(2, lastDifficulty + 1) as DiagnosticDifficulty
      : Math.max(1, lastDifficulty - 1) as DiagnosticDifficulty;
  const available = questions.filter((question) => !answeredIds.has(question.id));
  const selected = available.find((question) => question.difficulty === requestedDifficulty) ?? available[0];
  if (!selected) return { status: "exhausted", reason: "bank-exhausted" };
  return {
    status: "selected",
    question: selected,
    requestedDifficulty,
    selectedDifficulty: selected.difficulty,
    fallback: selected.difficulty !== requestedDifficulty,
  };
}
