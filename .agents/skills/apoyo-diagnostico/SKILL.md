---
name: apoyo-diagnostico
description: Diseñar, implementar o probar banco de preguntas, flujo diagnóstico, respuestas, avance y dificultad adaptativa del proyecto Apoyo_academico.
---

# Diagnóstico académico

Aplica a AP-52, AP-53, AP-56, AP-59, AP-69, AP-76, AP-83 y sus tareas relacionadas. Lee la incidencia vigente porque varios mensajes y reglas adaptativas todavía están pendientes de definir.

- Conserva la combinación `gradeId + subjectId + topicId` desde el selector. Antes de iniciar un diagnóstico real, vuelve a validar en el servidor que el tema pertenece a esa combinación, está publicado y tiene suficientes preguntas validadas. Las seis combinaciones actuales son fixtures del Sprint 1; no son bancos aprobados.
- Define una pregunta con ID estable, tema, subhabilidad cuando corresponda, dificultad, enunciado, opciones o formato de respuesta, solución, justificación y estado de validación. Separa por completo el banco de demostración del banco publicable.
- Rechaza respuestas vacías o inválidas y evita registrar dos veces una misma respuesta. Si el banco es insuficiente, devuelve una causa clara y ningún resultado ficticio. No almacenes progreso personal permanente antes de que exista la cuenta y el consentimiento aplicable.
- Para dificultad adaptativa, acuerda primero una regla determinista y su comportamiento en los límites del banco. Prueba secuencia finita, no repetición indebida, cambio de tema, carga fallida y preguntas agotadas.
- Al entregar, explica qué flujos son de demostración, qué puede usar un estudiante y qué sigue bloqueado por AP-314 o por consentimiento. Aporta pruebas y evidencia a la incidencia AP correspondiente.
