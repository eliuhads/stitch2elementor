/**
 * ============================================================
 * COMPILER V4 — HTML to Native Elementor JSON
 * stitch2elementor — Generic Multi-Project Compiler
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
 *
 * CONFIG: All project-specific values must be set in design_system.json
 *         Do NOT hardcode client data in this file.
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const crypto = require('crypto');

// ============================================================
// CONFIG — Dynamic Design System
// ============================================================
const CONFIG = {
  inputDir: path.join(__dirname, '../assets_originales'),
  outputDir: path.join(__dirname, '../elementor_jsons'),
  manifestPath: path.join(__dirname, '../page_manifest.json'),
  designSystemPath: path.join(__dirname, '../design_system.json'),
  
  // Default values that will be overwritten if design_system.json exists
  colors: {
    background: '#0B0F1A',
    paper: '#F5F3ED',
    primary: '#368A39',
    accentCta: '#8FDA3E',
    primaryDark: '#368A39',
    secondary: '#84da7e',
    techBlue: '#28B5E1',
    amber: '#F5A623',
    tertiary: '#90db3f',
    onSurface: '#dfe2f2',
    onSurfaceVariant: '#bfcab9',
    surfaceContainerLowest: '#0a0e19',
    surfaceContainerLow: '#171b27',
    surfaceContainer: '#1b1f2b',
    surfaceContainerHigh: '#262a36',
    surfaceContainerHighest: '#313441',
    white: '#FFFFFF',
    textDark: '#0B0F1A',
    textMuted: '#4D4D4D',
    surfaceCard: '#161C2C',
    outlineVariant: '#40493d',
  },
  fonts: {
    headline: 'Inter',
    body: 'Inter',
    label: 'Inter',
    cta: 'Inter',
    tech: 'monospace',
  },
  googleFontsLink: '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
  // Typography scale per heading level
  typoScale: {
    h1: { desktop: 48, tablet: 36, mobile: 28, weight: '800' },
    h2: { desktop: 36, tablet: 30, mobile: 24, weight: '700' },
    h3: { desktop: 24, tablet: 20, mobile: 18, weight: '700' },
    h4: { desktop: 20, tablet: 18, mobile: 16, weight: '700' },
    h5: { desktop: 16, tablet: 15, mobile: 14, weight: '600' },
    h6: { desktop: 14, tablet: 13, mobile: 12, weight: '600' },
  },
  // Branding assets — MUST be overridden via design_system.json
  // These are empty placeholders. Set real values in your project's design_system.json
  logoUrl: '',           // e.g. 'https://yoursite.com/wp-content/uploads/logo.webp'
  logoAlt: 'Logo',
  logoText: 'BRAND',     // Text that Stitch renders as the logo (used for logo detection)
  whatsappUrl: '#',      // e.g. 'https://wa.me/1234567890'
};

// Auto-load dynamic design system if exists
if (fs.existsSync(CONFIG.designSystemPath)) {
  try {
    const ds = JSON.parse(fs.readFileSync(CONFIG.designSystemPath, 'utf8'));
    if (ds.colors) Object.assign(CONFIG.colors, ds.colors);
    if (ds.fonts) Object.assign(CONFIG.fonts, ds.fonts);
    if (ds.typoScale) Object.assign(CONFIG.typoScale, ds.typoScale);
    if (ds.googleFontsLink) CONFIG.googleFontsLink = ds.googleFontsLink;
    if (ds.logoUrl) CONFIG.logoUrl = ds.logoUrl;
    if (ds.logoAlt) CONFIG.logoAlt = ds.logoAlt;
    if (ds.logoText) CONFIG.logoText = ds.logoText;
    if (ds.whatsappUrl) CONFIG.whatsappUrl = ds.whatsappUrl;
    console.log('✅ Custom Design System Loaded');
  } catch (e) {
    console.error('⚠️ Could not parse design_system.json. Using defaults.');
  }
}

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
  // Split by ';' but avoid splitting if inside parentheses (like url(...) or calc(...))
  styleStr.split(/;(?![^(]*\))/g).forEach(pair => {
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
    isLinked: true
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
  'text-on-primary-container': '#183000',
  'bg-background': CONFIG.colors.background,
  'bg-primary': CONFIG.colors.primary,
  'bg-surface': CONFIG.colors.background,
  'bg-surface-container-lowest': CONFIG.colors.surfaceContainerLowest,
  'bg-surface-container-low': CONFIG.colors.surfaceContainerLow,
  'bg-surface-container': CONFIG.colors.surfaceContainer,
  'bg-surface-container-high': CONFIG.colors.surfaceContainerHigh,
  'bg-surface-container-highest': CONFIG.colors.surfaceContainerHighest,
  'bg-white': '#FFFFFF',
  'bg-primary-container': '#5ea200',
  'bg-secondary-container': '#006317',
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
        html: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer">' + CONFIG.googleFontsLink + '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"><style>html{scroll-behavior:smooth;} /* Auto-generated design styles */</style>'
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
  let cleanText = sanitizeHeadingText(text);
  
  // WhatsApp specific styling override (Stitch Brandbook compliance)
  const isWhatsApp = link.includes('wa.me') || text.toLowerCase().includes('whatsapp');
  if (isWhatsApp) {
      cleanText = 'Escríbenos por WhatsApp';
  }

  if (!cleanText) return null;
  
  const isExternal = link.includes('wa.me') || link.includes('whatsapp') || link.includes('instagram') || link.includes('facebook');
  
  const settings = {
      text: cleanText,
      link: { url: link, is_external: isExternal ? 'on' : '', nofollow: '', custom_attributes: '' },
      typography_typography: 'custom',
      typography_font_family: CONFIG.fonts.headline,
      typography_font_weight: '700',
      typography_font_size: { unit: 'px', size: 14, sizes: [] },
      border_radius: buildDimension(4, 4, 4, 4),
      ...extraSettings
  };

  if (isWhatsApp) {
    settings.typography_font_family = 'Inter';
    settings.typography_font_weight = '700';
    settings.typography_font_size = { unit: 'px', size: 18, sizes: [] };
    settings.border_radius = buildDimension(8, 8, 8, 8);
    settings.typography_text_transform = 'uppercase';
    settings.button_text_color = '#8FDA3E';
    settings.background_color = '#0B0F1A';
    settings.hover_animation = 'grow';
    settings.padding = buildDimension(16, 32, 16, 32);
    settings.selected_icon = { value: 'fab fa-whatsapp', library: 'fa-brands' };
    settings.icon_align = 'left';
    settings.icon_indent = { unit: 'px', size: 8, sizes: [] };
  }

  return {
    id: genId(),
    elType: 'widget',
    widgetType: 'button',
    isInner: false,
    settings,
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
  let bgHoverColor = null;
  
  for (const cls of classes) {
    // Normal bg
    if (TW_COLORS[cls] && cls.startsWith('bg-')) bgColor = TW_COLORS[cls];
    const bgMatch = cls.match(/^bg-\[([^\]]+)\]/);
    if (bgMatch) bgColor = bgMatch[1];
    
    // Complex bg match: bg-[#hex]/opacity
    const bgOpacityMatch = cls.match(/^bg-\[([^\]]+)\]\/(\d+)$/);
    if (bgOpacityMatch) {
      const hex = bgOpacityMatch[1];
      const opacity = parseInt(bgOpacityMatch[2]) / 100;
      if (hex.startsWith('#') && hex.length === 7) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        bgColor = `rgba(${r},${g},${b},${opacity})`;
      }
    }

    // Hover bg
    if (cls.match(/^(?:group-)?hover:bg-/)) {
      const hoverCls = cls.replace(/^(?:group-)?hover:/, '');
      if (TW_COLORS[hoverCls]) {
        bgHoverColor = TW_COLORS[hoverCls];
      }
      
      const hoverBgMatch = cls.match(/^(?:group-)?hover:bg-\[([^\]]+)\]$/);
      if (hoverBgMatch) bgHoverColor = hoverBgMatch[1];
      
      const hoverBgOpacityMatch = cls.match(/^(?:group-)?hover:bg-\[([^\]]+)\]\/(\d+)$/);
      if (hoverBgOpacityMatch) {
        const hex = hoverBgOpacityMatch[1];
        const opacity = parseInt(hoverBgOpacityMatch[2]) / 100;
        if (hex.startsWith('#') && hex.length === 7) {
          const r = parseInt(hex.slice(1,3), 16);
          const g = parseInt(hex.slice(3,5), 16);
          const b = parseInt(hex.slice(5,7), 16);
          bgHoverColor = `rgba(${r},${g},${b},${opacity})`;
        }
      }
    }

    // --- Opacity ---
    const opacityMatch = cls.match(/^opacity-(\d+)$/);
    if (opacityMatch) {
      s.opacity = { unit: 'px', size: parseInt(opacityMatch[1]) / 100, sizes: [] };
    }
  }

  // --- Background Image Capture (Stitch-style) ---
  // Detect images meant as backgrounds (absolute inset-0) and their gradient/overlay siblings
  $(el).find('img.absolute.inset-0, img.w-full.h-full.object-cover, div.absolute.inset-0 img').each((i, imgEl) => {
    // Only process it if it's acting as a background layer
    const parentClass = ($(imgEl).parent().attr('class') || '');
    if ($(imgEl).hasClass('absolute') || parentClass.includes('absolute')) {
      const ic = ($(imgEl).attr('class') || '');
      s.background_background = 'classic';
      s.background_image = {
        url: $(imgEl).attr('src'),
        id: '', size: '', 
        alt: $(imgEl).attr('data-alt') || $(imgEl).attr('alt') || 'background component',
        source: 'library'
      };
      s.background_position = 'center center';
      s.background_repeat = 'no-repeat';
      s.background_size = 'cover';

      // Emulate image opacity/filters via background overlay
      const opMatch = ic.match(/opacity-(\d+)/) || parentClass.match(/opacity-(\d+)/);
      if (opMatch) {
         // E.g. opacity-20 means 80% black overlay to match dark theme appearance
         const imgOpacity = parseInt(opMatch[1]) / 100;
         s.background_overlay_background = 'classic';
         s.background_overlay_color = '#0B0F1A'; 
         s.background_overlay_opacity = { unit: 'px', size: 1 - imgOpacity, sizes: [] };
      }
      if (ic.includes('grayscale') || parentClass.includes('grayscale')) {
         s.background_overlay_css_filter = 'custom';
         s.background_overlay_css_filter_grayscale = { unit: 'px', size: 100, sizes: [] };
      }
    }
  });

  // Detect gradient overlays (Stitch puts them in absolute divs)
  $(el).find('div.absolute').each((i, divEl) => {
    const dc = ($(divEl).attr('class') || '');
    if (dc.includes('inset-0')) {
      if (dc.includes('hero-gradient')) {
         s.background_overlay_background = 'gradient';
         s.background_overlay_color = 'rgba(11, 15, 26, 0.95)';
         s.background_overlay_color_b = 'rgba(11, 15, 26, 0.4)';
         s.background_overlay_gradient_angle = { unit: 'deg', size: 90, sizes: [] };
         s.background_overlay_gradient_type = 'linear';
      } else if (dc.includes('from-') || dc.includes('bg-gradient')) {
         const fromMatch = dc.match(/from-\[([^\]]+)\]/);
         const toMatch = dc.match(/to-\[([^\]]+)\]/);
         const viaMatch = dc.match(/via-\[([^\]]+)\]/);
         if (fromMatch) {
            s.background_overlay_background = 'gradient';
            s.background_overlay_gradient_type = 'linear';
            let deg = 180;
            if (dc.includes('to-t')) deg = 0;
            if (dc.includes('to-r')) deg = 90;
            if (dc.includes('to-l')) deg = 270;
            s.background_overlay_gradient_angle = { unit: 'deg', size: deg, sizes: [] };
            s.background_overlay_color = fromMatch[1];
            s.background_overlay_color_b = toMatch ? toMatch[1] : (viaMatch ? viaMatch[1] : 'transparent');
         }
      } else if (dc.match(/bg-black\/(\d+)/) || dc.match(/bg-\[([^\]]+)\]\/(\d+)/)) {
         // simple colored overlay
         const opMatch = dc.match(/\/(\d+)/);
         if (opMatch) {
             s.background_overlay_background = 'classic';
             const op = parseInt(opMatch[1]) / 100;
             s.background_overlay_color = 'rgba(0,0,0,' + op + ')';
         }
      }
    }
  });
  
  if (inlineStyles['background-color']) bgColor = inlineStyles['background-color'];
  if (inlineStyles['background']) {
    const bgStr = inlineStyles['background'];
    if (bgStr.startsWith('#')) bgColor = bgStr;
    else if (bgStr.startsWith('rgb') || bgStr.startsWith('rgba')) bgColor = bgStr;
    else if (bgStr.includes('gradient')) {
      s.background_background = 'gradient';
    }
  }

  if (bgColor && bgColor !== 'transparent') {
    s.background_background = s.background_background || 'classic';
    s.background_color = bgColor;
  }
  
  if (bgHoverColor && bgHoverColor !== 'transparent') {
    s.background_hover_background = 'classic';
    s.background_hover_color = bgHoverColor;
  }

  // --- Flex Direction (CORRECT PREFIX: flex_direction) ---
  // IMPORTANT: Tailwind is mobile-first. Elementor is desktop-first.
  // flex-col = mobile default, md:flex-row = tablet+ is row
  // → In Elementor: flex_direction = 'row' (desktop), flex_direction_mobile = 'column'
  
  // First pass: collect all responsive directives
  let hasFlexCol = classes.includes('flex-col') || classes.includes('flex-column');
  let hasFlexRow = classes.includes('flex-row');
  let hasMdFlexRow = false;
  let hasMdFlexCol = false;
  let hasSmFlexRow = false;
  let hasLgFlexRow = false;
  let hasLgFlexCol = false;
  
  for (const cls of classes) {
    if (cls === 'sm:flex-row') hasSmFlexRow = true;
    if (cls === 'md:flex-row') hasMdFlexRow = true;
    if (cls === 'md:flex-col') hasMdFlexCol = true;
    if (cls === 'lg:flex-row') hasLgFlexRow = true;
    if (cls === 'lg:flex-col') hasLgFlexCol = true;
  }

  // Apply desktop-first logic
  if (hasFlexCol && hasMdFlexRow) {
    // Pattern: flex-col md:flex-row → desktop: row, mobile: column
    s.flex_direction = 'row';
    s.flex_direction_mobile = 'column';
  } else if (hasFlexCol && hasSmFlexRow) {
    // Pattern: flex-col sm:flex-row → desktop: row, mobile: column
    s.flex_direction = 'row';
    s.flex_direction_mobile = 'column';
  } else if (hasFlexCol && hasLgFlexRow) {
    // Pattern: flex-col lg:flex-row → desktop: row, tablet: column, mobile: column
    s.flex_direction = 'row';
    s.flex_direction_tablet = 'column';
    s.flex_direction_mobile = 'column';
  } else if (hasFlexCol) {
    s.flex_direction = 'column';
  } else if (hasFlexRow) {
    s.flex_direction = 'row';
  } else if (hasMdFlexRow) {
    s.flex_direction = 'row';
    s.flex_direction_mobile = 'column';
  } else if (hasLgFlexRow) {
    s.flex_direction = 'row';
    s.flex_direction_tablet = 'column';
    s.flex_direction_mobile = 'column';
  }
  if (hasMdFlexCol) s.flex_direction_tablet = 'column';

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
    // space-y-* → flex_gap + column direction
    const spaceYMatch = cls.match(/^space-y-(\d+)$/);
    if (spaceYMatch) {
      s.flex_gap = buildFlexGap(parseInt(spaceYMatch[1]) * 4);
      if (!s.flex_direction) s.flex_direction = 'column';
    }
    // space-x-* → flex_gap + row direction  
    const spaceXMatch = cls.match(/^space-x-(\d+)$/);
    if (spaceXMatch) {
      s.flex_gap = buildFlexGap(parseInt(spaceXMatch[1]) * 4);
      if (!s.flex_direction) s.flex_direction = 'row';
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

  // --- Min height & h-screen ---
  if (classes.includes('min-h-screen')) {
    s.min_height = { unit: 'vh', size: 100, sizes: [] };
  }
  if (classes.includes('h-screen')) {
    s.min_height = { unit: 'vh', size: 100, sizes: [] };
  }
  if (classes.includes('h-full')) {
    s.min_height = { unit: '%', size: 100, sizes: [] };
  }
  for (const cls of classes) {
    const hMatch = cls.match(/^h-(\d+)$/);
    if (hMatch) {
       s.min_height = { unit: 'px', size: parseInt(hMatch[1]) * 4, sizes: [] };
    }
    const minHMatch = cls.match(/^min-h-\[(\d+)px\]$/);
    if (minHMatch) {
       s.min_height = { unit: 'px', size: parseInt(minHMatch[1]), sizes: [] };
    }
  }
  if (inlineStyles['min-height']) {
    const val = parseCSSValue(inlineStyles['min-height']);
    if (val) s.min_height = { unit: val.unit, size: val.size, sizes: [] };
  }
  if (inlineStyles['height']) {
    const val = parseCSSValue(inlineStyles['height']);
    if (val && val.unit === 'vh') s.min_height = { unit: val.unit, size: val.size, sizes: [] };
    else if (val) s.min_height = { unit: val.unit, size: val.size, sizes: [] };
  }

  // --- Width ---
  for (const cls of classes) {
    if (cls === 'w-full') s.width = { unit: '%', size: 100, sizes: [] };
    const wMatch = cls.match(/^w-(\d+)$/);
    if (wMatch) s.width = { unit: 'px', size: parseInt(wMatch[1]) * 4, sizes: [] };
    
    if (cls === 'max-w-4xl') s.boxed_width = { unit: 'px', size: 896, sizes: [] };
    if (cls === 'max-w-xl') s.boxed_width = { unit: 'px', size: 576, sizes: [] };
    if (cls === 'max-w-xs') s.boxed_width = { unit: 'px', size: 320, sizes: [] };
    if (cls === 'max-w-7xl') s.boxed_width = { unit: 'px', size: 1280, sizes: [] };
    if (cls === 'max-w-2xl') s.boxed_width = { unit: 'px', size: 672, sizes: [] };
    if (cls === 'max-w-3xl') s.boxed_width = { unit: 'px', size: 768, sizes: [] };
  }

  // --- Border ---
  // First detect arbitrary border colors like border-[#368A39]
  let borderArbitraryColor = null;
  for (const cls of classes) {
    const borderMatch = cls.match(/^border-\[([^\]]+)\]/);
    if (borderMatch && !cls.includes('/')) borderArbitraryColor = borderMatch[1];
  }
  for (const cls of classes) {
    if (cls === 'border-t-4') {
      s.border_border = 'solid';
      s.border_width = buildDimension(4, 0, 0, 0);
      if (borderArbitraryColor) s.border_color = borderArbitraryColor;
      else {
        const borderColorCls = classes.find(c => c.startsWith('border-') && TW_COLORS[c]);
        if (borderColorCls) s.border_color = TW_COLORS[borderColorCls];
        else s.border_color = CONFIG.colors.primary;
      }
    }
    if (cls === 'border-l-4') {
      s.border_border = 'solid';
      s.border_width = buildDimension(0, 0, 0, 4);
      if (borderArbitraryColor) s.border_color = borderArbitraryColor;
      else {
        const borderColorCls = classes.find(c => c.startsWith('border-') && TW_COLORS[c]);
        if (borderColorCls) s.border_color = TW_COLORS[borderColorCls];
        else s.border_color = CONFIG.colors.primary;
      }
    }
    if (cls === 'border-r-4') {
      s.border_border = 'solid';
      s.border_width = buildDimension(0, 4, 0, 0);
    }
    if (cls === 'border-b-4') {
      s.border_border = 'solid';
      s.border_width = buildDimension(0, 0, 4, 0);
    }
    if (cls === 'border') {
      s.border_border = 'solid';
      s.border_width = s.border_width || buildDimension(1, 1, 1, 1);
      if (borderArbitraryColor) s.border_color = borderArbitraryColor;
      else {
        const borderColorCls = classes.find(c => c.startsWith('border-') && TW_COLORS[c] && !c.includes('border-t') && !c.includes('border-l') && !c.includes('border-r') && !c.includes('border-b'));
        if (borderColorCls) s.border_color = TW_COLORS[borderColorCls];
      }
    }
    if (cls === 'border-b') {
      s.border_border = 'solid';
      s.border_width = buildDimension(0, 0, 1, 0);
    }
    if (cls === 'border-t') {
      s.border_border = 'solid';
      s.border_width = buildDimension(1, 0, 0, 0);
      if (borderArbitraryColor) s.border_color = borderArbitraryColor;
    }
  }
  // border-white/XX patterns
  for (const cls of classes) {
    const borderOpacityMatch = cls.match(/^border-white\/(\d+)$/);
    if (borderOpacityMatch) {
      const opacity = parseInt(borderOpacityMatch[1]) / 100;
      s.border_color = `rgba(255,255,255,${opacity})`;
    }
  }

  // --- Border radius ---
  for (const cls of classes) {
    if (cls === 'rounded') s.border_radius = buildDimension(4, 4, 4, 4);
    if (cls === 'rounded-sm') s.border_radius = buildDimension(2, 2, 2, 2);
    if (cls === 'rounded-md') s.border_radius = buildDimension(6, 6, 6, 6);
    if (cls === 'rounded-lg') s.border_radius = buildDimension(8, 8, 8, 8);
    if (cls === 'rounded-xl') s.border_radius = buildDimension(12, 12, 12, 12);
    if (cls === 'rounded-2xl') s.border_radius = buildDimension(16, 16, 16, 16);
    if (cls === 'rounded-full') s.border_radius = buildDimension(9999, 9999, 9999, 9999);
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

// Prefixes to exclude when extracting text colors (size/alignment classes)
const TEXT_NON_COLOR_PREFIXES = new Set([
  'text-xs','text-sm','text-base','text-lg','text-xl',
  'text-2xl','text-3xl','text-4xl','text-5xl','text-6xl','text-7xl','text-8xl',
  'text-center','text-left','text-right','text-justify'
]);

/** Extract text color from classes/inline styles */
function extractTextColor(classes, inlineStyles = {}) {
  for (const cls of classes) {
    if (TW_COLORS[cls] && cls.startsWith('text-') && !TEXT_NON_COLOR_PREFIXES.has(cls)) {
      return TW_COLORS[cls];
    }
    // Arbitrary text color: text-[#28B5E1]
    const colorMatch = cls.match(/^text-\[([^\]]+)\]/);
    if (colorMatch) return colorMatch[1];
    
    // Opacity text colors: text-white/70, text-[#hex]/50, text-primary/80
    const opacityMatch = cls.match(/^text-([^/]+)\/(\d+)$/);
    if (opacityMatch) {
      const colorKey = 'text-' + opacityMatch[1];
      const opacity = parseInt(opacityMatch[2]) / 100;
      
      let baseHex = null;
      if (TW_COLORS[colorKey]) {
        baseHex = TW_COLORS[colorKey];
      } else if (opacityMatch[1].startsWith('[#')) {
        baseHex = opacityMatch[1].replace('[', '').replace(']', '');
      }

      if (baseHex && baseHex.startsWith('#') && baseHex.length === 7) {
        const r = parseInt(baseHex.slice(1,3), 16), g = parseInt(baseHex.slice(3,5), 16), b = parseInt(baseHex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${opacity})`;
      } else if (baseHex) {
        return baseHex; // Fallback to raw value
      }
    }
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
      btnSettings.background_color = CONFIG.colors.accentCta;
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
    
    // Extract hover states
    for (const cls of classes) {
      if (cls.match(/^(?:group-)?hover:bg-/)) {
        const hoverBgCls = cls.replace(/^(?:group-)?hover:/, '');
        if (TW_COLORS[hoverBgCls]) btnSettings.button_background_hover_color = TW_COLORS[hoverBgCls];
        
        const hMatch = cls.match(/^(?:group-)?hover:bg-\[([^\]]+)\]/);
        if (hMatch) btnSettings.button_background_hover_color = hMatch[1];
        
        const hopMatch = cls.match(/^(?:group-)?hover:bg-\[([^\]]+)\]\/(\d+)$/);
        if (hopMatch) {
          const hex = hopMatch[1];
          const opacity = parseInt(hopMatch[2]) / 100;
          if (hex.startsWith('#') && hex.length === 7) {
            const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
            btnSettings.button_background_hover_color = `rgba(${r},${g},${b},${opacity})`;
          }
        }
      }
      if (cls.match(/^(?:group-)?hover:text-/)) {
        const hoverTextCls = cls.replace(/^(?:group-)?hover:/, '');
        if (TW_COLORS[hoverTextCls]) btnSettings.hover_color = TW_COLORS[hoverTextCls];
        
        const hMatch = cls.match(/^(?:group-)?hover:text-\[([^\]]+)\]/);
        if (hMatch) btnSettings.hover_color = hMatch[1];
      }
    }
    
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
    const alt = $(el).attr('data-alt') || $(el).attr('alt') || '';
    if (!src) return null;
    
    // Skip if it's already serving as a background (absolute inset-0)
    if (classes.includes('absolute') && (classes.includes('inset-0') || classes.includes('top-0'))) {
       // Only skip if the parent actually has this URL as background
       // (This is a safety check, but usually true in our new logic)
       return null; 
    }
    
    const imgSettings = {};
    const cs = extractContainerSettings($, el);
    if (cs.border_radius) imgSettings.border_radius = cs.border_radius;
    if (cs.margin) imgSettings._margin = cs.margin;
    if (cs.opacity) imgSettings.opacity = cs.opacity;
    
    for (const cls of classes) {
      const wMatch = cls.match(/^w-(\d+)$/);
      if (wMatch) {
         imgSettings.width = { unit: 'px', size: parseInt(wMatch[1]) * 4, sizes: [] };
      }
      if (cls === 'w-full') imgSettings.width = { unit: '%', size: 100, sizes: [] };
      if (cls === 'w-1/2') imgSettings.width = { unit: '%', size: 50, sizes: [] };
      if (cls === 'max-w-xs') imgSettings.width = { unit: 'px', size: 320, sizes: [] };
    }
    
    return buildImage(src, alt, imgSettings);
  }

  // --- SVG (skip inline SVGs) ---
  if (tag === 'svg') return null;

  // --- FORM (preserve as html widget for editability) ---
  if (tag === 'form') {
    const formHtml = $(el).toString();
    if (!formHtml || formHtml.length < 10) return null;
    return {
      id: genId(),
      elType: 'widget',
      widgetType: 'html',
      isInner: false,
      settings: {
        html: sanitizeForHTML(formHtml)
      },
      elements: []
    };
  }

  // --- VIDEO ---
  if (tag === 'video') {
    const src = $(el).attr('src') || $(el).find('source').first().attr('src') || '';
    if (!src) return null;
    return {
      id: genId(),
      elType: 'widget',
      widgetType: 'html',
      isInner: false,
      settings: {
        html: `<video src="${src}" controls playsinline style="width:100%;max-width:100%;border-radius:8px;">${$(el).attr('poster') ? `poster="${$(el).attr('poster')}"` : ''}</video>`
      },
      elements: []
    };
  }

  // --- IFRAME (YouTube, Vimeo, Maps embeds) ---
  if (tag === 'iframe') {
    const src = $(el).attr('src') || '';
    if (!src) return null;
    
    // YouTube/Vimeo → native video widget
    const youtubeMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return {
        id: genId(),
        elType: 'widget',
        widgetType: 'video',
        isInner: false,
        settings: {
          video_type: 'youtube',
          youtube_url: `https://www.youtube.com/watch?v=${youtubeMatch[1]}`,
          aspect_ratio: '169',
        },
        elements: []
      };
    }
    
    const vimeoMatch = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return {
        id: genId(),
        elType: 'widget',
        widgetType: 'video',
        isInner: false,
        settings: {
          video_type: 'vimeo',
          vimeo_url: `https://vimeo.com/${vimeoMatch[1]}`,
          aspect_ratio: '169',
        },
        elements: []
      };
    }
    
    // Google Maps → native google_maps widget
    if (src.includes('google.com/maps')) {
      const addressMatch = src.match(/q=([^&]+)/);
      return {
        id: genId(),
        elType: 'widget',
        widgetType: 'google_maps',
        isInner: false,
        settings: {
          address: addressMatch ? decodeURIComponent(addressMatch[1]) : 'Location',
          zoom: 14,                              // Elementor expects plain integer, not dimension object
          height: { unit: 'px', size: 400, sizes: [] },
        },
        elements: []
      };
    }
    
    // Generic iframe → html widget
    return {
      id: genId(),
      elType: 'widget',
      widgetType: 'html',
      isInner: false,
      settings: {
        html: `<iframe src="${src}" style="width:100%;min-height:400px;border:none;" loading="lazy"></iframe>`
      },
      elements: []
    };
  }

  // --- TABLE (preserve structure in text-editor) ---
  if (tag === 'table') {
    const tableHtml = $(el).toString();
    if (!tableHtml) return null;
    
    const color = extractTextColor(classes, inlineStyles);
    const wrappedHtml = `<div style="overflow-x:auto;width:100%;${color ? `color:${color};` : `color:${CONFIG.colors.white};`}border-radius:8px;">${sanitizeForHTML(tableHtml)}</div>`;
    
    return buildTextEditor(wrappedHtml);
  }

  if (tag === 'hr') return buildDivider();

  // --- UL/OL ---
  if (tag === 'ul' || tag === 'ol') {
    const items = [];
    const styleId = 'ls_' + genId();
    let hasLinks = false;
    
    $(el).children('li').each((i, li) => {
      const $li = $(li);
      $li.find('a').each((j, a) => {
        hasLinks = true;
        const aClasses = $(a).attr('class') || '';
        $(a).attr('class', aClasses + ` ${styleId}_link`);
        // We remove hardcoded styles from previous patch
        $(a).removeAttr('style');
      });
      items.push(`<li>${$li.html()}</li>`);
    });
    
    if (items.length === 0) return null;
    const listTag = tag === 'ol' ? 'ol' : 'ul';
    
    // Inject intelligent hover styles if there are links
    let styleBlock = '';
    if (hasLinks) {
       styleBlock = `<style>
         .${styleId}_link { color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.3s ease; }
         .${styleId}_link:hover { color: #28B5E1; text-decoration: underline; }
       </style>`;
    }
    
    return buildTextEditor(`${styleBlock}<${listTag} style="list-style-type: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px;">${items.join('')}</${listTag}>`);
  }

  // --- DIV / SECTION / NAV / HEADER / FOOTER / MAIN / ARTICLE ---
  if (['div', 'section', 'header', 'footer', 'nav', 'main', 'article', 'aside'].includes(tag)) {
    // Skip purely decorative divs (no text, no children)
    if (classes.includes('absolute') && !text && $(el).children().length === 0) return null;
    // Skip overlay divs (gradient overlays, etc.)
    if (classes.includes('absolute') && classes.includes('inset-0')) return null;
    // Skip scroll indicators and similar decorative elements
    if (classes.includes('absolute') && classes.includes('bottom-10')) return null;

    // ─── TEXT-ONLY DIV → text-editor widget ───
    // If a div has NO child elements but HAS text, it's a styled text block
    // This fixes: Stats Banner numbers (15+, 5000+), labels, etc.
    if ($(el).children().length === 0 && text) {
      const uText = text.trim().toUpperCase();
      // --- LOGO OVERRIDE: detect text that Stitch renders as logo placeholder ---
      // Set CONFIG.logoText in design_system.json to match your brand name as Stitch renders it
      if (CONFIG.logoText && uText === CONFIG.logoText.toUpperCase()) {
          // Wrapped in a constrained container to prevent it from ignoring width
          return buildContainer(
            { content_width: 'full', width: { unit: 'px', size: 192, sizes: [] } },
            [
              buildImage(
                CONFIG.logoUrl,
                CONFIG.logoAlt,
                { width: { unit: '%', size: 100, sizes: [] } }
              )
            ],
            true // isInner
          );
      }

      // Skip Material Symbols orphan text
      if (/^(arrow_forward|arrow_back|chevron_right|check_circle|close|star|lightbulb|solar_power|battery_charging_full|factory|verified|precision_manufacturing|support_agent)$/i.test(text)) {
        return null;
      }
      
      const color = extractTextColor(classes, inlineStyles);
      const typo = extractTypography(classes, inlineStyles);
      
      const styles = [];
      if (color) styles.push(`color:${color}`);
      else styles.push(`color:${CONFIG.colors.white}`);
      if (typo.typography_font_family) styles.push(`font-family:${typo.typography_font_family}`);
      if (typo.typography_font_size) styles.push(`font-size:${typo.typography_font_size.size}${typo.typography_font_size.unit}`);
      if (typo.typography_font_weight) styles.push(`font-weight:${typo.typography_font_weight}`);
      if (typo.typography_line_height) styles.push(`line-height:${typo.typography_line_height.size}${typo.typography_line_height.unit}`);
      if (classes.includes('uppercase')) styles.push('text-transform:uppercase');
      if (classes.includes('tracking-widest')) styles.push('letter-spacing:0.1em');
      if (classes.includes('tracking-wider')) styles.push('letter-spacing:0.05em');
      if (classes.includes('tracking-tighter')) styles.push('letter-spacing:-0.05em');
      if (classes.includes('text-center')) styles.push('text-align:center');
      
      const styledHtml = styles.length > 0
        ? `<div style="${styles.join(';')}">${sanitizeForHTML(text)}</div>`
        : `<div>${sanitizeForHTML(text)}</div>`;

      const editorSettings = {};
      const cs = extractContainerSettings($, el);
      if (cs.margin) editorSettings._margin = cs.margin;
      
      return buildTextEditor(styledHtml, editorSettings);
    }

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
      // Small decorative boxes (icon placeholders, etc.) — skip
      if (classes.some(c => /^(w-\d+|h-\d+)$/.test(c))) {
        return null;
      }
      return null;
    }

    // ─── WIDTH CLASSES → Elementor width settings ───
    // This fixes side-by-side layouts like "Why Evergreen" (image 50% + text 50%)
    for (const cls of classes) {
      if (cls === 'w-full' || cls === 'md:w-full') {
        containerSettings.width = { unit: '%', size: 100 };
      }
      if (cls === 'w-1/2' || cls === 'md:w-1/2') {
        containerSettings.width = { unit: '%', size: 50 };
        containerSettings.width_mobile = { unit: '%', size: 100 };
      }
      if (cls === 'w-1/3' || cls === 'md:w-1/3') {
        containerSettings.width = { unit: '%', size: 33 };
        containerSettings.width_mobile = { unit: '%', size: 100 };
      }
      if (cls === 'w-2/3' || cls === 'md:w-2/3') {
        containerSettings.width = { unit: '%', size: 66 };
        containerSettings.width_mobile = { unit: '%', size: 100 };
      }
      if (cls === 'w-1/4') {
        containerSettings.width = { unit: '%', size: 25 };
        containerSettings.width_mobile = { unit: '%', size: 100 };
      }
      if (cls === 'w-3/4') {
        containerSettings.width = { unit: '%', size: 75 };
        containerSettings.width_mobile = { unit: '%', size: 100 };
      }
    }

    // ─── FLEX-SHRINK-0 icon boxes → skip if only Material Symbols inside ───
    // Fixes: dark bars that appear when icon containers have stripped content
    if (classes.includes('flex-shrink-0') && childElements.length === 0) {
      return null;
    }

    // TREE PRUNING: single child, no meaningful container styling → flatten
    // But KEEP containers that have flex direction, background, gap, or width
    const meaningfulKeys = Object.keys(containerSettings).filter(k => 
      k !== 'content_width' && containerSettings[k] !== undefined
    );
    const hasStructuralRole = containerSettings.flex_direction || 
      containerSettings.background_background || 
      containerSettings.flex_gap || 
      containerSettings.width ||
      containerSettings.border_border ||
      containerSettings.min_height ||
      containerSettings.padding;
    if (childElements.length === 1 && meaningfulKeys.length === 0 && !hasStructuralRole) {
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
            if (!child.settings.width) {
              child.settings.width = { unit: '%', size: childWidth };
              child.settings.width_mobile = { unit: '%', size: 100 };
            }
          }
        });
      }
    }

    // ─── FLEX ROW from classes → ensure proper responsive stacking ───
    if (classes.includes('flex') && !containerSettings.flex_direction) {
      // Default flex is row
      containerSettings.flex_direction = 'row';
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

  // ─── CAPTURE background images from absolute-positioned divs ───
  // Stitch uses <div class="absolute inset-0"><img src="..."/></div> as backgrounds
  let capturedBgImage = null;
  $(sectionEl).children().each((i, child) => {
    const $c = $(child);
    const cClasses = ($c.attr('class') || '').split(/\s+/);
    if (cClasses.includes('absolute') && cClasses.includes('inset-0')) {
      const $img = $c.find('img').first();
      if ($img.length > 0) {
        capturedBgImage = $img.attr('src') || '';
      }
    }
  });

  $(sectionEl).children().each((i, child) => {
    const result = processElement($, child);
    if (result) {
      if (Array.isArray(result)) elements.push(...result);
      else elements.push(result);
    }
  });

  if (elements.length === 0 && !containerSettings.background_background && !capturedBgImage) return null;

  // Split settings between Outer (full) and Inner (boxed)
  const outerSettings = { content_width: 'full' };
  const innerSettings = { content_width: 'boxed' };

  // 1. Backgrounds go to Outer — DEFAULT to dark if none specified
  if (containerSettings.background_background) {
    outerSettings.background_background = containerSettings.background_background;
    outerSettings.background_color = containerSettings.background_color;
    if (containerSettings.background_image) outerSettings.background_image = containerSettings.background_image;
    if (containerSettings.background_position) outerSettings.background_position = containerSettings.background_position;
    if (containerSettings.background_repeat) outerSettings.background_repeat = containerSettings.background_repeat;
    if (containerSettings.background_size) outerSettings.background_size = containerSettings.background_size;
  } else {
    // Always set dark background — the entire site is dark-themed
    outerSettings.background_background = 'classic';
    outerSettings.background_color = CONFIG.colors.background; // #0B0F1A
  }

  // 2. Borders on outer container
  if (containerSettings.border_border) {
    outerSettings.border_border = containerSettings.border_border;
    if (containerSettings.border_width) outerSettings.border_width = containerSettings.border_width;
    if (containerSettings.border_color) outerSettings.border_color = containerSettings.border_color;
  }

  // 3. Padding logic: Y goes Outer, X goes Inner (to prevent edge-to-edge text)
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

  if (containerSettings.min_height) outerSettings.min_height = containerSettings.min_height;

  // 5. Automated Hero Section handling
  if (isHero) {
    outerSettings.background_background = 'classic';
    outerSettings.background_position = "center center";
    outerSettings.background_size = "cover";
    outerSettings.background_overlay_background = "gradient";
    outerSettings.background_overlay_color = "rgba(11,15,26,0.85)";
    outerSettings.background_overlay_color_b = "rgba(11,15,26,0.45)";
    outerSettings.background_overlay_gradient_angle = {"unit":"deg","size":135,"sizes":[]};
    outerSettings.min_height = {"unit":"vh","size":100,"sizes":[]};
    outerSettings.min_height_tablet = {"unit":"vh","size":85,"sizes":[]};
    outerSettings.min_height_mobile = {"unit":"vh","size":90,"sizes":[]};
  }

  // 6. Captured Background Images (from absolute inset-0 img elements)
  // This handles CTA sections that use an <img> as a pseudo-background
  if (capturedBgImage && !isHero) {
    outerSettings.background_background = 'classic';
    outerSettings.background_image = {
      url: capturedBgImage,
      id: '',
      size: '',
      alt: 'background',
      source: 'library'
    };
    outerSettings.background_position = "center center";
    outerSettings.background_size = "cover";
    outerSettings.background_overlay_background = "gradient";
    outerSettings.background_overlay_color = "rgba(11,15,26,0.9)";
    outerSettings.background_overlay_color_b = "rgba(11,15,26,0.7)";
    outerSettings.background_overlay_gradient_angle = {"unit":"deg","size":180,"sizes":[]};
  }

  // Build Inner container wrapped inside Outer container
  const innerContainer = buildContainer(innerSettings, elements, true);
  return buildContainer(outerSettings, [innerContainer], false);
}

