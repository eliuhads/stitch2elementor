/**
 * scripts/verify_homepage_sections.mjs
 * Verification script using Playwright to take a full-page screenshot of the updated Homepage.
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log('━━━ Verify Homepage Visual Layout ━━━\n');

try {
  console.log('🔗 Connecting to Playwright browser...');
  const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
  const page = await browser.newPage();
  
  // High-res desktop viewport
  await page.setViewportSize({ width: 1440, height: 2500 });
  
  console.log('🚀 Loading homepage with nocache=1 to bypass LiteSpeed cache...');
  await page.goto('https://evergreenvzla.com/?nocache=1', { 
    waitUntil: 'networkidle', 
    timeout: 45000 
  });
  
  console.log('⏳ Waiting for all assets and animations...');
  await page.waitForTimeout(6000);
  
  const destPath = path.join(ROOT, 'temp/v4_full_page.png');
  
  // Ensure temp folder exists
  const tempDir = path.dirname(destPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  console.log('📸 Capturing full page screenshot...');
  await page.screenshot({ 
    path: destPath, 
    fullPage: true 
  });
  
  console.log(`✅ Visual verification screenshot successfully saved to: ${destPath}`);
  
  await browser.close();
  console.log('\n🎉 Verification complete! You can view temp/v4_full_page.png to audit the results.');
} catch (err) {
  console.error('❌ Playwright verification error:', err.message);
  process.exit(1);
}
