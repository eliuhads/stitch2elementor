/**
 * ============================================================
 * COMPILER V4 — HTML to Native Elementor JSON
 * Evergreen Venezuela — Nativización Perfecta
 * ============================================================
 * 
 * FIXES over V3:
 *   - flex_gap (not gap), flex_align_items (not align_items),
 *     flex_justify_content (not justify_content)
 *   - _margin for widgets (not margin)
 *   - align for headings (not text_align)
 *   - content_width on ALL containers
 *   - Full responsive settings (_tablet, _mobile)
 *   - flex_gap full format {unit,size,sizes,column,row,isLinked}
 *   - Font Awesome CDN with SRI
 *   - Material Symbols text stripped ("arrow_forward" → "→")
 *   - Aggressive tree pruning
 *   - Proper string types for dimension values
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const crypto = require('crypto');

// ============================================================
// CONFIG — BrandBook V8 Source of Truth
// ============================================================
const CONFIG = {
  inputDir: path.join(__dirname, 'stitch_html'),
  outputDir: path.join(__dirname, 'elementor_json'),
  manifestPath: path.join(__dirname, 'page_manifest.json'),
  colors: {
    background: '#0e1320',
    paper: '#F7F5EF',
    primary: '#84da7e',
    primaryDark: '#368A39',
    secondary: '#60d4ff',
    secondaryContainer: '#00a8d4',
    tertiary: '#90db3f',
    onSurface: '#dee2f5',
    onSurfaceVariant: '#bfcab9',
    surfaceContainerLowest: '#090e1b',
    surfaceContainerLow: '#161b29',
    surfaceContainer: '#1a1f2d',
    surfaceContainerHigh: '#252a38',
    surfaceContainerHighest: '#303443',
    white: '#FFFFFF',
    textDark: '#0e1320',
    textMuted: '#4D4D4D',
    outlineVariant: '#40493d',
  },
  fonts: {
    headline: 'Space Grotesk',
    body: 'Inter',
    label: 'Space Grotesk',
    cta: 'Montserrat',
    secondary: 'Lato',
  },
  // Typography scale per heading level
  typoScale: {
    h1: { desktop: 48, tablet: 36, mobile: 28, weight: '900' },
    h2: { desktop: 36, tablet: 30, mobile: 24, weight: '900' },
    h3: { desktop: 24, tablet: 20, mobile: 18, weight: '700' },
    h4: { desktop: 20, tablet: 18, mobile: 16, weight: '700' },
    h5: { desktop: 16, tablet: 15, mobile: 14, weight: '600' },
    h6: { desktop: 14, tablet: 13, mobile: 12, weight: '600' },
  }
};

if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/** Generate unique 8-char hex ID */
function genId() {
  return crypto.randomBytes(4).toString('hex');
}

/** Parse inline style string → object */
function parseInlineStyles(styleStr) {
  if (!styleStr) return {};
  const result = {};
  styleStr.split(';').forEach(pair => {
    const [key, ...valParts] = pair.split(':');
    if (key && valParts.length) {
      result[key.trim()] = valParts.join(':').trim();
    }
  });
  return result;
}

/** Parse a CSS value like "12px" → { size: 12, unit: "px" } */
function parseCSSValue(val) {
  if (!val) return null;
  const match = val.toString().match(/^(-?\d*\.?\d+)(px|em|rem|%|vw|vh)?$/);
  if (match) {
    return { size: parseFloat(match[1]), unit: match[2] || 'px' };
  }
  return null;
}

/** Build Elementor dimension object from a CSS shorthand */
function parseDimensionShorthand(val, defaultUnit = 'px') {
  if (!val) return null;
  const parts = val.trim().split(/\s+/).map(v => parseCSSValue(v)).filter(Boolean);
  if (parts.length === 0) return null;
  
  let top, right, bottom, left;
  const unit = parts[0].unit || defaultUnit;
  
  if (parts.length === 1) {
    top = right = bottom = left = String(parts[0].size);
  } else if (parts.length === 2) {
    top = bottom = String(parts[0].size);
    right = left = String(parts[1].size);
  } else if (parts.length === 3) {
    top = String(parts[0].size);
    right = left = String(parts[1].size);
    bottom = String(parts[2].size);
  } else {
    top = String(parts[0].size);
    right = String(parts[1].size);
    bottom = String(parts[2].size);
    left = String(parts[3].size);
  }

  const isLinked = (top === right && right === bottom && bottom === left);
  return { unit, top, right, bottom, left, isLinked: isLinked ? true : false };
}

/** Build proper Elementor flex_gap object */
function buildFlexGap(sizePx) {
  const s = String(sizePx);
  return {
    unit: 'px',
    size: s,
    sizes: [],
    column: s,
    row: s,
    isLinked: '1'
  };
}

/** Build proper Elementor dimension from explicit values */
function buildDimension(top, right, bottom, left, unit = 'px') {
  const t = String(top), r = String(right), b = String(bottom), l = String(left);
  return {
    unit,
    top: t,
    right: r,
    bottom: b,
    left: l,
    isLinked: (t === r && r === b && b === l) ? true : false
  };
}

/** Sanitize heading text — strip ALL HTML tags */
function sanitizeHeadingText(html) {
  if (!html) return '';
  // Remove Material Symbols spans
  let clean = html.replace(/<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[^<]*<\/span>/gi, '');
  // Strip all remaining HTML
  clean = clean.replace(/<[^>]*>/g, '').trim();
  // Replace leftover Material Symbol text
  clean = clean.replace(/\b(arrow_forward|arrow_back|chevron_right|check_circle|check|star|close)\b/g, '→');
  // Collapse multiple arrows
  clean = clean.replace(/→\s*→/g, '→');
  return clean.trim();
}

/** XSS Sanitization — strip dangerous content */
function sanitizeForHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '');
}

