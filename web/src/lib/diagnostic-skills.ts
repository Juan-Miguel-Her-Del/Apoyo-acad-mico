import { getDiagnostic } from "./diagnostic.ts";
import { getAdaptiveDiagnosticBank } from "./diagnostic-adaptive.ts";

// La vista previa y el intento persistente usan bancos provisionales distintos.
// Ambos identificadores deben poder abrir la explicación del mismo tema.
export function demoDiagnosticSkills(gradeId: string, subjectId: string, topicId: string): Set<string> | null {
  const preview = getDiagnostic(gradeId, subjectId, topicId, "demo");
  if (preview.status !== 200) return null;
  const savedAttemptBank = getAdaptiveDiagnosticBank(gradeId, subjectId, topicId);
  return new Set([
    ...preview.questions.map((question) => question.skill),
    ...(savedAttemptBank ?? []).map((question) => question.skill),
  ]);
}
