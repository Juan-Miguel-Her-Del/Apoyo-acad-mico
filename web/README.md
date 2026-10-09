# Apoyo académico — aplicación web

## Diagnóstico de demostración (Sprint 2)

Selecciona 5.º o 10.º, una materia y un tema del piloto. Pulsa **Empezar a estudiar (demo)**, lee el aviso y responde dos preguntas. Verás tu avance, una explicación por respuesta y un resumen al terminar. Puedes salir o cambiar de grado, materia o tema; el intento se reinicia. Una respuesta vacía o ajena al tema se rechaza. El cliente evita enviar dos veces la misma respuesta por doble clic.

Las 12 preguntas están en `src/lib/diagnostic.ts` y son **ejemplos sin revisión docente**. `GET /api/diagnostic?mode=demo&grade=G05&subject=MAT&topic=G05-MAT` devuelve preguntas sin soluciones; `POST /api/diagnostic` evalúa una respuesta de demostración. El modo publicado sigue cerrado con HTTP 409, ya que los temas y preguntas no han sido aprobados. No se cambiaron las banderas curriculares del catálogo.

El resultado existe solo en el estado de la página: recargar o cerrar la pestaña lo borra. El servidor no guarda intentos ni identifica estudiantes. Como el endpoint POST no mantiene estado de intentos, una llamada HTTP directa repetida recibe la misma evaluación; la prevención de duplicados y el registro persistente quedan pendientes de cuentas, consentimiento y diseño del servicio. Tampoco hay dificultad adaptativa ni contenido de estudio aprobado todavía.

Verificación: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` y, con `npm.cmd run start -- -p 3100` en otra terminal, `npm.cmd run test:browser`. Usa el servidor de producción compilado para esta prueba: el modo de desarrollo ejecuta efectos adicionales de React y altera las simulaciones de errores de red. Las pruebas cubren validación de combinaciones, bloqueo de publicación, opciones inválidas, doble clic, cambio de selección durante la carga y secuencia completa.

## Ejecutar en tu computador

Desde esta carpeta en PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Abre [http://localhost:3000](http://localhost:3000). Detén el servidor con `Ctrl+C`. Para la estructura del proyecto y el estado de Jira, lee el [README principal](../README.md) y el [registro del Sprint 2](../docs/11-desarrollo-sprint-2.md).