/** Convert full HTML page to Elementor JSON content array */
function htmlToElementorContent(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  $('.material-symbols-outlined').remove();
  const body = $('body');
  const contentElements = [];

  let sectionIndex = 0;

  body.children().each((i, child) => {
    const tag = child.tagName;
    // Skip nav, header, and footer so they don't get embedded in standard pages
    if (['script', 'style', 'link', 'nav', 'header', 'footer'].includes(tag)) return;
    // The first section in the body gets the hero treatment
    // Refined: main tag shouldn't be hero, its first child section should be.
    const isHero = (tag === 'section' || tag === 'header') && sectionIndex === 0;
    
    const result = processSection($, child, isHero);
    if (result && (result.elements?.length > 0 || result.settings?.background_background)) {
      result.isInner = false;
      contentElements.push(result);
      sectionIndex++;
    }
  });

  // Font loader as last element to avoid breaking global headers
  contentElements.push(buildFontLoader());

  return contentElements;
}

/** Process nav → Header template */
function processNavAsHeader(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  $('.material-symbols-outlined').remove();
  const nav = $('nav').first();
  if (!nav.length) return [];

  const navElements = [];

  // 1. Logo Container (Constrained Width)
  navElements.push({
    id: genId(),
    elType: 'container',
    isInner: true,
    settings: {
      content_width: 'full',
      width: { unit: 'px', size: 220, sizes: [] },
      flex_direction: 'row',
      flex_align_items: 'center',
    },
    elements: [
      {
        id: genId(),
        elType: 'widget',
        widgetType: 'image',
        isInner: false,
        settings: {
          image: { 
            url: CONFIG.logoUrl, 
            id: '', size: '', alt: CONFIG.logoAlt, source: 'library' 
          },
          image_size: 'full',
          width: { unit: '%', size: 100, sizes: [] }, // 100% of the 220px container
          link_to: 'custom',
          link: { url: '/', is_external: '', nofollow: '' }
        },
        elements: []
      }
    ]
  });

  // 2. Nav-Menu Container
  navElements.push({
    id: genId(),
    elType: 'container',
    isInner: true,
    settings: {
      content_width: 'full',
      flex_direction: 'row',
      flex_justify_content: 'center',
      flex_align_items: 'center',
      flex_grow: 1, // Take remaining space
    },
    elements: [
      {
        id: genId(),
        elType: 'widget',
        widgetType: 'nav-menu',
        isInner: false,
        settings: {
          layout: 'horizontal',
          align_items: 'center',
          pointer: 'underline',
          typography_typography: 'custom',
          typography_font_family: CONFIG.fonts.headline,
          typography_font_size: { unit: 'px', size: 15, sizes: [] },
          typography_font_weight: '700',
          color_menu_item: '#cbd5e1',
          color_menu_item_hover: '#8FDA3E',
          pointer_color: '#8FDA3E'
        },
        elements: []
      }
    ]
  });

  // 3. CTA Button Container
  navElements.push({
    id: genId(),
    elType: 'container',
    isInner: true,
    settings: {
      content_width: 'full',
      width: { unit: 'px', size: 180, sizes: [] },
      flex_direction: 'row',
      flex_justify_content: 'flex-end',
      flex_align_items: 'center',
    },
    elements: [
      buildButton('WHATSAPP', CONFIG.whatsappUrl || '#', {
        background_color: CONFIG.colors.primaryDark,
        button_text_color: '#FFFFFF',
        typography_font_family: CONFIG.fonts.headline,
        typography_font_weight: '700',
        typography_font_size: { unit: 'px', size: 14, sizes: [] },
        border_radius: { unit: 'px', top: 4, right: 4, bottom: 4, left: 4 },
      })
    ]
  });

  return [buildContainer(
    {
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1200, sizes: [] },
      background_background: 'classic',
      background_color: 'rgba(11, 15, 26, 0.95)',
      flex_direction: 'row',
      flex_justify_content: 'space-between',
      flex_align_items: 'center',
      padding: buildDimension(15, 30, 15, 30),
      margin: buildDimension(0, 0, 0, 0),
      position: 'fixed'
    },
    navElements, false
  )];
}

