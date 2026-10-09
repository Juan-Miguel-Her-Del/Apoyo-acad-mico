# Plan de trabajo del Sprint 3 — Apoyo_academico

**Consulta:** 8 de octubre de 2026. Jira mantiene [AP Sprint 3](https://juanmiguelsworkspace-40060689.atlassian.net/jira/software/projects/AP/boards/3) en estado **futuro**, programado del 13 al 19 de octubre. Avanzar código y diseño antes del inicio formal no cambia ese estado.

## Alcance vigente

| Bloque | Incidencias principales | Estimación de historias | Dependencia |
| --- | --- | ---: | --- |
| Resultados por subtema y dificultades | AP-100, AP-101, AP-104, AP-107, AP-108, AP-111 | 11 puntos | Respuestas asociadas a subhabilidades; el diagnóstico real sigue pendiente del Sprint 2. |
| Fortalezas y confianza | AP-114, AP-115, AP-118, AP-121, AP-122, AP-125 | 8 puntos | Regla de dominio y muestra suficiente; etiquetas `post-mvp` en Jira. |
| Explicaciones | AP-128, AP-129, AP-132, AP-135 | 8 puntos | Subtema difícil identificado, fuente educativa aprobada y control de calidad. |
| Cuenta | AP-257, AP-258, AP-261, AP-264 | 5 puntos | AP-304 y revisión del aviso, finalidades, verificación del representante y conservación de datos. |

Son **20 incidencias principales** y **32 puntos de historias**. La meta del sprint declara una capacidad de 20 horas por semana; no hay equivalencia establecida entre puntos y horas. Además, hay 14 incidencias pendientes del Sprint 2 con etiqueta `sprint2-pendiente`. No se incorporan automáticamente al Sprint 3.

## Orden de ejecución

1. Implementar el análisis de **demostración** de resultados por subtema con datos ficticios, regla visible y estado indeterminado si falta evidencia. No confundirlo con una evaluación curricular ni marcar listas historias que requieren diagnóstico real.
2. Especificar el contexto mínimo y los controles de una explicación antes de integrar cualquier servicio. La [especificación AP-132](16-contexto-explicaciones.md) recoge entradas, ejemplo, caso límite y decisión pendiente.
3. Preparar registro y validación con datos sintéticos, pero mantener cerrada la activación de cuentas personales hasta resolver [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y su [aviso borrador](12-aviso-consentimiento-menores-borrador.md). AP-257 exige también inicio de sesión AP-267 y consulta aislada de progreso AP-236.
4. Obtener evidencia de revisión curricular de las seis combinaciones en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) antes de publicar contenido o explicar una dificultad a estudiantes reales.
5. Replanificar los pendientes del Sprint 2 por dependencia y capacidad antes de prometer fecha de entrega. La meta MVP sigue siendo el 10 de noviembre de 2026; el cumplimiento depende de estas aprobaciones y de la implementación restante.

## Criterio de estado

Una demo local se documenta como demo y se prueba con sus límites. Las incidencias que exigen cuentas activas, resultados reales, explicación validada o publicación permanecen abiertas hasta cumplir todos sus criterios. Cada cambio de estado en Jira necesita enlace a código o documento y resultado de verificación.
