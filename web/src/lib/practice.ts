import { topics } from "./catalog.ts";
import { getStudyDemo } from "./study-demo.ts";
import { getPracticeSkills } from "./practice-skills.ts";

export const PRACTICE_BANK_VERSION = "demo-2026-10-v2";

export type PracticeQuestionView = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  difficulty: 1 | 2;
  skillId: string;
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

// Dos variantes adicionales por tema. El nivel 1 comprueba el concepto
// inicial; el nivel 2 exige aplicarlo en un contexto nuevo. Todo es provisional.
const additionalDrafts: Readonly<Record<string, readonly [Draft, Draft]>> = {
  "G01-MAT": [
    ["¿Cuál número es menor: 35 o 53?", ["35", "53", "Son iguales"], 0, "35 tiene tres decenas y 53 tiene cinco."],
    ["En una caja hay 28 fichas y se agregan 10. ¿Cuántas hay?", ["29", "38", "48"], 1, "Una decena adicional convierte 28 en 38."],
  ],
  "G02-MAT": [
    ["¿Cuánto vale el 4 en 342?", ["4", "40", "400"], 1, "El 4 ocupa la posición de las decenas."],
    ["Una biblioteca tiene 258 libros y presta 30. ¿Cuántos quedan?", ["228", "238", "288"], 0, "258 menos tres decenas son 228."],
  ],
  "G03-MAT": [
    ["¿Cuánto es 5 × 4?", ["9", "20", "25"], 1, "Cinco grupos de cuatro suman veinte."],
    ["Hay 24 lápices en 4 cajas iguales. ¿Cuántos hay en cada caja?", ["4", "6", "8"], 1, "24 dividido entre 4 es 6."],
  ],
  "G04-MAT": [
    ["¿Cuál fracción representa la mitad?", ["2/4", "1/4", "3/4"], 0, "Dos de cuatro partes iguales son la mitad."],
    ["¿Cuál fracción equivale a 2/3?", ["3/2", "4/6", "2/6"], 1, "Multiplicar numerador y denominador por dos da 4/6."],
  ],
  "G05-MAT": [
    ["¿Cuánto es 1/4 + 1/4?", ["1/8", "1/2", "2/8"], 1, "Dos cuartos son la mitad."],
    ["Una receta usa 2/3 de taza y otra 1/6. ¿Cuánto se usa en total?", ["1/2", "5/6", "3/9"], 1, "2/3 son 4/6; más 1/6 da 5/6."],
  ],
  "G06-MAT": [
    ["¿Cuál número es mayor?", ["−2", "−5", "Son iguales"], 0, "−2 está a la derecha de −5 en la recta."],
    ["La temperatura es −3 °C y sube 8 °C. ¿Cuál es la nueva temperatura?", ["−11 °C", "5 °C", "11 °C"], 1, "−3 + 8 = 5."],
  ],
  "G07-MAT": [
    ["¿Cuánto es el 50 % de 40?", ["20", "40", "80"], 0, "El 50 % equivale a la mitad."],
    ["Un artículo de 80 unidades tiene descuento del 25 %. ¿Cuánto se descuenta?", ["20", "25", "60"], 0, "La cuarta parte de 80 es 20."],
  ],
  "G08-MAT": [
    ["Si x = 2, ¿cuánto vale x + 5?", ["5", "7", "10"], 1, "Sustituir x por 2 da 2 + 5 = 7."],
    ["Si a = −2, ¿cuánto vale 3a + 4?", ["−2", "2", "10"], 0, "3 × (−2) + 4 = −2."],
  ],
  "G09-MAT": [
    ["¿Qué valor hace verdadera x² = 16?", ["2", "4", "8"], 1, "4² = 16; −4 también sería solución, pero no está entre las opciones."],
    ["En y = x² − 4, ¿cuánto vale y si x = 3?", ["5", "6", "9"], 0, "3² − 4 = 5."],
  ],
  "G10-MAT": [
    ["Si opuesto = 4 e hipotenusa = 5, ¿cuál es el seno?", ["4/5", "5/4", "3/5"], 0, "Seno = opuesto/hipotenusa."],
    ["Si un triángulo rectángulo tiene catetos 6 y 8 e hipotenusa 10, ¿cuál es el coseno del ángulo adyacente al cateto de 8?", ["6/10", "8/10", "10/8"], 1, "Coseno = adyacente/hipotenusa = 8/10."],
  ],
  "G11-MAT": [
    ["Una bolsa contiene 1 bola roja y 3 azules. ¿Probabilidad de roja?", ["1/4", "1/3", "3/4"], 0, "Hay un resultado favorable entre cuatro bolas."],
    ["Se lanza un dado justo. ¿Probabilidad de un número par?", ["1/6", "1/2", "2/3"], 1, "Tres resultados pares entre seis posibles."],
  ],
  "G01-ESP": [
    ["¿Con qué letra empieza «mesa»?", ["m", "e", "s"], 0, "La primera letra escrita es m."],
    ["¿Cuál palabra termina con el mismo sonido que «sol»?", ["sal", "pan", "pez"], 0, "Sol y sal terminan en el sonido /l/."],
  ],
  "G02-ESP": [
    ["Lee: «Pablo desayunó y después salió». ¿Qué hizo primero?", ["Salió", "Desayunó", "Durmió"], 1, "El texto sitúa el desayuno antes de la salida."],
    ["Lee: «Eva sembró, regó y cosechó». ¿Qué ocurrió antes de cosechar?", ["Regó", "Comió", "Leyó"], 0, "Regar es el hecho anterior a cosechar."],
  ],
  "G03-ESP": [
    ["¿Cuál texto comunica un dato?", ["Los peces viven en el agua", "Un pez viajó a la Luna", "El pez cantó ópera"], 0, "La primera oración presenta un hecho general."],
    ["Un texto explica cómo crece una planta. ¿Cuál es su propósito principal?", ["Informar", "Inventar personajes", "Narrar un sueño"], 0, "Describe un proceso para informar."],
  ],
  "G04-ESP": [
    ["«Las aves tienen plumas y muchas pueden volar». ¿Cuál es el tema?", ["Las aves", "Los árboles", "La lluvia"], 0, "La oración ofrece información sobre las aves."],
    ["«Leer diariamente ayuda a aprender palabras nuevas; también mejora la comprensión». ¿Cuál es la idea principal?", ["Leer diariamente aporta beneficios", "Todos los libros son iguales", "Las palabras son largas"], 0, "Los dos detalles son beneficios de leer."],
  ],
  "G05-ESP": [
    ["¿Qué título informa sobre un texto que explica el ciclo del agua?", ["El ciclo del agua", "Un dragón de lluvia", "¡Qué susto!"], 0, "El título anuncia directamente el tema."],
    ["En un informe sobre reciclaje, ¿qué subtítulo organiza información concreta?", ["Materiales que se pueden reciclar", "Érase una vez", "La aventura secreta"], 0, "Anuncia una parte informativa del tema."],
  ],
  "G06-ESP": [
    ["«Cierra la llave al salir». ¿Cuál es el propósito de esta frase?", ["Dar una instrucción", "Narrar un viaje", "Describir una flor"], 0, "La frase indica una acción."],
    ["Un cartel anuncia fecha, hora y lugar de una feria. ¿Qué propósito cumple?", ["Informar sobre el evento", "Enseñar una receta", "Contar una leyenda"], 0, "Los datos ayudan a asistir al evento."],
  ],
  "G07-ESP": [
    ["¿Qué frase incluye una razón para usar bicicleta?", ["Permite hacer ejercicio", "La palabra tiene nueve letras", "Hay una bicicleta roja"], 0, "Hacer ejercicio es un beneficio pertinente."],
    ["«Debemos cuidar el parque porque allí juegan los niños». ¿Qué parte es la razón?", ["Debemos cuidar el parque", "Allí juegan los niños", "El parque existe"], 1, "La segunda parte justifica la propuesta."],
  ],
  "G08-ESP": [
    ["«Tiene un corazón de oro». ¿Qué significa?", ["Es generoso", "Su corazón es metálico", "Trabaja en una mina"], 0, "Es una expresión figurada sobre su carácter."],
    ["«La noticia corrió como pólvora». ¿Qué se infiere?", ["Se difundió rápidamente", "Hubo una explosión", "La noticia se quemó"], 0, "La comparación indica rapidez en la difusión."],
  ],
  "G09-ESP": [
    ["Una fuente publicó un dato en 2020 y otra en 2025. ¿Qué conviene revisar?", ["Las fechas", "Los colores", "El tamaño de letra"], 0, "La fecha cambia el contexto de cada dato."],
    ["Dos informes dan cifras diferentes. ¿Qué paso ayuda a compararlas?", ["Revisar método y periodo de cada informe", "Elegir la cifra mayor", "Ignorar las fuentes"], 0, "Método y periodo permiten evaluar si se refieren a lo mismo."],
  ],
  "G10-ESP": [
    ["En «El colegio debe abrir la biblioteca temprano», ¿qué expresa la frase?", ["Una tesis", "Una fecha", "Una cita bibliográfica"], 0, "Plantea una postura que puede argumentarse."],
    ["¿Qué dato apoyaría la propuesta de ampliar horario de biblioteca?", ["Número de estudiantes que la necesitan al final de la jornada", "Color de los estantes", "Edad del edificio"], 0, "El dato se relaciona con la necesidad de ampliar el horario."],
  ],
  "G11-ESP": [
    ["¿Qué apoya mejor una afirmación sobre uso de la biblioteca?", ["Registro de préstamos", "Un rumor", "Una foto sin fecha"], 0, "Los registros dan evidencia verificable."],
    ["Una propuesta cita una encuesta sin decir a quién preguntó. ¿Qué falta para evaluar su evidencia?", ["La muestra de participantes", "El color del formulario", "El título más corto"], 0, "La muestra permite valorar el alcance de la encuesta."],
  ],
  "G10-FIS": [
    ["Si una masa de 2 kg acelera a 4 m/s², ¿cuál es la fuerza neta?", ["2 N", "6 N", "8 N"], 2, "F = ma = 8 N."],
    ["Un objeto de 5 kg recibe una fuerza neta de 20 N. ¿Cuál es su aceleración?", ["4 m/s²", "15 m/s²", "100 m/s²"], 0, "a = F/m = 4 m/s²."],
  ],
  "G11-FIS": [
    ["Con 4 A y 2 Ω, ¿qué voltaje corresponde a un resistor ideal?", ["2 V", "6 V", "8 V"], 2, "V = IR = 8 V."],
    ["Un resistor tiene 12 V y 3 A. ¿Cuál es su resistencia?", ["4 Ω", "9 Ω", "36 Ω"], 0, "R = V/I = 4 Ω."],
  ],
  "G10-QUI": [
    ["En H₂O, ¿cuántos átomos de hidrógeno hay por molécula?", ["1", "2", "3"], 1, "El subíndice 2 indica dos átomos de H."],
    ["¿Qué coeficiente completa H₂ + Cl₂ → __ HCl?", ["1", "2", "3"], 1, "Dos moléculas de HCl conservan dos H y dos Cl."],
  ],
  "G11-QUI": [
    ["¿Qué grupo funcional tiene el ácido acético CH₃COOH?", ["−COOH", "−NH₂", "−OH como alcohol"], 0, "El grupo carboxilo es −COOH."],
    ["¿Qué familia corresponde a CH₃CH₂OH?", ["Alcoholes", "Aminas", "Ácidos carboxílicos"], 0, "Contiene un grupo hidroxilo unido a una cadena carbonada."],
  ],
};

