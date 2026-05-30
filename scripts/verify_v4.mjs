import { chromium } from 'playwright';

const b = await chromium.connect('ws://192.168.1.252:3000/playwright');
const p = await b.newPage();
await p.setViewportSize({ width: 1920, height: 1080 });
await p.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);

// Check if our CSS file is loaded
const cssLinks = await p.evaluate(() => {
  return [...document.querySelectorAll('link[rel=stylesheet]')]
    .map(l => l.href)
    .filter(h => h.includes('evergreen'));
});
console.log('Evergreen CSS links:', cssLinks);

// Check CTA background
const ctaBg = await p.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return 'NOT FOUND';
  const cs = getComputedStyle(el);
  return { backgroundImage: cs.backgroundImage, background: cs.background.substring(0, 200) };
});
console.log('CTA background:', ctaBg);

// Screenshots
await p.screenshot({ path: 'scratch/wp_home_v4_full.png', fullPage: true });
await p.screenshot({ path: 'scratch/wp_home_v4_hero.png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });

// Scroll to CTA and capture
const ctaEl = await p.$('[data-id="69a22305"]');
if (ctaEl) {
  await ctaEl.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await ctaEl.screenshot({ path: 'scratch/wp_cta_v4.png' });
  console.log('CTA screenshot saved');
}

console.log('done');
await b.close();
