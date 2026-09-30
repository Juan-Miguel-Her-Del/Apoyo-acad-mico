# Estado y estrategia de pruebas

Al 30 de septiembre de 2026 **no hay código ni infraestructura de testing**, por lo que no existen pruebas unitarias, de integración o E2E que ejecutar. **Pruebas ejecutadas: 0. Exitosas: 0. Fallidas: 0.** Esto refleja el inicio pendiente del desarrollo; no es una medición de calidad del producto.

## Pruebas propuestas al comenzar

| Prioridad | Tipo | Riesgo a comprobar |
|---|---|---|
| 1 | Unitaria | Filtros del catálogo, cálculo diagnóstico y asociación de subtemas |
| 1 | Integración | Flujo selección → diagnóstico → explicación → práctica |
| 1 | Contrato / integración | Manejo de respuestas vacías, fallos y límites del proveedor de IA |
| 1 | Revisión humana | Exactitud y adecuación de explicaciones según [rúbrica](04-plan-validacion.md) |
| 2 | E2E | Recorrido completo del estudiante con datos piloto |
| Según alcance | Seguridad | Autenticación, autorización y consentimiento si se incluyen |
| Según alcance | Persistencia | Guardado, recuperación y eliminación de datos si se incluyen |

Los casos detallados se derivarán de [criterios de aceptación](criterios-aceptacion.md). Al elegir el stack, registrar comandos de ejecución, entorno, fecha, cantidad de casos y resultados reales. No se buscará una cifra de cobertura antes de tener pruebas que detecten fallos importantes.

## Riesgos sin cobertura actual

Todas las funciones planificadas carecen de pruebas por no existir implementación. La persistencia entre sesiones, autenticación y protección de menores requieren decisión de alcance antes de diseñar sus pruebas.
