export const PILOT_TOPICS = ["G05-MAT", "G05-ESP", "G10-MAT", "G10-ESP", "G10-FIS", "G10-QUI"] as const;
export type ReviewCase = {
  topicId: string; caseId: string; kind: "normal" | "wrong-answer" | "boundary";
  sourceVersion: string; promptVersion: string; model: string;
  input: string; output: string; reviewer: string; reviewedAt: string;
  scores: { accuracy: number; gradeFit: number; clarity: number; safety: number; sourceFidelity: number };
  severity: "none" | "minor" | "major" | "critical";
  decision: "accept" | "revise" | "block"; findings: string;
};

export function auditAiReviews(value: unknown) {
  const records = Array.isArray(value) ? value : [];
  const valid: ReviewCase[] = [];
  const invalid: string[] = [];
  const ids = new Set<string>();
  for (const [index, item] of records.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) { invalid.push(`Fila ${index + 1}: formato inválido.`); continue; }
    const row = item as Partial<ReviewCase>;
    const strings = [row.caseId, row.sourceVersion, row.promptVersion, row.model, row.input, row.output,
      row.reviewer, row.reviewedAt, row.findings];
    const scoreNames = ["accuracy", "gradeFit", "clarity", "safety", "sourceFidelity"] as const;
    const scores = row.scores && scoreNames.map((name) => row.scores?.[name]);
    if (!PILOT_TOPICS.some((id) => id === row.topicId) ||
      !["normal", "wrong-answer", "boundary"].includes(row.kind ?? "") ||
      strings.some((field) => typeof field !== "string" || !field.trim()) ||
      !scores || scores.some((score) => typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 4) ||
      !["none", "minor", "major", "critical"].includes(row.severity ?? "") ||
      !["accept", "revise", "block"].includes(row.decision ?? "") ||
      Number.isNaN(Date.parse(row.reviewedAt ?? ""))) {
      invalid.push(`Fila ${index + 1}: faltan datos o hay valores inválidos.`); continue;
    }
    const unique = `${row.topicId}:${row.caseId}`;
    if (ids.has(unique)) { invalid.push(`Fila ${index + 1}: caso duplicado.`); continue; }
    ids.add(unique);
    valid.push(row as ReviewCase);
  }
  const coverage = PILOT_TOPICS.map((topicId) => {
    const items = valid.filter((item) => item.topicId === topicId);
    return { topicId, count: items.length,
      hasWrongAnswer: items.some((item) => item.kind === "wrong-answer"),
      hasBoundary: items.some((item) => item.kind === "boundary"),
      complete: items.length >= 3 && items.some((item) => item.kind === "wrong-answer") &&
        items.some((item) => item.kind === "boundary") };
  });
  const blockers = valid.filter((item) => item.severity === "critical" || item.severity === "major" || item.decision !== "accept");
  return { reviewed: valid.length, required: PILOT_TOPICS.length * 3, coverage, invalid,
    blockers: blockers.map((item) => `${item.topicId}:${item.caseId}`),
    reviewGatePassed: invalid.length === 0 && coverage.every((item) => item.complete) && blockers.length === 0 };
}
