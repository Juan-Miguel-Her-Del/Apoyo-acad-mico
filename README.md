# Apoyo_academico

Proyecto web de apoyo académico en desarrollo. El Sprint 3 amplió la demostración a 1.º–11.º; el Sprint 4 añadió sesiones de práctica y el avance del Sprint 5 permite terminarlas y comparar intentos en una cuenta local de prueba. El alcance original de los sprints sigue vigente en Jira.

## Iniciar en Windows

Requiere **Node.js 24**: la persistencia usa `node:sqlite`. En PowerShell:

```powershell
cd "C:\Users\JUAN M\OneDrive\Desktop\Proyecto_Academico\web"
npm.cmd install
npm.cmd run dev
```

Abre <http://localhost:3000>. Deja esa terminal abierta mientras usas la app. Para detenerla, pulsa `Ctrl+C`. Ejecuta los comandos dentro de `web`: la carpeta raíz no tiene script `dev`.

## Recorrido para presentar

1. En **Crear cuenta**, usa un correo de prueba que controles y una contraseña de al menos 12 caracteres. Confirma que eres adulto. La cuenta queda guardada en tu computador.
2. Elige un grado de 1.º a 11.º, una materia y el tema propuesto. Matemáticas y Español están disponibles en todos los grados; Física y Química, en 10.º y 11.º.
3. Pulsa **Empezar a estudiar (demo)**, contesta las dos preguntas y observa el resumen por subtema. Una sola respuesta por subtema se muestra como evidencia indeterminada.
4. Pulsa **Continuar a estudiar**, lee la explicación y el ejemplo. Puedes probar una pregunta rápida sin cuenta. Para guardar resultados, pulsa **Empezar práctica de dos preguntas**. La segunda respuesta termina la sesión automáticamente; también puedes usar **Terminar práctica ahora**, incluso antes de responder.
5. Vuelve al panel de cuenta y consulta **Historial de práctica**. Repite la práctica del mismo tema para ver **Comparar intentos de un tema**, con fechas, aciertos y cambio porcentual orientativo. Cierra sesión y vuelve a entrar: los resultados deben permanecer. Si sales antes de terminar, abre el mismo tema para continuar la sesión en ese navegador.

Hay **26 combinaciones**, **52 preguntas de diagnóstico**, **26 explicaciones y ejemplos** y **52 preguntas de práctica con seguimiento**. El material está marcado como provisional. La app no afirma una revisión docente ni un diagnóstico académico validado. La publicación curricular exige revisar las seis combinaciones iniciales en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y las otras veinte en [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316).

## Cuentas y datos

Las cuentas funcionan para la demostración **local de adultos o evaluadores**. La base SQLite se crea en `web/data/apoyo.sqlite` y está excluida de Git. Guarda las respuestas y el resultado de cada sesión de práctica por cuenta. Un cierre sin respuestas se muestra como tal y no calcula porcentaje ni marca el tema como completado. La comparación usa las dos últimas sesiones terminadas con respuestas del mismo tema; una sesión sin respuestas no entra en el cálculo. Para conservar tus cuentas, conserva ese archivo; para una copia de respaldo, detén el servidor antes de copiar la carpeta `web/data/`. No compartas esa base con el código del proyecto.

La mayoría de edad se declara en el formulario; todavía no hay verificación del representante de un menor. No registres menores reales ni subas fotos de documentos. El alta de estudiantes menores permanece pendiente de [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257). El acceso a cuentas en una compilación de producción está desactivado por defecto. La demostración se ejecuta con `npm.cmd run dev` en `localhost`.

## Verificar el proyecto

Desde `web/`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

La prueba de navegador usa la compilación de producción. En una terminal ejecuta `npm.cmd run start -- -p 3100` y, en otra, `npm.cmd run test:browser`. Para probar también las cuentas en ese modo local, inicia el servidor con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'; npm.cmd run start -- -p 3100`. En la otra terminal ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser`. Usa una base de prueba mediante `APOYO_DB_PATH` si quieres mantener separados esos registros.

## Documentación y estado

- [Guía de la entrega de octubre](docs/18-entrega-academica-octubre.md): alcance, decisiones y pendientes.
- [Desarrollo del Sprint 4](docs/19-desarrollo-sprint-4.md): práctica, sesiones y pruebas.
- [Desarrollo del Sprint 5](docs/20-desarrollo-sprint-5.md): cierre de práctica, comparación y límites.
- [Documentación completa](docs/README.md): planes y cierres anteriores.
- [Aplicación web](web/README.md): API y detalles técnicos.
- [Jira AP](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP): seguimiento del proyecto.

Los Sprints 1–4 se cerraron como prototipos. Un cierre anticipado del Sprint 5 quedó en Jira como historial de demostración (id 9; AP-201, AP-202, AP-205 y AP-319). Tras la corrección del alcance, el [Sprint 5 original](https://juanmiguelsworkspace-40060689.atlassian.net/jira/software/projects/AP/boards/3) se restauró en un sprint nuevo (id 39) con sus **24 incidencias previstas**, de las cuales 3 ya están en «Listo» y 21 siguen pendientes. La revisión curricular y el registro de menores conservan sus dependencias.
