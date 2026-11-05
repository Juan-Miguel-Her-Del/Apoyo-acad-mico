# Aplicación web de Apoyo_academico

## Ejecutar

Necesitas Node.js 24. Desde esta carpeta:

```powershell
npm.cmd install
npm.cmd run dev
```

Abre <http://localhost:3000> y detén el servidor con `Ctrl+C`. El [README principal](../README.md) contiene el recorrido de la sustentación.

Si el puerto 3000 está ocupado, usa `npm.cmd run dev -- -p 3100` y abre <http://localhost:3100>. Para ejecutar dos servidores de este mismo proyecto a la vez, asigna al segundo una carpeta de compilación separada: `$env:APOYO_TEST_DIST_DIR='.next-browser'; npm.cmd run dev -- -p 3100`.

## Qué incluye la aplicación

- Bienvenida con introducción, inicio de sesión y registro en dos pasos. El contenido personalizado se abre tras confirmar el correo; hay una vista previa opcional sin cuenta.
- Navegación separada en **Estudiar**, **Mi progreso** y **Cuenta**. En una cuenta, **Estudiar** usa el grado del perfil y solo pide materia y tema. El cambio de grado se hace en **Cuenta**; conserva el historial anterior y reinicia la selección actual. La vista previa sin cuenta permite explorar otros grados y volver a la bienvenida.
- Recorrido por pantallas breves: grado → materia → tema → diagnóstico → explicación → comprobación → práctica. La cuenta muestra sus resultados en pantallas de diagnósticos, prácticas y evolución; el perfil y los datos de seguridad tienen pantallas propias. [Auditoría de diseño y acciones](../docs/41-renovacion-diseno.md).
- Perfil para estudiantes de 18 años o más, incluidos quienes estudian por ciclos o aceleración, con nombre o apodo y grado editable. Para explorar el flujo de menores se pueden crear perfiles ficticios con alias automático y grado fijo; solo guardan resultados resumidos en este navegador. El registro real de menores continúa cerrado.
- Selector de 1.º–11.º: Matemáticas y Español en todos; Física y Química en 10.º–11.º.
- Un tema y tres partes de estudio con explicación y ejemplo por cada una de las 26 combinaciones (78 partes); también hay dos preguntas de vista previa diagnóstica, una prueba rápida y una sesión de práctica por tema. Con cuenta adulta, el diagnóstico adaptativo tiene cuatro preguntas por intento, con niveles 1 y 2. Las 26 combinaciones aún no representan el currículo completo de cada grado.
- Resumen provisional por subtema: una sola respuesta no basta para concluir dominio o dificultad. Dos o más aciertos del mismo subtema se muestran como fortaleza observada de demostración; la confianza en la señal usa la fórmula documentada en [`docs/26`](../docs/26-desarrollo-sprint-3-restaurado.md).
- Cuenta local para estudiante mayor de edad con confirmación de correo antes de activar cuentas nuevas, inicio y cierre de sesión, diagnóstico adaptativo e intentos de práctica evaluados y guardados en el servidor, cierre anticipado e historiales persistentes de diagnóstico y práctica.
- Ruta de explicaciones con IA preparada, limitada a fuentes aprobadas y fragmentos verificables. Hoy devuelve 409 para todos los temas de demostración y no llama al proveedor. El registro de menores es una vista deshabilitada mientras se revisa la autorización.
- Tras una dificultad detectada en un diagnóstico de demostración, aparece una explicación y un ejemplo del borrador local. Si `APOYO_ENABLE_PROVISIONAL_AI=true` y hay `GEMINI_API_KEY`, se ofrece una versión breve seleccionada por Gemini; un fallo del proveedor deja visible la explicación local. Sigue siendo material provisional y no cambia el estado de revisión académica. [Detalles](../docs/45-explicaciones-provisionales.md).
- Valoración de la explicación de demostración (`me ayudó`/`sigo confundido`) por cuenta adulta, tema y versión, editable sin duplicados; pregunta breve provisional comparada solo con su respuesta de referencia.

Todos los temas y las preguntas mantienen los indicadores de publicación desactivados. `GET /api/diagnostic?mode=demo&grade=G05&subject=MAT&topic=G05-MAT` entrega las preguntas de vista previa sin respuestas; el modo publicado sigue bloqueado. El diagnóstico adaptativo usa provisionalmente el banco de práctica con identificadores separados: sus enunciados se repiten, por lo que la puntuación no es una medición independiente del nivel académico. La base `data/apoyo.sqlite` se crea al solicitar una cuenta y se ignora en Git. `APOYO_DB_PATH` permite elegir una base distinta. El registro nuevo requiere correo configurado y confirmación, también en desarrollo local; producción requiere además `APOYO_ENABLE_ADULT_ACCOUNTS=true` de forma explícita y no está preparada para usuarios menores reales.

