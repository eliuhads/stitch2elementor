#!/usr/bin/env node
/**
 * qa_assertions.js — stitch2elementor v27 · E5/S3 QA visual (R22)
 *
 * Conecta con el runner Playwright remoto, hace autoScroll COMPLETO (obligatorio
 * para activar animaciones y lazy-load), espera networkidle, verifica overflow
 * horizontal e imágenes rotas, y captura screenshots fullPage en 375px y 1440px.
 *
 * Uso:   node qa_assertions.js <URL> [outPrefix]
 * Env:   S2E_PLAYWRIGHT_WS (ej. ws://<host>:3000/playwright)
 * Exit:  0 PASS mecánico (FALTA inspección visual humana/de visión — R22)
 *        1 FAIL (overflow o imágenes rotas) · 2 error de ejecución · 3 mal uso
 */

const url = process.argv[2];
const outPrefix = process.argv[3] || 'qa';
if (!url) { console.error('uso: node qa_assertions.js <URL> [outPrefix]'); process.exit(3); }

const ws = process.env.S2E_PLAYWRIGHT_WS;
if (!ws) { console.error('ERROR: define S2E_PLAYWRIGHT_WS'); process.exit(2); }

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e1) {
  try {
    chromium = require('playwright-core').chromium;
  } catch (e2) {
    const fs = require('fs');
    const path = require('path');
    const candidatePaths = [
      path.resolve(__dirname, '../../visual-tester/node_modules/playwright'),
      path.resolve(__dirname, '../../../SCRIPTS/playwright-runner/node_modules/playwright-core'),
      path.resolve(__dirname, '../../../FLOYDIA/SUBTOOLS/STITCH2ELEMENTOR/repo/node_modules/playwright')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try { chromium = require(p).chromium; break; } catch (_) {}
      }
    }
    if (!chromium) {
      console.error('ERROR: no se pudo cargar playwright. Instale playwright o defina NODE_PATH.');
      process.exit(2);
    }
  }
}

(async () => {
  const qaTimeout = parseInt(process.env.S2E_QA_TIMEOUT || '60000', 10);
  const browser = await chromium.connect(ws);
  const results = [];

  for (const vp of [
    { width: 375, height: 812, name: 'mobile' },
    { width: 1440, height: 900, name: 'desktop' },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      ignoreHTTPSErrors: true
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: qaTimeout });

    // AutoScroll obligatorio (R22): recorrer toda la página y volver arriba
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight * 0.8;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) { setTimeout(step, 120); }
          else { window.scrollTo(0, 0); resolve(); }
        };
        step();
      });
    });
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth);
    const images = await page.evaluate(
      () => Array.from(document.images).map((i) => ({
        src: i.currentSrc, ok: i.complete && i.naturalWidth > 0,
      })));
    const brokenImgs = images.filter((i) => !i.ok);

    await page.screenshot({ path: `${outPrefix}-${vp.name}.png`, fullPage: true });
    results.push({
      viewport: vp.name, overflowX: overflow,
      images: images.length, brokenImages: brokenImgs.map((i) => i.src),
    });
    await page.close();
  }

  await browser.close();
  const fail = results.some((r) => r.overflowX || r.brokenImages.length > 0);
  console.log(JSON.stringify({ url, results, verdict: fail ? 'FAIL' : 'PASS' }, null, 2));
  console.error(fail
    ? '❌ QA FAIL: overflow horizontal o imágenes rotas — revisar capturas'
    : '✅ QA mecánico PASS — OBLIGATORIA inspección visual de las capturas (R22) antes de certificar');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('ERROR QA:', e.message); process.exit(2); });
