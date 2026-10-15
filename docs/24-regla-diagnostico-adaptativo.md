# Regla de dificultad del diagnóstico de demostración

Aplica a [AP-83](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-83), AP-84, AP-87 y AP-90. Implementación: `web/src/lib/diagnostic-adaptive.ts`; pruebas: `web/tests/diagnostic-adaptive.test.mjs`.

## Banco utilizado

`getAdaptiveDiagnosticBank(gradeId, subjectId, topicId)` valida la combinación y devuelve seis preguntas **provisionales** por tema: cuatro de nivel 1 y dos de nivel 2 en cada una de las 26 combinaciones actuales. Hoy las preguntas se derivan del banco provisional de práctica, con identificadores `diagnostic-*` propios. Por eso hay solapamiento de enunciados con estudio/práctica: una persona que los haya visto antes puede reconocerlos y el resultado **no mide de forma independiente ni precisa su nivel académico**. Los identificadores distintos permiten mantener separados los historiales técnicos, no convierten este banco en contenido revisado.

El banco contiene respuestas correctas únicamente en el servidor. La respuesta pública de un intento debe omitir `correctOptionId`. El banco anterior de `diagnostic.ts` tiene dos preguntas iniciales por tema; no se mezcla con esta secuencia porque todavía no tiene niveles suficientes para evaluar la subida y la bajada. Ninguna pregunta es contenido académico aprobado; AP-314 conserva la revisión curricular previa a la publicación.

## Selección determinista

1. La primera pregunta solicita nivel 1. Si el nivel inicial se especifica en código, solo acepta 1 o 2.
2. Después de un acierto, solicita un nivel más alto; después de un error, uno más bajo. El valor siempre queda entre 1 y 2, tomando como base el nivel **real** de la pregunta respondida.
3. Selecciona la primera pregunta cuyo identificador no se haya respondido y cuyo nivel sea el solicitado. El orden estable del banco resuelve empates.
4. Si no queda ninguna de ese nivel, selecciona la primera pregunta nueva del otro nivel e informa `fallback: true`, junto con los niveles solicitado y elegido.
5. Si no queda ninguna pregunta nueva, devuelve `{status: "exhausted", reason: "bank-exhausted"}`. No inventa una pregunta ni repite una ya respondida.
6. Un banco con identificadores duplicados, niveles inválidos o una clave inexistente, o un historial con respuesta duplicada o de pregunta ajena, produce error de integridad. El flujo que llama a esta función debe convertirlo en un error controlado, sin generar resultado académico.

El controlador de intentos fija un máximo de cuatro preguntas por intento para que la demostración tenga duración estable. Este límite de producto es distinto del agotamiento físico de seis preguntas del banco.

## Verificación local

Desde `web/`: `node --experimental-strip-types --test tests/diagnostic-adaptive.test.mjs`.

| Entrada | Esperado | Observado |
| --- | --- | --- |
| Nivel 1, acierto | Próxima pregunta de nivel 2 | Nivel 2, sin fallback |
| Nivel 2, error | Próxima pregunta de nivel 1 | Nivel 1, sin fallback |
| Acierto en 2 / error en 1 | Mantenerse entre 1 y 2 | Límites respetados |
| Nivel solicitado agotado | Otra pregunta nueva y `fallback: true` | Sin repetición |
| Todas las preguntas usadas | `bank-exhausted` | Sin pregunta ni puntuación inventada |
| Identificador duplicado o ajeno | Error de integridad | Rechazado |

Prueba local del módulo: **4/4 casos aprobados** y lint sin errores. La integración con persistencia, rutas HTTP e interfaz se verifica por separado antes de cerrar AP-83/AP-87 en Jira.
