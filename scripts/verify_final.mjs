import { chromium } from 'playwright';

const b = await chromium.connect('ws://192.168.1.252:3000/playwright');
const p = await b.newPage();
await p.setViewportSize({ width: 1920, height: 1080 });
await p.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);

// Full page
await p.screenshot({ path: 'scratch/wp_home_final.png', fullPage: true });

// Scroll to categories grid and capture
const catSection = await p.$('[data-id="02453e5a"]');
if (catSection) {
  await catSection.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1000);
}
await p.screenshot({ path: 'scratch/wp_categories_final.png', clip: { x: 0, y: 700, width: 1920, height: 700 } });

console.log('done');
await b.close();
