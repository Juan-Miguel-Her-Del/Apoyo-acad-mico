# Apoyo_academico

Este repositorio corresponde únicamente al proyecto Jira **AP — Apoyo_academico**. Si una tarea menciona una incidencia, consulta su descripción y estado actuales antes de cambiar código o marcar actividades.

Para trabajo del Sprint 2, consulta [docs/09-agentes-skills-sprint-2.md](docs/09-agentes-skills-sprint-2.md). El sprint combina diagnóstico (AP-52 y relacionadas) con consentimiento para menores (AP-304 y relacionadas). Mantén separadas las funciones de demostración y las rutas destinadas a estudiantes.

Los seis temas piloto siguen sin aprobación curricular. No cambies `approvedForPublication`, `explanationApproved` ni `validatedQuestionCount` para hacer pasar un flujo o una prueba. La revisión y los bancos aprobados se siguen en AP-314.

Para cambios en `web/`, sigue también [web/AGENTS.md](web/AGENTS.md), que exige consultar la documentación de la versión instalada de Next.js. Desde `web/`, usa `npm.cmd test`, `npm.cmd run lint` y `npm.cmd run build` según el riesgo del cambio. La prueba de Chrome requiere un servidor local y se documenta en [README.md](README.md).

Al actualizar Jira, marca casillas y estados solo con evidencia de los criterios cumplidos. Si una incidencia depende de contenido, decisiones legales o servicios aún ausentes, documenta esa dependencia en vez de inventar aprobaciones.
