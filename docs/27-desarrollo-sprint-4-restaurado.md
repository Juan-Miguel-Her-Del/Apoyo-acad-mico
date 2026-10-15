# Sprint 4 restaurado — alcance original

**Proyecto:** AP — Apoyo_academico. **Sprint de Jira:** id 42. **Fecha de revisión:** 15 de octubre de 2026.

El sprint histórico id 8 cerró una demostración de práctica. Este documento sigue las **25 incidencias principales del alcance original**, sin quitar historias ni moverlas fuera del sprint restaurado. Antes de este desarrollo había seis Listo (AP-173/174/177 y AP-180/181/184) y 19 Por hacer.

## Alcance comprobado en Jira

| Historia | Tareas relacionadas | Resultado esperado | Dependencia |
| --- | --- | --- | --- |
| AP-138 — explicación adaptada al grado | AP-139, AP-142 | Vocabulario y profundidad para el nivel; falta de nivel informada. | Explicación aprobada AP-314/AP-316. |
| AP-145 — ejemplo concreto | AP-146, AP-149 | Ejemplo correcto del concepto; salida inválida bloqueada. | Fuente y revisión curricular. |
| AP-152 — otro ejemplo | AP-153, AP-156 | Alternativa diferente del mismo concepto; agotamiento informado. | Dos ejemplos aprobados. |
| AP-159 — valoración | AP-160, AP-163 | Valoración asociada a la explicación, sin duplicar. | Explicación mostrada y cuenta estudiantil para persistencia real. |
| AP-166 — pregunta corta | AP-167, AP-170 | Comprobación contra solución de referencia; sin calificación arbitraria. | Pregunta y solución revisadas. |
| AP-173/AP-180 — práctica | AP-174/177 y AP-181/184 | Selección, presentación, respuesta y registro. | Ya Listo como prototipo provisional. |
| AP-267 — sesión estudiantil | AP-268, AP-271, AP-274 | Inicio/cierre, aislamiento, expiración y reingreso. | AP-257 y autorización AP-304. |

Las 13 tareas abiertas tienen 26 subtareas. Toda casilla, transición y cierre exige caso principal, límite y evidencia observable. Los cálculos y la práctica de cuenta adulta son una demostración: no acreditan publicación curricular ni acceso de menores.

## Reglas y formato implementados

La selección de nivel entra como `gradeId` del intento guardado en el servidor, nunca desde una instrucción libre del navegador. `explanationLevelForGrade` define cuatro etapas: 1.º–3.º con palabras cotidianas, una idea y hasta 45 palabras; 4.º–5.º con términos escolares explicados, dos pasos y hasta 70; 6.º–9.º con vocabulario disciplinar en contexto, procedimiento y justificación breve y hasta 100; 10.º–11.º con vocabulario formal, modelo y límites y hasta 130. El ejemplo tiene límites respectivos de 45, 65, 90 y 110 palabras. Un grado fuera de 1.º–11.º se rechaza con un mensaje para escoger uno válido. Estas son reglas de presentación iniciales, sujetas a validación curricular; no demuestran por sí solas comprensión por un estudiante.

El formato del ejemplo exige `topicId`, `subskillId`, versión y referencia de una fuente académica revisada, y un texto de ejemplo aprobado para ese mismo tema. El proveedor recibe únicamente la fuente y la regla de nivel desde el servidor; puede devolver un fragmento literal, pero no añadir afirmaciones. El servidor verifica tema, subtema, versión, texto literal y longitud antes de mostrarlo. Una respuesta inventada o cruzada se bloquea y guarda un evento de revisión sin texto generado ni identidad. Un segundo ejemplo solo se ofrece si la fuente incluye una alternativa revisada y distinta; si no existe, la respuesta es `409 no_alternative_example`. El proveedor no recibe una llamada en ese caso.

| Caso de diseño | Entrada y resultado esperado | Resultado observado en prueba sintética |
| --- | --- | --- |
| Nivel principal | `G05` → reglas de primaria alta, 70 palabras de explicación como máximo. | `upper-primary` y límite 70. |
| Nivel ausente o inválido | `G12` → no se inventa nivel. | `null`; la solicitud se rechaza con mensaje de escoger grado válido. |
| Ejemplo principal | Fuente ficticia marcada `fixture-approval` → fragmento literal del ejemplo de esa fuente. | Coinciden ejemplo, referencia y versión. |
| Ejemplo inválido | Proveedor devuelve texto ajeno a la fuente. | HTTP 503, código `invalid_provider_response`; evento de revisión sin texto ni identidad. |
| Alternativa principal | Fuente ficticia con segundo ejemplo distinto → `exampleIndex=1`. | Devuelve la alternativa del mismo tema. |
| Alternativa ausente | Fuente sin segundo ejemplo → `exampleIndex=1`. | HTTP 409; no se invoca al proveedor. |

Las pruebas usan fuentes y autorizaciones **sintéticas**. El catálogo real sigue sin fuentes docentes aprobadas (AP-314/AP-316), así que la ruta pública de explicación no entrega estos ejemplos. La clave de IA todavía no se ha configurado. AP-139 y AP-146 tienen artefacto de diseño y prueba completa; las historias estudiantiles y las tareas de publicación mantienen trabajo pendiente.

## Desarrollo y verificación

La valoración «me ayudó / sigo confundido» y una pregunta breve tienen un recorrido de demostración. La comprobación usa respuesta de referencia y no califica arbitrariamente cuando falta. El recorrido con cuenta de estudiante requiere AP-304 y contenido revisado. El adaptador de sesión estudiantil cubre con datos sintéticos inicio, rechazo genérico, límite de intentos, expiración, cierre y separación de cuentas; las rutas públicas devuelven 503 hasta completar la autorización y el verificador independiente.

## Pruebas integradas

- `npm.cmd test`: **85/85** pruebas aprobadas, incluidos nivel G01–G11, ejemplo alternativo, bloqueo de texto inventado, valoración por cuenta adulta, pregunta sin referencia, autenticación sintética y rutas estudiantiles cerradas.
- `npm.cmd run lint` y `npm.cmd run build`: correctos.
- `npm.cmd run test:browser` con cuentas adultas habilitadas en un servidor local de prueba: recorrido de grados, diagnóstico, explicación, valoración y práctica correcto. Se detectó y corrigió una carrera: la valoración pulsada durante la carga anterior podía desaparecer; ahora los botones esperan la carga. `npm.cmd run test:diagnostic-browser`: correcto.

## Estado de Jira al cierre de esta revisión

Se conservaron las **25 incidencias principales** del sprint restaurado id 42: **8 Listo y 17 En curso**. Las seis ya terminadas de práctica permanecen Listo; se cerraron AP-139 y AP-146 porque sus especificaciones y casos están verificados. Las 26 subtareas de las 13 tareas abordadas están en **4 Listo y 22 En curso**. En las cuatro cerradas se marcaron todas las casillas; en las demás solo la preparación comprobada, con las actividades de publicación pendientes sin marcar. Se registraron las entradas, resultados y límites en Jira sin mover incidencias fuera del sprint.

Para terminar las historias de explicación y comprobación se necesitan fuentes y preguntas revisadas por grado/tema (AP-314/AP-316), un diagnóstico publicado que las use y una prueba del proveedor con clave del servidor. Para abrir cuentas de estudiantes faltan el documento de autorización y el método independiente de verificación del representante (AP-304), completar AP-257 e integrar las sesiones/progreso reales. Una conformidad verbal no reemplaza esos artefactos. El sprint restaurado conserva el estado futuro y no se ha declarado cerrado.
