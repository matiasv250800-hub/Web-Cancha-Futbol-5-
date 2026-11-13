# TP N.º 4 – Reporte de verificación

**Proyecto:** Sistema de alquiler de canchas de fútbol 5 (base: TP N.º 3).

**Resultado final:** 21 de 21 pruebas pasan (16 unitarias, 4 de integración, 1 E2E).

## 1. Requerimientos probados

| ID | Requerimiento |
|---|---|
| RF-01 | Calcular el precio según día (semana/fin de semana) y horario (recargo desde las 18:00). |
| RF-02 | Evitar reservas superpuestas para la misma cancha y fecha. |
| RF-03 | Validar los datos de la reserva: cliente obligatorio y fecha no pasada. |
| RF-04 | Guardar las reservas en el navegador y conservarlas al recargar. |

## 2. Cómo ejecutar la suite

```
npm install
npx playwright install chromium   # solo la primera vez, para la prueba E2E
npm test                           # unitarias + integración (no requiere dependencias)
npm run test:e2e                   # prueba funcional E2E
npm run test:todo                  # las tres
```

Las pruebas unitarias y de integración usan `node --test` (incluido en Node). Aíslan el almacenamiento con dobles de prueba (stubs y spy) y usan un reloj fijo, por lo que no dependen del navegador, de la red ni de la fecha real.

## 3. Qué se probó y qué resultado dio cada prueba

| ID | Req. | Nivel | Caso | Resultado |
|---|---|---|---|---|
| CP-01 | RF-01 | Unitaria | día de semana, 14:00, 1 h → $15.000 (camino feliz) | Pasó |
| CP-02 | RF-01 | Unitaria | día de semana, 20:00, 2 h → $40.000 (recargo nocturno) | Pasó |
| CP-03 | RF-01 | Unitaria | sábado y domingo usan la tarifa de fin de semana | Pasó |
| CP-04 | RF-01 | Unitaria | límite: 16:00 no tiene recargo y 18:00 sí | Pasó |
| CP-05 | RF-02 | Unitaria | misma cancha, fecha y horario → superpuesta (error esperado) | Pasó |
| CP-06 | RF-02 | Unitaria | límite: 20-22 h y 22-24 h no se superponen | Pasó |
| CP-07 | RF-02 | Unitaria | solapamiento parcial: una reserva de 18 a 21 h pisa a una de 20 a 22 h, una de 18 a 20 h no | Pasó |
| CP-08 | RF-02 | Unitaria | otra cancha o otra fecha en el mismo horario no es conflicto | Pasó |
| CP-09 | RF-03 | Unitaria | reserva válida → sin errores (camino feliz) | Pasó |
| CP-10 | RF-03 | Unitaria | cliente vacío → error en el campo cliente | Pasó |
| CP-11 | RF-03 | Unitaria | fecha pasada → error; la fecha de hoy es válida (límite) | Pasó |
| CP-12 | RF-03 | Unitaria | con varios errores se informa primero el del cliente | Pasó |
| CP-13 | RF-04 | Unitaria | stub con JSON corrupto → devuelve lista vacía sin romper | Pasó |
| CP-14 | RF-04 | Unitaria | stub que lanza error al leer → devuelve lista vacía | Pasó |
| CP-15 | RF-04 | Unitaria | stub con un valor que no es lista → devuelve lista vacía | Pasó |
| CP-16 | RF-04 | Unitaria | spy: guardar() escribe en la clave indicada el JSON de las reservas | Pasó |
| CP-17 | RF-01+RF-04 | Integración | una reserva válida se guarda con su precio y sobrevive a una "recarga" | Pasó |
| CP-18 | RF-02+RF-04 | Integración | una reserva guardada bloquea una superpuesta, incluso tras recargar | Pasó |
| CP-19 | RF-02 | Integración | límite: una reserva que empieza cuando otra termina se acepta | Pasó |
| CP-20 | RF-03 | Integración | una reserva inválida (cliente vacío) no llega al almacenamiento | Pasó |
| CP-21 | RF-01..RF-04 | E2E | flujo completo: registrar, ver precio, rechazar superposición, recargar y eliminar | Falló 1.ª vez → corregido → Pasó |

Cada requerimiento tiene al menos un camino feliz, un caso límite y una condición de error.

## 4. Falla encontrada y corregida

- Qué se encontró: la prueba E2E (CP-21) falló en su primera ejecución. Después de registrar una reserva con éxito, el mensaje de error de una reserva superpuesta se mostraba en verde (el color de éxito), porque el estilo en línea nunca se restablecía.
- Causa: manejarEnvioFormulario asignaba mensajeFormulario.style.color en mostrarExito() pero no lo limpiaba al iniciar un nuevo envío. Ya estaba anotado como hallazgo en el TP3.
- Corrección: al comenzar cada envío se restablece mensajeFormulario.style.color. Se volvió a ejecutar toda la suite: 21 de 21 pruebas pasan.

## 5. ¿La suite detecta errores?

Se introdujeron errores a propósito en una copia de la lógica y se ejecutó la suite:

| Error introducido | Resultado |
|---|---|
| Superposición con <= en lugar de < | Detectado por CP-06, CP-07 y CP-19 |
| Recargo nocturno desde las 19:00 en lugar de las 18:00 | Detectado por CP-04 |
| El domingo tratado como día de semana | Detectado por CP-03 |
| La fecha de hoy tratada como pasada | Detectado por CP-11 |

## 6. Pendiente de cubrir

- No hay pruebas unitarias del renderizado (crearElementoReserva, renderizarReservas) ni de formatearPrecio: se cubren solo de forma indirecta en la E2E.
- El flujo E2E se probó en Chromium; falta Firefox y Edge, y el diseño en pantallas chicas.
- No se prueban reservas que cruzan la medianoche (22:00 por 2 h termina a las 24:00) ni hay una validación de horario de cierre.
- No se prueban varias pestañas abiertas a la vez sobre el mismo localStorage, ni localStorage lleno.
- No se midió cobertura de código.
- Validación (no solo verificación): falta que usuarios reales del complejo prueben el sistema y confirmen que resuelve su necesidad.

## 7. Uso de Inteligencia Artificial

- **Qué se le pidió:** Un plan para hacer el TP4 sin sobreingeniería sobre el código del TP3 y, después, que armara la suite de pruebas, la ejecutara y redactara el reporte.
- **Qué devolvió:** Una propuesta con node --test para las pruebas unitarias y de integración, Playwright para una E2E, la lógica extraída a js/logica.js, 21 casos trazados a 4 requerimientos y este reporte.
- **Qué se corrigió y por qué:** (1) En el plan inicial la IA dijo que un lunes a las 20:00 por 2 h cuesta $50.000; el código calcula $40.000, y las pruebas se escribieron con el valor real, no con el del plan. (2) node --test tests/ no funciona en Node 22; se cambió por tests/*.test.js. (3) El título de CP-07 estaba mal redactado y se reescribió. (4) La E2E encontró una falla real de la aplicación (ver sección 4), que se corrigió. (5) Para no confiar solo en que las pruebas "pasen", se rompió la lógica a propósito en 4 lugares y se comprobó que la suite lo detecta.
- **Qué queda a cargo del equipo:** Leer los casos y confirmar que reflejan los requerimientos reales del proyecto; la IA propuso los valores esperados a partir del código existente, así que una prueba solo confirma lo que el equipo revise y acepte.
