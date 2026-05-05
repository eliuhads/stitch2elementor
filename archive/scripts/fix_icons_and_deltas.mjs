/**
 * fix_icons_and_deltas.mjs — Fix Value Props icons + other visual deltas
 * 
 * STITCH DESIGN (ground truth):
 *   Value Props icons: sailing, verified, engineering (Material Symbols Outlined)
 *   Category icons: lightbulb, highlight, traffic, wall_lamp, filter_center_focus, factory
 *   CTA: diagonal SVG stripes pattern
 * 
 * CURRENT WP (wrong):
 *   Value Props icons: fa-user-secret, fa-check, fa-cogs (FontAwesome)
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('https://evergreenvzla.com/?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// 1. Get ALL icon widgets on the page with their IDs and current icon values
const iconWidgets = await page.evaluate(() => {
  const widgets = document.querySelectorAll('.elementor-widget-icon, .elementor-widget-icon-box');
  return [...widgets].map(w => {
    const dataId = w.dataset.id;
    const iconEl = w.querySelector('.elementor-icon i, .elementor-icon-box-icon i');
    const titleEl = w.querySelector('.elementor-icon-box-title, .elementor-icon-box-content h3');
    const svgEl = w.querySelector('.elementor-icon svg');
    return {
      dataId,
      widgetType: w.classList.contains('elementor-widget-icon-box') ? 'icon-box' : 'icon',
      iconClass: iconEl?.className || 'none',
      title: titleEl?.textContent?.trim() || 'none',
      hasSvg: !!svgEl,
      parentDataId: w.closest('[data-id]')?.dataset.id || 'none'
    };
  });
});

console.log('=== ICON WIDGETS ON PAGE ===');
iconWidgets.forEach(w => {
  console.log(`  [${w.dataId}] ${w.widgetType} | icon: ${w.iconClass} | title: "${w.title}" | parent: ${w.parentDataId}`);
});

// 2. Value Props section — find the 3 icon-box widgets
const vpSection = await page.evaluate(() => {
  const el = document.querySelector('[data-id="e5fe551b"]');
  if (!el) return { found: false };
  
  const iconBoxes = el.querySelectorAll('.elementor-widget-icon-box');
  return {
    found: true,
    iconBoxes: [...iconBoxes].map(ib => ({
      dataId: ib.dataset.id,
      iconClass: ib.querySelector('.elementor-icon i')?.className || 'no-i',
      iconHtml: ib.querySelector('.elementor-icon')?.innerHTML?.substring(0, 100) || 'empty',
      title: ib.querySelector('.elementor-icon-box-title')?.textContent?.trim() || 'untitled'
    }))
  };
});
console.log('\n=== VALUE PROPS ICONS ===');
if (vpSection.found) {
  vpSection.iconBoxes.forEach(ib => {
    console.log(`  [${ib.dataId}] "${ib.title}" → icon: ${ib.iconClass}`);
    console.log(`    html: ${ib.iconHtml}`);
  });
} else {
  console.log('  ❌ VP section not found');
}

// 3. Category cards — find icon widgets
const catSection = await page.evaluate(() => {
  const el = document.querySelector('[data-id="7ebc3f4b"]');
  if (!el) return { found: false };
  
  const iconWidgets = el.querySelectorAll('.elementor-widget-icon');
  const iconBoxes = el.querySelectorAll('.elementor-widget-icon-box');
  
  return {
    found: true,
    iconWidgets: [...iconWidgets].map(w => ({
      dataId: w.dataset.id,
      iconClass: w.querySelector('.elementor-icon i')?.className || 'no-i',
      parentId: w.closest('.e-con.e-child')?.dataset?.id
    })),
    iconBoxWidgets: [...iconBoxes].map(w => ({
      dataId: w.dataset.id,
      iconClass: w.querySelector('.elementor-icon i')?.className || 'no-i',
      title: w.querySelector('.elementor-icon-box-title')?.textContent?.trim() || ''
    }))
  };
});
console.log('\n=== CATEGORY ICONS ===');
if (catSection.found) {
  console.log('  Icon widgets:', catSection.iconWidgets.length);
  catSection.iconWidgets.forEach(w => console.log(`    [${w.dataId}] ${w.iconClass} parent:${w.parentId}`));
  console.log('  Icon-box widgets:', catSection.iconBoxWidgets.length);
  catSection.iconBoxWidgets.forEach(w => console.log(`    [${w.dataId}] "${w.title}" → ${w.iconClass}`));
}

// 4. Check for additional differences - spacing, divider width, etc
const vpDivider = await page.evaluate(() => {
  const vp = document.querySelector('[data-id="e5fe551b"]');
  if (!vp) return null;
  const divider = vp.querySelector('.elementor-divider-separator');
  if (!divider) return null;
  const cs = window.getComputedStyle(divider);
  return { width: cs.width, borderColor: cs.borderTopColor, height: cs.borderTopWidth };
});
console.log('\n=== VP DIVIDER ===');
console.log('  ', vpDivider);

// 5. Check section spacing
const sectionGaps = await page.evaluate(() => {
  const sections = [
    { name: 'Hero', sel: '[data-id="ecf97c6e"]' },
    { name: 'Categories', sel: '[data-id="7ebc3f4b"]' },
    { name: 'ValueProps', sel: '[data-id="e5fe551b"]' },
    { name: 'CTA', sel: '[data-id="69a22305"]' }
  ];
  return sections.map(s => {
    const el = document.querySelector(s.sel);
    if (!el) return { ...s, found: false };
    const cs = window.getComputedStyle(el);
    return {
      ...s,
      found: true,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom
    };
  });
});
console.log('\n=== SECTION SPACING ===');
sectionGaps.forEach(s => {
  if (s.found) console.log(`  ${s.name}: pad ${s.paddingTop}/${s.paddingBottom}, margin ${s.marginTop}/${s.marginBottom}`);
});

await browser.close();
