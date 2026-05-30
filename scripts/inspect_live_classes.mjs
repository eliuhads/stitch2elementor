/**
 * scripts/inspect_live_classes.mjs
 * Queries all Elementor container and widget elements on the homepage and prints their IDs and class lists.
 */

import { chromium } from 'playwright';

try {
  console.log('🔗 Connecting to Playwright...');
  const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
  const page = await browser.newPage();
  
  console.log('🚀 Loading homepage...');
  await page.goto('https://evergreenvzla.com/?nocache=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('🔍 Inspection of live DOM element classes:');
  
  const report = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('.elementor-element'));
    return elements.map(el => {
      return {
        id: el.getAttribute('data-id'),
        classList: Array.from(el.classList),
        tagName: el.tagName
      };
    });
  });
  
  console.log(JSON.stringify(report, null, 2));
  
  await browser.close();
} catch (err) {
  console.error('Error:', err.message);
}
