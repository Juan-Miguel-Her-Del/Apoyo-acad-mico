# Alcance del MVP

> **Actualización, 30 de septiembre de 2026:** la clasificación de esta tabla es histórica. La versión MVP vigente en Jira incluye 21 historias, cuentas y progreso entre sesiones; la fecha objetivo es el 10 de noviembre de 2026 y el piloto curricular cubre seis combinaciones. Consulta [Desarrollo del Sprint 1](08-desarrollo-sprint-1.md) y la versión en Jira.

**Estado:** propuesta para revisión, al 30 de septiembre de 2026. No hay software implementado. La clasificación considera el recorrido mínimo de selección → diagnóstico → dificultad → explicación adaptada → práctica → resumen, más una puerta de revisión de calidad para IA. Se basa en las 40 historias de Jira, sin modificar sus etiquetas.

**MVP propuesto:** 15 historias inequívocas; **POST-MVP:** 18; **POR DEFINIR:** 7. Las historias por definir dependen de decisiones de población, persistencia o contenido. Una historia en POST-MVP puede ser condición para un piloto con datos reales y pasar a MVP antes de ese piloto.

| Historia | Funcionalidad | Clasificación | Motivo | Dependencia | Evidencia para demostrarla |
|---|---|---|---|---|---|
| [AP-10](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-10) | Elegir nivel educativo | MVP | Base del catálogo; entrada del recorrido | Catálogo definido | Selección visible y válida |
| [AP-17](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-17) | Elegir materia | MVP | Delimita el contenido | AP-10 | Materia seleccionada |
| [AP-24](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-24) | Elegir tema | MVP | Delimita diagnóstico | AP-17 | Tema seleccionado |
| [AP-31](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-31) | Filtrar temas por nivel y materia | MVP | Evita contenido incompatible | AP-10, AP-17, AP-24 | Lista filtrada y cambio coherente |
| [AP-38](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-38) | Cambiar materia o tema | POST-MVP | Mejora navegación, no bloquea un recorrido | AP-17, AP-24 | Cambio repetido sin datos inconsistentes |
| [AP-45](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-45) | Recordar último tema | POST-MVP | Requiere persistencia entre sesiones | AP-24; almacenamiento | Recuperación tras nueva sesión |
| [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52) | Diagnóstico corto | MVP | Establece punto de partida | AP-24; preguntas piloto | Diagnóstico completado |
| [AP-62](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-62) | Aviso de diagnóstico sin nota | POR DEFINIR | Puede ser salvaguarda pedagógica básica; decidir con usuarios | AP-52 | Mensaje comprensible antes de iniciar |
| [AP-69](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-69) | Indicador de progreso del diagnóstico | POST-MVP | Mejora usabilidad, no es esencial al flujo | AP-52 | Contador correcto |
| [AP-76](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-76) | Responder diagnóstico | MVP | Produce datos para detectar dificultades | AP-52 | Respuestas registradas |
| [AP-83](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-83) | Dificultad adaptativa del diagnóstico | POST-MVP | La prueba fija permite validar la hipótesis inicial | AP-76 | Secuencia cambia según reglas |
| [AP-93](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-93) | Retroalimentación visual inmediata | POST-MVP | Puede esperar al cierre del diagnóstico | AP-76 | Indicación correcta tras responder |
| [AP-100](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-100) | Asociar respuestas con subtemas | MVP | Permite localizar dificultades | AP-76; mapa pregunta-subtema | Resultado trazable |
| [AP-107](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-107) | Mostrar subtemas difíciles | MVP | Expone resultado del diagnóstico | AP-100 | Lista consistente con respuestas |
| [AP-114](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-114) | Mostrar fortalezas | POST-MVP | Complementa el diagnóstico | AP-100 | Lista de fortalezas calculada |
| [AP-121](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-121) | Nivel de confianza | POST-MVP | Refinamiento del análisis | AP-100 | Cálculo reproducible |
| [AP-128](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-128) | Explicación del subtema | MVP | Intervención educativa principal | AP-107; contenido o IA | Explicación pertinente |
| [AP-138](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-138) | Adaptar explicación al nivel | MVP | Valor central de personalización | AP-10, AP-128 | Lenguaje evaluado para grado |
| [AP-145](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-145) | Incluir ejemplo concreto | MVP | Hace comprobable la explicación | AP-128 | Ejemplo correcto y pertinente |
| [AP-152](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-152) | Solicitar otro ejemplo | POST-MVP | Mejora interacción, no bloquea primera explicación | AP-145 | Segundo ejemplo diferente |
| [AP-159](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-159) | Valorar utilidad de explicación | POST-MVP | Instrumento de mejora posterior | AP-128 | Valoración registrada |
| [AP-166](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-166) | Pregunta corta tras explicación | POST-MVP | Se cubre con práctica inicial | AP-128, AP-180 | Respuesta evaluada |
| [AP-173](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-173) | Preguntas de práctica relacionadas | MVP | Conecta explicación con práctica | AP-128 | Preguntas del subtema |
| [AP-180](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-180) | Responder ejercicios | MVP | Demuestra actividad de práctica | AP-173 | Respuestas registradas |
| [AP-187](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-187) | Explicar acierto o error | POST-MVP | Retroalimentación enriquecida | AP-180 | Explicación correcta |
| [AP-194](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-194) | Dificultad gradual de práctica | POST-MVP | Optimización posterior | AP-180 | Dificultad cambia según reglas |
| [AP-201](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-201) | Resumen de sesión | MVP | Cierra el recorrido verificable | AP-180 | Aciertos y total correctos |
| [AP-208](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-208) | Otra ronda | POST-MVP | Repetición posterior | AP-201 | Nueva ronda independiente |
| [AP-215](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-215) | Banco amplio de preguntas | POR DEFINIR | Cantidad mínima piloto aún no fijada | AP-52, AP-173 | Cobertura y repetición medibles |
| [AP-222](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-222) | Dominio por subtema | POST-MVP | Requiere historial o cálculo adicional | AP-100, AP-180 | Dominio calculado |
| [AP-229](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-229) | Gráfica de progreso | POST-MVP | Presentación avanzada | AP-222 | Gráfica corresponde a datos |
| [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) | Progreso tras sesión | POR DEFINIR | Si exige comparación histórica requiere persistencia e identidad; MVP solo puede mostrar resumen de sesión | AP-201; decisión de persistencia | Comparación verificable o alcance reducido |
| [AP-243](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-243) | Recomendación de siguiente tema | POST-MVP | Recomendación adicional | AP-107, AP-222 | Recomendación trazable |
| [AP-250](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-250) | Racha de estudio | POST-MVP | Gamificación posterior | Persistencia | Racha calculada |
| [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) | Crear cuenta | POR DEFINIR | Depende de si el MVP guarda progreso entre sesiones | Identidad y protección de datos | Cuenta y datos asociados |
| [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267) | Iniciar sesión | POR DEFINIR | Misma decisión que AP-257 | AP-257 | Acceso restringido |
| [AP-277](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-277) | Recuperar contraseña | POST-MVP | Solo aplica con cuentas | AP-267 | Recuperación segura |
| [AP-284](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-284) | Eliminar cuenta y datos | POR DEFINIR | Obligatoria si se almacena información personal; decidir antes de piloto real | AP-257; política de datos | Eliminación verificada |
| [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) | Revisión de explicaciones IA | MVP | Control de calidad antes de demostrar IA | AP-128; rúbrica | Muestra evaluada y hallazgos registrados |
| [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) | Consentimiento de representante | POR DEFINIR | Condición previa si participan menores sujetos a consentimiento | AP-257; población objetivo | Autorización verificable |

