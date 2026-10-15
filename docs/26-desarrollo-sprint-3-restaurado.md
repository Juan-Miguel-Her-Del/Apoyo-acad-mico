# Sprint 3 restaurado — resultados por subtema, explicaciones y cuentas

**Fecha:** 15 de octubre de 2026. Proyecto Jira AP, sprint restaurado id 41. Se conservaron las **20 incidencias principales originales**. El sprint histórico id 7 no reemplaza este alcance.

## Entregado y verificable

| Tema | Implementación | Límite |
| --- | --- | --- |
| Fortalezas AP-115 | `diagnosticSkillInsights` agrupa respuestas guardadas por subtema y declara fortaleza solo con dos o más respuestas distintas, todas correctas. El resumen de la cuenta adulta muestra lista o estado vacío. | Regla provisional de demostración. AP-114/AP-118 requieren flujo estudiantil y regla académica validada. |
| Confianza AP-121/AP-122/AP-125 | Fórmula reproducible y acotada: `round(100 × n/(n+2) × abs(2c/n−1))`, con `n` respuestas y `c` aciertos. Con `n<2`, resultado `insuficiente`; con dos aciertos, 50 %; con dos respuestas mixtas, 0 %. El panel la explica y la muestra por subtema. | Es confianza en la **señal de este intento**, no probabilidad de dominio. Cambiar el método exige validación pedagógica. |
| Contexto AP-132 | El servidor comprueba grado, materia, tema, subtema, evidencia de dificultad y coincidencia con una fuente versionada y revisada. El navegador solo envía ID de intento y subtema. | Catálogo actual sin contenido aprobado; el caso positivo se prueba con fuentes sintéticas. |
| Explicación AP-128/AP-129/AP-135 | Ruta `/api/explanation`, proveedor HTTPS opcional y adaptador OpenAI Responses; salida JSON estructurada, validación de IDs, versión y fragmentos literales del material aprobado. Errores comprensibles y reintento solo ante fallo transitorio. Se muestra aviso de revisión en subtemas con dificultad. | No hay fuente aprobada ni diagnóstico publicado. Por ello la app responde 409 sin invocar IA. Las pruebas del proveedor son simuladas; no se ha ejecutado con una clave real. |
| Cuentas estudiantiles AP-257/AP-258/AP-261/AP-264 | Almacén interno con validación de identidad, duplicados, autorización, transacciones y pruebas de aislamiento. Vista accesible de registro futuro, deshabilitada, y página `/privacidad` que declara el estado de revisión. | No hay registro ni inicio de sesión estudiantil público. Faltan aprobación formal de AP-304, verificación del representante, AP-267 y conexión del progreso AP-236. |

El historial diagnóstico ahora se obtiene con `GET /api/diagnostic/attempts`: exige sesión de cuenta adulta, devuelve solo intentos propios y omite preguntas futuras y claves. El panel permite abrir un resumen guardado tras recargar.

## Proveedor de IA preparado

La opción sugerida para el primer ensayo es [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) con [`gpt-6-luna`](https://developers.openai.com/api/docs/models/gpt-6-luna). La app usa `OPENAI_API_KEY` solo en el servidor; `APOYO_EXPLANATION_MODEL` permite sustituir el modelo. Puede usarse el contrato HTTPS alternativo con `APOYO_EXPLANATION_PROVIDER_URL` y `APOYO_EXPLANATION_PROVIDER_TOKEN` cuando no hay clave de OpenAI. No coloques variables con prefijo `NEXT_PUBLIC_` ni pegues secretos en Jira o en este chat.

El adaptador envía exclusivamente identificadores del tema y fragmentos académicos previamente aprobados. Solicita JSON estructurado, `store:false` y un tiempo máximo de ocho segundos. Después, el servidor comprueba que los dos textos devueltos sean **fragmentos literales** de la fuente revisada. Es una primera integración restringida; la generación libre de nuevas explicaciones requiere un protocolo adicional de revisión y pruebas de calidad antes de mostrarse a estudiantes.

**Para configurarlo después:** crea una clave de API de un proyecto propio, añádela en `web/.env.local` como `OPENAI_API_KEY=...` y reinicia `npm.cmd run dev`. El archivo `.env.local` está ignorado por Git. Poner la clave por sí solo **no activa** explicaciones: faltan la revisión curricular de AP-314/AP-316, fuente versionada, evidencia docente y diagnóstico publicado.

## Casos comprobados

| Entrada | Esperado | Observado |
| --- | --- | --- |
| Dos aciertos distintos de un subtema | Fortaleza demo, 50 % de confianza | Coincide en prueba unitaria. |
| Una respuesta o dos mixtas | Sin fortaleza; confianza insuficiente o 0 % | Coincide en prueba unitaria. |
| Fuente sintética coincidente e intento aprobado sintético | Contexto y fragmentos pertinentes con referencia del servidor | Coincide en prueba de servicio. |
| Fuente ausente, intento demo, subtema ajeno o salida inventada | 409 o 503, sin contenido mostrado ni fuga del error interno | Coincide en pruebas de servicio/HTTP. |
| Cuenta ajena o sesión ausente | Sin acceso al historial o explicación | Coincide en pruebas de store y HTTP. |
| OpenAI simulado | Ruta Responses, clave solo servidor, JSON estricto, `store:false` | Coincide en prueba del adaptador; no implica prueba de API real. |
| Registro duplicado, autorización incompleta, almacenamiento fallido | Sin cuenta parcial ni enumeración de correo | Coincide en pruebas del almacén interno. |

La ejecución final fue `npm.cmd test` (**71/71**), `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:diagnostic-browser` y `npm.cmd run test:browser` (ambas pruebas de navegador pasaron con cuenta adulta local). La fuente positiva y la respuesta OpenAI de prueba son **fixtures sintéticas**, no aprobación docente.

## Estado de Jira y pendientes

Al cierre de esta verificación, Jira conserva las **20 incidencias principales** del sprint restaurado: **11 Listo y 9 En curso**; las **20 subtareas** relacionadas están **8 Listo y 12 En curso**. Se acreditan técnicamente AP-115, AP-121, AP-122, AP-125 y AP-132 con sus subtareas de implementación/verificación. El resto conserva su alcance: AP-114/AP-118 precisan flujo estudiantil y regla validada; AP-128/AP-129/AP-135 precisan fuente y ensayo real del proveedor; AP-257/AP-258/AP-261/AP-264 precisan el proceso estudiantil aprobado y operativo. La aprobación verbal comunicada por el titular permite avanzar en desarrollo, pero todavía no aporta la evidencia formal para publicar a menores o marcar contenido como revisado.
