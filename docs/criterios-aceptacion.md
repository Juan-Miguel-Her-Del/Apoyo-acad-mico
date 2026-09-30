# Criterios de aceptación propuestos

**Estado:** especificación de planificación, sin implementación ni pruebas ejecutadas. Los 40 escenarios proceden de las historias de [Jira AP](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP) y deben revisarse con el responsable antes de mover las historias a desarrollo. Grados, materias, reglas de puntuación, cantidades mínimas y textos exactos están **[PENDIENTE DE DEFINIR]**. Cada escenario debe traducirse después en prueba manual o automatizada. La columna de alcance usa la propuesta de [MVP](03-alcance-mvp.md).

Para cada historia: el segundo escenario es una validación, caso límite o manejo de error. Los mensajes descritos son **requisitos propuestos**, no textos presentes en una interfaz. Un mensaje de error debe explicar qué ocurrió y qué puede hacer la persona, sin exponer datos sensibles.

## [AP-10](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-10) — Elegir nivel educativo

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** catálogo piloto de niveles definido.

- **Caso principal.** Dado que catálogo piloto de niveles definido, cuando abre el selector de nivel, entonces ve solo niveles configurados y puede elegir uno.
- **Validación / caso límite.** Dado que el catálogo está vacío, cuando abre el selector de nivel, entonces ve que no hay niveles disponibles y no puede continuar.
- **Error o estado vacío que se debe comprobar:** ve que no hay niveles disponibles y no puede continuar. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-17](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-17) — Elegir materia

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** nivel seleccionado y materias asociadas.

- **Caso principal.** Dado que nivel seleccionado y materias asociadas, cuando abre materias y elige una disponible, entonces la materia queda asociada al nivel.
- **Validación / caso límite.** Dado que no hay materias para ese nivel, cuando abre materias y elige una disponible, entonces ve ausencia de materias y no conserva una materia anterior incompatible.
- **Error o estado vacío que se debe comprobar:** ve ausencia de materias y no conserva una materia anterior incompatible. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-24](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-24) — Elegir tema

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** nivel y materia seleccionados.

- **Caso principal.** Dado que nivel y materia seleccionados, cuando elige un tema del listado, entonces el tema queda asociado a esa combinación.
- **Validación / caso límite.** Dado que no hay temas para la materia, cuando elige un tema del listado, entonces ve estado vacío y no inicia diagnóstico.
- **Error o estado vacío que se debe comprobar:** ve estado vacío y no inicia diagnóstico. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-31](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-31) — Filtrar temas por nivel y materia

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** catálogo con combinaciones de niveles y materias.

- **Caso principal.** Dado que catálogo con combinaciones de niveles y materias, cuando cambia nivel o materia, entonces solo ve temas compatibles y se limpia una selección incompatible.
- **Validación / caso límite.** Dado que la combinación no tiene temas, cuando cambia nivel o materia, entonces ve un aviso comprensible y no usa un tema anterior.
- **Error o estado vacío que se debe comprobar:** ve un aviso comprensible y no usa un tema anterior. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-38](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-38) — Cambiar materia o tema

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** tema ya seleccionado.

- **Caso principal.** Dado que tema ya seleccionado, cuando elige otra materia o tema válido, entonces se actualiza el contexto antes de seguir.
- **Validación / caso límite.** Dado que el nuevo tema no está disponible, cuando elige otra materia o tema válido, entonces mantiene el contexto válido o muestra por qué no puede cambiar.
- **Error o estado vacío que se debe comprobar:** mantiene el contexto válido o muestra por qué no puede cambiar. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-45](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-45) — Recordar último tema

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** persistencia elegida y tema guardado.

- **Caso principal.** Dado que persistencia elegida y tema guardado, cuando abre una nueva sesión, entonces recupera el último tema válido.
- **Validación / caso límite.** Dado que ese tema fue retirado, cuando abre una nueva sesión, entonces recibe opción de elegir otro sin quedar bloqueado.
- **Error o estado vacío que se debe comprobar:** recibe opción de elegir otro sin quedar bloqueado. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-52](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-52) — Diagnóstico corto

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** tema con banco piloto de preguntas.

- **Caso principal.** Dado que tema con banco piloto de preguntas, cuando inicia diagnóstico, entonces recibe una secuencia finita de preguntas del tema.
- **Validación / caso límite.** Dado que no hay preguntas suficientes, cuando inicia diagnóstico, entonces ve aviso y el diagnóstico no entrega resultado ficticio.
- **Error o estado vacío que se debe comprobar:** ve aviso y el diagnóstico no entrega resultado ficticio. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-62](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-62) — Aviso de diagnóstico sin nota

