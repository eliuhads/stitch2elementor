/**
 * fix_material_symbols.js
 * Scans all Elementor JSON files and fixes Material Symbols rendered as text.
 * 
 * TWO fixes:
 * 1. Button text: "chat\n  Hablar con Experto" → "Hablar con Experto"
 *    (removes the Material Symbol name + whitespace from button text)
 * 2. HTML content: <span class="material-symbols-outlined ...">check_circle</span>
 *    → replaces with ✓ or removes entirely
 */

const fs = require('fs');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'elementor_jsons');

// Material Symbol names commonly found in the compiled JSONs
const MATERIAL_SYMBOLS = [
  'rocket_launch', 'arrow_forward', 'arrow_back', 'chat', 'add',
  'check_circle', 'visibility', 'flash_on', 'bolt', 'expand_more',
  'expand_less', 'close', 'phone', 'email', 'location_on', 'schedule',
  'star', 'trending_up', 'download', 'download_for_offline',
  'arrow_outward', 'open_in_new', 'chevron_right', 'chevron_left',
  'settings', 'security', 'verified', 'eco', 'solar_power',
  'battery_charging_full', 'lightbulb', 'electric_bolt', 'wb_sunny',
  'cloud_done', 'shield', 'support_agent', 'handshake', 'engineering',
  'construction', 'build', 'memory', 'monitor_heart', 'inventory_2',
  'local_shipping', 'storefront', 'factory', 'apartment', 'home',
  'place', 'call', 'mail', 'access_time', 'calendar_today',
  'play_arrow', 'pause', 'stop', 'info', 'warning', 'error',
  'help', 'delete', 'edit', 'save', 'share', 'favorite',
  'notifications', 'search', 'menu', 'more_vert', 'more_horiz'
];

// Unicode replacements for common symbols
const SYMBOL_REPLACEMENTS = {
  'check_circle': '✓',
  'arrow_forward': '→',
  'arrow_back': '←',
  'chevron_right': '›',
  'chevron_left': '‹',
  'star': '★',
  'close': '✕',
  'download': '↓',
  'expand_more': '▾',
  'expand_less': '▴',
  'phone': '📞',
  'email': '✉',
  'play_arrow': '▶',
};

let totalFixes = 0;
const fixLog = [];

function fixButtonText(text, filePath) {
  let fixed = text;
  // Pattern: "symbol_name\n   actual text" or "ACTUAL TEXT\n   symbol_name"
  for (const sym of MATERIAL_SYMBOLS) {
    // Symbol at the start: "chat\n                            Hablar con un Experto"
    const startPattern = new RegExp(`^${sym}\\s*\\n\\s*`, 'i');
    if (startPattern.test(fixed)) {
      const before = fixed;
      fixed = fixed.replace(startPattern, '');
      fixLog.push({ file: path.basename(filePath), type: 'button_start', before: before.substring(0, 60), after: fixed.substring(0, 60) });
      totalFixes++;
    }
    
    // Symbol at the end: "CALCULAR\n                        trending_up"
    const endPattern = new RegExp(`\\s*\\n\\s*${sym}$`, 'i');
    if (endPattern.test(fixed)) {
      const before = fixed;
      fixed = fixed.replace(endPattern, '');
      fixLog.push({ file: path.basename(filePath), type: 'button_end', before: before.substring(0, 60), after: fixed.substring(0, 60) });
      totalFixes++;
    }
    
    // Symbol standalone with arrow: "AGENDA TU EVALUACIÓN GRATUITA\n                        →"
    // This one is OK, keep the → 
  }
  return fixed;
}

function fixHtmlContent(html, filePath) {
  let fixed = html;
  
  // Pattern: <span class="material-symbols-outlined ...">symbol_name</span>
  const spanPattern = /<span\s+class="[^"]*material-symbols-outlined[^"]*"[^>]*>(\w+)<\/span>/gi;
  fixed = fixed.replace(spanPattern, (match, symbolName) => {
    const replacement = SYMBOL_REPLACEMENTS[symbolName] || '';
    fixLog.push({ file: path.basename(filePath), type: 'html_span', symbol: symbolName, replacement: replacement || '(removed)' });
    totalFixes++;
    return replacement;
  });
  
  // Pattern: standalone Material Symbol names in anchor text like "DESCARGAR GUÍA download"
  for (const sym of MATERIAL_SYMBOLS) {
    const textPattern = new RegExp(`\\b${sym}\\b`, 'g');
    // Only fix if it's inside an <a> tag or similar context and the sym is a common one
    if (['download', 'chat', 'arrow_forward', 'open_in_new', 'arrow_outward'].includes(sym)) {
      const anchorPattern = new RegExp(`(>)([^<]*?)\\b${sym}\\b([^<]*?<)`, 'g');
      const newHtml = fixed.replace(anchorPattern, (match, open, before, after) => {
        fixLog.push({ file: path.basename(filePath), type: 'inline_text', symbol: sym });
        totalFixes++;
        return `${open}${before.trimEnd()}${after}`;
      });
      fixed = newHtml;
    }
  }
  
  return fixed;
}

function processElement(element, filePath) {
  if (!element) return;
  
  // Fix button widgets
  if (element.widgetType === 'button' && element.settings && element.settings.text) {
    element.settings.text = fixButtonText(element.settings.text, filePath);
  }
  
  // Fix text-editor widgets
  if (element.widgetType === 'text-editor' && element.settings && element.settings.editor) {
    element.settings.editor = fixHtmlContent(element.settings.editor, filePath);
  }
  
  // Recurse into children
  if (element.elements && Array.isArray(element.elements)) {
    for (const child of element.elements) {
      processElement(child, filePath);
    }
  }
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.log(`⚠ Skipping ${path.basename(filePath)} — invalid JSON`);
    return;
  }
  
  const beforeFixes = totalFixes;
  
  if (Array.isArray(data)) {
    for (const el of data) {
      processElement(el, filePath);
    }
  }
  
  const fixesMade = totalFixes - beforeFixes;
  if (fixesMade > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    console.log(`✅ ${path.basename(filePath)} — ${fixesMade} fixes`);
  } else {
    console.log(`  ${path.basename(filePath)} — clean`);
  }
}

// Main
console.log('🔧 Scanning Elementor JSONs for Material Symbols...\n');

const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
for (const file of files) {
  processFile(path.join(JSON_DIR, file));
}

console.log(`\n📊 Total fixes: ${totalFixes}`);
if (fixLog.length > 0) {
  console.log('\n📝 Fix Log:');
  for (const log of fixLog) {
    if (log.type.startsWith('button')) {
      console.log(`  [${log.file}] ${log.type}: "${log.before}" → "${log.after}"`);
    } else if (log.type === 'html_span') {
      console.log(`  [${log.file}] Replaced <span>${log.symbol}</span> → "${log.replacement}"`);
    } else {
      console.log(`  [${log.file}] Removed inline "${log.symbol}"`);
    }
  }
}
