# Bienvenida, perfil y confirmación de correo

Estado: recorrido implementado para **nuevas cuentas de estudiantes de 18 años o más**; envío real pendiente de configurar. El registro de menores permanece cerrado. El contenido académico conserva su marca de provisional hasta la revisión docente.

## Recorrido

1. La primera pantalla explica brevemente la aplicación y ofrece iniciar sesión o crear cuenta. Hay una vista previa opcional sin cuenta.
2. El registro pide correo y contraseña; el segundo paso pide nombre o apodo y grado que cursa o prepara, incluso por ciclos o aceleración. Solicita una declaración de mayoría de edad, sin pedir documento ni fecha de nacimiento.
3. La solicitud guarda temporalmente correo, hash de contraseña, nombre y grado. No crea sesión ni permite entrar todavía.
4. El proveedor de correo envía un enlace de un solo uso que vence en 24 horas. La página `/verificar` consume el enlace, activa la cuenta, crea el perfil y abre la sesión.
5. Al entrar, la aplicación selecciona automáticamente el grado del perfil y muestra sus materias. El perfil y los avances se pueden consultar y modificar desde «Cuenta».

Una solicitud repetida para un registro aún pendiente envía un enlace nuevo al **mismo correo** y conserva el perfil y la contraseña originales. Hay un máximo de tres envíos por correo y hora. Los registros pendientes vencidos se eliminan cuando se procesa una nueva solicitud de registro; antes de publicar debe definirse y probarse una limpieza periódica.

## Configuración de envío

El adaptador usa la misma API de Resend preparada para recuperación de contraseña. En `web/.env.local`, fuera de Git:

```text
RESEND_API_KEY=valor_privado
APOYO_EMAIL_FROM=Apoyo <cuentas@tu-dominio-verificado.com>
APOYO_PUBLIC_URL=https://tu-dominio-publico.com
```

`APOYO_EMAIL_FROM` puede sustituirse por el remitente `APOYO_RECOVERY_FROM` existente. Resend debe aceptar el remitente y el dominio. La URL pública debe corresponder al dominio que abre el estudiante; en desarrollo puede ser la URL HTTPS del túnel, pero si cambia hay que actualizarla y reiniciar Next.js. La clave nunca va en `NEXT_PUBLIC_*` ni en el navegador. La ruta `GET /api/auth/email-status` solo expone si la configuración está completa. Sin ella, el botón final de registro queda deshabilitado y `POST /api/auth/register` devuelve 503 sin crear una cuenta pendiente.

Para producción sigue siendo obligatorio habilitar expresamente `APOYO_ENABLE_ADULT_ACCOUNTS=true` **después** de resolver las observaciones jurídicas, operativas y de seguridad; configurar el correo por sí solo no significa que el servicio esté listo para publicar.

## Seguridad y migración

- El servidor guarda el hash del token; el token original solo viaja en el correo. El enlace usa fragmento de URL para no enviarlo en el GET inicial. El POST de confirmación lo consume una sola vez y comprueba el vencimiento.
- El correo solo prueba control de la dirección. No acredita mayoría de edad, identidad ni parentesco, ni habilita el registro de menores.
- Las cuentas creadas **antes** de este cambio conservan acceso y avances. Su columna `email_verified_at` queda vacía porque nunca se verificó su correo; no deben presentarse como verificadas. La exigencia retroactiva necesita un flujo de migración antes de un lanzamiento general.
- Los borradores jurídicos 31–35 deben añadir el registro pendiente, la finalidad y conservación de esos datos, y Resend como destinatario/proveedor si se contrata. Esta nota no modifica los PDF que ya está revisando la abogada ni sustituye su aprobación.

## Comprobación

`npm.cmd test` cubre vencimiento, reenvío, límite, token de un uso, perfil y aislamiento de sesión. `npm.cmd run test:browser` comprueba la bienvenida, los pasos de perfil, el acceso de cuentas existentes y el recorrido de estudio. El envío real a un buzón requiere configurar el proveedor y probarlo con un correo propio; las pruebas automatizadas no envían correos reales.
