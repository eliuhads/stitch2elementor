/**
 * playwright_save_auth.mjs
 * Script para automatizar el login en un sitio web y guardar el "storageState" (cookies/localStorage)
 * para usarlo en futuros tests headless.
 * 
 * USO (Una vez que edites las credenciales y selectores abajo):
 *   node scripts/playwright_save_auth.mjs
 */

import { chromium } from 'playwright-core';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env desde la raíz del proyecto
config({ path: resolve(import.meta.dirname, '..', '.env') });

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;

if (!WS_ENDPOINT) {
  console.error('❌ PLAYWRIGHT_WS_ENDPOINT no definido en .env');
  process.exit(1);
}

// ==============================================================
// CONFIGURACIÓN DE LOGIN (¡Edita esto!)
// ==============================================================
const LOGIN_URL = 'https://mi-sitio.com/login';
const SUCCESS_URL = '**/dashboard'; // URL a la que redirige tras login exitoso (puede ser un patrón)
const AUTH_FILE = resolve(import.meta.dirname, '..', 'output', 'auth_state.json'); // Donde se guardará la sesión

const CREDENTIALS = {
  username: 'mi_usuario',
  password: 'mi_password'
};

// Selectores CSS o XPath del formulario
const SELECTORS = {
  userInput: 'input[name="username"]', // Cambia por el selector real
  passInput: 'input[name="password"]', // Cambia por el selector real
  submitBtn: 'button[type="submit"]'   // Cambia por el selector real
};
// ==============================================================

async function run() {
  console.log(`🔗 Conectando a Playwright remoto: ${WS_ENDPOINT}`);
  let browser;
  try {
    browser = await chromium.connect(WS_ENDPOINT, { timeout: 15000 });
  } catch (err) {
    console.error(`❌ No se pudo conectar a ${WS_ENDPOINT}: ${err.message}`);
    process.exit(1);
  }

  const context = await browser.newContext({
    locale: 'es-VE',
    timezoneId: 'America/Caracas',
  });

  const page = await context.newPage();

  try {
    console.log(`🌐 Navegando a la página de login: ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

    console.log('✍️ Ingresando credenciales...');
    await page.fill(SELECTORS.userInput, CREDENTIALS.username);
    await page.fill(SELECTORS.passInput, CREDENTIALS.password);
    
    console.log('🔘 Haciendo click en Entrar...');
    await page.click(SELECTORS.submitBtn);

    console.log(`⏳ Esperando redirección al área privada (${SUCCESS_URL})...`);
    // Esperamos a que la URL cambie al dashboard para confirmar que el login fue exitoso
    await page.waitForURL(SUCCESS_URL, { timeout: 15000 });
    
    console.log('✅ Login exitoso!');

    // Guardar el estado de la sesión (MÁGIA)
    await context.storageState({ path: AUTH_FILE });
    console.log(`💾 Sesión guardada en: ${AUTH_FILE}`);
    console.log('👉 Ahora puedes pasar este archivo a tus otros scripts.');

  } catch (err) {
    console.error(`❌ Error durante el login: ${err.message}`);
    console.log('Tip: Verifica que los selectores CSS y la URL de redirección sean correctos.');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(console.error);