**Actor:** Estudiante. **Alcance:** POR DEFINIR. **Precondición:** diagnóstico disponible.

- **Caso principal.** Dado que diagnóstico disponible, cuando consulta la introducción antes de comenzar, entonces entiende que no es una nota académica.
- **Validación / caso límite.** Dado que abandona y vuelve al diagnóstico, cuando consulta la introducción antes de comenzar, entonces la información sigue accesible antes de responder.
- **Error o estado vacío que se debe comprobar:** la información sigue accesible antes de responder. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-69](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-69) — Indicador de progreso del diagnóstico

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** diagnóstico de varias preguntas.

- **Caso principal.** Dado que diagnóstico de varias preguntas, cuando responde una pregunta, entonces el indicador refleja posición y total reales.
- **Validación / caso límite.** Dado que el banco tiene una sola pregunta, cuando responde una pregunta, entonces el indicador sigue siendo consistente.
- **Error o estado vacío que se debe comprobar:** el indicador sigue siendo consistente. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-76](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-76) — Responder diagnóstico

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** pregunta diagnóstica válida.

- **Caso principal.** Dado que pregunta diagnóstica válida, cuando envía una respuesta permitida, entonces la respuesta se registra una vez para la pregunta.
- **Validación / caso límite.** Dado que envía una respuesta vacía o inválida, cuando envía una respuesta permitida, entonces ve qué debe corregir y no se cuenta una respuesta inválida.
- **Error o estado vacío que se debe comprobar:** ve qué debe corregir y no se cuenta una respuesta inválida. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-83](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-83) — Dificultad adaptativa del diagnóstico

**Actor:** Sistema. **Alcance:** POST-MVP. **Precondición:** regla adaptativa y banco clasificado por dificultad.

- **Caso principal.** Dado que regla adaptativa y banco clasificado por dificultad, cuando recibe respuesta de diagnóstico, entonces selecciona la siguiente dificultad según la regla documentada.
- **Validación / caso límite.** Dado que llega a un límite del banco, cuando recibe respuesta de diagnóstico, entonces no elige una pregunta inexistente ni repite sin regla.
- **Error o estado vacío que se debe comprobar:** no elige una pregunta inexistente ni repite sin regla. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-93](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-93) — Retroalimentación visual inmediata

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** respuesta diagnóstica evaluable.

- **Caso principal.** Dado que respuesta diagnóstica evaluable, cuando responde una pregunta, entonces ve el estado correcto o incorrecto según la solución.
- **Validación / caso límite.** Dado que no se puede evaluar la respuesta, cuando responde una pregunta, entonces ve un estado de evaluación pendiente, sin marcarla arbitrariamente.
- **Error o estado vacío que se debe comprobar:** ve un estado de evaluación pendiente, sin marcarla arbitrariamente. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-100](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-100) — Asociar respuestas con subtemas

**Actor:** Sistema. **Alcance:** MVP. **Precondición:** preguntas vinculadas a subtemas y respuestas.

- **Caso principal.** Dado que preguntas vinculadas a subtemas y respuestas, cuando finaliza diagnóstico, entonces produce resultados por subtema trazables a preguntas.
- **Validación / caso límite.** Dado que falta el vínculo de una pregunta, cuando finaliza diagnóstico, entonces la excluye o marca el resultado incompleto, sin inventar dominio.
- **Error o estado vacío que se debe comprobar:** la excluye o marca el resultado incompleto, sin inventar dominio. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-107](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-107) — Mostrar subtemas difíciles

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** resultados por subtema calculados.

- **Caso principal.** Dado que resultados por subtema calculados, cuando abre resultado diagnóstico, entonces ve los subtemas clasificados como dificultad por una regla visible.
- **Validación / caso límite.** Dado que no hay evidencia suficiente, cuando abre resultado diagnóstico, entonces ve resultado indeterminado, no una dificultad inventada.
- **Error o estado vacío que se debe comprobar:** ve resultado indeterminado, no una dificultad inventada. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-114](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-114) — Mostrar fortalezas

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** resultados por subtema calculados.

- **Caso principal.** Dado que resultados por subtema calculados, cuando consulta fortalezas, entonces ve solo subtemas que cumplen la regla de dominio.
- **Validación / caso límite.** Dado que ningún subtema cumple la regla, cuando consulta fortalezas, entonces ve estado vacío y explicación breve.
- **Error o estado vacío que se debe comprobar:** ve estado vacío y explicación breve. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-121](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-121) — Nivel de confianza

