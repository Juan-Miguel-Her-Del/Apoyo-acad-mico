import { getDemoTopics, getPublishedTopics, type SubjectId } from "./catalog.ts";
import { expandedTopics } from "./expanded-content.ts";

export type QuestionView = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  skill?: string;
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
const pilotDemoBank: readonly DemoQuestion[] = [
  { id: "demo-g05-mat-01", topicId: "G05-MAT", skill: "sumar fracciones", difficulty: "inicial", prompt: "¿Cuánto es 1/2 + 1/4?", options: [{ id: "a", text: "2/6" }, { id: "b", text: "3/4" }, { id: "c", text: "1/4" }], correctOptionId: "b", explanation: "1/2 equivale a 2/4; 2/4 + 1/4 = 3/4.", validation: "demo-unreviewed" },
  { id: "demo-g05-mat-02", topicId: "G05-MAT", skill: "equivalencias", difficulty: "inicial", prompt: "¿Qué fracción equivale a 1/2?", options: [{ id: "a", text: "2/4" }, { id: "b", text: "1/3" }, { id: "c", text: "3/4" }], correctOptionId: "a", explanation: "Al multiplicar numerador y denominador de 1/2 por 2 se obtiene 2/4.", validation: "demo-unreviewed" },
  { id: "demo-g05-esp-01", topicId: "G05-ESP", skill: "propósito del texto", difficulty: "inicial", prompt: "Para informar sobre el reciclaje, ¿qué conviene definir primero?", options: [{ id: "a", text: "El tema y a quién va dirigido" }, { id: "b", text: "El color de la hoja" }, { id: "c", text: "La última palabra" }], correctOptionId: "a", explanation: "Definir tema y lectores ayuda a planear el contenido del texto.", validation: "demo-unreviewed" },
  { id: "demo-g05-esp-02", topicId: "G05-ESP", skill: "estructura", difficulty: "inicial", prompt: "¿Cuál organización ayuda a un texto informativo?", options: [{ id: "a", text: "Ideas sin orden" }, { id: "b", text: "Introducción, desarrollo y cierre" }, { id: "c", text: "Solo un título" }], correctOptionId: "b", explanation: "Una estructura clara permite presentar y desarrollar la información.", validation: "demo-unreviewed" },
  { id: "demo-g10-mat-01", topicId: "G10-MAT", skill: "razón trigonométrica", difficulty: "inicial", prompt: "En un triángulo rectángulo, ¿qué razón es seno de un ángulo agudo?", options: [{ id: "a", text: "Cateto opuesto / hipotenusa" }, { id: "b", text: "Cateto adyacente / hipotenusa" }, { id: "c", text: "Hipotenusa / cateto opuesto" }], correctOptionId: "a", explanation: "El seno relaciona el cateto opuesto con la hipotenusa.", validation: "demo-unreviewed" },
  { id: "demo-g10-mat-02", topicId: "G10-MAT", skill: "razón trigonométrica", difficulty: "inicial", prompt: "Si el cateto opuesto mide 3 y la hipotenusa 5, ¿cuál es el seno?", options: [{ id: "a", text: "5/3" }, { id: "b", text: "3/5" }, { id: "c", text: "2/5" }], correctOptionId: "b", explanation: "Seno = cateto opuesto / hipotenusa = 3/5.", validation: "demo-unreviewed" },
  { id: "demo-g10-esp-01", topicId: "G10-ESP", skill: "argumentación", difficulty: "inicial", prompt: "¿Qué elemento sostiene mejor una opinión en un texto argumentativo?", options: [{ id: "a", text: "Una razón respaldada por evidencia" }, { id: "b", text: "Repetir la opinión muchas veces" }, { id: "c", text: "Evitar el tema" }], correctOptionId: "a", explanation: "La evidencia permite evaluar la razón que respalda una postura.", validation: "demo-unreviewed" },
  { id: "demo-g10-esp-02", topicId: "G10-ESP", skill: "lectura crítica", difficulty: "inicial", prompt: "Al leer una afirmación, ¿qué ayuda a evaluarla críticamente?", options: [{ id: "a", text: "Comprobar la fuente y sus evidencias" }, { id: "b", text: "Creerla por su extensión" }, { id: "c", text: "Ignorar quién la escribió" }], correctOptionId: "a", explanation: "Revisar fuentes y evidencias ayuda a valorar la afirmación.", validation: "demo-unreviewed" },
  { id: "demo-g10-fis-01", topicId: "G10-FIS", skill: "fuerza neta", difficulty: "inicial", prompt: "Dos fuerzas de 3 N y 2 N actúan sobre un objeto en la misma dirección y el mismo sentido. ¿Cuál es la fuerza neta?", options: [{ id: "a", text: "1 N" }, { id: "b", text: "5 N" }, { id: "c", text: "6 N" }], correctOptionId: "b", explanation: "Las fuerzas con igual dirección y sentido se suman: 3 N + 2 N = 5 N.", validation: "demo-unreviewed" },
  { id: "demo-g10-fis-02", topicId: "G10-FIS", skill: "movimiento", difficulty: "inicial", prompt: "En un marco de referencia inercial, si la fuerza neta sobre un objeto es cero, ¿qué puede ocurrir?", options: [{ id: "a", text: "Permanece en reposo o sigue con velocidad constante en línea recta" }, { id: "b", text: "Siempre acelera" }, { id: "c", text: "Siempre se detiene" }], correctOptionId: "a", explanation: "Sin fuerza neta, la velocidad vectorial permanece constante en un marco inercial.", validation: "demo-unreviewed" },
  { id: "demo-g10-qui-01", topicId: "G10-QUI", skill: "balanceo", difficulty: "inicial", prompt: "Al balancear H₂ + O₂ → H₂O con los coeficientes enteros mínimos, ¿qué coeficiente corresponde a H₂O?", options: [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }], correctOptionId: "b", explanation: "La ecuación completa queda 2 H₂ + 1 O₂ → 2 H₂O; conserva cuatro átomos de H y dos de O a cada lado.", validation: "demo-unreviewed" },
  { id: "demo-g10-qui-02", topicId: "G10-QUI", skill: "conservación", difficulty: "inicial", prompt: "Al balancear una reacción química, ¿qué debe conservarse?", options: [{ id: "a", text: "La cantidad de átomos de cada elemento" }, { id: "b", text: "El orden de las palabras" }, { id: "c", text: "El número de sustancias" }], correctOptionId: "a", explanation: "Debe haber igual número de átomos de cada elemento a ambos lados.", validation: "demo-unreviewed" },
];

