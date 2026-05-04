import { chromium } from 'playwright';

const b = await chromium.connect('ws://192.168.1.252:3000/playwright');
const p = await b.newPage();
await p.setViewportSize({ width: 1920, height: 1080 });
await p.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);

// Check image widgets
const results = await p.evaluate(() => {
  const widgets = document.querySelectorAll('[data-id="02453e5a"], [data-id="3ca2b9d3"], [data-id="d5c192f5"]');
  return Array.from(widgets).map(w => {
    const img = w.querySelector('img');
    const cs = getComputedStyle(w);
    return {
      dataId: w.getAttribute('data-id'),
      innerHTML: w.innerHTML.substring(0, 300),
      display: cs.display,
      visibility: cs.visibility,
      height: cs.height,
      width: cs.width,
      overflow: cs.overflow,
      imgSrc: img ? img.src : 'NO_IMG',
      imgNaturalWidth: img ? img.naturalWidth : 0,
      imgDisplay: img ? getComputedStyle(img).display : 'N/A',
      imgHeight: img ? getComputedStyle(img).height : 'N/A'
    };
  });
});

console.log(JSON.stringify(results, null, 2));

// Also check parent containers
const parents = await p.evaluate(() => {
  const widget = document.querySelector('[data-id="02453e5a"]');
  if (!widget) return 'Widget not found';
  let el = widget;
  const chain = [];
  for (let i = 0; i < 5 && el; i++) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName,
      id: el.id,
      dataId: el.getAttribute('data-id'),
      classes: el.className.substring(0, 100),
      display: cs.display,
      height: cs.height,
      overflow: cs.overflow,
      maxHeight: cs.maxHeight
    });
    el = el.parentElement;
  }
  return chain;
});

console.log('\n--- Parent chain ---');
console.log(JSON.stringify(parents, null, 2));

await b.close();
