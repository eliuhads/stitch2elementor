/**
 * build_homepage_css.mjs — Generate homepage-specific CSS targeting
 * current Elementor element IDs from the compiled JSON.
 * 
 * Reads elementor_jsons/homepage.json to get element IDs,
 * then generates CSS that applies Stitch v3 Light Theme styling
 * to each specific element.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const homepage = JSON.parse(fs.readFileSync(path.join(ROOT, 'elementor_jsons/homepage.json'), 'utf8'));

// Scan all elements in the homepage JSON recursively
const flatElements = [];
function flatten(arr) {
  for (const el of arr) {
    flatElements.push(el);
    if (el.elements?.length) {
      flatten(el.elements);
    }
  }
}
flatten(homepage);

const rootId = homepage[0].id;

// Find container elements
const containers = flatElements.filter(el => el.elType === 'container');
const heroSection = containers.find(c => c.elements?.some(child => child.widgetType === 'heading' || (child.elType === 'container' && child.elements?.some(sub => sub.widgetType === 'heading'))));
const heroId = heroSection?.id || containers[0]?.id;

// Find headings
const headings = flatElements.filter(el => el.widgetType === 'heading');
const headingId = headings[0]?.id;

// Find buttons
const allButtons = flatElements.filter(el => el.widgetType === 'button');
const primaryBtnId = allButtons[0]?.id;
const outlineBtnId = allButtons[1]?.id;

// Find images
const allImages = flatElements.filter(el => el.widgetType === 'image');
const imageId = allImages[0]?.id;

// Find text editors (Badge, Subtitle1, Subtitle2)
const textEditors = flatElements.filter(el => el.widgetType === 'text-editor');

// Semantic search in text editors
let badgeId, subtitle1Id, subtitle2Id;
for (const te of textEditors) {
  const html = te.settings?.editor || '';
  if (html.includes('Caracas') || html.includes('Stock') || html.includes('Fábrica') || html.includes('Venezuela')) {
    if (!badgeId) badgeId = te.id;
  } else if (html.includes('Especificaciones') || html.includes('Garantía')) {
    if (!subtitle1Id) subtitle1Id = te.id;
  } else if (html.includes('importador') || html.includes('Evergreen es') || html.includes('ferreterías')) {
    if (!subtitle2Id) subtitle2Id = te.id;
  }
}

// Fallbacks if semantic search didn't find all
if (!badgeId) badgeId = textEditors[0]?.id;
if (!subtitle1Id) subtitle1Id = textEditors[1]?.id;
if (!subtitle2Id) subtitle2Id = textEditors[2]?.id;

// Trust bar is the container that comes after the hero container
const trustBarId = containers[2]?.id || containers[1]?.id;

console.log('📍 Element Mapping:');
console.log(`  Root:         ${rootId}`);
console.log(`  Hero:         ${heroId}`);
console.log(`  Badge:        ${badgeId}`);
console.log(`  Heading:      ${headingId}`);
console.log(`  Subtitle1:    ${subtitle1Id}`);
console.log(`  Subtitle2:    ${subtitle2Id}`);
console.log(`  Primary CTA:  ${primaryBtnId}`);
console.log(`  Outline CTA:  ${outlineBtnId}`);
console.log(`  Hero Image:   ${imageId}`);
console.log(`  Trust Bar:    ${trustBarId}`);

const css = `/* ========================================================
   EVERGREEN VENEZUELA — HOMEPAGE PREMIUM CSS (INDUSTRIAL GIANT)
   Auto-generated from elementor_jsons/homepage.json
   Element IDs: ${new Date().toISOString()}
   ======================================================== */

/* ========================================
   1. GLOBAL OVERRIDES FOR SPECIFICITY (Anti-Theme Clashing)
   ======================================== */
body.elementor-page-160 {
  background-color: #0E1320 !important; /* Titanium Dark default */
  color: #dee2f5 !important;
}

