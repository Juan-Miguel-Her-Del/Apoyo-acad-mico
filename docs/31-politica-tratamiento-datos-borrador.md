# Política de tratamiento de datos personales — borrador para revisión

**Proyecto:** Apoyo_academico · **Versión de trabajo:** 0.1, 16 de octubre de 2026 · **Estado:** no aprobada; no publicar ni usar para registrar menores. La versión aprobada debe tener fecha de vigencia, responsable identificado y enlace permanente. Este texto describe el producto actual y el tratamiento futuro propuesto; donde dice **pendiente**, todavía no existe una decisión operativa.

## 1. Responsable y alcance

Responsable del tratamiento: **[nombre completo o razón social pendiente]**. Domicilio: **[ciudad y dirección pendiente]**. Correo de contacto: **[pendiente]**. Teléfono: **[pendiente]**. Área o persona encargada de consultas y reclamos: **[pendiente]**. Canal específico de privacidad: **[correo o formulario pendiente]**. La abogada debe verificar quién asume efectivamente este papel antes de publicar la política.

La política cubriría datos de estudiantes, representantes legales y personas adultas que usan la demostración. El registro público de estudiantes está deshabilitado. Actualmente existe una demostración local con cuentas adultas. El tratamiento de menores descrito abajo es **propuesto**, no una afirmación de que ya esté habilitado.

## 2. Datos y finalidades

| Grupo | Datos previstos o existentes | Finalidad y estado |
| --- | --- | --- |
| Adultos de demostración | Correo, identificador interno, hash de contraseña, sesiones, grado/tema escogidos, respuestas y resultados de diagnóstico y práctica, valoraciones | Crear cuenta local, autenticar y mostrar el avance de prueba. **Existe** en la demostración; no usar con menores. |
| Representante legal | Datos mínimos de contacto y referencia seudónima; resultado de la verificación de identidad y vínculo; versión y huella del aviso, finalidades, fecha y referencia de evidencia | Informar, verificar y conservar prueba de la autorización. **No existe aún** un verificador ni un depósito de evidencia aprobados. Datos concretos y método: **pendientes**. |
| Estudiante | Correo de cuenta, identificador interno, hash de contraseña y sesión; más adelante, grado/tema, sesiones terminadas y resultados de progreso | Crear y proteger la cuenta educativa y mostrar progreso entre sesiones, **solo tras autorización válida y puesta en marcha del flujo**. Hoy el registro público devuelve 503. |
| Solicitudes de derechos y seguridad | Identificación mínima para tramitar la solicitud, mensaje, fechas, actuación y respuesta; registros técnicos necesarios | Gestionar derechos, investigar incidentes y demostrar la respuesta. Canal, accesos y plazos internos: **pendientes**. |

El diseño actual no pide fotografía del documento, número de identidad ni fecha de nacimiento del menor. No se añadirán esos datos por comodidad: cualquier cambio exige justificar necesidad, actualizar el inventario y pasar por revisión jurídica y de seguridad. Los datos sensibles no forman parte del registro previsto; si alguna función futura los necesitara, requeriría revisión y comunicación específica.

## 3. Inteligencia artificial y destinatarios

La integración preparada para explicaciones usa la API de OpenAI desde el servidor. **Actualmente no realiza llamadas reales**, porque requiere contenido y diagnóstico aprobados. Si se activa, enviaría identificadores de tema/subtema, grado y nivel de redacción, versión y fragmentos de explicación y ejemplo académico aprobados. El adaptador actual no envía nombre, correo, documento, fecha de nacimiento, identificador de cuenta, respuestas individuales ni historial completo. Aunque se minimicen los campos, grado y subtema pueden relacionarse con la experiencia educativa del estudiante; esta finalidad y el proveedor deben figurar en el aviso aprobado. Cualquier chat libre o envío de respuestas a IA requerirá una nueva evaluación y, si corresponde, nueva autorización.

