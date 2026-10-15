# Cuentas de estudiantes y consentimiento: implementación técnica pendiente de aprobación

**Estado (15 de octubre de 2026):** implementación interna con pruebas sintéticas. No hay registro público de menores. La revisión formal del aviso, la política, el método de verificación del representante y la conservación de datos sigue pendiente de entrega. Ninguna incidencia AP-304, AP-257, AP-267 o AP-236 puede cerrarse todavía por este código.

## Contrato implementado

El módulo [`student-accounts.ts`](../web/src/lib/student-accounts.ts) usa SQLite separado de las cuentas adultas de demostración. El constructor recibe una `ReviewedConsentPolicy`; la aplicación no proporciona ninguna política aprobada y el valor predeterminado es `null`. En ese estado, emitir autorización, registrar, iniciar sesión y consultar progreso devuelven `503`. Tampoco existe una ruta HTTP pública para emitir autorizaciones o activar cuentas de estudiantes.

La futura integración deberá recibir una constancia **del servidor verificador**, nunca del navegador, con referencia seudónima al representante y a la evidencia restringida, método aprobado, versión y digest del aviso exacto, finalidades de cuenta y progreso, fecha UTC y constancia mínima de haber escuchado al estudiante. No se solicita ni conserva fotografía de documentos, número de identificación, fecha de nacimiento o respuestas de menores antes de autorización.

Con una constancia sintética y política de prueba inyectadas, el almacén permite registrar una sola cuenta por autorización, guarda un hash `scrypt` de la contraseña y de cada token de sesión, y comprueba en el servidor la autorización vigente antes de abrir sesión o leer y escribir progreso. Incluso si algún código intenta inyectar una política, una comprobación fija bloquea todo en producción hasta realizar una revisión y un cambio de código explícito.

La escritura de progreso acepta únicamente el ID de una sesión completada. Un resolutor interno debe leer el resultado de una sesión autoritativa del mismo estudiante; el navegador no puede suministrar puntuación, fecha ni tema. El ID de origen es único: repetir la misma operación devuelve el resultado ya guardado. **Hoy no existe el resolutor conectado a las sesiones reales del estudiante**, por lo que el almacén predeterminado no admite ninguna escritura. Los tests usan un resolutor sintético. Esta integración sigue pendiente para AP-237 y AP-236.

Cada resultado pertenece a un identificador interno de estudiante. Cuando existan sesiones reales enlazadas, la comparación de AP-236 tomará las dos últimas sesiones del mismo tema y calculará el cambio en puntos porcentuales; con cero o una sesión devuelve el mensaje de insuficiencia sin afirmar mejora. La revocación cambia el estado y elimina las sesiones en una transacción; lecturas y escrituras posteriores fallan. El progreso anterior no se suprime automáticamente: la regla de conservación y supresión necesita aprobación jurídica.

## Límites actuales y trabajo para la revisión

1. Recibir el documento formal y registrar responsable, aprobador, fecha, versión, digest del aviso, finalidades, método para comprobar identidad **y vínculo legal**, canal de derechos, retención y tratamiento de revocación/supresión. El visto bueno verbal no sustituye esa evidencia.
2. Implementar y auditar el verificador del representante aprobado. Una casilla o código de correo no comprueba por sí solo el vínculo legal. El método debe emitir la constancia del servidor que consume el almacén; no aceptar un objeto `VerifiedAuthorization` aportado por el cliente.
3. Diseñar la interfaz comprensible para representante y estudiante, con elección expresa sin casilla premarcada, mecanismo para escuchar al menor y canales de consulta y revocación. Revisar su accesibilidad y el texto por edades antes de publicar.
4. Crear sesiones diagnósticas/de práctica propias del estudiante en un almacén autoritativo y conectar el resolutor de sesiones completadas. Probar identidad de propietario, fuente de puntuación e idempotencia por `sessionId`; ningún valor calculado debe venir del navegador.
5. Integrar rutas HTTP de registro, sesión, progreso y revocación con controles de origen, cookies protegidas, límites de petición y pruebas de acceso directo. El bloqueo fijo de producción solo se retirará después de documentar la aprobación formal y superar esas pruebas.
6. Revisar almacenamiento cifrado/restringido de evidencia, auditoría de acceso, protección de respaldo y política de borrado. El módulo solo conserva referencias opacas y no incluye el depósito de evidencia.
7. Ejecutar pruebas completas de autorización ausente, parcial, revocada, vencida, cambio de aviso, carreras entre revocación y escritura, acceso cruzado y persistencia tras reinicio; documentar resultados y cambios en Jira antes de marcar casillas.

Los casos sintéticos actuales se ejecutan con `cd web` y `node --experimental-strip-types --test tests/student-accounts.test.mjs`. Cubren puerta cerrada por defecto, comparación persistente, duplicados, aislamiento y revocación. Son evidencia del contrato interno, **no** de aprobación jurídica ni de un flujo de estudiantes publicado.

Referentes oficiales usados para el diseño: [Ley 1581 de 2012](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981), [Decreto 1377 de 2013, artículo 12](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646) y [concepto SIC sobre tratamiento excepcional de datos de menores](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/tratamiento-excepcional-y-autorizacion-del-representante-legal-con-interes-superior).
