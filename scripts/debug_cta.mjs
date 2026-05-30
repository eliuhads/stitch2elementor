import { chromium } from 'playwright';

const b = await chromium.connect('ws://192.168.1.252:3000/playwright');
const p = await b.newPage();
await p.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(2000);

// Check if CTA element exists and its computed background
const ctaInfo = await p.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return {
    found: true,
    background: cs.background,
    backgroundColor: cs.backgroundColor,
    classes: el.className,
  };
});
console.log('CTA element:', JSON.stringify(ctaInfo, null, 2));

// Check if our custom CSS is in the page
const cssInfo = await p.evaluate(() => {
  const styles = document.querySelectorAll('style');
  let found = false;
  for (const s of styles) {
    if (s.textContent.includes('69a22305')) {
      found = true;
      return { found: true, snippet: s.textContent.substring(0, 300) };
    }
  }
  return { found: false, totalStyles: styles.length };
});
console.log('CSS info:', JSON.stringify(cssInfo, null, 2));

// Screenshot just the CTA area
const ctaEl = await p.$('[data-id="69a22305"]');
if (ctaEl) {
  await ctaEl.screenshot({ path: 'scratch/wp_cta_v3.png' });
  console.log('✅ CTA screenshot saved');
}

await b.close();