// Segunda pareja inicial para que una respuesta incorrecta permita repetir
// el nivel 1 sin reutilizar las preguntas de la ronda inmediata.
const retryDrafts: Readonly<Record<string, readonly [Draft, Draft]>> = {
  "G01-MAT": [["¿Cuál número tiene cinco decenas?", ["15", "51", "5"], 1, "51 contiene cinco grupos de diez."],
    ["¿Cuánto es 24 + 10?", ["25", "34", "44"], 1, "Al sumar una decena a 24 se obtiene 34."]],
  "G02-MAT": [["¿Cuántas centenas hay en 506?", ["5", "0", "6"], 0, "El 5 está en la posición de centenas."],
    ["¿Cuánto es 73 − 20?", ["53", "63", "93"], 0, "Quitar dos decenas de 73 da 53."]],
  "G03-MAT": [["¿Cuánto es 3 × 7?", ["10", "21", "27"], 1, "Tres grupos de siete contienen 21 elementos."],
    ["¿Cuánto es 20 ÷ 5?", ["4", "5", "10"], 0, "Cinco grupos de cuatro suman veinte."]],
  "G04-MAT": [["¿Qué fracción representa una de cuatro partes iguales?", ["1/2", "1/4", "4/1"], 1, "Una parte de cuatro es un cuarto."],
    ["¿Qué fracción equivale a 2/4?", ["1/2", "1/4", "3/4"], 0, "Dos de cuatro partes son la mitad."]],
  "G05-MAT": [["¿Cuánto es 2/5 + 1/5?", ["3/5", "3/10", "1/5"], 0, "Se suman numeradores porque el denominador es igual."],
    ["¿Cuánto es 1/2 + 1/6?", ["2/8", "2/3", "1/3"], 1, "1/2 equivale a 3/6; 3/6 + 1/6 = 4/6 = 2/3."]],
  "G06-MAT": [["¿Cuál es menor?", ["−1", "−4", "0"], 1, "−4 está más a la izquierda."],
    ["¿Cuánto es −2 + 6?", ["−8", "4", "8"], 1, "Seis pasos desde −2 llevan a 4."]],
  "G07-MAT": [["¿Cuánto es el 25 % de 20?", ["5", "10", "25"], 0, "Una cuarta parte de 20 es 5."],
    ["Un grupo de 30 personas tiene 10 % de ausentes. ¿Cuántas faltan?", ["3", "10", "20"], 0, "La décima parte de 30 es 3."]],
  "G08-MAT": [["Si b = 4, ¿cuánto vale b − 1?", ["3", "4", "5"], 0, "Sustituir b por 4 da 3."],
    ["Si x = 5, ¿cuánto vale 2x + 1?", ["6", "10", "11"], 2, "2 × 5 + 1 = 11."]],
  "G09-MAT": [["¿Qué valor satisface x² = 25?", ["3", "5", "10"], 1, "5² = 25; −5 también satisface la igualdad."],
    ["Si f(x) = x² + 1, ¿cuánto es f(2)?", ["3", "5", "6"], 1, "2² + 1 = 5."]],
  "G10-MAT": [["Con cateto opuesto 2 e hipotenusa 5, ¿cuál es el seno?", ["2/5", "5/2", "3/5"], 0, "Seno es opuesto sobre hipotenusa."],
    ["Con adyacente 3 e hipotenusa 5, ¿cuál es el coseno?", ["3/5", "5/3", "4/5"], 0, "Coseno es adyacente sobre hipotenusa."]],
  "G11-MAT": [["Una bolsa tiene 2 bolas verdes y 2 rojas. ¿Probabilidad de verde?", ["1/4", "1/2", "1"], 1, "Dos de cuatro bolas son verdes."],
    ["En un dado justo, ¿probabilidad de obtener 6?", ["1/6", "1/3", "1/2"], 0, "Uno de los seis resultados es 6."]],
  "G01-ESP": [["¿Con qué letra empieza «pato»?", ["a", "p", "t"], 1, "La palabra empieza con p."],
    ["¿Qué palabra termina con el mismo sonido que «mar»?", ["amor", "mesa", "luna"], 0, "Mar y amor terminan con el sonido /r/."]],
  "G02-ESP": [["«Tomás se levantó y luego desayunó». ¿Qué hizo primero?", ["Desayunó", "Se levantó", "Jugó"], 1, "Levantarse ocurrió antes del desayuno."],
    ["«Marta lavó la fruta antes de comerla». ¿Qué hizo después de lavarla?", ["La comió", "La sembró", "La pintó"], 0, "El texto dice que la lavó antes de comerla."]],
  "G03-ESP": [["¿Qué oración informa?", ["La lluvia cae de las nubes", "La nube conversó conmigo", "La lluvia bailó"], 0, "La primera comunica un hecho."],
    ["¿Qué busca un texto sobre las partes de una bicicleta?", ["Informar", "Narrar un sueño", "Recitar una adivinanza"], 0, "Explica componentes para informar."]],
  "G04-ESP": [["En «Los árboles producen sombra», ¿de qué se habla?", ["De árboles", "De bicicletas", "De libros"], 0, "Los árboles son el tema."],
    ["«El agua es necesaria: sirve para beber y regar». ¿Idea principal?", ["El agua es necesaria", "El agua es azul", "Regar es jugar"], 0, "Los usos desarrollan la idea de su necesidad."]],
  "G05-ESP": [["Un texto explica por qué llueve. ¿Qué título le conviene?", ["Cómo se forma la lluvia", "El gigante invisible", "Día de fiesta"], 0, "El título indica el tema explicado."],
    ["En un texto sobre perros, ¿qué subtítulo organiza una sección?", ["Cómo se alimentan", "Érase una vez", "¡Sorpresa!"], 0, "Anuncia información concreta."]],
  "G06-ESP": [["«No corras en el pasillo». ¿Qué intención tiene?", ["Dar una indicación", "Contar una historia", "Describir una pintura"], 0, "Indica una conducta."],
    ["Un aviso dice «La clase empieza a las 8». ¿Para qué sirve?", ["Informar la hora", "Enseñar una receta", "Inventar un cuento"], 0, "Comunica un horario."]],
  "G07-ESP": [["¿Cuál es una razón para ahorrar agua?", ["Ayuda a conservar el recurso", "La palabra tiene letras", "El vaso es verde"], 0, "Conservar el recurso apoya la propuesta."],
    ["«Conviene caminar porque hace bien al cuerpo». ¿Cuál es la razón?", ["Conviene caminar", "Hace bien al cuerpo", "Caminar es un verbo"], 1, "El beneficio corporal justifica caminar."]],
  "G08-ESP": [["«Estoy muerto de sueño». ¿Cómo se interpreta?", ["Tiene mucho sueño", "Ha fallecido", "Sueña con muertos"], 0, "Es una exageración figurada."],
    ["«Su voz era música». ¿Qué sugiere?", ["La voz resultaba agradable", "Había instrumentos", "Cantaba una partitura"], 0, "La comparación comunica una cualidad."]],
  "G09-ESP": [["¿Qué dato de una fuente ayuda a situar sus cifras?", ["Fecha de publicación", "Color de portada", "Tipo de papel"], 0, "La fecha ubica la información."],
    ["Dos encuestas difieren. ¿Qué conviene revisar?", ["A quiénes preguntaron", "Cuál letra es más grande", "Qué imagen gusta más"], 0, "La población encuestada explica parte de la diferencia."]],
  "G10-ESP": [["«El comedor debe ampliar sus mesas» es:", ["Una tesis", "Una cita", "Una fecha"], 0, "Propone una postura debatible."],
    ["¿Qué evidencia apoya ampliar mesas del comedor?", ["Conteo de estudiantes sin puesto", "Color del menú", "Nombre de la puerta"], 0, "El conteo muestra la necesidad."]],
  "G11-ESP": [["¿Qué evidencia permite comprobar la demanda de libros?", ["Número de reservas", "Un rumor", "Una opinión aislada"], 0, "Los registros de reservas son comprobables."],
    ["Para evaluar una encuesta, ¿qué dato ayuda?", ["Cantidad de participantes", "Color de tinta", "Tamaño del título"], 0, "El tamaño de muestra ayuda a interpretar resultados."]],
  "G10-FIS": [["Si m = 3 kg y a = 2 m/s², ¿cuál es F?", ["1 N", "5 N", "6 N"], 2, "F = 3 × 2 = 6 N."],
    ["Si F = 10 N y m = 2 kg, ¿cuál es a?", ["5 m/s²", "8 m/s²", "20 m/s²"], 0, "a = 10/2 = 5 m/s²."]],
  "G11-FIS": [["Si I = 2 A y R = 4 Ω, ¿cuánto es V?", ["2 V", "6 V", "8 V"], 2, "V = 2 × 4 = 8 V."],
    ["Si V = 10 V e I = 2 A, ¿cuánto es R?", ["5 Ω", "8 Ω", "20 Ω"], 0, "R = 10/2 = 5 Ω."]],
  "G10-QUI": [["En CO₂, ¿cuántos átomos de oxígeno hay?", ["1", "2", "3"], 1, "El subíndice 2 corresponde al oxígeno."],
    ["En 2 Na + Cl₂ → 2 NaCl, ¿cuántos átomos de Na hay a cada lado?", ["1", "2", "3"], 1, "El coeficiente 2 indica dos átomos de sodio."]],
  "G11-QUI": [["¿Qué grupo caracteriza a los ácidos carboxílicos?", ["−COOH", "−NH₂", "−Cl"], 0, "El carboxilo es −COOH."],
    ["¿Cuál compuesto es un alcohol?", ["CH₃OH", "CH₃COOH", "CH₄"], 0, "CH₃OH contiene un grupo −OH de alcohol."]],
};

