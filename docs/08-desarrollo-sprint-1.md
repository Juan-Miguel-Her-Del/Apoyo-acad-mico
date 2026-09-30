# Desarrollo del Sprint 1

**Estado al 30 de septiembre de 2026:** Sprint 1 activo; selector técnico y datos de demostración implementados y verificados localmente. La publicación curricular sigue pendiente de revisión docente. Fuente de alcance: historias AP-10, AP-17, AP-24 y AP-31 y sus tareas en Jira. La versión MVP tiene fecha objetivo 10 de noviembre de 2026.

## Decisiones vigentes

- Estructura colombiana: Primaria 1.º–5.º y Bachillerato 6.º–11.º; se conserva el subciclo formal básica secundaria 6.º–9.º y media 10.º–11.º.
- Matemáticas y Español son materias candidatas en 1.º–11.º; Física y Química en 10.º–11.º.
- El catálogo propone 26 temas basados en DBA. El piloto tiene seis combinaciones: G05-MAT, G05-ESP, G10-MAT, G10-ESP, G10-FIS y G10-QUI.
- La aplicación de Sprint 1 usa esas seis combinaciones como **datos de demostración**. Ningún tema se considera aprobado ni publicado para estudiantes hasta revisión docente, explicación y banco de preguntas validados.
- Los once grados aparecen en la interfaz; los nueve sin contenido piloto muestran «Próximamente». Cambiar grado borra materia y tema; cambiar materia borra tema.

## Incremento implementado

El código está en `web/src/lib/catalog.ts`, `web/src/lib/selection.ts` y `web/src/app/`. La pantalla consulta `/api/catalog`, permite recorrer los tres pasos, muestra la elección final y tiene estados de carga, vacío, error y reintento. La consulta descarta respuestas tardías; una selección incompatible o inactiva no se considera válida. El diagnóstico, las cuentas, la persistencia y la IA pertenecen a trabajos posteriores y aún no están implementados. El [README principal](../README.md) documenta cómo ejecutarlo y qué archivos leer.

## Orden de trabajo en Jira

1. Registrar en Jira el código y las cinco pruebas automáticas de catálogo, publicación y selección incompatible.
2. Revisar manualmente en navegador la interacción y los estados de error y vacío.
3. Pedir a una persona docente que revise cada uno de los seis temas y sus DBA. Antes de publicar, crear y validar explicaciones y bancos de preguntas. La compilación local no demuestra aprobación curricular.

## Ejecución local

Desde `web/`: `npm.cmd install`, `npm.cmd run dev`, abrir `http://localhost:3000`. Verificación: `npm.cmd test`, `npm.cmd run lint` y `npm.cmd run build`. El 30 de septiembre pasaron cinco pruebas, lint y build; la API local devolvió HTTP 200 para combinaciones válidas y 400 para una materia incompatible.

## Riesgo de plazo

El MVP vigente abarca 21 historias estimadas en 99 puntos. La capacidad declarada es de 20 horas por semana. Se debe recalibrar el plan con la velocidad real de este sprint antes de tratar el 10 de noviembre como compromiso de entrega.