`POST /api/auth/register` guarda una solicitud temporal sin crear sesión; `/api/auth/verify` activa la cuenta al consumir el enlace. `/api/auth/email-status` indica si el envío está configurado. `/api/auth/login`, `/api/auth/logout` y `/api/auth/me` manejan sesiones de estudiantes mayores de edad en cookie HttpOnly. `/api/profile` guarda el nombre o apodo y el grado del perfil. `/api/progress` consulta finalizaciones; el navegador no puede marcar un diagnóstico como completado sin terminar el intento guardado. `/api/diagnostic/attempt/start`, `/api/diagnostic/attempt`, `/api/diagnostic/attempt/answer` y `GET /api/diagnostic/attempts` inician, recuperan, evalúan y listan intentos diagnósticos propios. `/api/practice/start`, `/api/practice/answer`, `/api/practice/finish`, `/api/practice/session` y `/api/practice/sessions` gestionan intentos de práctica por cuenta. Una sesión terminada no admite más respuestas. Las respuestas y el puntaje de cada intento se guardan en SQLite. El registro de mayores de edad rechaza campos de fecha de nacimiento, documento y foto. `POST /api/explanation` exige sesión, intento publicado, dificultad suficiente y fuente académica aprobada; ninguna fuente real está cargada. `GET/POST /api/explanation/demo-feedback` recupera y actualiza la valoración de una explicación provisional de la cuenta. `POST /api/student/register` y `/api/student/auth/login|me|logout` son rutas preparadas para menores: devuelven 503 en la aplicación real hasta integrar una política revisada y un verificador de representante en servidor.

## Activar el correo de confirmación

El envío está preparado para Resend y **no se activa sin una clave y un remitente válidos**. En `web/.env.local` configura `RESEND_API_KEY`, `APOYO_EMAIL_FROM` (remitente de un dominio verificado) y `APOYO_PUBLIC_URL` (URL HTTPS de la aplicación), luego reinicia Next.js. No pegues la clave en el chat ni la pongas en `NEXT_PUBLIC_*`. Si usas un túnel temporal, actualiza `APOYO_PUBLIC_URL` cuando cambie. La cuenta nueva se habilita solo tras abrir el enlace que llega a su correo. Las cuentas anteriores conservan su acceso y datos; su correo no se marca como verificado retroactivamente. Consulta [el recorrido y los pendientes](../docs/40-bienvenida-registro-verificacion.md).

La comparación del panel usa las dos últimas sesiones terminadas **con respuestas** del mismo tema, entre las 200 sesiones recientes de la cuenta. Si hay cero o una, muestra un estado insuficiente. El porcentaje describe aciertos entre preguntas respondidas; no indica dominio académico. Las rondas nuevas evitan repetir inmediatamente las preguntas del mismo tema y cambian de nivel tras dos aciertos. Las cuentas de mayores de edad tienen una finalidad de estudio, aunque el contenido actual siga siendo provisional.

Para preparar Gemini en el servidor, añade `GEMINI_API_KEY=...` a `.env.local` y reinicia el servidor. El modelo predeterminado es `gemini-3.5-flash-lite`; `APOYO_GEMINI_MODEL` permite cambiarlo. Cuando existen ambas claves, la app selecciona Gemini. Para comprobar la conexión con texto ficticio, ejecuta `npm.cmd run check:gemini`. OpenAI sigue disponible con `OPENAI_API_KEY` y `npm.cmd run check:openai`. Mantén ambas claves fuera de `NEXT_PUBLIC_*` y del repositorio. Configurar un proveedor no habilita las explicaciones mientras falte aprobación curricular. Véase [la integración y privacidad de Gemini](../docs/44-integracion-gemini.md).

## Comprobar

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para `npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`, inicia primero `npm.cmd run start -- -p 3100` en otra terminal. La prueba de navegador usa Chrome instalado localmente; puedes definir `CHROME_PATH` si hace falta. Para verificar cuentas en un servidor de producción local, habilítalas solo en esa terminal con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'` antes de arrancar y usa una base separada con `APOYO_DB_PATH`. En la segunda terminal ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`.

Consulta [el alcance de la entrega](../docs/18-entrega-academica-octubre.md) y [la documentación del proyecto](../docs/README.md).
