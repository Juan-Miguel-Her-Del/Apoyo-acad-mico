# Entrega académica de octubre — alcance de demostración

> **Nota posterior (15 de octubre de 2026):** el cierre descrito aquí fue una demostración. Las 20 incidencias originalmente planificadas para el Sprint 3 se restauraron en un sprint futuro separado, id 41. Véase la [auditoría actual de sprints](23-auditoria-alcance-sprints.md).

**Actualizado:** 14 de octubre de 2026. El Sprint 3 de Jira se activó y se cerró el 14 de octubre, antes del cierre planificado para el 19 de octubre. La entrega al profesor será el **20 de octubre de 2026**; el titular busca una demostración completa que también pueda presentar a posibles evaluadores de un fondo de emprendimiento.

## Decisión de producto

El titular consultó a su profesor y acordó que la revisión de contenido por docentes puede realizarse en una versión posterior. Para la entrega académica se prepara un **prototipo demostrable** con material señalado como provisional. Esta decisión permite avanzar en navegación, preguntas de ejemplo, explicaciones y práctica, pero no equivale a una aprobación curricular de esos materiales. Las banderas de publicación del catálogo se mantienen desactivadas.

El alcance visible buscado es Matemáticas y Español en 1.º–11.º, más Física y Química en 10.º–11.º: **26 combinaciones**. Jira [AP-315](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-315) registra la ampliación técnica, [AP-317](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-317) el estudio y la práctica provisional, y [AP-318](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-318) las cuentas persistentes para la demostración local. [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) conserva la revisión de las seis combinaciones iniciales, y [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316) registra la revisión posterior de las otras 20.

## Recorrido que debe poder mostrarse

1. Elegir grado, materia y tema válidos para cualquiera de las 26 combinaciones.
2. Responder un diagnóstico corto con preguntas provisionales y recibir retroalimentación.
3. Ver resultados por subtema con la regla provisional y el estado «indeterminado» si la evidencia no basta.
4. Leer una explicación y un ejemplo de demostración, responder una práctica corta y ver corrección.
5. Cambiar de tema o grado sin arrastrar las respuestas anteriores.
6. Crear e iniciar sesión con una cuenta de prueba de adulto/evaluador, guardar que se completó diagnóstico o práctica y comprobar que aparece tras una nueva sesión.

La demostración local puede tener cuentas persistentes de adultos/evaluadores con datos de prueba y guardar **finalización**, no una calificación académica. El usuario hará la presentación personalmente, sin registrar menores reales. El registro de estudiantes menores sigue dependiendo de [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y de las decisiones de privacidad; [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) quedó en el backlog hasta resolverlo. No se pedirá foto de documento ni fecha de nacimiento completa en el prototipo: la verificación futura del representante y el aviso necesitan un diseño revisado. Los resultados se presentan como ejemplos, sin afirmar que diagnostican académicamente a un estudiante.

## Criterios para cerrar Jira sin exagerar el resultado

- Guardar evidencia de ejecución de pruebas, compilación y recorrido en navegador para primaria, secundaria y media.
- Marcar las actividades de AP-315/AP-317/AP-318 solo cuando estén verificadas. Dejar AP-314, AP-316, AP-304, AP-257 y las historias de diagnóstico/IA publicados abiertas mientras no cumplan sus criterios.
- Al cerrar el Sprint 3, mover lo pendiente al backlog o a un sprint posterior y dejar un registro de lo que la demo sí hace y de los límites.
- Preparar un README con comandos de PowerShell y un guion breve de presentación para que la entrega pueda repetirse sin ayuda del desarrollador.

## Evidencia de implementación al 14 de octubre

El catálogo de demostración contiene 26 combinaciones activas con 52 preguntas de diagnóstico, una explicación, un ejemplo y una pregunta de práctica por combinación. Las pruebas de la biblioteca cubren combinaciones válidas e inválidas, ausencia de banco, regla por subtema y bloqueo de publicación. `npm.cmd test`: **23/23**; `npm.cmd run lint`: sin errores; `npm.cmd run build`: correcto. El recorrido de Chrome cubrió primaria, secundaria y media, reintentos y respuestas tardías. Una segunda ejecución con `BROWSER_TEST_ACCOUNTS=true` verificó registro adulto, guardado de diagnóstico y práctica, persistencia tras recarga, cierre e inicio de sesión.

La base local requiere Node.js 24. Solo guarda correo, hash de contraseña, sesiones y finalización de actividades. La mayoría de edad se autodeclara; no existe una verificación de identidad ni consentimiento de representante. También faltan limitación de intentos y recuperación de contraseña para un servicio público. No habilitar cuentas de estudiantes reales ni publicar este entorno como servicio abierto.

## Cierre de Jira

El Sprint 3 quedó cerrado con **9/9 incidencias principales en Listo**: AP-100, AP-101, AP-104, AP-107, AP-108, AP-111, AP-315, AP-317 y AP-318. Las ocho subtareas de mapeo, cálculo y presentación por subtema también quedaron verificadas y cerradas. AP-128, AP-129, AP-132 y AP-135 salieron al backlog: la demostración estática no satisface sus criterios de generación y validación de explicaciones publicables. La revisión curricular AP-314/AP-316 y el consentimiento/registro de menores AP-304/AP-257 siguen abiertos.
