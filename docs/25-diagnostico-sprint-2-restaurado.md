# Diagnóstico del Sprint 2 restaurado

**Proyecto:** AP — Apoyo_academico. **Fecha de trabajo:** 15 de octubre de 2026.

Este documento registra el trabajo técnico de AP-52, AP-56, AP-59, AP-76, AP-77, AP-80, AP-83, AP-84, AP-87 y AP-90 en el Sprint 2 de alcance original (id 40). El cierre histórico del Sprint 2 (id 6) describe una entrega anterior; este documento refleja el desarrollo posterior.

## Funcionamiento de la demostración

- Una cuenta local de adulto o evaluador inicia un intento para una combinación activa de grado, materia y tema. El servidor conserva en SQLite el intento, una copia del banco provisional y cada respuesta. Al recargar, recupera el intento de la misma cuenta.
- El servidor elige una pregunta por turno. La primera es de nivel 1; después de un acierto solicita nivel 2 y después de un error nivel 1. Nunca reutiliza una pregunta contestada. El máximo de producto es cuatro preguntas por intento. La [regla completa y los casos límite](24-regla-diagnostico-adaptativo.md) describen el desempate y el agotamiento.
- Una respuesta vacía, una opción ajena, una pregunta fuera de turno, una repetición o un intento de otra cuenta no incrementan los aciertos ni el avance. El servidor calcula el total; el cliente no envía una puntuación.
- Sin cuenta se conserva una **vista previa anónima** de dos preguntas, sin intento guardado. La interfaz distingue esta vista del intento persistente de cuenta.

El banco adaptativo usa seis preguntas provisionales por cada una de las 26 combinaciones actuales, derivadas del banco de práctica. Por ello comparte enunciados con estudio y práctica. Los identificadores de diagnóstico son independientes, pero **la puntuación no mide de forma independiente ni validada el nivel académico**. Las explicaciones de corrección permanecen pendientes de revisión docente. No se activan contenidos publicados ni cuentas de menores por este trabajo.

## Contrato técnico

Las rutas de intento requieren una sesión local de adulto o evaluador y rechazan el modo publicado mientras no exista un banco aprobado:

| Método y ruta | Entrada | Salida principal |
| --- | --- | --- |
| `POST /api/diagnostic/attempt/start` | `gradeId`, `subjectId`, `topicId`, `mode: "demo"` | Intento y primera pregunta, sin clave de respuesta. |
| `GET /api/diagnostic/attempt?attemptId=...` | Id del intento propio | Estado, pregunta actual y respuestas guardadas. |
| `GET /api/diagnostic/attempt?gradeId=...&subjectId=...&topicId=...` | Selección activa | Último intento abierto de ese tema en la cuenta. |
| `POST /api/diagnostic/attempt/answer` | `attemptId`, `questionId`, `optionId` | Intento actualizado, retroalimentación y siguiente pregunta. |

El banco y las claves de respuesta se guardan en el servidor para que un cambio posterior del contenido no altere un intento abierto. La respuesta pública contiene solo la pregunta actual y los datos necesarios para presentar el avance. El progreso de diagnóstico se registra cuando el intento termina con las respuestas requeridas; no depende de un indicador de finalización enviado por el navegador.

## Criterios y dependencias

| Incidencias | Evidencia técnica prevista | Dependencia externa |
| --- | --- | --- |
| AP-52, AP-59 | Inicio, secuencia finita y resultado de intento guardado; sin resultado ficticio si no hay banco suficiente. | Publicación académica exige contenido revisado. |
| AP-56 | Integración del selector y rechazo de combinación inválida o modo publicado sin banco aprobado. | El flujo publicado y banco validado dependen de AP-314/AP-316. |
| AP-76, AP-77, AP-80 | Formulario y registro único de respuesta, con corrección de entradas inválidas. | El uso por estudiantes reales depende además del alta autorizada. |
| AP-83, AP-84, AP-87, AP-90 | Regla adaptativa, selección y límites comprobados en banco provisional clasificado. | Calibración y validez académica requieren revisión docente y pruebas posteriores. |

Los criterios originales permanecen en Jira. La implementación de una demostración técnica no equivale a declarar cumplida la revisión curricular de AP-314 ni la revisión de consentimiento de AP-304.

## Verificación

Ejecutar desde `web/`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

**Resultado observado:** 56/56 pruebas automatizadas, lint y compilación de producción correctos. Los smoke de navegador invitado y con cuenta, y la prueba dedicada del diagnóstico con cuenta, pasaron. El smoke dedicado verificó HTTP 401 sin sesión, 403 desde otro origen, 400 para opción inválida, 409 para segundo inicio/respuesta repetida/modo publicado, GET sin clave ni preguntas futuras, reanudación tras recarga y cuatro respuestas con resultado persistido. Las pruebas de almacén cubren banco insuficiente (409 sin intento ni avance), aislamiento entre cuentas, snapshot del banco y transición real de dificultad 1→2→1. No se detectaron defectos abiertos en este flujo de demostración.

Para repetir el recorrido de navegador en producción local, arranca `npm.cmd run start -- -p 3100` con `APOYO_ENABLE_ADULT_ACCOUNTS=true` y una base temporal mediante `APOYO_DB_PATH`; en otra terminal ejecuta `BROWSER_TEST_ACCOUNTS=true` con `npm.cmd run test:browser` y después `npm.cmd run test:diagnostic-browser`. `BROWSER_TEST_URL` cambia el puerto de destino si usas otro. Chrome debe estar instalado o indicado con `CHROME_PATH`.

Commits de implementación: `0c84202`, `987cf8b`, `f70ef7b` y `d755540`. La publicación para estudiantes permanece bloqueada; sus dependencias se registran en las incidencias correspondientes de Jira.
