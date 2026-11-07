# Refactor del manejador de envío del formulario

## Qué cambia
Se descompone el listener anónimo de `submit` en funciones con una sola responsabilidad: `leerReservaDelFormulario`, `validarReserva`, `registrarReserva`, `reiniciarFormulario`, `mostrarError`, `mostrarExito`, orquestadas por `manejarEnvioFormulario`. Se nombran los valores y mensajes mágicos.

## Por qué
SRP, funciones con una responsabilidad, nombres expresivos y eliminación de valores mágicos. Detalle en `docs/tp3-diagnostico-refactor.md`.

## Comportamiento
Sin cambios externos. Se comparó la versión anterior y la nueva con 7 escenarios en el navegador (mensajes, foco, formulario, lista, precio y localStorage idénticos).

## Fuera de alcance
- El color verde del mensaje persiste tras un éxito (comportamiento previo, a corregir aparte).
- Duplicación del parseo de hora en estrategias y superposición.

## Para quien revise
Usar el checklist del Bloque D y dejar las observaciones como comentarios en este PR.
