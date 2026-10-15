# Aplicación web de Apoyo_academico

## Ejecutar

Necesitas Node.js 24. Desde esta carpeta:

```powershell
npm.cmd install
npm.cmd run dev
```

Abre <http://localhost:3000> y detén el servidor con `Ctrl+C`. El [README principal](../README.md) contiene el recorrido de la sustentación.

## Qué incluye la demostración

- Selector de 1.º–11.º: Matemáticas y Español en todos; Física y Química en 10.º–11.º.
- Un tema, dos preguntas de vista previa diagnóstica, una explicación y ejemplo, una prueba rápida y una sesión de práctica por cada una de las 26 combinaciones. Con cuenta adulta, el diagnóstico adaptativo tiene cuatro preguntas por intento, con niveles 1 y 2.
- Resumen provisional por subtema: una sola respuesta no basta para concluir dominio o dificultad.
- Cuenta local de adulto/evaluador con registro, inicio y cierre de sesión, diagnóstico adaptativo e intentos de práctica evaluados y guardados en el servidor, cierre anticipado de práctica e historial persistente de práctica con comparación de dos intentos del mismo tema.

Todos los temas y las preguntas mantienen los indicadores de publicación desactivados. `GET /api/diagnostic?mode=demo&grade=G05&subject=MAT&topic=G05-MAT` entrega las preguntas de vista previa sin respuestas; el modo publicado sigue bloqueado. El diagnóstico adaptativo usa provisionalmente el banco de práctica con identificadores separados: sus enunciados se repiten, por lo que la puntuación no es una medición independiente del nivel académico. La base `data/apoyo.sqlite` se crea al registrar una cuenta y se ignora en Git. `APOYO_DB_PATH` permite elegir una base distinta. El registro solo se habilita automáticamente en desarrollo local; producción requiere `APOYO_ENABLE_ADULT_ACCOUNTS=true` de forma explícita y no está preparada para usuarios menores reales.

Las rutas `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` y `/api/auth/me` manejan sesiones en cookie HttpOnly. `/api/progress` consulta finalizaciones; el navegador no puede marcar un diagnóstico como completado sin terminar el intento guardado. Completar una práctica como avance exige evaluar sus dos respuestas. `/api/diagnostic/attempt/start`, `/api/diagnostic/attempt`, `/api/diagnostic/attempt/answer` inician, recuperan y evalúan intentos diagnósticos de la cuenta. `/api/practice/start`, `/api/practice/answer`, `/api/practice/finish`, `/api/practice/session` y `/api/practice/sessions` inician, evalúan, terminan, recuperan y listan intentos de práctica por cuenta. `POST /api/practice/finish` acepta `{ "sessionId": "..." }`, requiere la cookie de la cuenta propietaria y es idempotente; una sesión terminada no admite más respuestas. Las respuestas y el puntaje de cada intento se guardan en SQLite. El registro rechaza campos de fecha de nacimiento, documento y foto.

La comparación del panel usa las dos últimas sesiones terminadas **con respuestas** del mismo tema, entre las 200 sesiones recientes de la cuenta. Si hay cero o una, muestra un estado insuficiente. El porcentaje describe aciertos entre preguntas respondidas; no indica dominio académico. Repetir la práctica vuelve a mostrar las mismas dos preguntas provisionales hasta ampliar el banco: todavía no satisface la historia de evitar repetición inmediata.

## Comprobar

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para `npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`, inicia primero `npm.cmd run start -- -p 3100` en otra terminal. La prueba de navegador usa Chrome instalado localmente; puedes definir `CHROME_PATH` si hace falta. Para verificar cuentas en un servidor de producción local, habilítalas solo en esa terminal con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'` antes de arrancar y usa una base separada con `APOYO_DB_PATH`. En la segunda terminal ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`.

Consulta [el alcance de la entrega](../docs/18-entrega-academica-octubre.md) y [la documentación del proyecto](../docs/README.md).
