# Apoyo_academico

Proyecto web de apoyo académico en desarrollo. La demostración cubre 1.º–11.º. El Sprint 3 restaurado añade fortalezas y confianza por subtema, historial diagnóstico y una integración de IA preparada; el Sprint 5 aporta rondas de práctica, seguimiento y gráfica. El alcance original de los sprints sigue vigente en Jira.

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
3. Pulsa **Empezar a estudiar (demo)**. Con la cuenta adulta se inicia un diagnóstico provisional de **cuatro preguntas**: el servidor guarda cada respuesta y cambia la dificultad entre los niveles 1 y 2. Puedes recargar la página y retomar el intento. Sin cuenta, la vista previa anónima tiene dos preguntas y no guarda un intento. Una sola respuesta por subtema se muestra como evidencia indeterminada.
4. Pulsa **Continuar a estudiar**, lee la explicación y el ejemplo. Puedes probar una pregunta rápida sin cuenta. Para guardar resultados, pulsa **Empezar práctica de dos preguntas**. La segunda respuesta termina la sesión automáticamente; también puedes usar **Terminar práctica ahora**, incluso antes de responder.
5. Inicia otra ronda del mismo tema: después de dos aciertos, las preguntas pasan al nivel 2; si no aciertas ambas, permanecen en nivel 1 con preguntas nuevas. Al agotar el nivel verás un aviso y el resumen anterior se conservará. Las explicaciones de corrección aparecerán como pendientes de revisión docente.
6. En el resumen diagnóstico, consulta **fortalezas observadas** y **confianza en la señal**. Una respuesta aislada se mantiene indeterminada. Las explicaciones personales indican revisión pendiente. Vuelve al panel de cuenta para abrir un diagnóstico guardado, el **Historial de práctica**, **Comparar intentos de un tema** y **Dominio y evolución por subtema**. Cierra sesión y vuelve a entrar: los resultados deben permanecer.

Hay **26 combinaciones**, **52 preguntas de la vista previa diagnóstica**, **26 explicaciones y ejemplos** y **156 preguntas de práctica con seguimiento** (6 por tema, en dos niveles). El diagnóstico adaptativo de cuenta utiliza provisionalmente esas 156 preguntas de práctica con identificadores de intento propios; por tanto comparte enunciados con estudio y práctica. El material está marcado como provisional. La app no afirma una revisión docente, un diagnóstico académico independiente o validado ni una medición de dominio validada. La publicación curricular exige revisar las seis combinaciones iniciales en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y las otras veinte en [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316).

## Cuentas y datos

Las cuentas funcionan para la demostración **local de adultos o evaluadores**. La base SQLite se crea en `web/data/apoyo.sqlite` y está excluida de Git. Guarda las respuestas y el resultado de cada intento diagnóstico y sesión de práctica por cuenta. Un diagnóstico solo marca avance cuando termina con cuatro respuestas; la vista previa anónima no lo marca. Un cierre de práctica sin respuestas se muestra como tal y no calcula porcentaje ni marca el tema como completado. La comparación usa las dos últimas sesiones de práctica terminadas con respuestas del mismo tema; una sesión sin respuestas no entra en el cálculo. Para conservar tus cuentas, conserva ese archivo; para una copia de respaldo, detén el servidor antes de copiar la carpeta `web/data/`. No compartas esa base con el código del proyecto.

La mayoría de edad se declara en el formulario de demostración. Hay una base técnica separada para cuentas estudiantiles, pero no hay registro público de menores: falta el documento formal de revisión, el verificador del representante y la integración con prácticas reales. No registres menores reales ni subas fotos de documentos. El alta permanece pendiente de [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y [AP-257](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-257). El acceso a cuentas en una compilación de producción está desactivado por defecto. La demostración se ejecuta con `npm.cmd run dev` en `localhost`.

## Verificar el proyecto

Desde `web/`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run coverage:practice
```

La prueba de navegador usa la compilación de producción. En una terminal ejecuta `npm.cmd run start -- -p 3100` y, en otra, `npm.cmd run test:browser`. Para probar también las cuentas en ese modo local, inicia el servidor con `$env:APOYO_ENABLE_ADULT_ACCOUNTS='true'; npm.cmd run start -- -p 3100`. En la otra terminal ejecuta `$env:BROWSER_TEST_ACCOUNTS='true'; npm.cmd run test:browser`. Usa una base de prueba mediante `APOYO_DB_PATH` si quieres mantener separados esos registros.

## Documentación y estado

- [Desarrollo del Sprint 4](docs/19-desarrollo-sprint-4.md): práctica, sesiones y pruebas.
- [Desarrollo del Sprint 5](docs/20-desarrollo-sprint-5.md): alcance original, práctica, progreso y criterios abiertos.
- [Auditoría de alcance de sprints](docs/23-auditoria-alcance-sprints.md): revisión de los Sprints 1–6 y restauración de los alcances 2–4.
- [Regla adaptativa del diagnóstico](docs/24-regla-diagnostico-adaptativo.md): selección de dificultad, banco provisional y límites.
- [Diagnóstico del Sprint 2 restaurado](docs/25-diagnostico-sprint-2-restaurado.md): intento guardado, API, pruebas y dependencias.
- [Desarrollo del Sprint 3 restaurado](docs/26-desarrollo-sprint-3-restaurado.md): fortalezas, confianza, IA preparada y cuentas estudiantiles pendientes.
- [Correcciones de práctica](docs/21-retroalimentacion-practica.md): regla de revisión antes de mostrar explicaciones.
- [Cuentas estudiantiles](docs/22-cuentas-estudiantes-consentimiento.md): base técnica y decisiones formales pendientes.
- [Documentación completa](docs/README.md): planes y cierres anteriores.
- [Aplicación web](web/README.md): API y detalles técnicos.
- [Jira AP](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP): seguimiento del proyecto.

El Sprint 1 conserva sus 12 incidencias terminadas. Los cierres anticipados de demostración de los Sprints 2–5 quedan como historial en Jira; sus alcances completos se restauraron en sprints futuros separados. El Sprint 3 restaurado tiene **20 incidencias principales: 11 Listo y 9 En curso**, según la [verificación actual](docs/26-desarrollo-sprint-3-restaurado.md). El Sprint 6 sigue futuro con sus 23 incidencias vigentes. No se fijaron fechas nuevas para los Sprints 2–4 porque sus fechas originales ya pasaron. La revisión curricular y el registro de menores conservan sus dependencias.
