# BORRADOR — aviso y autorización para representante de menor

**Estado:** propuesta para revisión de privacidad y jurídica, 8 de octubre de 2026. **No publicar ni usar para recoger datos reales.** Completar los campos entre corchetes, aprobar el texto y el método de verificación, y versionar la copia exacta que se muestre. Este documento desarrolla [AP-305](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-305); no prueba que AP-304, AP-308 o AP-311 estén implementadas.

## Texto propuesto para la pantalla del representante

> **Antes de crear una cuenta para el estudiante**
>
> [Nombre o razón social del responsable], con contacto [dirección física o electrónica] y teléfono [número], solicita su autorización como representante legal para tratar los datos personales de [identificación mínima del estudiante, por definir]. Puede consultar la política completa y sus cambios en [enlace permanente a política aprobada].
>
> Si usted autoriza, usaremos los datos mínimos para **crear y proteger la cuenta educativa** y para **guardar y mostrar el progreso de estudio entre sesiones**. Estos usos incluyen [lista aprobada de datos concretos: identificador de cuenta, grado, tema, resultados resumidos, fechas mínimas de actividad] y [destinatarios/encargados y transferencias, si los hay; especificar antes de publicar]. No usaremos por defecto respuestas individuales para entrenar modelos, publicidad personalizada ni comunicaciones comerciales. Cualquier finalidad adicional se presentará y evaluará por separado.
>
> Usted y el estudiante pueden solicitar conocer, actualizar, rectificar o suprimir sus datos y pedir la revocación de la autorización mediante [canal de atención], sujeto a las condiciones legales aplicables. Explicaremos cómo tramitar la solicitud y cómo consultar la prueba de la autorización. La política completa está en [enlace].
>
> La respuesta a preguntas sobre datos sensibles o datos del estudiante es facultativa. Si no autoriza el tratamiento necesario para cuenta y progreso, no activaremos esa cuenta ni guardaremos progreso personal; el estudiante podrá usar únicamente las funciones públicas de demostración disponibles, sin cuenta. La duración del tratamiento y los plazos de conservación constan en [sección concreta de política aprobada]; **no se fijan en este borrador**.
>
> Antes de decidir, explique al estudiante en palabras adecuadas a su edad qué datos se guardarían y escuche su opinión. [Mecanismo concreto y accesible para registrar que fue escuchado; por aprobar]. Su opinión será valorada según su madurez y capacidad para entender el uso de sus datos.
>
> [ ] **Confirmo que soy representante legal, que mi identidad y vínculo serán verificados por [método aprobado], que recibí la información anterior y autorizo expresamente las finalidades de cuenta educativa y progreso entre sesiones.**
>
> Botones: **Autorizar y continuar** / **No autorizar**. Ambas decisiones deben tener un resultado visible y distinto. La casilla comienza desmarcada; pulsar «continuar» sin verificar identidad, vínculo y elección explícita no crea una autorización válida.

El texto propuesto agrupa dos finalidades candidatas vinculadas al producto; asesoría jurídica debe decidir si requieren autorizaciones separadas y si la falta de una permite alguna función de cuenta. La autorización del representante no sustituye el derecho del menor a ser escuchado. El aviso breve tampoco reemplaza la política de tratamiento ni, por sí solo, constituye prueba suficiente de autorización. [Ley 1581 de 2012, arts. 7–9 y 12](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981); [Decreto 1377 de 2013, arts. 7–9, 12 y 14–16](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646); [SIC sobre casillas premarcadas](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/el-silencio-las-casillas-premarcadas-por-defecto-y-la-inaccion-no-constituyen-el-consentimiento-conforme-con).

## Explicación candidata para el estudiante

> Si creas una cuenta, la aplicación podrá recordar los temas que estudiaste y tus resultados para que tú y tu representante puedan ver tu avance. Tú puedes contar qué opinas sobre guardar esa información y hacer preguntas antes de decidir. Si no quieren crear una cuenta, pueden seguir viendo la demostración sin guardar tu avance. [Canal apropiado para expresar opinión o pedir ayuda, por definir].

