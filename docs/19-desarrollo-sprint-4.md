# Sprint 4 — práctica con seguimiento

**Inicio y cierre:** 15 de octubre de 2026, antes de la entrega académica del 20 de octubre. Jira [AP Sprint 4](https://juanmiguelsworkspace-40060689.atlassian.net/jira/software/projects/AP/boards/3) cerró con **6/6 incidencias principales en Listo**: AP-173, AP-174 y AP-177 para seleccionar y mostrar ejercicios del tema; AP-180, AP-181 y AP-184 para capturar, evaluar y registrar respuestas.

## Alcance de demostración

- Una sesión de dos preguntas provisionales vinculadas al tema elegido, disponible para las 26 combinaciones de grado y materia.
- Cuenta local de adulto/evaluador necesaria para conservar intentos. Las explicaciones y la prueba rápida pueden verse sin cuenta.
- Evaluación en el servidor y persistencia por sesión y cuenta: selección, acierto, avance y resultado final. El historial presenta las prácticas completas y las pendientes.
- Respuesta inválida, pregunta ajena, sesión terminada o sesión de otra cuenta: error sin cambiar un resultado guardado.
- Recarga de la página: recuperar la sesión abierta del tema en el mismo navegador, si la cuenta sigue activa.

El contenido continúa **provisional** y sus banderas de publicación siguen apagadas. Una puntuación de la demo no es una calificación académica validada. El registro de menores reales depende de [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257), que siguen abiertos.

## Replanificación

Se movieron al backlog AP-138/139/142 y AP-145/146/149 (adaptación e IA/validación de ejemplos), AP-152/153/156, AP-159/160/163 y AP-166/167/170 (trabajo posterior al MVP), y AP-267/268/271/274 (cuentas de estudiantes reales bloqueadas por consentimiento). El Sprint 3 ya entregó ejemplos específicos por grado y cuentas **locales de adultos**, sin satisfacer esas historias publicables.

## Verificación

- [x] Probar los 26 bancos, pertenencia al tema y caso sin preguntas suficientes.
- [x] Probar sesión, respuestas válidas e inválidas, duplicados, cierre y aislamiento entre cuentas.
- [x] Completar en Chrome el recorrido diagnóstico → explicación → práctica → historial y reingreso.
- [x] Ejecutar `npm.cmd test`, `npm.cmd run lint` y `npm.cmd run build`.
- [x] Actualizar criterios y casillas de Jira con evidencia; cerrar solo incidencias satisfechas.

**Evidencia:** `web/src/lib/practice.ts` entrega dos preguntas del tema, sin clave de respuesta pública; si falta la segunda, no mezcla una pregunta de otro tema. `web/src/lib/auth.ts` guarda sesiones y respuestas en SQLite y completa el progreso en la misma transacción de la segunda respuesta. `web/src/app/practice-session.tsx` muestra avance, retroalimentación y reanudación del último intento de ese tema en el mismo navegador. `web/src/app/account-panel.tsx` lista historial por cuenta. `web/tests/practice.test.mjs` verifica 26 bancos, reinicio del almacén, aislamiento, opción inválida, duplicado y sesión cerrada. El recorrido de `web/tests/browser-smoke.mjs` comprobó el flujo completo, error HTTP 400 para opción inválida, 409 tras cerrar sesión de práctica, rechazo de progreso falsificado y 404 para otra cuenta. Resultado: **26/26 pruebas**, lint y build correctos; Chrome completo.

El primer ejercicio de la sesión coincide con la prueba rápida opcional del mismo tema. Para mostrar un recorrido sin anticipar esa respuesta, la prueba rápida está plegada y la sesión con seguimiento aparece primero. Las preguntas y los resultados siguen siendo solo material provisional; la verificación de identidad de menores y la auditoría curricular no forman parte de esta entrega.

Jira confirma **6/6 incidencias principales en Listo**, además de las ocho subtareas con sus actividades marcadas. Las otras 19 incidencias que estaban inicialmente en el sprint se replanificaron al backlog con sus dependencias intactas.
