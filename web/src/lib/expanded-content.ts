// Segunda ruta de estudio por cada combinación. Borradores propios para
// ampliar la demostración; no son contenido aprobado ni citas literales DBA.
export type ExpansionQuestion = readonly [string, readonly [string, string, string], 0 | 1 | 2, string];
export type ExpansionTopic = {
  id: string; gradeId: string; subjectId: "MAT" | "ESP" | "FIS" | "QUI"; name: string;
  skills: readonly [readonly [string, string], readonly [string, string]];
  chapters: readonly [readonly [string, string, string], readonly [string, string, string], readonly [string, string, string]];
  questions: readonly [ExpansionQuestion, ExpansionQuestion, ExpansionQuestion, ExpansionQuestion, ExpansionQuestion, ExpansionQuestion];
};

function topic(id: string, name: string, skills: ExpansionTopic["skills"],
  chapters: ExpansionTopic["chapters"], questions: ExpansionTopic["questions"]): ExpansionTopic {
  const [gradeId, subjectId] = id.split("-");
  if (!gradeId || !["MAT", "ESP", "FIS", "QUI"].includes(subjectId)) throw new Error(`Tema ampliado inválido: ${id}`);
  return { id, gradeId, subjectId: subjectId as ExpansionTopic["subjectId"], name, skills, chapters, questions };
}

