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
    try {
      console.log(`Connecting to remote Playwright at ${WS}...`);
      browser = await chromium.connect(WS);
      console.log('Connected to remote Playwright');
    } catch (err) {
      console.log(`Remote Playwright failed: ${err.message}. Launching local headless Chromium...`);
      browser = await chromium.launch({ headless: true });
      console.log('Local headless Chromium launched');
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    await page.goto(`http://${localIP}:${PORT}`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');

    // Slide 1: Overview & Ficha
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_overview.png') });
    console.log('✓ 01_overview.png');

    // Slide 2: Brand Strategy
    await page.click('#slide-btn-02');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_brand_strategy.png') });
    console.log('✓ 02_brand_strategy.png');

    // Slide 3: Buyer Personas
    await page.click('#slide-btn-03');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_buyer_personas.png') });
    console.log('✓ 03_buyer_personas.png');

    // Slide 4: Brand Voice
    await page.click('#slide-btn-04');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_brand_voice.png') });
    console.log('✓ 04_brand_voice.png');

    // Slide 5: Brand Logo
    await page.click('#slide-btn-05');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_brand_logo.png') });
    console.log('✓ 05_brand_logo.png');

    // Slide 6: Color Palette
    await page.click('#slide-btn-06');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_color_palette.png') });
    console.log('✓ 06_color_palette.png');

    // Slide 7: Typography
    await page.click('#slide-btn-07');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_typography.png') });
    console.log('✓ 07_typography.png');

    // Slide 8: Imagery & Icons
    await page.click('#slide-btn-08');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_imagery_icons.png') });
    console.log('✓ 08_imagery_icons.png');

    // Slide 9: B2B Channels
    await page.click('#slide-btn-09');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_b2b_channels.png') });
    console.log('✓ 09_b2b_channels.png');

    // Slide 10: Sitemap & SEO
    await page.click('#slide-btn-10');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_sitemap_seo.png') });
    console.log('✓ 10_sitemap_seo.png');

    // Slide 11: Governance
    await page.click('#slide-btn-11');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_governance.png') });
    console.log('✓ 11_governance.png');

    // Mobile Viewport (iPhone resolution)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.click('#slide-btn-01');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_mobile_hero.png') });
    console.log('✓ 12_mobile_hero.png');

    await context.close();
    console.log('\n✅ All 11 slides and mobile view screenshots saved to brandbook_screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main();
