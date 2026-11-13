// Pruebas de INTEGRACIÓN: cooperan los módulos reales de logica.js
// (precio + validación + superposición + repositorio). Solo se reemplaza localStorage por uno en memoria.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MENSAJES, calcularPrecio, validarReserva, crearRepositorioReservas
} = require('../js/logica.js');

const HOY = new Date('2026-11-13T10:00:00');
const CLAVE = 'alquilerCanchasF5.reservas';

function almacenamientoEnMemoria() {
  const datos = new Map();
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v))
  };
}

// Reproduce el flujo de "registrar reserva" de la app, usando los módulos reales.
function intentarRegistrar(repositorio, datos) {
  const reservas = repositorio.cargar();
  const reserva = { ...datos, precio: calcularPrecio(datos.fecha, datos.hora, datos.duracion) };
  const error = validarReserva(reserva, reservas, HOY);
  if (error) return { ok: false, error };
  repositorio.guardar([...reservas, reserva]);
  return { ok: true, reserva };
}

const base = { cliente: 'Juan', cancha: 'Cancha 1', fecha: '2026-11-16', hora: '20:00', duracion: 2 };

test('CP-17 [RF-01+RF-04] una reserva válida se guarda con su precio y sobrevive a una "recarga"', () => {
  const almacen = almacenamientoEnMemoria();
  const resultado = intentarRegistrar(crearRepositorioReservas(almacen, CLAVE), base);
  assert.equal(resultado.ok, true);

  // "Recarga": se crea un repositorio nuevo sobre el mismo almacenamiento.
  const despues = crearRepositorioReservas(almacen, CLAVE).cargar();
  assert.equal(despues.length, 1);
  assert.equal(despues[0].precio, 40000);
  assert.equal(despues[0].cliente, 'Juan');
});

test('CP-18 [RF-02+RF-04] una reserva guardada bloquea una superpuesta, incluso tras recargar', () => {
  const almacen = almacenamientoEnMemoria();
  intentarRegistrar(crearRepositorioReservas(almacen, CLAVE), base);

  const repositorioNuevo = crearRepositorioReservas(almacen, CLAVE);
  const resultado = intentarRegistrar(repositorioNuevo, { ...base, cliente: 'Pedro', hora: '20:00', duracion: 1 });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.error.mensaje, MENSAJES.reservaSuperpuesta);
  assert.equal(repositorioNuevo.cargar().length, 1, 'la reserva rechazada no debe guardarse');
});

test('CP-19 [RF-02] límite: una reserva que empieza cuando otra termina se acepta', () => {
  const almacen = almacenamientoEnMemoria();
  const repositorio = crearRepositorioReservas(almacen, CLAVE);
  intentarRegistrar(repositorio, base); // 20:00-22:00
  const resultado = intentarRegistrar(repositorio, { ...base, cliente: 'Lu', hora: '22:00', duracion: 1 });
  assert.equal(resultado.ok, true);
  assert.equal(repositorio.cargar().length, 2);
});

test('CP-20 [RF-03] una reserva inválida (cliente vacío) no llega al almacenamiento', () => {
  const almacen = almacenamientoEnMemoria();
  const repositorio = crearRepositorioReservas(almacen, CLAVE);
  const resultado = intentarRegistrar(repositorio, { ...base, cliente: '' });
  assert.equal(resultado.ok, false);
  assert.equal(almacen.getItem(CLAVE), null);
});