export const expandedTopics: readonly ExpansionTopic[] = [
  topic("G01-MAT-B", "Figuras planas y patrones", [["figuras", "Figuras"], ["patrones", "Patrones"]], [
    ["Reconoce figuras", "Un triángulo tiene tres lados; un cuadrado tiene cuatro lados iguales. El círculo no tiene lados rectos.", "Dibuja un triángulo y cuenta sus tres lados."],
    ["Compara formas", "Mira lados y esquinas para distinguir figuras, aunque cambien de color o tamaño.", "Un cuadrado pequeño sigue teniendo cuatro lados iguales."],
    ["Continúa patrones", "En un patrón, una parte se repite en el mismo orden. Encuentra la parte que se repite antes de continuar.", "Círculo, cuadrado, círculo, cuadrado; sigue círculo."],
  ], [
    ["¿Cuántos lados tiene un triángulo?", ["2", "3", "4"], 1, "El triángulo tiene tres lados."],
    ["¿Qué figura tiene cuatro lados iguales?", ["Cuadrado", "Triángulo", "Círculo"], 0, "El cuadrado tiene cuatro lados iguales."],
    ["Sigue: círculo, cuadrado, círculo, cuadrado, ¿qué figura viene?", ["Cuadrado", "Círculo", "Triángulo"], 1, "Se repite círculo, cuadrado; después viene círculo."],
    ["Sigue: rojo, azul, rojo, azul, ¿qué color viene?", ["Azul", "Verde", "Rojo"], 2, "El patrón alterna rojo y azul; sigue rojo."],
    ["¿Qué figura no tiene lados rectos?", ["Círculo", "Cuadrado", "Triángulo"], 0, "El borde del círculo es curvo."],
    ["Sigue: estrella, estrella, luna, estrella, estrella, ¿qué viene?", ["Estrella", "Luna", "Sol"], 1, "Se repite estrella, estrella, luna."],
  ]),
  topic("G02-MAT-B", "Medir longitudes y comparar unidades", [["centimetros", "Centímetros"], ["metros", "Metros"]], [
    ["Mide objetos pequeños", "El centímetro sirve para medir longitudes pequeñas. Coloca el cero de la regla en un extremo.", "Un lápiz de 12 cm mide más que uno de 9 cm."],
    ["Compara medidas", "Para comparar longitudes, usa la misma unidad. Si las unidades difieren, conviértelas primero.", "100 cm equivalen a 1 m."],
    ["Elige la unidad", "Usa metros para distancias más grandes y centímetros para objetos pequeños.", "La puerta puede medir 2 m; una goma puede medir 4 cm."],
  ], [
    ["Una cinta mide 8 cm y otra 12 cm. ¿Cuál es más larga?", ["La de 8 cm", "La de 12 cm", "Miden igual"], 1, "Doce centímetros son más que ocho."],
    ["¿Cuántos centímetros son 1 metro?", ["10", "100", "1000"], 1, "Un metro equivale a cien centímetros."],
    ["¿Cuál unidad conviene para medir el largo de un salón?", ["Metros", "Centímetros", "Gramos"], 0, "El salón se mide mejor en metros."],
    ["Una mesa mide 2 m. ¿Cuántos centímetros mide?", ["20", "200", "2000"], 1, "Dos metros equivalen a 200 cm."],
    ["Un libro mide 25 cm. ¿Qué unidad se usó?", ["Metro", "Centímetro", "Kilogramo"], 1, "La abreviatura cm significa centímetro."],
    ["Una cuerda mide 1 m y otra 80 cm. ¿Cuál es más larga?", ["La de 80 cm", "La de 1 m", "Son iguales"], 1, "Un metro son 100 cm, más que 80 cm."],
  ]),
  topic("G03-MAT-B", "Perímetro y área de rectángulos", [["perimetro", "Perímetro"], ["area", "Área"]], [
    ["Recorre el borde", "El perímetro es la longitud del contorno. Suma todos los lados usando la misma unidad.", "Un rectángulo de 4 cm por 2 cm tiene perímetro 4+2+4+2=12 cm."],
    ["Cuenta cuadrados", "El área mide la superficie. Un rectángulo de lados enteros puede cubrirse con cuadrados de 1 unidad por lado.", "Una cuadrícula de 3 filas y 4 columnas tiene 12 cuadrados."],
    ["Distingue las unidades", "El perímetro usa unidades de longitud; el área usa unidades cuadradas.", "Un patio de 5 m por 2 m tiene área 10 m² y perímetro 14 m."],
  ], [
    ["¿Cuál es el perímetro de un cuadrado de lado 3 cm?", ["6 cm", "9 cm", "12 cm"], 2, "Cuatro lados de 3 cm suman 12 cm."],
    ["Un rectángulo mide 5 cm por 2 cm. ¿Cuál es su perímetro?", ["7 cm", "14 cm", "10 cm"], 1, "5+2+5+2=14 cm."],
    ["Una cuadrícula tiene 3 filas y 4 columnas. ¿Cuál es su área en cuadritos?", ["7", "12", "14"], 1, "Tres grupos de cuatro cuadritos dan 12."],
    ["Un rectángulo mide 6 m por 2 m. ¿Cuál es su área?", ["8 m²", "12 m²", "16 m²"], 1, "6×2=12 m²."],
    ["¿Con qué unidad se expresa un perímetro?", ["cm", "cm²", "kg"], 0, "El perímetro es una longitud y puede medirse en cm."],
    ["Un piso de 4 m por 4 m tiene ¿qué área?", ["8 m²", "12 m²", "16 m²"], 2, "4×4=16 m²."],
  ]),
  topic("G04-MAT-B", "Ángulos y polígonos", [["angulos", "Ángulos"], ["poligonos", "Polígonos"]], [
    ["Observa la abertura", "Un ángulo recto mide 90°; uno agudo mide menos y uno obtuso más de 90° y menos de 180°.", "La esquina de una hoja rectangular forma un ángulo recto."],
    ["Cuenta lados", "Un polígono es una figura plana cerrada formada por segmentos rectos.", "Un pentágono tiene cinco lados."],
    ["Clasifica con cuidado", "Primero verifica que la figura sea cerrada y luego cuenta sus lados o compara la abertura de sus ángulos.", "Un hexágono cerrado tiene seis lados."],
  ], [
    ["¿Cuántos grados mide un ángulo recto?", ["45°", "90°", "180°"], 1, "Un ángulo recto mide 90°."],
    ["¿Cuál es un ángulo agudo?", ["60°", "90°", "120°"], 0, "60° es menor que 90°."],
    ["¿Cuántos lados tiene un pentágono?", ["4", "5", "6"], 1, "Penta indica cinco lados."],
    ["¿Cuántos lados tiene un hexágono?", ["5", "6", "8"], 1, "Un hexágono tiene seis lados."],
    ["¿Cuál ángulo es obtuso?", ["30°", "90°", "110°"], 2, "110° es mayor que 90° y menor que 180°."],
    ["¿Cuál figura es un polígono?", ["Un círculo", "Un triángulo", "Una línea abierta"], 1, "El triángulo es cerrado y tiene lados rectos."],
  ]),
  topic("G05-MAT-B", "Decimales en situaciones cotidianas", [["valor-decimal", "Valor decimal"], ["operar-decimales", "Operar decimales"]], [
    ["Lee la parte decimal", "En 2,35, el 3 indica décimas y el 5 centésimas. Las posiciones ayudan a comparar.", "2,35 es mayor que 2,3 porque 2,30 < 2,35."],
    ["Alinea posiciones", "Para sumar o restar decimales, coloca las comas bajo la misma columna y completa con ceros si hace falta.", "1,25 + 0,5 = 1,25 + 0,50 = 1,75."],
    ["Comprueba el resultado", "Estima antes de calcular para detectar errores de posición en la coma.", "3,2 + 1,4 debe estar cerca de 4,6, no de 46."],
  ], [
    ["En 4,7, ¿qué representa el 7?", ["Siete unidades", "Siete décimas", "Siete centenas"], 1, "El primer lugar tras la coma representa décimas."],
    ["¿Cuál número es mayor?", ["2,35", "2,3", "Son iguales"], 0, "2,35 es mayor que 2,30."],
    ["¿Cuánto es 1,25 + 0,5?", ["1,30", "1,75", "6,25"], 1, "1,25 + 0,50 = 1,75."],
    ["¿Cuánto es 3,4 − 1,2?", ["2,2", "2,8", "4,6"], 0, "Al restar las posiciones correspondientes resulta 2,2."],
    ["¿Cuál decimal equivale a dos décimas?", ["0,02", "0,2", "2,0"], 1, "Dos décimas se escriben 0,2."],
    ["Una compra cuesta 2,50 y otra 1,25. ¿Total?", ["3,75", "3,25", "4,75"], 0, "2,50 + 1,25 = 3,75."],
  ]),
  topic("G06-MAT-B", "Geometría: áreas y volumen", [["area-triangulo", "Área del triángulo"], ["volumen-prisma", "Volumen del prisma"]], [
    ["Mide una superficie", "El área de un triángulo es base por altura dividido entre dos. La altura debe ser perpendicular a la base.", "Base 6 cm y altura 4 cm: área = 6×4/2 = 12 cm²."],
    ["Cuenta unidades cúbicas", "El volumen de un prisma rectangular es largo por ancho por alto.", "Una caja de 2 cm por 3 cm por 4 cm ocupa 24 cm³."],
    ["Relaciona medida y unidad", "El área se expresa en unidades cuadradas y el volumen en unidades cúbicas.", "La superficie de una tapa puede medirse en cm² y la capacidad espacial de una caja en cm³."],
  ], [
    ["Triángulo con base 6 cm y altura 4 cm: ¿área?", ["10 cm²", "12 cm²", "24 cm²"], 1, "6×4/2=12 cm²."],
    ["Triángulo con base 8 m y altura 3 m: ¿área?", ["11 m²", "12 m²", "24 m²"], 1, "8×3/2=12 m²."],
    ["Caja de 2 cm por 3 cm por 4 cm: ¿volumen?", ["9 cm³", "12 cm³", "24 cm³"], 2, "2×3×4=24 cm³."],
    ["Prisma de 5 m por 2 m por 3 m: ¿volumen?", ["10 m³", "30 m³", "60 m³"], 1, "5×2×3=30 m³."],
    ["¿Cuál unidad corresponde a un área?", ["m", "m²", "m³"], 1, "El área usa unidades cuadradas."],
    ["¿Cuál unidad corresponde a un volumen?", ["cm", "cm²", "cm³"], 2, "El volumen usa unidades cúbicas."],
  ]),
  topic("G07-MAT-B", "Ecuaciones de primer grado", [["igualdad", "Igualdad"], ["despeje", "Despeje"]], [
    ["Mantén el equilibrio", "Una ecuación es una igualdad. Si sumas o restas la misma cantidad a ambos lados, la igualdad se conserva.", "x + 4 = 9: resta 4 a ambos lados y obtén x = 5."],
    ["Despeja la variable", "Para hallar una variable, deshaz las operaciones en orden inverso y comprueba el resultado.", "3x = 12: divide ambos lados entre 3 y obtén x = 4."],
    ["Comprueba sustituyendo", "Sustituye el valor encontrado en la ecuación inicial. Ambos lados deben tener el mismo valor.", "Si x = 4, en 3x = 12 queda 3×4=12."],
  ], [
    ["Si x + 4 = 9, ¿cuánto vale x?", ["4", "5", "13"], 1, "Resta 4 a ambos lados: x = 9 − 4 = 5."],
    ["Si y − 3 = 7, ¿cuánto vale y?", ["4", "10", "21"], 1, "Suma 3 a ambos lados: y = 10."],
    ["Si 3x = 12, ¿cuánto vale x?", ["3", "4", "9"], 1, "Divide 12 entre 3: x = 4."],
    ["Si 2a + 1 = 11, ¿cuánto vale a?", ["5", "6", "10"], 0, "Resta 1 y divide entre 2: a = 5."],
    ["Si z + 6 = 8, ¿cuánto vale z?", ["2", "6", "14"], 0, "Resta 6 a ambos lados: z = 2."],
    ["Si 4b = 20, ¿cuánto vale b?", ["4", "5", "16"], 1, "Divide 20 entre 4: b = 5."],
  ]),
  topic("G08-MAT-B", "Funciones lineales y sus gráficas", [["pendiente", "Pendiente"], ["intercepto", "Intercepto"]], [
    ["Relaciona dos cantidades", "En y = mx + b, la pendiente m indica cuánto cambia y cuando x aumenta una unidad.", "En y = 3x + 2, cada paso de x aumenta y en 3."],
    ["Ubica el inicio", "El intercepto b es el valor de y cuando x vale cero.", "En y = 3x + 2, si x = 0 entonces y = 2."],
    ["Construye una tabla", "Calcula varios pares (x,y) y verifica que la diferencia de y sea constante cuando x crece de uno en uno.", "Para y = 2x + 1: x = 0,1,2 produce y = 1,3,5."],
  ], [
    ["En y = 3x + 2, ¿cuál es la pendiente?", ["2", "3", "5"], 1, "El coeficiente de x es 3."],
    ["En y = 2x − 1, ¿cuánto aumenta y si x aumenta 1?", ["1", "2", "3"], 1, "La pendiente es 2."],
    ["En y = 3x + 2, ¿cuál es y cuando x = 0?", ["0", "2", "3"], 1, "3×0+2=2."],
    ["En y = 4x − 5, ¿cuál es el intercepto con el eje y?", ["−5", "4", "5"], 0, "Cuando x=0, y=−5."],
    ["Una tabla da y=1,3,5 para x=0,1,2. ¿Cuál es el cambio por paso?", ["1", "2", "3"], 1, "Los valores de y aumentan de dos en dos."],
    ["En y = 5x + 7, ¿cuál es y cuando x=0?", ["5", "7", "12"], 1, "El valor inicial es 7."],
  ]),
  topic("G09-MAT-B", "Teorema de Pitágoras", [["hipotenusa", "Hipotenusa"], ["cateto", "Cateto"]], [
    ["Identifica el triángulo", "El teorema de Pitágoras se aplica a triángulos rectángulos. La hipotenusa es el lado opuesto al ángulo recto.", "Con catetos 3 y 4, la hipotenusa mide 5 porque 3²+4²=5²."],
    ["Calcula la hipotenusa", "Eleva al cuadrado los catetos, suma y toma la raíz cuadrada del resultado.", "Catetos 5 y 12: h²=25+144=169; h=13."],
    ["Halla un cateto", "Si conoces la hipotenusa y un cateto, resta sus cuadrados antes de tomar la raíz.", "Hipotenusa 10 y cateto 6: el otro cateto mide 8 porque 100−36=64."],
  ], [
    ["Con catetos 3 y 4, ¿cuál es la hipotenusa?", ["5", "7", "12"], 0, "3²+4²=25 y su raíz es 5."],
    ["Con catetos 5 y 12, ¿cuál es la hipotenusa?", ["12", "13", "17"], 1, "25+144=169 y su raíz es 13."],
    ["Hipotenusa 5 y un cateto 3: ¿cuál es el otro cateto?", ["2", "4", "8"], 1, "25−9=16 y su raíz es 4."],
    ["Hipotenusa 10 y un cateto 6: ¿cuál es el otro cateto?", ["4", "8", "16"], 1, "100−36=64 y su raíz es 8."],
    ["¿A cuál triángulo se aplica directamente Pitágoras?", ["A uno rectángulo", "A cualquiera", "Solo a uno equilátero"], 0, "El teorema relaciona lados de un triángulo rectángulo."],
    ["Hipotenusa 13 y un cateto 12: ¿cuál es el otro cateto?", ["1", "5", "25"], 1, "169−144=25; su raíz es 5."],
  ]),
  topic("G10-MAT-B", "Estadística: media y mediana", [["media", "Media"], ["mediana", "Mediana"]], [
    ["Calcula la media", "La media aritmética es la suma de los datos dividida entre la cantidad de datos.", "Para 2, 4 y 6, la media es (2+4+6)/3=4."],
    ["Ordena para la mediana", "La mediana es el dato central cuando la lista está ordenada. Con cantidad par, promedia los dos centrales.", "En 1, 3, 8, la mediana es 3."],
    ["Compara medidas", "La media puede cambiar mucho por un valor extremo; la mediana describe el centro por posición.", "En 2, 3, 100, la mediana es 3 y la media es 35."],
  ], [
    ["¿Cuál es la media de 2, 4 y 6?", ["3", "4", "6"], 1, "12 dividido entre 3 es 4."],
    ["¿Cuál es la media de 3 y 7?", ["4", "5", "10"], 1, "(3+7)/2=5."],
    ["¿Cuál es la mediana de 1, 3 y 8?", ["1", "3", "8"], 1, "El dato central ordenado es 3."],
    ["¿Cuál es la mediana de 2, 4, 6 y 8?", ["4", "5", "6"], 1, "Los dos centrales son 4 y 6; su media es 5."],
    ["Los datos son 2, 3 y 100. ¿Cuál es la media?", ["3", "35", "100"], 1, "105 dividido entre 3 es 35."],
    ["Los datos son 2, 3 y 100. ¿Cuál es la mediana?", ["2", "3", "35"], 1, "El dato central en la lista ordenada es 3."],
  ]),
  topic("G11-MAT-B", "Tasas de cambio y funciones", [["tasa-media", "Tasa media"], ["evaluar-funcion", "Evaluar funciones"]], [
    ["Mide el cambio", "La tasa de cambio media compara la diferencia de una magnitud con la diferencia de otra.", "Si una distancia pasa de 2 km a 8 km en 2 h, la tasa media es (8−2)/2=3 km/h."],
    ["Evalúa una función", "Sustituye la variable por el valor solicitado respetando el orden de operaciones.", "Si f(x)=2x+1, entonces f(3)=7."],
    ["Interpreta unidades", "Una tasa expresa cambio por unidad de la variable independiente; revisa si el contexto permite una tasa constante.", "3 km/h describe tres kilómetros por cada hora en ese intervalo."],
  ], [
    ["Una distancia sube de 2 a 8 km en 2 h. ¿Tasa media?", ["2 km/h", "3 km/h", "6 km/h"], 1, "(8−2)/2=3 km/h."],
    ["Una cantidad pasa de 5 a 15 en 5 min. ¿Cambio por minuto?", ["2", "3", "10"], 0, "(15−5)/5=2 por minuto."],
    ["Si f(x)=2x+1, ¿cuánto es f(3)?", ["5", "6", "7"], 2, "2×3+1=7."],
    ["Si g(x)=x²−1, ¿cuánto es g(4)?", ["7", "15", "17"], 1, "4²−1=15."],
    ["¿Qué expresa km/h?", ["Distancia por hora", "Tiempo por kilómetro cuadrado", "Masa por hora"], 0, "km/h significa kilómetros por hora."],
    ["Si h(x)=3x−2, ¿cuánto es h(2)?", ["2", "4", "6"], 1, "3×2−2=4."],
  ]),
  topic("G01-ESP-B", "Oraciones y lectura inicial", [["oraciones", "Oraciones"], ["comprension", "Comprensión"]], [
    ["Forma una idea completa", "Una oración comunica una idea. Comienza con mayúscula y termina con punto cuando afirma algo.", "El gato duerme en su cama."],
    ["Lee con atención", "Las palabras de una oración indican quién hace algo y qué ocurre.", "En «Ana canta», Ana es quien canta."],
    ["Escribe y comprueba", "Ordena las palabras para que expresen una idea y vuelve a leerla en voz alta.", "«Juega Luis» se puede escribir como «Luis juega»."],
  ], [
    ["¿Cuál es una oración completa?", ["El perro corre.", "Perro el", "Corre el"] ,0, "El perro corre comunica una idea completa."],
    ["¿Con qué comienza una oración escrita?", ["Con punto", "Con mayúscula", "Con coma"], 1, "La primera letra se escribe con mayúscula."],
    ["Lee: «Marta salta». ¿Quién salta?", ["Marta", "Ana", "El perro"], 0, "La oración dice que Marta salta."],
    ["Lee: «El sol brilla». ¿Qué brilla?", ["La luna", "El sol", "La casa"], 1, "El texto nombra al sol."],
    ["¿Qué signo cierra «La flor crece»?", ["Punto", "Coma", "Guion"], 0, "Una afirmación termina con punto."],
    ["Ordena la idea: «lee / Sara». ¿Cuál frase se entiende?", ["Sara el.", "Sara lee.", "Lee el Sara."], 1, "Sara lee expresa con claridad quién realiza la acción."],
  ]),
  topic("G02-ESP-B", "Describir personas y objetos", [["adjetivos", "Adjetivos"], ["detalles", "Detalles"]], [
    ["Elige características", "Una descripción dice cómo es alguien o algo. Los adjetivos nombran cualidades.", "«La mochila azul» describe el color de la mochila."],
    ["Añade detalles útiles", "Selecciona detalles que ayuden a imaginar o reconocer el objeto descrito.", "«La taza pequeña de barro» da tamaño y material."],
    ["Revisa tu texto", "Comprueba que las palabras elegidas correspondan a lo que describes y que la oración se entienda.", "«El perro juguetón corre» describe y cuenta una acción."],
  ], [
    ["En «la casa grande», ¿qué palabra describe?", ["casa", "grande", "la"], 1, "Grande indica una cualidad de la casa."],
    ["¿Cuál palabra describe el color de una pelota?", ["roja", "rueda", "pelota"], 0, "Roja es un adjetivo de color."],
    ["¿Qué detalle ayuda a reconocer una taza?", ["Es de barro", "Ayer llovió", "El tren salió"], 0, "El material describe la taza."],
    ["Para describir un gato, ¿qué frase es pertinente?", ["Tiene pelaje blanco", "La mesa es alta", "Hoy es lunes"], 0, "El pelaje es una característica del gato."],
    ["En «el perro juguetón», ¿cuál es el adjetivo?", ["perro", "el", "juguetón"], 2, "Juguetón describe al perro."],
    ["¿Cuál oración describe una mochila?", ["La mochila es verde y grande.", "La mochila llegó.", "Veo la mochila."], 0, "Verde y grande indican cualidades."],
  ]),
  topic("G03-ESP-B", "Párrafos e ideas principales", [["idea-principal", "Idea principal"], ["detalles-apoyo", "Detalles de apoyo"]], [
    ["Encuentra el tema", "Un párrafo reúne oraciones sobre un mismo asunto. La idea principal expresa lo más importante.", "«Las abejas ayudan a las plantas. Transportan polen entre flores» trata sobre su ayuda a las plantas."],
    ["Reconoce detalles", "Los detalles amplían, explican o dan un ejemplo de la idea principal.", "Transportar polen explica una manera en que las abejas ayudan."],
    ["Resume sin copiar todo", "Al resumir, conserva la idea central y evita añadir datos que el párrafo no dice.", "«Las abejas favorecen a las plantas» resume el ejemplo sin inventar otra acción."],
  ], [
    ["Lee: «Los árboles dan sombra y refugio». ¿Tema?", ["Los árboles", "Los autos", "La lluvia"], 0, "La oración habla de los árboles."],
    ["Lee: «La bicicleta permite viajar sin combustible y hacer ejercicio». ¿Idea principal?", ["La bicicleta es útil", "El combustible es rojo", "El viaje fue ayer"], 0, "Los dos detalles explican la utilidad de la bicicleta."],
    ["¿Qué detalle apoya «Los árboles protegen animales»?", ["Sirven de refugio", "Tienen nombre", "La calle es larga"], 0, "El refugio explica la protección."],
    ["¿Qué detalle apoya «El agua es necesaria para las plantas»?", ["Permite que crezcan", "Tiene una botella", "La pared es azul"], 0, "El crecimiento es una consecuencia relacionada."],
    ["En «Las abejas ayudan a las plantas. Transportan polen», ¿cuál es la idea principal?", ["Las abejas ayudan a las plantas", "Todas las flores son azules", "El polen es una calle"], 0, "La segunda oración explica la primera."],
    ["¿Qué frase resume «Los libros narran historias y explican temas»?", ["Los libros ofrecen distintos contenidos", "Los libros son todos iguales", "Los libros son caros"], 0, "El resumen incluye historias y explicaciones sin inventar datos."],
  ]),
  topic("G04-ESP-B", "Personajes y secuencia narrativa", [["personajes", "Personajes"], ["secuencia", "Secuencia"]], [
    ["Identifica personajes", "En un relato, los personajes realizan acciones. Busca en el texto quién actúa y qué hace.", "«Lina sembró una semilla»: Lina es el personaje que siembra."],
    ["Ordena hechos", "Los hechos pueden organizarse en inicio, desarrollo y final. Las palabras antes, después y al final ayudan.", "Lina sembró, regó y luego vio un brote."],
    ["Explica con evidencia", "Para responder sobre un relato, vuelve a la frase que menciona el hecho; evita inventar acciones.", "Si el texto dice «regó la semilla», no afirmes que la llevó al parque."],
  ], [
    ["En «Lina sembró una semilla», ¿quién actúa?", ["La semilla", "Lina", "El viento"], 1, "Lina realiza la acción de sembrar."],
    ["Lee: «Pedro abrió el libro». ¿Qué hizo Pedro?", ["Abrió el libro", "Sembró", "Cocinó"], 0, "El texto indica que abrió el libro."],
    ["Lina sembró, regó y vio un brote. ¿Qué hizo después de sembrar?", ["Vio el brote", "Regó", "Compró una maceta"], 1, "Regar fue el segundo hecho narrado."],
    ["Ana llegó, saludó y se sentó. ¿Qué ocurrió al final?", ["Llegó", "Saludó", "Se sentó"], 2, "Sentarse fue el último hecho."],
    ["¿Qué personaje recoge la pelota en «Juan la recoge»?", ["Juan", "La pelota", "Nadie"], 0, "Juan realiza la acción."],
    ["¿Qué palabra indica que un hecho va después?", ["Antes", "Luego", "Ayer"], 1, "Luego se usa para un hecho posterior."],
  ]),
  topic("G05-ESP-B", "Opiniones, razones y evidencia", [["opinion", "Opinión"], ["evidencia", "Evidencia"]], [
    ["Distingue opinión", "Una opinión expresa lo que alguien piensa. Puede apoyarse con razones, pero no es un hecho comprobado solo por decirlo.", "«El recreo debería durar más» expresa una opinión."],
    ["Busca razones", "Una razón explica por qué se sostiene una opinión. Debe relacionarse con la idea defendida.", "«Porque permite descansar» es una razón pertinente para hablar del recreo."],
    ["Apoya con evidencia", "Un dato verificable puede apoyar una razón. Identifica de dónde viene antes de usarlo.", "Un registro de uso de la biblioteca puede apoyar una propuesta para ampliar su horario."],
  ], [
    ["¿Cuál frase expresa una opinión?", ["El recreo debería durar más", "La clase empieza a las 8", "Hay 20 pupitres"], 0, "Debería expresa una postura."],
    ["¿Cuál frase se puede comprobar contando?", ["El patio es el mejor lugar", "Hay 20 pupitres", "El recreo es perfecto"], 1, "El número de pupitres se puede verificar."],
    ["¿Qué razón apoya ampliar el recreo?", ["Permite descansar", "La pared es amarilla", "Hoy es martes"], 0, "Descansar se relaciona con la duración del recreo."],
    ["¿Qué razón apoya cuidar la biblioteca?", ["Así otros podrán usar los libros", "La cancha es grande", "El cielo está nublado"], 0, "Conservar libros permite que otras personas los usen."],
    ["¿Qué dato apoya pedir más libros?", ["Un conteo de solicitudes", "Un color favorito", "Un rumor"], 0, "El conteo muestra demanda verificable."],
    ["¿Qué debes indicar al usar un dato?", ["Su fuente", "Solo su color", "Un apodo inventado"], 0, "La fuente permite comprobar el dato."],
  ]),
  topic("G06-ESP-B", "Comparar información en dos textos", [["datos", "Datos"], ["comparacion", "Comparación"]], [
    ["Ubica lo que dice cada texto", "Antes de comparar, separa la información de cada fuente y reconoce su fecha y tema.", "Texto A: el museo abre a las 9. Texto B: cierra a las 17."],
    ["Encuentra coincidencias", "Dos textos coinciden si presentan información compatible sobre el mismo aspecto.", "Si ambos dicen que el museo abre el lunes, coinciden en ese punto."],
    ["Identifica diferencias", "Una diferencia puede deberse a fechas, lugares o datos distintos; no declares contradicción sin comprobar el contexto.", "Un horario de vacaciones puede ser distinto al horario habitual."],
  ], [
    ["Texto A: abre a las 9. Texto B: cierra a las 17. ¿Qué informa A?", ["La apertura", "El cierre", "El precio"], 0, "A indica a qué hora abre."],
    ["¿Qué dato conviene revisar si dos horarios difieren?", ["La fecha", "El color del papel", "El tamaño de letra"], 0, "Podrían corresponder a fechas distintas."],
    ["Dos textos dicen que el museo abre los lunes. ¿Qué relación hay?", ["Coinciden", "Se contradicen", "No tratan del museo"], 0, "Ambos afirman lo mismo sobre el lunes."],
    ["A dice «abre a las 9» y B «abre a las 10» para el mismo día. ¿Qué debes hacer?", ["Comprobar fecha y fuente", "Elegir al azar", "Ignorar ambos"], 0, "El contexto y la fuente pueden explicar la diferencia."],
    ["¿Qué dato identifica una fuente?", ["Fecha de publicación", "Color del fondo", "Número de páginas sin título"], 0, "La fecha ayuda a ubicar la información."],
    ["Dos textos tratan de ciudades distintas. ¿Puedes comparar sus horarios como si fueran el mismo lugar?", ["Sí siempre", "No, primero reviso el lugar", "Solo si tienen fotos"], 1, "El lugar cambia el significado de los horarios."],
  ]),
  topic("G07-ESP-B", "Inferencias y motivaciones en relatos", [["indicios", "Indicios"], ["motivaciones", "Motivaciones"]], [
    ["Lee entre líneas", "Una inferencia combina pistas del texto con una conclusión prudente; no añade hechos sin apoyo.", "Si alguien toma un paraguas al ver nubes oscuras, puedes inferir que espera lluvia."],
    ["Busca motivos", "La motivación explica por qué actúa un personaje. Relaciónala con sus palabras y acciones.", "Si Camila comparte agua con un compañero sediento, quizá quiere ayudarlo."],
    ["Justifica la inferencia", "Señala la pista concreta que apoya tu interpretación y acepta que puede haber más de una lectura.", "«El compañero tenía sed» apoya la idea de ayuda."],
  ], [
    ["Luis vio nubes oscuras y llevó paraguas. ¿Qué espera?", ["Lluvia", "Nieve segura", "Un examen"], 0, "El paraguas y las nubes son pistas de posible lluvia."],
    ["¿Qué es un indicio en un relato?", ["Una pista del texto", "Un dato inventado", "Una palabra aleatoria"], 0, "La inferencia necesita pistas del texto."],
    ["Camila comparte agua con alguien sediento. ¿Motivo probable?", ["Ayudar", "Esconder un libro", "Llegar tarde"], 0, "Compartir agua se relaciona con ayudar a quien tiene sed."],
    ["Un personaje estudia antes de una prueba. ¿Motivo probable?", ["Prepararse", "Dormir", "Cocinar"], 0, "Estudiar es una acción de preparación."],
    ["¿Qué pista apoya inferir lluvia?", ["Nubes oscuras", "Una mesa roja", "Una canción"], 0, "Las nubes oscuras pueden anunciar lluvia."],
    ["¿Cómo justificas un motivo inferido?", ["Citando una acción del personaje", "Inventando un final", "Ignorando el texto"], 0, "La acción observada sostiene la interpretación."],
  ]),
  topic("G08-ESP-B", "Conectores y relaciones entre ideas", [["causa", "Causa"], ["contraste", "Contraste"]], [
    ["Explica causas", "Un conector como «porque» introduce una razón o causa. Revisa qué hecho explica.", "«No salí porque llovía»: la lluvia explica la decisión."],
    ["Muestra contraste", "Conectores como «pero» y «sin embargo» unen ideas que contrastan.", "«Quería caminar, pero llovía» presenta un obstáculo."],
    ["Elige conector", "Antes de unir dos oraciones, decide si la relación es de causa, consecuencia o contraste.", "«Llovía; por eso llevé paraguas» expresa consecuencia."],
  ], [
    ["En «No salí porque llovía», ¿qué indica «porque»?", ["Causa", "Contraste", "Lugar"], 0, "Porque introduce la causa."],
    ["¿Qué conector completa «Llevé paraguas ___ llovía»?", ["porque", "pero", "aunque no"], 0, "La lluvia es la razón para llevarlo."],
    ["En «Quería salir, pero llovía», ¿qué expresa «pero»?", ["Causa", "Contraste", "Orden"], 1, "Pero contrapone el deseo y la lluvia."],
    ["¿Qué conector contrasta dos ideas?", ["sin embargo", "porque", "debido a"], 0, "Sin embargo se usa para contrastar."],
    ["En «Estudié porque tenía examen», ¿cuál es la causa?", ["Tener examen", "Estudiar", "Ninguna"], 0, "El examen explica el estudio."],
    ["En «Llovía; por eso llevé paraguas», ¿qué expresa «por eso»?", ["Consecuencia", "Contraste", "Duda"], 0, "Llevar paraguas es consecuencia de la lluvia."],
  ]),
  topic("G09-ESP-B", "Argumentos y fuentes confiables", [["argumento", "Argumento"], ["fuente", "Fuente"]], [
    ["Relaciona idea y razón", "Un argumento sostiene una postura con una razón pertinente; una afirmación aislada no demuestra su verdad.", "«Ampliemos la biblioteca porque faltan puestos» une postura y razón."],
    ["Examina las fuentes", "Pregunta quién produjo el dato, cuándo y cómo se obtuvo antes de usarlo como evidencia.", "Un conteo fechado de puestos ocupados es más comprobable que un rumor."],
    ["Reconoce límites", "Una muestra pequeña no representa necesariamente a toda una comunidad. Describe a quiénes se consultó.", "Una opinión de tres personas no permite afirmar que todos piensan igual."],
  ], [
    ["En «Ampliemos la biblioteca porque faltan puestos», ¿cuál es la postura?", ["Ampliemos la biblioteca", "Faltan puestos", "La biblioteca tiene puerta"], 0, "La postura propone ampliar la biblioteca."],
    ["¿Cuál razón apoya ampliar la biblioteca?", ["Faltan puestos para leer", "La pared es blanca", "Hoy es jueves"], 0, "La falta de puestos se relaciona con la propuesta."],
    ["¿Qué debes preguntar sobre un dato?", ["Quién lo obtuvo y cuándo", "Solo su color", "Cuántas letras tiene"], 0, "Autor y fecha ayudan a juzgar la fuente."],
    ["¿Qué fuente permite comprobar ocupación de puestos?", ["Un registro fechado", "Un rumor", "Una foto sin contexto"], 0, "Un registro fechado ofrece datos verificables."],
    ["¿Una opinión de tres personas representa necesariamente a toda la escuela?", ["Sí", "No", "Siempre si son amigos"], 1, "Tres opiniones no permiten generalizar sin conocer la muestra."],
    ["¿Qué dato falta en «según una encuesta»?", ["A quiénes y cuándo se preguntó", "El color del lápiz", "La hora del recreo"], 0, "La muestra y fecha dan contexto a la encuesta."],
  ]),
  topic("G10-ESP-B", "Contrastar fuentes y detectar sesgos", [["contrastar", "Contrastar fuentes"], ["sesgo", "Sesgo"]], [
    ["Compara afirmaciones", "Para contrastar fuentes, identifica la misma pregunta en cada una y anota qué datos ofrecen.", "Una fuente informa 40 encuestados y otra 400; compara el método antes de unir resultados."],
    ["Revisa el punto de vista", "Un texto puede destacar ciertos datos y omitir otros. Pregunta quién escribe y cuál es su propósito.", "Una publicidad de un producto destaca sus ventajas; busca también una fuente independiente."],
    ["Sostén una conclusión prudente", "No conviertas una correlación o una muestra limitada en una causa general sin evidencia adicional.", "Si una encuesta reunió solo a un curso, describe ese curso y no a toda la ciudad."],
  ], [
    ["Dos encuestas tienen 40 y 400 respuestas. ¿Qué debes comparar?", ["Método y muestra", "Solo colores", "Solo títulos"], 0, "Tamaño y selección de la muestra importan."],
    ["¿Qué pregunta ayuda a contrastar dos fuentes?", ["Qué pregunta responden", "Cuál tiene letra más grande", "Cuál usa más colores"], 0, "La comparación necesita un asunto común."],
    ["Una publicidad destaca solo ventajas. ¿Qué conviene revisar?", ["Posibles datos omitidos", "Solo el logo", "El papel"], 0, "El propósito comercial puede influir en la selección de datos."],
    ["¿Qué dato ayuda a identificar el punto de vista?", ["Quién publica", "Tamaño de fuente", "Color del fondo"], 0, "La autoría y propósito contextualizan el mensaje."],
    ["Una encuesta de un solo curso permite concluir directamente sobre: ", ["Ese curso", "Toda Colombia", "Todas las edades"], 0, "La muestra solo describe al grupo consultado."],
    ["¿Qué debes evitar al comparar dos cifras?", ["Ignorar fechas y métodos", "Revisar fuentes", "Anotar unidades"], 0, "Las cifras necesitan contexto comparable."],
  ]),
  topic("G11-ESP-B", "Escritura argumentativa y revisión", [["tesis", "Tesis"], ["revision", "Revisión"]], [
    ["Formula una tesis", "Una tesis es una postura clara y discutible. Evita frases tan amplias que no se puedan defender.", "«La biblioteca escolar debería ampliar su horario» puede defenderse con razones."],
    ["Organiza la evidencia", "Cada párrafo de desarrollo debe relacionar una razón con datos o ejemplos cuya fuente pueda consultarse.", "Un registro de préstamos puede apoyar la ampliación del horario."],
    ["Revisa y matiza", "Comprueba coherencia, fuentes, contraargumentos y una conclusión que responda a la tesis.", "Si el registro cubre solo un mes, evita afirmar que siempre hay alta demanda."],
  ], [
    ["¿Cuál es una tesis discutible?", ["La biblioteca debería ampliar su horario", "La biblioteca tiene una puerta", "El libro es de papel"], 0, "La primera propone una postura que puede argumentarse."],
    ["¿Qué rasgo necesita una tesis?", ["Claridad", "Ser un dato aislado", "No poder discutirse"], 0, "Una tesis clara permite evaluar las razones."],
    ["¿Qué evidencia apoya ampliar el horario?", ["Registro de préstamos y solicitudes", "Color del escritorio", "Rumor sin fuente"], 0, "Los registros se relacionan con la demanda del servicio."],
    ["¿Qué debe explicar un párrafo de desarrollo?", ["Cómo su evidencia apoya la tesis", "Solo repetir el título", "Un tema ajeno"], 0, "La evidencia necesita conexión con la postura."],
    ["Si solo tienes datos de un mes, ¿qué afirmación es prudente?", ["En ese mes hubo demanda", "Siempre hay la misma demanda", "Nunca hay demanda"], 0, "El dato solo respalda el período observado."],
    ["¿Qué revisas antes de entregar un argumento?", ["Coherencia y fuentes", "Solo el color", "Solo la longitud"], 0, "Fuentes y coherencia hacen comprensible el argumento."],
  ]),
  topic("G10-FIS-B", "Trabajo y energía mecánica", [["trabajo", "Trabajo mecánico"], ["energia", "Energía mecánica"]], [
    ["Relaciona fuerza y desplazamiento", "Si una fuerza constante actúa en la misma dirección del desplazamiento, el trabajo es W = F×d.", "Una fuerza de 5 N que desplaza una caja 3 m en su dirección realiza 15 J de trabajo."],
    ["Reconoce formas de energía", "La energía cinética se relaciona con el movimiento y la potencial gravitatoria con la altura en un campo gravitatorio.", "Una pelota elevada puede adquirir velocidad al caer: cambia su energía potencial y cinética."],
    ["Cuida las condiciones", "La fórmula W = F×d requiere fuerza paralela al desplazamiento; si forman un ángulo hay que considerar su componente paralela.", "Una fuerza perpendicular al desplazamiento realiza trabajo nulo en ese movimiento ideal."],
  ], [
    ["Fuerza de 5 N paralela a un desplazamiento de 3 m: ¿trabajo?", ["8 J", "15 J", "2 J"], 1, "W=5×3=15 J."],
    ["Fuerza de 10 N paralela a 2 m: ¿trabajo?", ["5 J", "12 J", "20 J"], 2, "W=10×2=20 J."],
    ["¿Qué energía se relaciona directamente con el movimiento?", ["Cinética", "Potencial gravitatoria", "Ninguna"], 0, "La energía cinética depende del movimiento."],
    ["¿Qué cambia al elevar una pelota en un campo gravitatorio?", ["Su energía potencial gravitatoria", "Su masa necesariamente", "Su composición"], 0, "Al aumentar la altura aumenta la energía potencial gravitatoria respecto a la referencia."],
    ["Si la fuerza es perpendicular al desplazamiento ideal, ¿qué trabajo realiza?", ["0 J", "F×d", "Siempre 1 J"], 0, "No tiene componente paralela al movimiento."],
    ["Una pelota cae sin rozamiento. ¿Qué energía tiende a aumentar?", ["Cinética", "Potencial gravitatoria", "Masa"], 0, "Al acelerar mientras cae aumenta la energía cinética."],
  ]),
  topic("G11-FIS-B", "Frecuencia y período de ondas", [["periodo", "Período"], ["frecuencia", "Frecuencia"]], [
    ["Mide un ciclo", "El período T es el tiempo de un ciclo completo de una onda periódica.", "Si una oscilación tarda 2 s en repetirse, T=2 s."],
    ["Cuenta ciclos por segundo", "La frecuencia f indica cuántos ciclos ocurren por segundo y se mide en hercios (Hz).", "Si hay 4 ciclos cada segundo, f=4 Hz."],
    ["Relaciona ambas magnitudes", "Para una onda periódica, f=1/T y T=1/f, con segundos y hercios.", "Si el período T es 0,5 s, la frecuencia f es 2 Hz."],
  ], [
    ["Una onda repite un ciclo cada 2 s. ¿Período?", ["0,5 s", "2 s", "4 s"], 1, "El período es la duración de un ciclo: 2 s."],
    ["¿Qué mide el período?", ["Tiempo de un ciclo", "Ciclos por segundo", "Amplitud"], 0, "T es tiempo por ciclo."],
    ["Hay 4 ciclos cada segundo. ¿Frecuencia?", ["0,25 Hz", "2 Hz", "4 Hz"], 2, "Cuatro ciclos por segundo equivalen a 4 Hz."],
    ["Si T=0,5 s, ¿cuál es la frecuencia?", ["0,5 Hz", "2 Hz", "5 Hz"], 1, "f=1/0,5=2 Hz."],
    ["Si T=4 s, ¿cuál es la frecuencia?", ["0,25 Hz", "4 Hz", "8 Hz"], 0, "f=1/4=0,25 Hz."],
    ["¿En qué unidad se mide la frecuencia?", ["Segundos", "Hercios", "Metros"], 1, "La frecuencia se mide en Hz o hercios."],
  ]),
  topic("G10-QUI-B", "Mezclas, disoluciones y concentración", [["mezclas", "Mezclas"], ["concentracion", "Concentración"]], [
    ["Reconoce componentes", "Una disolución homogénea tiene soluto disuelto en un disolvente. Su composición es uniforme a simple vista.", "En agua con sal disuelta, la sal es soluto y el agua disolvente."],
    ["Compara concentraciones", "La concentración depende de cuánto soluto hay respecto a una cantidad de disolución o disolvente especificada.", "Con igual volumen final, 10 g de sal producen mayor concentración que 5 g."],
    ["Indica la base de comparación", "No compares solo masas de soluto si los volúmenes finales son distintos. Anota la unidad usada.", "10 g en 1 L equivalen a 10 g/L; 5 g en 0,25 L equivalen a 20 g/L."],
  ], [
    ["En agua con sal disuelta, ¿cuál es el soluto?", ["Agua", "Sal", "Vaso"], 1, "La sal es la sustancia disuelta."],
    ["¿Cuál es el disolvente en agua con azúcar?", ["Agua", "Azúcar", "Aire"], 0, "El agua disuelve el azúcar."],
    ["Dos soluciones tienen igual volumen final: una tiene 5 g y otra 10 g de sal. ¿Cuál está más concentrada?", ["La de 5 g", "La de 10 g", "Son iguales"], 1, "Con igual volumen, más soluto implica mayor concentración."],
    ["Hay 10 g de soluto en 1 L de disolución. ¿Concentración?", ["1 g/L", "10 g/L", "100 g/L"], 1, "10 g dividido entre 1 L son 10 g/L."],
    ["¿Qué describe una disolución homogénea?", ["Composición uniforme", "Capas visibles siempre", "Solo una sustancia"], 0, "Sus componentes están distribuidos de forma uniforme a simple vista."],
    ["5 g en 0,25 L de disolución: ¿concentración en g/L?", ["1,25", "5", "20"], 2, "5/0,25=20 g/L."],
  ]),
  topic("G11-QUI-B", "Ácidos, bases y escala de pH", [["ph", "Escala de pH"], ["comparar", "Comparar acidez"]], [
    ["Lee el pH", "En disoluciones acuosas usuales, pH menor que 7 indica carácter ácido; 7, neutro; mayor que 7, básico.", "Una disolución de pH 3 es ácida."],
    ["Compara acidez", "Un pH menor indica mayor acidez en la comparación de disoluciones acuosas bajo condiciones comparables.", "pH 2 es más ácido que pH 5."],
    ["Usa la escala con prudencia", "El pH es una escala logarítmica: una unidad de diferencia corresponde aproximadamente a diez veces en concentración de iones hidronio bajo condiciones ideales.", "pH 4 tiene aproximadamente diez veces la concentración de H₃O⁺ que pH 5 en condiciones comparables."],
  ], [
    ["Una disolución acuosa tiene pH 3. ¿Cómo se clasifica?", ["Ácida", "Neutra", "Básica"], 0, "pH menor que 7 indica acidez."],
    ["¿Qué pH indica neutralidad en el modelo escolar usual?", ["3", "7", "11"], 1, "pH 7 se considera neutro en condiciones usuales."],
    ["Entre pH 2 y pH 5, ¿cuál es más ácido?", ["pH 2", "pH 5", "Iguales"], 0, "El menor pH indica mayor acidez en condiciones comparables."],
    ["Una disolución acuosa tiene pH 10. ¿Es ácida o básica?", ["Ácida", "Básica", "Neutra"], 1, "pH mayor que 7 indica carácter básico."],
    ["¿Qué muestra un pH menor que 7 en esta escala escolar?", ["Acidez", "Neutralidad", "Solo temperatura"], 0, "Un pH menor que 7 indica carácter ácido."],
    ["Bajo condiciones comparables, pH 4 frente a pH 5 implica aproximadamente cuánta concentración de H₃O⁺?", ["Igual", "Diez veces", "Cien veces menos"], 1, "Una unidad de pH corresponde aproximadamente a un factor de diez."],
  ]),
];