/* Elementor-to-Tailwind layout bridge overrides */
body.elementor-page-160 .e-con-inner {
  padding: 0 !important;
  max-width: none !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

body.elementor-page-160 .elementor-widget-container {
  height: auto !important;
  width: 100% !important;
}

body.elementor-page-160 .absolute {
  position: absolute !important;
}

body.elementor-page-160 .inset-0 {
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
}

body.elementor-page-160 .object-cover {
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
}

body.elementor-page-160 .w-full {
  width: 100% !important;
}

body.elementor-page-160 .h-full {
  height: 100% !important;
}

body.elementor-page-160 .h-screen {
  height: 100vh !important;
}

body.elementor-page-160 .grid {
  display: grid !important;
}

body.elementor-page-160 .flex {
  display: flex !important;
}

/* Force Tailwind text colors to override Elementor defaults */
body.elementor-page-160 .text-white,
body.elementor-page-160 h1.text-white,
body.elementor-page-160 h2.text-white,
body.elementor-page-160 h3.text-white,
body.elementor-page-160 p.text-white {
  color: #ffffff !important;
}

body.elementor-page-160 .text-primary {
  color: #1D8A43 !important;
}

body.elementor-page-160 .text-light-slate,
body.elementor-page-160 p.text-light-slate {
  color: #94A3B8 !important;
}

body.elementor-page-160 .bg-black {
  background-color: #000000 !important;
}

body.elementor-page-160 .bg-titanium-dark {
  background-color: #0E1320 !important;
}

/* ========================================
   2. HERO SECTION — Cinematic Dark Design
   ======================================== */

/* Root container */
body.elementor-page .elementor-element-${rootId} {
  background-color: #000000 !important;
  position: relative !important;
  z-index: 1 !important;
  overflow: hidden !important;
}

/* Hero wrapper */
body.elementor-page .elementor-element-${heroId} {
  max-width: 1140px !important;
  margin: 0 auto !important;
  min-height: 100vh !important;
  display: flex !important;
  align-items: center !important;
}

/* Hero H1 — "Lámparas LED y Soluciones de Iluminación Directo de Fábrica" */
body.elementor-page .elementor-element-${headingId} .elementor-heading-title {
  font-family: 'Montserrat', sans-serif !important;
  font-size: 64px !important;
  font-weight: 900 !important;
  line-height: 1.1 !important;
  letter-spacing: -0.04em !important;
  color: #ffffff !important;
  text-transform: none !important;
}
@media (max-width: 767px) {
  body.elementor-page .elementor-element-${headingId} .elementor-heading-title {
    font-size: 40px !important;
  }
}

/* Subtitle 1 — "Especificaciones reales. Garantía escrita local." */
body.elementor-page .elementor-element-${subtitle1Id} .elementor-widget-container p {
  font-family: 'Montserrat', sans-serif !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  color: #ffffff !important;
}

/* Subtitle 2 — body text */
body.elementor-page .elementor-element-${subtitle2Id} .elementor-widget-container p {
  font-family: 'Work Sans', sans-serif !important;
  font-size: 16px !important;
  font-weight: 300 !important;
  line-height: 1.6 !important;
  color: #94A3B8 !important;
  max-width: 600px !important;
}

/* ========================================
   3. HERO BUTTONS
   ======================================== */

/* Primary CTA — "Ver Catálogo LED" (Skewed green button) */
body.elementor-page .elementor-element-${primaryBtnId} .elementor-button {
  background-color: #1D8A43 !important;
  color: #FFFFFF !important;
  font-family: 'Montserrat', sans-serif !important;
  font-weight: 900 !important;
  font-size: 14px !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  border-radius: 0px !important; /* Skewed look */
  padding: 20px 40px !important;
  transition: all 0.3s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 12px !important;
}
body.elementor-page .elementor-element-${primaryBtnId} .elementor-button:hover {
  background-color: #27A352 !important;
  box-shadow: 0 0 30px rgba(29, 138, 67, 0.6) !important;
}

/* Outline CTA — "Cotizar por WhatsApp" */
body.elementor-page .elementor-element-${outlineBtnId} .elementor-button {
  background-color: transparent !important;
  border: 2px solid #FFFFFF !important;
  color: #FFFFFF !important;
  font-family: 'Montserrat', sans-serif !important;
  font-weight: 900 !important;
  font-size: 14px !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  border-radius: 0px !important;
  padding: 20px 40px !important;
  transition: all 0.3s ease !important;
}
body.elementor-page .elementor-element-${outlineBtnId} .elementor-button:hover {
  background-color: #FFFFFF !important;
  color: #0E1320 !important;
}

/* ========================================
   4. TECHNICAL GRID & ORBS
   ======================================== */
.tech-grid-line {
  background: linear-gradient(90deg, rgba(29, 138, 67, 0) 0%, rgba(29, 138, 67, 0.5) 50%, rgba(29, 138, 67, 0) 100%) !important;
}
.glass-panel {
  background: rgba(14, 19, 32, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Pulse animation for active states */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* Smooth scroll */
html {
  scroll-behavior: smooth !important;
}
`;

const outPath = path.join(ROOT, 'temp', 'evergreen-homepage-custom.css');
fs.writeFileSync(outPath, css, 'utf8');
console.log(`\n   Generated: temp/evergreen-homepage-custom.css (${css.length} bytes)`);