// Cada fila es una pregunta provisional: tema, habilidad, enunciado, respuesta,
// dos distractores y explicación. Las respuestas se mezclan al construir el banco.
type DemoQuestionDraft = readonly [string, string, string, string, string, string, string];
const additionalDemoDrafts: readonly DemoQuestionDraft[] = [
  ["G01-MAT", "comparar números", "¿Cuál número es mayor?", "74", "47", "37", "74 tiene siete decenas y 47 tiene cuatro decenas."],
  ["G01-MAT", "representar números", "¿Cuántas decenas y unidades tiene 36?", "3 decenas y 6 unidades", "6 decenas y 3 unidades", "36 decenas y 0 unidades", "36 se forma con tres grupos de diez y seis unidades."],
  ["G01-ESP", "sonidos iniciales", "¿Con qué sonido empieza la palabra mesa?", "Con el sonido /m/", "Con el sonido /s/", "Con el sonido /a/", "La primera letra de mesa es m y representa el sonido /m/."],
  ["G01-ESP", "letras y palabras", "¿Qué palabra se forma al unir las sílabas ca y sa?", "casa", "saca", "cama", "Al leer ca y luego sa se forma casa."],
  ["G02-MAT", "sumas", "Ana tenía 36 lápices y recibió 27. ¿Cuántos tiene ahora?", "63", "53", "73", "36 + 27 = 63: seis decenas y tres unidades."],
  ["G02-MAT", "valor posicional", "En 58, ¿qué valor representa el 5?", "50", "5", "500", "El 5 está en la posición de las decenas: cinco decenas son 50."],
  ["G02-ESP", "secuencia de hechos", "Lee: «Lina sembró una semilla. La regó. Después nació una planta». ¿Qué ocurrió primero?", "Lina sembró una semilla", "Nació una planta", "Lina recogió una flor", "El relato empieza cuando Lina siembra la semilla."],
  ["G02-ESP", "secuencia de hechos", "En el relato de Lina, ¿qué pasó después de regar la semilla?", "Nació una planta", "Compró una maceta", "Sembró otra semilla", "La oración final indica que después nació una planta."],
  ["G03-MAT", "multiplicación", "Hay 4 bolsas con 6 canicas cada una. ¿Cuántas canicas hay?", "24", "10", "20", "Cuatro grupos de seis equivalen a 4 × 6 = 24."],
  ["G03-MAT", "división", "Se reparten 24 canicas entre 3 personas por igual. ¿Cuántas recibe cada una?", "8", "7", "12", "24 ÷ 3 = 8 porque 3 × 8 = 24."],
  ["G03-ESP", "tipos de texto", "¿Cuál frase es un dato informativo?", "El colibrí es un ave", "Había una vez un colibrí mágico", "¡Qué hermoso colibrí!", "La primera frase comunica un dato sobre un animal."],
  ["G03-ESP", "comprensión de lectura", "Lee: «El perro buscó sombra porque hacía calor». ¿Por qué buscó sombra?", "Porque hacía calor", "Porque estaba lloviendo", "Porque quería jugar", "El texto explica la causa: hacía calor."],
  ["G04-MAT", "fracciones equivalentes", "¿Qué fracción equivale a 1/2?", "2/4", "1/4", "3/4", "Al dividir dos de cuatro partes iguales se obtiene la mitad."],
  ["G04-MAT", "comparar fracciones", "Entre 1/4 y 3/4, ¿cuál es mayor?", "3/4", "1/4", "Son iguales", "Con el mismo denominador, tres partes son más que una."],
  ["G04-ESP", "idea principal", "Lee: «Las abejas visitan flores y llevan polen entre ellas». ¿De qué trata principalmente?", "Del trabajo de las abejas con las flores", "De cómo vuelan los aviones", "Del color de una flor específica", "La oración presenta lo que hacen las abejas al visitar flores."],
  ["G04-ESP", "detalle de texto", "En esa oración, ¿qué llevan las abejas entre las flores?", "Polen", "Agua", "Semillas de árboles", "La oración dice expresamente que llevan polen."],
  ["G06-MAT", "enteros", "¿Cuánto es −2 + 5?", "3", "−7", "7", "Desde −2 se avanzan cinco unidades hacia la derecha y se llega a 3."],
  ["G06-MAT", "fracciones", "¿Cuánto es 3/4 + 1/4?", "1", "4/8", "3/8", "Con denominadores iguales se suman numeradores: 4/4 = 1."],
  ["G06-ESP", "propósito comunicativo", "¿Qué busca un texto con instrucciones para preparar jugo?", "Indicar pasos para hacerlo", "Narrar una aventura ficticia", "Convencer de votar", "Un texto instructivo presenta acciones en orden para lograr un resultado."],
  ["G06-ESP", "tipos de texto", "¿Cuál expresión suele indicar un paso en una receta?", "Primero, lava la fruta", "Había una vez un dragón", "Pienso que es la mejor película", "«Primero» señala el inicio de una secuencia de instrucciones."],
  ["G07-MAT", "porcentajes", "¿Cuánto es el 25 % de 80?", "20", "25", "40", "25 % equivale a una cuarta parte y 80 ÷ 4 = 20."],
  ["G07-MAT", "proporciones", "Si 2 cuadernos cuestan 6 unidades, ¿cuánto cuestan 4 al mismo precio?", "12 unidades", "8 unidades", "24 unidades", "Cuatro cuadernos son el doble de dos; se duplica 6 para obtener 12."],
  ["G07-ESP", "opinión y evidencia", "¿Cuál frase presenta una evidencia verificable?", "La biblioteca abre a las 8 según su horario", "La biblioteca es la mejor del mundo", "Leer es aburrido para todos", "Un horario publicado permite comprobar la hora de apertura."],
  ["G07-ESP", "argumentación", "¿Qué ayudaría a sostener la idea de ampliar el horario de la biblioteca?", "Una encuesta sobre la necesidad de los usuarios", "Repetir la idea sin razones", "Cambiar de tema", "Una encuesta aporta datos relacionados con la propuesta."],
  ["G08-MAT", "expresiones algebraicas", "Si x = 4, ¿cuánto vale 2x + 3?", "11", "9", "14", "Se reemplaza x por 4: 2 × 4 + 3 = 11."],
  ["G08-MAT", "ecuaciones lineales", "¿Qué valor de x satisface 2x + 3 = 11?", "4", "3", "7", "Al restar 3 queda 2x = 8; al dividir entre 2, x = 4."],
  ["G08-ESP", "recursos del lenguaje", "En «Tus ojos brillan como estrellas», ¿qué recurso aparece?", "Comparación", "Lista numerada", "Definición técnica", "La palabra «como» compara el brillo de los ojos con las estrellas."],
  ["G08-ESP", "inferencias", "Lee: «El suelo estaba mojado y Marta guardó su paraguas». ¿Qué se puede inferir?", "Probablemente había llovido", "Marta estaba en una piscina", "El paraguas estaba roto", "El suelo mojado y el paraguas sugieren lluvia, aunque no la afirman directamente."],
  ["G09-MAT", "raíces cuadráticas", "¿Qué valores hacen cero x² − 5x + 6?", "2 y 3", "1 y 6", "−2 y −3", "La expresión se factoriza como (x − 2)(x − 3)."],
  ["G09-MAT", "función cuadrática", "¿En qué valor de x alcanza su mínimo y = x²?", "0", "1", "−1", "Un cuadrado no puede ser negativo y vale cero cuando x = 0."],
  ["G09-ESP", "comparar fuentes", "Dos noticias dan cifras diferentes sobre un mismo hecho. ¿Qué conviene revisar primero?", "La fecha y la fuente de cada cifra", "El color del título", "Solo la noticia más corta", "La fecha y el origen permiten valorar si hablan del mismo periodo y de datos fiables."],
  ["G09-ESP", "inferencias entre fuentes", "Una fuente informa «8 de 10 estudiantes» y otra «80 %». ¿Qué relación tienen esas cifras?", "Representan la misma proporción", "Son cifras incompatibles", "La segunda es el doble", "8 ÷ 10 = 0,8, equivalente al 80 %."],
  ["G11-MAT", "funciones", "Si f(x) = 2x + 1, ¿cuánto vale f(3)?", "7", "6", "9", "Se sustituye x por 3: 2 × 3 + 1 = 7."],
  ["G11-MAT", "probabilidad", "En una bolsa hay 1 ficha roja y 3 azules. ¿Cuál es la probabilidad de sacar la roja?", "1/4", "1/3", "3/4", "Hay una ficha roja entre cuatro fichas en total."],
  ["G11-ESP", "tesis argumentativa", "¿Cuál oración plantea una tesis que puede defenderse con razones?", "El colegio debería ampliar el tiempo de lectura", "Ayer se abrió la biblioteca", "La puerta de la biblioteca es azul", "La primera oración propone una postura debatible que admite argumentos."],
  ["G11-ESP", "argumentos sustentados", "¿Qué dato apoyaría mejor una propuesta de ampliar el tiempo de lectura?", "Resultados de una encuesta a estudiantes sobre sus hábitos de lectura", "La opinión de una persona sin explicación", "Una anécdota ajena a la lectura", "La encuesta aporta evidencia pertinente para discutir la propuesta."],
  ["G11-FIS", "ondas", "Una onda viaja a 300 m/s y tiene frecuencia de 100 Hz. ¿Cuál es su longitud de onda?", "3 m", "300 m", "0,3 m", "La longitud de onda es velocidad dividida entre frecuencia: 300 ÷ 100 = 3 m."],
  ["G11-FIS", "ley de Ohm", "Una resistencia de 4 Ω recibe 12 V. ¿Qué corriente circula por ella?", "3 A", "4 A", "48 A", "Por la ley de Ohm, I = V/R = 12/4 = 3 A."],
  ["G11-QUI", "compuestos orgánicos", "¿Cuál fórmula corresponde al metano?", "CH₄", "H₂O", "CO₂", "El metano es un hidrocarburo con un carbono y cuatro hidrógenos."],
  ["G11-QUI", "grupos funcionales", "¿Qué grupo caracteriza a los alcoholes?", "−OH", "−COOH", "−NH₂", "El grupo hidroxilo −OH unido a un carbono caracteriza a los alcoholes."],
];

