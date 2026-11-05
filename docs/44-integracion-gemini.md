# Gemini como proveedor opcional de explicaciones

**Fecha:** 5 de noviembre de 2026. La integración está implementada, pero no hay `GEMINI_API_KEY` configurada ni una respuesta real verificada en este proyecto.

## Configuración local

1. Crea una clave de Gemini API en [Google AI Studio](https://aistudio.google.com/app/apikey). La [guía oficial](https://ai.google.dev/gemini-api/docs/get-started) explica el registro y las claves.
2. En `web/.env.local`, añade `GEMINI_API_KEY=tu_clave`. No compartas la clave ni uses el prefijo `NEXT_PUBLIC_`.
3. Reinicia `npm.cmd run dev`. Si están configuradas las claves de Gemini y OpenAI, la app usa Gemini. El modelo predeterminado es `gemini-3.5-flash-lite`; se puede cambiar con `APOYO_GEMINI_MODEL`.
4. Desde `web/`, ejecuta `npm.cmd run check:gemini`. Esta prueba manda solo texto matemático ficticio y muestra si la extracción fue válida, sin imprimir la clave ni el texto generado.

El adaptador usa la [Interactions API](https://ai.google.dev/gemini-api/docs/get-started) con JSON estructurado, `store: false` y una única interacción. Solo recibe identificadores curriculares y fragmentos académicos. La app comprueba después que los textos devueltos sean extractos literales de una fuente aprobada. No se envían nombre, correo, perfil ni respuestas de estudiantes.

## Costo, datos y límites

Google publica una [cuota gratuita limitada](https://ai.google.dev/gemini-api/docs/pricing) para modelos compatibles. En su [política de servicios gratuitos](https://ai.google.dev/gemini-api/terms), Google indica que puede usar entradas y salidas para mejorar sus productos y que revisores humanos pueden examinarlas; también pide no enviar información personal, sensible o confidencial. Por eso esta integración debe seguir restringida a contenido curricular genérico durante las pruebas gratuitas. El proveedor y estas condiciones deben incorporarse al inventario que revisará la abogada antes de tratar datos de menores reales.

La clave y la cuota no resuelven el bloqueo académico: `POST /api/explanation` seguirá devolviendo 409 hasta contar con diagnóstico publicado, fuente versionada y aprobación docente verificable. La ruta estudiantil real permanece cerrada. Las pruebas actuales son simuladas; la respuesta real de Gemini queda pendiente de configurar la clave.
