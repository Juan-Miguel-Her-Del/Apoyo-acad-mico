import { topics, type Topic } from "./catalog.ts";
import { getPracticeSkills } from "./practice-skills.ts";
import type { SkillTotal } from "./progress-insights.ts";

export type SavedSelection = { gradeId: string; subjectId: string; topicId: string };
export type Recommendation = {
  topicId: string; skillId: string | null; skillLabel: string | null;
  kind: "difficulty" | "neutral"; reason: string;
};
export type StudyStreak = { days: number; lastStudyDay: string | null; timeZone: "America/Bogota" };

export function availableSelection(value: unknown, catalog: readonly Topic[] = topics): SavedSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { gradeId, subjectId, topicId } = value as Record<string, unknown>;
  if (typeof gradeId !== "string" || typeof subjectId !== "string" || typeof topicId !== "string") return null;
  return catalog.some((item) => item.id === topicId && item.gradeId === gradeId &&
    item.subjectId === subjectId && item.active && item.pilotCandidate)
    ? { gradeId, subjectId, topicId } : null;
}

export function recommendStudy(selection: SavedSelection | null,
  totals: readonly SkillTotal[], catalog: readonly Topic[] = topics): Recommendation | null {
  if (!selection) return null;
  const candidates = catalog.filter((item) => item.active && item.pilotCandidate &&
    item.gradeId === selection.gradeId).sort((a, b) => a.order - b.order);
  if (!candidates.length) return null;
  const scored = candidates.flatMap((topic) => getPracticeSkills(topic.id).flatMap((skill) => {
    const total = totals.find((item) => item.skillId === skill.id);
    if (!total || !Number.isInteger(total.completeAttempts) || total.completeAttempts < 2 ||
      !Number.isInteger(total.answered) || total.answered < 2 ||
      !Number.isInteger(total.correctCount) || total.correctCount < 0 ||
      total.correctCount > total.answered) return [];
    const percent = total.correctCount / total.answered;
    return percent < 0.8 ? [{ topic, skill, percent, answered: total.answered }] : [];
  }));
  scored.sort((a, b) => a.percent - b.percent || b.answered - a.answered ||
    a.topic.order - b.topic.order || a.skill.id.localeCompare(b.skill.id));
  if (scored.length) {
    const first = scored[0];
    return { topicId: first.topic.id, skillId: first.skill.id, skillLabel: first.skill.label,
      kind: "difficulty", reason: `En tus prácticas completas, ${first.skill.label.toLowerCase()} tuvo ${Math.round(first.percent * 100)} % de aciertos. Puedes repasarlo.` };
  }
  const next = candidates.find((item) => item.id !== selection.topicId) ?? candidates[0];
  return { topicId: next.id, skillId: null, skillLabel: null, kind: "neutral",
    reason: "Aún no hay evidencia suficiente de dificultad; esta es una opción para explorar." };
}

function dayInBogota(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric",
    month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function previousDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
}

// Cuenta días con práctica terminada y al menos una respuesta. Una actividad
// ayer conserva la racha hasta que finalice el día actual en Bogotá.
export function studyStreak(completedAt: readonly string[], now = new Date()): StudyStreak {
  const days = new Set(completedAt.map(dayInBogota).filter((day): day is string => day !== null));
  const today = dayInBogota(now.toISOString())!;
  let cursor = days.has(today) ? today : previousDay(today);
  let count = 0;
  while (days.has(cursor)) { count++; cursor = previousDay(cursor); }
  return { days: count, lastStudyDay: [...days].sort().at(-1) ?? null, timeZone: "America/Bogota" };
}
