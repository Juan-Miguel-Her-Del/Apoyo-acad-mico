# Sprint 5 — práctica y progreso con alcance original

**Avance técnico:** 15 de octubre de 2026. El alcance original de 24 incidencias se conserva en Jira. La práctica y el seguimiento funcionan en el prototipo local con cuentas de adultos/evaluadores y datos sintéticos; la publicación para estudiantes requiere las revisiones indicadas abajo.

**Estado Jira corregido:** el sprint de demostración id 9 se cerró anticipadamente el 15 de octubre con AP-201, AP-202, AP-205 y AP-319 en Listo. Esa reducción fue una decisión equivocada. Jira no permite reabrir el sprint cerrado, así que se creó **AP Sprint 5 — alcance original (id 39)** con las fechas iniciales **27 de octubre–2 de noviembre de 2026** y las **24 incidencias originales**. Tras verificar las nuevas funciones, **19 están Listo y 5 En curso**: AP-187, AP-191, AP-236, AP-237 y AP-240. AP-319 se conserva solo en el historial del id 9. AP-236 conserva la dependencia de consentimiento y cuenta estudiantil.

## Alcance verificable

- Una práctica termina automáticamente tras dos respuestas o por **Terminar práctica ahora** con cero o una respuesta. El servidor guarda el cierre y rechaza respuestas posteriores. Repetir la operación de cierre conserva la misma fecha y el mismo resultado.
- El resumen muestra aciertos sobre preguntas **respondidas** y cuántas de las dos faltaron. Con cero respuestas indica que no hay resultado calculable y no marca el tema como completado.
- El historial muestra grado, materia, tema, fecha, respuestas y aciertos. El panel permite comparar las dos últimas sesiones terminadas **con respuestas** del mismo tema, con fechas y cambio en puntos porcentuales. Con cero o una sesión comparable aparece «Aún no hay sesiones suficientes para comparar tu progreso». El porcentaje es orientativo, no una medida validada de dominio.
- La consulta procede de `/api/practice/sessions`, restringida en el servidor a la cuenta de la cookie. No hay propietario enviado por el cliente. El cálculo agrupa por tema y excluye cierres sin respuesta.

## Evidencia y límites

Código: `web/src/lib/auth.ts`, `web/src/lib/practice-history.ts`, `web/src/app/api/practice/finish/route.ts`, `web/src/app/practice-session.tsx` y `web/src/app/account-panel.tsx`. Pruebas: `web/tests/practice.test.mjs` cubre cierre vacío, idempotencia, respuesta tardía, aislamiento entre cuentas y comparación del mismo tema; `web/tests/browser-smoke.mjs` recorre cierre vacío, historial, reingreso y comparación. La suite integrada actual pasa **45/45 pruebas**, lint, build y Chrome con cuentas de prueba.

La comparación de cuentas adultas solo sirve para la demostración: [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) y sus tareas de estudiantes reales continúan dependiendo del consentimiento [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304), registro [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) e inicio de sesión [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267). La revisión docente [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316) permanece pendiente.

## Avance del alcance original

| Historia | Implementación verificable | Estado y límite |
| --- | --- | --- |
| AP-187, corrección explicada | Respuesta y opción de referencia; estado `pending-review` sin justificación no aprobada. Contrato de explicación revisada en [21-retroalimentacion-practica.md](21-retroalimentacion-practica.md). | Explicaciones de preguntas reales aprobadas y caso integrado verificado. |
| AP-194, dificultad gradual | Dos niveles; una ronda de 2/2 aciertos lleva al nivel 2; el máximo no se supera. | Listo: regla funcional de demostración probada. |
| AP-208, nuevas rondas | Sesión nueva con snapshot propio; no reabre resumen anterior ni repite preguntas de la ronda inmediata; agotamiento con HTTP 409. | Listo: caso principal y límite probados. |
| AP-215, variedad del banco | 6 preguntas provisionales por cada uno de 26 temas: 4 de nivel 1 y 2 de nivel 2. `cd web; npm.cmd run coverage:practice` informa cobertura y falla si un tema es insuficiente. | Listo para el mínimo explícito de dos rondas distintas; la revisión curricular del contenido sigue en AP-314/AP-316. |
| AP-222, dominio por subtema | Dos subtemas por tema; agregados por cuenta sobre todas las prácticas completas, indeterminado sin dos prácticas y dos respuestas del subtema. | Listo como estimación orientativa; no es validación académica. |
| AP-229, gráfica | Barras accesibles con fecha, aciertos y porcentaje de hasta 200 intentos; una sola medición no muestra tendencia. | Listo: cálculo, acceso textual y Chrome probados. |
| AP-236, progreso estudiantil | Contrato interno de cuenta, autorización, sesión y comparación persistente con pruebas sintéticas en [22-cuentas-estudiantes-consentimiento.md](22-cuentas-estudiantes-consentimiento.md). | Documento formal, verificador del representante, integración de sesiones reales de estudiantes y rutas protegidas; sigue abierta. |

El banco actual es `demo-2026-10-v2`, con preguntas **provisionales**. Las preguntas de cada sesión se guardan como snapshot para conservar el intento aunque cambie el banco. Las sesiones previas de dos preguntas se migran sin revelar sus explicaciones provisionales. El historial visual muestra los 200 intentos más recientes; el cálculo de subtemas usa todos los intentos guardados de la cuenta. No es una medida académica validada.

### Casos de verificación

| Entrada | Resultado esperado y observado en pruebas |
| --- | --- |
| Primera ronda de 2/2 aciertos en un tema | La siguiente ronda contiene dos preguntas nuevas del nivel 2; no cambia la sesión anterior. |
| Primera ronda con un error | La siguiente usa otras dos preguntas de nivel 1. |
| Acertar otra ronda en el nivel máximo y solicitar otra sin ítems nuevos | HTTP 409 con límite de banco; no se crea sesión ni se supera el nivel 2. |
| Volver a pedir una ronda sin preguntas válidas | HTTP 409; la sesión previa continúa cerrada y conserva su resumen. |
| Banco menor de 4 preguntas de nivel 1 o 2 de nivel 2 | El reporte marca cobertura insuficiente; la prueba del umbral falla. |
| Un subtema con una sola respuesta de una práctica | Estado indeterminado. Tras dos prácticas completas y dos respuestas del subtema, se calcula el porcentaje observado; menos de 50 % = inicial, 50–79 % = en progreso, 80 % o más = alto. |
| Una sola medición en la gráfica | Se muestra el valor con fecha y texto alternativo, sin tendencia; los agregados usan todo el historial aunque la vista limite a 200 intentos. |

Pruebas del cambio integrado: `npm.cmd test` **45/45**, `npm.cmd run lint` y `npm.cmd run build` correctos; `npm.cmd run coverage:practice` muestra **26/26** temas con el mínimo definido para dos rondas. La prueba de Chrome con cuentas sintéticas pasó durante la integración. Código principal: `web/src/lib/practice.ts`, `web/src/lib/auth.ts`, `web/src/lib/progress-insights.ts`, `web/src/app/practice-session.tsx` y `web/src/app/account-progress-insights.tsx` (commit `2a528aa`).

## Para presentar

Desde `web/`, ejecuta `npm.cmd run dev` y abre <http://localhost:3000>. Entra con tu cuenta adulta de prueba, elige un tema, termina una práctica sin responder para mostrar el caso límite, y completa dos rondas del mismo tema para mostrar la comparación. Indica que el contenido y la comparación son provisionales.
