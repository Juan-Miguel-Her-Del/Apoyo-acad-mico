import { grades } from "./catalog.ts";

export type ExplanationLevel = {
  id: "initial-primary" | "upper-primary" | "basic-secondary" | "media";
  gradeId: string;
  gradeNumber: number;
  vocabulary: string;
  depth: string;
  maxExplanationWords: number;
  maxExampleWords: number;
};

// Reglas de presentación, no aprobación curricular. Cada texto sigue necesitando
// una fuente revisada específicamente para el tema y grado del catálogo.
export function explanationLevelForGrade(gradeId: string): ExplanationLevel | null {
  const grade = grades.find((item) => item.id === gradeId && item.active);
  if (!grade) return null;
  const stage = grade.number <= 3 ? {
    id: "initial-primary" as const, vocabulary: "palabras cotidianas y frases cortas",
    depth: "un paso y una idea concreta", maxExplanationWords: 45, maxExampleWords: 45,
  } : grade.number <= 5 ? {
    id: "upper-primary" as const, vocabulary: "términos escolares explicados con palabras sencillas",
    depth: "dos pasos con relación al entorno cercano", maxExplanationWords: 70, maxExampleWords: 65,
  } : grade.number <= 9 ? {
    id: "basic-secondary" as const, vocabulary: "vocabulario disciplinar definido en contexto",
    depth: "relaciones, procedimiento y una justificación breve", maxExplanationWords: 100, maxExampleWords: 90,
  } : {
    id: "media" as const, vocabulary: "vocabulario disciplinar formal explicado cuando aparece",
    depth: "modelo, procedimiento y límites del ejemplo", maxExplanationWords: 130, maxExampleWords: 110,
  };
  return { ...stage, gradeId, gradeNumber: grade.number };
}

export function words(text: string) { return text.trim().split(/\s+/u).filter(Boolean).length; }
