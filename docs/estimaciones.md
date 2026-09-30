# Estimaciones y viabilidad

> **Actualización, 30 de septiembre de 2026:** los sprints sugeridos y la clasificación siguientes son una estimación anterior al replanteamiento del MVP. El plan vigente en Jira contempla 21 historias y 99 puntos para el 10 de noviembre de 2026; la capacidad sigue siendo 20 h/semana y el riesgo de plazo continúa abierto.

**Corte:** 30 de septiembre de 2026. Estimación inicial de historias, no compromiso ni tiempo ya trabajado. Escala Fibonacci: 1, 2, 3, 5, 8, 13 puntos. Se usa **2 horas por punto** solo como regla preliminar uniforme; debe calibrarse con tareas reales. Las horas excluyen integración, configuración, documentación, reuniones y contingencias. La incertidumbre puede ser alta porque no existe código ni stack elegido.

Los puntos de esta tabla se cargaron en el campo «Story point estimate» de las 40 historias de Jira AP y se verificó un total de **170 puntos**. No se modificaron los sprints.

Capacidad: **20 h/semana** del único desarrollador. Para planificar se reservan **4 h/semana** para revisión, pruebas, documentación e imprevistos, dejando **16 h/semana para historias**. Además se propone un bloque inicial de **24 h** para seleccionar stack, crear esqueleto, datos piloto y pruebas básicas. Ese bloque también consume capacidad semanal.

| Funcionalidad / Historia | Complejidad | Story Points | Horas estimadas | Dependencias | Sprint sugerido |
|---|---|---:|---:|---|---|
| [AP-10](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-10) Elegir nivel educativo | Baja/media | 3 | 6 | Catálogo definido | S2 |
| [AP-17](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-17) Elegir materia | Baja/media | 2 | 4 | AP-10 | S3 |
| [AP-24](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-24) Elegir tema | Baja/media | 2 | 4 | AP-17 | S3 |
| [AP-31](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-31) Filtrar temas por nivel y materia | Baja/media | 3 | 6 | AP-10, AP-17, AP-24 | S3 |
| [AP-38](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-38) Cambiar materia o tema | Baja/media | 2 | 4 | AP-17, AP-24 | Después del MVP |
| [AP-45](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-45) Recordar último tema | Baja/media | 3 | 6 | AP-24; almacenamiento | Después del MVP |
| [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52) Diagnóstico corto | Media | 5 | 10 | AP-24; preguntas piloto | S4 |
| [AP-62](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-62) Aviso de diagnóstico sin nota | Baja/media | 1 | 2 | AP-52 | Por definir |
| [AP-69](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-69) Indicador de progreso del diagnóstico | Baja/media | 2 | 4 | AP-52 | Después del MVP |
| [AP-76](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-76) Responder diagnóstico | Media | 5 | 10 | AP-52 | S5 |
| [AP-83](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-83) Dificultad adaptativa del diagnóstico | Alta | 8 | 16 | AP-76 | Después del MVP |
| [AP-93](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-93) Retroalimentación visual inmediata | Baja/media | 2 | 4 | AP-76 | Después del MVP |
| [AP-100](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-100) Asociar respuestas con subtemas | Alta | 8 | 16 | AP-76; mapa pregunta-subtema | S6 |
| [AP-107](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-107) Mostrar subtemas difíciles | Baja/media | 3 | 6 | AP-100 | S7 |
| [AP-114](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-114) Mostrar fortalezas | Baja/media | 3 | 6 | AP-100 | Después del MVP |
| [AP-121](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-121) Nivel de confianza | Media | 5 | 10 | AP-100 | Después del MVP |
| [AP-128](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-128) Explicación del subtema | Alta | 8 | 16 | AP-107; contenido o IA | S8 |
| [AP-138](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-138) Adaptar explicación al nivel | Media | 5 | 10 | AP-10, AP-128 | S9 |
| [AP-145](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-145) Incluir ejemplo concreto | Baja/media | 3 | 6 | AP-128 | S9 |
| [AP-152](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-152) Solicitar otro ejemplo | Baja/media | 2 | 4 | AP-145 | Después del MVP |
| [AP-159](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-159) Valorar utilidad de explicación | Baja/media | 2 | 4 | AP-128 | Después del MVP |
| [AP-166](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-166) Pregunta corta tras explicación | Baja/media | 3 | 6 | AP-128, AP-180 | Después del MVP |
| [AP-173](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-173) Preguntas de práctica relacionadas | Media | 5 | 10 | AP-128 | S10 |
| [AP-180](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-180) Responder ejercicios | Media | 5 | 10 | AP-173 | S11 |
| [AP-187](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-187) Explicar acierto o error | Baja/media | 3 | 6 | AP-180 | Después del MVP |
| [AP-194](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-194) Dificultad gradual de práctica | Alta | 8 | 16 | AP-180 | Después del MVP |
| [AP-201](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-201) Resumen de sesión | Baja/media | 3 | 6 | AP-180 | S11 |
| [AP-208](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-208) Otra ronda | Baja/media | 2 | 4 | AP-201 | Después del MVP |
| [AP-215](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-215) Banco amplio de preguntas | Alta | 8 | 16 | AP-52, AP-173 | Por definir |
| [AP-222](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-222) Dominio por subtema | Media | 5 | 10 | AP-100, AP-180 | Después del MVP |
| [AP-229](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-229) Gráfica de progreso | Media | 5 | 10 | AP-222 | Después del MVP |
| [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) Progreso tras sesión | Media | 5 | 10 | AP-201; decisión de persistencia | Por definir |
| [AP-243](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-243) Recomendación de siguiente tema | Media | 5 | 10 | AP-107, AP-222 | Después del MVP |
| [AP-250](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-250) Racha de estudio | Baja/media | 2 | 4 | Persistencia | Después del MVP |
| [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) Crear cuenta | Media | 5 | 10 | Identidad y protección de datos | Por definir |
| [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267) Iniciar sesión | Alta | 8 | 16 | AP-257 | Por definir |
| [AP-277](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-277) Recuperar contraseña | Baja/media | 3 | 6 | AP-267 | Después del MVP |
| [AP-284](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-284) Eliminar cuenta y datos | Media | 5 | 10 | AP-257; política de datos | Por definir |
| [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) Revisión de explicaciones IA | Media | 5 | 10 | AP-128; rúbrica | S12 |
| [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) Consentimiento de representante | Alta | 8 | 16 | AP-257; población objetivo | Por definir |

