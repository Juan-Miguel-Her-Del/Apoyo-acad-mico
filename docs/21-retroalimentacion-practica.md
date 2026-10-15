# Corrección explicada de práctica — AP-187/188/191

**Alcance de la regla:** para presentar una justificación como revisada, cada corrección necesita texto compatible con la opción correcta, nombre o identificador del revisor, fecha y evidencia de aprobación vinculada a la pregunta. La aprobación debe proceder de una fuente controlada por el servidor; el cliente no puede declararla.

| Entrada | Salida esperada |
|---|---|
| Pregunta evaluada con explicación y aprobación documentada de esa corrección | Estado `approved` y explicación revisada. Ejemplo sintético de prueba: una respuesta correcta a una suma, con justificación matemática coherente y acta de revisión de prueba. |
| Explicación ausente, provisional o sin revisor, fecha o evidencia | Estado `pending-review`, texto de explicación `null` y aviso «Explicación pendiente de revisión docente». No se presenta una justificación provisional como validada. |

`web/src/lib/practice-feedback.ts` implementa esta puerta; `web/tests/practice-feedback.test.mjs` cubre ambos casos con datos sintéticos. El banco actual de 26 temas no tiene aprobaciones reales de correcciones. La revisión docente futura permanece en AP-314/AP-316; hasta entonces AP-187 no debe cerrarse como experiencia curricular aprobada.

La respuesta elegida, el acierto y la opción de referencia son datos de la pregunta provisional y pueden mostrarse con esa etiqueta. No representan evaluación académica validada.