const additionalDemoBank: readonly DemoQuestion[] = additionalDemoDrafts.map((draft, index) => {
  const [topicId, skill, prompt, answer, wrongOne, wrongTwo, explanation] = draft;
  const correctIndex = index % 3;
  const options = [wrongOne, wrongTwo];
  options.splice(correctIndex, 0, answer);
  return {
    id: `demo-${topicId.toLowerCase()}-${String(index % 2 + 1).padStart(2, "0")}`,
    topicId, skill, difficulty: "inicial", prompt,
    options: options.map((text, optionIndex) => ({ id: ["a", "b", "c"][optionIndex], text })),
    correctOptionId: ["a", "b", "c"][correctIndex], explanation,
    validation: "demo-unreviewed",
  };
});

const expandedDemoBank: readonly DemoQuestion[] = expandedTopics.flatMap((topic) => [0, 2].map((questionIndex, index) => {
  const [prompt, answers, correctIndex, explanation] = topic.questions[questionIndex];
  return {
    id: `demo-${topic.id.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
    topicId: topic.id,
    skill: topic.skills[index][0],
    difficulty: "inicial" as const,
    prompt,
    options: answers.map((text, optionIndex) => ({ id: ["a", "b", "c"][optionIndex], text })),
    correctOptionId: ["a", "b", "c"][correctIndex],
    explanation,
    validation: "demo-unreviewed" as const,
  };
}));

const demoBank: readonly DemoQuestion[] = [...pilotDemoBank, ...additionalDemoBank, ...expandedDemoBank];

export function createDiagnosticReader(bank: readonly DemoQuestion[]) {
  return function getDiagnostic(gradeId: string, subjectId: string, topicId: string, mode: string) {
    if (mode !== "demo" && mode !== "published") return { status: 400, error: "Modo no válido." } as const;
    const subject = subjectId as SubjectId;
    const topics = mode === "demo" ? getDemoTopics(gradeId, subject) : getPublishedTopics(gradeId, subject);
    if (!topics.some((item) => item.id === topicId)) {
      return { status: mode === "demo" ? 400 : 409, error: mode === "demo" ? "La selección no corresponde a un tema de demostración activo." : "Este tema aún no tiene contenido aprobado para estudiantes." } as const;
    }
    if (mode === "published") return { status: 409, error: "Aún no hay un banco de preguntas aprobado para este tema." } as const;
    const questions = bank.filter((question) => question.topicId === topicId);
    if (questions.length < 1) return { status: 409, error: "Aún no hay preguntas de demostración para este tema." } as const;
    return { status: 200, mode: "demo", questions: questions.map(({ id, prompt, options, skill }) => ({ id, prompt, options, skill })) } as const;
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
