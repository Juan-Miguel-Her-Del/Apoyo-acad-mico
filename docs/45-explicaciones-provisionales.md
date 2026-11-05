# Explicaciones provisionales tras el diagnóstico

**Fecha:** 5 de noviembre de 2026. A petición del titular, el flujo de demostración permite estudiar con el material disponible sin esperar la revisión docente. No se modificaron las banderas de publicación ni se atribuyó aprobación a un docente.

## Recorrido

En un perfil ficticio o una cuenta de mayor de edad, el diagnóstico de prueba muestra una tarjeta de explicación al identificar una señal de dificultad en un subtema. La tarjeta incluye un fragmento y ejemplo del borrador local relacionados con ese subtema. El contenido permanece visible si Gemini falla.

La consulta opcional «Ver una versión breve con Gemini» usa el mismo borrador y pide fragmentos literales; no solicita una respuesta libre ni envía respuestas, nombre, correo o perfil. El servidor comprueba que el subtema pertenezca al banco de ese tema, limita las peticiones, verifica IDs y que los textos devueltos estén en la fuente. La interfaz rotula el contenido como borrador sin revisión docente.

El botón de Gemini aparece cuando `GEMINI_API_KEY` y `APOYO_ENABLE_PROVISIONAL_AI=true` están configurados en `web/.env.local`. La bandera se habilitó en el entorno local de desarrollo. Para otras instalaciones debe configurarse de forma explícita. La ruta revisada para contenido aprobado (`/api/explanation`) conserva sus requisitos originales y sigue cerrada para el catálogo provisional.

## Verificación y límite observado

- 107 pruebas unitarias, lint y build aprobados; las pruebas cubren los 26 temas, validación de subtema, respuesta literal, campos extra, estado provisional enviado a Gemini y error del proveedor.
- Prueba en Chrome aprobada: dos respuestas incorrectas del mismo subtema muestran la tarjeta provisional y su ejemplo en un perfil ficticio.
- La prueba directa `npm.cmd run check:gemini` confirmó una respuesta real válida con la clave configurada. Solicitudes posteriores devolvieron HTTP 503 del proveedor; por ello la consulta en la interfaz no se considera establecida de extremo a extremo. La explicación local permanece disponible.

Para cerrar AP-128, AP-129 y AP-135 según el alcance original todavía falta una fuente curricular aprobada y verificable, el diagnóstico publicado y una evaluación de calidad de la salida real. La decisión de usar borradores para la demostración no cambia esos criterios en Jira.
