# Sprint 3: estado y pasos para completar el alcance original

**Revisión:** 5 de noviembre de 2026. Sprint restaurado de Jira: 20 incidencias principales, 11 «Listo» y 9 «En curso». Este documento no sustituye los criterios de cada incidencia.

| Incidencias | Avance comprobado | Qué falta para cerrarlas según su alcance |
| --- | --- | --- |
| AP-114, AP-118 | El diagnóstico calcula fortalezas por subtema. También se muestran en «Mi progreso» de perfiles ficticios, con estado vacío y aviso de provisionalidad. | Validar pedagógicamente la regla y comprobar la experiencia en el flujo estudiantil autorizado. Los perfiles locales no son cuentas reales. |
| AP-128, AP-129, AP-135 | Ruta de explicación, control del contexto y adaptador OpenAI preparados; pruebas con fuentes y respuestas sintéticas. | Material curricular aprobado con evidencia, diagnóstico publicado, fuente versionada y ensayo con una clave y salida real del proveedor. Hoy la ruta responde 409 sin fuente aprobada. |
| AP-257, AP-258, AP-261, AP-264 | Contrato y almacén interno de cuentas estudiantiles probados con datos sintéticos. La interfaz ofrece perfiles ficticios locales. | Autorización y verificación operativa del representante, documentos jurídicos aprobados, registro real habilitado, sesión y progreso estudiantil. `POST /api/student/register` continúa cerrado (503). La referencia de AP-258 a `student-registration-preview.tsx` está desactualizada tras el rediseño de pantallas. |

El acuerdo actual es usar **solo perfiles ficticios de menores**. Por ello, las cuatro incidencias de cuentas reales no pueden marcarse «Listo» sin cambiar su criterio de aceptación. Tampoco debe convertirse un dictamen simulado por IA en aprobación docente: `concepto_docente_paquete.docx` lo identifica expresamente como simulación; `informe_revision_tecnica.docx` es una revisión técnica preliminar.

## Preparar la integración de OpenAI

1. En la plataforma de OpenAI, crea o selecciona un proyecto de API, configura su facturación/límite y genera una clave secreta. La suscripción de ChatGPT y la API se administran por separado.
2. En tu equipo, crea `web/.env.local` y escribe una línea `OPENAI_API_KEY=tu_clave`. No añadas `NEXT_PUBLIC_`, no subas el archivo a Git y no envíes la clave por chat o Jira.
3. Reinicia el servidor desde `web/` con `npm.cmd run dev`. El modelo predeterminado se configura en `src/lib/explanation-openai.ts`; `APOYO_EXPLANATION_MODEL` permite cambiarlo.
4. Para habilitar explicaciones reales, solicita a un docente competente la revisión de los temas, explicaciones, ejemplos y preguntas que se publicarán. Conserva quién revisó, cuándo, versión, referencia curricular y evidencia de aprobación. El paquete piloto técnico no basta como aprobación.
5. Con esa evidencia, incorpora únicamente las fuentes aprobadas en `src/lib/explanation-sources.ts` con los campos de `ReviewedExplanationSource`. Actualiza en el catálogo `approvedForPublication`, `explanationApproved` y `validatedQuestionCount` **solo** para contenido efectivamente revisado; publica el diagnóstico correspondiente.
6. Prueba con datos ficticios el recorrido completo: diagnóstico publicado → dificultad por subtema → solicitud a `/api/explanation` → respuesta y ejemplo de la fuente. Revisa exactitud, pertinencia y errores reales del proveedor antes de cerrar AP-128/AP-129/AP-135.

**Comprobación del 5 de noviembre:** `web/.env.local` contiene una entrada no vacía para `OPENAI_API_KEY`. La clave autenticó la consulta del modelo `gpt-6-luna` (HTTP 200), pero la solicitud real a Responses devolvió HTTP 429 con código `credit_balance_exhausted`. Según la documentación de OpenAI, la organización necesita créditos de API. Una vez añadidos, desde `web/` ejecuta `npm.cmd run check:openai`: usa texto matemático ficticio, no imprime la clave ni el contenido generado, y valida que la respuesta extraiga fragmentos de la fuente de prueba. Hasta que esa prueba pase, no hay evidencia de generación real satisfactoria.

La clave por sí sola no quita el bloqueo curricular. El adaptador envía identificadores y fragmentos académicos de la fuente aprobada, no un chat libre ni perfiles de estudiantes.

## Verificación de esta revisión

- `npm.cmd test`: 101 pruebas aprobadas.
- `npm.cmd run lint` y `npm.cmd run build`: aprobados.
- `BROWSER_TEST_ACCOUNTS=true; npm.cmd run test:browser`: pasó con base de prueba aislada; verificó el estado sin fortalezas y una fortaleza tras dos respuestas correctas del mismo subtema en perfiles ficticios.

No se cambiaron los estados de estas nueve incidencias en Jira.
