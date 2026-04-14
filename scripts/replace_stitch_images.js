/**
 * replace_stitch_images.js
 * Scans Elementor JSON files, uploads lh3.googleusercontent.com images to WP Media Library,
 * and writes stitch_images_report.json with the replacement map.
 * 
 * Usage: WP_URL=https://your-domain.com WP_USER=admin WP_APP_PASSWORD="xxxx xxxx xxxx" node replace_stitch_images.js
 */
const fs = require('fs');
const path = require('path');
const { WP_URL, AUTH, https } = require('./utils/wp-api');
const JSON_DIR = path.join(__dirname, '..', 'elementor_json');
const REPORT_PATH = path.join(__dirname, '..', 'stitch_images_report.json');

// Curated pool of images to use for replacements
const LOCAL_POOL = [
  { id: 'solar_res', path: 'FOTOS AI GENERATED/casa_moderna_paneles_solares.webp' },
  { id: 'solar_com', path: 'FOTOS AI GENERATED/edificio_paneles_solares.webp' },
  { id: 'solar_install', path: 'FOTOS AI GENERATED/operario_perforando.webp' },
  { id: 'light_solar', path: 'callto action WEBP/alumbrado_publico_solar_residencial.webp' },
  { id: 'backup_com', path: 'callto action WEBP/estacion_energia_telecomunicaciones_4x4.webp' },
  { id: 'backup_res', path: 'callto action WEBP/bateria_pared_interior_residencial.webp' },
  { id: 'portable_camp', path: 'WOOCOMMERCE PRODUCTS/POWERSTATION 2400W/powerstation_2400w_exterior_lago_naturaleza.webp' },
  { id: 'portable_prod', path: 'WOOCOMMERCE PRODUCTS/POWERSTATION 1200W/powerstation_1200w_frontal_controles_evergreen.webp' },
  { id: 'jump_starter', path: 'WOOCOMMERCE PRODUCTS/JUMP STARTER 1200/jump_starter_1200_demo_motor_manos.png' },
  { id: 'light_conv', path: 'FOTOS AI GENERATED/iglesia_plaza_noche.webp' },
  { id: 'light_bulb', path: 'WOOCOMMERCE PRODUCTS/BOMBILLO T80/bombillo_t80_led_20w_encendido_colgante.webp' },
  { id: 'inverter', path: 'WOOCOMMERCE PRODUCTS/INVERSOR 5000W/inversor_5000w_limpio_estudio.webp' },
  { id: 'family_blog', path: 'FOTOS AI GENERATED/familia_casa_paneles_solares.webp' },
  { id: 'industry', path: 'FOTOS AI GENERATED/trabajador_taladrando_hormigon.webp' }
];

// Fallback pool mapped URLs
const POOL_URLS = {};

