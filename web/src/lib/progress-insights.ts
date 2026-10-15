import type { PracticeHistoryItem } from "./practice-history.ts";

type SkillHistoryItem = PracticeHistoryItem & {
  skills?: readonly { skillId: string; answered: number; correctCount: number }[];
};

export type ProgressPoint = {
  id: string;
  completedAt: string;
  correct: number;
  answered: number;
  percent: number;
  complete: boolean;
};

export type SkillInsight = {
  topicId: string;
  skillId: string;
  points: ProgressPoint[];
  completeAttempts: number;
  answered: number;
  correct: number;
  observedPercent: number | null;
  level: "indeterminate" | "initial" | "developing" | "high";
  historyAvailable: boolean;
};

export type SkillTotal = {
  skillId: string;
  completeAttempts: number;
  answered: number;
  correctCount: number;
};

// Regla exclusiva del prototipo: dos prácticas completas y dos respuestas
// del mismo subtema. Un banco provisional no valida dominio académico.
export const MIN_COMPLETE_ATTEMPTS = 2;
export const MIN_SKILL_ANSWERS = 2;

export function skillInsight(items: readonly SkillHistoryItem[], topicId: string, skillId: string,
  totals: readonly SkillTotal[] | null): SkillInsight {
  const points = items.flatMap((item) => {
    if (item.topicId !== topicId || item.status !== "completed" || !item.completedAt ||
      !Number.isInteger(item.total) || !Number.isInteger(item.answered) ||
      item.answered < 0 || item.answered > item.total) return [];
    const skill = item.skills?.find((value) => value.skillId === skillId);
    if (!skill || !Number.isInteger(skill.answered) || skill.answered <= 0 ||
      !Number.isInteger(skill.correctCount) || skill.correctCount < 0 || skill.correctCount > skill.answered ||
      skill.answered > item.answered) return [];
    return [{ id: item.id, completedAt: item.completedAt, correct: skill.correctCount,
      answered: skill.answered, percent: Math.round(skill.correctCount / skill.answered * 100),
      complete: item.answered === item.total }];
  }).sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id));
  const total = totals?.find((value) => value.skillId === skillId);
  const validTotal = !total || (Number.isInteger(total.completeAttempts) && total.completeAttempts >= 0 &&
    Number.isInteger(total.answered) && total.answered >= 0 &&
    Number.isInteger(total.correctCount) && total.correctCount >= 0 &&
    total.correctCount <= total.answered && total.completeAttempts <= total.answered);
  const historyAvailable = totals !== null && validTotal;
  const completeAttempts = historyAvailable ? total?.completeAttempts ?? 0 : 0;
  const answered = historyAvailable ? total?.answered ?? 0 : 0;
  const correct = historyAvailable ? total?.correctCount ?? 0 : 0;
  const observedPercent = answered > 0 ? Math.round(correct / answered * 100) : null;
  const sufficient = completeAttempts >= MIN_COMPLETE_ATTEMPTS && answered >= MIN_SKILL_ANSWERS;
  const level = !sufficient || observedPercent === null ? "indeterminate"
    : observedPercent < 50 ? "initial" : observedPercent < 80 ? "developing" : "high";
  return { topicId, skillId, points, completeAttempts,
    answered, correct, observedPercent, level, historyAvailable };
}
