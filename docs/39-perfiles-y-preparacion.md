# Perfiles y preparación de la cuenta

Estado: perfil para estudiantes de 18 años o más implementado en el entorno local; registro de menores cerrado. Una persona adulta que cursa o prepara un grado mediante educación por ciclos o aceleración puede usar esta cuenta para conservar su progreso. Esta nota documenta el cambio para la revisión jurídica en curso y no modifica ni aprueba los borradores 31–35.

**Decisión de producto (20/10/2026):** la cuenta de mayor de edad es una cuenta de estudiante, no una cuenta de demostración. La persona puede seleccionar el grado que cursa o prepara y conservar sus avances. El contenido académico sigue marcado como provisional hasta su revisión docente; eso no cambia la finalidad de la cuenta. Las descripciones de «demostración adulta» en los borradores jurídicos 31, 34 y 35 y en documentos históricos quedaron desactualizadas. Esta decisión debe enviarse a la abogada para corregir y aprobar los textos y PDF definitivos; el paquete ya enviado conserva su condición de borrador.

## Recorrido visible

1. En «Cuenta», la persona puede ver el estado de privacidad y de los términos antes de crear una cuenta.
2. El registro ofrece «Estudiante de 18 años o más». La opción «Estudiante menor de 18» informa del cierre del registro y no acepta datos.
3. El nuevo registro pide nombre o apodo y grado antes de enviar el enlace de confirmación. No se solicitan apellidos, documentos ni fecha de nacimiento. El envío de correo está pendiente de configurar; véase la [actualización del recorrido](40-bienvenida-registro-verificacion.md).
4. Tras confirmar el correo, la app abre «Estudiar» en el paso de materia del grado elegido. Las cuentas anteriores pueden preparar o editar su perfil desde «Cuenta».
5. «Mi progreso» sigue usando los intentos y prácticas asociados a la misma cuenta. Cambiar el grado del perfil limpia la última selección guardada, sin borrar el historial académico anterior.

## Datos y controles técnicos

- `user_profiles` guarda `user_id`, `display_name`, `grade_id` y `updated_at` en la base de cuentas de mayores de edad. La eliminación de la cuenta arrastra este registro por clave foránea. El rol devuelto por la API es `adult_student`.
- `GET/PUT /api/profile` exige una sesión de estudiante mayor de edad. La escritura exige origen del mismo sitio y valida el nombre y un grado activo del catálogo (1.º–11.º).
- La base interna `student_profiles` para menores usa los mismos datos y solo se consulta o modifica tras `currentStudent`, que verifica sesión y autorización vigente. Su rol es `minor_student`. No existe interfaz pública para crear ese perfil ni se activó el registro de menores.
- Las páginas `/privacidad` y `/terminos` muestran el estado de los borradores y la finalidad académica de la cuenta de mayores de edad. No se presentan como política o términos definitivos ni registran una aceptación jurídica.

## Revisión pendiente con la abogada

Los borradores 31 (política) y 34 (términos) deben reflejar que la cuenta de mayor de edad es para estudiar, incluso por ciclos o aceleración, e incorporar el nombre o apodo, el grado del perfil, sus finalidades, conservación, acceso, modificación y eliminación. También hay que definir cómo se presentan y registran las versiones finales aprobadas. Para menores, faltan el método verificable del representante, el aviso adaptado, la opinión del estudiante y las demás decisiones de la matriz 38. Hasta entonces, la opción de menores sigue cerrada. El acceso público de cuentas de mayores de edad también requiere resolver las observaciones jurídicas y operativas pendientes.
