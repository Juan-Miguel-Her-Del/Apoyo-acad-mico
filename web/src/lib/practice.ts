import { topics } from "./catalog.ts";
import { getStudyDemo } from "./study-demo.ts";

export type PracticeQuestionView = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
};

export type PracticeQuestion = PracticeQuestionView & {
  topicId: string;
  correctOptionId: string;
  explanation: string;
  provisional: true;
};

type Draft = readonly [string, readonly [string, string, string], 0 | 1 | 2, string];

// Segunda pregunta propia de práctica, distinta del diagnóstico y de la
// primera pregunta del estudio. Material provisional pendiente de revisión.
const secondDrafts: Readonly<Record<string, Draft>> = {
  "G01-MAT": ["¿Cuántas decenas tiene el número 62?", ["2", "6", "62"], 1, "62 contiene seis grupos de diez y dos unidades."],
  "G02-MAT": ["Si tienes 124 libros y recibes 20 más, ¿cuántos tienes?", ["126", "144", "324"], 1, "Dos decenas más elevan 124 a 144."],
  "G03-MAT": ["¿Cuántas galletas recibe cada persona si se reparten 18 entre 3 por igual?", ["3", "6", "9"], 1, "18 dividido entre 3 es 6."],
  "G04-MAT": ["¿Cuál fracción equivale a 3/6?", ["1/2", "1/3", "2/3"], 0, "Tres de seis partes son la mitad."],
  "G05-MAT": ["¿Cuánto es 1/3 + 1/6?", ["2/9", "1/2", "1/6"], 1, "1/3 equivale a 2/6; al sumar 1/6 resultan 3/6 o 1/2."],
  "G06-MAT": ["¿Cuánto es −4 + 7?", ["−11", "3", "11"], 1, "Desde −4, siete pasos a la derecha llevan a 3."],
  "G07-MAT": ["¿Cuál es el 10 % de 90?", ["9", "10", "90"], 0, "El 10 % es una décima parte: 90 ÷ 10 = 9."],
  "G08-MAT": ["Si y = 3, ¿cuánto vale 4y − 2?", ["7", "10", "14"], 1, "4 × 3 − 2 = 10."],
  "G09-MAT": ["¿Qué valor satisface x² − 9 = 0?", ["2", "3", "9"], 1, "3² − 9 = 0; también −3 satisface la ecuación."],
  "G10-MAT": ["En un triángulo rectángulo, si el cateto opuesto mide 5 y la hipotenusa 13, ¿cuál es el seno?", ["5/13", "13/5", "12/13"], 0, "El seno se calcula como opuesto dividido entre hipotenusa."],
  "G11-MAT": ["Una moneda equilibrada se lanza una vez. ¿Cuál es la probabilidad de cara?", ["1/4", "1/2", "1"], 1, "Hay dos resultados igualmente probables y uno es cara."],
  "G01-ESP": ["¿Con qué letra empieza la palabra «luna»?", ["n", "l", "u"], 1, "La primera letra de luna es l."],
  "G02-ESP": ["Lee: «Luis abrió el libro, leyó un cuento y luego lo cerró». ¿Qué hizo al final?", ["Abrió el libro", "Leyó un cuento", "Cerró el libro"], 2, "El último hecho narrado es cerrar el libro."],
  "G03-ESP": ["¿Cuál oración presenta información y no un suceso imaginario?", ["La Luna gira alrededor de la Tierra", "La Luna habló con un dragón", "La Luna soñó con un castillo"], 0, "La primera oración comunica un dato comprobable."],
  "G04-ESP": ["Lee: «La bicicleta es útil para desplazarse: no necesita combustible y permite hacer ejercicio». ¿Cuál es la idea principal?", ["La bicicleta es útil para desplazarse", "La bicicleta tiene ruedas", "El combustible es costoso"], 0, "Los demás enunciados desarrollan por qué es útil la bicicleta."],
  "G05-ESP": ["¿Qué subtítulo ayuda a organizar un texto informativo sobre las abejas?", ["Había una vez", "Cómo se alimentan las abejas", "¡Qué bonitas!"], 1, "El subtítulo anuncia información concreta que puede explicarse."],
  "G06-ESP": ["Un aviso dice: «La reunión será a las 9:00 en la biblioteca». ¿Cuál es su propósito?", ["Informar lugar y hora", "Narrar una aventura", "Describir una receta"], 0, "El aviso comunica datos para asistir a la reunión."],
  "G07-ESP": ["¿Qué razón apoya la idea de plantar árboles en el patio escolar?", ["Dan sombra durante el recreo", "El patio tiene una puerta", "La palabra árbol lleva tilde"], 0, "La sombra es un beneficio relacionado con plantar árboles."],
  "G08-ESP": ["En «el tiempo vuela», ¿qué se expresa?", ["Que el tiempo tiene alas", "Que el tiempo parece pasar rápido", "Que hay aviones cerca"], 1, "La expresión se usa en sentido figurado."],
  "G09-ESP": ["Dos fuentes ofrecen cifras de años diferentes. ¿Qué debes considerar antes de compararlas?", ["El periodo de cada cifra", "El color de sus páginas", "La longitud del título"], 0, "Las cifras de periodos distintos pueden describir situaciones diferentes."],
  "G10-ESP": ["En «Hay que ampliar la biblioteca porque faltan puestos para leer», ¿cuál es la razón?", ["Hay que ampliar la biblioteca", "Faltan puestos para leer", "La biblioteca existe"], 1, "La falta de puestos justifica la propuesta de ampliación."],
  "G11-ESP": ["¿Qué evidencia apoya mejor pedir más libros de ciencias?", ["Un conteo de solicitudes de esos libros", "El color favorito del director", "Un rumor sin fuente"], 0, "El conteo permite comprobar la demanda de esos libros."],
  "G10-FIS": ["Si una fuerza neta de 12 N actúa sobre una masa de 3 kg, ¿cuál es su aceleración?", ["4 m/s²", "9 m/s²", "36 m/s²"], 0, "a = F/m = 12/3 = 4 m/s²."],
  "G11-FIS": ["Si un resistor de 2 Ω conduce 3 A, ¿qué voltaje hay entre sus extremos?", ["1,5 V", "5 V", "6 V"], 2, "V = I × R = 3 × 2 = 6 V."],
  "G10-QUI": ["¿Cuántos átomos de oxígeno hay a la izquierda en 2 H₂ + O₂ → 2 H₂O?", ["1", "2", "4"], 1, "La molécula O₂ contiene dos átomos de oxígeno."],
  "G11-QUI": ["¿A qué familia pertenece CH₃OH por su grupo −OH?", ["Alcoholes", "Ácidos carboxílicos", "Aminas"], 0, "El grupo hidroxilo permite reconocer un alcohol en este caso."],
};

