import { getDemoTopics, getPublishedTopics, type SubjectId } from "./catalog.ts";

export type QuestionView = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
};

type DemoQuestion = QuestionView & {
  topicId: string;
  skill: string;
  difficulty: "inicial";
  correctOptionId: string;
  explanation: string;
  validation: "demo-unreviewed";
};

// Banco exclusivo de demostración. Las respuestas y explicaciones no salen en GET.
// Ninguna pregunta de este archivo cuenta como validada para publicación.
const demoBank: readonly DemoQuestion[] = [
  { id: "demo-g05-mat-01", topicId: "G05-MAT", skill: "sumar fracciones", difficulty: "inicial", prompt: "¿Cuánto es 1/2 + 1/4?", options: [{ id: "a", text: "2/6" }, { id: "b", text: "3/4" }, { id: "c", text: "1/4" }], correctOptionId: "b", explanation: "1/2 equivale a 2/4; 2/4 + 1/4 = 3/4.", validation: "demo-unreviewed" },
  { id: "demo-g05-mat-02", topicId: "G05-MAT", skill: "equivalencias", difficulty: "inicial", prompt: "¿Qué fracción equivale a 1/2?", options: [{ id: "a", text: "2/4" }, { id: "b", text: "1/3" }, { id: "c", text: "3/4" }], correctOptionId: "a", explanation: "Al multiplicar numerador y denominador de 1/2 por 2 se obtiene 2/4.", validation: "demo-unreviewed" },
  { id: "demo-g05-esp-01", topicId: "G05-ESP", skill: "propósito del texto", difficulty: "inicial", prompt: "Para informar sobre el reciclaje, ¿qué conviene definir primero?", options: [{ id: "a", text: "El tema y a quién va dirigido" }, { id: "b", text: "El color de la hoja" }, { id: "c", text: "La última palabra" }], correctOptionId: "a", explanation: "Definir tema y lectores ayuda a planear el contenido del texto.", validation: "demo-unreviewed" },
  { id: "demo-g05-esp-02", topicId: "G05-ESP", skill: "estructura", difficulty: "inicial", prompt: "¿Cuál organización ayuda a un texto informativo?", options: [{ id: "a", text: "Ideas sin orden" }, { id: "b", text: "Introducción, desarrollo y cierre" }, { id: "c", text: "Solo un título" }], correctOptionId: "b", explanation: "Una estructura clara permite presentar y desarrollar la información.", validation: "demo-unreviewed" },
  { id: "demo-g10-mat-01", topicId: "G10-MAT", skill: "razón trigonométrica", difficulty: "inicial", prompt: "En un triángulo rectángulo, ¿qué razón es seno de un ángulo agudo?", options: [{ id: "a", text: "Cateto opuesto / hipotenusa" }, { id: "b", text: "Cateto adyacente / hipotenusa" }, { id: "c", text: "Hipotenusa / cateto opuesto" }], correctOptionId: "a", explanation: "El seno relaciona el cateto opuesto con la hipotenusa.", validation: "demo-unreviewed" },
  { id: "demo-g10-mat-02", topicId: "G10-MAT", skill: "razón trigonométrica", difficulty: "inicial", prompt: "Si el cateto opuesto mide 3 y la hipotenusa 5, ¿cuál es el seno?", options: [{ id: "a", text: "5/3" }, { id: "b", text: "3/5" }, { id: "c", text: "2/5" }], correctOptionId: "b", explanation: "Seno = cateto opuesto / hipotenusa = 3/5.", validation: "demo-unreviewed" },
  { id: "demo-g10-esp-01", topicId: "G10-ESP", skill: "argumentación", difficulty: "inicial", prompt: "¿Qué elemento sostiene mejor una opinión en un texto argumentativo?", options: [{ id: "a", text: "Una razón respaldada por evidencia" }, { id: "b", text: "Repetir la opinión muchas veces" }, { id: "c", text: "Evitar el tema" }], correctOptionId: "a", explanation: "La evidencia permite evaluar la razón que respalda una postura.", validation: "demo-unreviewed" },
  { id: "demo-g10-esp-02", topicId: "G10-ESP", skill: "lectura crítica", difficulty: "inicial", prompt: "Al leer una afirmación, ¿qué ayuda a evaluarla críticamente?", options: [{ id: "a", text: "Comprobar la fuente y sus evidencias" }, { id: "b", text: "Creerla por su extensión" }, { id: "c", text: "Ignorar quién la escribió" }], correctOptionId: "a", explanation: "Revisar fuentes y evidencias ayuda a valorar la afirmación.", validation: "demo-unreviewed" },
  { id: "demo-g10-fis-01", topicId: "G10-FIS", skill: "fuerza neta", difficulty: "inicial", prompt: "Dos fuerzas de 3 N y 2 N actúan en la misma dirección. ¿Cuál es la fuerza neta?", options: [{ id: "a", text: "1 N" }, { id: "b", text: "5 N" }, { id: "c", text: "6 N" }], correctOptionId: "b", explanation: "Las fuerzas en la misma dirección se suman: 3 N + 2 N = 5 N.", validation: "demo-unreviewed" },
  { id: "demo-g10-fis-02", topicId: "G10-FIS", skill: "movimiento", difficulty: "inicial", prompt: "Si la fuerza neta sobre un objeto es cero, ¿qué puede ocurrir?", options: [{ id: "a", text: "Permanece en reposo o sigue a velocidad constante" }, { id: "b", text: "Siempre acelera" }, { id: "c", text: "Siempre se detiene" }], correctOptionId: "a", explanation: "Sin fuerza neta no cambia su estado de movimiento.", validation: "demo-unreviewed" },
  { id: "demo-g10-qui-01", topicId: "G10-QUI", skill: "balanceo", difficulty: "inicial", prompt: "En H₂ + O₂ → H₂O, ¿qué coeficiente lleva H₂O al balancear la ecuación?", options: [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }], correctOptionId: "b", explanation: "La ecuación balanceada es 2 H₂ + O₂ → 2 H₂O.", validation: "demo-unreviewed" },
  { id: "demo-g10-qui-02", topicId: "G10-QUI", skill: "conservación", difficulty: "inicial", prompt: "Al balancear una reacción química, ¿qué debe conservarse?", options: [{ id: "a", text: "La cantidad de átomos de cada elemento" }, { id: "b", text: "El orden de las palabras" }, { id: "c", text: "El número de sustancias" }], correctOptionId: "a", explanation: "Debe haber igual número de átomos de cada elemento a ambos lados.", validation: "demo-unreviewed" },
];

