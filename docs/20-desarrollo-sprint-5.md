# Sprint 5 — cierre de práctica y comparación de intentos

**Fecha de implementación:** 15 de octubre de 2026. La entrega al profesor es el 20 de octubre. El alcance ejecutado es un **prototipo local para cuentas de adultos/evaluadores con datos sintéticos**.

**Estado Jira:** Sprint 5 adelantado y cerrado el 15 de octubre con **4/4 incidencias principales en Listo**: AP-201 (historia de resumen), AP-202/AP-205 (tareas técnicas) y AP-319 (comparación local de demostración). Las subtareas AP-203/AP-204/AP-206/AP-207 quedaron en Listo con sus cuatro actividades marcadas y evidencia. Las otras 21 incidencias principales fueron devueltas al backlog; AP-236 conserva el bloqueo de consentimiento y cuenta estudiantil.

## Alcance verificable

- Una práctica termina automáticamente tras dos respuestas o por **Terminar práctica ahora** con cero o una respuesta. El servidor guarda el cierre y rechaza respuestas posteriores. Repetir la operación de cierre conserva la misma fecha y el mismo resultado.
- El resumen muestra aciertos sobre preguntas **respondidas** y cuántas de las dos faltaron. Con cero respuestas indica que no hay resultado calculable y no marca el tema como completado.
- El historial muestra grado, materia, tema, fecha, respuestas y aciertos. El panel permite comparar las dos últimas sesiones terminadas **con respuestas** del mismo tema, con fechas y cambio en puntos porcentuales. Con cero o una sesión comparable aparece «Aún no hay sesiones suficientes para comparar tu progreso». El porcentaje es orientativo, no una medida validada de dominio.
- La consulta procede de `/api/practice/sessions`, restringida en el servidor a la cuenta de la cookie. No hay propietario enviado por el cliente. El cálculo agrupa por tema y excluye cierres sin respuesta.

## Evidencia y límites

Código: `web/src/lib/auth.ts`, `web/src/lib/practice-history.ts`, `web/src/app/api/practice/finish/route.ts`, `web/src/app/practice-session.tsx` y `web/src/app/account-panel.tsx`. Pruebas: `web/tests/practice.test.mjs` cubre cierre vacío, idempotencia, respuesta tardía, aislamiento entre cuentas y comparación del mismo tema; `web/tests/browser-smoke.mjs` recorre cierre vacío, historial, reingreso y comparación. Resultado local: **28/28 pruebas**, lint, build y Chrome con cuentas de prueba correctos.

Las rondas repetidas muestran las **mismas dos preguntas** del banco provisional. Evitar repetición inmediata y adaptar dificultad requiere ampliar el banco y fijar las preguntas seleccionadas en cada sesión antes de cambiarlo. El historial consulta hasta 200 sesiones recientes por cuenta. La comparación solo sirve para la demostración: [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) y sus tareas de estudiantes reales continúan dependiendo del consentimiento [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304), registro [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) e inicio de sesión [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267). La revisión docente [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316) permanece pendiente.

## Para presentar

Desde `web/`, ejecuta `npm.cmd run dev` y abre <http://localhost:3000>. Entra con tu cuenta adulta de prueba, elige un tema, termina una práctica sin responder para mostrar el caso límite, y completa dos rondas del mismo tema para mostrar la comparación. Indica que el contenido y la comparación son provisionales.
