/**
 * responsive_check.mjs — Capture mobile + tablet screenshots
 */
import { chromium } from 'playwright';

const browser = await chromium.connect(process.env.PLAYWRIGHT_WS_ENDPOINT || 'ws://localhost:3000/playwright');

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 }
];

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(process.env.WP_BASE_URL || 'https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: `temp/responsive_${vp.name}.png`, fullPage: true });
  console.log(`📸 ${vp.name} (${vp.width}x${vp.height}) saved`);
  await page.close();
}

await browser.close();
console.log('✅ Responsive check complete');
