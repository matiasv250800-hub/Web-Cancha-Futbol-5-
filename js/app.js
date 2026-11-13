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
const repositorio = crearRepositorioReservas(localStorage, CLAVE_RESERVAS);
let reservas = repositorio.cargar();

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(valor);
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
  repositorio.guardar(reservas);
  renderizarReservas();
}

formulario.addEventListener('input', actualizarPrecioEstimado);
formulario.addEventListener('change', actualizarPrecioEstimado);

const DURACION_POR_DEFECTO = '1';
const COLOR_MENSAJE_EXITO = '#176b4d';
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

const CAMPOS = { cliente: campoCliente, fecha: campoFecha, hora: campoHora };

function mostrarError({ mensaje, campo }) {
  mensajeFormulario.textContent = mensaje;
  CAMPOS[campo].focus();
}

function registrarReserva(reserva) {
  reservas.push(reserva);
  repositorio.guardar(reservas);
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
  mensajeFormulario.style.color = '';

  const reserva = leerReservaDelFormulario();
  const error = validarReserva(reserva, reservas);
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
