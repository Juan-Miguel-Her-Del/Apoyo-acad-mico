// Identificador estable para valorar una versión concreta del borrador.
// No incluye respuestas ni datos personales del estudiante.
export function demoExplanationId(topicId: string, subskillId?: string, exampleIndex = 0) {
  return subskillId === undefined ? `study-draft-v1:${topicId}`
    : `study-draft-v1:${topicId}:${exampleIndex}:${encodeURIComponent(subskillId)}`;
}
