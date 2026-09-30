# Desarrollo del Sprint 1

**Estado:** Sprint 1 activo; primer incremento local implementado. Fuente de alcance: historias AP-10, AP-17, AP-24 y AP-31 y sus tareas en Jira. La versión MVP tiene fecha objetivo 10 de noviembre de 2026.

## Decisiones vigentes

- Estructura colombiana: Primaria 1.º–5.º y Bachillerato 6.º–11.º; se conserva el subciclo formal básica secundaria 6.º–9.º y media 10.º–11.º.
- Matemáticas y Español son materias candidatas en 1.º–11.º; Física y Química en 10.º–11.º.
- El catálogo propone 26 temas basados en DBA. El piloto tiene seis combinaciones: G05-MAT, G05-ESP, G10-MAT, G10-ESP, G10-FIS y G10-QUI.
- La aplicación de Sprint 1 usa esas seis combinaciones como **datos de demostración**. Ningún tema se considera aprobado ni publicado para estudiantes hasta revisión docente, explicación y banco de preguntas validados.
- Los once grados aparecen en la interfaz; los nueve sin contenido piloto muestran «Próximamente». Cambiar grado borra materia y tema; cambiar materia borra tema.

## Incremento implementado

El código está en `web/src/lib/catalog.ts` y `web/src/app/`. El selector permite recorrer los tres pasos y muestra la elección final. El diagnóstico, las cuentas, la persistencia y la IA pertenecen a trabajos posteriores y aún no están implementados.

## Orden de trabajo en Jira

1. Revisar el catálogo y el selector con AP-11, AP-18 y AP-25.
2. Verificar AP-10, AP-17, AP-24 y AP-31: grado habilitado, materia correcta, tema compatible y limpieza de selecciones al cambiar el contexto.
3. Registrar evidencia en las subtareas correspondientes antes de marcarlas como terminadas. La compilación local no demuestra por sí sola que el contenido curricular esté aprobado.

## Ejecución local

Desde `web/`: `npm.cmd install`, `npm.cmd run dev`, abrir `http://localhost:3000`. Verificación: `npm.cmd run lint` y `npm.cmd run build`.

## Riesgo de plazo

El MVP vigente abarca 21 historias estimadas en 99 puntos. La capacidad declarada es de 20 horas por semana. Se debe recalibrar el plan con la velocidad real de este sprint antes de tratar el 10 de noviembre como compromiso de entrega.
