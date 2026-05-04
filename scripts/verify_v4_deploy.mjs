/**
 * verify_v4_deploy.mjs — Quick verification of CSS v4 fixes
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

await page.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// 1. CSS version check
const cssVer = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  return links.filter(l => l.href.includes('evergreen-homepage')).map(l => l.href);
});
console.log('CSS:', cssVer);

// 2. CTA gradient — THE CRITICAL FIX
const cta = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return {
    bgColor: cs.backgroundColor,
    bgImage: cs.backgroundImage.substring(0, 120),
    borderRadius: cs.borderRadius,
    padding: cs.padding
  };
});
console.log('\nCTA gradient:', JSON.stringify(cta, null, 2));

// 3. Value Props section
const vp = await page.evaluate(() => {
  const el = document.querySelector('[data-id="e5fe551b"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  const h2 = el.querySelector('.elementor-heading-title');
  const divSep = el.querySelector('.elementor-divider-separator');
  const icons = el.querySelectorAll('.elementor-icon');
  return {
    found: true,
    bg: cs.backgroundColor,
    h2Text: h2 ? h2.textContent.trim().substring(0, 40) : 'N/A',
    dividerColor: divSep ? getComputedStyle(divSep).borderTopColor : 'N/A',
    dividerWidth: divSep ? getComputedStyle(divSep).width : 'N/A',
    iconCount: icons.length,
    iconSample: icons[0] ? {
      color: getComputedStyle(icons[0]).color,
      bg: getComputedStyle(icons[0]).backgroundColor,
      borderRadius: getComputedStyle(icons[0]).borderRadius,
      width: getComputedStyle(icons[0]).width
    } : 'N/A'
  };
});
console.log('\nValue Props:', JSON.stringify(vp, null, 2));

// 4. Phone number in CTA
const phone = await page.evaluate(() => {
  const cta = document.querySelector('[data-id="69a22305"]');
  if (!cta) return { found: false };
  const tw = cta.querySelector('.elementor-widget-text-editor');
  if (!tw) return { found: true, text: 'no text widget' };
  const container = tw.querySelector('.elementor-widget-container') || tw;
  const cs = getComputedStyle(container);
  return {
    text: tw.textContent.trim(),
    color: cs.color,
    fontSize: cs.fontSize,
    fontFamily: cs.fontFamily.substring(0, 30),
    fontWeight: cs.fontWeight
  };
});
console.log('\nPhone:', JSON.stringify(phone, null, 2));

// 5. Screenshots
await page.screenshot({ path: 'temp/v4_full_page.png', fullPage: true });
console.log('\n📸 Full page screenshot saved');

const ctaEl = await page.$('[data-id="69a22305"]');
if (ctaEl) {
  await ctaEl.screenshot({ path: 'temp/v4_cta.png' });
  console.log('📸 CTA screenshot saved');
}

const vpEl = await page.$('[data-id="e5fe551b"]');
if (vpEl) {
  await vpEl.screenshot({ path: 'temp/v4_value_props.png' });
  console.log('📸 Value Props screenshot saved');
}

await browser.close();
console.log('\n✅ Verification complete');