**Actor:** Sistema. **Alcance:** POST-MVP. **Precondición:** método de confianza documentado.

- **Caso principal.** Dado que método de confianza documentado, cuando procesa respuestas por habilidad, entonces calcula un valor reproducible dentro del rango definido.
- **Validación / caso límite.** Dado que hay pocas respuestas, cuando procesa respuestas por habilidad, entonces reduce confianza o indica insuficiencia de evidencia.
- **Error o estado vacío que se debe comprobar:** reduce confianza o indica insuficiencia de evidencia. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-128](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-128) — Explicación del subtema

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** subtema difícil identificado y fuente educativa disponible.

- **Caso principal.** Dado que subtema difícil identificado y fuente educativa disponible, cuando solicita explicación, entonces recibe contenido pertinente al subtema.
- **Validación / caso límite.** Dado que la fuente o IA falla, cuando solicita explicación, entonces ve fallo comprensible y puede reintentar sin mostrar contenido inventado.
- **Error o estado vacío que se debe comprobar:** ve fallo comprensible y puede reintentar sin mostrar contenido inventado. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-138](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-138) — Adaptar explicación al nivel

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** nivel elegido y explicación disponible.

- **Caso principal.** Dado que nivel elegido y explicación disponible, cuando pide explicación, entonces recibe vocabulario y profundidad adecuados al nivel definido.
- **Validación / caso límite.** Dado que el nivel no está disponible, cuando pide explicación, entonces se solicita escoger nivel o se informa la limitación.
- **Error o estado vacío que se debe comprobar:** se solicita escoger nivel o se informa la limitación. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-145](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-145) — Incluir ejemplo concreto

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** explicación del subtema.

- **Caso principal.** Dado que explicación del subtema, cuando consulta el ejemplo, entonces ve un ejemplo correcto y relacionado con el concepto.
- **Validación / caso límite.** Dado que el ejemplo falla la validación, cuando consulta el ejemplo, entonces no se publica como correcto y se registra revisión.
- **Error o estado vacío que se debe comprobar:** no se publica como correcto y se registra revisión. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-152](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-152) — Solicitar otro ejemplo

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** primer ejemplo mostrado.

- **Caso principal.** Dado que primer ejemplo mostrado, cuando pide otro ejemplo, entonces recibe uno diferente y del mismo concepto.
- **Validación / caso límite.** Dado que no hay alternativa validada, cuando pide otro ejemplo, entonces ve que no hay otro ejemplo disponible.
- **Error o estado vacío que se debe comprobar:** ve que no hay otro ejemplo disponible. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-159](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-159) — Valorar utilidad de explicación

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** explicación mostrada.

- **Caso principal.** Dado que explicación mostrada, cuando marca si le ayudó, entonces la valoración queda asociada a esa explicación.
- **Validación / caso límite.** Dado que intenta enviar dos veces, cuando marca si le ayudó, entonces el sistema evita duplicar o permite actualizar según regla definida.
- **Error o estado vacío que se debe comprobar:** el sistema evita duplicar o permite actualizar según regla definida. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-166](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-166) — Pregunta corta tras explicación

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** explicación completada y pregunta relacionada.

- **Caso principal.** Dado que explicación completada y pregunta relacionada, cuando responde pregunta corta, entonces se comprueba comprensión según solución de referencia.
- **Validación / caso límite.** Dado que la pregunta carece de solución, cuando responde pregunta corta, entonces no se comunica una calificación arbitraria.
- **Error o estado vacío que se debe comprobar:** no se comunica una calificación arbitraria. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-173](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-173) — Preguntas de práctica relacionadas

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** subtema explicado y preguntas etiquetadas.

- **Caso principal.** Dado que subtema explicado y preguntas etiquetadas, cuando inicia práctica, entonces recibe preguntas del mismo subtema.
- **Validación / caso límite.** Dado que no hay preguntas suficientes, cuando inicia práctica, entonces se informa la limitación sin presentar preguntas ajenas.
- **Error o estado vacío que se debe comprobar:** se informa la limitación sin presentar preguntas ajenas. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-180](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-180) — Responder ejercicios

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** sesión de práctica abierta.

- **Caso principal.** Dado que sesión de práctica abierta, cuando envía respuesta válida, entonces queda registrada y evaluada según solución.
- **Validación / caso límite.** Dado que envía formato inválido o sesión cerrada, cuando envía respuesta válida, entonces ve error apropiado y no modifica un resultado cerrado.
- **Error o estado vacío que se debe comprobar:** ve error apropiado y no modifica un resultado cerrado. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-187](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-187) — Explicar acierto o error

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** respuesta de práctica evaluada.

