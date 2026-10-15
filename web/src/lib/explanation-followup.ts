export type ExplanationRating = "helped" | "confused";

export type ShortCheckSource = {
  id: string;
  explanationId: string;
  prompt: string;
  referenceAnswer: string | null;
  validation: "demo-unreviewed" | "approved";
};

export type ShortCheck =
  | { status: "ready"; id: string; prompt: string; referenceAnswer: string; validation: ShortCheckSource["validation"] }
  | { status: "missing-reference"; id: string; prompt: string }
  | { status: "invalid-source" };

// The source must bind a question and its reference answer to the explanation
// that was actually displayed. This function never invents either value.
export function prepareShortCheck(source: ShortCheckSource | null | undefined, explanationId: string): ShortCheck {
  if (!source || !explanationId || source.explanationId !== explanationId ||
      !source.id.trim() || !source.prompt.trim() || source.prompt.length > 500) {
    return { status: "invalid-source" };
  }
  const prompt = source.prompt.trim();
  const answer = source.referenceAnswer?.trim();
  if (!answer) return { status: "missing-reference", id: source.id, prompt };
  if (answer.length > 200) return { status: "invalid-source" };
  return { status: "ready", id: source.id, prompt, referenceAnswer: answer, validation: source.validation };
}

function normalizedAnswer(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es-CO");
}

export function evaluateShortCheck(check: ShortCheck, answer: unknown):
  { status: "correct" | "incorrect" | "missing-reference" | "invalid-answer" | "invalid-source"; referenceAnswer?: string } {
  if (check.status !== "ready") return { status: check.status };
  if (typeof answer !== "string" || !answer.trim() || answer.length > 200) return { status: "invalid-answer" };
  return normalizedAnswer(answer) === normalizedAnswer(check.referenceAnswer)
    ? { status: "correct" }
    : { status: "incorrect", referenceAnswer: check.referenceAnswer };
}

export type RatingState = { explanationId: string; value: ExplanationRating } | null;

// A repeated click updates the same explanation's rating in this view.
export function updateRating(current: RatingState, explanationId: string, value: ExplanationRating): RatingState {
  if (!explanationId.trim() || (value !== "helped" && value !== "confused")) return current;
  return { explanationId, value };
}
