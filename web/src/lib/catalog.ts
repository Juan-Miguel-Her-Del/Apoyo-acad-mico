export type SubjectId = "MAT" | "ESP" | "FIS" | "QUI";
export type GradeGroup = "Primaria" | "Bachillerato";

export type Grade = {
  id: string;
  number: number;
  label: string;
  group: GradeGroup;
  formalCycle: "Básica primaria" | "Básica secundaria" | "Media";
  active: boolean;
  order: number;
};

export type Subject = {
  id: SubjectId;
  name: string;
  grades: readonly number[];
  alias: string;
  active: boolean;
  order: number;
};

export type Topic = {
  id: string;
  gradeId: string;
  subjectId: SubjectId;
  name: string;
  dba: string | null;
  pilotCandidate: boolean;
  active: boolean;
  approvedForPublication: boolean;
  order: number;
  validatedQuestionCount: number;
};

const gradeNumbers = Array.from({ length: 11 }, (_, index) => index + 1);

export const grades: readonly Grade[] = gradeNumbers.map((number) => ({
  id: `G${String(number).padStart(2, "0")}`,
  number,
  label: `${number}.º`,
  group: number <= 5 ? "Primaria" : "Bachillerato",
  formalCycle:
    number <= 5
      ? "Básica primaria"
      : number <= 9
        ? "Básica secundaria"
        : "Media",
  active: true,
  order: number,
}));

export const subjects: readonly Subject[] = [
  { id: "MAT", name: "Matemáticas", alias: "Matemáticas", grades: gradeNumbers, active: true, order: 1 },
  { id: "ESP", name: "Español", alias: "Lengua Castellana", grades: gradeNumbers, active: true, order: 2 },
  { id: "FIS", name: "Física", alias: "Ciencias Naturales: Física", grades: [10, 11], active: true, order: 3 },
  { id: "QUI", name: "Química", alias: "Ciencias Naturales: Química", grades: [10, 11], active: true, order: 4 },
];

// El catálogo propone 26 temas. Solo seis se usan como datos de demostración
// del Sprint 1; ninguno está aprobado para publicarse a estudiantes.
const mathTopics = [
  "Contar y comparar números hasta 100",
  "Valor posicional, sumas y restas",
  "Multiplicación y división",
  "Fracciones y equivalencias",
  "Problemas con fracciones",
  "Números racionales",
  "Razones, proporciones y porcentajes",
  "Expresiones algebraicas y relaciones lineales",
  "Funciones y ecuaciones cuadráticas",
  "Razones y funciones trigonométricas",
  "Funciones, variación y probabilidad",
];

const spanishTopics = [
  "Sonidos, letras y palabras",
  "Lectura de relatos breves",
  "Textos narrativos e informativos",
  "Ideas principales en textos",
  "Planear y producir un texto informativo",
  "Tipos de texto y propósito comunicativo",
  "Lectura crítica y argumentos sencillos",
  "Interpretación de textos",
  "Comparación de fuentes",
  "Comprensión crítica y argumentación sobre textos",
  "Textos argumentativos sustentados",
];

type TopicDraft = Omit<Topic, "active" | "approvedForPublication" | "order" | "validatedQuestionCount">;

const baseTopics: TopicDraft[] = gradeNumbers.flatMap((number) => {
  const gradeId = `G${String(number).padStart(2, "0")}`;
  return [
    {
      id: `${gradeId}-MAT`,
      gradeId,
      subjectId: "MAT" as const,
      name: mathTopics[number - 1],
      dba: number === 5 ? "Matemáticas 5.º, DBA 1 (v.2)" : number === 10 ? "Matemáticas 10.º, DBA 4 (v.2)" : null,
      pilotCandidate: number === 5 || number === 10,
    },
    {
      id: `${gradeId}-ESP`,
      gradeId,
      subjectId: "ESP" as const,
      name: spanishTopics[number - 1],
      dba: number === 5 ? "Lenguaje 5.º, DBA 8 (v.2)" : number === 10 ? "Lenguaje 10.º, DBA 6 (v.2)" : null,
      pilotCandidate: number === 5 || number === 10,
    },
  ];
});

const topicDrafts: readonly TopicDraft[] = [
  ...baseTopics,
  {
    id: "G10-FIS",
    gradeId: "G10",
    subjectId: "FIS",
    name: "Fuerzas y movimiento",
    dba: "Ciencias Naturales 10.º, DBA 1 (v.1)",
    pilotCandidate: true,
  },
  {
    id: "G11-FIS",
    gradeId: "G11",
    subjectId: "FIS",
    name: "Ondas de luz y sonido",
    dba: null,
    pilotCandidate: false,
  },
  {
    id: "G10-QUI",
    gradeId: "G10",
    subjectId: "QUI",
    name: "Reacciones inorgánicas y balanceo",
    dba: "Ciencias Naturales 10.º, DBA 3 (v.1)",
    pilotCandidate: true,
  },
  {
    id: "G11-QUI",
    gradeId: "G11",
    subjectId: "QUI",
    name: "Compuestos orgánicos y sus reacciones",
    dba: null,
    pilotCandidate: false,
  },
];

export const topics: readonly Topic[] = topicDrafts.map((topic, index) => ({
  ...topic,
  active: topic.pilotCandidate,
  approvedForPublication: false,
  order: index + 1,
  validatedQuestionCount: 0,
}));

export function getDemoTopics(gradeId: string, subjectId: SubjectId): Topic[] {
  return topics.filter(
    (topic) =>
      topic.pilotCandidate &&
      topic.active &&
      topic.gradeId === gradeId &&
      topic.subjectId === subjectId,
  ).sort((a, b) => a.order - b.order);
}

export function getDemoSubjects(gradeId: string): Subject[] {
  const grade = grades.find((item) => item.id === gradeId);
  if (!grade?.active) return [];

  return subjects.filter(
    (subject) =>
      subject.active && subject.grades.includes(grade.number) &&
      getDemoTopics(gradeId, subject.id).length > 0,
  ).sort((a, b) => a.order - b.order);
}

export function isDemoGrade(gradeId: string): boolean {
  return grades.some((grade) => grade.id === gradeId && grade.active) && topics.some(
    (topic) => topic.pilotCandidate && topic.gradeId === gradeId,
  );
}

export function getPublishedTopics(gradeId: string, subjectId: SubjectId): Topic[] {
  const grade = grades.find((item) => item.id === gradeId && item.active);
  const subject = subjects.find((item) => item.id === subjectId && item.active);
  if (!grade || !subject?.grades.includes(grade.number)) return [];
  return topics.filter((topic) =>
    topic.gradeId === gradeId &&
    topic.subjectId === subjectId &&
    topic.active &&
    topic.approvedForPublication &&
    topic.validatedQuestionCount > 0,
  );
}

export function getPublishedSubjects(gradeId: string): Subject[] {
  const grade = grades.find((item) => item.id === gradeId && item.active);
  if (!grade) return [];
  return subjects.filter((subject) =>
    subject.active &&
    subject.grades.includes(grade.number) &&
    getPublishedTopics(gradeId, subject.id).length > 0,
  ).sort((a, b) => a.order - b.order);
}

export function isPublishedGrade(gradeId: string): boolean {
  return getPublishedSubjects(gradeId).length > 0;
}
