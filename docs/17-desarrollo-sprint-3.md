# Avance del Sprint 3 — detección y explicaciones

**Fecha:** 8 de octubre de 2026. El Sprint 3 está programado en Jira del 13 al 19 de octubre y todavía figura como **futuro**. Este avance prepara sus incidencias sin declarar terminado el sprint.

## Resultado visible

En la demostración, después de responder las dos preguntas y pulsar **Ver resumen**, aparece una lista de subtemas con aciertos, número de pregunta y estado. La regla provisional requiere **dos respuestas del mismo subtema**: cero aciertos muestran una *señal de dificultad (demo)*; todos los aciertos muestran *sin señal*; un resultado mixto o una sola respuesta queda *indeterminado*. Una pregunta sin subtema vinculado se señala como resultado incompleto y no recibe una clasificación.

La regla es solo un ejemplo técnico. Cinco de las seis combinaciones tienen una pregunta por subtema y mostrarán estados indeterminados; Matemáticas de 10.º tiene dos preguntas del mismo subtema y permite ver la clasificación. Ninguna de las doce preguntas está revisada por docente. El resultado sigue solo en memoria y no se publica ni guarda como diagnóstico personal.

| Incidencia | Evidencia aportada | Límite actual |
| --- | --- | --- |
| AP-100, AP-101, AP-104 | [`diagnostic-analysis.ts`](../web/src/lib/diagnostic-analysis.ts) agrega respuestas por `skill` y conserva los IDs de preguntas; GET demo entrega el vínculo sin solución. | No existe intento persistente ni banco aprobado. |
| AP-107, AP-108, AP-111 | [Resumen de la demo](../web/src/app/diagnostic-demo.tsx) muestra regla, señales y estado indeterminado. | No afirmar dificultades académicas reales. |
| AP-132 | [Contrato y preparador](16-contexto-explicaciones.md) prueban una fuente sintética trazable y bloquean el catálogo no aprobado. | No hay fuente curricular aprobada, interfaz de explicación ni servicio IA. |
| AP-257 | [Plan](15-plan-sprint-3.md) documenta dependencia de consentimiento y privacidad. | No se creó cuenta ni se capturaron datos personales. |

## Verificación

Se ejecutaron `npm.cmd test` (**17/17**), `npm.cmd run lint` y `npm.cmd run build` sin errores. La prueba en Chrome del flujo completo pasó **12 escenarios**, incluidos Química de 10.º con dos estados indeterminados y Matemáticas de 10.º con cero de dos aciertos en un mismo subtema. Las pruebas de contexto usan datos sintéticos; el catálogo real sigue bloqueando toda explicación.

## Próximos pasos

1. Revisar con una persona competente las seis combinaciones, preguntas, respuestas y explicaciones; registrar evidencia en AP-314.
2. Resolver las decisiones de privacidad y autorización de menores de AP-304 antes de activar cuentas en AP-257.
3. Completar intento y respuestas únicas del diagnóstico real pendientes del Sprint 2. Solo después conectar resultados reales con el análisis por subtema.
4. Integrar y validar explicaciones usando fuentes aprobadas; probar fallo del proveedor y reintento antes de cerrar AP-128, AP-129 y AP-135.
