const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'stitch_images_report.json');
const JSON_DIR = path.join(__dirname, 'elementor_json');

const POOL_URLS = {
  solar_res: 'https://evergreenvzla.com/wp-content/uploads/2026/04/casa_moderna_paneles_solares.webp',
  solar_com: 'https://evergreenvzla.com/wp-content/uploads/2026/04/edificio_paneles_solares.webp',
  solar_install: 'https://evergreenvzla.com/wp-content/uploads/2026/04/operario_perforando.webp',
  light_solar: 'https://evergreenvzla.com/wp-content/uploads/2026/04/alumbrado_publico_solar_residencial.webp',
  backup_com: 'https://evergreenvzla.com/wp-content/uploads/2026/04/estacion_energia_telecomunicaciones_4x4.webp',
  backup_res: 'https://evergreenvzla.com/wp-content/uploads/2026/04/bateria_pared_interior_residencial.webp',
  portable_camp: 'https://evergreenvzla.com/wp-content/uploads/2026/04/powerstation_2400w_exterior_lago_naturaleza.webp',
  portable_prod: 'https://evergreenvzla.com/wp-content/uploads/2026/04/powerstation_1200w_frontal_controles_evergreen.webp',
  jump_starter: 'https://evergreenvzla.com/wp-content/uploads/2026/04/jump_starter_1200_demo_motor_manos.png',
  light_conv: 'https://evergreenvzla.com/wp-content/uploads/2026/04/iglesia_plaza_noche.webp',
  light_bulb: 'https://evergreenvzla.com/wp-content/uploads/2026/04/bombillo_t80_led_20w_encendido_colgante.webp',
  inverter: 'https://evergreenvzla.com/wp-content/uploads/2026/04/inversor_5000w_limpio_estudio.webp',
  family_blog: 'https://evergreenvzla.com/wp-content/uploads/2026/04/familia_casa_paneles_solares.webp',
  industry: 'https://evergreenvzla.com/wp-content/uploads/2026/04/trabajador_taladrando_hormigon.webp'
};

function matchImageId(pageName, altText) {
  const txt = (pageName + ' ' + altText).toLowerCase();
  
  if (txt.includes('camping') || txt.includes('portable') || txt.includes('outdoor')) return 'portable_camp';
  if (txt.includes('jump')) return 'jump_starter';
  if (txt.includes('led') || txt.includes('bulb') || txt.includes('tubo') || txt.includes('light comparison')) return 'light_bulb';
  if (txt.includes('solar lighting') || txt.includes('farola') || txt.includes('luminaria') || txt.includes('parques')) return 'light_solar';
  if (txt.includes('reflector') || txt.includes('convencional') || txt.includes('industrial led') || txt.includes('high bay')) return 'light_conv';
  if (txt.includes('bater') || txt.includes('battery') || txt.includes('residencial backup')) return 'backup_res';
  if (txt.includes('ups') || txt.includes('comercial') || txt.includes('logística')) return 'backup_com';
  if (txt.includes('instal') || txt.includes('taladran')) return 'solar_install';
  if (txt.includes('inversor')) return 'inverter';
  if (txt.includes('famil')) return 'family_blog';
  if (txt.includes('industr')) return 'industry';
  if (txt.includes('eg-')) return 'portable_prod';
  
  if (txt.includes('panel') || txt.includes('solar')) return 'solar_res';
  
  // Default fallbacks based on page
  if (pageName.includes('estaciones')) return 'portable_prod';
  if (pageName.includes('paneles')) return 'solar_res';
  if (pageName.includes('blog')) return 'family_blog';
  
  return 'solar_res'; 
}

function processElementReplacesContextual(element, pageName) {
  if (!element) return;
  
  // Image
  if (element.widgetType === 'image' && element.settings && element.settings.image) {
    const url = element.settings.image.url || '';
    if (url.includes('lh3.googleusercontent.com')) {
      const bestId = matchImageId(pageName, element.settings.image.alt || '');
      element.settings.image.url = POOL_URLS[bestId];
    }
  }

  // Background
  if (element.settings && element.settings.background_image && element.settings.background_image.url) {
    const bgUrl = element.settings.background_image.url;
    if (bgUrl.includes('lh3.googleusercontent.com')) {
      const bestId = matchImageId(pageName, 'background');
      element.settings.background_image.url = POOL_URLS[bestId];
    }
  }

  // HTML inline
  if (element.widgetType === 'html' && element.settings && element.settings.html) {
    let ht = element.settings.html;
    ht = ht.replace(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g, () => POOL_URLS[matchImageId(pageName, 'html fallback')]);
    element.settings.html = ht;
  }

  // Text editor
  if (element.widgetType === 'text-editor' && element.settings && element.settings.editor) {
    let ht = element.settings.editor;
    ht = ht.replace(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g, () => POOL_URLS[matchImageId(pageName, 'editor fallback')]);
    element.settings.editor = ht;
  }

  // Recurse
  if (element.elements && Array.isArray(element.elements)) {
    for (const child of element.elements) {
      processElementReplacesContextual(child, pageName);
    }
  }
}

console.log('🔄 Replacing temporary URLs in JSONs using MCP-uploaded URLs...');
const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

for (const entry of report) {
  const filePath = path.join(JSON_DIR, entry.file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    continue;
  }

  const pageName = entry.file.replace('.json', '');
  if (Array.isArray(data)) {
    data.forEach(el => processElementReplacesContextual(el, pageName));
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  console.log(`   ✅ Updated ${entry.file}`);
}
console.log('🎉 Done!');
