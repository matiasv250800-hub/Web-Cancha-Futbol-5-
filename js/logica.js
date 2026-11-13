// Lógica pura del sistema de reservas: no toca el DOM ni el navegador,
// por eso se puede probar desde Node. En el navegador se carga con <script>.

const MENSAJES = {
  clienteVacio: 'Ingresá el nombre del cliente.',
  fechaPasada: 'La fecha de la reserva no puede estar en el pasado.',
  reservaSuperpuesta: 'Esa cancha ya tiene una reserva que se superpone con ese horario.',
  reservaRegistrada: 'Reserva registrada correctamente.'
};

// Patrón Strategy: cada política define cómo calcular el precio de una reserva.
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

function existeReservaSuperpuesta(reservas, nuevaReserva) {
  return reservas.some((reserva) => {
    if (reserva.cancha !== nuevaReserva.cancha || reserva.fecha !== nuevaReserva.fecha) return false;
    const inicioNuevo = Number(nuevaReserva.hora.split(':')[0]);
    const finNuevo = inicioNuevo + Number(nuevaReserva.duracion);
    const inicioExistente = Number(reserva.hora.split(':')[0]);
    const finExistente = inicioExistente + Number(reserva.duracion);
    return inicioNuevo < finExistente && inicioExistente < finNuevo;
  });
}

// `hoy` se recibe como parámetro para poder probar con una fecha fija.
function esFechaPasada(fecha, hoy = new Date()) {
  const inicioDeHoy = new Date(hoy);
  inicioDeHoy.setHours(0, 0, 0, 0);
  return new Date(`${fecha}T00:00:00`) < inicioDeHoy;
}

// Devuelve el primer error { mensaje, campo } o null si la reserva es válida.
function validarReserva(reserva, reservas, hoy = new Date()) {
  if (!reserva.cliente) {
    return { mensaje: MENSAJES.clienteVacio, campo: 'cliente' };
  }
  if (esFechaPasada(reserva.fecha, hoy)) {
    return { mensaje: MENSAJES.fechaPasada, campo: 'fecha' };
  }
  if (existeReservaSuperpuesta(reservas, reserva)) {
    return { mensaje: MENSAJES.reservaSuperpuesta, campo: 'hora' };
  }
  return null;
}

// El almacenamiento (localStorage) se recibe como parámetro para poder reemplazarlo en las pruebas.
function crearRepositorioReservas(almacenamiento, clave) {
  return {
    cargar() {
      try {
        const guardadas = JSON.parse(almacenamiento.getItem(clave) || '[]');
        return Array.isArray(guardadas) ? guardadas : [];
      } catch {
        return [];
      }
    },
    guardar(reservas) {
      almacenamiento.setItem(clave, JSON.stringify(reservas));
    }
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    MENSAJES, calcularPrecio, existeReservaSuperpuesta, esFechaPasada,
    validarReserva, crearRepositorioReservas
  };
}