## Condiciones de entrada y salida del MVP

Para iniciar: definir grado, materia y tema piloto; banco de preguntas con solución de referencia; reglas de asociación entre pregunta y subtema; forma de obtener explicaciones; población y tratamiento de datos. Todo ello está **[PENDIENTE DE DEFINIR]**. Si se usa IA generativa, AP-294 funciona como puerta de calidad aunque su épica tenga otra etiqueta.

El MVP estará demostrable cuando una persona complete el recorrido sin intervención del desarrollador y existan evidencia del resultado, pruebas del flujo y una muestra de explicaciones evaluadas. Los umbrales se fijarán en [validación](04-plan-validacion.md).

## Discrepancias concretas con Jira

- [AP-8](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-8) figura POST-MVP, mientras [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) figura MVP. Recomendación: mantener la revisión básica de IA en MVP y dividir o renombrar el alcance de la épica para que la etiqueta del padre no contradiga la historia.
- [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) figura MVP, pero la creación e inicio de sesión ([AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257), [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267)) figuran POST-MVP y sin sprint. Decidir si “progreso” significa resumen dentro de una sesión o evolución entre sesiones. Para lo segundo se necesita identidad/persistencia o una alternativa explícita.
- [AP-62](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-62) figura POST-MVP. La comunicación de que el diagnóstico no es calificado podría ser necesaria desde el primer piloto con estudiantes; definirlo antes de pruebas con usuarios.
- [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) figura POST-MVP. Si la población piloto incluye menores que requieran autorización, no puede diferirse al piloto.
- [AP-215](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-215) figura POST-MVP. Un banco amplio puede diferirse, pero un mínimo de preguntas por tema debe fijarse para que el diagnóstico sea defendible.
- Las historias POST-MVP de los sprints 2 a 6 compiten por capacidad con el núcleo. Replanificar sin mover automáticamente las tarjetas; ver [estimaciones](estimaciones.md).

**Decisión pendiente de negocio:** población piloto, edades, materias y grados, necesidad de cuenta, privacidad, definición de progreso y tamaño del banco de preguntas.
