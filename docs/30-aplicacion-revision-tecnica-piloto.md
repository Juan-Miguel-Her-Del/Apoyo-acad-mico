# Aplicación de la revisión técnica del piloto

El 15 de octubre de 2026 se recibieron [el informe técnico](informe_revision_tecnica.docx) y [la matriz de validación](matriz_validacion_docente.xlsx) sobre la primera versión del [paquete piloto](28-paquete-revision-docente-piloto.pdf). El informe examinó 12 preguntas diagnósticas, 36 de práctica y seis preguntas breves. Sus estados son **recomendaciones técnicas**: la columna de decisión docente de la matriz está vacía y no acredita aprobación de ninguna combinación.

También se recibió un [concepto pedagógico simulado](concepto_docente_paquete.docx). El propio documento identifica a su autor como un asistente de IA en rol de docente revisor, aclara que no es un docente acreditado y deja el registro de validación real sin diligenciar. Se usa como otra lista de observaciones técnicas, nunca como aprobación docente.

## Correcciones aplicadas al banco `demo-2026-10-v3`

| ID | Cambio |
|---|---|
| `practice-g05-mat-01` | Subtema corregido a suma con distinto denominador. |
| `practice-g05-esp-01` | Subtema propio de frase introductoria, sin reclasificar como títulos las otras preguntas. |
| `practice-g10-mat-02` | Subtema corregido de coseno a seno; se conservó la clave 5/13. |
| `practice-g10-mat-04` | Se especificó el ángulo agudo formado por el cateto de 8 y la hipotenusa; se conservó la clave 8/10. |
| `practice-g10-esp-02` | Subtema propio de identificar la razón, separado de evidencia pertinente. |
| `practice-g10-qui-01` y `-02` | El primero se clasificó como balanceo y el segundo como átomos en fórmulas. |
| `practice-g05-esp-06` | El subtítulo ahora menciona expresamente a los perros. |
| `demo-g10-fis-01` y `-02` | Se aclararon el mismo sentido de las fuerzas y el marco inercial del movimiento sin fuerza neta. |
| `demo-g10-qui-01` | Se pidió balancear con coeficientes enteros mínimos y se explicitó la ecuación completa en la justificación. |

Se conservaron los identificadores y las claves de las preguntas. Las sesiones de práctica ya guardadas conservan sus enunciados y respuestas; al abrir la base local se reclasifican los subtemas históricos afectados para que el progreso no siga atribuyendo esos aciertos a una habilidad equivocada. Las preguntas de sesiones antiguas aún abiertas mantienen su enunciado original, pero al responderlas se registra el subtema corregido.

## Pendiente de revisión docente

- **G05-MAT:** ampliar de cálculos aislados a problemas contextualizados y razonamiento; vincular malla y estándar exactos.
- **G05-ESP:** decidir el DBA y añadir producción textual observable con criterios de evaluación. Sigue pendiente.
- **G10-MAT:** decidir si seno y coseno son una introducción o ampliar hasta modelación de funciones periódicas. Sigue pendiente.
- **G10-ESP:** trabajar lectura crítica con un texto y justificación de la postura.
- **G10-FIS:** ampliar a aplicación conceptual de las leyes de Newton y representaciones de fuerzas.
- **G10-QUI:** ampliar a mecanismos de reacción y relaciones cuantitativas, o acotar el objetivo a balanceo introductorio.
- **Todas:** separar la pregunta breve del primer ítem de práctica y del diagnóstico adaptativo, mejorar distractores y calibrar niveles. La práctica y el diagnóstico adaptativo de cuenta siguen compartiendo un banco provisional.

El nuevo PDF se generó desde el banco corregido y conserva las seis combinaciones para revisión. Ningún contenido cambió a `approvedForPublication: true` o `explanationApproved: true`; `validatedQuestionCount` continúa en cero. Las decisiones curriculares y la aprobación por docente siguen pendientes en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314).
