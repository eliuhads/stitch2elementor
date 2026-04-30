/**
 * playwright_scroll_capture.mjs
 * Captura screenshots seccionados mientras hace scroll por toda la página.
 * Ideal para verificación visual sección por sección.
 * 
 * USO:
 *   node scripts/playwright_scroll_capture.mjs <URL> [--sections] [--viewport 1920x1080]
 * 
 * OPCIONES:
 *   --sections    Captura cada <section> individualmente
 *   --viewport    Ancho x alto del viewport (default: 1920x1080)
 * 
 * REQUIERE:
 *   - PLAYWRIGHT_WS_ENDPOINT en .env
 *   - npm install playwright-core dotenv
 */

import { chromium } from 'playwright-core';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

config({ path: resolve(import.meta.dirname, '..', '.env') });

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
if (!WS_ENDPOINT) {
  console.error('❌ PLAYWRIGHT_WS_ENDPOINT no definido en .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
if (!url) {
  console.error('❌ Uso: node playwright_scroll_capture.mjs <URL> [--sections] [--viewport WxH]');
  process.exit(1);
}

const captureBySection = args.includes('--sections');
const viewportArg = args.includes('--viewport')
  ? args[args.indexOf('--viewport') + 1]
  : '1920x1080';
const [vpWidth, vpHeight] = viewportArg.split('x').map(Number);

const timestamp = Date.now();
const outputDir = resolve(import.meta.dirname, '..', 'output', 'screenshots', `scroll_${timestamp}`);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

async function run() {
  console.log(`🔗 Conectando a: ${WS_ENDPOINT}`);
  const browser = await chromium.connect(WS_ENDPOINT, { timeout: 15000 });
  console.log('✅ Conectado');

  const context = await browser.newContext({
    viewport: { width: vpWidth, height: vpHeight },
    locale: 'es-VE',
  });
  const page = await context.newPage();

  try {
    console.log(`🌐 Cargando: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📄 Título: ${await page.title()}`);

    if (captureBySection) {
      // Capturar cada section individualmente
      const sections = await page.$$('section, footer, nav');
      console.log(`📐 Encontradas ${sections.length} secciones`);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const id = await section.getAttribute('id') || `section_${i}`;
        const tag = await section.evaluate(el => el.tagName.toLowerCase());
        const filename = `${String(i).padStart(2, '0')}_${tag}_${id}.png`;

        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300); // Esperar animaciones scroll

        await section.screenshot({ path: join(outputDir, filename) });
        console.log(`  📸 ${filename}`);
      }
    } else {
      // Full-page screenshot
      const fullPath = join(outputDir, 'full_page.png');
      await page.screenshot({ path: fullPath, fullPage: true });
      console.log(`📸 Full page: ${fullPath}`);

      // Viewport screenshots cada screenHeight
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const screens = Math.ceil(pageHeight / vpHeight);
      console.log(`📐 Página: ${pageHeight}px → ${screens} pantallas`);

      for (let i = 0; i < screens; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), i * vpHeight);
        await page.waitForTimeout(400);
        const filename = `viewport_${String(i).padStart(2, '0')}.png`;
        await page.screenshot({ path: join(outputDir, filename) });
        console.log(`  📸 ${filename}`);
      }
    }

    console.log(`\n✅ Capturas guardadas en: ${outputDir}`);

  } finally {
    await context.close();
    await browser.close();
    console.log('🔌 Desconectado');
  }
}

run().catch(console.error);
