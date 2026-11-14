# Sistema de alquiler de canchas de fútbol 5

Proyecto académico para gestionar reservas de un complejo deportivo.

## Tecnologías
- HTML
- CSS
- JavaScript sin frameworks
- `localStorage` del navegador para conservar las reservas en el mismo dispositivo

## Cómo ejecutar
1. Descargá o descomprimí la carpeta del proyecto.
2. Abrí `index.html` con un navegador moderno (Chrome, Edge o Firefox).
3. Completá el formulario para registrar una reserva.

No requiere instalar dependencias ni iniciar un servidor.

## Funcionalidades iniciales
- Registrar reservas por cliente, cancha, fecha, horario y duración.
- Calcular un precio estimado mediante el patrón Strategy (políticas de precio para días de semana y fines de semana).
- Evitar reservas superpuestas para la misma cancha y fecha.
- Listar y eliminar reservas.
- Guardar las reservas en el navegador.

## Nota para el TP de Metodología de Sistemas II
Esta es una primera versión de trabajo. El cálculo del precio usa condicionales dentro de `calcularPrecio`. Antes de decidir aplicar un patrón, hay que analizar si ese diseño constituye un problema relevante para el alcance real del sistema, comparar alternativas y documentar la decisión. No se debe presentar como código heredado del TP 1: esta funcionalidad se incorpora en esta etapa.

## Decisión de diseño para el TP 2

Se aplicó el patrón **Strategy** al cálculo de precios. Las políticas `PrecioDiaSemana` y `PrecioFinDeSemana` encapsulan sus respectivas reglas y `obtenerEstrategiaPrecio` selecciona la estrategia correspondiente a la fecha. El detalle y las alternativas se documentan en `docs/decision-arquitectura.md`.

Esta solución es una evolución de esta versión académica del proyecto; no se afirma que el cálculo de precios estuviera implementado en el TP 1.

## TP 3: refactor y code review

Se refactorizó el manejador del evento `submit` del formulario (`manejarEnvioFormulario` y funciones auxiliares en `js/app.js`) sin cambiar el comportamiento. Diagnóstico y comparación antes/después en `docs/tp3-diagnostico-refactor.md`; registro de la revisión en `docs/tp3-registro-revision.md`.

## TP 4: suite de pruebas

La lógica pura (precio, superposición, validación y persistencia) está en `js/logica.js`, que se carga en el navegador con `<script>` y se importa desde Node en las pruebas. Las pruebas están en `tests/`:

```
npm install
npx playwright install chromium   # solo la primera vez, para la prueba E2E
npm test                          # unitarias + integración
npm run test:e2e                  # prueba funcional E2E
```

Resultados, trazabilidad y pendientes en `docs/tp4-reporte-verificacion.md`.