/** Process footer → Footer template */
function processFooterTemplate(htmlStr) {
  const $ = cheerio.load(htmlStr, { decodeEntities: false });
  $('.material-symbols-outlined').remove();
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
  return content;
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
  console.log('║  COMPILER V4 — stitch2elementor                   ║');
  console.log(`║  Design: ${CONFIG.fonts.headline} + ${CONFIG.fonts.body}`.padEnd(51) + '║');
  console.log('║  HTML → Native Elementor JSON (Batch Compiler)   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const manifestData = await fs.promises.readFile(CONFIG.manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData);
  const pages = manifest.pages || manifest;
  let successCount = 0;
  let errorCount = 0;
  let totalErrors = 0;

  // Read homepage once for both Header and Footer extraction
  let homepageHtml;
  try {
    homepageHtml = await fs.promises.readFile(path.join(CONFIG.inputDir, 'homepage.html'), 'utf8');
  } catch (err) {
    console.error(`  ❌ Cannot read homepage.html: ${err.message}`);
    errorCount += 2;
  }

  if (homepageHtml) {
    // Process Header
    console.log('📋 Processing Header template...');
    try {
      const headerContent = processNavAsHeader(homepageHtml);
      const headerPath = path.join(CONFIG.outputDir, 'header.json');
      await fs.promises.writeFile(headerPath, JSON.stringify(headerContent), 'utf8');
      console.log(`  ✅ Header → ${path.basename(headerPath)} (${countNodes(headerContent)} nodes)`);
    } catch (err) {
      console.error(`  ❌ Header: ${err.message}`);
      errorCount++;
    }

    // Process Footer
    console.log('📋 Processing Footer template...');
    try {
      const footerContent = processFooterTemplate(homepageHtml);
      const footerPath = path.join(CONFIG.outputDir, 'footer.json');
      await fs.promises.writeFile(footerPath, JSON.stringify(footerContent), 'utf8');
      console.log(`  ✅ Footer → ${path.basename(footerPath)} (${countNodes(footerContent)} nodes)`);
    } catch (err) {
      console.error(`  ❌ Footer: ${err.message}`);
      errorCount++;
    }
  }

  // Process all pages concurrently
  console.log('\n📄 Processing pages...\n');
  const results = await Promise.all(pages.map(async (page) => {
    const htmlFile = page.html;
    const jsonFile = page.json;
    if (!htmlFile || !jsonFile) {
      console.log(`  ⚠️  Skipping page without html/json fields: ${JSON.stringify(page)}`);
      return { status: 'skipped' };
    }

    const inputPath = path.join(CONFIG.inputDir, htmlFile);
    const outputPath = path.join(CONFIG.outputDir, jsonFile);

    try {
      try { await fs.promises.access(inputPath); } catch (e) {
        console.log(`  ⚠️  ${htmlFile} — NOT FOUND, skipping`);
        return { status: 'skipped' };
      }

      const html = await fs.promises.readFile(inputPath, 'utf8');
      let content = htmlToElementorContent(html);
      
      // Validate
      const validationErrors = validateElementorJSON(content);
      if (validationErrors.length > 0) {
        console.log(`  ⚠️  ${htmlFile} — ${validationErrors.length} validation warnings:`);
        validationErrors.slice(0, 3).forEach(e => console.log(`      ${e}`));
      }
      
      // Output content array (for _elementor_data)
      await fs.promises.writeFile(outputPath, JSON.stringify(content), 'utf8');
      
      const nodeCount = countNodes(content);
      const fileStat = await fs.promises.stat(outputPath);
      const fileSize = Math.round(fileStat.size / 1024);
      console.log(`  ✅ ${htmlFile.padEnd(35)} → ${jsonFile.padEnd(35)} (${nodeCount} nodes, ${fileSize}KB)`);
      
      return { status: 'success', warnings: validationErrors.length };
    } catch (err) {
      console.error(`  ❌ ${htmlFile}: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }));

  // Aggregate results
  results.forEach(res => {
    if (res.status === 'success') {
      successCount++;
      totalErrors += res.warnings;
    } else if (res.status === 'error') {
      errorCount++;
    }
  });

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