// ============================================================
// TAILWIND CLASS MAPS
// ============================================================
const TW_COLORS = {
  'text-white': '#FFFFFF',
  'text-black': '#000000',
  'text-primary': CONFIG.colors.primary,
  'text-tertiary': CONFIG.colors.tertiary,
  'text-background': CONFIG.colors.background,
  'text-on-surface': CONFIG.colors.onSurface,
  'text-on-surface-variant': CONFIG.colors.onSurfaceVariant,
  'text-on-background': CONFIG.colors.onSurface,
  'bg-background': CONFIG.colors.background,
  'bg-primary': CONFIG.colors.primary,
  'bg-surface': CONFIG.colors.background,
  'bg-surface-container-lowest': CONFIG.colors.surfaceContainerLowest,
  'bg-surface-container-low': CONFIG.colors.surfaceContainerLow,
  'bg-surface-container': CONFIG.colors.surfaceContainer,
  'bg-surface-container-high': CONFIG.colors.surfaceContainerHigh,
  'bg-surface-container-highest': CONFIG.colors.surfaceContainerHighest,
  'bg-white': '#FFFFFF',
  'bg-primary-container': CONFIG.colors.primaryDark,
  'border-primary': CONFIG.colors.primary,
  'border-outline-variant': CONFIG.colors.outlineVariant,
};

const TW_FONT_SIZE = {
  'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18,
  'text-xl': 20, 'text-2xl': 24, 'text-3xl': 30, 'text-4xl': 36,
  'text-5xl': 48, 'text-6xl': 60, 'text-7xl': 72, 'text-8xl': 96,
};

const TW_FONT_WEIGHT = {
  'font-thin': '100', 'font-extralight': '200', 'font-light': '300',
  'font-normal': '400', 'font-medium': '500', 'font-semibold': '600',
  'font-bold': '700', 'font-extrabold': '800', 'font-black': '900',
};

const TW_FONT_FAMILY = {
  'font-headline': CONFIG.fonts.headline,
  'font-body': CONFIG.fonts.body,
  'font-label': CONFIG.fonts.label,
};

// ============================================================
// ELEMENT BUILDERS — Correct Elementor Settings Keys
// ============================================================

/** Font/CSS loader — first element on every page */
function buildFontLoader() {
  return {
    id: genId(),
    elType: 'container',
    isInner: false,
    settings: {
      content_width: 'full',
      padding: buildDimension(0, 0, 0, 0),
      _margin: buildDimension(0, 0, 0, 0),
    },
    elements: [{
      id: genId(),
      elType: 'widget',
      widgetType: 'html',
      isInner: false,
      settings: {
        html: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"><style>html{scroll-behavior:smooth;}.text-glow{text-shadow:0 0 15px rgba(132,218,126,0.4);}</style>'
      },
      elements: []
    }]
  };
}

/** Build a container with CORRECT Elementor keys */
function buildContainer(settings = {}, elements = [], isInner = true) {
  const s = { ...settings };
  // Ensure content_width is always set
  if (!s.content_width) s.content_width = 'full';
  
  return {
    id: genId(),
    elType: 'container',
    isInner: isInner,
    settings: s,
    elements: elements.filter(Boolean)
  };
}

/** Build a heading widget — uses `align` not `text_align` */
function buildHeading(text, level = 'h2', extraSettings = {}) {
  const cleanText = sanitizeHeadingText(text);
  if (!cleanText) return null;
  
  const scale = CONFIG.typoScale[level] || CONFIG.typoScale.h2;
  
  const settings = {
    title: cleanText,
    header_size: level,
    typography_typography: 'custom',
    typography_font_family: CONFIG.fonts.headline,
    typography_font_size: { unit: 'px', size: scale.desktop, sizes: [] },
    typography_font_size_tablet: { unit: 'px', size: scale.tablet, sizes: [] },
    typography_font_size_mobile: { unit: 'px', size: scale.mobile, sizes: [] },
    typography_font_weight: scale.weight,
    ...extraSettings
  };
  
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'heading',
    isInner: false,
    settings,
    elements: []
  };
}

/** Build a text-editor widget — uses `_margin` not `margin` */
function buildTextEditor(html, extraSettings = {}) {
  if (!html || !html.trim()) return null;
  
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'text-editor',
    isInner: false,
    settings: {
      editor: sanitizeForHTML(html.trim()),
      ...extraSettings
    },
    elements: []
  };
}

/** Build a button widget */
function buildButton(text, link = '#', extraSettings = {}) {
  const cleanText = sanitizeHeadingText(text);
  if (!cleanText) return null;
  
  const isExternal = link.includes('wa.me') || link.includes('whatsapp') || link.includes('instagram') || link.includes('facebook');
  
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'button',
    isInner: false,
    settings: {
      text: cleanText,
      link: { url: link, is_external: isExternal ? 'on' : '', nofollow: '', custom_attributes: '' },
      typography_typography: 'custom',
      typography_font_family: CONFIG.fonts.headline,
      typography_font_weight: '700',
      typography_font_size: { unit: 'px', size: 14, sizes: [] },
      border_radius: buildDimension(4, 4, 4, 4),
      ...extraSettings
    },
    elements: []
  };
}

/** Build an image widget */
function buildImage(src, alt = '', extraSettings = {}) {
  if (!src) return null;
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'image',
    isInner: false,
    settings: {
      image: { url: src, id: '', size: '', alt: alt, source: 'library' },
      image_size: 'full',
      ...extraSettings
    },
    elements: []
  };
}

/** Build a divider widget */
function buildDivider(extraSettings = {}) {
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'divider',
    isInner: false,
    settings: {
      style: 'solid',
      color: CONFIG.colors.primary,
      weight: { unit: 'px', size: 4, sizes: [] },
      width: { unit: 'px', size: 48, sizes: [] },
      align: 'left',
      ...extraSettings
    },
    elements: []
  };
}

/** Build a spacer widget */
function buildSpacer(size = 20) {
  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'spacer',
    isInner: false,
    settings: {
      space: { unit: 'px', size, sizes: [] },
      space_tablet: { unit: 'px', size: Math.round(size * 0.75), sizes: [] },
      space_mobile: { unit: 'px', size: Math.round(size * 0.5), sizes: [] },
    },
    elements: []
  };
}

