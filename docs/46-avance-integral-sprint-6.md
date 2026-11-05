# Sprint 6: implementación y cierre verificable

Fecha: 5 de noviembre de 2026. Proyecto único: **AP — Apoyo_academico**. El alcance original contiene 23 incidencias principales. Este documento conserva cada grupo y sus subtareas; no declara terminado un criterio que dependa de correo real, aprobación jurídica o revisión curricular.

## Cobertura del alcance original

| Historia y tareas | Subtareas incluidas | Evidencia actual | Estado de cierre |
|---|---|---|---|
| AP-38, AP-39, AP-42 · cambiar materia/tema y reiniciar estado dependiente | AP-40, AP-41, AP-43, AP-44 | Selector por pantallas, validación del catálogo y reinicio del diagnóstico; pruebas unitarias y de navegador existentes | Implementación para cuenta adulta y vista previa; verificar contra criterios Jira antes de marcar `Listo` |
| AP-45, AP-46, AP-49 · guardar/restaurar último tema | AP-47, AP-48, AP-50, AP-51 | Selección por cuenta en SQLite, recuperación en nueva sesión y aviso si se retira; nuevo aviso con reintento si falla el guardado | Implementación para cuenta adulta |
| AP-243, AP-244, AP-247 · siguiente estudio recomendado | AP-245, AP-246, AP-248, AP-249 | Reglas basadas en al menos dos prácticas completas por habilidad; recomendación neutra si falta evidencia | Reglas y UI de demostración, pendiente validación pedagógica de umbrales y contenido |
| AP-250, AP-251, AP-254 · racha | AP-252, AP-253, AP-255, AP-256 | Días distintos con práctica respondida, zona `America/Bogota`, cero sin actividad | Implementación y pruebas para cuenta adulta |
| AP-277, AP-278, AP-281 · recuperación de contraseña | AP-279, AP-280, AP-282, AP-283 | Token aleatorio de un uso, hash, 30 minutos, límite de solicitudes, respuesta neutra, revocación de sesiones; envío por Resend preparado | Falta remitente/dominio verificado, clave, URL pública y prueba de entrega real; cuentas de menores cerradas |
| AP-284, AP-285, AP-288, AP-291 · eliminar cuenta y datos | AP-286, AP-287, AP-289, AP-290, AP-292, AP-293 | Confirmación explícita, contraseña, cancelación, borrado de tablas activas y pruebas de cascada ampliadas | Falta política de conservación aprobada, procedimiento para respaldos externos y regla de representantes para menores |
| AP-294, AP-295, AP-298, AP-301 · calidad de explicaciones IA | AP-296, AP-297, AP-299, AP-300, AP-302, AP-303 | Rúbrica, 18 capturas reales de Gemini, preauditoría técnica, registro de hallazgos y botón de reporte | Bloqueado: fuente provisional, revisión independiente pendiente y hallazgos mayores sin resolver |

## Reglas reproducibles para AP-244 y AP-251

La recomendación usa únicamente prácticas **completas** guardadas en la cuenta. Para cada habilidad exige al menos dos sesiones completas distintas y dos respuestas. Si la proporción de aciertos es inferior a 80 %, propone repasar esa habilidad dentro de un tema activo del grado del perfil. Si varias cumplen, prioriza menor porcentaje, luego más respuestas y finalmente el orden del catálogo. Por ejemplo, dos sesiones con 1 acierto de 4 respuestas producen una sugerencia de dificultad del 25 %. Una sola sesión con 0 de 1 produce una sugerencia **neutra**, sin atribuir dificultad. Si el tema deja de estar activo, no se recomienda.

La racha cuenta fechas distintas con práctica terminada y al menos una respuesta, usando `America/Bogota`. Varias prácticas el mismo día cuentan una vez. Si hubo práctica hoy, cuenta hacia atrás desde hoy; si solo hubo ayer, conserva la racha hasta terminar el día actual; si la última fue anteayer o antes, muestra 0. Por ejemplo, una práctica a `2026-10-19T03:30:00Z` corresponde al 18 de octubre en Bogotá. Sin sesiones, la racha es 0. Estos umbrales son reglas de producto provisionales, documentadas para que un docente las evalúe antes de afirmar valor pedagógico.

