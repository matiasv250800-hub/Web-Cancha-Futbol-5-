// Prueba FUNCIONAL / E2E: recorre el flujo real completo en un navegador (Chromium) abriendo index.html.
// Requiere: npm install && npx playwright install chromium
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const URL_APP = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

function proximoLunes() {
  const d = new Date();
  do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function completarFormulario(page, { cliente, cancha, fecha, hora, duracion }) {
  await page.fill('#cliente', cliente);
  await page.selectOption('#cancha', cancha);
  await page.fill('#fecha', fecha);
  await page.selectOption('#hora', hora);
  await page.selectOption('#duracion', duracion);
}

test('CP-21 [RF-01..RF-04] flujo completo: registrar, ver precio, rechazar superposición, recargar y eliminar', async () => {
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(URL_APP);
    const lunes = proximoLunes();
    const reserva = { cliente: 'Juan Pérez', cancha: 'Cancha 1', fecha: lunes, hora: '20:00', duracion: '2' };

    // 1) Estado inicial vacío
    assert.match(await page.textContent('#contador'), /^0 reservas/);

    // 2) El precio estimado se muestra antes de registrar (lunes 20:00, 2 h = $40.000)
    await completarFormulario(page, reserva);
    assert.match(await page.textContent('#precio-estimado'), /40\.000/);

    // 3) Registrar → aparece en la lista, con mensaje de éxito
    await page.click('button[type=submit]');
    assert.equal(await page.textContent('#mensaje-formulario'), 'Reserva registrada correctamente.');
    assert.match(await page.textContent('#contador'), /^1 reserva/);
    const tarjeta = page.locator('.reserva');
    assert.equal(await tarjeta.count(), 1);
    assert.match(await tarjeta.textContent(), /Juan Pérez/);
    assert.match(await tarjeta.textContent(), /40\.000/);

    // 4) Intentar una reserva superpuesta → se rechaza con mensaje de error y no se agrega
    await completarFormulario(page, { ...reserva, cliente: 'Pedro', duracion: '1' });
    await page.click('button[type=submit]');
    assert.equal(
      await page.textContent('#mensaje-formulario'),
      'Esa cancha ya tiene una reserva que se superpone con ese horario.'
    );
    assert.equal(await page.locator('.reserva').count(), 1);

    // 5) El mensaje de error no debe verse con el estilo de éxito (verde)
    const colorMensaje = await page.$eval('#mensaje-formulario', (el) => getComputedStyle(el).color);
    assert.notEqual(colorMensaje, 'rgb(23, 107, 77)', 'el error se muestra con el color verde de éxito');

    // 6) Recargar → la reserva persiste
    await page.reload();
    assert.equal(await page.locator('.reserva').count(), 1);

    // 7) Eliminar → vuelve al estado vacío
    await page.click('.boton-eliminar');
    assert.equal(await page.locator('.reserva').count(), 0);
    assert.match(await page.textContent('#contador'), /^0 reservas/);
  } finally {
    await browser.close();
  }
});
