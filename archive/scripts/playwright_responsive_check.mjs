/**
 * playwright_responsive_check.mjs
 * Verifica responsive design en múltiples viewports usando Playwright remoto.
 * 
 * USO:
 *   node scripts/playwright_responsive_check.mjs <URL>
 * 
 * Captura automáticamente en:
 *   - Desktop: 1920x1080
 *   - Laptop: 1366x768
 *   - Tablet: 768x1024
 *   - Mobile: 375x812
 *   - Mobile Small: 320x568
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

const url = process.argv[2];
if (!url) {
  console.error('❌ Uso: node playwright_responsive_check.mjs <URL>');
  process.exit(1);
}

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile_sm', width: 320, height: 568 },
];

const timestamp = Date.now();
const outputDir = resolve(import.meta.dirname, '..', 'output', 'screenshots', `responsive_${timestamp}`);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

async function run() {
  console.log(`🔗 Conectando a: ${WS_ENDPOINT}`);
  const browser = await chromium.connect(WS_ENDPOINT, { timeout: 15000 });
  console.log('✅ Conectado');

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 ${vp.name} (${vp.width}x${vp.height}):`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'es-VE',
      isMobile: vp.width <= 768,
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Screenshot above the fold
      const foldFile = `${vp.name}_fold.png`;
      await page.screenshot({ path: join(outputDir, foldFile) });
      console.log(`  📸 ${foldFile}`);

      // Full page screenshot
      const fullFile = `${vp.name}_full.png`;
      await page.screenshot({ path: join(outputDir, fullFile), fullPage: true });
      console.log(`  📸 ${fullFile}`);

      // Layout checks
      const checks = await page.evaluate(() => {
        const body = document.body;
        const isHorizontalScroll = body.scrollWidth > window.innerWidth;
        
        // Check if elements overflow
        const allElements = document.querySelectorAll('*');
        let overflowCount = 0;
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 5) overflowCount++;
        }

        // Check text readability (any text smaller than 12px)
        let tinyTextCount = 0;
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (el.textContent.trim() && fontSize < 12) tinyTextCount++;
        }

        // Check tap targets (buttons/links smaller than 44x44)
        const tapTargets = document.querySelectorAll('a, button, input, select, textarea');
        let smallTapTargets = 0;
        for (const el of tapTargets) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            smallTapTargets++;
          }
        }

        return {
          horizontalScroll: isHorizontalScroll,
          overflowElements: overflowCount,
          tinyText: tinyTextCount,
          smallTapTargets,
          pageHeight: document.documentElement.scrollHeight,
        };
      });

      results.push({ viewport: vp, checks });

      console.log(`  Scroll horizontal: ${checks.horizontalScroll ? '❌ SÍ' : '✅ No'}`);
      console.log(`  Overflow elements: ${checks.overflowElements === 0 ? '✅ 0' : '⚠️ ' + checks.overflowElements}`);
      console.log(`  Texto < 12px: ${checks.tinyText === 0 ? '✅ 0' : '⚠️ ' + checks.tinyText}`);
      console.log(`  Tap targets < 44px: ${checks.smallTapTargets === 0 ? '✅ 0' : '⚠️ ' + checks.smallTapTargets}`);
      console.log(`  Altura página: ${checks.pageHeight}px`);

    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN RESPONSIVE');
  console.log('═'.repeat(60));
  for (const r of results) {
    const pass = !r.checks.horizontalScroll && r.checks.overflowElements === 0;
    console.log(`  ${pass ? '✅' : '❌'} ${r.viewport.name} (${r.viewport.width}x${r.viewport.height})`);
  }
  console.log('═'.repeat(60));
  console.log(`📁 Screenshots: ${outputDir}`);
  console.log('🔌 Desconectado');
}

run().catch(console.error);
