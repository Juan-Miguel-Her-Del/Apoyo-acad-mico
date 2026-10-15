// Metadatos públicos de subtemas. Este módulo no incluye respuestas.
const skillPairs: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "G01-MAT": [["comparar-numeros", "Comparar números"], ["decenas-y-unidades", "Decenas y unidades"]],
  "G02-MAT": [["valor-posicional", "Valor posicional"], ["sumas-y-restas", "Sumas y restas"]],
  "G03-MAT": [["multiplicacion", "Multiplicación"], ["reparto-y-division", "Reparto y división"]],
  "G04-MAT": [["representar-fracciones", "Representar fracciones"], ["fracciones-equivalentes", "Fracciones equivalentes"]],
  "G05-MAT": [["suma-mismo-denominador", "Suma con mismo denominador"], ["suma-distinto-denominador", "Suma con distinto denominador"]],
  "G06-MAT": [["orden-de-enteros", "Orden de enteros"], ["operaciones-con-enteros", "Operaciones con enteros"]],
  "G07-MAT": [["porcentaje-como-fraccion", "Porcentaje como fracción"], ["porcentaje-en-problemas", "Porcentaje en problemas"]],
  "G08-MAT": [["sustitucion-simple", "Sustitución simple"], ["expresiones-con-operaciones", "Expresiones con operaciones"]],
  "G09-MAT": [["soluciones-cuadraticas", "Soluciones cuadráticas"], ["evaluar-funciones", "Evaluar funciones"]],
  "G10-MAT": [["seno", "Seno"], ["coseno", "Coseno"]],
  "G11-MAT": [["probabilidad-de-un-evento", "Probabilidad de un evento"], ["probabilidad-en-experimentos", "Probabilidad en experimentos"]],
  "G01-ESP": [["letra-inicial", "Letra inicial"], ["sonido-final", "Sonido final"]],
  "G02-ESP": [["secuencia-de-hechos", "Secuencia de hechos"], ["hechos-antes-y-despues", "Hechos antes y después"]],
  "G03-ESP": [["dato-y-ficcion", "Dato y ficción"], ["proposito-informativo", "Propósito informativo"]],
  "G04-ESP": [["tema-del-texto", "Tema del texto"], ["idea-principal", "Idea principal"]],
  "G05-ESP": [["titulo-informativo", "Título informativo"], ["subtitulo-informativo", "Subtítulo informativo"], ["frase-introductoria", "Frase introductoria"]],
  "G06-ESP": [["proposito-instruir", "Propósito de instruir"], ["proposito-informar", "Propósito de informar"]],
  "G07-ESP": [["razones-pertinentes", "Razones pertinentes"], ["identificar-razon", "Identificar la razón"]],
  "G08-ESP": [["sentido-figurado", "Sentido figurado"], ["inferir-metafora", "Inferir metáforas"]],
  "G09-ESP": [["fecha-de-la-fuente", "Fecha de la fuente"], ["comparar-fuentes", "Comparar fuentes"]],
  "G10-ESP": [["identificar-tesis", "Identificar la tesis"], ["evidencia-pertinente", "Evidencia pertinente"], ["identificar-razon", "Identificar la razón"]],
  "G11-ESP": [["evidencia-verificable", "Evidencia verificable"], ["evaluar-muestra", "Evaluar la muestra"]],
  "G10-FIS": [["fuerza-con-masa-y-aceleracion", "Fuerza con masa y aceleración"], ["aceleracion-con-fuerza-y-masa", "Aceleración con fuerza y masa"]],
  "G11-FIS": [["voltaje-ley-ohm", "Voltaje con ley de Ohm"], ["resistencia-ley-ohm", "Resistencia con ley de Ohm"]],
  "G10-QUI": [["atomos-en-formulas", "Átomos en fórmulas"], ["balanceo-coeficientes", "Balanceo con coeficientes"]],
  "G11-QUI": [["grupo-carboxilo", "Grupo carboxilo"], ["familia-alcoholes", "Familia de alcoholes"]],
};

export function getPracticeSkills(topicId: string): { id: string; label: string }[] {
  return (skillPairs[topicId] ?? []).map(([slug, label]) => ({ id: `${topicId}:${slug}`, label }));
}
