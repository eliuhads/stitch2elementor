/**
 * verify_icons.mjs — Verify icon replacement + full visual delta check + screenshot
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('https://evergreenvzla.com/?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

console.log('=== ICON VERIFICATION ===\n');

// 1. Check Material Symbols font loaded
const fontLoaded = await page.evaluate(() => {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  return links.filter(l => l.href.includes('Material+Symbols') || l.href.includes('material-symbols')).length > 0;
});
console.log(`1. Material Symbols font: ${fontLoaded ? '✅ Loaded' : '❌ Missing'}`);

// 2. Check Value Props icons
const vpIcons = await page.evaluate(() => {
  const iconMap = {
    'icon_29302187': 'sailing',
    'icon_44db5797': 'verified',
    'icon_7e4cf3f7': 'engineering'
  };
  
  return Object.entries(iconMap).map(([id, expected]) => {
    const widget = document.querySelector(`[data-id="${id}"]`);
    if (!widget) return { id, status: 'NOT FOUND' };
    
    const msIcon = widget.querySelector('.material-symbols-outlined');
    const faIcon = widget.querySelector('.elementor-icon i');
    
    return {
      id,
      expected,
      hasMaterialSymbol: !!msIcon,
      msText: msIcon?.textContent?.trim() || 'none',
      faClass: faIcon?.className || 'none',
      matches: msIcon?.textContent?.trim() === expected
    };
  });
});

console.log('\n2. Value Props Icons:');
vpIcons.forEach(ic => {
  const status = ic.matches ? '✅' : '❌';
  console.log(`   ${status} [${ic.id}] expected: "${ic.expected}" | got: "${ic.msText}" | FA: ${ic.faClass}`);
});

// 3. Check category icons
const catIcons = await page.evaluate(() => {
  const expected = ['lightbulb', 'highlight', 'traffic', 'wall_lamp', 'filter_center_focus', 'factory'];
  const catSection = document.querySelector('[data-id="7ebc3f4b"]');
  if (!catSection) return { found: false };
  
  const icons = catSection.querySelectorAll('.elementor-widget-icon .material-symbols-outlined');
  return {
    found: true,
    count: icons.length,
    values: [...icons].map((el, i) => ({
      text: el.textContent.trim(),
      expected: expected[i] || '?',
      matches: el.textContent.trim() === (expected[i] || '')
    }))
  };
});

console.log('\n3. Category Icons:');
if (catIcons.found) {
  console.log(`   Total: ${catIcons.count}/6`);
  catIcons.values.forEach(v => {
    console.log(`   ${v.matches ? '✅' : '❌'} got: "${v.text}" expected: "${v.expected}"`);
  });
} else {
  console.log('   ❌ Category section not found');
}

// 4. CTA gradient still working?
const ctaGrad = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return 'NOT FOUND';
  return window.getComputedStyle(el).backgroundImage?.substring(0, 80);
});
console.log(`\n4. CTA Gradient: ${ctaGrad.includes('gradient') ? '✅' : '❌'} ${ctaGrad}`);

// 5. Screenshots — full page + VP section + CTA
await page.screenshot({ path: 'temp/homepage_v5_full.png', fullPage: true });
console.log('\n5. Full page screenshot: temp/homepage_v5_full.png');

// VP section screenshot
const vpEl = await page.$('[data-id="e5fe551b"]');
if (vpEl) {
  await vpEl.screenshot({ path: 'temp/homepage_v5_vp.png' });
  console.log('   VP section screenshot: temp/homepage_v5_vp.png');
}

// CTA section screenshot
const ctaEl = await page.$('[data-id="69a22305"]');
if (ctaEl) {
  await ctaEl.screenshot({ path: 'temp/homepage_v5_cta.png' });
  console.log('   CTA section screenshot: temp/homepage_v5_cta.png');
}

await browser.close();