- **Caso principal.** Dado que respuesta de práctica evaluada, cuando consulta por qué acertó o falló, entonces ve explicación compatible con la solución.
- **Validación / caso límite.** Dado que no hay explicación validada, cuando consulta por qué acertó o falló, entonces ve estado pendiente de revisión, sin justificación inventada.
- **Error o estado vacío que se debe comprobar:** ve estado pendiente de revisión, sin justificación inventada. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-194](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-194) — Dificultad gradual de práctica

**Actor:** Sistema. **Alcance:** POST-MVP. **Precondición:** niveles de dificultad y regla gradual definidos.

- **Caso principal.** Dado que niveles de dificultad y regla gradual definidos, cuando recibe una secuencia de aciertos, entonces ajusta dificultad dentro de límites definidos.
- **Validación / caso límite.** Dado que alcanza la dificultad máxima, cuando recibe una secuencia de aciertos, entonces no supera el máximo ni elige pregunta inexistente.
- **Error o estado vacío que se debe comprobar:** no supera el máximo ni elige pregunta inexistente. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-201](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-201) — Resumen de sesión

**Actor:** Estudiante. **Alcance:** MVP. **Precondición:** sesión de práctica con respuestas.

- **Caso principal.** Dado que sesión de práctica con respuestas, cuando finaliza la sesión, entonces ve total, aciertos y cierre coherentes con respuestas.
- **Validación / caso límite.** Dado que no respondió preguntas, cuando finaliza la sesión, entonces ve resumen vacío o aviso sin cálculo engañoso.
- **Error o estado vacío que se debe comprobar:** ve resumen vacío o aviso sin cálculo engañoso. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-208](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-208) — Otra ronda

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** sesión anterior cerrada.

- **Caso principal.** Dado que sesión anterior cerrada, cuando inicia otra ronda, entonces se crea ronda nueva sin cambiar el resumen previo.
- **Validación / caso límite.** Dado que no quedan preguntas válidas, cuando inicia otra ronda, entonces ve limitación y no se reabre la sesión anterior.
- **Error o estado vacío que se debe comprobar:** ve limitación y no se reabre la sesión anterior. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-215](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-215) — Banco amplio de preguntas

**Actor:** Responsable de contenido. **Alcance:** POR DEFINIR. **Precondición:** tema piloto y objetivo mínimo de variedad definidos.

- **Caso principal.** Dado que tema piloto y objetivo mínimo de variedad definidos, cuando revisa el banco, entonces ve cantidad y cobertura por tema.
- **Validación / caso límite.** Dado que hay pocas preguntas o repetición excesiva, cuando revisa el banco, entonces el tema se marca insuficiente para validación.
- **Error o estado vacío que se debe comprobar:** el tema se marca insuficiente para validación. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-222](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-222) — Dominio por subtema

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** regla de dominio y datos suficientes.

- **Caso principal.** Dado que regla de dominio y datos suficientes, cuando consulta un subtema, entonces ve dominio calculado a partir de respuestas.
- **Validación / caso límite.** Dado que faltan datos, cuando consulta un subtema, entonces ve estado indeterminado.
- **Error o estado vacío que se debe comprobar:** ve estado indeterminado. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-229](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-229) — Gráfica de progreso

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** series de progreso calculadas.

- **Caso principal.** Dado que series de progreso calculadas, cuando abre gráfica, entonces los puntos coinciden con registros disponibles.
- **Validación / caso límite.** Dado que solo hay una medición, cuando abre gráfica, entonces ve el dato sin tendencia ficticia.
- **Error o estado vacío que se debe comprobar:** ve el dato sin tendencia ficticia. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-236](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-236) — Progreso tras sesión

**Actor:** Estudiante. **Alcance:** POR DEFINIR. **Precondición:** dos sesiones persistidas o alcance reducido a sesión actual.

- **Caso principal.** Dado que dos sesiones persistidas o alcance reducido a sesión actual, cuando consulta progreso, entonces ve comparación real o resumen actual claramente rotulado.
- **Validación / caso límite.** Dado que no hay historial, cuando consulta progreso, entonces no se muestra mejora ficticia.
- **Error o estado vacío que se debe comprobar:** no se muestra mejora ficticia. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-243](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-243) — Recomendación de siguiente tema

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** dificultades calculadas y catálogo disponible.

- **Caso principal.** Dado que dificultades calculadas y catálogo disponible, cuando pide siguiente tema, entonces ve recomendación vinculada a dificultad real.
- **Validación / caso límite.** Dado que no hay señal suficiente, cuando pide siguiente tema, entonces recibe una sugerencia neutra o estado indeterminado.
- **Error o estado vacío que se debe comprobar:** recibe una sugerencia neutra o estado indeterminado. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-250](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-250) — Racha de estudio

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** fechas de sesiones persistidas y regla de racha.