export function createDiagnosticReader(bank: readonly DemoQuestion[]) {
  return function getDiagnostic(gradeId: string, subjectId: string, topicId: string, mode: string) {
    if (mode !== "demo" && mode !== "published") return { status: 400, error: "Modo no válido." } as const;
    const subject = subjectId as SubjectId;
    const topics = mode === "demo" ? getDemoTopics(gradeId, subject) : getPublishedTopics(gradeId, subject);
    if (!topics.some((item) => item.id === topicId)) {
      return { status: mode === "demo" ? 400 : 409, error: mode === "demo" ? "La selección no corresponde a un tema piloto activo." : "Este tema aún no tiene contenido aprobado para estudiantes." } as const;
    }
    if (mode === "published") return { status: 409, error: "Aún no hay un banco de preguntas aprobado para este tema." } as const;
    const questions = bank.filter((question) => question.topicId === topicId);
    if (questions.length < 1) return { status: 409, error: "Aún no hay preguntas de demostración para este tema." } as const;
    return { status: 200, mode: "demo", questions: questions.map(({ id, prompt, options }) => ({ id, prompt, options })) } as const;
  };
}

export const getDiagnostic = createDiagnosticReader(demoBank);

export function evaluateDemoAnswer(gradeId: string, subjectId: string, topicId: string, questionId: string, optionId: string) {
  const diagnostic = getDiagnostic(gradeId, subjectId, topicId, "demo");
  if (diagnostic.status !== 200) return diagnostic;
  const question = demoBank.find((item) => item.topicId === topicId && item.id === questionId);
  if (!question) return { status: 400, error: "La pregunta no pertenece al tema seleccionado." } as const;
  if (!question.options.some((option) => option.id === optionId)) return { status: 400, error: "Selecciona una respuesta válida." } as const;
  return { status: 200, mode: "demo", correct: question.correctOptionId === optionId, correctOptionId: question.correctOptionId, explanation: question.explanation } as const;
}
