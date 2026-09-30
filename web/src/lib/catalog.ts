export type SubjectId = "MAT" | "ESP" | "FIS" | "QUI";
export type GradeGroup = "Primaria" | "Bachillerato";

export type Grade = {
  id: string;
  number: number;
  label: string;
  group: GradeGroup;
  formalCycle: "Básica primaria" | "Básica secundaria" | "Media";
};

export type Subject = {
  id: SubjectId;
  name: string;
  grades: readonly number[];
};

export type Topic = {
  id: string;
  gradeId: string;
  subjectId: SubjectId;
  name: string;
  dba: string | null;
  pilotCandidate: boolean;
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
}));

export const subjects: readonly Subject[] = [
  { id: "MAT", name: "Matemáticas", grades: gradeNumbers },
  { id: "ESP", name: "Español", grades: gradeNumbers },
  { id: "FIS", name: "Física", grades: [10, 11] },
  { id: "QUI", name: "Química", grades: [10, 11] },
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
  "Producción de textos informativos",
  "Tipos de texto y propósito comunicativo",
  "Lectura crítica y argumentos sencillos",
  "Interpretación de textos",
  "Comparación de fuentes",
  "Comprensión crítica de textos",
  "Textos argumentativos sustentados",
];

const baseTopics: Topic[] = gradeNumbers.flatMap((number) => {
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

export const topics: readonly Topic[] = [
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

export function getDemoTopics(gradeId: string, subjectId: SubjectId): Topic[] {
  return topics.filter(
    (topic) =>
      topic.pilotCandidate &&
      topic.gradeId === gradeId &&
      topic.subjectId === subjectId,
  );
}

export function getDemoSubjects(gradeId: string): Subject[] {
  const grade = grades.find((item) => item.id === gradeId);
  if (!grade) return [];

  return subjects.filter(
    (subject) =>
      subject.grades.includes(grade.number) &&
      getDemoTopics(gradeId, subject.id).length > 0,
  );
}

export function isDemoGrade(gradeId: string): boolean {
  return topics.some(
    (topic) => topic.pilotCandidate && topic.gradeId === gradeId,
  );
}
