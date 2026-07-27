/**
 * ORCHESTRATOR GO! — Full Pipeline: Stitch → Download HTML → Compile → Generate PHP Payloads
 * Phase 1: Download all 20 HTML files from Stitch
 * Phase 2: Extract images, download, build replacement map
 * Phase 3: Compile HTML → Elementor JSON with image replacements
 * Phase 4: Generate inject_all_pages.php + v9_json_payloads/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const BASE_DIR = __dirname;
const ASSETS_DIR = path.join(BASE_DIR, 'assets_originales');
const OUTPUT_DIR = path.join(BASE_DIR, 'elementor_jsons');
const FOTOS_DIR = path.join(BASE_DIR, 'fotos_web');
const LOGS_DIR = path.join(BASE_DIR, 'logs');

// Ensure directories exist
[ASSETS_DIR, OUTPUT_DIR, FOTOS_DIR, LOGS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ============================================================
// SCREEN → PAGE MAPPING (Stitch Screen ID → Clean filename & WP ID)
// ============================================================
const SCREEN_MAP = [
  { screenId: '6666fb3e979048b4821c0caa570cf793', html: 'homepage.html', json: 'homepage.json', wp_id: 299, slug: 'homepage', title: 'Evergreen Venezuela', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I4NTI4NzA2ZDFmYzQ1ZWRiNjBiY2MzZjcxZmM4NTRmEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=89354086' },
  { screenId: '252815735ea54a3392e89b48b1924524', html: 'soluciones-de-energia.html', json: 'soluciones-de-energia.json', wp_id: 311, slug: 'soluciones-de-energia', title: 'Soluciones de Energía', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzdjMTIyY2Y5NGM3ZTRiYTRhNzc1OTEzNmJjNmZiNjE3EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'f4310d39cf9d4b94af803dded95be133', html: 'estaciones-de-energia-portatiles.html', json: 'estaciones-de-energia-portatiles.json', wp_id: 297, slug: 'estaciones-de-energia-portatiles', title: 'Estaciones de Energía Portátiles', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2UxNTEwOWI5ZTVhYTQxYmVhN2RhMjkwOGFmZjVlMzk2EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'f4c58bf8bf6747558d9cf4b8a5c6e07f', html: 'respaldo-energetico-residencial.html', json: 'respaldo-energetico-residencial.json', wp_id: 309, slug: 'respaldo-energetico-residencial', title: 'Respaldo Energético Residencial', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzYxM2MwYjczYzM3NjQ4ZmU4MzQ1NjJmNDYxNjc2OGJhEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'a8a33a66cb9f4d4c9399155f98c9e7f3', html: 'respaldo-energetico-comercial.html', json: 'respaldo-energetico-comercial.json', wp_id: 308, slug: 'respaldo-energetico-industrial', title: 'Respaldo Energético Comercial e Industrial', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk3OTYyNDBlODI3MTQyZTBiZmQ5NzEwNjc4MDM0YjhjEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '6181904c2f7b4a6793e859539e428f92', html: 'baterias-de-energia-solar.html', json: 'baterias-de-energia-solar.json', wp_id: 293, slug: 'baterias-de-energia-solar', title: 'Baterías de Energía Solar', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzEwMGZiMGJkYTVjMDRiMDQ5ZjNkYzUxNzE0NjliN2ExEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'a8b74545ad994339b14384947de30af2', html: 'paneles-solares.html', json: 'paneles-solares.json', wp_id: 305, slug: 'paneles-solares', title: 'Paneles Solares', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAzYmUzMmQ1YzhkMjRkYzRiYWUzM2VjYWVjMmZiYmU5EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '73d11309a4f44573ac599a792b87fdf5', html: 'iluminacion.html', json: 'iluminacion.json', wp_id: 302, slug: 'iluminacion', title: 'Iluminación', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzJiNGYyY2RlMDlhYzQzNjRhNGEzZTNkNDQyN2VjYWRkEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '4ce4a6e08485430293ae7acb6360e907', html: 'iluminacion-led-solar.html', json: 'iluminacion-led-solar.json', wp_id: 301, slug: 'iluminacion-led-solar', title: 'Iluminación LED Solar', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MyNjA1OTRmM2I2NjQzYzM4NThmY2VlNTRjYWU1NDNiEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '4ebc20bf475c47c78d058f59862346ec', html: 'iluminacion-convencional.html', json: 'iluminacion-convencional.json', wp_id: 300, slug: 'iluminacion-convencional', title: 'Iluminación Convencional', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzFlMzU0NmFkNmU0ZjQ0NDE4N2Y3OWQxNTEzNDdhYTE1EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '65cbc1044f12449ca3f3afee1017209a', html: 'jump-starters-arrancadores.html', json: 'jump-starters-arrancadores.json', wp_id: 303, slug: 'jump-starters-arrancadores', title: 'Jump Starters Arrancadores', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2QyMjZjMDUxZTZiMzRmY2I4MjY2NWQyMzE1NmFhOWJkEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'a3a968ddab0745a98a905dd92c6387e5', html: 'calculadora-de-consumo-energetico.html', json: 'calculadora-de-consumo-energetico.json', wp_id: 295, slug: 'calculadora-de-consumo-energetico', title: 'Calculadora de Consumo Energético', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2QwMThhMmFjYTA0ODRhNmU5NTFiOTg4MDgzOWMxNWNjEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '7ca7a6cf9830481ab0a56b59e6813480', html: 'catalogos-y-recursos.html', json: 'catalogos-y-recursos.json', wp_id: 296, slug: 'catalogos-y-recursos', title: 'Catálogos y Recursos', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgyNGRkZTM1ZTdjNTRkMjA5M2RhMmE2ZDg0NzdmMzVmEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '0e4463d21eff4c28aa91791f324426fe', html: 'sobre-nosotros.html', json: 'sobre-nosotros.json', wp_id: 310, slug: 'sobre-nosotros', title: 'Sobre Nosotros', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgwYTRhMmQzNzFmMjRiMTI4ZmNiZWI4ZDQzOTI3YzU1EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '9bda670e636242aebc719c49ed2cae74', html: 'blog-articulos-y-noticias.html', json: 'blog-articulos-y-noticias.json', wp_id: 294, slug: 'blog', title: 'Blog Artículos y Noticias', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y5YWM3NTYwN2EwMzQ5YTg4YTZjNjM0OTRlNjVhZTUyEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '2002509e1b404e29a6aa8d4e0ea7ba2a', html: 'financiamiento.html', json: 'financiamiento.json', wp_id: 298, slug: 'financiamiento', title: 'Financiamiento', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQzMGM5MGQ3ZjQ2OTRkNWY5YWY5MjUyOWQzZDVmYjk2EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: '4543647c39ec48a2837369d8e4a2c4bd', html: 'contacto.html', json: 'contacto.json', wp_id: 304, slug: 'contacto', title: 'Página de Contacto', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI3MmY3OTVkMGZiMjQzZWI4NTI0MzEyM2Q4Y2JmYTE5EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'bdb3c833e3c647479f4708e81f404a79', html: 'soporte-y-garantia.html', json: 'soporte-y-garantia.json', wp_id: 312, slug: 'soporte-y-garantia', title: 'Soporte y Garantía', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE5NWEyZTdmM2VjYTQ1YTlhNmZmNjg4ZWE1Y2RkY2Y0EgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'ec8f42811e364b7fbc6314df81731017', html: 'politica-de-privacidad.html', json: 'politica-de-privacidad.json', wp_id: 307, slug: 'politica-de-privacidad', title: 'Política de Privacidad', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzY3Mjg5MjRmYzRiZTRkZjFiODkyNWM1NTQ3YTNiMDgzEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
  { screenId: 'e07aa8ba99204c7d84dc1d700b9e7746', html: 'politica-de-cookies.html', json: 'politica-de-cookies.json', wp_id: 306, slug: 'politica-de-cookies', title: 'Política de Cookies', downloadUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzFjOWViYjdiMDQ1ZjQ0YjY5MjA4NjEwYzBlNmE4ZjIxEgsSBxDj1MWL0B4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDAzMjk5ODE4Njk3NDMyNDUzMQ&filename=&opi=96797242' },
];

// ============================================================
// PHASE 1: Download all HTMLs from Stitch
// ============================================================
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const request = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve(destPath); });
      fileStream.on('error', reject);
    });
    request.on('error', reject);
    request.setTimeout(30000, () => { request.destroy(); reject(new Error('Timeout')); });
  });
}

async function phase1_downloadHTMLs() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  PHASE 1: Downloading HTMLs from Stitch          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let success = 0, fail = 0;
  for (const page of SCREEN_MAP) {
    const dest = path.join(ASSETS_DIR, page.html);
    try {
      await downloadFile(page.downloadUrl, dest);
      const stat = fs.statSync(dest);
      console.log(`  ✅ ${page.html.padEnd(45)} (${Math.round(stat.size/1024)}KB)`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${page.html}: ${err.message}`);
      fail++;
    }
  }
  console.log(`\n📊 Downloaded: ${success} success, ${fail} failed\n`);
  return { success, fail };
}

// ============================================================
// PHASE 2: Extract unique image URLs from all HTMLs
// ============================================================
function phase2_extractImageUrls() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  PHASE 2: Extracting Stitch Image URLs           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const imageUrls = new Set();
  const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.html'));
  
  for (const file of files) {
    const html = fs.readFileSync(path.join(ASSETS_DIR, file), 'utf8');
    // Match lh3.googleusercontent.com image URLs
    const matches = html.match(/https?:\/\/lh3\.googleusercontent\.com\/[^\s"'<>)]+/g) || [];
    matches.forEach(url => {
      // Clean up URL (remove trailing quotes, etc.)
      const clean = url.replace(/["'\\].*$/, '').replace(/&amp;/g, '&');
      imageUrls.add(clean);
    });
  }

  console.log(`  📸 Found ${imageUrls.size} unique Stitch image URLs across ${files.length} HTML files\n`);
  
  // Save the image URL list for external processing
  const urlList = Array.from(imageUrls);
  fs.writeFileSync(path.join(LOGS_DIR, 'stitch_image_urls.json'), JSON.stringify(urlList, null, 2));
  console.log(`  💾 Saved URL list to logs/stitch_image_urls.json`);
  
  return urlList;
}

// ============================================================
// PHASE 3: Update page_manifest.json for compiler
// ============================================================
function phase3_updateManifest() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  PHASE 3: Updating page_manifest.json            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const manifest = {
    pages: SCREEN_MAP.map(p => ({
      html: p.html,
      json: p.json,
      wp_id: p.wp_id,
      slug: p.slug,
      title: p.title
    }))
  };

  const manifestPath = path.join(BASE_DIR, 'page_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  ✅ Updated page_manifest.json with ${manifest.pages.length} pages`);
  
  return manifest;
}

// ============================================================ 
// RUN
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ORCHESTRATOR GO! — Evergreen Full Migration     ║');
  console.log('║  Stitch → HTML → Elementor JSON → WordPress     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Phase 1: Download HTMLs
  const dlResult = await phase1_downloadHTMLs();
  if (dlResult.fail > 0) {
    console.log(`⚠️  ${dlResult.fail} downloads failed. Check logs.`);
  }

  // Phase 2: Extract image URLs
  const imageUrls = phase2_extractImageUrls();

  // Phase 3: Update manifest
  phase3_updateManifest();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ PHASE 1-3 COMPLETE');
  console.log(`   HTMLs downloaded: ${dlResult.success}`);
  console.log(`   Unique images found: ${imageUrls.length}`);
  console.log('   Next: Run compiler_v4.js, then image processing');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