// ============================================================
// TAILWIND EXTRACTION — With Correct Elementor Keys
// ============================================================

/** Extract container-level settings from Tailwind classes */
function extractContainerSettings($, el) {
  const classes = ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
  const inlineStyles = parseInlineStyles($(el).attr('style') || '');
  const s = {};

  // --- Background ---
  let bgColor = null;
  for (const cls of classes) {
    if (TW_COLORS[cls] && cls.startsWith('bg-')) {
      bgColor = TW_COLORS[cls];
    }
    const bgMatch = cls.match(/^bg-\[([^\]]+)\]/);
    if (bgMatch) bgColor = bgMatch[1];
  }
  if (inlineStyles['background-color']) bgColor = inlineStyles['background-color'];
  if (inlineStyles['background']) {
    const bgStr = inlineStyles['background'];
    if (bgStr.startsWith('#')) bgColor = bgStr;
    else if (bgStr.includes('gradient')) {
      s.background_background = 'gradient';
    }
  }
  if (bgColor && bgColor !== 'transparent') {
    s.background_background = s.background_background || 'classic';
    s.background_color = bgColor;
  }

  // --- Flex Direction (CORRECT PREFIX: flex_direction) ---
  if (classes.includes('flex-col') || classes.includes('flex-column')) {
    s.flex_direction = 'column';
  }
  if (classes.includes('flex-row')) {
    s.flex_direction = 'row';
  }
  for (const cls of classes) {
    if (cls === 'md:flex-row') s.flex_direction_tablet = 'row';
    if (cls === 'md:flex-col') s.flex_direction_tablet = 'column';
    if (cls === 'lg:flex-row') s.flex_direction = 'row';
    if (cls === 'lg:flex-col') s.flex_direction = 'column';
  }

  // --- Alignment (CORRECT PREFIX: flex_align_items, flex_justify_content) ---
  if (classes.includes('items-center')) s.flex_align_items = 'center';
  if (classes.includes('items-start')) s.flex_align_items = 'flex-start';
  if (classes.includes('items-end')) s.flex_align_items = 'flex-end';
  if (classes.includes('items-stretch')) s.flex_align_items = 'stretch';
  
  if (classes.includes('justify-center')) s.flex_justify_content = 'center';
  if (classes.includes('justify-between')) s.flex_justify_content = 'space-between';
  if (classes.includes('justify-start')) s.flex_justify_content = 'flex-start';
  if (classes.includes('justify-end')) s.flex_justify_content = 'flex-end';
  if (classes.includes('justify-around')) s.flex_justify_content = 'space-around';
  if (classes.includes('justify-evenly')) s.flex_justify_content = 'space-evenly';

  // --- Text alignment (for container text_align) ---
  if (classes.includes('text-center')) s.text_align = 'center';
  if (classes.includes('text-left')) s.text_align = 'left';
  if (classes.includes('text-right')) s.text_align = 'right';

  // --- Gap (CORRECT KEY: flex_gap with full format) ---
  for (const cls of classes) {
    const gapMatch = cls.match(/^gap-(\d+)$/);
    if (gapMatch) {
      s.flex_gap = buildFlexGap(parseInt(gapMatch[1]) * 4);
    }
  }
  if (inlineStyles['gap']) {
    const gv = parseCSSValue(inlineStyles['gap']);
    if (gv) s.flex_gap = buildFlexGap(gv.size);
  }

  // --- Padding ---
  if (inlineStyles['padding']) {
    const dim = parseDimensionShorthand(inlineStyles['padding']);
    if (dim) s.padding = dim;
  }
  for (const cls of classes) {
    const pxMatch = cls.match(/^px-(\d+)$/);
    if (pxMatch) {
      const val = String(parseInt(pxMatch[1]) * 4);
      s.padding = s.padding || buildDimension(0, 0, 0, 0);
      s.padding.right = val;
      s.padding.left = val;
      s.padding.isLinked = false;
    }
    const pyMatch = cls.match(/^py-(\d+)$/);
    if (pyMatch) {
      const val = String(parseInt(pyMatch[1]) * 4);
      s.padding = s.padding || buildDimension(0, 0, 0, 0);
      s.padding.top = val;
      s.padding.bottom = val;
      s.padding.isLinked = false;
    }
    const pMatch = cls.match(/^p-(\d+)$/);
    if (pMatch) {
      const val = String(parseInt(pMatch[1]) * 4);
      s.padding = buildDimension(val, val, val, val);
    }
    const ptMatch = cls.match(/^pt-(\d+)$/);
    if (ptMatch) {
      s.padding = s.padding || buildDimension(0, 0, 0, 0);
      s.padding.top = String(parseInt(ptMatch[1]) * 4);
      s.padding.isLinked = false;
    }
    const pbMatch = cls.match(/^pb-(\d+)$/);
    if (pbMatch) {
      s.padding = s.padding || buildDimension(0, 0, 0, 0);
      s.padding.bottom = String(parseInt(pbMatch[1]) * 4);
      s.padding.isLinked = false;
    }
  }

  // --- Margin (container level — no underscore here) ---
  for (const cls of classes) {
    const mbMatch = cls.match(/^mb-(\d+)$/);
    if (mbMatch) {
      s.margin = s.margin || buildDimension(0, 0, 0, 0);
      s.margin.bottom = String(parseInt(mbMatch[1]) * 4);
      s.margin.isLinked = false;
    }
    const mtMatch = cls.match(/^mt-(\d+)$/);
    if (mtMatch) {
      s.margin = s.margin || buildDimension(0, 0, 0, 0);
      s.margin.top = String(parseInt(mtMatch[1]) * 4);
      s.margin.isLinked = false;
    }
    if (cls === 'mx-auto') {
      s.margin = s.margin || buildDimension(0, 'auto', 0, 'auto');
    }
  }

  // --- Min height ---
  if (classes.includes('min-h-screen')) {
    s.min_height = { unit: 'px', size: 800, sizes: [] };
  }
  if (inlineStyles['min-height']) {
    const val = parseCSSValue(inlineStyles['min-height']);
    if (val) s.min_height = { unit: val.unit, size: val.size, sizes: [] };
  }

  // --- Width ---
  for (const cls of classes) {
    if (cls === 'max-w-4xl') s.boxed_width = { unit: 'px', size: 896, sizes: [] };
    if (cls === 'max-w-xl') s.boxed_width = { unit: 'px', size: 576, sizes: [] };
    if (cls === 'max-w-xs') s.boxed_width = { unit: 'px', size: 320, sizes: [] };
    if (cls === 'max-w-7xl') s.boxed_width = { unit: 'px', size: 1280, sizes: [] };
    if (cls === 'max-w-2xl') s.boxed_width = { unit: 'px', size: 672, sizes: [] };
    if (cls === 'max-w-3xl') s.boxed_width = { unit: 'px', size: 768, sizes: [] };
  }

  // --- Border ---
  for (const cls of classes) {
    if (cls === 'border-t-4') {
      s.border_border = 'solid';
      s.border_width = buildDimension(4, 0, 0, 0);
      const borderColorCls = classes.find(c => c.startsWith('border-') && TW_COLORS[c]);
      if (borderColorCls) s.border_color = TW_COLORS[borderColorCls];
      else s.border_color = CONFIG.colors.primary;
    }
    if (cls === 'border') {
      s.border_border = 'solid';
      s.border_width = s.border_width || buildDimension(1, 1, 1, 1);
      const borderColorCls = classes.find(c => c.startsWith('border-') && TW_COLORS[c] && !c.includes('border-t'));
      if (borderColorCls) s.border_color = TW_COLORS[borderColorCls];
    }
    if (cls === 'border-b') {
      s.border_border = 'solid';
      s.border_width = buildDimension(0, 0, 1, 0);
    }
  }

  // --- Border radius ---
  for (const cls of classes) {
    if (cls === 'rounded') s.border_radius = buildDimension(4, 4, 4, 4);
    if (cls === 'rounded-md') s.border_radius = buildDimension(6, 6, 6, 6);
    if (cls === 'rounded-lg') s.border_radius = buildDimension(8, 8, 8, 8);
    if (cls === 'rounded-xl') s.border_radius = buildDimension(12, 12, 12, 12);
    if (cls === 'rounded-2xl') s.border_radius = buildDimension(16, 16, 16, 16);
    if (cls === 'rounded-full') s.border_radius = buildDimension(4, 4, 4, 4); // BrandBook override
  }

  return s;
}

