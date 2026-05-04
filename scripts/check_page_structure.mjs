/**
 * check_page_structure.mjs — Get all top-level sections and their data-ids
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

await page.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Get ALL elements with data-id and their hierarchy
const structure = await page.evaluate(() => {
  function getTree(el, depth = 0) {
    if (depth > 3) return null;
    const dataId = el.getAttribute('data-id');
    const elType = el.getAttribute('data-element_type');
    if (!dataId) return null;
    
    const cs = getComputedStyle(el);
    const children = Array.from(el.children)
      .map(c => getTree(c, depth + 1))
      .filter(Boolean);
    
    // Get text content preview
    const widgets = el.querySelectorAll('.elementor-widget');
    const widgetTypes = Array.from(widgets).slice(0, 5).map(w => {
      const type = w.getAttribute('data-widget_type');
      const text = w.textContent.trim().substring(0, 40);
      return `${type}: "${text}"`;
    });
    
    return {
      dataId,
      elType,
      tag: el.tagName,
      bg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : undefined,
      bgImage: cs.backgroundImage !== 'none' ? cs.backgroundImage.substring(0,80) : undefined,
      height: cs.height,
      display: cs.display,
      visible: el.offsetHeight > 0,
      widgetCount: widgets.length,
      widgetPreview: widgetTypes.length > 0 ? widgetTypes : undefined,
      childSections: children.length > 0 ? children : undefined
    };
  }
  
  const root = document.querySelector('[data-elementor-type="wp-page"]');
  if (!root) return { error: 'no root found' };
  
  const topLevel = Array.from(root.children)
    .map(c => getTree(c, 0))
    .filter(Boolean);
  
  return { totalSections: topLevel.length, sections: topLevel };
});

console.log(JSON.stringify(structure, null, 2));

// Also check: does [data-id="a1cc0f1e"] exist ANYWHERE?
const vpExists = await page.evaluate(() => {
  const el = document.querySelector('[data-id="a1cc0f1e"]');
  return el ? { found: true, tag: el.tagName, visible: el.offsetHeight > 0 } : { found: false };
});
console.log('\n--- Value Props [a1cc0f1e] exists? ---');
console.log(JSON.stringify(vpExists));

// Check CTA [69a22305] inline styles
const ctaInline = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return { found: false };
  return {
    found: true,
    inlineStyle: el.getAttribute('style') || 'none',
    classList: el.className.substring(0, 200),
    computedBg: getComputedStyle(el).background.substring(0, 200),
    computedBgColor: getComputedStyle(el).backgroundColor,
    computedBgImage: getComputedStyle(el).backgroundImage.substring(0, 200)
  };
});
console.log('\n--- CTA [69a22305] inline styles ---');
console.log(JSON.stringify(ctaInline, null, 2));

// Check if Material Symbols font is working
const matSymbols = await page.evaluate(() => {
  const els = document.querySelectorAll('.material-symbols-outlined');
  return {
    count: els.length,
    samples: Array.from(els).slice(0, 5).map(e => ({
      text: e.textContent.trim(),
      parentId: e.closest('[data-id]')?.getAttribute('data-id') || 'none',
      visible: e.offsetHeight > 0,
      fontSize: getComputedStyle(e).fontSize,
      color: getComputedStyle(e).color
    }))
  };
});
console.log('\n--- Material Symbols ---');
console.log(JSON.stringify(matSymbols, null, 2));

await browser.close();
console.log('\n✅ Structure check complete');
