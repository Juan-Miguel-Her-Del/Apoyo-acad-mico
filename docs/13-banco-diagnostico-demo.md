# Banco diagnóstico de demostración — especificación AP-53

**Alcance aceptado para cerrar el Sprint 2:** prototipo local. Las preguntas de este banco son ejemplos no revisados; no constituyen un banco curricular aprobado ni habilitan el diagnóstico publicado. La revisión de contenidos y la cantidad mínima para estudiantes siguen en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314).

## Contrato de una pregunta

Cada entrada de `web/src/lib/diagnostic.ts` conserva un ID estable, `topicId`, habilidad, dificultad, enunciado, tres opciones identificadas, opción correcta, explicación y `validation: "demo-unreviewed"`. La API GET entrega ID, enunciado y opciones; no entrega la solución. La API POST solo evalúa un `questionId` que pertenezca al grado, materia y tema enviados y una opción existente. Ninguna respuesta se almacena en el servidor.

| Combinación piloto | Banco demo | Ejemplo de habilidad |
| --- | ---: | --- |
| G05-MAT | 2 preguntas | Sumar fracciones |
| G05-ESP | 2 preguntas | Propósito del texto |
| G10-MAT | 2 preguntas | Razón trigonométrica |
| G10-ESP | 2 preguntas | Argumentación |
| G10-FIS | 2 preguntas | Fuerza neta |
| G10-QUI | 2 preguntas | Balanceo |

**Caso principal:** G05-MAT devuelve sus dos preguntas en una secuencia finita sin soluciones en GET; una opción válida se evalúa de acuerdo con la clave de demostración. **Casos límite:** una combinación cruzada como G05+FIS o una pregunta de otro tema devuelve HTTP 400; modo publicado devuelve HTTP 409; un banco demo vacío no produce resultado. El cliente admite una secuencia de una sola pregunta para verificar el indicador `1 de 1`, mientras las seis combinaciones existentes contienen dos cada una. Las pruebas están en `web/tests/diagnostic.test.mjs` y `web/tests/browser-smoke.mjs`.

## Decisiones pendientes antes del banco real

- Validar tema, enunciado, respuesta y explicación de cada pregunta con una persona competente en la materia; registrar responsable, versión y fecha en AP-314.
- Fijar cantidad mínima por tema, cobertura de subhabilidades y dificultad para el diagnóstico publicado. El umbral de una pregunta solo prueba el caso límite de interfaz y **no** define suficiencia pedagógica.
- Definir almacenamiento y unicidad de respuestas por intento en AP-59/AP-80, después del diseño de cuentas y consentimiento aplicable. El banco demo no guarda progreso personal.
- Separar físicamente el banco aprobado de las fixtures de demostración y no cambiar banderas de publicación por aprobar este artefacto.

**Evidencia de Sprint 2:** `npm.cmd test` (11/11), lint, build y prueba en Chrome (11 escenarios) pasaron al 8 de octubre de 2026. La prueba del banco vacío usa `createDiagnosticReader([])` y comprueba HTTP 409 sin preguntas ni resultado. Esta especificación satisface el entregable de diseño **del banco demo** de AP-53; no declara aprobado el banco real.