/** Extract typography settings from Tailwind classes */
function extractTypography(classes, inlineStyles = {}) {
  const typo = {};
  let hasCustom = false;

  for (const cls of classes) {
    if (TW_FONT_SIZE[cls]) {
      typo.typography_font_size = { unit: 'px', size: TW_FONT_SIZE[cls], sizes: [] };
      hasCustom = true;
    }
    if (TW_FONT_WEIGHT[cls]) {
      typo.typography_font_weight = TW_FONT_WEIGHT[cls];
      hasCustom = true;
    }
    if (TW_FONT_FAMILY[cls]) {
      typo.typography_font_family = TW_FONT_FAMILY[cls];
      hasCustom = true;
    }
    if (cls === 'uppercase') typo.typography_text_transform = 'uppercase';
    if (cls === 'tracking-widest') typo.typography_letter_spacing = { unit: 'px', size: 1.6, sizes: [] };
    if (cls === 'tracking-wider') typo.typography_letter_spacing = { unit: 'px', size: 0.8, sizes: [] };
    if (cls === 'tracking-tight') typo.typography_letter_spacing = { unit: 'px', size: -0.5, sizes: [] };
  }

  if (inlineStyles['font-family']) {
    typo.typography_font_family = inlineStyles['font-family'].replace(/['"]/g, '').split(',')[0].trim();
    hasCustom = true;
  }
  if (inlineStyles['font-size']) {
    const v = parseCSSValue(inlineStyles['font-size']);
    if (v) { typo.typography_font_size = { unit: v.unit, size: v.size, sizes: [] }; hasCustom = true; }
  }
  if (inlineStyles['font-weight']) {
    typo.typography_font_weight = inlineStyles['font-weight'];
    hasCustom = true;
  }
  if (inlineStyles['line-height']) {
    const v = parseCSSValue(inlineStyles['line-height']);
    if (v) typo.typography_line_height = { unit: v.unit || 'em', size: v.size, sizes: [] };
  }
  if (inlineStyles['letter-spacing']) {
    const v = parseCSSValue(inlineStyles['letter-spacing']);
    if (v) typo.typography_letter_spacing = { unit: v.unit, size: v.size, sizes: [] };
  }

  if (hasCustom) typo.typography_typography = 'custom';
  return typo;
}

/** Extract text color from classes/inline styles */
function extractTextColor(classes, inlineStyles = {}) {
  for (const cls of classes) {
    if (TW_COLORS[cls] && cls.startsWith('text-') && !cls.startsWith('text-xs') && !cls.startsWith('text-sm') && !cls.startsWith('text-base') && !cls.startsWith('text-lg') && !cls.startsWith('text-xl') && !cls.startsWith('text-2') && !cls.startsWith('text-3') && !cls.startsWith('text-4') && !cls.startsWith('text-5') && !cls.startsWith('text-6') && !cls.startsWith('text-7') && !cls.startsWith('text-8') && !cls.startsWith('text-center') && !cls.startsWith('text-left') && !cls.startsWith('text-right')) {
      return TW_COLORS[cls];
    }
    const colorMatch = cls.match(/^text-\[([^\]]+)\]/);
    if (colorMatch) return colorMatch[1];
  }
  if (inlineStyles['color']) return inlineStyles['color'];
  return null;
}

// ============================================================
// RECURSIVE DOM WALKER
// ============================================================

/**
 * Process any element and return Elementor node(s)
 */
function processElement($, el) {
  if (!el || el.type !== 'tag') return null;
  
  const tag = el.tagName;
  const classes = ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
  const inlineStyles = parseInlineStyles($(el).attr('style') || '');
  const text = $(el).text().trim();

  // Skip invisible/decorative/meta elements
  if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta' || tag === 'noscript') return null;
  if (classes.includes('absolute') && !$(el).children().length && !text) return null;
  if (classes.includes('absolute') && classes.includes('inset-0')) return null;

  // --- HEADING (h1-h6) ---
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const cleanText = sanitizeHeadingText($(el).html());
    if (!cleanText) return null;
    
    const typo = extractTypography(classes, inlineStyles);
    const color = extractTextColor(classes, inlineStyles);
    const containerSettings = extractContainerSettings($, el);
    
    const headingSettings = { ...typo };
    if (color) headingSettings.title_color = color;
    // CORRECT: headings use `align` not `text_align`
    if (containerSettings.text_align) headingSettings.align = containerSettings.text_align;
    // CORRECT: widgets use `_margin` not `margin`
    if (containerSettings.margin) headingSettings._margin = containerSettings.margin;

    return buildHeading(cleanText, tag, headingSettings);
  }

  // --- PARAGRAPH ---
  if (tag === 'p') {
    let html = $(el).html().trim();
    if (!html) return null;
    
    // Strip Material Symbols
    html = html.replace(/<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[^<]*<\/span>/gi, '');
    html = html.replace(/\b(arrow_forward|arrow_back|chevron_right)\b/g, '→');
    
    const color = extractTextColor(classes, inlineStyles);
    const typo = extractTypography(classes, inlineStyles);
    
    const styles = [];
    if (color) styles.push(`color:${color}`);
    if (typo.typography_font_family) styles.push(`font-family:${typo.typography_font_family}`);
    if (typo.typography_font_size) styles.push(`font-size:${typo.typography_font_size.size}${typo.typography_font_size.unit}`);
    if (typo.typography_font_weight) styles.push(`font-weight:${typo.typography_font_weight}`);
    if (typo.typography_line_height) styles.push(`line-height:${typo.typography_line_height.size}${typo.typography_line_height.unit}`);
    if (inlineStyles['max-width']) styles.push(`max-width:${inlineStyles['max-width']}`);
    if (classes.includes('uppercase')) styles.push('text-transform:uppercase');
    if (classes.includes('italic')) styles.push('font-style:italic');
    
    const styledHtml = styles.length > 0
      ? `<p style="${styles.join(';')}">${html}</p>`
      : `<p>${html}</p>`;

    const editorSettings = {};
    const cs = extractContainerSettings($, el);
    // CORRECT: widgets use `_margin`
    if (cs.margin) editorSettings._margin = cs.margin;

    return buildTextEditor(styledHtml, editorSettings);
  }

  // --- SPAN (standalone) ---
  if (tag === 'span' && !['h1','h2','h3','h4','h5','h6'].includes(el.parentNode?.tagName)) {
    // Skip Material Symbols icons
    if (classes.includes('material-symbols-outlined') || classes.some(c => c.includes('material-symbols'))) return null;
    
    let html = $(el).html().trim();
    if (!html) return null;
    
    html = html.replace(/\b(arrow_forward|arrow_back|chevron_right)\b/g, '→');
    
    const color = extractTextColor(classes, inlineStyles);
    const typo = extractTypography(classes, inlineStyles);
    
    const styles = [];
    if (color) styles.push(`color:${color}`);
    if (typo.typography_font_family) styles.push(`font-family:${typo.typography_font_family}`);
    if (typo.typography_font_size) styles.push(`font-size:${typo.typography_font_size.size}${typo.typography_font_size.unit}`);
    if (typo.typography_font_weight) styles.push(`font-weight:${typo.typography_font_weight}`);
    if (classes.includes('uppercase')) styles.push('text-transform:uppercase');
    if (classes.includes('tracking-widest')) styles.push('letter-spacing:0.1em');
    
    const styledHtml = styles.length > 0
      ? `<div style="${styles.join(';')}">${html}</div>`
      : html;

    return buildTextEditor(styledHtml);
  }

  // --- BUTTON / A (as button) ---
  if (tag === 'button' || (tag === 'a' && (
    classes.some(c => c.includes('btn') || c.includes('button')) ||
    classes.includes('px-10') || classes.includes('px-6') || classes.includes('px-8') ||
    (inlineStyles['background'] && inlineStyles['border-radius']) ||
    classes.some(c => c.startsWith('bg-primary'))
  ))) {
    const btnText = sanitizeHeadingText($(el).text());
    if (!btnText) return null;
    
    const href = $(el).attr('href') || '#';
    const typo = extractTypography(classes, inlineStyles);
    
    const btnSettings = { ...typo };
    
    // Button colors
    const bgColor = inlineStyles['background'] || inlineStyles['background-color'];
    if (bgColor) btnSettings.background_color = bgColor;
    else if (classes.includes('bg-primary') || classes.includes('bg-primary-container')) {
      btnSettings.background_color = CONFIG.colors.primaryDark;
    }
    else if (classes.some(c => c.includes('border') && !c.includes('border-t'))) {
      btnSettings.background_color = 'transparent';
      btnSettings.border_border = 'solid';
      btnSettings.border_width = buildDimension(2, 2, 2, 2);
      btnSettings.border_color = '#FFFFFF';
    }

    const textColor = inlineStyles['color'] || extractTextColor(classes, inlineStyles);
    if (textColor) btnSettings.button_text_color = textColor;
    else if (btnSettings.background_color === CONFIG.colors.primaryDark) btnSettings.button_text_color = '#FFFFFF';
    
    return buildButton(btnText, href, btnSettings);
  }

  // --- LINK (as text link, not button) ---
  if (tag === 'a') {
    let html = $(el).html().trim();
    if (!html) return null;
    
    // Strip Material Symbols
    html = html.replace(/<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[^<]*<\/span>/gi, '');
    const linkText = sanitizeHeadingText($(el).text());
    if (!linkText) return null;
    
    const href = $(el).attr('href') || '#';
    const color = extractTextColor(classes, inlineStyles);
    const typo = extractTypography(classes, inlineStyles);
    
    const styles = [];
    if (color) styles.push(`color:${color}`);
    else styles.push(`color:${CONFIG.colors.primary}`);
    if (typo.typography_font_family) styles.push(`font-family:${typo.typography_font_family}`);
    if (typo.typography_font_size) styles.push(`font-size:${typo.typography_font_size.size}${typo.typography_font_size.unit}`);
    if (typo.typography_font_weight) styles.push(`font-weight:${typo.typography_font_weight}`);
    if (classes.includes('uppercase')) styles.push('text-transform:uppercase');
    if (classes.includes('tracking-widest')) styles.push('letter-spacing:0.1em');
    styles.push('text-decoration:none');
    
    const styledHtml = `<a href="${href}" style="${styles.join(';')}">${linkText}</a>`;
    return buildTextEditor(styledHtml);
  }

  // --- IMAGE ---
  if (tag === 'img') {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (!src) return null;
    if (classes.includes('object-cover') && classes.includes('absolute')) return null;
    
    const imgSettings = {};
    const cs = extractContainerSettings($, el);
    if (cs.border_radius) imgSettings.border_radius = cs.border_radius;
    
    return buildImage(src, alt, imgSettings);
  }

  // --- SVG (skip inline SVGs) ---
  if (tag === 'svg') return null;

  // --- HR ---
  if (tag === 'hr') return buildDivider();

  // --- UL/OL ---
  if (tag === 'ul' || tag === 'ol') {
    const items = [];
    $(el).children('li').each((i, li) => {
      items.push(`<li>${$(li).html()}</li>`);
    });
    if (items.length === 0) return null;
    const listTag = tag === 'ol' ? 'ol' : 'ul';
    return buildTextEditor(`<${listTag}>${items.join('')}</${listTag}>`);
  }

  // --- DIV / SECTION / NAV / HEADER / FOOTER / MAIN / ARTICLE ---
  if (['div', 'section', 'header', 'footer', 'nav', 'main', 'article', 'aside'].includes(tag)) {
    // Skip purely decorative divs
    if (classes.includes('absolute') && !text && $(el).children().length === 0) return null;
    if (classes.includes('absolute') && classes.includes('inset-0')) return null;

    const containerSettings = extractContainerSettings($, el);
    const childElements = [];

    $(el).children().each((i, child) => {
      const result = processElement($, child);
      if (result) {
        if (Array.isArray(result)) {
          childElements.push(...result);
        } else {
          childElements.push(result);
        }
      }
    });

    // Empty container with no useful purpose
    if (childElements.length === 0 && !text) {
      // Check for visual divider (h-1 w-XX bg-primary pattern)
      if (classes.includes('h-1') && classes.some(c => c.startsWith('w-') || c.startsWith('bg-'))) {
        return buildDivider();
      }
      return null;
    }

    // TREE PRUNING: single child, no meaningful container styling → flatten
    const meaningfulKeys = Object.keys(containerSettings).filter(k => 
      k !== 'content_width' && containerSettings[k] !== undefined
    );
    if (childElements.length === 1 && meaningfulKeys.length === 0) {
      return childElements[0];
    }

    // Grid → flex conversion
    if (classes.includes('grid')) {
      containerSettings.flex_direction = containerSettings.flex_direction || 'row';
      containerSettings.flex_wrap = 'nowrap';
      
      let gridCols = 1;
      for (const cls of classes) {
        const lgColMatch = cls.match(/^lg:grid-cols-(\d+)$/);
        if (lgColMatch) gridCols = parseInt(lgColMatch[1]);
        const mdColMatch = cls.match(/^md:grid-cols-(\d+)$/);
        if (mdColMatch && gridCols <= 1) gridCols = parseInt(mdColMatch[1]);
        const baseColMatch = cls.match(/^grid-cols-(\d+)$/);
        if (baseColMatch && gridCols <= 1) gridCols = parseInt(baseColMatch[1]);
      }
      
      if (gridCols > 1) {
        containerSettings.flex_direction = 'row';
        containerSettings.flex_direction_mobile = 'column';
        const childWidth = Math.floor(100 / gridCols);
        childElements.forEach(child => {
          if (child.elType === 'container') {
            child.settings = child.settings || {};
            child.settings.width = { unit: '%', size: childWidth };
            child.settings.width_mobile = { unit: '%', size: 100 };
          }
        });
      }
    }

    // For flex row containers, also set nowrap and mobile stacking
    if (containerSettings.flex_direction === 'row' && !containerSettings.flex_wrap) {
      containerSettings.flex_wrap = 'nowrap';
    }
    if (containerSettings.flex_direction === 'row' && !containerSettings.flex_direction_mobile) {
      containerSettings.flex_direction_mobile = 'column';
    }

    return buildContainer(containerSettings, childElements, true);
  }

  return null;
}

