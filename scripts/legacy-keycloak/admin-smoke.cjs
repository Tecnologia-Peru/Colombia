// Run against npm run dev. Playwright must be available in the execution environment.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mockIdentity } = require('./auth-fixture.cjs');
(async () => {
 const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
 try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await mockIdentity(page);
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5174');
 const admin = () => page.locator('nav').getByRole('button', { name: 'Administración', exact: true }).click();
 await admin();
 await page.getByRole('button', { name: 'Editar Pentesting de aplicaciones web', exact: true }).click();
 await page.getByLabel('Nombre del servicio').fill('Pentesting personalizado');
 await page.getByLabel('Precio desde (COP)').fill('1800000');
 await page.getByLabel(/^Descripción/).fill('Descripción modificada de prueba.');
 await page.getByRole('button', { name: 'Guardar cambios' }).click();
 await page.getByRole('status').filter({ hasText: 'Servicio actualizado' }).waitFor();
 await page.reload(); await admin();
 await page.getByRole('heading', { name: 'Pentesting personalizado', exact: true }).waitFor();
 const exported = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exportar copia' }).click();
 const download = await exported; const stream = await download.createReadStream(); let content = ''; for await (const chunk of stream) content += chunk;
 const backup = JSON.parse(content); assert.equal(backup.services[0].price, 1800000); assert.equal(backup.services[0].name, 'Pentesting personalizado');
 await page.locator('nav').getByRole('button', { name: 'Catálogo de servicios', exact: true }).click();
 await page.getByRole('button', { name: 'Ver Pentesting personalizado', exact: true }).click();
 await page.getByText('Descripción modificada de prueba.', { exact: true }).last().waitFor();
 await page.getByRole('button', { name: 'Añadir al carrito' }).click();
 await page.getByRole('button', { name: 'Carrito, 1 servicios' }).click();
 assert.match(await page.locator('.summary').innerText(), /1\.800\.000/);
 await admin(); await page.getByRole('button', { name: 'Restaurar originales' }).click();
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.getByRole('heading', { name: 'Pentesting personalizado', exact: true }).waitFor();
 const input = page.getByLabel('Importar catálogo JSON');
 await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"services":[]}') });
 await page.getByRole('alert').filter({ hasText: 'seis servicios' }).waitFor();
 await page.getByRole('heading', { name: 'Pentesting personalizado', exact: true }).waitFor();
 await page.getByRole('button', { name: 'Restaurar originales' }).click();
 await page.getByRole('button', { name: 'Confirmar reemplazo' }).click();
 await page.getByRole('heading', { name: 'Pentesting de aplicaciones web', exact: true }).waitFor();
 await input.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
 await page.getByRole('button', { name: 'Confirmar reemplazo' }).click();
 await page.getByRole('heading', { name: 'Pentesting personalizado', exact: true }).waitFor();
 await page.getByRole('button', { name: 'Editar Pentesting personalizado', exact: true }).click();
 await page.getByLabel('Nombre del servicio').fill('Sin guardar');
 await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
 await page.getByRole('heading', { name: 'Pentesting personalizado', exact: true }).waitFor();
 await page.setViewportSize({ width: 390, height: 844 });
 assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
 await page.screenshot({ path: '/tmp/clarity-admin-mobile.png', fullPage: true, animations: 'disabled' });
 // Corrupt saved data falls back to defaults with a visible warning.
 await page.evaluate(() => localStorage.setItem('clarity.catalog.v1', 'broken'));
 await page.reload(); await page.getByRole('button', { name: 'Abrir menú' }).click(); await admin();
 await page.getByRole('alert').filter({ hasText: 'No se pudo recuperar' }).waitFor();
 await page.getByRole('heading', { name: 'Pentesting de aplicaciones web', exact: true }).waitFor();
 assert.deepEqual(errors, []);
 console.log('PASS: edición, persistencia, detalle, carrito, exportación, importación, rechazo de archivo inválido, restauración, cancelación, vista móvil y recuperación de datos corruptos.');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
