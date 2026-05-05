/**
 * debug_cta_deep.mjs — Deep debug: check inline styles, all applied rules, and style tag presence
 */
import { chromium } from 'playwright';

const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('https://evergreenvzla.com/?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// 1. Check if our inline style tag exists in footer
const inlineStyle = await page.evaluate(() => {
  const tag = document.getElementById('evergreen-cta-override');
  return tag ? { found: true, content: tag.textContent.substring(0, 300) } : { found: false };
});
console.log('1. Inline style tag #evergreen-cta-override:', inlineStyle.found ? '✅ FOUND' : '❌ MISSING');
if (inlineStyle.found) console.log('   Content:', inlineStyle.content.substring(0, 200));

// 2. Check inline style attribute on the element
const inlineAttr = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return 'ELEMENT NOT FOUND';
  return el.getAttribute('style') || '(no inline style)';
});
console.log('\n2. Inline style attribute on [data-id="69a22305"]:');
console.log('   ', inlineAttr);

// 3. Check ALL classes on the element
const classes = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  return el ? el.className : 'NOT FOUND';
});
console.log('\n3. Classes:', classes);

// 4. Check parent chain for background overrides
const parentBgs = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return [];
  const results = [];
  let current = el;
  for (let i = 0; i < 5 && current; i++) {
    const cs = window.getComputedStyle(current);
    results.push({
      tag: current.tagName,
      dataId: current.dataset?.id || 'none',
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage?.substring(0, 80),
      inlineStyle: current.getAttribute('style')?.substring(0, 100) || 'none'
    });
    current = current.parentElement;
  }
  return results;
});
console.log('\n4. Parent chain backgrounds:');
parentBgs.forEach((p, i) => {
  console.log(`   ${i}: <${p.tag}> data-id=${p.dataId}`);
  console.log(`      bgColor: ${p.bgColor}`);
  console.log(`      bgImage: ${p.bgImage}`);
  console.log(`      inline: ${p.inlineStyle}`);
});

// 5. Use JS to check what CSS rules apply
const appliedRules = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return 'NOT FOUND';
  
  // Check all stylesheets for rules targeting this element
  const matching = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && (
          rule.selectorText.includes('69a22305') ||
          rule.selectorText.includes('e-con-boxed')
        )) {
          if (rule.style.backgroundImage || rule.style.background || rule.style.backgroundColor) {
            matching.push({
              selector: rule.selectorText.substring(0, 100),
              bgImage: rule.style.backgroundImage || 'unset',
              bg: rule.style.background || 'unset',
              bgColor: rule.style.backgroundColor || 'unset',
              href: sheet.href?.substring(sheet.href.lastIndexOf('/') + 1) || 'inline'
            });
          }
        }
      }
    } catch (e) { /* cross-origin */ }
  }
  return matching;
});
console.log('\n5. CSS rules targeting 69a22305 or e-con-boxed with bg properties:');
if (Array.isArray(appliedRules)) {
  appliedRules.forEach(r => {
    console.log(`   [${r.href}] ${r.selector}`);
    console.log(`     bg: ${r.bg} | bgImage: ${r.bgImage} | bgColor: ${r.bgColor}`);
  });
  if (appliedRules.length === 0) console.log('   (none found)');
} else {
  console.log('  ', appliedRules);
}

// 6. Manually test setting it via JS
const jsTest = await page.evaluate(() => {
  const el = document.querySelector('[data-id="69a22305"]');
  if (!el) return 'NOT FOUND';
  el.style.setProperty('background-image', 'linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%)', 'important');
  el.style.setProperty('background', 'linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%)', 'important');
  const cs = window.getComputedStyle(el);
  return { bgImage: cs.backgroundImage?.substring(0, 100), bgColor: cs.backgroundColor };
});
console.log('\n6. After JS force-set:');
console.log('   bgImage:', jsTest.bgImage);
console.log('   bgColor:', jsTest.bgColor);

await browser.close();
