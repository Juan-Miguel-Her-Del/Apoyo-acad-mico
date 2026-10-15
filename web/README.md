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
- Un tema, dos preguntas de diagnóstico, una explicación y ejemplo, una prueba rápida y una sesión de dos preguntas de práctica por cada una de las 26 combinaciones.
- Resumen provisional por subtema: una sola respuesta no basta para concluir dominio o dificultad.
- Cuenta local de adulto/evaluador con registro, inicio y cierre de sesión, respuestas de práctica evaluadas en el servidor e historial persistente.

Todos los temas y las preguntas mantienen los indicadores de publicación desactivados. `GET /api/diagnostic?mode=demo&grade=G05&subject=MAT&topic=G05-MAT` entrega preguntas sin respuestas; el modo publicado sigue bloqueado. La base `data/apoyo.sqlite` se crea al registrar una cuenta y se ignora en Git. `APOYO_DB_PATH` permite elegir una base distinta. El registro solo se habilita automáticamente en desarrollo local; producción requiere `APOYO_ENABLE_ADULT_ACCOUNTS=true` de forma explícita y no está preparada para usuarios menores reales.

Las rutas `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` y `/api/auth/me` manejan sesiones en cookie HttpOnly. `/api/progress` consulta finalizaciones y solo permite guardar la de diagnóstico; completar una práctica se registra únicamente al evaluar sus dos respuestas. `/api/practice/start`, `/api/practice/answer`, `/api/practice/session` y `/api/practice/sessions` inician, evalúan, recuperan y listan intentos por cuenta. Las respuestas y el puntaje de cada intento se guardan en SQLite. El registro rechaza campos de fecha de nacimiento, documento y foto.

## Comprobar

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para `npm.cmd run test:browser`, inicia primero `npm.cmd run start -- -p 3100` en otra terminal. La prueba de navegador usa Chrome instalado localmente; puedes definir `CHROME_PATH` si hace falta. Para verificar cuentas en un servidor de producción local, habilítalas solo en esa terminal con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'` antes de arrancar y ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser` en la segunda terminal.

Consulta [el alcance de la entrega](../docs/18-entrega-academica-octubre.md) y [la documentación del proyecto](../docs/README.md).
