# AP-132 — Contexto de una explicación por subtema

**Estado:** especificación técnica iniciada el 8 de octubre de 2026 y materializada el 15 de octubre. Hay una ruta y adaptadores de proveedor preparados, pero no contenido curricular aprobado ni generación publicada. La verificación actual usa fuentes sintéticas. Véase el [desarrollo del Sprint 3 restaurado](26-desarrollo-sprint-3-restaurado.md). Relacionada con [AP-128](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-128), [AP-129](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-129), [AP-135](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-135) y [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314).

Existe un preparador interno en [`web/src/lib/explanation-context.ts`](../web/src/lib/explanation-context.ts). Solo devuelve contexto cuando coinciden grado, materia, tema y subhabilidad, hay una señal de dificultad y el tema y fuente figuran revisados. Con el catálogo vigente devuelve `content_not_approved`; la ruta `/api/explanation` responde 409 sin llamar a IA. Sus pruebas con fuentes sintéticas están en [`web/tests/explanation-context.test.mjs`](../web/tests/explanation-context.test.mjs) y [`web/tests/explanation-service.test.mjs`](../web/tests/explanation-service.test.mjs).

## Entrada mínima propuesta

| Campo | Origen y regla |
| --- | --- |
| `gradeId`, `subjectId`, `topicId` | Identificadores del catálogo, validados como combinación existente. No aceptar nombre libre como fuente de contexto. |
| `subskillId` | Identificador estable de una subhabilidad vinculada a esa combinación y a preguntas aprobadas. |
| `difficultyEvidence` | Conteo de respuestas válidas y regla/version que clasificó la dificultad. Si es insuficiente, no afirmar que el estudiante tiene dificultad. |
| `approvedSource` | Texto explicativo y ejemplo aprobados, versión, revisor, referencia curricular e identificador de evidencia de aprobación. Debe pertenecer al mismo grado, materia, tema y subhabilidad. |
| `audience` | Nivel escolar y lenguaje apropiado. El prompt no recibe nombre, correo, documento, respuestas literales ni identificador de cuenta. |

El servidor prepara el contexto a partir de IDs verificados y contenido aprobado. Una petición del navegador no puede sustituir `approvedSource` ni indicar por sí misma que algo está aprobado. El texto generado debe señalar la fuente usada; la salida se trata como borrador hasta pasar la validación de [AP-135](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-135). Un fallo del proveedor no debe producir una explicación inventada: se muestra un mensaje claro y opción de reintento.

## Ejemplo válido de contrato (solo sintético)

```json
{
  "gradeId": "G05",
  "subjectId": "MAT",
  "topicId": "G05-MAT",
  "subskillId": "fraction-equivalence",
  "difficultyEvidence": { "answered": 3, "correct": 1, "ruleVersion": "draft-1" },
  "approvedSource": { "topicId": "G05-MAT", "subskillId": "fraction-equivalence", "version": "0", "approvalEvidenceId": "ejemplo-ficticio", "reviewedBy": "docente-ficticio", "reviewedAt": "2026-10-08", "reference": "fuente-ficticia", "explanation": "explicación-ficticia", "example": "ejemplo-ficticio" },
  "audience": "quinto grado"
}
```

**El ejemplo no es un registro aprobado.** El objeto `approvedSource` sirve para describir el contrato; el código de producción solo lo obtendría de un depósito propio después de revisar la evidencia real. Con los datos sintéticos, el resultado esperado sería construir un contexto limitado a fracciones equivalentes de quinto grado y devolver la referencia de versión a la validación, sin incluir datos personales.

## Caso límite y rechazo

Si `subskillId` no pertenece a `topicId`, faltan respuestas suficientes, `approvedSource` no tiene evidencia real de aprobación o el proveedor falla, **no se solicita ni se muestra una explicación personalizada**. Resultado esperado: código de error controlado y mensaje «Aún no hay una explicación revisada para este tema. Inténtalo más tarde». El caso no debe usar una explicación de otra materia o grado como alternativa silenciosa.

## Decisiones y pruebas antes de integrar

- Definir proveedor, ubicación de procesamiento y contrato, costos y manejo de fallos; revisar el tratamiento de datos de menores antes de enviar cualquier dato a un servicio externo.
- Definir con docentes la estructura de subhabilidades, el banco y las fuentes aprobadas de las seis combinaciones en AP-314. El umbral de evidencia y `ruleVersion` del ejemplo son candidatos, no criterio académico aprobado.
- En AP-135, probar salida pertinente, rechazo de fuente cruzada, respuesta vacía, fallo/timeout, afirmaciones no sustentadas y contenido inapropiado. Guardar entrada sintética, resultado esperado, observado y defectos, sin datos personales en logs.
- La versión publicada requiere revisión de calidad de explicaciones y trazabilidad al contenido aprobado. Hasta entonces, cualquier salida técnica debe etiquetarse claramente como demo.
