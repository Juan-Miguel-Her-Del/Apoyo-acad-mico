# Renovación del recorrido y auditoría de acciones

Fecha: 3 de noviembre de 2026.

## Problemas encontrados

| Pantalla anterior | Hallazgo | Cambio |
|---|---|---|
| Estudiar | El encabezado, el resumen y las opciones de cambio de grado o tema repetían información mientras se hacía un diagnóstico o se estudiaba. | Se muestra una selección compacta y se conserva la ruta de grado, materia y tema para volver directamente a cada paso. |
| Lección | Explicación, valoración, pregunta breve, práctica guardada y prueba sin cuenta aparecían en un mismo bloque largo. | La explicación, la comprobación y la práctica se abren en pasos distintos. La cuenta usa la comprobación con seguimiento; la vista previa usa la pregunta rápida. |
| Mi progreso | Historial diagnóstico, historial de práctica, comparación y gráficas compartían una página extensa. | La portada muestra el siguiente paso y la racha. Tres tarjetas abren Diagnósticos, Prácticas y Evolución por separado. |
| Cuenta | El formulario del perfil y la eliminación aparecían juntos. | Datos y seguridad abre una pantalla propia con privacidad, términos y eliminación. |
| Registro de menores | Una maqueta enseñaba «Crear cuenta para menor» como botón deshabilitado, sin acción disponible. | Se retiró la maqueta. El selector de menor muestra el estado del registro y un enlace funcional a privacidad. |

## Recorrido actual

1. Bienvenida: iniciar sesión, crear cuenta adulta o explorar la vista previa.
2. Estudiar: escoger grado en la vista previa; con cuenta se usa el grado del perfil. Después se elige materia y tema.
3. Diagnóstico: comenzar, responder y ver el resumen.
4. Lección: leer explicación y ejemplo.
5. Comprobación: con cuenta se puede valorar la explicación y responder la pregunta breve; sin cuenta se usa una pregunta rápida no guardada.
6. Práctica: con cuenta se realizan rondas que guardan el resultado.
7. Mi progreso: abrir cada pantalla de resultados desde la portada y volver a ella con «Volver a mi progreso».
8. Cuenta: editar el perfil o abrir «Datos y seguridad».

Se revisaron los botones visibles de las pantallas principales: selección, navegación, diagnóstico, estudio, progreso y cuenta. Las acciones de avance y regreso cambian de pantalla; los reintentos ejecutan una carga; las acciones de cuenta invocan su ruta correspondiente. Los botones deshabilitados indican una condición real (por ejemplo, no hay respuesta seleccionada o el registro por correo aún no está configurado). El botón de registro de menores sin acción se eliminó. La cuenta de menor sigue bloqueada hasta completar sus requisitos jurídicos y técnicos.

## Comprobación

- `npm.cmd run lint`
- `npm.cmd test`
- `npm.cmd run build`
- `BROWSER_TEST_ACCOUNTS=true; npm.cmd run test:browser` con servidor local de prueba en el puerto 3100 y base SQLite separada. El recorrido cubre cuenta, vista previa, diagnósticos, práctica, progreso, eliminación, navegación y ancho móvil de 390 px.

El contenido académico sigue marcado como provisional. Este cambio de interfaz no concede revisión docente ni aprobación jurídica.
