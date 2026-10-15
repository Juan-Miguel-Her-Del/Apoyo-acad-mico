import type { ReviewedExplanationSource } from "./explanation-context.ts";

// AP-314: solo incluir aquí fuentes con revisión docente y evidencia verificable.
// El catálogo actual no tiene contenido aprobado. Las pruebas inyectan fixtures aisladas.
const reviewedSources: readonly ReviewedExplanationSource[] = [];

export function getReviewedExplanationSource(topicId: string, subskillId: string) {
  return reviewedSources.find((source) => source.topicId === topicId && source.subskillId === subskillId);
}
