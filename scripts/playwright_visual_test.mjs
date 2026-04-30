/**
 * playwright_visual_test.mjs
 * Conecta al contenedor Proxmox con Playwright para verificación visual de páginas.
 * 
 * USO:
 *   node scripts/playwright_visual_test.mjs <URL> [--screenshot nombre] [--full-page] [--viewport 1920x1080]
 * 
 * EJEMPLOS:
 *   node scripts/playwright_visual_test.mjs https://evergreenvzla.com
 *   node scripts/playwright_visual_test.mjs file:///c:/ruta/al/archivo.html --screenshot hero --full-page
 *   node scripts/playwright_visual_test.mjs https://evergreenvzla.com --viewport 375x812 --screenshot mobile
 * 
 * REQUIERE:
 *   - PLAYWRIGHT_WS_ENDPOINT en .env (ws://192.168.1.252:3000/playwright)
 *   - npm install playwright-core dotenv
 */

import { chromium } from 'playwright-core';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Cargar .env desde la raíz del proyecto
config({ path: resolve(import.meta.dirname, '..', '.env') });

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;

if (!WS_ENDPOINT) {
  console.error('❌ PLAYWRIGHT_WS_ENDPOINT no definido en .env');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));

if (!url) {
  console.error('❌ Uso: node playwright_visual_test.mjs <URL> [--screenshot nombre] [--full-page] [--viewport WxH]');
  process.exit(1);
}

const screenshotName = args.includes('--screenshot')
  ? args[args.indexOf('--screenshot') + 1] || 'screenshot'
  : 'screenshot';

const fullPage = args.includes('--full-page');

const viewportArg = args.includes('--viewport')
  ? args[args.indexOf('--viewport') + 1]
  : '1920x1080';

const [vpWidth, vpHeight] = viewportArg.split('x').map(Number);

// Output dir
const outputDir = resolve(import.meta.dirname, '..', 'output', 'screenshots');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

async function run() {
  console.log(`🔗 Conectando a Playwright remoto: ${WS_ENDPOINT}`);
  
  let browser;
  try {
    browser = await chromium.connect(WS_ENDPOINT, { timeout: 15000 });
    console.log('✅ Conectado al contenedor Proxmox');
  } catch (err) {
    console.error(`❌ No se pudo conectar a ${WS_ENDPOINT}`);
    console.error(`   Error: ${err.message}`);
    console.error('   Verifica que el contenedor Playwright esté corriendo.');
    process.exit(1);
  }

  const context = await browser.newContext({
    viewport: { width: vpWidth, height: vpHeight },
    locale: 'es-VE',
    timezoneId: 'America/Caracas',
  });

  const page = await context.newPage();

  try {
    console.log(`🌐 Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📄 Título: ${await page.title()}`);

    // Screenshot
    const filename = `${screenshotName}_${vpWidth}x${vpHeight}_${Date.now()}.png`;
    const filepath = join(outputDir, filename);
    await page.screenshot({ path: filepath, fullPage });
    console.log(`📸 Screenshot guardado: ${filepath}`);

    // Basic checks
    const checks = await page.evaluate(() => {
      const results = {};
      
      // H1
      const h1 = document.querySelector('h1');
      results.h1 = h1 ? h1.textContent.trim() : 'NO H1 FOUND';
      
      // Meta description
      const meta = document.querySelector('meta[name="description"]');
      results.metaDesc = meta ? meta.content.substring(0, 80) + '...' : 'NO META DESCRIPTION';
      
      // Links count
      results.linksCount = document.querySelectorAll('a[href]').length;
      
      // Images count
      results.imagesCount = document.querySelectorAll('img').length;
      
      // Sections count
      results.sectionsCount = document.querySelectorAll('section').length;
      
      // Schema JSON-LD
      const schema = document.querySelector('script[type="application/ld+json"]');
      results.hasSchema = !!schema;
      
      // Check for solar references (should be 0)
      const bodyText = document.body.innerText.toLowerCase();
      results.solarRefs = (bodyText.match(/solar|fotovoltaic|panel solar/g) || []).length;
      
      // Responsive meta
      const viewport = document.querySelector('meta[name="viewport"]');
      results.hasViewportMeta = !!viewport;
      
      return results;
    });

    console.log('\n📋 Verificación automática:');
    console.log('─'.repeat(50));
    console.log(`  H1: ${checks.h1}`);
    console.log(`  Meta Description: ${checks.metaDesc}`);
    console.log(`  Links: ${checks.linksCount}`);
    console.log(`  Imágenes: ${checks.imagesCount}`);
    console.log(`  Secciones: ${checks.sectionsCount}`);
    console.log(`  Schema JSON-LD: ${checks.hasSchema ? '✅' : '❌'}`);
    console.log(`  Viewport Meta: ${checks.hasViewportMeta ? '✅' : '❌'}`);
    console.log(`  Refs Solar/Fotovoltaico: ${checks.solarRefs === 0 ? '✅ 0' : '❌ ' + checks.solarRefs}`);
    console.log('─'.repeat(50));

  } catch (err) {
    console.error(`❌ Error durante la verificación: ${err.message}`);
  } finally {
    await context.close();
    await browser.close();
    console.log('🔌 Desconectado del contenedor Playwright');
  }
}

run().catch(console.error);
