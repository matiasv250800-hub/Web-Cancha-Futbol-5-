# Decisión de arquitectura: patrón Strategy para calcular precios

- **Estado:** Propuesta implementada para el TP 2
- **Contexto:** Sistema académico de alquiler de canchas de fútbol 5.
- **Decisión:** Encapsular las reglas de cálculo del precio en estrategias intercambiables.

## Problema observado

En la versión inicial de esta etapa, `calcularPrecio` concentraba las reglas de precio en condicionales: precio base de día de semana, precio base de fin de semana y recargo nocturno. Si el sistema incorporara nuevas políticas (por ejemplo, promociones o tarifas especiales), esa función necesitaría más condiciones y cambios directos.

El problema no es que los condicionales sean incorrectos por sí mismos. Para el alcance actual son una solución válida y sencilla; el patrón se justifica como ejercicio de extensibilidad porque se prevé que las reglas tarifarias puedan variar.

## Alternativas consideradas

1. **Mantener los condicionales:** es la opción más simple para pocas reglas. Se descarta para este ejercicio porque concentra las políticas en una única función y cada nueva política exige modificarla.
2. **Strategy:** cada política de precio implementa un método `calcular`. El código elige una estrategia según la fecha y delega el cálculo. Se elige porque separa las reglas y facilita agregar políticas nuevas sin reescribir el flujo de reserva.
3. **Factory:** podría ayudar a crear objetos de estrategia, pero por sí sola no encapsula las distintas reglas de cálculo; no resuelve el problema principal.

## Implementación

- `EstrategiaPrecio` define el contrato `calcular(hora, duracion)`.
- `PrecioDiaSemana` calcula $15.000 por hora y suma $5.000 por hora desde las 18:00.
- `PrecioFinDeSemana` calcula $20.000 por hora y suma $5.000 por hora desde las 18:00.
- `obtenerEstrategiaPrecio(fecha)` selecciona la política según el día de la semana.
- `calcularPrecio` delega el cálculo en la estrategia seleccionada.

## Consecuencias

**Beneficios**
- Las reglas tarifarias quedan separadas.
- Agregar otra política de precio puede hacerse creando otra estrategia.
- Es más fácil probar cada política de forma independiente.

**Costos y límites**
- Hay más clases y estructura que con unos pocos `if`.
- Para un sistema pequeño y estable, los condicionales podrían ser suficientes.
- La selección todavía usa una condición para decidir entre las dos estrategias; el patrón no elimina todos los condicionales, sino que separa el cálculo variable.

## Validaciones manuales sugeridas

- Día de semana, 14:00, 1 hora: $15.000.
- Día de semana, 20:00, 1 hora: $20.000.
- Fin de semana, 14:00, 1 hora: $20.000.
- Fin de semana, 20:00, 2 horas: $50.000.

## Uso de IA

Se utilizó un asistente de IA como apoyo para proponer la separación de las reglas tarifarias, revisar la explicación de alternativas y redactar un borrador de documentación. La decisión debe ser revisada por el equipo y contrastada probando el sistema. La IA no reemplaza la validación del código ni el criterio del equipo.
