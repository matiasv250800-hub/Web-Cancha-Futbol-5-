// Pruebas UNITARIAS. Cada caso indica el requerimiento al que está trazado (ver docs/tp4-reporte-verificacion.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MENSAJES, calcularPrecio, existeReservaSuperpuesta, validarReserva, crearRepositorioReservas
} = require('../js/logica.js');

// Fechas de referencia (2026): lunes 16, sábado 14, domingo 15 de noviembre.
const LUNES = '2026-11-16';
const SABADO = '2026-11-14';
const DOMINGO = '2026-11-15';
// Reloj fijo: "hoy" es viernes 13/11/2026, así las pruebas no dependen de la fecha real.
const HOY = new Date('2026-11-13T10:00:00');

const reserva = (extra = {}) => ({
  cliente: 'Juan', cancha: 'Cancha 1', fecha: LUNES, hora: '20:00', duracion: 1, ...extra
});

// ---------- RF-01 Cálculo de precio ----------
test('CP-01 [RF-01] día de semana, 14:00, 1 h → $15.000 (camino feliz)', () => {
  assert.equal(calcularPrecio(LUNES, '14:00', 1), 15000);
});
test('CP-02 [RF-01] día de semana, 20:00, 2 h → $40.000 (recargo nocturno)', () => {
  assert.equal(calcularPrecio(LUNES, '20:00', 2), 40000);
});
test('CP-03 [RF-01] sábado y domingo usan la tarifa de fin de semana', () => {
  assert.equal(calcularPrecio(SABADO, '14:00', 1), 20000);
  assert.equal(calcularPrecio(DOMINGO, '20:00', 2), 50000);
});
test('CP-04 [RF-01] límite: 16:00 no tiene recargo y 18:00 sí', () => {
  assert.equal(calcularPrecio(LUNES, '16:00', 1), 15000);
  assert.equal(calcularPrecio(LUNES, '18:00', 1), 20000);
});

// ---------- RF-02 Sin superposición ----------
test('CP-05 [RF-02] misma cancha, fecha y horario → superpuesta (error esperado)', () => {
  assert.equal(existeReservaSuperpuesta([reserva()], reserva({ cliente: 'Pedro' })), true);
});
test('CP-06 [RF-02] límite: 20-22 h y 22-24 h no se superponen', () => {
  const existentes = [reserva({ hora: '20:00', duracion: 2 })];
  assert.equal(existeReservaSuperpuesta(existentes, reserva({ hora: '22:00' })), false);
});
test('CP-07 [RF-02] solapamiento parcial: una reserva de 18 a 21 h pisa a una de 20 a 22 h, una de 18 a 20 h no', () => {
  const existentes = [reserva({ hora: '20:00', duracion: 2 })];
  assert.equal(existeReservaSuperpuesta(existentes, reserva({ hora: '18:00', duracion: 2 })), false);
  assert.equal(existeReservaSuperpuesta(existentes, reserva({ hora: '18:00', duracion: 3 })), true);
});
test('CP-08 [RF-02] otra cancha o otra fecha en el mismo horario no es conflicto', () => {
  const existentes = [reserva()];
  assert.equal(existeReservaSuperpuesta(existentes, reserva({ cancha: 'Cancha 2' })), false);
  assert.equal(existeReservaSuperpuesta(existentes, reserva({ fecha: SABADO })), false);
});

// ---------- RF-03 Validación de datos ----------
test('CP-09 [RF-03] reserva válida → sin errores (camino feliz)', () => {
  assert.equal(validarReserva(reserva(), [], HOY), null);
});
test('CP-10 [RF-03] cliente vacío → error en el campo cliente', () => {
  assert.deepEqual(validarReserva(reserva({ cliente: '' }), [], HOY),
    { mensaje: MENSAJES.clienteVacio, campo: 'cliente' });
});
test('CP-11 [RF-03] fecha pasada → error; la fecha de hoy es válida (límite)', () => {
  assert.deepEqual(validarReserva(reserva({ fecha: '2026-11-12' }), [], HOY),
    { mensaje: MENSAJES.fechaPasada, campo: 'fecha' });
  assert.equal(validarReserva(reserva({ fecha: '2026-11-13' }), [], HOY), null);
});
test('CP-12 [RF-03] con varios errores se informa primero el del cliente', () => {
  const error = validarReserva(reserva({ cliente: '', fecha: '2026-11-01' }), [], HOY);
  assert.equal(error.campo, 'cliente');
});

// ---------- RF-04 Persistencia (con dobles de prueba del almacenamiento) ----------
test('CP-13 [RF-04] stub con JSON corrupto → devuelve lista vacía sin romper', () => {
  const stub = { getItem: () => '{esto no es json', setItem() {} };
  assert.deepEqual(crearRepositorioReservas(stub, 'k').cargar(), []);
});
test('CP-14 [RF-04] stub que lanza error al leer → devuelve lista vacía', () => {
  const stub = { getItem() { throw new Error('storage no disponible'); }, setItem() {} };
  assert.deepEqual(crearRepositorioReservas(stub, 'k').cargar(), []);
});
test('CP-15 [RF-04] stub con un valor que no es lista → devuelve lista vacía', () => {
  const stub = { getItem: () => '{"a":1}', setItem() {} };
  assert.deepEqual(crearRepositorioReservas(stub, 'k').cargar(), []);
});
test('CP-16 [RF-04] spy: guardar() escribe en la clave indicada el JSON de las reservas', () => {
  const llamadas = [];
  const spy = { getItem: () => null, setItem: (clave, valor) => llamadas.push([clave, valor]) };
  crearRepositorioReservas(spy, 'clave-x').guardar([reserva()]);
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0][0], 'clave-x');
  assert.deepEqual(JSON.parse(llamadas[0][1]), [reserva()]);
});
