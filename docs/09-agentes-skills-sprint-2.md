# Agentes y skills para el Sprint 2

Estas configuraciones son **locales al repositorio**. Preparan a Codex para trabajar en Apoyo_academico; no inician el sprint ni implementan por sí solas las historias. El Sprint 2 de Jira AP se planificó del **6 al 12 de octubre de 2026** y se [cerró el 8 de octubre como demostración](14-cierre-sprint-2.md), con pendientes explícitos de diagnóstico y consentimiento para menores.

## Agentes disponibles

| Agente | Cuándo usarlo | Archivo |
| --- | --- | --- |
| `apoyo_diagnostico` | Implementar AP-52, AP-53, AP-56 y el flujo de preguntas, respuestas y avance. | [Configuración](../.codex/agents/apoyo-diagnostico.toml) |
| `apoyo_consentimiento` | Diseñar e implementar AP-304, AP-305, AP-308 y AP-311 con pruebas de autorización. | [Configuración](../.codex/agents/apoyo-consentimiento.toml) |
| `apoyo_revisor` | Revisar criterios, defectos y pruebas sin cambiar el código ni Jira. | [Configuración](../.codex/agents/apoyo-revisor.toml) |

Los agentes heredan el modelo y las conexiones de tu sesión de Codex. El revisor tiene acceso de solo lectura; los dos agentes de desarrollo usan los permisos de la sesión en la que los ejecutes. Cada uno trabaja únicamente en la tarea que le asignes.

## Skills disponibles

| Skill | Para qué sirve |
| --- | --- |
| [`$apoyo-jira-entrega`](../.agents/skills/apoyo-jira-entrega/SKILL.md) | Pasar de una incidencia AP a código, pruebas y evidencia en Jira. |
| [`$apoyo-diagnostico`](../.agents/skills/apoyo-diagnostico/SKILL.md) | Mantener coherentes banco de preguntas, validación de tema y resultados del diagnóstico. |
| [`$apoyo-consentimiento-menores`](../.agents/skills/apoyo-consentimiento-menores/SKILL.md) | Diseñar controles de autorización y pruebas con datos sintéticos. |

Los skills están en `.agents/skills/`, así que Codex puede encontrarlos al abrir este repositorio. Puedes invocarlos por nombre con `$` o dejar que Codex elija uno cuando la tarea coincida.

## Cómo usarlos

Abre **Proyecto_Academico** como carpeta de trabajo en Codex. Si usas la terminal:

```powershell
cd "C:\Users\JUAN M\OneDrive\Desktop\Proyecto_Academico"
codex
```

Prueba solicitudes concretas:

> Usa el agente `apoyo_consentimiento` y el skill `$apoyo-consentimiento-menores` para preparar AP-305. Muéstrame el flujo y los criterios pendientes de revisión antes de implementar el registro.

> Usa el agente `apoyo_diagnostico` y el skill `$apoyo-diagnostico` para diseñar AP-53 con preguntas de demostración claramente separadas del contenido publicable.

> Usa el agente `apoyo_revisor` para revisar el cambio de AP-56 contra sus criterios y señalar pruebas faltantes, sin editar archivos.

En Codex CLI, `/agent` permite ver los hilos de agentes activos. Si los agentes nuevos no aparecen en una sesión que ya estaba abierta, inicia una sesión nueva desde la raíz del repositorio. Los skills suelen detectarse al cambiar los archivos; si no aparecen, reinicia Codex.

## Límites que deben conservar

- El Sprint 1 dejó seis combinaciones como **demostración**; la revisión curricular para publicar está en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314).
- El diagnóstico real empieza en [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52) y su integración con el selector en [AP-56](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-56).
- El consentimiento de menores está en [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304); sus textos y reglas jurídicas necesitan verificación de fuentes oficiales y revisión especializada antes de publicar.
- Los agentes pueden revisar frentes independientes en paralelo. Para cambios de código, dales archivos o incidencias distintas a fin de evitar ediciones simultáneas sobre el mismo flujo.

Estas definiciones no requieren una clave de API adicional: usan la sesión de Codex que ya tienes. Tampoco modifican el estado de Jira hasta que pidas ejecutar una incidencia concreta.
