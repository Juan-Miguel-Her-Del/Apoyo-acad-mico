# Auditoría del proyecto Jira AP

**Fecha:** 30 de septiembre de 2026. **Proyecto revisado:** [Apoyo_academico (AP)](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP). Esta auditoría cubre las 313 incidencias de AP y la configuración de su tablero. El responsable confirmó que aún no ha comenzado la programación.

## Estado comprobado

| Elemento | Resultado |
|---|---:|
| Épicas | 9 |
| Historias | 40 |
| Tareas | 88 |
| Subtareas | 176 |
| Incidencias en «Por hacer» | 313 |
| Historias con criterios propuestos específicos | 40 |
| Tareas con entregable y cierre propuestos | 88 |
| Subtareas con evidencia de cierre definida | 176 |
| Enlaces Jira historia–tarea «Relates» | 88 |
| Historias con Story Points preliminares | 40; total 170 puntos |
| Versiones de entrega | 0 |
| Componentes Jira | 0 |
| Subtareas sin asignar | 162 |

La correspondencia por identificador HU entre las 40 historias y las 88 tareas fue completa. Las 88 tareas tienen dos subtareas cada una. No se detectaron padres faltantes ni diferencias de sprint entre tarea e historia o entre subtarea y tarea. Jira mantiene historias y tareas como elementos hermanos bajo su épica; los 88 enlaces creados permiten navegar su relación. No se modificaron jerarquías, estados, sprints ni fechas.

## Capacidad y cronograma

El tablero AP utiliza «Story point estimate». Los puntos cargados son estimaciones preliminares en escala Fibonacci y se deben recalibrar con trabajo real. La hipótesis de planificación local es **2 h por punto**, y deja **16 h de trabajo planificado por semana** de las 20 h disponibles para reservar pruebas, documentación e imprevistos.

| Sprint actual | Historias | Puntos | Horas hipotéticas | Exceso sobre 16 h |
|---|---:|---:|---:|---:|
| AP Sprint 1 | 4 | 10 | 20 | 4 |
| AP Sprint 2 | 6 | 23 | 46 | 30 |
| AP Sprint 3 | 5 | 27 | 54 | 38 |
| AP Sprint 4 | 7 | 25 | 50 | 34 |
| AP Sprint 5 | 8 | 39 | 78 | 62 |
| AP Sprint 6 | 8 | 33 | 66 | 50 |
| Sin sprint | 2 | 13 | 26 | Por asignar |

Estas horas cuentan historias una vez; las tareas y subtareas son su desglose. El sprint 1 aparece activo, con 12 elementos principales en el tablero y 0 completados en el momento de la revisión. No se infiere retraso a partir de ese dato: el sprint acaba de comenzar y la programación aún no inicia. Ver [estimaciones](estimaciones.md) para la propuesta de redistribución.

## Decisiones de calidad pendientes

1. **Fuente oficial:** también existen [AA](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AA) («apoyo academico», 322 incidencias) y [KAN](https://juanmiguelsworkspace-40060689.atlassian.net/browse/KAN) («apoyo académico», 0 incidencias). AA contiene al menos las mismas nueve temáticas de épicas; definir cuál proyecto es el oficial y cómo se consultarán los anteriores. No se eliminaron ni archivaron proyectos.
2. **Descripción del proyecto:** el campo de descripción de AP está vacío. Incorporar problema, población, alcance y enlace al material aprobado cuando se definan esos datos.
3. **Alcance:** [AP-8](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-8) está etiquetada POST-MVP y su historia [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) figura MVP. [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) exige decidir si el progreso será de una sesión o entre sesiones. Hay siete historias POR DEFINIR en la [propuesta de alcance](03-alcance-mvp.md).
4. **Viabilidad:** seis semanas de 20 h nominales no cubren 340 h hipotéticas de historias. Definir fecha real de inicio, alcance del primer piloto y nuevas fechas o capacidad. No se cambiaron sprints automáticamente.
5. **Reglas de negocio:** completar población, grados, materias, banco mínimo de preguntas, puntuación diagnóstica, privacidad y umbrales de calidad de IA. Los criterios escritos están marcados como propuestos hasta su validación.
6. **Evidencia técnica:** no hay software, pruebas, versiones ni despliegue. El primer trabajo de desarrollo debe producir un incremento ejecutable y anexar evidencia a las incidencias.
7. **Asignación:** 162 subtareas siguen sin responsable directo; sus tareas madre tienen asignación. Decidir si se asignarán al desarrollador al entrar en un sprint, evitando confundir falta de asignación con falta de propietario.

## Cambios realizados en Jira

Se enriquecieron las descripciones de las 313 incidencias sin alterar su estado. Las 40 historias sustituyeron el criterio genérico por escenarios principal y límite; las 88 tareas recibieron entregable y criterio de cierre; las 176 subtareas distinguen ejecución y verificación; las nueve épicas recibieron objetivo y resultado demostrable. Se crearon 88 enlaces historia–tarea y se cargaron puntos preliminares en las 40 historias. La verificación posterior encontró las 313 descripciones revisadas, los 170 puntos y los 88 enlaces esperados, sin fallos de escritura reportados.