// ============================================================
// TOP-LEVEL PROCESSORS
// ============================================================

/** Process a section-level element → outer Elementor container + Inner Boxed Container */
function processSection($, sectionEl, isHero = false) {
  const containerSettings = extractContainerSettings($, sectionEl);
  const elements = [];

  $(sectionEl).children().each((i, child) => {
    const result = processElement($, child);
    if (result) {
      if (Array.isArray(result)) elements.push(...result);
      else elements.push(result);
    }
  });

  if (elements.length === 0 && !containerSettings.background_background) return null;

  // Split settings between Outer (full) and Inner (boxed)
  const outerSettings = { content_width: 'full' };
  const innerSettings = { content_width: 'boxed' };

  // 1. Backgrounds go to Outer
  if (containerSettings.background_background) outerSettings.background_background = containerSettings.background_background;
  if (containerSettings.background_color) outerSettings.background_color = containerSettings.background_color;

  // 2. Padding logic: Y goes Outer, X goes Inner (to prevent edge-to-edge text)
  outerSettings.padding = buildDimension(0,0,0,0);
  innerSettings.padding = buildDimension(0,0,0,0);

  if (containerSettings.padding) {
    outerSettings.padding.top = containerSettings.padding.top || '0';
    outerSettings.padding.bottom = containerSettings.padding.bottom || '0';
    innerSettings.padding.left = containerSettings.padding.left || '15';
    innerSettings.padding.right = containerSettings.padding.right || '15';
  } else {
    outerSettings.padding = buildDimension(96, 0, 96, 0); // Default vertical breathing room
    innerSettings.padding = buildDimension(0, 60, 0, 60); // Default horizontal safe area
  }

  // Tablets & Mobile padding
  innerSettings.padding_tablet = buildDimension(0, 40, 0, 40);
  innerSettings.padding_mobile = buildDimension(0, 20, 0, 20);
  
  if (containerSettings.padding_tablet) {
    outerSettings.padding_tablet = buildDimension(containerSettings.padding_tablet.top, 0, containerSettings.padding_tablet.bottom, 0);
  } else {
    outerSettings.padding_tablet = buildDimension(64, 0, 64, 0);
  }
  
  if (containerSettings.padding_mobile) {
    outerSettings.padding_mobile = buildDimension(containerSettings.padding_mobile.top, 0, containerSettings.padding_mobile.bottom, 0);
  } else {
    outerSettings.padding_mobile = buildDimension(40, 0, 40, 0);
  }

  // 3. Flex and layout goes to Inner
  if (containerSettings.flex_direction) innerSettings.flex_direction = containerSettings.flex_direction;
  if (containerSettings.flex_wrap) innerSettings.flex_wrap = containerSettings.flex_wrap;
  if (containerSettings.flex_align_items) innerSettings.flex_align_items = containerSettings.flex_align_items;
  if (containerSettings.flex_justify_content) innerSettings.flex_justify_content = containerSettings.flex_justify_content;
  if (containerSettings.flex_gap) innerSettings.flex_gap = containerSettings.flex_gap;
  if (containerSettings.text_align) innerSettings.text_align = containerSettings.text_align;

  // 4. Boxed width overrides
  if (containerSettings.boxed_width) {
    innerSettings.boxed_width = containerSettings.boxed_width;
  } else {
    innerSettings.boxed_width = { unit: 'px', size: 1200, sizes: [] }; // The Global Design System Boxed Width
  }

  // 5. Automated Hero Section handling
  if (isHero) {
    // We statically assign the generic hero images that we previously uploaded to WP.
    // Desktop: ID: 333, Mobile ID: 335
    outerSettings.background_background = 'classic';
    outerSettings.background_image = {"url":"http://evergreen.local/wp-content/uploads/2026/04/hero_escena_descripcion-1.webp","id":"333","size":"","alt":"hero","source":"library"};
    outerSettings.background_image_mobile = {"url":"http://evergreen.local/wp-content/uploads/2026/04/hero_mobile_escena_descripcion-1.webp","id":"335","size":"","alt":"hero","source":"library"};
    outerSettings.background_position = "center center";
    outerSettings.background_size = "cover";
    outerSettings.background_overlay_background = "gradient";
    outerSettings.background_overlay_color = "rgba(14,19,32,0.85)";
    outerSettings.background_overlay_color_b = "rgba(14,19,32,0.55)";
    outerSettings.background_overlay_gradient_angle = {"unit":"deg","size":135,"sizes":[]};
    outerSettings.min_height = {"unit":"vh","size":100,"sizes":[]};
    outerSettings.min_height_tablet = {"unit":"vh","size":85,"sizes":[]};
    outerSettings.min_height_mobile = {"unit":"vh","size":90,"sizes":[]};
  }

  // Build Inner container wrapped inside Outer container
  const innerContainer = buildContainer(innerSettings, elements, true);
  return buildContainer(outerSettings, [innerContainer], false);
}