El código envía `store: false`. Según [OpenAI Docs](https://developers.openai.com/api/docs/guides/your-data), los datos de la API no se usan para entrenar modelos sin consentimiento expreso del cliente, pero pueden existir registros de prevención de abusos durante hasta 30 días por defecto, con excepciones. **[Abogada: revisar contrato aplicable, encargados, posibles transferencias/transmisiones internacionales, subencargados y condiciones de conservación antes de activar].** Si se elige otro proveedor, sustituir esta sección por su flujo y condiciones reales.

Los demás proveedores de alojamiento, correo, verificación de representantes o copias de seguridad aún no están seleccionados. **[Inventariar cada uno, ubicación, contrato, acceso y conservación antes de publicar].** No se comunica progreso a docentes, instituciones, anunciantes ni inversores por defecto; cualquier destinatario nuevo requiere finalidad y control de acceso definidos.

## 4. Conservación y eliminación

La conservación debe limitarse al tiempo razonable y necesario para la finalidad, con las excepciones legales o contractuales que correspondan. **No se ha aprobado un plazo operativo para las categorías siguientes**; por eso esta tabla debe cerrarse antes de recibir datos de menores.

| Categoría | Inicio del plazo | Plazo aprobado | Acción al vencer | Excepción/documentación |
| --- | --- | --- | --- | --- |
| Contacto de representante y trámite incompleto | Última interacción | **[pendiente]** | Borrar trámite y contacto | **[pendiente]** |
| Cuenta y sesiones del estudiante | Cierre de cuenta o última actividad, **[elegir]** | **[pendiente]** | Eliminar o anonimizar, según proceda | **[pendiente]** |
| Respuestas, resultados y progreso | Cierre de cuenta o fin de finalidad, **[elegir]** | **[pendiente]** | Eliminar o anonimizar | **[pendiente]** |
| Prueba de autorización y revocación | Revocación/cierre | **[pendiente]** | Eliminar cuando cese deber de conservación | **[pendiente]** |
| Solicitudes de titulares e incidentes | Cierre del caso | **[pendiente]** | Eliminar o archivar según obligación | **[pendiente]** |
| Registros técnicos y respaldos | Generación | **[pendiente]** | Rotar y purgar; documentar borrado en respaldo | **[pendiente]** |

La revocación bloquea nuevo acceso a funciones protegidas; **no significa que todo dato previo se borre instantáneamente**. El procedimiento de supresión y las excepciones deben aprobarse y verificarse técnicamente. La base estudiantil de prueba no implementa todavía el ciclo completo de eliminación/retención.

## 5. Derechos y procedimiento

Los titulares y quienes estén legitimados pueden solicitar acceso, actualización, rectificación, supresión y revocación, además de conocer la finalidad y pedir prueba de la autorización. La solicitud se enviará por **[canal pendiente]**, indicando el derecho solicitado y un medio de respuesta; se verificará la identidad y la representación con el mínimo de datos necesario. No se enviarán datos del estudiante a una persona cuya legitimación no se haya confirmado.

La persona encargada registrará fecha de recepción, categoría de consulta o reclamo, verificación, actuación y respuesta; comunicará faltantes o demoras y dejará evidencia. Como referencia normativa, las **consultas** se atienden en máximo 10 días hábiles, con posible extensión de 5; los **reclamos** en máximo 15 días hábiles, con posible extensión de 8, sujetos a las reglas de la Ley 1581. Las solicitudes de supresión/revocación se analizan con las excepciones aplicables. El protocolo operativo está en [35](35-protocolo-seguridad-incidentes-borrador.md).

## 6. Protección, cambios y vigencia

El acceso se limita por funciones, se protegen credenciales y sesiones y se investigan incidentes. Los controles existentes y los faltantes se distinguen en el [protocolo](35-protocolo-seguridad-incidentes-borrador.md); este texto no afirma que la base esté cifrada o que exista un equipo de respuesta. Cambios sustanciales de finalidades o destinatarios se comunicarán antes de aplicarlos y se evaluará si requieren nueva autorización.

**Fecha de entrada en vigencia:** [pendiente]. **Período de vigencia de las bases de datos:** [pendiente]. **Aprobó:** [nombre, cargo y fecha pendientes]. **Versión publicada:** [pendiente].

### Base consultada

[Ley 1581 de 2012, arts. 7–9, 12, 14–17](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1581_2012.htm) · [Decreto 1377 de 2013, arts. 7–9, 11–13 y 18](https://cancilleria.gov.co/normograma/compilacion/docs/decreto_1377_2013.htm) · [OpenAI Docs: controles de datos](https://developers.openai.com/api/docs/guides/your-data).
