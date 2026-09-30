import type { Grade, Subject, Topic } from "./catalog";

export type Selection = {
  gradeId: string | null;
  subjectId: Subject["id"] | null;
  topicId: string | null;
};

export const emptySelection: Selection = { gradeId: null, subjectId: null, topicId: null };

export function selectGrade(selection: Selection, gradeId: string): Selection {
  if (selection.gradeId === gradeId) return selection;
  return { gradeId, subjectId: null, topicId: null };
}

export function selectSubject(selection: Selection, subjectId: Subject["id"]): Selection {
  if (!selection.gradeId) return emptySelection;
  if (selection.subjectId === subjectId) return selection;
  return { ...selection, subjectId, topicId: null };
}

export function selectTopic(selection: Selection, topicId: string): Selection {
  if (!selection.gradeId || !selection.subjectId) return { ...selection, topicId: null };
  return { ...selection, topicId };
}

export function validSelection(
  selection: Selection,
  grades: readonly Grade[],
  subjects: readonly Subject[],
  topics: readonly Topic[],
): Selection {
  const grade = grades.find((item) => item.id === selection.gradeId);
  if (!grade) return emptySelection;

  const subject = subjects.find((item) =>
    item.id === selection.subjectId && item.grades.includes(grade.number),
  );
  if (!subject) return { gradeId: grade.id, subjectId: null, topicId: null };

  const topic = topics.find((item) =>
    item.id === selection.topicId &&
    item.gradeId === grade.id &&
    item.subjectId === subject.id &&
    item.active &&
    item.pilotCandidate,
  );
  return { gradeId: grade.id, subjectId: subject.id, topicId: topic?.id ?? null };
}