/** Convert full HTML page to Elementor JSON content array */
function htmlToElementorContent(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  const body = $('body');
  const contentElements = [];

  // Font loader as first element
  contentElements.push(buildFontLoader());

  let sectionIndex = 0;

  body.children().each((i, child) => {
    const tag = child.tagName;
    if (tag === 'nav') return; // Skip nav (Header template)
    if (tag === 'footer') return; // Skip footer (Footer template)
    if (['script', 'style', 'link'].includes(tag)) return;

    // The first section in the body gets the hero treatment
    const isHero = (sectionIndex === 0 && (tag === 'section' || tag === 'header' || tag === 'div'));
    
    const result = processSection($, child, isHero);
    if (result && (result.elements?.length > 0 || result.settings?.background_background)) {
      result.isInner = false;
      contentElements.push(result);
      sectionIndex++;
    }
  });

  return contentElements;
}

/** Process nav → Header template */
function processNavAsHeader(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  const nav = $('nav').first();
  if (!nav.length) return [];

  const navElements = [];

  // Logo
  const logoText = nav.children().first().text().trim();
  if (logoText) {
    navElements.push(buildTextEditor(
      `<div style="font-family:${CONFIG.fonts.headline};font-size:20px;font-weight:900;color:${CONFIG.colors.primary};text-transform:uppercase;letter-spacing:-0.05em">${sanitizeHeadingText(logoText)}</div>`
    ));
  }

  // Nav links
  const linksContainer = [];
  nav.find('a').each((i, a) => {
    const href = $(a).attr('href') || '#';
    const linkText = sanitizeHeadingText($(a).text());
    if (linkText && href !== '#') {
      linksContainer.push(buildTextEditor(
        `<a href="${href}" style="font-family:${CONFIG.fonts.headline};font-size:11px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none">${linkText}</a>`
      ));
    }
  });

  if (linksContainer.length > 0) {
    navElements.push(buildContainer(
      {
        content_width: 'full',
        flex_direction: 'row',
        flex_gap: buildFlexGap(32),
        flex_align_items: 'center',
      },
      linksContainer, true
    ));
  }

  // CTA Button
  const ctaBtn = nav.find('button').first();
  if (ctaBtn.length) {
    navElements.push(buildButton(ctaBtn.text().trim(), 'https://wa.me/584123118100', {
      background_color: CONFIG.colors.primaryDark,
      button_text_color: '#FFFFFF',
    }));
  }

  return [buildContainer(
    {
      content_width: 'full',
      background_background: 'classic',
      background_color: 'rgba(14,19,32,0.7)',
      flex_direction: 'row',
      flex_justify_content: 'space-between',
      flex_align_items: 'center',
      padding: buildDimension(16, 32, 16, 32),
    },
    navElements, false
  )];
}

