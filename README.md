# Apoyo_academico

Proyecto de apoyo académico personalizado para estudiantes de Colombia. El MVP previsto permite elegir grado, materia y tema; realizar un diagnóstico; identificar dificultades; recibir una explicación adaptada; practicar y consultar el progreso con una cuenta.

El alcance vigente se mantiene en [Jira AP](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP). El código de la aplicación web está en [`web/`](web/). Los documentos anteriores a este inicio pueden contener propuestas históricas; consulta [el plan actual del Sprint 1](docs/08-desarrollo-sprint-1.md).

## Estado al 30 de septiembre de 2026

- Planificación: 9 épicas, 40 historias, 88 tareas y 176 subtareas en Jira.
- Desarrollo: iniciado. Existe una aplicación Next.js con el selector de grado → materia → tema y datos de demostración.
- Verificación local: compilación de producción, lint y comprobación de la matriz curricular correctas. Despliegue no iniciado.
- Equipo: una persona, disponibilidad aproximada de 20 horas por semana.
- Horizonte de Jira: seis sprints hasta el 10 de noviembre de 2026. Esa fecha es un objetivo con riesgo de capacidad, no una entrega garantizada.

## Documentación

Comienza en el [índice de documentación](docs/README.md). La [presentación](docs/presentacion-proyecto.md) ofrece una base para exposición académica.

## Ejecución

Requiere Node.js 20.9 o superior. En Windows PowerShell, usa `npm.cmd` porque la política local puede bloquear `npm.ps1`.

```powershell
cd web
npm.cmd install
npm.cmd run dev
```

Abre `http://localhost:3000`. Para verificar: `npm.cmd run lint` y `npm.cmd run build`. La pantalla actual es un prototipo del Sprint 1: los temas aún requieren revisión docente y el diagnóstico no está implementado.
