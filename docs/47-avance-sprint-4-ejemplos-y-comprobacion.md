# Avance del Sprint 4: ejemplos, valoración y comprobación

**Proyecto:** AP — Apoyo_academico. **Sprint original de Jira:** 42. **Fecha:** 7 de noviembre de 2026.

Este avance conserva las 25 incidencias del Sprint 4. Las historias y tareas que exigen contenido aprobado o cuentas estudiantiles reales permanecen abiertas hasta contar con esa evidencia. El contenido de esta entrega es un borrador para probar el recorrido; no se marca como validado por un docente.

## Lo desarrollado

- **AP-152, AP-153 y AP-156 — otro ejemplo:** las seis combinaciones piloto (Matemáticas y Español de 5.º; Matemáticas, Español, Física y Química de 10.º) tienen un segundo ejemplo en cada una de sus tres partes de estudio. Se puede alternar desde la explicación posterior al diagnóstico. El segundo ejemplo debe corresponder al mismo subtema y diferir del primero. Para los demás temas, la API devuelve `409` cuando no existe alternativa y no gasta una llamada a Gemini.
- **AP-159, AP-160 y AP-163 — valoración:** cada subtema y variante de ejemplo tiene una identificación propia. Una cuenta adulta puede marcar «me ayudó» o «sigo confundido» y recuperar esa valoración sin sobrescribir la del otro ejemplo. Se conserva la identificación anterior para datos ya guardados.
- **AP-166, AP-167 y AP-170 — comprobación breve:** cada parte piloto contiene una pregunta corta y una respuesta de referencia, asociadas a la explicación que se muestra. La interfaz permite comparar respuestas sin asignar una calificación académica arbitraria. Son preguntas de borrador.
- **AP-138/142 y AP-145/149 — adaptación y ejemplo:** el recorrido aprovecha las reglas por grado y la validación del texto fuente ya implementadas. El segundo ejemplo se envía como fragmento de un borrador identificado; el servidor comprueba tema, subtema, índice y versión antes de aceptar la respuesta del proveedor.
- **AP-267/268/271/274 — sesión estudiantil:** siguen disponibles las pruebas internas con datos ficticios para aislamiento, vencimiento, cierre y reingreso. Las rutas para menores reales continúan cerradas mientras no se cumplan AP-257 y AP-304.

## Cómo probarlo

Desde `web/`, ejecuta `npm.cmd run dev` y abre `http://localhost:3000`. Inicia sesión con una cuenta adulta, escoge uno de los seis temas piloto y realiza el diagnóstico hasta que aparezca una explicación por dificultad. Pulsa **Ver otro ejemplo**, responde la comprobación y marca si la explicación te ayudó. Vuelve al primer ejemplo y comprueba que la valoración de cada uno se conserva por separado. En temas fuera del piloto se informa que aún no hay otro ejemplo.

`npm.cmd test` aprobó **111/111** pruebas. `npm.cmd run lint`, `npm.cmd run build` y el recorrido automatizado en navegador pasaron. La prueba directa `npm.cmd run check:gemini -- --alternate` terminó en `fetch failed` desde este entorno, por lo que la respuesta real del proveedor para la alternativa no quedó verificada aquí; el recorrido local usa el borrador cuando Gemini no responde.

## Para cerrar el Sprint 4 en Jira

1. Incorporar explicaciones, ejemplos alternativos, preguntas y soluciones **revisadas** para las combinaciones y subtemas que se vayan a publicar. Registrar la fuente, versión y decisión curricular en AP-314/AP-316. Una conformidad verbal o un borrador no prueban esa revisión.
2. Repetir los casos de AP-138/145/152/159/166 con material publicado, una cuenta estudiantil autorizada y evidencia de uso; verificar nivel, correspondencia del concepto, ausencia de duplicados, persistencia y comparación con referencia.
3. Cerrar AP-304/AP-257 con documentos jurídicos definitivos, verificación del representante y pruebas de seguridad antes de activar AP-267/268/271/274 para menores reales.
4. Probar la ruta real de Gemini con conexión disponible y la clave configurada solo en servidor; documentar el resultado sin enviar datos personales.

No se cambian los estados de esas incidencias a **Listo** con esta entrega porque sus criterios completos aún requieren las evidencias anteriores.
