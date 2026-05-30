import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const footerPath = path.join(ROOT, 'elementor_jsons/footer.json');

if (!fs.existsSync(footerPath)) {
  console.error('❌ Footer JSON not found!');
  process.exit(1);
}

let footerContent = fs.readFileSync(footerPath, 'utf8');

// Replacements map
const replacements = [
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Inicio</a>', replace: '<a href=\\"/\\" style=\\"color:#1D8A43;text-decoration:none\\">Inicio</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Convencional</a>', replace: '<a href=\\"/iluminacion-led-convencional/\\" style=\\"color:#1D8A43;text-decoration:none\\">Convencional</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Solar</a>', replace: '<a href=\\"/iluminacion-solar-autonoma/\\" style=\\"color:#1D8A43;text-decoration:none\\">Solar</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Catálogo</a>', replace: '<a href=\\"/catalogo/\\" style=\\"color:#1D8A43;text-decoration:none\\">Catálogo</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Nosotros</a>', replace: '<a href=\\"/nosotros/\\" style=\\"color:#1D8A43;text-decoration:none\\">Nosotros</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Blog</a>', replace: '<a href=\\"/blog/\\" style=\\"color:#1D8A43;text-decoration:none\\">Blog</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Contacto</a>', replace: '<a href=\\"/contacto/\\" style=\\"color:#1D8A43;text-decoration:none\\">Contacto</a>' },
  { search: '<a href=\\"#\\" style=\\"color:#1D8A43;text-decoration:none\\">Políticas de Privacidad</a>', replace: '<a href=\\"/politicas-de-privacidad/\\" style=\\"color:#1D8A43;text-decoration:none\\">Políticas de Privacidad</a>' }
];

let replacedCount = 0;
for (const r of replacements) {
  if (footerContent.includes(r.search)) {
    footerContent = footerContent.replace(r.search, r.replace);
    replacedCount++;
  } else {
    // Try without escaping style quotes if they differ
    console.log(`⚠️ Search string not found: ${r.search.substring(0, 50)}...`);
  }
}

fs.writeFileSync(footerPath, footerContent, 'utf8');
console.log(`✅ Success: elementor_jsons/footer.json updated. Replaced ${replacedCount} links.`);
