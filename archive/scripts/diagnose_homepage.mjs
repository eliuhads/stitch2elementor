/**
 * diagnose_homepage.mjs — Playwright remote diagnostic for homepage image issues
 */
import { chromium } from 'playwright';

const PLAYWRIGHT_WS = 'ws://192.168.1.252:3000/playwright';

const browser = await chromium.connect(PLAYWRIGHT_WS);
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

console.log('⏳ Loading homepage...');
await page.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

// 1. Full page screenshot
await page.screenshot({ path: 'temp/homepage_full.png', fullPage: true });
console.log('📸 Full page screenshot saved');

// 2. Check category image cards
const imageCards = ['7dce1679', 'c2f4bf3b', 'f506a881'];  // Container IDs for image cards
const imageWidgets = ['02453e5a', '3ca2b9d3', 'd5c192f5'];  // Widget IDs for images

const cardDiag = await page.evaluate((ids) => {
  return ids.map(id => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return { id, found: false };
    const cs = getComputedStyle(el);
    return {
      id,
      found: true,
      tag: el.tagName,
      classes: el.className.substring(0, 150),
      display: cs.display,
      height: cs.height,
      width: cs.width,
      minHeight: cs.minHeight,
      overflow: cs.overflow,
      position: cs.position,
      flexDirection: cs.flexDirection,
      childCount: el.children.length
    };
  });
}, imageCards);
console.log('\n--- Category Card Containers ---');
console.log(JSON.stringify(cardDiag, null, 2));

const widgetDiag = await page.evaluate((ids) => {
  return ids.map(id => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return { id, found: false };
    const cs = getComputedStyle(el);
    const img = el.querySelector('img');
    const imgCs = img ? getComputedStyle(img) : null;
    return {
      id,
      found: true,
      elClasses: el.className.substring(0, 150),
      display: cs.display,
      height: cs.height,
      width: cs.width,
      position: cs.position,
      overflow: cs.overflow,
      imgFound: !!img,
      imgSrc: img ? img.src.substring(0, 80) : 'N/A',
      imgNaturalW: img ? img.naturalWidth : 0,
      imgNaturalH: img ? img.naturalHeight : 0,
      imgDisplay: imgCs ? imgCs.display : 'N/A',
      imgHeight: imgCs ? imgCs.height : 'N/A',
      imgWidth: imgCs ? imgCs.width : 'N/A',
      imgPosition: imgCs ? imgCs.position : 'N/A',
      imgObjectFit: imgCs ? imgCs.objectFit : 'N/A',
      imgOpacity: imgCs ? imgCs.opacity : 'N/A',
    };
  });
}, imageWidgets);
console.log('\n--- Image Widgets ---');
console.log(JSON.stringify(widgetDiag, null, 2));

// 3. Check hero section
const heroDiag = await page.evaluate(() => {
  const hero = document.querySelector('[data-id="ecf97c6e"]');
  if (!hero) return { found: false };
  const cs = getComputedStyle(hero);
  const before = getComputedStyle(hero, '::before');
  return {
    found: true,
    bg: cs.background.substring(0, 200),
    bgImage: cs.backgroundImage.substring(0, 200),
    bgColor: cs.backgroundColor,
    height: cs.height,
    position: cs.position,
    beforeBg: before.background ? before.background.substring(0, 200) : 'N/A',
    beforeContent: before.content,
    beforePosition: before.position,
  };
});
console.log('\n--- Hero Section ---');
console.log(JSON.stringify(heroDiag, null, 2));

// 4. Check the parent grid container
const gridDiag = await page.evaluate(() => {
  const grid = document.querySelector('[data-id="57d17676"]');
  if (!grid) return { found: false };
  const cs = getComputedStyle(grid);
  return {
    found: true,
    display: cs.display,
    flexWrap: cs.flexWrap,
    flexDirection: cs.flexDirection,
    gap: cs.gap,
    height: cs.height,
    width: cs.width,
    overflow: cs.overflow,
    childCount: grid.children.length
  };
});
console.log('\n--- Grid Container ---');
console.log(JSON.stringify(gridDiag, null, 2));

// 5. Screenshot just the categories section
const catSection = await page.$('[data-id="7ebc3f4b"]');
if (catSection) {
  await catSection.screenshot({ path: 'temp/categories_section.png' });
  console.log('📸 Categories section screenshot saved');
}

// 6. Check CSS file is loading
const cssLoaded = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  return links.filter(l => l.href.includes('evergreen')).map(l => ({
    href: l.href,
    loaded: l.sheet !== null
  }));
});
console.log('\n--- Custom CSS ---');
console.log(JSON.stringify(cssLoaded, null, 2));

// 7. Check ALL images on page
const allImages = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  return imgs.map(img => ({
    src: img.src.substring(0, 100),
    naturalW: img.naturalWidth,
    naturalH: img.naturalHeight,
    display: getComputedStyle(img).display,
    height: getComputedStyle(img).height,
    visible: img.offsetHeight > 0 && img.offsetWidth > 0,
    parentId: img.closest('[data-id]')?.getAttribute('data-id') || 'none'
  })).filter(i => i.src.includes('evergreen') || i.src.includes('led'));
});
console.log('\n--- All LED/Evergreen Images ---');
console.log(JSON.stringify(allImages, null, 2));

await browser.close();
console.log('\n✅ Diagnosis complete');
