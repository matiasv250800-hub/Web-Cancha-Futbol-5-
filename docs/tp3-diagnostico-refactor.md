# TP N.º 3 – Refactor y Code Review: diagnóstico antes/después

**Fragmento elegido:** listener del evento `submit` del formulario de reservas (`js/app.js`, 45 líneas), del TP N.º 2.

## Diagnóstico

- **Responsabilidad única (SRP):** El listener anónimo hace nueve cosas: frena el envío nativo, lee el formulario, calcula el precio, valida tres reglas, comprueba superposición, guarda, vuelve a dibujar la lista, reinicia el formulario y muestra mensajes. Un cambio en cualquiera de ellas obliga a tocar la misma función.
- **Funciones con una responsabilidad / nombres expresivos:** La función no tiene nombre: no se puede leer su intención ni probar por separado. Las reglas de validación solo se entienden leyendo los if uno por uno.
- **Niveles de abstracción mezclados:** En un mismo bloque conviven detalles de bajo nivel (hoy.setHours(0, 0, 0, 0), new Date(`${fecha}T00:00:00`)) con decisiones del negocio (reservas.push, guardarReservas).
- **Valores y textos mágicos:** Se repiten literales sin nombre: la duración por defecto '1', el color '#176b4d' y los cuatro mensajes al usuario escritos dentro de la lógica.

## Código ANTES

```js
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  mensajeFormulario.textContent = '';

  const reserva = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cliente: campoCliente.value.trim(),
    cancha: campoCancha.value,
    fecha: campoFecha.value,
    hora: campoHora.value,
    duracion: Number(campoDuracion.value),
    precio: calcularPrecio(campoFecha.value, campoHora.value, campoDuracion.value)
  };

  if (!reserva.cliente) {
    mensajeFormulario.textContent = 'Ingresá el nombre del cliente.';
    campoCliente.focus();
    return;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaReserva = new Date(`${reserva.fecha}T00:00:00`);
  if (fechaReserva < hoy) {
    mensajeFormulario.textContent = 'La fecha de la reserva no puede estar en el pasado.';
    campoFecha.focus();
    return;
  }

  if (existeReservaSuperpuesta(reserva)) {
    mensajeFormulario.textContent = 'Esa cancha ya tiene una reserva que se superpone con ese horario.';
    campoHora.focus();
    return;
  }

  reservas.push(reserva);
  guardarReservas();
  renderizarReservas();
  formulario.reset();
  campoDuracion.value = '1';
  actualizarPrecioEstimado();
  mensajeFormulario.style.color = '#176b4d';
  mensajeFormulario.textContent = 'Reserva registrada correctamente.';
  campoCliente.focus();
});
```

## Código DESPUÉS

```js
const DURACION_POR_DEFECTO = '1';
const COLOR_MENSAJE_EXITO = '#176b4d';
const MENSAJES = {
  clienteVacio: 'Ingresá el nombre del cliente.',
  fechaPasada: 'La fecha de la reserva no puede estar en el pasado.',
  reservaSuperpuesta: 'Esa cancha ya tiene una reserva que se superpone con ese horario.',
  reservaRegistrada: 'Reserva registrada correctamente.'
};

function generarIdReserva() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function leerReservaDelFormulario() {
  return {
    id: generarIdReserva(),
    cliente: campoCliente.value.trim(),
    cancha: campoCancha.value,
    fecha: campoFecha.value,
    hora: campoHora.value,
    duracion: Number(campoDuracion.value),
    precio: calcularPrecio(campoFecha.value, campoHora.value, campoDuracion.value)
  };
}

function esFechaPasada(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(`${fecha}T00:00:00`) < hoy;
}

// Devuelve el primer error de validación { mensaje, campo }, o null si la reserva es válida.
function validarReserva(reserva) {
  if (!reserva.cliente) {
    return { mensaje: MENSAJES.clienteVacio, campo: campoCliente };
  }
  if (esFechaPasada(reserva.fecha)) {
    return { mensaje: MENSAJES.fechaPasada, campo: campoFecha };
  }
  if (existeReservaSuperpuesta(reserva)) {
    return { mensaje: MENSAJES.reservaSuperpuesta, campo: campoHora };
  }
  return null;
}

function mostrarError({ mensaje, campo }) {
  mensajeFormulario.textContent = mensaje;
  campo.focus();
}

function registrarReserva(reserva) {
  reservas.push(reserva);
  guardarReservas();
  renderizarReservas();
}

function reiniciarFormulario() {
  formulario.reset();
  campoDuracion.value = DURACION_POR_DEFECTO;
  actualizarPrecioEstimado();
}

function mostrarExito() {
  mensajeFormulario.style.color = COLOR_MENSAJE_EXITO;
  mensajeFormulario.textContent = MENSAJES.reservaRegistrada;
  campoCliente.focus();
}

function manejarEnvioFormulario(evento) {
  evento.preventDefault();
  mensajeFormulario.textContent = '';

  const reserva = leerReservaDelFormulario();
  const error = validarReserva(reserva);
  if (error) {
    mostrarError(error);
    return;
  }

  registrarReserva(reserva);
  reiniciarFormulario();
  mostrarExito();
}

formulario.addEventListener('submit', manejarEnvioFormulario);
```

## Correcciones y principio aplicado

| Corrección | Principio / criterio |
|---|---|
| leerReservaDelFormulario() y generarIdReserva() | Una función, una responsabilidad: armar el objeto reserva a partir del formulario. |
| esFechaPasada(fecha) y validarReserva(reserva) | Separar validación de efectos; el orden de las reglas queda visible en un solo lugar. Nombres expresivos. |
| mostrarError, registrarReserva, reiniciarFormulario, mostrarExito | Cada paso del flujo tiene nombre y una sola razón de cambio (SRP). |
| manejarEnvioFormulario(evento) | Queda como orquestador de alto nivel: se lee como la descripción del caso de uso. |
| DURACION_POR_DEFECTO, COLOR_MENSAJE_EXITO, MENSAJES | Eliminar valores y textos mágicos; un solo lugar para cambiarlos. |

## Lo que no se abordó

- Dependencia directa de localStorage y del DOM (DIP): inyectar un repositorio y una vista excede el alcance de un sistema de un solo archivo y agregaría estructura sin necesidad real (YAGNI).
- Duplicación de Number(hora.split(":")[0]) en las estrategias de precio y en existeReservaSuperpuesta: está fuera del fragmento elegido; se puede tratar en otro refactor.

- Hallazgo no corregido (cambiaría el comportamiento): después de registrar una reserva, el mensaje queda en verde por un estilo en línea y los errores posteriores también se muestran en verde, porque nunca se restablece el color. Se conservó tal cual para que el refactor no altere el comportamiento; conviene corregirlo en un commit aparte.

## Verificación de comportamiento

Se ejecutaron los mismos 7 escenarios (cliente vacío, fecha pasada, reserva válida en día de semana, superposición, otra cancha en el mismo horario, reserva en fin de semana, error luego de un éxito) sobre la versión del TP2 y la refactorizada, comparando mensajes, color, foco, campos del formulario, lista, contador, precio estimado y contenido de localStorage. Los resultados fueron idénticos.
