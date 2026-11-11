# Despliegue de Apoyo_academico en Railway

## Código y configuración del servicio

Repositorio: `https://github.com/Juan-Miguel-Her-Del/Apoyo-acad-mico`.

En Railway, crea un proyecto desde **Deploy from GitHub repo** y elige ese repositorio. Configura un único servicio web con **Root Directory** `/web`. El proyecto requiere Node.js 24 (`engines` en `web/package.json`), ejecuta `npm ci`, `npm run build` y `npm run start`. Next.js lee la variable `PORT` que suministra Railway. Genera un dominio HTTPS público en **Settings → Networking**.

## Persistencia

Agrega un **Volume** al servicio y móntalo en `/data`. Configura estas variables en el servicio:

```text
APOYO_DB_PATH=/data/apoyo.sqlite
APOYO_STUDENT_DB_PATH=/data/apoyo-students.sqlite
```

Las cuentas, sesiones, diagnósticos, práctica y progreso usan SQLite. Sin el volumen, un nuevo despliegue podría perderlos. Mantén **una réplica** mientras uses SQLite y conserva copias de seguridad del volumen. El registro de menores reales continúa bloqueado por los requisitos de autorización; el segundo archivo solo prepara el almacenamiento separado.

## Correo y acceso

Configura estas variables secretas en Railway, nunca en GitHub:

```text
APOYO_ENABLE_ADULT_ACCOUNTS=true
RESEND_API_KEY=<clave de Resend>
APOYO_EMAIL_FROM=<remitente verificado en Resend>
APOYO_RECOVERY_FROM=<remitente verificado en Resend>
APOYO_PUBLIC_URL=https://<dominio público de Railway>
```

El valor de `APOYO_PUBLIC_URL` debe coincidir con el dominio que se usará para registro, confirmación y recuperación. El remitente puede ser el mismo en ambas variables. La clave de Gemini y `APOYO_ENABLE_PROVISIONAL_AI=true` son opcionales para las explicaciones provisionales; la integración nunca debe recibir identidad ni respuestas de usuarios.

## Comprobación tras desplegar

1. Abre el dominio HTTPS y verifica que aparecen los 11 grados y los dos temas por combinación disponible.
2. Crea una cuenta de prueba de una persona adulta; confirma el correo desde el enlace de Resend.
3. Inicia sesión, estudia y responde una ronda de práctica. Cierra sesión, vuelve a entrar y verifica que el progreso persiste.
4. Solicita recuperar contraseña y comprueba que el correo llega y el enlace funciona.
5. Despliega de nuevo y verifica que la cuenta y el progreso siguen presentes. Si no persisten, revisa el montaje `/data` y `APOYO_DB_PATH` antes de usar el servicio.

El contenido de los 52 temas es provisional. La plataforma puede servir para demostración y pruebas con cuentas adultas; la publicación curricular y las cuentas de menores reales requieren resolver sus revisiones pendientes.
