import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const WS = process.env.PLAYWRIGHT_WS_ENDPOINT || 'ws://192.168.1.252:3000/playwright';
const HTML_FILE = path.join(process.cwd(), 'evergreen_brandbook.html');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'brandbook_screenshots');

// Get local IP accessible from Proxmox
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

async function main() {
  // Create screenshots dir
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

  // Start local HTTP server
  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  const PORT = 8765;
  const localIP = getLocalIP();
  
  await new Promise(resolve => server.listen(PORT, '0.0.0.0', resolve));
  console.log(`Server: http://${localIP}:${PORT}`);

  let browser;
  try {
    browser = await chromium.connect(WS);
    console.log('Connected to remote Playwright');

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    await page.goto(`http://${localIP}:${PORT}`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');

    // Screenshot 1: Hero (full viewport)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_hero.png') });
    console.log('✓ 01_hero.png');

    // Screenshot 2: Brand Strategy
    await page.evaluate(() => document.getElementById('marca')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_brand_strategy.png') });
    console.log('✓ 02_brand_strategy.png');

    // Screenshot 3: Colors
    await page.evaluate(() => document.getElementById('colores')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_colors.png') });
    console.log('✓ 03_colors.png');

    // Screenshot 4: Typography
    await page.evaluate(() => document.getElementById('tipografia')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_typography.png') });
    console.log('✓ 04_typography.png');

    // Screenshot 5: Components
    await page.evaluate(() => document.getElementById('componentes')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_components.png') });
    console.log('✓ 05_components.png');

    // Screenshot 6: Architecture
    await page.evaluate(() => document.getElementById('arquitectura')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_architecture.png') });
    console.log('✓ 06_architecture.png');

    // Screenshot 7: Footer/Contact
    await page.evaluate(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_contact.png') });
    console.log('✓ 07_contact.png');

    // Screenshot 8: Full page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_fullpage.png'), fullPage: true });
    console.log('✓ 08_fullpage.png (full page)');

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_mobile_hero.png') });
    console.log('✓ 09_mobile_hero.png');

    await context.close();
    console.log('\n✅ All screenshots saved to brandbook_screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main();
