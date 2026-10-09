# Desarrollo del Sprint 2

**Estado al 8 de octubre de 2026:** el Sprint 2 está activo en Jira (6–12 de octubre). Su objetivo es definir y verificar el consentimiento para menores y avanzar el diagnóstico, con una capacidad planificada de 20 horas por semana. Este incremento entrega un **diagnóstico de demostración** y un diseño de consentimiento para revisión. El sprint no está cerrado.

## Qué se puede probar

En `web/`, selecciona 5.º o 10.º, una materia y un tema piloto, y pulsa **Empezar a estudiar (demo)**. El aviso explica que no es una nota. Cada combinación tiene dos preguntas de prueba, avance, revisión de respuesta y un resumen temporal. Cambiar la selección reinicia el intento. La ruta `/api/diagnostic` valida grado, materia, tema, pregunta y opción en el servidor; el modo publicado responde HTTP 409 mientras falte aprobación curricular. Las preguntas de demostración no cambian `approvedForPublication`, `explanationApproved` ni `validatedQuestionCount`.

El resultado solo existe en la página. No hay cuenta, sesión de intento en el servidor ni progreso entre visitas. Una llamada POST directa repetida puede obtener la misma evaluación. Por eso el flujo actual **no cierra** [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52), [AP-56](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-56), [AP-76](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-76) ni [AP-80](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-80) como diagnóstico real. Los temas y preguntas siguen sin aprobación docente en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314). La dificultad adaptativa de AP-83 y sus tareas tampoco está implementada.

## Consentimiento

El [diseño para menores](10-consentimiento-menores-sprint-2.md) propone un flujo de autorización, datos mínimos, evidencia protegida, revocación, control del servidor y pruebas con identidades sintéticas para AP-304, AP-305, AP-308 y AP-311. Es una propuesta sin endpoints ni registro de cuentas. Falta aprobar el aviso, las finalidades, el método de verificar al representante y la conservación de datos con asesoría jurídica/privacidad colombiana. Ninguna historia de consentimiento se considera terminada ni habilita pruebas con menores reales.

## Verificación del incremento

Desde `web/`, ejecutar `npm.cmd test`, `npm.cmd run lint` y `npm.cmd run build`. Para el recorrido en Chrome, arrancar `npm.cmd run start -- -p 3100` y, en otra terminal, `npm.cmd run test:browser`. El 8 de octubre pasaron 10 pruebas automáticas, lint, build y el recorrido de Chrome, que cubrió HTTP 400/409, ausencia de soluciones en GET, dos preguntas con resumen, doble clic como un solo POST desde la interfaz, cambio de grado durante una carga y regresiones del selector.

## Siguientes pasos del sprint

1. Revisar las doce preguntas de demostración y reunir un banco piloto aprobado por tema en AP-314/AP-53 antes de habilitar el diagnóstico publicado.
2. Diseñar el intento de diagnóstico en el servidor, con respuestas únicas y resultado verificable; después integrar AP-52/AP-56/AP-76/AP-80.
3. Definir y aprobar con asesoría jurídica el aviso y método de verificación del representante antes de implementar AP-308/AP-311 o activar cuentas.
4. Reestimar el trabajo restante de las 24 incidencias del Sprint 2 frente a la capacidad declarada y replanificar lo que no quepa antes del cierre.