// Seis preguntas provisionales por tema; ninguna cuenta como validada.
export function getPracticeBank(gradeId: string, subjectId: string, topicId: string, availableDrafts: Readonly<Record<string, Draft>> = secondDrafts): PracticeQuestion[] | null {
  const topic = topics.find((item) => item.id === topicId && item.gradeId === gradeId && item.subjectId === subjectId && item.active && item.pilotCandidate);
  if (!topic) return null;
  const lesson = getStudyDemo(gradeId, subjectId, topicId);
  const second = availableDrafts[topicId];
  if (!lesson || !second) return null;
  const [prompt, options, correctIndex, explanation] = second;
  const extra = additionalDrafts[topicId];
  const retry = retryDrafts[topicId];
  const skills = getPracticeSkills(topicId);
  if (!extra || !retry || skills.length !== 2) return null;
  return [
    {
      id: `practice-${topicId.toLowerCase()}-01`, topicId,
      prompt: lesson.question.prompt,
      options: lesson.question.options.map((text, index) => ({ id: ["a", "b", "c"][index], text })),
      correctOptionId: ["a", "b", "c"][lesson.question.correctIndex],
      explanation: lesson.question.feedback,
      difficulty: 1,
      skillId: skills[0].id,
      provisional: true,
    },
    {
      id: `practice-${topicId.toLowerCase()}-02`, topicId,
      prompt,
      options: options.map((text, index) => ({ id: ["a", "b", "c"][index], text })),
      correctOptionId: ["a", "b", "c"][correctIndex],
      explanation,
      provisional: true,
      difficulty: 1,
      skillId: skills[1].id,
    },
    ...extra.map(([extraPrompt, extraOptions, extraCorrectIndex, extraExplanation], index): PracticeQuestion => ({
      id: `practice-${topicId.toLowerCase()}-0${index + 3}`, topicId,
      prompt: extraPrompt,
      options: extraOptions.map((text, optionIndex) => ({ id: ["a", "b", "c"][optionIndex], text })),
      correctOptionId: ["a", "b", "c"][extraCorrectIndex],
      explanation: extraExplanation,
      provisional: true,
      difficulty: 2,
      skillId: skills[index].id,
    })),
    ...retry.map(([retryPrompt, retryOptions, retryCorrectIndex, retryExplanation], index): PracticeQuestion => ({
      id: `practice-${topicId.toLowerCase()}-0${index + 5}`, topicId,
      prompt: retryPrompt,
      options: retryOptions.map((text, optionIndex) => ({ id: ["a", "b", "c"][optionIndex], text })),
      correctOptionId: ["a", "b", "c"][retryCorrectIndex],
      explanation: retryExplanation,
      provisional: true,
      difficulty: 1,
      skillId: skills[index].id,
    })),
  ];
}

export function publicPracticeQuestions(questions: readonly PracticeQuestion[]): PracticeQuestionView[] {
  return questions.map(({ id, prompt, options, difficulty, skillId }) => ({ id, prompt, options, difficulty, skillId }));
}

export function practiceBankCoverage(gradeId: string, subjectId: string, topicId: string,
  bank: readonly PracticeQuestion[] | null = getPracticeBank(gradeId, subjectId, topicId)) {
  const counts = { 1: bank?.filter((question) => question.difficulty === 1).length ?? 0,
    2: bank?.filter((question) => question.difficulty === 2).length ?? 0 };
  return { topicId, total: bank?.length ?? 0, byDifficulty: counts,
    sufficientForTwoDistinctRounds: counts[1] >= 4 && counts[2] >= 2,
    provisional: true as const };
}
