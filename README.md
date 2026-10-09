# Apoyo_academico

Aplicación de apoyo académico para estudiantes de Colombia. El **Sprint 1** entregó el selector de grado, materia y tema; el **Sprint 2** está activo y añade una demostración de diagnóstico. El trabajo se sigue en el proyecto [AP de Jira](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP).

## Cómo abrir el proyecto

Requiere Node.js 20.9 o superior. Desde PowerShell:

```powershell
cd "C:\Users\JUAN M\OneDrive\Desktop\Proyecto_Academico\web"
npm.cmd install
npm.cmd run dev
```

Abre [http://localhost:3000](http://localhost:3000). En Windows se usa `npm.cmd` porque PowerShell puede bloquear `npm.ps1`.

Para verificar el cambio:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Las pruebas automáticas usan el ejecutor incluido en Node.js; no requieren librerías de prueba adicionales.

Para probar también la interfaz en Chrome, primero ejecuta `npm.cmd run build` y `npm.cmd run start -- -p 3100` en una terminal. En otra terminal, dentro de `web/`, ejecuta `npm.cmd run test:browser`. La prueba usa Chrome sin ventana y acepta `CHROME_PATH` si está instalado en otra ruta.

## Qué hace el Sprint 1

1. Muestra los grados 1.º–11.º agrupados en Primaria (1.º–5.º) y Bachillerato (6.º–11.º). Conserva los subciclos básica secundaria y media.
2. Permite recorrer **5.º** y **10.º** con datos de demostración. Los otros nueve grados aparecen como «Próximamente».
3. En 5.º ofrece Matemáticas y Español; en 10.º, Matemáticas, Español, Física y Química.
4. Muestra un tema compatible con la combinación elegida. Al cambiar el grado, limpia materia y tema; al cambiar la materia, limpia el tema.
5. Consulta el catálogo por HTTP. Muestra carga, estado vacío y error con botón «Reintentar». Descarta respuestas tardías para que no aparezcan opciones de una selección anterior.
6. Impide que una selección de tema incompatible o inactiva aparezca como válida. Al cerrar ese sprint todavía no existía el diagnóstico.

El catálogo completo propone **26 combinaciones**: Matemáticas y Español para 1.º–11.º, Física y Química para 10.º–11.º. Solo seis son candidatas del piloto:

| ID | Grado | Materia | Tema de demostración | Referencia curricular propuesta |
| --- | --- | --- | --- | --- |
| G05-MAT | 5.º | Matemáticas | Problemas con fracciones | Matemáticas 5.º, DBA 1 (v.2) |
| G05-ESP | 5.º | Español | Planear y producir un texto informativo | Lenguaje 5.º, DBA 8 (v.2) |
| G10-MAT | 10.º | Matemáticas | Razones y funciones trigonométricas | Matemáticas 10.º, DBA 4 (v.2) |
| G10-ESP | 10.º | Español | Comprensión crítica y argumentación sobre textos | Lenguaje 10.º, DBA 6 (v.2) |
| G10-FIS | 10.º | Física | Fuerzas y movimiento | Ciencias Naturales 10.º, DBA 1 (v.1) |
| G10-QUI | 10.º | Química | Reacciones inorgánicas y balanceo | Ciencias Naturales 10.º, DBA 3 (v.1) |

Los DBA se consultan en [Colombia Aprende](https://colombiaaprende.edu.co/contenidos/coleccion/derechos-basicos-de-aprendizaje). **Estos seis registros son ejemplos de navegación, no contenido aprobado para estudiantes.** Los otros 20 temas son borradores y no salen en el selector. En los datos, `approvedForPublication=false`, `explanationApproved=false` y `validatedQuestionCount=0` para todos. El filtro `getPublishedTopics` devuelve una lista vacía hasta que haya aprobación real de tema, explicación y preguntas.

## Dónde está cada parte

| Archivo | Función |
| --- | --- |
| [web/src/lib/catalog.ts](web/src/lib/catalog.ts) | Grados, materias, temas, matriz de disponibilidad y filtro de publicación. |
| [web/src/lib/selection.ts](web/src/lib/selection.ts) | Limpieza y validación de las selecciones dependientes. |
| [web/src/app/api/catalog/route.ts](web/src/app/api/catalog/route.ts) | API de lectura de grados, materias y temas de demostración. |
| [web/src/app/page.tsx](web/src/app/page.tsx) | Pantalla con los tres pasos y estados de carga, vacío y error. |
| [web/tests/catalog.test.mjs](web/tests/catalog.test.mjs) | Pruebas de la matriz, filtro de publicación y selección incompatible. |
| [web/tests/browser-smoke.mjs](web/tests/browser-smoke.mjs) | Pruebas reales en Chrome de navegación, vacío, error, reintento y respuesta tardía. |
| [docs/08-desarrollo-sprint-1.md](docs/08-desarrollo-sprint-1.md) | Decisiones y seguimiento del Sprint 1. |

La API responde a `/api/catalog?resource=grades`, `/api/catalog?resource=subjects&grade=G05` y `/api/catalog?resource=topics&grade=G10&subject=FIS`. Las respuestas llevan `mode: "demo"`. Una materia incompatible, como Física en 5.º, devuelve HTTP 400. El servidor no guarda cambios ni cuentas.

## Verificación realizada

Al 30 de septiembre de 2026: seis pruebas de lógica aprobadas, ESLint sin errores, compilación de producción correcta y consultas HTTP locales con respuestas 200 para combinaciones válidas y 400 para una combinación incompatible. La prueba de Chrome pasó el recorrido de los tres pasos, limpieza al cambiar grado o materia, estados vacíos, errores con reintento y descarte de una respuesta tardía. Las pruebas cubren 11 grados, 26 combinaciones, seis candidatos piloto, tema inactivo y requisitos de publicación. Sigue siendo aconsejable una revisión humana de presentación y accesibilidad antes del lanzamiento.

## Qué falta antes de publicar lecciones

La publicación del piloto requiere revisar las seis referencias y temas con una persona conocedora de cada materia, aprobar explicaciones y bancos de preguntas, y registrar esa aprobación en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314). “Revisión docente” es una comprobación de calidad del contenido educativo antes de ofrecerlo a estudiantes; no es un trámite legal para ejecutar el prototipo. Después se puede activar cada tema para estudiantes. El Sprint 2 conecta el selector con una **demostración** de diagnóstico, mientras la integración publicada de [AP-56](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-56) sigue pendiente. El objetivo de MVP es **10 de noviembre de 2026**, condicionado a esa validación y a los siguientes sprints. Cuentas, práctica, progreso y despliegue corresponden a trabajo posterior.

**Sprint 1 cerrado en Jira el 30 de septiembre de 2026:** prototipo funcional de selección y datos de demostración. Las 28 incidencias del sprint están en «Listo»; la revisión curricular y la integración del diagnóstico permanecen en AP-314 y AP-56. Los temas de prueba siguen sin aprobación de publicación.

## Sprint 2 en curso: probar el diagnóstico

Después de elegir un tema piloto, pulsa **Empezar a estudiar (demo)**. Verás un aviso, dos preguntas de prueba, tu avance y un resumen que desaparece al recargar la página. Las doce preguntas del banco de demostración no han sido revisadas por un docente. La ruta publicada sigue bloqueada y no se guardan respuestas ni progreso personal.

También quedó preparado el [diseño de consentimiento para menores](docs/10-consentimiento-menores-sprint-2.md), pendiente de revisión jurídica antes de crear cuentas para estudiantes. El [registro del Sprint 2](docs/11-desarrollo-sprint-2.md) explica las pruebas y lo que falta para cumplir las historias reales de Jira. El sprint está activo; no se ha cerrado.

Consulta [la documentación del proyecto](docs/README.md) y el [plan del Sprint 1](docs/08-desarrollo-sprint-1.md) para más contexto.

Para preparar el desarrollo siguiente, consulta [los agentes y skills del Sprint 2](docs/09-agentes-skills-sprint-2.md).
