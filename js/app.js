const formulario = document.querySelector('#form-reserva');
const campoCliente = document.querySelector('#cliente');
const campoCancha = document.querySelector('#cancha');
const campoFecha = document.querySelector('#fecha');
const campoHora = document.querySelector('#hora');
const campoDuracion = document.querySelector('#duracion');
const precioEstimado = document.querySelector('#precio-estimado');
const listaReservas = document.querySelector('#lista-reservas');
const contador = document.querySelector('#contador');
const mensajeFormulario = document.querySelector('#mensaje-formulario');

const CLAVE_RESERVAS = 'alquilerCanchasF5.reservas';
let reservas = cargarReservas();

// Patrón Strategy: cada política define cómo calcular el precio de una reserva.
// La selección de la política se separa del cálculo del precio.
class EstrategiaPrecio {
  calcular(hora, duracion) {
    throw new Error('La estrategia debe implementar calcular().');
  }
}

class PrecioDiaSemana extends EstrategiaPrecio {
  calcular(hora, duracion) {
    const horaNumero = Number(hora.split(':')[0]);
    const precioPorHora = 15000 + (horaNumero >= 18 ? 5000 : 0);
    return precioPorHora * Number(duracion);
  }
}

class PrecioFinDeSemana extends EstrategiaPrecio {
  calcular(hora, duracion) {
    const horaNumero = Number(hora.split(':')[0]);
    const precioPorHora = 20000 + (horaNumero >= 18 ? 5000 : 0);
    return precioPorHora * Number(duracion);
  }
}

const estrategiaDiaSemana = new PrecioDiaSemana();
const estrategiaFinDeSemana = new PrecioFinDeSemana();

function obtenerEstrategiaPrecio(fecha) {
  const dia = new Date(`${fecha}T12:00:00`).getDay();
  return dia === 0 || dia === 6
    ? estrategiaFinDeSemana
    : estrategiaDiaSemana;
}

function calcularPrecio(fecha, hora, duracion) {
  return obtenerEstrategiaPrecio(fecha).calcular(hora, duracion);
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(valor);
}

function cargarReservas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_RESERVAS) || '[]');
    return Array.isArray(guardadas) ? guardadas : [];
  } catch {
    return [];
  }
}

function guardarReservas() {
  localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
}

function actualizarPrecioEstimado() {
  if (!campoFecha.value || !campoHora.value || !campoDuracion.value) {
    precioEstimado.textContent = 'Seleccioná fecha y horario';
    return;
  }
  precioEstimado.textContent = formatearPrecio(
    calcularPrecio(campoFecha.value, campoHora.value, campoDuracion.value)
  );
}

function existeReservaSuperpuesta(nuevaReserva) {
  return reservas.some((reserva) => {
    if (reserva.cancha !== nuevaReserva.cancha || reserva.fecha !== nuevaReserva.fecha) return false;
    const inicioNuevo = Number(nuevaReserva.hora.split(':')[0]);
    const finNuevo = inicioNuevo + Number(nuevaReserva.duracion);
    const inicioExistente = Number(reserva.hora.split(':')[0]);
    const finExistente = inicioExistente + Number(reserva.duracion);
    return inicioNuevo < finExistente && inicioExistente < finNuevo;
  });
}

function crearElementoReserva(reserva) {
  const articulo = document.createElement('article');
  articulo.className = 'reserva';

  const cabecera = document.createElement('div');
  cabecera.className = 'reserva-cabecera';
  const bloque = document.createElement('div');
  const nombre = document.createElement('h3');
  nombre.textContent = reserva.cliente;
  const detalle = document.createElement('p');
  detalle.className = 'reserva-detalle';
  detalle.textContent = `${reserva.cancha} · ${reserva.fecha} · ${reserva.hora} · ${reserva.duracion} h`;
  bloque.append(nombre, detalle);

  const eliminar = document.createElement('button');
  eliminar.type = 'button';
  eliminar.className = 'boton-eliminar';
  eliminar.textContent = 'Eliminar';
  eliminar.setAttribute('aria-label', `Eliminar reserva de ${reserva.cliente}`);
  eliminar.addEventListener('click', () => eliminarReserva(reserva.id));
  cabecera.append(bloque, eliminar);

  const precio = document.createElement('p');
  precio.className = 'reserva-precio';
  precio.textContent = formatearPrecio(reserva.precio);
  articulo.append(cabecera, precio);
  return articulo;
}

function renderizarReservas() {
  listaReservas.replaceChildren();
  contador.textContent = `${reservas.length} ${reservas.length === 1 ? 'reserva' : 'reservas'}`;

  if (reservas.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'vacio';
    vacio.textContent = 'Todavía no hay reservas registradas.';
    listaReservas.append(vacio);
    return;
  }

  [...reservas]
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
    .forEach((reserva) => listaReservas.append(crearElementoReserva(reserva)));
}

function eliminarReserva(id) {
  reservas = reservas.filter((reserva) => reserva.id !== id);
  guardarReservas();
  renderizarReservas();
}

formulario.addEventListener('input', actualizarPrecioEstimado);
formulario.addEventListener('change', actualizarPrecioEstimado);

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

// Fecha mínima: hoy.
const ahora = new Date();
const anio = ahora.getFullYear();
const mes = String(ahora.getMonth() + 1).padStart(2, '0');
const dia = String(ahora.getDate()).padStart(2, '0');
campoFecha.min = `${anio}-${mes}-${dia}`;

renderizarReservas();
actualizarPrecioEstimado();
