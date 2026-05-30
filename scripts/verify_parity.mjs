/**
 * verify_parity.mjs — Visual parity verification
 * Captures full-page screenshots of ALL WP pages at 1280px desktop
 * and compares against Stitch HTML source files opened via file://
 * 
 * Uses remote Playwright (PLAYWRIGHT_WS_ENDPOINT)
 * Output: temp/verify/ folder with paired screenshots
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'temp', 'verify');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Load manifest
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));

// Pages to verify (all with wp_id)
const pages = manifest.pages.filter(p => p.wp_id);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  VERIFY PARITY — Stitch vs WordPress             ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`📋 ${pages.length} pages to verify\n`);

const WP_URL = 'https://evergreenvzla.com';
const VIEWPORT = { width: 1280, height: 900 };

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');

const results = [];

for (const page of pages) {
  const slug = page.slug;
  const wpUrl = page.is_homepage ? WP_URL : `${WP_URL}/${slug}/`;
  const htmlPath = path.join(ROOT, 'assets_originales', page.html);
  
  console.log(`\n── ${page.title} ──`);
  
  // 1. Capture WP page
  try {
    const wpPage = await browser.newPage();
    await wpPage.setViewportSize(VIEWPORT);
    await wpPage.goto(wpUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await wpPage.waitForTimeout(2000);
    
    const wpScreenshot = path.join(OUT_DIR, `wp_${slug}.png`);
    await wpPage.screenshot({ path: wpScreenshot, fullPage: true });
    
    // Get page title and content length
    const wpTitle = await wpPage.title();
    const wpBodyText = await wpPage.evaluate(() => document.body.innerText.length);
    const wpSections = await wpPage.evaluate(() => document.querySelectorAll('[data-element_type="container"]').length);
    
    console.log(`  📸 WP:     ${wpUrl}`);
    console.log(`           Title: "${wpTitle}" | Text: ${wpBodyText} chars | Containers: ${wpSections}`);
    
    await wpPage.close();
    
    // 2. Capture Stitch HTML (file://)
    if (fs.existsSync(htmlPath)) {
      const stitchPage = await browser.newPage();
      await stitchPage.setViewportSize(VIEWPORT);
      
      // Convert Windows path to file:// URL
      const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
      await stitchPage.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await stitchPage.waitForTimeout(2000);
      
      const stitchScreenshot = path.join(OUT_DIR, `stitch_${slug}.png`);
      await stitchPage.screenshot({ path: stitchScreenshot, fullPage: true });
      
      const stitchTitle = await stitchPage.title();
      const stitchBodyText = await stitchPage.evaluate(() => document.body.innerText.length);
      const stitchSections = await stitchPage.evaluate(() => document.querySelectorAll('section').length);
      
      console.log(`  📸 Stitch: ${path.basename(htmlPath)}`);
      console.log(`           Title: "${stitchTitle}" | Text: ${stitchBodyText} chars | Sections: ${stitchSections}`);
      
      // Content parity check
      const textRatio = Math.min(wpBodyText, stitchBodyText) / Math.max(wpBodyText, stitchBodyText);
      const textParity = textRatio > 0.7 ? '✅' : textRatio > 0.4 ? '⚠️' : '❌';
      console.log(`  ${textParity} Text parity: ${(textRatio * 100).toFixed(0)}%`);
      
      results.push({
        slug,
        title: page.title,
        wpId: page.wp_id,
        wpUrl,
        wpBodyText,
        stitchBodyText,
        textParity: (textRatio * 100).toFixed(0) + '%',
        status: textParity
      });
      
      await stitchPage.close();
    } else {
      console.log(`  ⚠️ Stitch HTML not found: ${page.html}`);
      results.push({
        slug,
        title: page.title,
        wpId: page.wp_id,
        wpUrl,
        wpBodyText,
        stitchBodyText: 'N/A',
        textParity: 'N/A',
        status: '⚠️'
      });
    }
    
  } catch (err) {
    console.error(`  ❌ Error on ${slug}: ${err.message}`);
    results.push({
      slug,
      title: page.title,
      wpId: page.wp_id,
      wpUrl: wpUrl,
      status: '❌',
      error: err.message
    });
  }
}

await browser.close();

// Print summary table
console.log('\n\n' + '═'.repeat(85));
console.log('📊 PARITY VERIFICATION SUMMARY');
console.log('═'.repeat(85));
console.log('  ' + 'Page'.padEnd(30) + 'WP ID'.padEnd(8) + 'WP Text'.padEnd(10) + 'Stitch'.padEnd(10) + 'Parity'.padEnd(10) + 'Status');
console.log('─'.repeat(85));

for (const r of results) {
  console.log(
    '  ' + 
    r.title.substring(0, 28).padEnd(30) + 
    String(r.wpId).padEnd(8) + 
    String(r.wpBodyText || '?').padEnd(10) + 
    String(r.stitchBodyText || '?').padEnd(10) + 
    String(r.textParity || '?').padEnd(10) + 
    r.status
  );
}
console.log('─'.repeat(85));
console.log(`\n📂 Screenshots saved to: ${OUT_DIR}`);
console.log('🏁 Verification complete!\n');