function uploadMedia(fileObj) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, 'IMAGENES_FUENTES', fileObj.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${fullPath}`);
      return resolve(null);
    }

    const fileName = path.basename(fullPath);
    const contentType = fileName.endsWith('.png') ? 'image/png' : 'image/webp';
    const content = fs.readFileSync(fullPath);

    const url = new URL(`${WP_URL}/wp-json/wp/v2/media`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': contentType,
        'Content-Length': content.length,
        'User-Agent': 'EvergreenBot/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 201 && parsed.source_url) {
            resolve(parsed.source_url);
          } else {
            console.log(`❌ WP API Error on ${fileName}:`, parsed.message || res.statusCode);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

// Map keywords in ALT text or Page name to a Pool ID
function matchImageId(pageName, altText) {
  const txt = (pageName + ' ' + altText).toLowerCase();
  
  if (txt.includes('camping') || txt.includes('portable') || txt.includes('outdoor')) return 'portable_camp';
  if (txt.includes('jump')) return 'jump_starter';
  if (txt.includes('led') || txt.includes('bulb') || txt.includes('light comparison')) return 'light_bulb';
  if (txt.includes('solar lighting') || txt.includes('farola') || txt.includes('parques')) return 'light_solar';
  if (txt.includes('reflector') || txt.includes('convencional') || txt.includes('industrial led')) return 'light_conv';
  if (txt.includes('bater') || txt.includes('battery') || txt.includes('residencial backup')) return 'backup_res';
  if (txt.includes('ups') || txt.includes('comercial') || txt.includes('logística')) return 'backup_com';
  if (txt.includes('instal') || txt.includes('taladran')) return 'solar_install';
  if (txt.includes('panel') || txt.includes('solar')) return 'solar_res';
  if (txt.includes('inversor')) return 'inverter';
  if (txt.includes('famil')) return 'family_blog';
  if (txt.includes('industr')) return 'industry';
  if (txt.includes('eg-')) return 'portable_prod';
  
  // Default fallbacks based on page
  if (pageName.includes('estaciones')) return 'portable_prod';
  if (pageName.includes('paneles')) return 'solar_res';
  if (pageName.includes('blog')) return 'family_blog';
  
  return 'solar_res'; // ultimate fallback
}

function processElementReplaces(element, urlsMap) {
  if (!element) return;
  
  // Image widget
  if (element.widgetType === 'image' && element.settings && element.settings.image) {
    const url = element.settings.image.url || '';
    if (url.includes('lh3.googleusercontent.com')) {
      const bestId = matchImageId('', element.settings.image.alt || '');
      element.settings.image.url = POOL_URLS[bestId] || POOL_URLS['solar_res'];
    }
  }

  // Background image on containers
  if (element.settings && element.settings.background_image && element.settings.background_image.url) {
    const bgUrl = element.settings.background_image.url;
    if (bgUrl.includes('lh3.googleusercontent.com')) {
      const bestId = matchImageId('', 'background');
      element.settings.background_image.url = POOL_URLS[bestId] || POOL_URLS['solar_res'];
    }
  }

  // Inline HTML replacements (Crude but effective)
  if (element.widgetType === 'html' && element.settings && element.settings.html) {
    let ht = element.settings.html;
    ht = ht.replace(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g, () => POOL_URLS['solar_res']);
    element.settings.html = ht;
  }

  if (element.widgetType === 'text-editor' && element.settings && element.settings.editor) {
    let ht = element.settings.editor;
    ht = ht.replace(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g, () => POOL_URLS['solar_res']);
    element.settings.editor = ht;
  }

  // Recurse
  if (element.elements && Array.isArray(element.elements)) {
    for (const child of element.elements) {
      processElementReplaces(child, urlsMap);
    }
  }
}

async function main() {
  console.log('🚀 Starting Smart Substitution for Stitch Images...\n');

  // 1. Upload Pool
  console.log('📦 Uploading image pool to WordPress...');
  for (const media of LOCAL_POOL) {
    console.log(`   - Uploading ${media.id}...`);
    const uploadedUrl = await uploadMedia(media);
    if (uploadedUrl) {
      POOL_URLS[media.id] = uploadedUrl;
      console.log(`     ✅ ${uploadedUrl}`);
    } else {
      console.log(`     ⚠ Failed. Using generic fallback.`);
    }
  }

  // 2. Load Report
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('❌ stitch_images_report.json not found!');
    return;
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

  // 3. Process each JSON
  console.log('\n🔄 Replacing temporary URLs in JSONs...');
  for (const entry of report) {
    const filePath = path.join(JSON_DIR, entry.file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      continue;
    }

    if (Array.isArray(data)) {
      data.forEach(el => processElementReplaces(el, POOL_URLS));
    }
    
    // Specifically override mappings based on page name
    const pageName = entry.file.replace('.json', '');
    data.forEach(el => processElementReplacesContextual(el, pageName));

    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    console.log(`   ✅ Updated ${entry.file} (${entry.count} images replaced)`);
  }

  console.log('\n🎉 All Stitch Images Replaced Successfully!');
}

function processElementReplacesContextual(element, pageName) {
  if (!element) return;
  if (element.widgetType === 'image' && element.settings && element.settings.image) {
    const url = element.settings.image.url || '';
    // If it was just replaced, we can refine it using the Page context if needed
    // Already replaced in the first pass! But let's ensure text matcher works here
    if (POOL_URLS) {
      const bestId = matchImageId(pageName, element.settings.image.alt || '');
      element.settings.image.url = POOL_URLS[bestId] || POOL_URLS['solar_res'];
    }
  }

  if (element.elements && Array.isArray(element.elements)) {
    for (const child of element.elements) {
      processElementReplacesContextual(child, pageName);
    }
  }
}

main();
