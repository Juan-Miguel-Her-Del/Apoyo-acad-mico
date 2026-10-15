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
- Resumen provisional por subtema: una sola respuesta no basta para concluir dominio o dificultad. Dos o más aciertos del mismo subtema se muestran como fortaleza observada de demostración; la confianza en la señal usa la fórmula documentada en [`docs/26`](../docs/26-desarrollo-sprint-3-restaurado.md).
- Cuenta local de adulto/evaluador con registro, inicio y cierre de sesión, diagnóstico adaptativo e intentos de práctica evaluados y guardados en el servidor, cierre anticipado e historiales persistentes de diagnóstico y práctica.
- Ruta de explicaciones con IA preparada, limitada a fuentes aprobadas y fragmentos verificables. Hoy devuelve 409 para todos los temas de demostración y no llama al proveedor. El registro de estudiantes es una vista deshabilitada mientras se revisa la autorización.
- Valoración de la explicación de demostración (`me ayudó`/`sigo confundido`) por cuenta adulta, tema y versión, editable sin duplicados; pregunta breve provisional comparada solo con su respuesta de referencia.

Todos los temas y las preguntas mantienen los indicadores de publicación desactivados. `GET /api/diagnostic?mode=demo&grade=G05&subject=MAT&topic=G05-MAT` entrega las preguntas de vista previa sin respuestas; el modo publicado sigue bloqueado. El diagnóstico adaptativo usa provisionalmente el banco de práctica con identificadores separados: sus enunciados se repiten, por lo que la puntuación no es una medición independiente del nivel académico. La base `data/apoyo.sqlite` se crea al registrar una cuenta y se ignora en Git. `APOYO_DB_PATH` permite elegir una base distinta. El registro solo se habilita automáticamente en desarrollo local; producción requiere `APOYO_ENABLE_ADULT_ACCOUNTS=true` de forma explícita y no está preparada para usuarios menores reales.

Las rutas `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` y `/api/auth/me` manejan sesiones adultas en cookie HttpOnly. `/api/progress` consulta finalizaciones; el navegador no puede marcar un diagnóstico como completado sin terminar el intento guardado. `/api/diagnostic/attempt/start`, `/api/diagnostic/attempt`, `/api/diagnostic/attempt/answer` y `GET /api/diagnostic/attempts` inician, recuperan, evalúan y listan intentos diagnósticos propios. `/api/practice/start`, `/api/practice/answer`, `/api/practice/finish`, `/api/practice/session` y `/api/practice/sessions` gestionan intentos de práctica por cuenta. Una sesión terminada no admite más respuestas. Las respuestas y el puntaje de cada intento se guardan en SQLite. El registro adulto rechaza campos de fecha de nacimiento, documento y foto. `POST /api/explanation` exige sesión, intento publicado, dificultad suficiente y fuente académica aprobada; ninguna fuente real está cargada. `GET/POST /api/explanation/demo-feedback` recupera y actualiza la valoración de una explicación provisional de la cuenta adulta. `POST /api/student/register` y `/api/student/auth/login|me|logout` tienen contrato preparado, pero devuelven 503 en la aplicación real hasta integrar una política revisada y un verificador de representante en servidor.

La comparación del panel usa las dos últimas sesiones terminadas **con respuestas** del mismo tema, entre las 200 sesiones recientes de la cuenta. Si hay cero o una, muestra un estado insuficiente. El porcentaje describe aciertos entre preguntas respondidas; no indica dominio académico. Las rondas nuevas evitan repetir inmediatamente las preguntas del mismo tema y cambian de nivel tras dos aciertos.

Para preparar OpenAI en el servidor después, añade `OPENAI_API_KEY=...` a `.env.local` y reinicia el servidor. El modelo por defecto es `gpt-6-luna`; `APOYO_EXPLANATION_MODEL` permite configurarlo. ChatGPT y la API usan accesos y facturación separados. Mantén la clave fuera de `NEXT_PUBLIC_*` y del repositorio. La configuración no habilita contenido mientras falte aprobación curricular. Véase [`docs/26`](../docs/26-desarrollo-sprint-3-restaurado.md).

## Comprobar

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para `npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`, inicia primero `npm.cmd run start -- -p 3100` en otra terminal. La prueba de navegador usa Chrome instalado localmente; puedes definir `CHROME_PATH` si hace falta. Para verificar cuentas en un servidor de producción local, habilítalas solo en esa terminal con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'` antes de arrancar y usa una base separada con `APOYO_DB_PATH`. En la segunda terminal ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser` y `npm.cmd run test:diagnostic-browser`.

Consulta [el alcance de la entrega](../docs/18-entrega-academica-octubre.md) y [la documentación del proyecto](../docs/README.md).