## Auditoría de IA realizada en este avance

Ejecuté `npm.cmd run capture:ai` con la clave local y material curricular **ficticio/provisional**, sin nombres, correos ni respuestas reales. Se guardaron **18/18 capturas reales** (tres por cada una de las seis combinaciones piloto) en `web/data/ai-quality-captures.json`, que Git ignora. Todas devolvieron fragmentos literales de la fuente y pasaron el validador estructural. `npm.cmd run preaudit:ai` generó `web/data/ai-quality-preaudit.json`; el resultado cubre 18 casos, pero `reviewGatePassed` es **false** y los 18 casos están bloqueados. Estos archivos no son un visto bueno docente.

**Hallazgo AP-301:** las variantes normal, respuesta ficticia errónea y caso límite produjeron la misma salida por tema. La explicación provisional actual no recibe la respuesta del estudiante; solo recibe la habilidad detectada y fragmentos del borrador. El caso límite fue una llamada directa al proveedor: en el producto la falta de evidencia debe impedir invocarlo. Por tanto, las capturas no prueban adaptación al error ni el comportamiento completo del caso límite. Hace falta definir una corrección pedagógica que utilice una categoría de error derivada en el servidor, sin enviar respuestas personales al proveedor, y repetir la muestra. También siguen sin resolver las brechas curriculares de Matemáticas 10.º y Español 5.º del paquete piloto.

La cuenta adulta ahora permite **reportar información incorrecta, confusa o inapropiada** de una salida de Gemini. Al reportarla, la interfaz la oculta y vuelve al texto local; el servidor guarda tema, subtema, versión y motivo, sin texto libre ni identidad. Para retirar todas las salidas provisionales se puede desactivar `APOYO_ENABLE_PROVISIONAL_AI`; la revisión de reportes debe decidir qué corregir antes de volver a activarlas. Un reporte no se interpreta automáticamente como validación o publicación.

## Datos y recuperación: condiciones externas pendientes

La recuperación solo funcionará con envío real al definir en `web/.env.local` `RESEND_API_KEY`, `APOYO_RECOVERY_FROM` y `APOYO_PUBLIC_URL`. El remitente debe pertenecer a un dominio verificado. Después debe hacerse una prueba con un correo controlado: enlace recibido, token válido una vez, enlace vencido, contraseña anterior rechazada y sesiones revocadas. No se configuraron claves ni se simuló la entrega. Las cuentas adultas nuevas también requieren el correo de confirmación.

La eliminación actual borra los datos activos de la cuenta adulta en SQLite, incluidos perfil, progreso, sesiones, intentos, respuestas, valoraciones y límites de correo. No hay procedimiento aprobado para copias externas ni evidencia mínima de eliminación que pueda conservarse legalmente. La abogada debe aprobar tabla de conservación, procedimiento de borrado de respaldos y tratamiento de solicitudes de menores. El registro de menores reales continúa cerrado; los perfiles ficticios de prueba permanecen locales al navegador.

## Verificación técnica

En `web/`: `npm.cmd test` aprobó **109 pruebas**, `npm.cmd run lint` y `npm.cmd run build` aprobaron. `npm.cmd run test:browser` pasó en Chrome a 390 px y verificó selección, diagnóstico, estudio y navegación. La prueba de conexión real `npm.cmd run check:gemini` pasó. La captura de IA dio 18/18 respuestas estructuralmente válidas. El servidor temporal usado para la prueba de navegador se cerró; el puerto 3100 quedó libre.

**Criterio de cierre:** actualizar cada incidencia y casilla de Jira solo cuando su criterio original tenga prueba. Hoy no es correcto declarar el Sprint 6 al 100 %: faltan las condiciones externas anteriores y una nueva auditoría de IA con fuentes aprobadas y revisión independiente.
