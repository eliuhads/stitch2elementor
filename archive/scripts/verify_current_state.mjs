/**
 * verify_current_state.mjs — Full homepage state check after all CSS v4 + JSON patches
 * Checks: CTA gradient, Value Props, Hero, Categories, Footer, Screenshot
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// Load with cache bust
await page.goto('https://evergreenvzla.com/?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

console.log('=== HOMEPAGE STATE VERIFICATION ===\n');

// 1. CSS loaded?
const cssLoaded = await page.evaluate(() => {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  return links.filter(l => l.href.includes('evergreen-homepage-custom')).map(l => l.href);
});
console.log('1. CSS Custom:', cssLoaded.length ? cssLoaded[0] : '❌ NOT LOADED');

// 2. CTA gradient
const cta = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return { found: false };
  const cs = window.getComputedStyle(el);
  return {
    found: true,
    bgColor: cs.backgroundColor,
    bgImage: cs.backgroundImage,
    borderRadius: cs.borderRadius,
    padding: cs.padding
  };
});
console.log('\n2. CTA GRADIENT:');
if (cta.found) {
  const hasGradient = cta.bgImage && cta.bgImage.includes('gradient');
  console.log(`   bgColor: ${cta.bgColor}`);
  console.log(`   bgImage: ${cta.bgImage?.substring(0, 100)}...`);
  console.log(`   gradient: ${hasGradient ? '✅ YES' : '❌ NO'}`);
  console.log(`   borderRadius: ${cta.borderRadius}`);
} else {
  console.log('   ❌ CTA container NOT FOUND');
}

// 3. Value Props
const vp = await page.evaluate(() => {
  const el = document.querySelector('[data-id="e5fe551b"]');
  if (!el) return { found: false };
  const cs = window.getComputedStyle(el);
  const icons = el.querySelectorAll('.elementor-icon');
  const h3s = el.querySelectorAll('h3.elementor-heading-title');
  const divider = el.querySelector('.elementor-divider-separator');
  return {
    found: true,
    bg: cs.backgroundColor,
    iconCount: icons.length,
    iconSize: icons.length ? window.getComputedStyle(icons[0]).width : 'N/A',
    h3Count: h3s.length,
    h3Font: h3s.length ? window.getComputedStyle(h3s[0]).fontFamily : 'N/A',
    dividerColor: divider ? window.getComputedStyle(divider).borderTopColor : 'N/A'
  };
});
console.log('\n3. VALUE PROPS:');
if (vp.found) {
  console.log(`   bg: ${vp.bg}`);
  console.log(`   icons: ${vp.iconCount} (size: ${vp.iconSize})`);
  console.log(`   h3s: ${vp.h3Count} (font: ${vp.h3Font?.substring(0, 40)})`);
  console.log(`   divider: ${vp.dividerColor}`);
  console.log(`   status: ${vp.iconCount >= 3 ? '✅ OK' : '⚠️ Incomplete'}`);
} else {
  console.log('   ❌ Value Props section NOT FOUND');
}

// 4. Hero
const hero = await page.evaluate(() => {
  const el = document.querySelector('[data-id="ecf97c6e"]');
  if (!el) return { found: false };
  const h1 = el.querySelector('h1.elementor-heading-title');
  const pseudo = window.getComputedStyle(el, '::before');
  return {
    found: true,
    h1Text: h1?.textContent?.substring(0, 40),
    h1Font: h1 ? window.getComputedStyle(h1).fontFamily?.substring(0, 30) : 'N/A',
    h1Size: h1 ? window.getComputedStyle(h1).fontSize : 'N/A',
    pseudoBg: pseudo.backgroundImage?.substring(0, 60)
  };
});
console.log('\n4. HERO:');
if (hero.found) {
  console.log(`   h1: "${hero.h1Text}"`);
  console.log(`   font: ${hero.h1Font}, size: ${hero.h1Size}`);
  console.log(`   radial glow: ${hero.pseudoBg}`);
} else {
  console.log('   ❌ Hero NOT FOUND');
}

// 5. Categories
const cats = await page.evaluate(() => {
  const imgs = document.querySelectorAll('[data-id="7ebc3f4b"] img');
  return {
    imageCount: imgs.length,
    srcs: [...imgs].slice(0, 3).map(i => i.src?.substring(i.src.lastIndexOf('/') + 1))
  };
});
console.log('\n5. CATEGORIES:');
console.log(`   images: ${cats.imageCount}`);
console.log(`   files: ${cats.srcs.join(', ')}`);

// 6. Phone number
const phone = await page.evaluate(() => {
  const cta = document.querySelector('[data-id="69a22305"]');
  if (!cta) return null;
  const texts = cta.querySelectorAll('.elementor-widget-text-editor');
  for (const t of texts) {
    const content = t.textContent.trim();
    if (content.match(/[\d\+\-\(\)]/)) {
      const cs = window.getComputedStyle(t.querySelector('.elementor-widget-container') || t);
      return { text: content, color: cs.color, font: cs.fontFamily?.substring(0, 20), size: cs.fontSize };
    }
  }
  return null;
});
console.log('\n6. PHONE:');
if (phone) {
  console.log(`   text: ${phone.text}`);
  console.log(`   style: ${phone.color} ${phone.size} ${phone.font}`);
} else {
  console.log('   ⚠️ Phone not found in CTA');
}

// 7. Screenshot
await page.screenshot({ path: 'temp/homepage_v4_state.png', fullPage: true });
console.log('\n7. Screenshot saved: temp/homepage_v4_state.png');

// SUMMARY
console.log('\n========== SUMMARY ==========');
const ctaOk = cta.found && cta.bgImage?.includes('gradient');
const vpOk = vp.found && vp.iconCount >= 3;
const heroOk = hero.found;
console.log(`Hero:       ${heroOk ? '✅' : '❌'}`);
console.log(`Categories: ${cats.imageCount >= 3 ? '✅' : '❌'} (${cats.imageCount} images)`);
console.log(`Value Props:${vpOk ? '✅' : '❌'} (${vp.iconCount} icons)`);
console.log(`CTA Grad:   ${ctaOk ? '✅' : '❌'}`);
console.log(`Phone:      ${phone ? '✅' : '❌'}`);

const allGood = ctaOk && vpOk && heroOk && cats.imageCount >= 3;
console.log(`\nOVERALL:    ${allGood ? '🎉 ALL PASS' : '⚠️ NEEDS FIXES'}`);

await browser.close();
