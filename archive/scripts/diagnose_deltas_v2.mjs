/**
 * diagnose_deltas_v2.mjs — Deep delta analysis: Stitch vs WP live
 * Checks every pending delta from memoria_estado.md
 */
import { chromium } from 'playwright';

const PLAYWRIGHT_WS = 'ws://192.168.1.252:3000/playwright';

const browser = await chromium.connect(PLAYWRIGHT_WS);
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

console.log('⏳ Loading homepage...');
await page.goto('https://evergreenvzla.com', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// ============ HERO SECTION ============
console.log('\n========== HERO SECTION ==========');
const hero = await page.evaluate(() => {
  const el = document.querySelector('[data-id="ecf97c6e"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  
  // H1
  const h1 = el.querySelector('h1');
  const h1cs = h1 ? getComputedStyle(h1) : null;
  
  // Label (IMPORTADORES DIRECTOS...)
  const texts = el.querySelectorAll('.elementor-widget-text-editor');
  const label = texts[0];
  const labelCs = label ? getComputedStyle(label.querySelector('.elementor-widget-container') || label) : null;
  
  // Subtitle
  const subtitle = texts[1];
  const subtitleCs = subtitle ? getComputedStyle(subtitle.querySelector('.elementor-widget-container') || subtitle) : null;
  
  // Buttons
  const buttons = el.querySelectorAll('.elementor-button');
  const btnData = Array.from(buttons).map(btn => {
    const bcs = getComputedStyle(btn);
    return {
      text: btn.textContent.trim().substring(0, 30),
      bg: bcs.backgroundImage !== 'none' ? bcs.backgroundImage.substring(0,100) : bcs.backgroundColor,
      color: bcs.color,
      borderRadius: bcs.borderRadius,
      padding: bcs.padding,
      fontFamily: bcs.fontFamily.substring(0, 40),
      fontSize: bcs.fontSize,
      letterSpacing: bcs.letterSpacing,
      border: bcs.border
    };
  });
  
  return {
    found: true,
    padding: cs.padding,
    h1: h1cs ? {
      fontFamily: h1cs.fontFamily.substring(0, 40),
      fontSize: h1cs.fontSize,
      fontWeight: h1cs.fontWeight,
      lineHeight: h1cs.lineHeight,
      letterSpacing: h1cs.letterSpacing,
      color: h1cs.color
    } : null,
    label: labelCs ? {
      fontFamily: labelCs.fontFamily.substring(0,40),
      fontSize: labelCs.fontSize,
      letterSpacing: labelCs.letterSpacing,
      color: labelCs.color,
      textTransform: labelCs.textTransform,
      text: label.textContent.trim().substring(0, 50)
    } : null,
    subtitle: subtitleCs ? {
      fontFamily: subtitleCs.fontFamily.substring(0,40),
      fontSize: subtitleCs.fontSize,
      lineHeight: subtitleCs.lineHeight,
      color: subtitleCs.color
    } : null,
    buttons: btnData
  };
});
console.log(JSON.stringify(hero, null, 2));

// ============ STATS BAR ============
console.log('\n========== STATS BAR ==========');
const stats = await page.evaluate(() => {
  const bar = document.querySelector('[data-id="2e6165fc"]');
  if (!bar) return { found: false };
  const cs = getComputedStyle(bar);
  
  // Get all stat numbers and labels
  const numbers = bar.querySelectorAll('.elementor-widget-text-editor');
  const statItems = [];
  for (let i = 0; i < numbers.length; i += 2) {
    const num = numbers[i];
    const lbl = numbers[i + 1];
    if (num && lbl) {
      const ncs = getComputedStyle(num.querySelector('p') || num);
      const lcs = getComputedStyle(lbl.querySelector('p') || lbl);
      statItems.push({
        number: num.textContent.trim(),
        numColor: ncs.color,
        numFontSize: ncs.fontSize,
        numFontWeight: ncs.fontWeight,
        label: lbl.textContent.trim(),
        lblColor: lcs.color,
        lblFontSize: lcs.fontSize,
        lblLetterSpacing: lcs.letterSpacing
      });
    }
  }
  
  return {
    found: true,
    bg: cs.backgroundColor,
    border: cs.border,
    borderRadius: cs.borderRadius,
    padding: cs.padding,
    stats: statItems
  };
});
console.log(JSON.stringify(stats, null, 2));

// ============ CATEGORY CARDS (TEXT POSITIONING) ============
console.log('\n========== CATEGORY CARDS TEXT ==========');
const catText = await page.evaluate(() => {
  const cards = ['7dce1679', 'c2f4bf3b', 'f506a881'];
  return cards.map(id => {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return { id, found: false };
    
    // Check text widgets positioning
    const heading = card.querySelector('.elementor-widget-heading');
    const textWidget = card.querySelector('.elementor-widget-text-editor');
    const hcs = heading ? getComputedStyle(heading) : null;
    const tcs = textWidget ? getComputedStyle(textWidget) : null;
    
    return {
      id,
      found: true,
      headingText: heading ? heading.textContent.trim() : 'N/A',
      headingPosition: hcs ? hcs.position : 'N/A',
      headingZIndex: hcs ? hcs.zIndex : 'N/A',
      headingBottom: hcs ? hcs.bottom : 'N/A',
      headingColor: hcs ? getComputedStyle(heading.querySelector('.elementor-heading-title') || heading).color : 'N/A',
      labelText: textWidget ? textWidget.textContent.trim() : 'N/A',
      labelPosition: tcs ? tcs.position : 'N/A',
      labelZIndex: tcs ? tcs.zIndex : 'N/A',
      labelColor: tcs ? tcs.color : 'N/A',
      labelFontSize: tcs ? tcs.fontSize : 'N/A'
    };
  });
});
console.log(JSON.stringify(catText, null, 2));

// ============ ICON CARDS (6 text-only) ============
console.log('\n========== ICON CARDS ==========');
const iconCards = await page.evaluate(() => {
  const grid = document.querySelector('[data-id="57d17676"]');
  if (!grid) return { found: false };
  const children = Array.from(grid.children);
  // Icon cards are children 4-9 (0-indexed: 3-8)
  return children.slice(3).map((card, i) => {
    const cs = getComputedStyle(card);
    const heading = card.querySelector('.elementor-heading-title');
    const icon = card.querySelector('.material-symbols-outlined');
    const badge = card.querySelectorAll('.elementor-widget-text-editor');
    
    return {
      index: i + 4,
      dataId: card.getAttribute('data-id'),
      bg: cs.backgroundColor,
      border: cs.border,
      borderRadius: cs.borderRadius,
      padding: cs.padding,
      headingText: heading ? heading.textContent.trim() : 'N/A',
      headingFont: heading ? getComputedStyle(heading).fontFamily.substring(0,30) : 'N/A',
      iconFound: !!icon,
      iconText: icon ? icon.textContent.trim() : 'N/A',
      iconColor: icon ? getComputedStyle(icon).color : 'N/A',
      iconFontSize: icon ? getComputedStyle(icon).fontSize : 'N/A',
      badgeCount: badge.length,
      badgeText: badge.length > 0 ? badge[badge.length-1].textContent.trim() : 'N/A'
    };
  });
});
console.log(JSON.stringify(iconCards, null, 2));

// ============ VALUE PROPS ============
console.log('\n========== VALUE PROPS ==========');
const valueProps = await page.evaluate(() => {
  const section = document.querySelector('[data-id="a1cc0f1e"]');
  if (!section) return { found: false };
  const cs = getComputedStyle(section);
  
  // Divider
  const divider = document.querySelector('[data-id="16b62408"]');
  const divSep = divider ? divider.querySelector('.elementor-divider-separator') : null;
  const divCs = divSep ? getComputedStyle(divSep) : null;
  
  // Value prop containers
  const props = ['29302187', '44db5797', '7e4cf3f7'];
  const propData = props.map(id => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return { id, found: false };
    
    // Icon circle (first text-editor widget)
    const iconWidget = el.querySelector('.elementor-widget-text-editor');
    const icon = iconWidget ? iconWidget.querySelector('.material-symbols-outlined') : null;
    
    // H3 title
    const h3 = el.querySelector('.elementor-heading-title');
    const h3cs = h3 ? getComputedStyle(h3) : null;
    
    return {
      id,
      found: true,
      h3Text: h3 ? h3.textContent.trim() : 'N/A',
      h3FontFamily: h3cs ? h3cs.fontFamily.substring(0,30) : 'N/A',
      h3FontSize: h3cs ? h3cs.fontSize : 'N/A',
      h3FontWeight: h3cs ? h3cs.fontWeight : 'N/A',
      h3TextAlign: h3cs ? h3cs.textAlign : 'N/A',
      h3Color: h3cs ? h3cs.color : 'N/A',
      iconFound: !!icon,
      iconText: icon ? icon.textContent.trim() : 'N/A',
      iconColor: icon ? getComputedStyle(icon).color : 'N/A'
    };
  });
  
  return {
    found: true,
    bg: cs.backgroundColor,
    dividerWidth: divCs ? divCs.width : 'N/A',
    dividerColor: divCs ? divCs.borderTopColor : 'N/A',
    dividerThickness: divCs ? divCs.borderTopWidth : 'N/A',
    props: propData
  };
});
console.log(JSON.stringify(valueProps, null, 2));

// ============ CTA SECTION ============
console.log('\n========== CTA SECTION ==========');
const cta = await page.evaluate(() => {
  const section = document.querySelector('[data-id="69a22305"]');
  if (!section) return { found: false };
  const cs = getComputedStyle(section);
  
  // H2
  const h2 = section.querySelector('.elementor-heading-title');
  const h2cs = h2 ? getComputedStyle(h2) : null;
  
  // Buttons
  const buttons = section.querySelectorAll('.elementor-button');
  const btnData = Array.from(buttons).map(btn => {
    const bcs = getComputedStyle(btn);
    return {
      text: btn.textContent.trim().substring(0, 30),
      bg: bcs.backgroundColor,
      color: bcs.color,
      borderRadius: bcs.borderRadius,
      padding: bcs.padding,
      fontFamily: bcs.fontFamily.substring(0,30),
      fontSize: bcs.fontSize
    };
  });
  
  // Phone number (text-editor with phone)
  const texts = section.querySelectorAll('.elementor-widget-text-editor');
  const phoneData = Array.from(texts).map(t => ({
    text: t.textContent.trim().substring(0, 50),
    color: getComputedStyle(t.querySelector('.elementor-widget-container') || t).color,
    fontSize: getComputedStyle(t.querySelector('.elementor-widget-container') || t).fontSize
  }));
  
  return {
    found: true,
    bgImage: cs.backgroundImage.substring(0, 100),
    bgColor: cs.backgroundColor,
    borderRadius: cs.borderRadius,
    padding: cs.padding,
    h2: h2cs ? {
      text: h2.textContent.trim().substring(0, 60),
      fontSize: h2cs.fontSize,
      fontWeight: h2cs.fontWeight,
      color: h2cs.color,
      lineHeight: h2cs.lineHeight
    } : null,
    buttons: btnData,
    textWidgets: phoneData
  };
});
console.log(JSON.stringify(cta, null, 2));

// ============ HEADER NAV ============
console.log('\n========== HEADER NAV ==========');
const nav = await page.evaluate(() => {
  const header = document.querySelector('.elementor-location-header');
  if (!header) return { found: false };
  
  const section = header.querySelector('.elementor-section, .e-con');
  const scs = section ? getComputedStyle(section) : null;
  
  const navLinks = header.querySelectorAll('.elementor-nav-menu a');
  const links = Array.from(navLinks).map(a => ({
    text: a.textContent.trim(),
    color: getComputedStyle(a).color,
    fontFamily: getComputedStyle(a).fontFamily.substring(0,30)
  }));
  
  return {
    found: true,
    bgColor: scs ? scs.backgroundColor : 'N/A',
    backdropFilter: scs ? scs.backdropFilter : 'N/A',
    borderBottom: scs ? scs.borderBottom : 'N/A',
    links
  };
});
console.log(JSON.stringify(nav, null, 2));

// ============ FOOTER ============
console.log('\n========== FOOTER ==========');
const footer = await page.evaluate(() => {
  const ft = document.querySelector('.elementor-location-footer');
  if (!ft) return { found: false };
  
  const section = ft.querySelector('.e-con');
  const fcs = section ? getComputedStyle(section) : null;
  
  const h4s = ft.querySelectorAll('h4.elementor-heading-title');
  const headings = Array.from(h4s).map(h => ({
    text: h.textContent.trim(),
    color: getComputedStyle(h).color,
    fontFamily: getComputedStyle(h).fontFamily.substring(0,30),
    fontSize: getComputedStyle(h).fontSize,
    fontWeight: getComputedStyle(h).fontWeight,
    textTransform: getComputedStyle(h).textTransform
  }));
  
  return {
    found: true,
    bg: fcs ? fcs.backgroundColor : 'N/A',
    borderTop: fcs ? fcs.borderTop : 'N/A',
    fontFamily: fcs ? fcs.fontFamily.substring(0,30) : 'N/A',
    headings
  };
});
console.log(JSON.stringify(footer, null, 2));

// ============ SCREENSHOTS ============
// Full page
await page.screenshot({ path: 'temp/delta_full_page.png', fullPage: true });
console.log('\n📸 Full page screenshot saved');

// Hero only
const heroEl = await page.$('[data-id="ecf97c6e"]');
if (heroEl) {
  await heroEl.screenshot({ path: 'temp/delta_hero.png' });
  console.log('📸 Hero screenshot saved');
}

// Categories
const catEl = await page.$('[data-id="7ebc3f4b"]');
if (catEl) {
  await catEl.screenshot({ path: 'temp/delta_categories.png' });
  console.log('📸 Categories screenshot saved');
}

// Value props
const vpEl = await page.$('[data-id="a1cc0f1e"]');
if (vpEl) {
  await vpEl.screenshot({ path: 'temp/delta_value_props.png' });
  console.log('📸 Value props screenshot saved');
}

// CTA
const ctaEl = await page.$('[data-id="69a22305"]');
if (ctaEl) {
  await ctaEl.screenshot({ path: 'temp/delta_cta.png' });
  console.log('📸 CTA screenshot saved');
}

await browser.close();
console.log('\n✅ Delta diagnosis v2 complete');
