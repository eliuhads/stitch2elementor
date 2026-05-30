/**
 * verify_fix.mjs — Verify image fix via Playwright remote
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

console.log('⏳ Loading homepage (cache-busted)...');
await page.goto('https://evergreenvzla.com?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// Full page screenshot
await page.screenshot({ path: 'temp/homepage_after_fix.png', fullPage: true });
console.log('📸 Full page screenshot saved');

// Check CSS version
const cssVer = await page.evaluate(() => {
  const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .find(l => l.href.includes('evergreen-homepage-custom'));
  return link ? link.href : 'NOT FOUND';
});
console.log('CSS version:', cssVer);

// Check image widgets
const imgDiag = await page.evaluate(() => {
  const ids = ['02453e5a', '3ca2b9d3', 'd5c192f5'];
  return ids.map(id => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return { id, found: false };
    const cs = getComputedStyle(el);
    const img = el.querySelector('img');
    const imgCs = img ? getComputedStyle(img) : null;
    return {
      id,
      widgetH: cs.height,
      widgetW: cs.width,
      widgetPos: cs.position,
      imgH: imgCs?.height || 'N/A',
      imgW: imgCs?.width || 'N/A',
      imgPos: imgCs?.position || 'N/A',
      imgObjFit: imgCs?.objectFit || 'N/A',
      imgOpacity: imgCs?.opacity || 'N/A',
      imgVisible: img ? (img.offsetHeight > 0) : false,
      imgSrc: img ? img.src.split('/').pop() : 'N/A'
    };
  });
});
console.log('\n--- Image Widgets After Fix ---');
console.log(JSON.stringify(imgDiag, null, 2));

// Check card containers
const cardDiag = await page.evaluate(() => {
  const ids = ['7dce1679', 'c2f4bf3b', 'f506a881'];
  return ids.map(id => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return { id, found: false };
    const cs = getComputedStyle(el);
    return {
      id,
      height: cs.height,
      minHeight: cs.minHeight,
      overflow: cs.overflow,
      position: cs.position,
      borderRadius: cs.borderRadius
    };
  });
});
console.log('\n--- Card Containers After Fix ---');
console.log(JSON.stringify(cardDiag, null, 2));

// Screenshot categories section
const catSection = await page.$('[data-id="7ebc3f4b"]');
if (catSection) {
  await catSection.screenshot({ path: 'temp/categories_after_fix.png' });
  console.log('📸 Categories section screenshot saved');
}

// Screenshot hero section
const heroSection = await page.$('[data-id="ecf97c6e"]');
if (heroSection) {
  await heroSection.screenshot({ path: 'temp/hero_after_fix.png' });
  console.log('📸 Hero section screenshot saved');
}

await browser.close();
console.log('\n✅ Verification complete');
