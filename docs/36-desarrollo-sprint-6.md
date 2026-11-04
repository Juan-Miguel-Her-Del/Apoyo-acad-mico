# Sprint 6 — desarrollo y estado verificable

Fecha de implementación: 19 de octubre de 2026. El Sprint 6 de Jira está planificado del 3 al 10 de noviembre; este trabajo adelanta su desarrollo sin alterar esas fechas ni declarar cerradas incidencias que dependen de terceros.

## Funciones implementadas para la demostración adulta

| Jira | Entrega | Prueba principal | Límite |
|---|---|---|---|
| AP-38/39/42 | Cambio de grado, materia o tema; se restablecen selección y flujo diagnóstico dependiente | `selection.test.mjs` y prueba de navegador | Una combinación retirada o incoherente se rechaza; el cambio de tema reinicia el componente de diagnóstico |
| AP-45/46/49 | Último tema válido por cuenta en SQLite; se recupera al volver a iniciar sesión | `sprint6.test.mjs` | Si el tema se retira, se avisa y se solicita otro |
| AP-243/244/247 | Sugerencia del siguiente tema a partir de subhabilidades con al menos dos prácticas completas y dos respuestas; umbral provisional: menos de 80 % | `sprint6.test.mjs` | Sin evidencia suficiente se propone explorar otro tema sin declarar dificultad |
| AP-250/251/254 | Racha de días únicos con práctica terminada y al menos una respuesta; zona `America/Bogota` | `sprint6.test.mjs` | Sin actividad reciente: cero; una práctica de ayer conserva la racha hasta acabar el día actual |
| AP-277/278/281 | Recuperación adulta por correo con token aleatorio de 256 bits, hash en SQLite, 30 minutos, un solo uso, máximo tres solicitudes por correo y hora, revocación de sesiones | `sprint6.test.mjs` | El correo se envía solo si hay proveedor configurado; la respuesta no revela si existe la cuenta |
| AP-284/285/288/291 | Eliminación de cuenta adulta con contraseña y confirmación `ELIMINAR`; claves foráneas eliminan progreso, intentos, prácticas, valoraciones y sesiones | `sprint6.test.mjs` | La acción no está habilitada para menores; faltan decisiones jurídicas de retención y representantes |
| AP-294/295/298/301 | Rúbrica y evaluador de 18 casos mínimos para las seis combinaciones piloto | `ai-quality-review.test.mjs` | No hay 18 salidas reales ni dictamen humano; la puerta de publicación continúa cerrada |

El panel de cuenta muestra la recomendación y la racha. El último tema se guarda al seleccionarlo con una cuenta adulta y se restaura en una sesión nueva. La cuenta de demostración se puede eliminar desde el mismo panel, con una cancelación explícita antes de confirmar.

## Recuperación de contraseña

Faltan un proveedor y un dominio/remitente verificados. Para habilitar Resend cuando estén disponibles, define **solo en el servidor**:

```text
RESEND_API_KEY=...
APOYO_RECOVERY_FROM=Apoyo académico <cuentas@tu-dominio-verificado>
APOYO_PUBLIC_URL=https://tu-dominio-publico
```

No subas las claves a Git. Si falta cualquiera de estas variables, el endpoint devuelve `503` a todos los correos y no emite tokens. La API de envío usa [Resend](https://resend.com/vercel) por HTTPS; comprueba la configuración y una entrega real con un correo de prueba antes de habilitarla públicamente. El enlace usa un fragmento `#token`, que no se manda en la petición de la página. Tras restablecer, se revocan todas las sesiones anteriores.

El registro de estudiantes sigue deshabilitado: la declaración de mayoría de edad sirve solo para la demostración local. El formulario de recuperación y la eliminación aquí descritos operan **únicamente** sobre esas cuentas adultas. La recuperación estudiantil necesita el canal autorizado del estudiante o representante; la eliminación estudiantil necesita el texto y método de conservación aprobados por la abogada. Véanse [AP-304](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-304) y [cuentas estudiantiles](22-cuentas-estudiantes-consentimiento.md). En SQLite, la eliminación inmediata borra datos activos; no se ha definido un procedimiento para copias de seguridad externas.

## Calidad de IA y currículo

La [rúbrica y guía de muestreo](37-rubrica-calidad-ia.md) define qué revisar y cómo registrar cada caso. El evaluador verifica cobertura, campos y defectos: `cd web; npm.cmd run review:ai -- ruta\revisiones.json`. Una salida favorable del evaluador **no equivale a aprobación docente**; todavía se requiere revisar contenido y correspondencia MEN en [AP-314](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-314) y [AP-316](https://juanmiguelsworkspace-40060689.atlassian.net/browse/AP-316). Actualmente el paquete curricular no está publicado y la ruta de IA sigue bloqueada para esos temas. No se crearon salidas de IA ficticias para simular AP-298.

## Verificación y trabajo pendiente

Desde `web/`: `npm.cmd test`, `npm.cmd run lint` y `npm.cmd run build`. Verificación del 19/10/2026: **95 pruebas aprobadas**, lint y build correctos. La prueba de navegador en producción local con cuentas adultas también pasó: cambio y restauración de tema, progreso aislado y eliminación de cuenta. Las pruebas de Sprint 6 cubren persistencia entre reaperturas, tema retirado, evidencia insuficiente, límite horario de racha, token vencido/usado, revocación de sesión, cascada de datos y cobertura de revisión IA. Sin correo configurado, el endpoint de solicitud devuelve `503` para cualquier correo, como se comprobó localmente.

Jira conserva las **23 incidencias principales** del Sprint 6: **21 En curso** por desarrollo técnico y **2 Por hacer** (AP-298, muestra real de IA; AP-301, hallazgos y correcciones derivados de esa muestra). No se marcó ninguna `Listo` porque los criterios originales se refieren a estudiantes reales o a evidencias externas aún ausentes. Se añadieron comentarios de evidencia y bloqueos a las siete historias, sin mover fechas ni alcance del sprint.

Para cerrar todo el Sprint 6 en Jira faltan: proveedor de correo con dominio verificado y entrega real; validación jurídica de cuenta/retención de menores; habilitación e integración del flujo estudiantil; revisión docente curricular; 18 salidas reales y revisión humana de la IA. Ninguna incidencia dependiente de estos elementos debe marcarse `Listo` solo por la demostración técnica.
