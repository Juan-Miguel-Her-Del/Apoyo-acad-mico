---
name: apoyo-consentimiento-menores
description: Diseñar, implementar o revisar el consentimiento y los controles de datos de menores en Apoyo_academico, especialmente AP-304, AP-305, AP-308 y AP-311.
---

# Consentimiento de menores

La incidencia AP-304 exige un flujo colombiano para menores antes de activar cuentas o guardar progreso personal cuando corresponda. Es un asunto legal y de privacidad: consulta el texto vigente de Jira y fuentes oficiales actuales de Colombia antes de fijar requisitos. AP-304 enlaza la SIC y Función Pública. No importes un umbral de edad de otra jurisdicción ni presentes un texto generado como revisión jurídica aprobada.

Al trabajar en el flujo:

1. Separa decisiones verificadas legalmente, decisiones de producto y dudas abiertas. Prepara para revisión el aviso, finalidades, datos mínimos, método de verificación del representante, revocación y retención.
2. Modela una autorización con estado y evidencia restringida: versión del aviso, finalidades, fecha, medio y vínculo al representante según el diseño aprobado. Usa solo personas y datos sintéticos en desarrollo y pruebas.
3. Aplica la verificación en el servidor antes de activar cuenta de menor o persistir su progreso. Trata autorización ausente, revocada y acceso directo a la API como casos de prueba. No conserves respuestas o datos personales rechazados como si el acceso hubiera sido autorizado.
4. Entrega diagrama o contrato, casos de prueba y decisión jurídica pendiente. No marques AP-304 ni sus tareas como completos hasta que se cumplan sus criterios reales y la revisión especializada requerida para publicar.
