# Despliegue de Apoyo_academico en Railway

## Código y configuración del servicio

Repositorio: `https://github.com/Juan-Miguel-Her-Del/Apoyo-acad-mico`.

En Railway, crea un proyecto desde **Deploy from GitHub repo** y elige ese repositorio. Configura un único servicio web con **Root Directory** `/web`. El proyecto requiere Node.js 24 (`engines` en `web/package.json`), ejecuta `npm ci`, `npm run build` y `npm run start`. Next.js lee la variable `PORT` que suministra Railway. Genera un dominio HTTPS público en **Settings → Networking**.

## Persistencia

Agrega un servicio **PostgreSQL** al mismo proyecto de Railway. En las variables del servicio web, crea `DATABASE_URL` como referencia a la variable del servicio de base de datos:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Si el servicio se llama de otra forma, reemplaza `Postgres` por su nombre exacto. La referencia debe ser de tipo *Reference Variable* para que Railway gestione la contraseña sin copiarla al repositorio. Despliega de nuevo el servicio web después de añadirla. Al arrancar, la aplicación crea las tablas necesarias en PostgreSQL. La base inicia vacía, conforme a la decisión de descartar los datos de prueba de SQLite.

Con `DATABASE_URL`, las cuentas adultas, sesiones, perfiles, diagnósticos, práctica, progreso y valoraciones usan PostgreSQL. En local, sin esa variable, sigue funcionando SQLite. El servicio web ya no necesita `APOYO_DB_PATH` ni un Volume para esos datos; puedes retirar ambos **después de verificar** el flujo en PostgreSQL. No borres el volumen si aún necesitas recuperar algo de él. El registro real de menores sigue deshabilitado; sus rutas preparadas conservan almacenamiento separado y no forman parte de esta migración.

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
5. Despliega de nuevo y verifica que la cuenta y el progreso siguen presentes. Si no persisten, comprueba la referencia `DATABASE_URL` y los logs del servicio web y PostgreSQL.

El contenido de los 52 temas es provisional. La plataforma puede servir para demostración y pruebas con cuentas adultas; la publicación curricular y las cuentas de menores reales requieren resolver sus revisiones pendientes.
