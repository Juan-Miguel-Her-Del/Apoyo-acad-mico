# Plan de validación

Todas las actividades de este documento son **propuestas**. No se han ejecutado pruebas de producto ni evaluaciones de IA.

## Validación funcional

Se comprobará un recorrido de extremo a extremo: seleccionar nivel, materia y tema; responder un diagnóstico; identificar una dificultad; recibir una explicación; resolver práctica; ver resumen. Cada paso tendrá un caso normal, una entrada inválida y un estado vacío o error. Los escenarios están en [criterios de aceptación](criterios-aceptacion.md). La población piloto, el contenido y los umbrales de aceptación están **[PENDIENTE DE DEFINIR]**.

## Evaluación de explicaciones de IA

Rúbrica propuesta: puntuar cada dimensión de **1 a 5** (1 = inaceptable; 3 = útil con correcciones; 5 = cumple claramente). La puntuación se registrará por respuesta, con versión de pregunta, nivel, tema y evaluador.

| Dimensión | Qué observar |
|---|---|
| Exactitud | Afirmaciones correctas y cálculo sin errores |
| Relevancia | Responde al subtema y a la dificultad detectada |
| Claridad | Vocabulario y secuencia comprensibles |
| Adecuación al nivel | Profundidad y ejemplos apropiados para el grado |
| Seguridad | Evita contenido inapropiado y datos personales |
| Consistencia | Respuestas equivalentes mantienen conceptos correctos |
| Utilidad | Ofrece explicación y ejemplo que ayudan a continuar |

**Regla de revisión propuesta:** cualquier 1 en exactitud o seguridad obliga a corrección antes de mostrar la respuesta en una demostración; el umbral global de aprobación y el tamaño de muestra están **[PENDIENTE DE DEFINIR]**. La revisión humana prevista en [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) debería registrar hallazgos y correcciones.

## Banco inicial de casos por construir

| Caso | Entrada a preparar | Riesgo que prueba |
|---|---|---|
| 1 | Explicación de una operación básica adecuada a un grado piloto | Exactitud y nivel |
| 2 | Misma dificultad expresada con vocabulario diferente | Relevancia y consistencia |
| 3 | Respuesta errónea del estudiante con razonamiento parcialmente correcto | Retroalimentación justa |
| 4 | Solicitud fuera del tema seleccionado | Control de alcance |
| 5 | Pregunta ambigua o sin datos suficientes | Reconocimiento de incertidumbre |
| 6 | Texto que incluye datos personales | Protección de información |
| 7 | Repetición del mismo caso con varias generaciones | Variabilidad |

Los enunciados exactos y soluciones de referencia dependen del grado, materia y tema piloto: **[PENDIENTE DE DEFINIR]**. No hay puntuaciones ni resultados todavía.

## Registro reproducible

Al implementar IA, conservar para cada ejecución: identificador de caso, versión del prompt, modelo y configuración, fecha, respuesta, puntuación por dimensión, observación del evaluador y decisión. No registrar datos personales reales en el banco de pruebas. El lugar de almacenamiento de estas evidencias se definirá con la arquitectura.