// Dos preguntas provisionales por tema; ninguna cuenta como validada.
export function getPracticeBank(gradeId: string, subjectId: string, topicId: string, availableDrafts: Readonly<Record<string, Draft>> = secondDrafts): PracticeQuestion[] | null {
  const topic = topics.find((item) => item.id === topicId && item.gradeId === gradeId && item.subjectId === subjectId && item.active && item.pilotCandidate);
  if (!topic) return null;
  const lesson = getStudyDemo(gradeId, subjectId, topicId);
  const second = availableDrafts[topicId];
  if (!lesson || !second) return null;
  const [prompt, options, correctIndex, explanation] = second;
  return [
    {
      id: `practice-${topicId.toLowerCase()}-01`, topicId,
      prompt: lesson.question.prompt,
      options: lesson.question.options.map((text, index) => ({ id: ["a", "b", "c"][index], text })),
      correctOptionId: ["a", "b", "c"][lesson.question.correctIndex],
      explanation: lesson.question.feedback,
      provisional: true,
    },
    {
      id: `practice-${topicId.toLowerCase()}-02`, topicId,
      prompt,
      options: options.map((text, index) => ({ id: ["a", "b", "c"][index], text })),
      correctOptionId: ["a", "b", "c"][correctIndex],
      explanation,
      provisional: true,
    },
  ];
}

export function publicPracticeQuestions(questions: readonly PracticeQuestion[]): PracticeQuestionView[] {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}
