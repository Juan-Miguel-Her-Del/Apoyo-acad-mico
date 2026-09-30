# Presentación del proyecto: Apoyo_academico

**Versión de planificación — 30 de septiembre de 2026.** Este texto sirve como base para exposición o diapositivas. Los datos no definidos se señalan expresamente. Fuente principal: [Jira AP](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP) y documentación de este repositorio.

## 1. Nombre del proyecto

**Apoyo_academico.** Nombre final y marca: **[PENDIENTE DE DEFINIR]**.

## 2. Problema

La propuesta aborda la necesidad de detectar dificultades en temas escolares y ofrecer apoyo de estudio acorde con ellas. La formulación exacta del problema, su magnitud y evidencia empírica local están **[PENDIENTE DE DEFINIR]**.

## 3. Contexto

El backlog describe un recorrido de selección de contenido, diagnóstico, explicación, práctica y progreso. Institución, país de aplicación, grados y materias piloto: **[PENDIENTE DE DEFINIR]**. No se ha validado aún el problema con estudiantes.

## 4. Población beneficiaria

Estudiantes que necesiten apoyo en los contenidos seleccionados. Edad, características, tamaño de muestra y criterios de inclusión: **[PENDIENTE DE DEFINIR]**. Si participan menores, se definirá el tratamiento de datos y consentimiento antes del piloto.

## 5. Justificación

Una intervención guiada por diagnóstico podría ayudar a concentrar el estudio en dificultades específicas. Este beneficio es una hipótesis a evaluar; todavía no hay resultados de aprendizaje.

## 6. Objetivo general

Construir y evaluar un prototipo que permita recorrer selección académica, diagnóstico, identificación de dificultad, explicación adaptada y práctica para un contenido piloto definido.

## 7. Objetivos específicos

Definir un catálogo piloto; comprobar un diagnóstico trazable a subtemas; evaluar la calidad de explicaciones; completar una sesión de práctica; conservar evidencia reproducible de pruebas. Metas numéricas y umbrales: **[PENDIENTE DE DEFINIR]**.

## 8. Solución propuesta

El estudiante elegiría contexto académico, respondería preguntas, conocería dificultades, recibiría una explicación adecuada a su nivel y practicaría. El flujo detallado figura en [descripción](01-descripcion-proyecto.md).

## 9. Arquitectura

Hay un [diagrama lógico propuesto](02-arquitectura.md) con interfaz, catálogo, diagnóstico, análisis, explicación, IA, revisión y práctica. No existe arquitectura implementada: todavía deben elegirse componentes, contratos y almacenamiento.

## 10. Funcionalidades del MVP

La propuesta incluye 15 historias inequívocas: selección y filtrado; diagnóstico; detección de dificultad; explicación adaptada con ejemplo; práctica y resumen; revisión mínima de calidad de IA. Siete historias requieren decisión de alcance, especialmente progreso entre sesiones, cuentas y protección de menores. Véase [alcance MVP](03-alcance-mvp.md).

## 11. Tecnologías

Jira organiza el backlog y Markdown documenta la planificación. Lenguajes, frameworks, base de datos, proveedor de IA y entorno de despliegue: **[PENDIENTE DE DEFINIR]**.

## 12. Estado actual

Planificación en marcha: 9 épicas, 40 historias, 88 tareas y 176 subtareas. Desarrollo de aplicación: **NO IMPLEMENTADO**. No hay pruebas de software ni despliegue. Esto corresponde a la fase actual declarada por el responsable.

## 13. Cronograma

Jira tiene seis sprints semanales hasta aproximadamente el 10 de noviembre de 2026 para un desarrollador con unas 20 h/semana. La estimación preliminar de historias es 340 h; el MVP inequívoco suma 130 h, más 24 h de arranque propuestas. El [análisis de capacidad](estimaciones.md) recomienda revisar alcance o extender el calendario antes de asumir una entrega completa en seis semanas. Los sprints de Jira no se modificaron.

## 14. Evidencias

Evidencia actual: backlog, sprints y estos documentos de planificación. Evidencia técnica de software, resultados de pruebas, evaluación de IA y piloto: pendiente. El [registro de evidencias](06-evidencias.md) establece qué adjuntar durante el desarrollo.

## 15. Estrategia de pruebas

Se convertirán los [criterios de aceptación](criterios-aceptacion.md) en pruebas unitarias, de integración y de recorrido completo tras elegir tecnologías. Se priorizarán cálculo diagnóstico, flujo principal, errores de IA y datos. Pruebas ejecutadas hasta hoy: 0; ver [pruebas](pruebas.md).

## 16. Validación de IA

Se propone una rúbrica de 1 a 5 para exactitud, relevancia, claridad, nivel educativo, seguridad, consistencia y utilidad, con revisión humana y casos representativos. No hay respuestas evaluadas ni resultados. Véase [plan de validación](04-plan-validacion.md).

## 17. Costos

No hay proveedor ni presupuesto elegido. Hosting, base de datos, almacenamiento, IA, dominio y observabilidad figuran como **PRECIO POR VERIFICAR**. El [plan de costos](05-costos.md) explica cómo calcular escenarios después de escoger el stack.

## 18. Riesgos

Capacidad insuficiente para todas las historias en seis semanas; criterios de negocio incompletos; calidad de respuestas IA; definición de población y privacidad; dependencia de contenido educativo y servicios externos. Las medidas iniciales son limitar el piloto, validar criterios, reservar capacidad y registrar evaluación de IA.

## 19. Próximos pasos

1. Precisar problema, población, grados, materias y contenido piloto.
2. Resolver las siete historias POR DEFINIR y alinear etiquetas de Jira.
3. Revisar estimaciones con tareas y ajustar el cronograma sin ocultar trabajo.
4. Elegir arquitectura y construir el primer recorrido vertical.
5. Añadir pruebas, evaluación de IA y evidencia técnica a cada historia completada.

## 20. Conclusiones

Apoyo_academico tiene una planificación funcional detallada y un objetivo demostrable. Su viabilidad depende de cerrar decisiones de alcance y adaptar el calendario a la capacidad disponible. La aplicación aún no está desarrollada; la presentación debe mostrar con claridad la propuesta, las estimaciones, los riesgos y el método previsto para producir evidencia.
