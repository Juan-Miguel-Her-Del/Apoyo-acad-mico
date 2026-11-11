# Revisión interna del contenido y la IA del piloto

**Versión fijada para esta evaluación:** fuente `study-draft-v2-2026-11-10`, banco de práctica `demo-2026-11-v4`, prompt `gemini-literal-extract-v1+local-correction-v2`. Esta es una revisión editorial y técnica de Codex, sin aprobación docente o humana independiente. El contenido y las explicaciones siguen **provisionales**; ninguna bandera de publicación se modificó.

## Seis combinaciones

| Combinación | Cambios y comprobación interna | Límite de la versión |
|---|---|---|
| G05-MAT | Explicaciones y preguntas de fracciones con distintos denominadores; resultados 3/4, 1/2 y 2/3 recalculados. | La resolución de problemas contextualizados sigue siendo acotada. |
| G05-ESP | Explicación de planificación, redacción y revisión; actividad para escribir un texto informativo con lista de autocontrol. | La producción escrita no recibe calificación automática ni validación docente. |
| G10-MAT | Modelo periódico `h(t)=4+2·sen(2πt/10)` contrastado con centro 4, amplitud 2, período 10 e inicio ascendente; se advierte que los extremos no determinan la fase. Preguntas de período, amplitud y función, además de seno y coseno introductorios. | Son modelos introductorios, no un banco exhaustivo de modelación. |
| G10-ESP | Identifica tesis y razón; los ejemplos distinguen afirmación y evidencia aún necesaria. | Los textos son breves; la lectura crítica avanzada no queda plenamente evaluada. |
| G10-FIS | Se conserva `F=ma` con unidades y se añade una pregunta conceptual sobre la primera ley de Newton. | Cobertura introductoria de las leyes y de la representación de fuerzas. |
| G10-QUI | Balanceo de `2 H₂ + O₂ → 2 H₂O`, `N₂ + 3 H₂ → 2 NH₃` y conservación de átomos; se añade una pregunta conceptual. | No cubre todas las relaciones cuantitativas de reacciones. |

El cotejo curricular orientativo usa las fuentes oficiales del [MEN para Matemáticas](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_Matematicas-min.pdf), [Lenguaje](https://www.colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_Lenguaje-min.pdf) y [Ciencias Naturales](https://www.colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_C.Naturales-min.pdf). Los DBA orientan el alcance, pero esta revisión interna no acredita correspondencia completa de cada pregunta con un DBA, estándar o malla.

## Flujo comprobado

Cada respuesta del diagnóstico recibe al momento una explicación local provisional, incluida una respuesta errónea aislada. La ruta de Gemini exige un intento completado y perteneciente a la cuenta; solo dos errores del mismo subtema producen evidencia de dificultad para pedir un ejemplo adicional. La corrección de la pregunta se construye en el servidor desde la pregunta y su clave guardadas; el proveedor recibe únicamente el extracto curricular. Si falta evidencia, la ruta responde HTTP 409 antes de consumir cuota o invocar Gemini.

Las prácticas antiguas conservan su clasificación de seno y coseno mediante la versión del banco, aunque los IDs del banco actual se reutilicen para preguntas nuevas de modelación.

## Muestra y revisión de 18 casos

Se capturaron **18 respuestas reales de Gemini**: por combinación, una explicación normal, otra para una pregunta errónea diferente y el último ejemplo disponible. Otros **6 casos** comprobaron el bloqueo por falta de evidencia: HTTP 409, cero llamadas a Gemini. Se usaron preguntas y cuentas sintéticas, sin datos personales reales.

La captura está en `web/data/ai-quality-captures-v2.json` (SHA-256 `662838997479b9fa452dd19af628b28807853112094c04ca6285c565bec81b8b`). La revisión individual, con los cinco puntajes de la [rúbrica](37-rubrica-calidad-ia.md), observación y severidad, está en `web/data/ai-quality-reviews-v2.json`. Ambos archivos están excluidos de Git por `web/.gitignore`; consérvalos junto con esta versión del proyecto si necesitas reproducir la evaluación. `web/scripts/record-pilot-ai-review.mjs` comprueba el hash antes de volver a generar el registro.

Desde `web/` se ejecutó `npm.cmd run review:ai -- data/ai-quality-reviews-v2.json`: **18/18 registros válidos, 3/3 por combinación, cero campos inválidos**. `reviewGatePassed=false` y el proceso sale con código 1, como exige la rúbrica cuando la fuente sigue provisional y la revisión es interna. Esta cobertura no equivale a aprobación docente ni a revisión humana caso por caso.

Las pruebas automatizadas, el linter y la compilación de producción pasaron con esta versión. Antes de publicarla para estudiantes reales hacen falta la revisión curricular y la puerta de publicación definida en el proyecto.
