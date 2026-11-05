# Lecciones ampliadas y perfiles ficticios

Fecha: 4 de noviembre de 2026.

## Contenido de estudio

Cada una de las 26 combinaciones activas de grado y materia tiene ahora una lección de tres partes: acercamiento inicial, desarrollo y aplicación. Son 78 partes en total. Cada parte presenta una explicación y un ejemplo; la comprobación aparece después de recorrerlas. Se conservaron las preguntas diagnósticas y de práctica existentes. Matemáticas y Español cubren grados 1.º a 11.º; Física y Química cubren 10.º y 11.º.

El material es una **propuesta original de apoyo** orientada por los [DBA publicados por Colombia Aprende](https://www.colombiaaprende.edu.co/contenidos/coleccion/derechos-basicos-de-aprendizaje) y los [estándares básicos de competencias](https://colombiaaprende.edu.co/recurso-coleccion/estandares-basicos-de-competencias). No se presenta como transcripción de esos documentos ni como correspondencia verificada con un DBA específico. Los 26 temas actuales representan una selección por grado y materia, **no el currículo completo de cada grado**. Las banderas de publicación y aprobación docente siguen desactivadas.

Antes de publicar contenido académico para estudiantes reales faltan revisión por materia y grado, corrección de imprecisiones, trazabilidad curricular y una comprobación de que las preguntas evalúan lo que las lecciones enseñan. La revisión docente puede hacerse en una versión posterior, pero el material debe seguir etiquetado como provisional hasta entonces.

## Simulación de perfiles de menores

En «Crear cuenta» → «Estudiante menor de 18» aparece «Crear perfil ficticio de prueba». La simulación permite crear hasta ocho perfiles con un alias automático y un grado elegido. No solicita nombre, correo, contraseña, documento, fotografía ni datos del representante. El grado queda fijo durante el estudio. El diagnóstico de demostración guarda en `localStorage` el tema, el número de respuestas, el número de aciertos, la fecha y un resumen de aciertos por subtema. «Mi progreso» muestra las fortalezas observadas cuando hay al menos dos respuestas distintas correctas del mismo subtema, o explica por qué todavía no hay evidencia suficiente. Esta señal es provisional y no demuestra dominio académico. El perfil y sus resultados pueden borrarse desde «Perfil».

Estos perfiles **no son cuentas reales de menores**: no tienen sesión de servidor, recuperación, sincronización entre dispositivos ni práctica guardada. Las rutas `/api/student/*` continúan cerradas. Los datos de prueba solo persisten en el navegador donde se crearon; borrar los datos del sitio también los elimina. La interfaz pide usar únicamente información ficticia.

La decisión de mantener cerradas las rutas reales responde a que la autorización del representante y el derecho del menor a ser escuchado siguen pendientes de implementación y aprobación. La [SIC explica esos requisitos](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/tratamiento-excepcional-y-autorizacion-del-representante-legal-con-interes-superior). El carácter educativo o no comercial del proyecto no convierte una cuenta con datos reales de un menor en una simulación.

## Verificación

- `npm.cmd test`: 101 pruebas, incluida la cobertura de tres partes en las 26 combinaciones.
- `npm.cmd run lint` y `npm.cmd run build`.
- `BROWSER_TEST_ACCOUNTS=true; npm.cmd run test:browser`: creación, uso, conservación local y borrado de un perfil ficticio; estudio de tres partes; cuentas adultas y navegación móvil.
- `npm.cmd run test:diagnostic-browser`: diagnóstico persistente de cuenta adulta.
