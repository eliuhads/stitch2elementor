import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// JSON files to patch (we can do all of them, or just homepage first)
const jsonFiles = [
  'homepage.json',
  'apliques-led.json',
  'blog.json',
  'bombillos-led.json',
  'catalogo.json',
  'contacto.json',
  'downlights-led.json',
  'iluminacion-convencional.json',
  'iluminacion-solar.json',
  'luminarias-industriales.json',
  'nosotros.json',
  'paneles-led.json',
  'reflectores-led.json',
  'tiras-led.json',
  'tubos-led.json'
];

function patchElements(elements) {
  if (!Array.from(elements)) return;
  elements.forEach(el => {
    if (el.elType === 'container' && el.isInner === true) {
      const s = el.settings || {};
      if (s.background_color === '#FFFFFF' || s.background_color === '#ffffff') {
        s._css_classes = 'evergreen-card';
        console.log(`  ✨ Added evergreen-card to container ID: ${el.id}`);
      }
    }
    if (el.elements && Array.isArray(el.elements)) {
      patchElements(el.elements);
    }
  });
}

function main() {
  console.log('━━━ Patching Elementor JSON Templates ━━━\n');
  jsonFiles.forEach(file => {
    const filePath = path.join(ROOT, 'elementor_jsons', file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${file}`);
      return;
    }
    
    console.log(`Reading ${file}...`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    patchElements(content);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`💾 Saved ${file}\n`);
  });
  console.log('✅ All templates successfully patched!');
}

main();
