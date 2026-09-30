# Arquitectura: estado y propuesta

> **Actualización, 30 de septiembre de 2026:** ya existe `web/`, una aplicación Next.js con TypeScript y el selector del Sprint 1. El resto de este documento describe la propuesta anterior al inicio del código. Para el estado vigente consulta [Desarrollo del Sprint 1](08-desarrollo-sprint-1.md) y Jira AP.

## Estado actual

No hay frontend, backend, base de datos, API, integración con IA, autenticación, configuración de entorno ni despliegue en este repositorio. El responsable confirmó que el desarrollo aún no comenzó. Por ello, el siguiente diagrama representa **un flujo lógico propuesto**, no componentes existentes ni tecnologías seleccionadas.

~~~mermaid
flowchart LR
    Estudiante --> Interfaz["Interfaz educativa (propuesta)"]
    Interfaz --> Catalogo["Catálogo de grados, materias y temas (por definir)"]
    Interfaz --> Diagnostico["Diagnóstico y análisis de respuestas (propuestos)"]
    Diagnostico --> Dificultad["Identificación de subtemas difíciles (propuesta)"]
    Dificultad --> Explicacion["Generación o selección de explicación (propuesta)"]
    Explicacion --> IA["Servicio de IA (proveedor por definir)"]
    Explicacion --> Revision["Revisión de calidad (propuesta)"]
    Explicacion --> Practica["Práctica y resumen (propuestos)"]
    Practica --> Estudiante
    Diagnostico -. datos .-> Persistencia["Persistencia (por definir)"]
    Practica -. datos .-> Persistencia
~~~

La dirección precisa de llamadas, separación de procesos y almacenamiento se decidirá después de escoger tecnología y requisitos de privacidad. El diagrama ilustra dependencias funcionales inferidas de [AP-10](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-10), [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52), [AP-100](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-100), [AP-128](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-128), [AP-180](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-180) y [AP-201](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-201).

## Decisiones abiertas

| Elemento | Estado | Decisión requerida |
|---|---|---|
| Frontend | NO IMPLEMENTADO | Plataforma, accesibilidad, navegadores y diseño |
| Backend y API | NO IMPLEMENTADO | Responsabilidades, contratos y manejo de errores |
| Base de datos y almacenamiento | NO IMPLEMENTADO | Necesidad de persistencia en MVP, esquema y retención |
| IA | NO IMPLEMENTADO | Proveedor o alternativa, límites, privacidad y evaluación |
| Autenticación y autorización | NO IMPLEMENTADO | Si se incluye en MVP, roles y protección de datos |
| Variables de entorno | NO IMPLEMENTADO | Configuración y manejo de secretos al iniciar código |
| Despliegue | NO IMPLEMENTADO | Entorno piloto, monitoreo y respaldo |
| Dependencias externas | NO VERIFICADO | Definir tras seleccionar arquitectura |

Una demostración del MVP podría usar datos piloto sin cuentas; en ese caso, el progreso se limita a la sesión y debe describirse así. Si se promete progreso entre sesiones, habrá que incluir identidad y persistencia con criterios explícitos. Esa decisión está **[PENDIENTE DE DEFINIR]**.

## Riesgos técnicos por resolver

- La calidad de las explicaciones depende de la selección de contenido, del servicio de IA y de revisión humana.
- El diagnóstico necesita reglas de puntuación y asociación entre preguntas y subtemas antes de implementarse.
- El tratamiento de datos de estudiantes, especialmente menores, requiere definición antes de una prueba con usuarios reales.
- El costo y la disponibilidad de servicios externos pueden limitar el piloto.