/** Process footer → Footer template */
function processFooterTemplate(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  const footer = $('footer').first();
  if (!footer.length) return [];
  
  const result = processSection($, footer.get(0));
  if (result) {
    result.isInner = false;
    return [result];
  }
  return [];
}

/** Wrap content array in template format */
function wrapAsTemplate(content, title, type = 'page') {
  return {
    version: '0.4',
    title: title,
    type: type,
    page_settings: [],
    content: content
  };
}

// ============================================================
// VALIDATION
// ============================================================

/** Validate JSON structure */
function validateElementorJSON(content) {
  const errors = [];
  const ids = new Set();
  
  function walkNode(node, path) {
    if (!node.id) errors.push(`${path}: Missing id`);
    else if (ids.has(node.id)) errors.push(`${path}: Duplicate id ${node.id}`);
    else ids.add(node.id);
    
    if (!node.elType) errors.push(`${path}: Missing elType`);
    if (node.elType === 'widget' && !node.widgetType) errors.push(`${path}: Widget missing widgetType`);
    if (node.isInner === undefined) errors.push(`${path}: Missing isInner`);
    if (!Array.isArray(node.elements)) errors.push(`${path}: elements is not an array`);
    
    // Check for WRONG keys (V3 bugs)
    if (node.settings) {
      if (node.settings.gap && !node.settings.flex_gap && node.elType === 'container') {
        errors.push(`${path}: Uses 'gap' instead of 'flex_gap'`);
      }
      if (node.settings.align_items && node.elType === 'container') {
        errors.push(`${path}: Uses 'align_items' instead of 'flex_align_items'`);
      }
      if (node.settings.justify_content && node.elType === 'container') {
        errors.push(`${path}: Uses 'justify_content' instead of 'flex_justify_content'`);
      }
      if (node.elType === 'widget' && node.settings.margin && !node.settings._margin) {
        errors.push(`${path}: Widget uses 'margin' instead of '_margin'`);
      }
    }
    
    if (node.elements) {
      node.elements.forEach((child, i) => walkNode(child, `${path}[${i}]`));
    }
  }
  
  content.forEach((node, i) => walkNode(node, `root[${i}]`));
  return errors;
}

