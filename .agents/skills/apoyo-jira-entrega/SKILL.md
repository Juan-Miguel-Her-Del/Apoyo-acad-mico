---
name: apoyo-jira-entrega
description: Implementar o verificar una incidencia Jira AP de Apoyo_academico, conservando trazabilidad entre código, pruebas, casillas y estado del sprint.
---

# Entrega de una incidencia AP

Úsalo cuando el usuario pida desarrollar, revisar o cerrar una historia, tarea o subtarea del proyecto **AP**. Consulta la incidencia vigente y sus dependencias; el Sprint 2 está en el tablero AP, pero su alcance puede cambiar. No extiendas este flujo a otros proyectos Jira.

1. Resume el criterio observable, la relación con otras incidencias y qué dato o decisión falta. Distingue el prototipo de la publicación para estudiantes. En el Sprint 2, AP-314 sigue siendo la puerta curricular y AP-56 la integración con diagnóstico.
2. Haz el cambio más pequeño que cumpla el criterio. En `web/`, lee la guía relevante de `node_modules/next/dist/docs/` antes de tocar Next.js. Usa identificadores estables de grado, materia y tema; no sustituyas aprobaciones con fixtures.
3. Verifica el caso principal y un caso límite que realmente pueda fallar. Para cambios que afecten más de una capa, añade una prueba de la interacción o del contrato HTTP además de las pruebas de lógica. Ejecuta lint y build cuando el cambio lo requiera.
4. Registra en Jira ruta o commit, entrada de prueba, resultado esperado y observado, y defectos pendientes. Marca cada casilla solo cuando la actividad ocurrió. Mueve a «Listo» únicamente las incidencias cuyo criterio completo esté satisfecho.

Si el trabajo necesita aprobación curricular, jurídica o publicación, prepara la evidencia y deja visible la decisión pendiente. No conviertas una prueba técnica en aprobación de contenido.
