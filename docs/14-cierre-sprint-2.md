# Cierre del Sprint 2 — Apoyo_academico

> **Nota posterior (15 de octubre de 2026):** esta acta conserva el cierre histórico de demostración. Las 24 incidencias principales del alcance original se restauraron en un sprint futuro separado, id 40. Consulta la [auditoría actual de sprints](23-auditoria-alcance-sprints.md) antes de usar los conteos de esta acta como estado vigente.

**Jira:** Sprint 2 cerrado el **8 de octubre de 2026, 19:25 (Bogotá)**, antes de la fecha planificada del 12 de octubre, por solicitud del titular del proyecto. El alcance aceptado para el cierre es **demostración funcional con pendientes explícitos**, sin declarar listo el diagnóstico publicado ni el tratamiento de datos de menores. [Tablero AP](https://juanmiguelsworkspace-40060689.atlassian.net/jira/software/projects/AP/boards/3).

## Resultado verificable

| Grupo | Incidencias principales | Estado al cierre |
| --- | --- | --- |
| Banco de preguntas **demo** | AP-53 | Listo como especificación de prueba; el banco curricular aprobado sigue en AP-314. |
| Aviso formativo | AP-62, AP-63, AP-66 | Listo como prototipo: aparece antes de responder y al volver a entrar. |
| Avance y navegación | AP-69, AP-70, AP-73 | Listo como prototipo: posiciones 1/2, 2/2 y caso límite 1/1. |
| Retroalimentación | AP-93, AP-94, AP-97 | Listo como prototipo: correcto, incorrecto y evaluación pendiente con reintento. |
| Diagnóstico y respuestas reales | AP-52, AP-56, AP-59, AP-76, AP-77, AP-80 | Pendientes: banco aprobado, integración publicada, intento de servidor y registro único de respuestas. |
| Dificultad adaptativa | AP-83, AP-84, AP-87, AP-90 | Pendientes: banco clasificado, regla y pruebas de límites. |
| Consentimiento y control de menores | AP-304, AP-305, AP-308, AP-311 | Pendientes: decisiones y revisión jurídica, implementación y pruebas. |

**Conteo Jira:** 10 de 24 incidencias principales en «Listo»; 6 «En curso» y 8 «Por hacer». De las 34 subtareas vinculadas, 14 quedaron en «Listo» con sus **56 actividades marcadas** y evidencia en la descripción; 20 subtareas siguen pendientes, con 80 actividades sin marcar. No se marcaron actividades por trabajo no realizado.

El código está en los commits `9d9d2a7` y `d048f6d`. Pasaron **11/11 pruebas de lógica**, ESLint, compilación y **11 escenarios en Chrome**. El caso de una pregunta se verifica con una respuesta GET recortada por la prueba de interfaz; las seis combinaciones reales de la demo contienen dos preguntas cada una. El banco vacío devuelve HTTP 409 y ningún resultado. El modo publicado permanece bloqueado por HTTP 409. Véanse [desarrollo del Sprint 2](11-desarrollo-sprint-2.md) y [banco demo](13-banco-diagnostico-demo.md).

## Pendientes trasladados

Jira confirmó la operación de asignar las 14 incidencias pendientes al backlog del tablero AP. Conservan el Sprint 2 **cerrado en su historial** y llevan la etiqueta `sprint2-pendiente`; la consulta `project = AP AND labels = sprint2-pendiente ORDER BY key` devolvió las 14. La lectura del backlog del conector no las mostró, por lo que su visibilidad en la pantalla del tablero no quedó comprobada por esa vía. Los enlaces directos de la tabla anterior y la consulta JQL permiten recuperarlas.

El Sprint 3 ya tiene 20 incidencias principales planificadas. No se añadieron automáticamente las 14 pendientes allí. En la siguiente planificación, priorizar: (1) aprobación curricular [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y decisiones jurídicas del [borrador de consentimiento](12-aviso-consentimiento-menores-borrador.md); (2) intento de diagnóstico y respuestas únicas, para AP-52/AP-56/AP-59/AP-76/AP-80; (3) regla y banco clasificado para AP-83. Revisar capacidad antes de fijar una nueva fecha para los pendientes.

**Límite de publicación:** las doce preguntas son ejemplos sin revisión docente; no hay cuenta, almacenamiento de progreso personal ni autorización de representantes implementados. El [diseño de consentimiento](10-consentimiento-menores-sprint-2.md) y su aviso son borradores para revisión. Este cierre acredita el prototipo, no habilita uso con menores reales.
