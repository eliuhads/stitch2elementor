/**
 * capture_wp_pages.mjs — Capture full-page screenshots of all live WP pages
 * Uses remote Playwright via PLAYWRIGHT_WS_ENDPOINT
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'temp', 'screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const WP_URL = 'https://evergreenvzla.com';

// Select key pages for visual verification
const keyPages = [
  { slug: 'nosotros', url: `${WP_URL}/nosotros/` },
  { slug: 'catalogo', url: `${WP_URL}/catalogo/` },
  { slug: 'paneles-led', url: `${WP_URL}/paneles-led/` },
  { slug: 'contacto', url: `${WP_URL}/contacto/` },
  { slug: 'blog', url: `${WP_URL}/blog/` },
  { slug: 'reflectores-led', url: `${WP_URL}/reflectores-led/` },
];

console.log('📸 Capturing key pages...\n');

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');

for (const p of keyPages) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  
  const outPath = path.join(OUT_DIR, `${p.slug}.png`);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`  ✅ ${p.slug} → ${outPath}`);
  await page.close();
}

await browser.close();
console.log('\n🏁 Screenshots captured!');