## Carga de los seis sprints actuales

Estos totales suman **solo historias**, sin sumar tareas y subtareas otra vez; estas descomponen el mismo trabajo. Tampoco incluyen las 24 h de arranque ni la reserva.

| Sprint de Jira | Horas de historias | Exceso frente a 16 h útiles |
|---|---:|---:|
| AP Sprint 1 | 20 h | 4 h |
| AP Sprint 2 | 46 h | 30 h |
| AP Sprint 3 | 54 h | 38 h |
| AP Sprint 4 | 50 h | 34 h |
| AP Sprint 5 | 78 h | 62 h |
| AP Sprint 6 | 66 h | 50 h |

Hay además **26 h** de historias sin sprint. El total de las 40 historias es **340 h**: 130 h de MVP inequívoco, 130 h POST-MVP y 80 h POR DEFINIR. Incluso sin margen ni arranque, 340 h supera las 120 h nominales de seis semanas. El sprint 1 usa las 20 h nominales únicamente con historias y deja sin tiempo al arranque; del 2 al 6 hay sobrecarga clara. La etiqueta de sprint «activo» en Jira no prueba ejecución.

## Redistribución recomendada para estudiar con Jira

**No se cambiaron sprints en Jira.** Una secuencia de **12 semanas desde el inicio efectivo del desarrollo** permite una primera demostración del MVP bajo esta estimación. S1: 16 h de arranque; S2: 8 h restantes de arranque + AP-10 (6 h); S3: AP-17, AP-24 y AP-31 (14 h); S4: AP-52 (10 h); S5: AP-76 (10 h); S6: AP-100 (16 h); S7: AP-107 (6 h); S8: AP-128 (16 h); S9: AP-138 y AP-145 (16 h); S10: AP-173 (10 h); S11: AP-180 y AP-201 (16 h); S12: AP-294 (10 h). El espacio libre en semanas intermedias absorbe validación, correcciones y dependencias; no debe interpretarse como tiempo ocioso garantizado.

La secuencia MVP más arranque suma **154 h**, equivalente a casi **10 semanas** a 16 h útiles por semana antes de considerar riesgos de integración. Doce semanas son una propuesta prudente para tareas dependientes; la fecha final debe recalcularse cuando se elijan stack y contenidos. Si el 10 de noviembre es una fecha rígida, reducir el alcance de la demostración o aumentar capacidad, y presentar las funciones restantes como roadmap. No sería defendible prometer las 40 historias en seis semanas de una sola persona.

Antes de actualizar Jira: decidir las siete historias POR DEFINIR, validar estimaciones de tareas críticas, comparar con la capacidad real del primer sprint y dividir historias de 8 puntos si su incertidumbre sigue alta.
