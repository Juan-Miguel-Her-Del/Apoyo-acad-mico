import type { ReviewedExplanationSource } from "./explanation-context.ts";

function normalize(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("es");
}

export type ExampleChoice =
  | { status: "ready"; example: string; index: number; hasAnotherExample: boolean }
  | { status: "unavailable"; reason: "invalid_index" | "no_alternative_example" | "duplicate_example" };

// Los ejemplos alternativos se revisan junto con la explicación. La IA solo
// puede extraer un fragmento literal del ejemplo seleccionado.
export function selectReviewedExample(source: Pick<ReviewedExplanationSource, "example" | "alternateExamples">, index: number): ExampleChoice {
  if (!Number.isInteger(index) || index < 0 || index > 1) {
    return { status: "unavailable", reason: "invalid_index" };
  }
  const alternative = source.alternateExamples?.[0];
  if (alternative !== undefined && (!alternative.trim() || normalize(alternative) === normalize(source.example))) {
    return { status: "unavailable", reason: "duplicate_example" };
  }
  if (index === 1 && !alternative) return { status: "unavailable", reason: "no_alternative_example" };
  return { status: "ready", example: index === 0 ? source.example : alternative!,
    index, hasAnotherExample: index === 0 && !!alternative };
}