/** Count total nodes */
function countNodes(arr) {
  let count = 0;
  for (const node of arr) {
    count++;
    if (node.elements && node.elements.length > 0) {
      count += countNodes(node.elements);
    }
  }
  return count;
}

// ============================================================
// BATCH CONVERTER
// ============================================================

async function batchConvert() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  COMPILER V4 — Evergreen Nativización Perfecta  ║');
  console.log('║  HTML → Native Elementor JSON (Fixed Keys)       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const manifest = JSON.parse(fs.readFileSync(CONFIG.manifestPath, 'utf8'));
  let successCount = 0;
  let errorCount = 0;
  let totalErrors = 0;

  // Process Header
  console.log('📋 Processing Header template...');
  try {
    const homepageHtml = fs.readFileSync(path.join(CONFIG.inputDir, 'homepage.html'), 'utf8');
    const headerContent = processNavAsHeader(homepageHtml);
    const headerTemplate = wrapAsTemplate(headerContent, 'Evergreen Header', 'header');
    const headerPath = path.join(CONFIG.outputDir, 'header.json');
    fs.writeFileSync(headerPath, JSON.stringify(headerTemplate), 'utf8');
    console.log(`  ✅ Header → ${path.basename(headerPath)}`);
  } catch (err) {
    console.error(`  ❌ Header: ${err.message}`);
    errorCount++;
  }

  // Process Footer
  console.log('📋 Processing Footer template...');
  try {
    const homepageHtml = fs.readFileSync(path.join(CONFIG.inputDir, 'homepage.html'), 'utf8');
    const footerContent = processFooterTemplate(homepageHtml);
    const footerTemplate = wrapAsTemplate(footerContent, 'Evergreen Footer', 'footer');
    const footerPath = path.join(CONFIG.outputDir, 'footer.json');
    fs.writeFileSync(footerPath, JSON.stringify(footerTemplate), 'utf8');
    console.log(`  ✅ Footer → ${path.basename(footerPath)}`);
  } catch (err) {
    console.error(`  ❌ Footer: ${err.message}`);
    errorCount++;
  }

  // Process all pages
  console.log('\n📄 Processing pages...\n');
  for (const page of manifest) {
    const inputPath = path.join(CONFIG.inputDir, page.file);
    const outputPath = path.join(CONFIG.outputDir, page.jsonFile);

    try {
      if (!fs.existsSync(inputPath)) {
        console.log(`  ⚠️  ${page.file} — NOT FOUND, skipping`);
        continue;
      }

      const html = fs.readFileSync(inputPath, 'utf8');
      const content = htmlToElementorContent(html);
      
      // Validate
      const validationErrors = validateElementorJSON(content);
      if (validationErrors.length > 0) {
        console.log(`  ⚠️  ${page.file} — ${validationErrors.length} validation warnings:`);
        validationErrors.slice(0, 3).forEach(e => console.log(`      ${e}`));
        totalErrors += validationErrors.length;
      }
      
      // Output content array (for _elementor_data)
      fs.writeFileSync(outputPath, JSON.stringify(content), 'utf8');
      
      const nodeCount = countNodes(content);
      const fileSize = Math.round(fs.statSync(outputPath).size / 1024);
      console.log(`  ✅ ${page.file.padEnd(30)} → ${page.jsonFile.padEnd(35)} (${nodeCount} nodes, ${fileSize}KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${page.file}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(55));
  console.log(`📊 Results: ${successCount} success, ${errorCount} errors, ${totalErrors} warnings`);
  console.log('═'.repeat(55));
}

// ============================================================
// RUN
// ============================================================
batchConvert().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
