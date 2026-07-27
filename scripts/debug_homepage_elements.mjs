/**
 * scripts/debug_homepage_elements.mjs
 * Connects to Playwright and inspects the live DOM structure of the dark stripe section.
 */

import { chromium } from 'playwright';

try {
  console.log('🔗 Connecting to Playwright...');
  const browser = await chromium.connect('ws://192.168.1.252:3000/playwright');
  const page = await browser.newPage();
  
  console.log('🚀 Loading homepage...');
  await page.goto('https://evergreenvzla.com/?nocache=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('🔍 Auditing DOM elements of the dark intermediate section:');
  
  const report = await page.evaluate(() => {
    // Find the main dark stripe container
    const stripe = document.querySelector('.evergreen-dark-stripe');
    if (!stripe) {
      return { error: 'No element with class .evergreen-dark-stripe found!' };
    }
    
    const stripeStyle = getComputedStyle(stripe);
    const stripeInfo = {
      id: stripe.getAttribute('data-id'),
      classList: Array.from(stripe.classList),
      bgColor: stripeStyle.backgroundColor,
      padding: stripeStyle.padding,
      display: stripeStyle.display,
      flexDirection: stripeStyle.flexDirection
    };

    // Find all texts inside the stripe and get their computed colors, font-sizes, and font-families
    const texts = [];
    const walkText = (node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const parent = node.parentElement;
        const style = getComputedStyle(parent);
        texts.push({
          parentTag: parent.tagName,
          parentId: parent.getAttribute('data-id') || parent.parentElement?.getAttribute('data-id') || '',
          parentClasses: Array.from(parent.classList),
          text: node.textContent.trim(),
          color: style.color,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily
        });
      } else {
        for (let child of node.childNodes) {
          walkText(child);
        }
      }
    };
    walkText(stripe);

    // Find the icon containers
    // The icon containers are the parent elements of the material-symbols-outlined spans
    const icons = Array.from(stripe.querySelectorAll('.material-symbols-outlined'));
    const iconContainers = icons.map(icon => {
      const container = icon.closest('.elementor-element') || icon.parentElement;
      const cStyle = getComputedStyle(container);
      const parentRow = container.parentElement;
      const pStyle = getComputedStyle(parentRow);
      return {
        iconText: icon.textContent.trim(),
        containerTag: container.tagName,
        containerId: container.getAttribute('data-id'),
        containerClasses: Array.from(container.classList),
        computedWidth: cStyle.width,
        computedHeight: cStyle.height,
        computedDisplay: cStyle.display,
        computedFlexShrink: cStyle.flexShrink,
        computedFlexGrow: cStyle.flexGrow,
        parentRowId: parentRow.getAttribute('data-id'),
        parentRowClasses: Array.from(parentRow.classList),
        parentRowDisplay: pStyle.display,
        parentRowFlexDirection: pStyle.flexDirection
      };
    });

    return {
      stripeInfo,
      texts,
      iconContainers
    };
  });
  
  console.log('\n📊 DEEP INSIGHTS REPORT:');
  console.log(JSON.stringify(report, null, 2));
  
  await browser.close();
} catch (err) {
  console.error('❌ Error:', err.message);
}

