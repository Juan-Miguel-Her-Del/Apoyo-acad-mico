export type PracticeHistoryItem = {
  id: string;
  gradeId: string;
  subjectId: string;
  topicId: string;
  status: "open" | "completed";
  total: number;
  answered: number;
  correctCount: number;
  startedAt: string;
  completedAt: string | null;
  skills?: { skillId: string; answered: number; correctCount: number }[];
};

export type ComparableSession = Pick<PracticeHistoryItem,
  "id" | "topicId" | "status" | "answered" | "correctCount" | "completedAt">;

export function compareCompletedSessions<T extends ComparableSession>(items: readonly T[], topicId: string) {
  const completed = items.filter((item) => item.topicId === topicId && item.status === "completed" && item.completedAt);
  const scored = completed.filter((item) => item.answered > 0)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!) || b.id.localeCompare(a.id));
  const [latest, previous] = scored;
  if (!latest || !previous) return { status: "insufficient" as const, latest: latest ?? null, previous: null, deltaPoints: null };
  const latestPercent = Math.round(latest.correctCount / latest.answered * 100);
  const previousPercent = Math.round(previous.correctCount / previous.answered * 100);
  return { status: "ready" as const, latest, previous, deltaPoints: latestPercent - previousPercent };
}

export function comparePracticeSessions(items: readonly PracticeHistoryItem[], topicId: string) {
  return compareCompletedSessions(items, topicId);
}
