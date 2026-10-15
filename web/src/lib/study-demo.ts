import { topics, type SubjectId } from "./catalog.ts";

export type StudyQuestion = {
  prompt: string;
  options: readonly [string, string, string];
  correctIndex: 0 | 1 | 2;
  feedback: string;
};

export type StudyDemo = {
  topicId: string;
  gradeId: string;
  subjectId: SubjectId;
  title: string;
  explanation: string;
  example: string;
  question: StudyQuestion;
  provisional: true;
};

type Draft = readonly [string, string, string, readonly [string, string, string], 0 | 1 | 2, string];

// Material de demostración redactado para probar el flujo. No constituye una
// secuencia curricular validada ni una referencia a un DBA específico.
const drafts: Readonly<Record<string, Draft>> = {
  "G01-MAT": ["Para contar, cada objeto recibe un número. Para comparar dos cantidades, observa primero las decenas y luego las unidades.", "47 tiene 4 decenas y 7 unidades; 74 tiene 7 decenas y 4 unidades. Por eso 47 es menor que 74.", "¿Cuál número es mayor?", ["47", "74", "Son iguales"], 1, "74 tiene más decenas que 47."],
  "G02-MAT": ["En un número de tres cifras, las posiciones indican centenas, decenas y unidades. Descomponerlo ayuda a sumar y restar.", "235 = 200 + 30 + 5. Si llegan 10 libros más, hay 245 libros.", "¿Cuánto vale el 3 en 235?", ["3 unidades", "30 unidades", "300 unidades"], 1, "El 3 ocupa el lugar de las decenas: 3 decenas son 30 unidades."],
  "G03-MAT": ["Multiplicar sirve para contar grupos iguales. Dividir sirve para repartir una cantidad en grupos iguales.", "Hay 4 bolsas con 6 canicas cada una: 4 × 6 = 24 canicas.", "¿Cuántas canicas hay en 4 bolsas de 6?", ["10", "24", "46"], 1, "Cuatro grupos de seis suman 6 + 6 + 6 + 6 = 24."],
  "G04-MAT": ["Una fracción describe partes iguales de un todo. Dos fracciones son equivalentes si representan la misma cantidad.", "La mitad de una pizza es 1/2; si cada mitad se divide en dos, esa misma cantidad es 2/4.", "¿Cuál fracción equivale a 1/2?", ["1/4", "2/4", "3/4"], 1, "2/4 representa dos de cuatro partes iguales, es decir, la mitad."],
  "G05-MAT": ["Para sumar fracciones con distinto denominador, primero exprésalas en partes del mismo tamaño.", "1/2 + 1/4 = 2/4 + 1/4 = 3/4.", "¿Cuánto es 1/2 + 1/4?", ["2/6", "3/4", "1/8"], 1, "La mitad equivale a dos cuartos; dos cuartos más uno son tres cuartos."],
  "G06-MAT": ["Los números racionales incluyen enteros y fracciones. En una recta numérica, avanzar a la derecha aumenta el valor.", "Si estás en −3 y avanzas 5 unidades, llegas a 2: −3 + 5 = 2.", "¿Cuánto es −3 + 5?", ["−8", "−2", "2"], 2, "Desde −3, cinco pasos hacia la derecha llevan a 2."],
  "G07-MAT": ["Un porcentaje indica cuántas partes hay de cada cien. Puedes calcularlo multiplicando la cantidad por la fracción correspondiente.", "20 % de 50 = 20/100 × 50 = 10.", "¿Cuál es el 20 % de 50?", ["5", "10", "20"], 1, "Una quinta parte de 50 es 10; 20 % equivale a una quinta parte."],
  "G08-MAT": ["Una expresión algebraica usa letras para representar valores que pueden variar. Sustituye la letra por el valor dado y sigue el orden de operaciones.", "Si x = 4, entonces 2x + 3 = 2 × 4 + 3 = 11.", "Si x = 4, ¿cuánto vale 2x + 3?", ["9", "11", "14"], 1, "Primero multiplica 2 × 4 = 8 y después suma 3."],
  "G09-MAT": ["Una ecuación cuadrática incluye una variable elevada al cuadrado. Una solución es un valor que hace verdadera la igualdad.", "En x² − 5x + 6 = 0, x = 2 funciona: 4 − 10 + 6 = 0.", "¿Cuál valor resuelve x² − 5x + 6 = 0?", ["1", "2", "4"], 1, "Al sustituir x = 2, el lado izquierdo vale cero."],
  "G10-MAT": ["En un triángulo rectángulo, el seno de un ángulo es la razón entre el cateto opuesto y la hipotenusa.", "Si el cateto opuesto mide 3 y la hipotenusa 5, sen(ángulo) = 3/5.", "¿Cuánto vale el seno si el opuesto es 3 y la hipotenusa 5?", ["3/5", "5/3", "4/5"], 0, "El seno compara el cateto opuesto con la hipotenusa: 3 dividido entre 5."],
  "G11-MAT": ["La probabilidad simple compara casos favorables con todos los casos posibles, cuando todos tienen la misma oportunidad de salir.", "En una bolsa con 2 bolas rojas y 3 azules, la probabilidad de sacar una roja es 2/5.", "Si hay 2 bolas rojas y 3 azules, ¿cuál es la probabilidad de sacar una roja?", ["2/3", "2/5", "3/5"], 1, "Hay 2 casos favorables entre 5 bolas en total."],
  "G01-ESP": ["Las palabras se forman con sonidos que representamos mediante letras. Escuchar el sonido inicial ayuda a reconocer la letra con que empieza una palabra.", "La palabra «casa» comienza con el sonido representado por la letra c.", "¿Con qué letra empieza «casa»?", ["a", "c", "s"], 1, "La primera letra escrita de «casa» es c."],
  "G02-ESP": ["En un relato, los hechos suceden en un orden. Palabras como «primero» y «después» ayudan a reconstruirlo.", "Primero Ana siembra una semilla, después la riega y al final aparece un brote.", "¿Qué hizo Ana antes de que apareciera el brote?", ["Regó la semilla", "Recogió el brote", "Cerró el libro"], 0, "En el relato, Ana riega la semilla antes de que salga el brote."],
  "G03-ESP": ["Un texto narrativo cuenta acciones o sucesos; uno informativo presenta datos o explicaciones sobre un asunto.", "«La abeja recoge néctar de las flores» informa sobre una actividad de las abejas.", "¿Qué oración presenta un dato sobre las abejas?", ["La abeja soñó que era reina", "Las abejas visitan flores", "Había una vez una abeja mágica"], 1, "La segunda oración comunica una actividad de las abejas sin contar una historia ficticia."],
  "G04-ESP": ["La idea principal resume lo más importante de un texto. Los detalles explican o ejemplifican esa idea.", "«Los árboles ayudan al ambiente: dan sombra y sirven de refugio a animales». La primera parte expresa la idea principal.", "¿Cuál es la idea principal del ejemplo?", ["Los árboles ayudan al ambiente", "Algunos animales viven en árboles", "La sombra aparece al mediodía"], 0, "La oración sobre el ambiente reúne los detalles de sombra y refugio."],
  "G05-ESP": ["Un texto informativo comunica información sobre un tema. Conviene organizarlo con un asunto claro y datos que lo desarrollen.", "Para informar sobre la lluvia, puedes iniciar con qué es y luego explicar cómo se forma.", "¿Cuál frase sirve para iniciar un texto informativo sobre la lluvia?", ["Había una vez una nube parlante", "La lluvia es agua que cae de las nubes", "¡Ojalá llueva mañana!"], 1, "La segunda frase presenta el tema mediante información directa."],
  "G06-ESP": ["El propósito comunicativo es la intención de un texto: informar, narrar, explicar cómo hacer algo o convencer.", "«Mezcla la harina con agua y hornea 20 minutos» indica pasos para realizar una tarea.", "¿Qué propósito tiene una receta con pasos?", ["Explicar cómo preparar algo", "Contar una aventura", "Describir un personaje"], 0, "Las instrucciones de una receta orientan una acción paso a paso."],
  "G07-ESP": ["Un argumento presenta una idea y razones que la apoyan. Los datos o ejemplos pertinentes hacen más clara esa razón.", "«Conviene llevar agua al caminar porque el cuerpo pierde líquido al sudar» incluye una postura y una razón.", "¿Cuál frase ofrece una razón para llevar agua?", ["El agua es azul en este dibujo", "El cuerpo pierde líquido al sudar", "Caminar es una palabra de siete letras"], 1, "La pérdida de líquido explica por qué resulta útil llevar agua."],
  "G08-ESP": ["Al interpretar un texto, observa si una expresión tiene sentido literal o figurado. Una metáfora describe algo mediante otra imagen.", "«Sus palabras fueron un faro» sugiere que las palabras orientaron a alguien; no que brillaran físicamente.", "En «sus palabras fueron un faro», ¿qué significa «faro»?", ["Que orientaron a alguien", "Que eran una lámpara real", "Que estaban junto al mar"], 0, "La imagen del faro comunica orientación en sentido figurado."],
  "G09-ESP": ["Al comparar fuentes, distingue lo que cada una afirma y qué evidencia aporta. Una inferencia debe apoyarse en esa información.", "Fuente A: «El parque abre a las 8». Fuente B: «El parque cierra a las 18». Juntas permiten conocer el horario indicado.", "Según ambas fuentes, ¿cuándo está abierto el parque?", ["Entre las 8 y las 18", "Solo a las 18", "Toda la noche"], 0, "Una fuente da la apertura y la otra el cierre; juntas delimitan ese horario."],
  "G10-ESP": ["Leer críticamente implica identificar la tesis de un texto y distinguir las razones y evidencias usadas para defenderla.", "«La biblioteca debería abrir los sábados, porque así más estudiantes podrían consultarla» plantea una tesis y una razón.", "¿Cuál es la tesis del ejemplo?", ["Más estudiantes podrían consultarla", "La biblioteca debería abrir los sábados", "Los sábados tienen biblioteca"], 1, "La tesis es la postura que el autor busca defender."],
  "G11-ESP": ["Un texto argumentativo sostiene una postura con razones y evidencia verificable. Cada párrafo debe ayudar a desarrollar esa postura.", "Si la tesis es «ampliar el préstamo de libros», un dato sobre cuántos estudiantes usan el servicio puede apoyar el argumento.", "¿Qué evidencia sería más pertinente para defender esa tesis?", ["Un dato sobre uso del préstamo", "El color de las paredes", "Una anécdota sin relación"], 0, "Un dato de uso se relaciona directamente con la necesidad de ampliar el servicio."],
  "G10-FIS": ["Una fuerza neta puede cambiar el movimiento de un objeto. En un caso ideal de masa constante, fuerza, masa y aceleración se relacionan mediante F = m × a.", "Si la masa es 2 kg y la aceleración 3 m/s², la fuerza neta es 6 N.", "¿Cuál es la fuerza neta sobre 2 kg con aceleración de 3 m/s²?", ["1 N", "5 N", "6 N"], 2, "F = 2 × 3 = 6 newtons."],
  "G11-FIS": ["Las ondas transportan energía; los circuitos permiten el paso de corriente eléctrica. En un resistor ideal, voltaje, corriente y resistencia se relacionan mediante V = I × R.", "Con 2 A de corriente y 3 Ω de resistencia, el voltaje es 6 V.", "¿Qué voltaje corresponde a 2 A y 3 Ω?", ["1 V", "5 V", "6 V"], 2, "Para este resistor, V = 2 × 3 = 6 voltios."],
  "G10-QUI": ["En una ecuación química balanceada hay igual cantidad de átomos de cada elemento a ambos lados. Se cambian coeficientes, no las fórmulas de las sustancias.", "2 H₂ + O₂ → 2 H₂O tiene 4 átomos de H y 2 de O en cada lado.", "¿Cuál ecuación está balanceada?", ["H₂ + O₂ → H₂O", "2 H₂ + O₂ → 2 H₂O", "H₂ + 2 O₂ → H₂O"], 1, "La segunda conserva dos átomos de oxígeno y cuatro de hidrógeno a cada lado."],
  "G11-QUI": ["En química orgánica se estudian compuestos basados en carbono. Un grupo funcional ayuda a reconocer familias de compuestos y algunas de sus propiedades.", "El etanol, CH₃CH₂OH, contiene un grupo hidroxilo (−OH) y pertenece a la familia de los alcoholes.", "¿Qué grupo funcional muestra el etanol?", ["−OH", "−COOH", "−NH₂"], 0, "En la fórmula CH₃CH₂OH aparece el grupo −OH."],
};

export function getStudyDemo(gradeId: string, subjectId: string, topicId: string): StudyDemo | null {
  const topic = topics.find((item) => item.id === topicId && item.gradeId === gradeId && item.subjectId === subjectId && item.active && item.pilotCandidate);
  const draft = topic && drafts[topic.id];
  if (!topic || !draft) return null;
  const [explanation, example, prompt, options, correctIndex, feedback] = draft;
  return {
    topicId: topic.id,
    gradeId: topic.gradeId,
    subjectId: topic.subjectId,
    title: topic.name,
    explanation,
    example,
    question: { prompt, options, correctIndex, feedback },
    provisional: true,
  };
}

export function checkStudyAnswer(lesson: StudyDemo, selectedIndex: number): { correct: boolean; feedback: string } | null {
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= lesson.question.options.length) return null;
  return { correct: selectedIndex === lesson.question.correctIndex, feedback: lesson.question.feedback };
}