- **Caso principal.** Dado que fechas de sesiones persistidas y regla de racha, cuando consulta racha, entonces ve días consecutivos calculados con zona horaria definida.
- **Validación / caso límite.** Dado que hay ausencia de sesiones, cuando consulta racha, entonces ve racha cero sin inventar actividad.
- **Error o estado vacío que se debe comprobar:** ve racha cero sin inventar actividad. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257) — Crear cuenta

**Actor:** Estudiante. **Alcance:** POR DEFINIR. **Precondición:** registro habilitado y política de datos definida.

- **Caso principal.** Dado que registro habilitado y política de datos definida, cuando envía datos válidos, entonces se crea una cuenta única con protección de credenciales.
- **Validación / caso límite.** Dado que usa datos inválidos o duplicados, cuando envía datos válidos, entonces ve validación sin exposición de información sensible.
- **Error o estado vacío que se debe comprobar:** ve validación sin exposición de información sensible. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-267](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-267) — Iniciar sesión

**Actor:** Estudiante. **Alcance:** POR DEFINIR. **Precondición:** cuenta existente y activa.

- **Caso principal.** Dado que cuenta existente y activa, cuando envía credenciales válidas, entonces obtiene acceso solo a su información.
- **Validación / caso límite.** Dado que envía credenciales inválidas, cuando envía credenciales válidas, entonces ve rechazo genérico sin revelar qué dato falló.
- **Error o estado vacío que se debe comprobar:** ve rechazo genérico sin revelar qué dato falló. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-277](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-277) — Recuperar contraseña

**Actor:** Estudiante. **Alcance:** POST-MVP. **Precondición:** cuenta existente y mecanismo de recuperación elegido.

- **Caso principal.** Dado que cuenta existente y mecanismo de recuperación elegido, cuando solicita recuperación, entonces recibe un flujo temporal que permite restablecer acceso.
- **Validación / caso límite.** Dado que solicita para cuenta desconocida o enlace vencido, cuando solicita recuperación, entonces no se revela la existencia de cuentas y se rechaza el enlace vencido.
- **Error o estado vacío que se debe comprobar:** no se revela la existencia de cuentas y se rechaza el enlace vencido. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-284](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-284) — Eliminar cuenta y datos

**Actor:** Estudiante. **Alcance:** POR DEFINIR. **Precondición:** cuenta autenticada y política de retención definida.

- **Caso principal.** Dado que cuenta autenticada y política de retención definida, cuando confirma eliminación, entonces se borran o anonimizan datos según política comprobable.
- **Validación / caso límite.** Dado que no confirma la acción, cuando confirma eliminación, entonces no se eliminan datos.
- **Error o estado vacío que se debe comprobar:** no se eliminan datos. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-294](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-294) — Revisión de explicaciones IA

**Actor:** Responsable de calidad. **Alcance:** MVP. **Precondición:** rúbrica y muestra de explicaciones definidas.

- **Caso principal.** Dado que rúbrica y muestra de explicaciones definidas, cuando evalúa respuestas de IA, entonces registra puntuaciones, errores y decisión por caso.
- **Validación / caso límite.** Dado que detecta error grave de exactitud o seguridad, cuando evalúa respuestas de IA, entonces la explicación queda bloqueada hasta corregirse.
- **Error o estado vacío que se debe comprobar:** la explicación queda bloqueada hasta corregirse. El texto exacto está [PENDIENTE DE DEFINIR].

## [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) — Consentimiento de representante

**Actor:** Representante / sistema. **Alcance:** POR DEFINIR. **Precondición:** población menor y base de autorización definidas.

- **Caso principal.** Dado que población menor y base de autorización definidas, cuando se intenta registrar a un estudiante sujeto a consentimiento, entonces se exige y registra autorización verificable.
- **Validación / caso límite.** Dado que no existe autorización válida, cuando se intenta registrar a un estudiante sujeto a consentimiento, entonces se bloquea el acceso que la requiera.
- **Error o estado vacío que se debe comprobar:** se bloquea el acceso que la requiera. El texto exacto está [PENDIENTE DE DEFINIR].

## Criterio de cierre transversal

Una historia cumple sus criterios solo si el caso principal y el caso límite se verifican con datos de prueba, se registra el resultado y se documentan los defectos encontrados. Ninguna historia aparece como implementada por tener esta especificación.
