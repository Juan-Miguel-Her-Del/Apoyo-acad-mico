// Borradores originales de apoyo. Son ejemplos para estudiar, no secuencias
// curriculares aprobadas ni transcripciones de los DBA del MEN.
export type StudyChapter = { title: string; explanation: string; example: string;
  alternateExample?: string; shortCheck?: { prompt: string; referenceAnswer: string } };
type Pair = readonly [StudyChapter, StudyChapter];

export const additionalChapters: Readonly<Record<string, Pair>> = {
  "G01-MAT": [
    { title: "Ordenar números", explanation: "Para ordenar números de dos cifras, compara primero las decenas. Si son iguales, compara las unidades.", example: "Entre 38 y 43, el 43 es mayor porque tiene cuatro decenas y 38 tiene tres." },
    { title: "Resolver con objetos", explanation: "Representa una situación con fichas o dibujos antes de escribir la operación. Cuenta el total y explica cómo lo comprobaste.", example: "Sara tiene 12 fichas y recibe 5. Dibuja 12, agrega 5 y cuenta 17. También puedes calcular 12 + 5 = 17." },
  ],
  "G02-MAT": [
    { title: "Sumar por posiciones", explanation: "Separa centenas, decenas y unidades. Suma las partes de igual posición y vuelve a formar el número.", example: "234 + 125: 200 + 100 = 300; 30 + 20 = 50; 4 + 5 = 9. Resultado: 359." },
    { title: "Comprobar una resta", explanation: "Una resta puede comprobarse sumando la diferencia al número que se quitó. El resultado debe ser el número inicial.", example: "Si 352 − 127 = 225, verifica 225 + 127 = 352." },
  ],
  "G03-MAT": [
    { title: "Repartir en partes iguales", explanation: "Dividir permite averiguar cuántos objetos recibe cada grupo cuando todos deben recibir lo mismo.", example: "24 lápices entre 6 estudiantes son 4 lápices por estudiante, porque 6 × 4 = 24." },
    { title: "Elegir la operación", explanation: "Lee qué se conoce y qué se pregunta. Si hay varios grupos iguales y buscas el total, multiplica; si buscas el tamaño de cada grupo, divide.", example: "Cinco cajas con ocho libros: 5 × 8 = 40. Si repartes esos 40 libros en cinco cajas: 40 ÷ 5 = 8." },
  ],
  "G04-MAT": [
    { title: "Comparar fracciones", explanation: "Con el mismo denominador, la fracción con mayor numerador representa más partes. Con numeradores iguales, importa el tamaño de cada parte.", example: "3/8 > 2/8. En cambio, 1/3 > 1/4 porque un tercio es más grande que un cuarto." },
    { title: "Usar equivalencias", explanation: "Multiplicar numerador y denominador por el mismo número conserva la cantidad representada y ayuda a comparar.", example: "2/3 = 4/6. Para comparar 2/3 con 3/6, compara 4/6 con 3/6." },
  ],
  "G05-MAT": [
    { title: "Encontrar un denominador común", explanation: "Antes de sumar o restar fracciones, representa ambas con partes del mismo tamaño. Un múltiplo común de los denominadores sirve para hacerlo.", example: "1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2." },
    { title: "Resolver un problema", explanation: "Identifica la cantidad inicial, la parte usada y lo que falta. Escribe la operación y comprueba que la respuesta tenga sentido en el contexto.", example: "Se usa 1/4 de una cinta y luego 1/2. En total se usa 1/4 + 2/4 = 3/4; queda 1/4." },
  ],
  "G06-MAT": [
    { title: "Comparar racionales", explanation: "Ubica enteros, fracciones y decimales en una misma recta. El número situado más a la derecha siempre es mayor.", example: "−1 < −1/2 < 0 < 1/4. Aunque 1 es mayor que 1/2, entre negativos ocurre lo contrario: −1 es menor que −1/2." },
    { title: "Resolver cambios", explanation: "Un aumento se representa con suma y una disminución con resta. Interpreta el signo del resultado antes de responder.", example: "La temperatura pasa de −2 °C a 3 °C: aumentó 5 °C, porque 3 − (−2) = 5." },
  ],
  "G07-MAT": [
    { title: "Usar proporciones", explanation: "Dos razones son proporcionales cuando conservan la misma relación multiplicativa. Puedes usar una tabla para comprobarlo.", example: "Si 2 cuadernos cuestan 6 unidades, 4 cuestan 12 si el precio por cuaderno permanece igual." },
    { title: "Interpretar porcentajes", explanation: "Un descuento porcentual se calcula sobre el valor original. Después se resta el descuento para obtener el precio final.", example: "El 15 % de 80 es 12. Con ese descuento, el precio final es 80 − 12 = 68." },
  ],
  "G08-MAT": [
    { title: "Reconocer una relación lineal", explanation: "Cuando una cantidad aumenta siempre en la misma medida por cada unidad adicional de otra, puede representarse mediante una regla lineal.", example: "Si cada entrada cuesta 4 y hay un cargo fijo de 2, el total es y = 4x + 2, donde x es el número de entradas." },
    { title: "Leer una tabla", explanation: "Compara cuánto cambia la salida cuando la entrada aumenta una unidad. Después prueba la regla con otro valor.", example: "En y = 4x + 2, para x = 0, 1 y 2 se obtiene y = 2, 6 y 10; cada paso aumenta 4." },
  ],
  "G09-MAT": [
    { title: "Encontrar raíces", explanation: "Las raíces de una función cuadrática son los valores de x para los que y vale cero. A veces se encuentran factorizando.", example: "x² − 5x + 6 = (x − 2)(x − 3); las raíces son 2 y 3." },
    { title: "Interpretar la parábola", explanation: "La gráfica de una función cuadrática es una parábola. Su vértice indica un valor máximo o mínimo según su orientación.", example: "Para y = (x − 2)² + 1, el valor mínimo es 1 y ocurre cuando x = 2." },
  ],
  "G10-MAT": [
    { title: "Relacionar triángulo y círculo", explanation: "En el círculo unitario, coseno es la coordenada horizontal y seno la vertical. Una vuelta completa equivale a 360° o 2π radianes; por ello ambas funciones repiten sus valores cada vuelta.", example: "A 0° el punto es (1, 0); a 90° es (0, 1). Por eso cos(0°) = 1 y sen(90°) = 1." },
    { title: "Modelar un fenómeno periódico", explanation: "Para describir una repetición con y = C + A·sen(2πt/T), identifica el valor central C, la amplitud |A| y el período T. Comprueba después que la regla concuerde con datos observados; una tabla de máximos y mínimos por sí sola no determina la fase.", example: "Si una altura oscila entre 2 m y 6 m y comienza en 4 m subiendo, con ciclo de 10 s, un modelo posible es h(t) = 4 + 2·sen(2πt/10). Tiene centro 4 m, amplitud 2 m y período 10 s." },
  ],
  "G11-MAT": [
    { title: "Distinguir eventos", explanation: "Un evento describe un conjunto de resultados posibles. Para calcular su probabilidad, cuenta los favorables y el total bajo el mismo experimento.", example: "En un dado justo, obtener un número par tiene tres resultados favorables: 2, 4 y 6. La probabilidad es 3/6 = 1/2." },
    { title: "Leer variación", explanation: "Una tasa de cambio compara cuánto cambia una cantidad respecto de otra. Su interpretación depende de las unidades y del intervalo.", example: "Si una distancia pasa de 4 km a 10 km en 2 h, el cambio promedio es (10 − 4)/2 = 3 km por hora." },
  ],
  "G01-ESP": [
    { title: "Formar sílabas", explanation: "Al unir una consonante y una vocal se puede formar una sílaba. Escucharla y decirla en voz alta ayuda a reconocerla al leer.", example: "La palabra «mesa» puede separarse en «me» y «sa». Al unirlas, se lee «mesa»." },
    { title: "Leer y escribir palabras", explanation: "Relaciona el sonido inicial, las sílabas y la palabra completa. Después escribe una oración corta con esa palabra.", example: "«Sol» comienza con /s/. Una oración posible es: «El sol ilumina el patio»." },
  ],
  "G02-ESP": [
    { title: "Reconocer personajes y lugares", explanation: "Al leer un relato, identifica quién participa, dónde ocurre y qué cambia entre el inicio y el final.", example: "En «Ana sembró una semilla en el jardín», Ana es el personaje y el jardín es el lugar." },
    { title: "Contar con orden", explanation: "Usa «primero», «después» y «al final» para volver a contar una historia sin alterar sus hechos principales.", example: "Primero Ana sembró; después regó; al final vio un brote. El orden permite entender qué pasó." },
  ],
  "G03-ESP": [
    { title: "Leer para encontrar datos", explanation: "En un texto informativo, busca nombres, características y relaciones que el texto presenta de manera explícita.", example: "Si el texto dice «las abejas transportan polen», esa es una información que puedes localizar directamente." },
    { title: "Comparar tipos de texto", explanation: "Un cuento puede inventar personajes y sucesos; un texto informativo busca explicar un tema. La intención del autor ayuda a reconocerlos.", example: "«Una abeja habló con el sol» pertenece a una narración ficticia; «las abejas visitan flores» puede formar parte de una explicación." },
  ],
  "G04-ESP": [
    { title: "Diferenciar idea y detalle", explanation: "La idea principal responde de qué trata el párrafo. Los detalles agregan razones, ejemplos o descripciones.", example: "«Cuidar el agua es importante» puede ser la idea principal; «cerrar el grifo evita desperdicio» es un detalle que la apoya." },
    { title: "Resumir con tus palabras", explanation: "Al resumir, conserva la idea central y los datos necesarios sin copiar todas las frases. Revisa si el resumen mantiene el sentido.", example: "De un párrafo sobre sombra, refugio y aire limpio, puedes resumir: «Los árboles benefician al ambiente de varias maneras»." },
  ],
  "G05-ESP": [
    { title: "Planear el texto", explanation: "Antes de escribir, define el público, el propósito y la pregunta central. Consulta una fuente pertinente y organiza las ideas en inicio, desarrollo y cierre. Anota qué dato respalda cada idea.", example: "Para informar a otros estudiantes sobre la lluvia: inicio, qué es; desarrollo, cómo se forma según una fuente consultada; cierre, por qué importa para los seres vivos." },
    { title: "Redactar y revisar", explanation: "Escribe un párrafo por idea y distingue los datos de tus opiniones. Comprueba si el título corresponde al contenido, si las ideas avanzan con orden y si la ortografía y puntuación facilitan la lectura.", example: "Borrador: «La lluvia cae de las nubes». Revisión: explica cómo ocurre, indica de dónde obtuviste el dato y evita repetir la misma frase en dos párrafos." },
  ],
  "G06-ESP": [
    { title: "Reconocer la estructura", explanation: "El propósito de un texto orienta su organización: una receta usa pasos, un relato presenta hechos y un informe reúne información.", example: "Una receta puede listar ingredientes y pasos; un cuento puede presentar inicio, conflicto y desenlace." },
    { title: "Elegir el lenguaje", explanation: "Quien escribe adapta sus palabras al lector y al propósito. Una instrucción debe ser clara y ordenada; una narración puede incluir descripciones.", example: "«Mezcla la harina con agua» es una instrucción directa. «La harina cayó como nieve» es una descripción narrativa." },
  ],
  "G07-ESP": [
    { title: "Separar postura y razón", explanation: "La postura dice qué se propone o defiende. La razón explica por qué. Una afirmación sin razón todavía no constituye un argumento desarrollado.", example: "Postura: «Conviene caminar al colegio». Razón: «El trayecto permite actividad física cuando es seguro hacerlo»." },
    { title: "Evaluar una evidencia", explanation: "Una evidencia debe relacionarse con la razón y poder comprobarse. Una opinión repetida no reemplaza un dato pertinente.", example: "Para hablar del uso de una biblioteca, contar préstamos reales aporta más que decir «todos la usan» sin prueba." },
  ],
  "G08-ESP": [
    { title: "Distinguir sentido literal", explanation: "Una expresión literal describe directamente un hecho. Una expresión figurada crea una imagen para sugerir otra idea.", example: "«La lámpara iluminó el cuarto» es literal; «su idea iluminó el problema» usa «iluminó» en sentido figurado." },
    { title: "Interpretar en contexto", explanation: "Para explicar una metáfora, lee las frases cercanas y pregunta qué comparación ayuda a comunicar el autor.", example: "En «sus palabras fueron un faro en la confusión», «faro» sugiere orientación y no un objeto instalado en el mar." },
  ],
  "G09-ESP": [
    { title: "Comparar afirmaciones", explanation: "Dos fuentes pueden hablar del mismo asunto desde perspectivas distintas. Anota lo que afirma cada una antes de sacar una conclusión.", example: "Una fuente informa la hora de apertura de un parque; otra informa la de cierre. Juntas permiten describir el horario indicado." },
    { title: "Justificar inferencias", explanation: "Una inferencia usa pistas del texto para concluir algo que no se dice de forma directa. Explica qué frases sostienen la conclusión.", example: "Si un aviso dice «cerrado por lluvia» y otro «reabrimos mañana», se puede inferir que hoy no atenderán; cita ambas pistas." },
  ],
  "G10-ESP": [
    { title: "Distinguir razón y evidencia", explanation: "La razón explica por qué se defiende una tesis. La evidencia ofrece datos, ejemplos verificables o testimonios pertinentes que apoyan esa razón.", example: "Tesis: abrir la biblioteca el sábado. Razón: mejora el acceso. Evidencia posible: registro de estudiantes que no pueden asistir entre semana." },
    { title: "Evaluar la solidez", explanation: "Pregunta si la evidencia es suficiente, actual y pertinente. Considera una objeción razonable antes de aceptar una conclusión.", example: "Una sola opinión favorable no demuestra que toda la comunidad necesita el nuevo horario; una encuesta bien descrita aportaría más información." },
  ],
  "G11-ESP": [
    { title: "Planear un argumento", explanation: "Formula una tesis precisa, reúne razones diferentes y busca evidencia para cada una. Ordena los párrafos para que la conclusión se derive de ellos.", example: "Tesis: ampliar préstamos de libros. Razón 1: más tiempo para leer; razón 2: mayor acceso. Cada razón necesita datos o ejemplos pertinentes." },
    { title: "Revisar y contraargumentar", explanation: "Reconoce una objeción plausible, respóndela sin deformarla y revisa que citas, conectores y conclusiones mantengan coherencia.", example: "Objeción: más días de préstamo podrían reducir la disponibilidad. Respuesta: probar una ampliación limitada y medir la rotación de libros." },
  ],
  "G10-FIS": [
    { title: "Interpretar la fuerza neta", explanation: "La fuerza neta es la suma vectorial de las fuerzas. Si dos fuerzas actúan en sentidos opuestos sobre una misma línea, se restan sus magnitudes.", example: "Una fuerza de 8 N hacia la derecha y otra de 3 N hacia la izquierda producen 5 N netos hacia la derecha." },
    { title: "Aplicar las leyes de Newton", explanation: "Con masa constante, la aceleración sigue la dirección de la fuerza neta. Una fuerza neta cero no implica necesariamente que el objeto esté detenido.", example: "Un carrito que se mueve en línea recta a velocidad constante puede tener fuerza neta cero; para acelerar necesita una fuerza neta distinta de cero." },
  ],
  "G11-FIS": [
    { title: "Relacionar corriente y resistencia", explanation: "En un resistor ideal con condiciones constantes, mayor resistencia implica menor corriente si el voltaje se mantiene igual.", example: "Con 12 V y 3 Ω, la corriente es 4 A; con 6 Ω y el mismo voltaje, es 2 A." },
    { title: "Describir una onda", explanation: "La frecuencia indica cuántos ciclos ocurren por segundo y el período cuánto dura uno. Son magnitudes inversas.", example: "Si una onda completa 5 ciclos cada segundo, su frecuencia es 5 Hz y su período es 1/5 s = 0,2 s." },
  ],
  "G10-QUI": [
    { title: "Contar átomos", explanation: "Antes de balancear una reacción, cuenta por separado los átomos de cada elemento en reactivos y productos. Un subíndice pertenece a la fórmula y un coeficiente multiplica toda la sustancia.", example: "En 2 H₂O hay 4 átomos de hidrógeno y 2 de oxígeno; el 2 inicial multiplica toda la molécula." },
    { title: "Verificar conservación", explanation: "Ajusta coeficientes hasta que cada elemento tenga el mismo número de átomos a ambos lados. Después comprueba el resultado sin cambiar subíndices.", example: "Para CH₄ + 2 O₂ → CO₂ + 2 H₂O: C = 1, H = 4 y O = 4 en ambos lados." },
  ],
  "G11-QUI": [
    { title: "Reconocer grupos funcionales", explanation: "Un grupo funcional es un conjunto de átomos que permite clasificar algunos compuestos orgánicos. Observa toda la estructura antes de nombrar la familia.", example: "CH₃CH₂OH contiene −OH unido a carbono y se reconoce como un alcohol; CH₃COOH contiene −COOH y es un ácido carboxílico." },
    { title: "Relacionar estructura y uso", explanation: "Compuestos con la misma fórmula molecular pueden tener distinta disposición de átomos. La estructura ayuda a explicar propiedades y usos diferentes.", example: "Antes de comparar dos sustancias orgánicas, dibuja sus enlaces y localiza sus grupos funcionales; una fórmula molecular sola puede ser insuficiente." },
  ],
};