Revisar esta explicación con pedagogía y privacidad para 1.º–5.º y 6.º–11.º: un único texto quizá no sea comprensible para todas las edades. La interfaz final deberá permitir expresar dudas o desacuerdo sin obligar al estudiante a escribir datos personales en texto libre. [Decreto 1377 de 2013, art. 12](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646); [criterio SIC](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/tratamiento-excepcional-y-autorizacion-del-representante-legal-con-interes-superior).

## Especificación de entrega del flujo

1. **Información previa.** Presentar identidad y contacto del responsable, datos y finalidades específicas, política y canal de derechos antes de recoger datos del menor. El primer contacto del representante también requiere finalidad y tratamiento definidos para **sus propios datos**.
2. **Escucha y verificación.** Registrar solo una constancia mínima del derecho del menor a ser escuchado, según mecanismo aprobado. Comprobar que quien autoriza tiene identidad y vínculo legal suficientes; un código enviado a correo confirma acceso al correo, no la representación legal.
3. **Elección expresa.** Mantener la casilla desmarcada y ofrecer «No autorizar». La evidencia restringida debe referir versión y digest del aviso exacto, política aplicable, finalidades, fecha UTC, medio, verificación del representante y estado. Nunca almacenar el secreto de verificación en la evidencia.
4. **Control de servidor.** Antes de activar cuenta o leer/escribir progreso personal, comprobar sesión, sujeto, finalidad y autorización vigente. Denegar solicitudes directas a la API, estados ausentes/revocados/vencidos y errores de verificación. Una revocación impide nuevas operaciones protegidas; la supresión o conservación residual siguen la política aprobada.
5. **Retención.** Configurar plazos por categoría tras decisión jurídica: trámite incompleto/contacto del representante, cuenta/progreso, evidencia de autorización, solicitudes de derechos, seguridad y copias de respaldo. Definir evento inicial, borrado o anonimización, excepciones legales documentadas y responsable de ejecutar cada plazo. No poner «indefinido» como valor provisional operativo.

## Decisiones que impiden publicar o cerrar las tareas

| Decisión externa pendiente | Evidencia esperada |
| --- | --- |
| Responsable del tratamiento, contacto real, política publicada, encargados/destinatarios y análisis del interés superior | Documento aprobado con nombre, versión, fecha y responsable de aprobación. |
| Finalidades y datos exactos, posible separación de autorizaciones | Inventario de datos y finalidades alineado con aviso, interfaz y esquema de almacenamiento. |
| Método para verificar identidad y vínculo del representante; casos de tutores o custodias especiales | Procedimiento aprobado y prueba con identidades sintéticas de éxito, fallo y suplantación. |
| Método para escuchar y valorar la opinión del menor, con textos por nivel de lectura | Diseño aprobado y prueba de comprensión/accesibilidad con perfiles ficticios. |
| Plazos y reglas de retención, revocación, supresión y respuesta a solicitudes | Tabla aprobada por categoría y procedimientos operativos; revisar excepciones legales. |
| Revisión jurídica/privacidad colombiana del texto y del flujo | Aprobación identificable de la versión exacta del aviso, política y controles antes de piloto con menores. |

## Criterios de verificación por incidencia

- **AP-305:** aviso y política aprobados, datos/finalidades/retención definidos, flujo implementado y pruebas de autorización válida y ausente/revocada. Este borrador solo aporta texto candidato.
- **AP-308:** evidencia y estado persisten de forma protegida; pruebas con datos sintéticos de autorización válida, duplicada, ausente, vencida/revocada y acceso indebido a evidencia.
- **AP-311:** pruebas HTTP y de almacenamiento demuestran bloqueo de cuenta/progreso con acceso directo a API, estado ausente/revocado y falla del verificador, sin retener cuerpo personal rechazado.
- **AP-304:** recorrido completo e integrado, derecho del menor a ser escuchado, ejercicio de derechos y revisión especializada antes de uso con estudiantes reales.

**Referencias oficiales consultadas el 8 de octubre de 2026:** [Ley 1581 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981), [Decreto 1377 de 2013](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646), [concepto SIC sobre menores](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/tratamiento-excepcional-y-autorizacion-del-representante-legal-con-interes-superior), [SIC sobre casillas premarcadas](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/el-silencio-las-casillas-premarcadas-por-defecto-y-la-inaccion-no-constituyen-el-consentimiento-conforme-con).
