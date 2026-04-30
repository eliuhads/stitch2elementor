#!/usr/bin/env node
/**
 * fix_all_solar_v2.mjs
 * ─────────────────────
 * Approach: FTP+PHP para actualizar _elementor_data directamente en la DB
 * para TODAS las páginas afectadas, eliminando caché de Elementor.
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const WP_URL  = process.env.WP_URL;
const WP_USER = process.env.WP_USER;
const WP_PASS = process.env.WP_APP_PASSWORD?.replace(/"/g, '');
const AUTH = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const headers = { 'Authorization': AUTH, 'Content-Type': 'application/json' };

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER_FTP = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET || process.env.WP_SCRIPT_TOKEN;

// Pages to fix
const PAGES = [1668, 1666, 1665, 1660];
// Home page - need to discover ID
const HOME_SLUG = '';

// All solar terms to replace (applied as string replacements on raw JSON)
const REPLACEMENTS = [
  // === Page 1668 (FAQ) — these were written via REST but cache may persist ===
  ['¿Qué garantía ofrecen en sistemas solares fotovoltaicos?', '¿Qué garantía ofrecen en sus luminarias LED industriales?'],
  ['garantía estructural de 10 años y una garantía de rendimiento lineal de hasta 25 años en paneles solares monocristalinos', 'garantía de 5 años y rendimiento certificado de hasta 50,000 horas en todas nuestras luminarias LED industriales, respaldadas por drivers de grado industrial'],
  ['Industrial Solar Panel', 'Luminaria LED Industrial'],

  // === Page 1666 (Proyectos) ===
  ['Granja Solar El Tocuyo', 'Iluminación Industrial El Tocuyo'],
  ['Solar El Tocuyo', 'LED Industrial El Tocuyo'],
  ['infraestructura solar fotovoltaica para el sector agroindustrial, generando energía limpia y constante', 'luminarias LED de alta potencia para el sector agroindustrial, reduciendo costos operativos y mejorando la visibilidad en plantas de procesamiento'],
  // Tab button
  ['>Solar<', '>Alumbrado<'],
  
  // === Page 1665 (Distribuidores) ===
  ['PZO SOLAR', 'PZO LED CENTER'],
  ['PZO Solar', 'PZO LED Center'],
  ['Pzo Solar', 'PZO LED Center'],
  ['soluciones LED y energía solar', 'soluciones de iluminación LED industrial'],
  
  // === Page 1660 (Catálogo) ===
  ['Paneles solares diseñados bajo especificaciones militares para resistir y generar en condiciones extremas', 'Luminarias LED diseñadas bajo especificaciones industriales para operar en las condiciones más exigentes'],
  ['paneles solares diseñados bajo especificaciones militares para resistir y generar en condiciones extremas', 'Luminarias LED diseñadas bajo especificaciones industriales para operar en las condiciones más exigentes'],
  ['Módulo N-Type Ultra Eficiencia', 'Luminaria LED Ultra Eficiencia'],
  ['Arquitectura de Fotoceldas N-Type', 'Arquitectura Óptica LED Avanzada'],
  ['DIVISIÓN DE ENERGÍA INDUSTRIAL', 'DIVISIÓN DE ILUMINACIÓN INDUSTRIAL'],
  ['Silicio Monocristalino N', 'Driver LED Certificado'],
  ['Capa Anti-Reflejante', 'Óptica de Alta Eficiencia'],
  ['Bi-facialidad Extendida', 'Disipación Térmica Avanzada'],
  ['Captación de albedo trasero de hasta un 30% adicional dependiendo de las condiciones de la superficie', 'Sistema de gestión térmica pasiva que extiende la vida útil del LED más allá de las 100,000 horas'],
  ['Reducción de microfisuras y distancia de conducción de corriente, optimizando la captación lumínica', 'Distribución óptica precisa con lentes de policarbonato de grado industrial, maximizando los lúmenes por vatio'],
  ['Coeficiente de temperatura ultra bajo, garantizando máxima salida en entornos de alto calor industrial', 'Operación estable desde -40°C hasta +65°C, garantizando máxima salida lumínica en entornos de alto calor industrial'],
  ['DEGRADATION_Y1:', 'LUMEN_MAINT:'],
  ['EFFICIENCY_MAX:', 'EFFICACY_MAX:'],
  ['TEMP_COEF:', 'CRI_INDEX:'],
  ['-0.29%/°C', 'Ra ≥ 80'],
  ['SYS_STATUS', 'SPEC_STATUS'],
  ['Close up macro shot of high tech solar panel crystalline structure', 'Close up of high tech LED chip array with industrial heatsink'],
  
  // === Home page ===
  ['Reflectores Solares Pro', 'Reflectores LED Pro'],
  ['reflectores solares pro', 'reflectores LED pro'],
  ['Panel Monocristalino Integrado', 'Panel LED de Alta Potencia'],
  ['panel monocristalino integrado', 'panel LED de alta potencia'],
  ['Células de alta eficiencia g', 'Chips LED de alta eficiencia g'],
  // Alt texts (Home images)
  ['industrial led solar street light', 'industrial led street light'],
  ['all in one solar street light', 'all in one led street light'],
  ['led solar street lights', 'led street lights'],
  ['modern solar street lights', 'modern led street lights'],
  ['solar led path lights', 'led path lights'],
  ['solar street light', 'LED street light'],
  
  // Generic catch-alls (applied last, case-sensitive on the data)
  ['energía solar', 'iluminación LED'],
];

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  EVERGREEN — Complete Solar Cleanup v2 (FTP+PHP)    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Discover home page ID
  const homeResp = await fetch(`${WP_URL}/wp-json/wp/v2/pages?slug=home&per_page=5`, { headers });
  let homePages = await homeResp.json();
  
  // If no page with slug 'home', get the front page
  if (!homePages.length) {
    const settingsResp = await fetch(`${WP_URL}/wp-json/`, { headers });
    const settings = await settingsResp.json();
    // Try getting the front page
    const frontResp = await fetch(`${WP_URL}/wp-json/wp/v2/pages?per_page=50`, { headers });
    const allPages = await frontResp.json();
    // The home page is typically the one without a slug or with slug 'home'
    console.log('📋 Buscando Home page...');
    for (const p of allPages) {
      console.log(`   ID: ${p.id} | slug: "${p.slug}" | title: "${p.title.rendered}"`);
    }
    // Add all page IDs to our list
    const pageIds = allPages.map(p => p.id);
    // We'll process ALL pages
    PAGES.push(...pageIds.filter(id => !PAGES.includes(id)));
  } else {
    PAGES.push(homePages[0].id);
  }

  // Remove duplicates
  const uniquePages = [...new Set(PAGES)];
  
  // 2. Download all elementor data via REST
  console.log(`\n📥 Descargando Elementor data de ${uniquePages.length} páginas...`);
  const pageData = {};
  
  for (const id of uniquePages) {
    try {
      const r = await fetch(`${WP_URL}/wp-json/wp/v2/pages/${id}?context=edit`, { headers });
      if (!r.ok) continue;
      const page = await r.json();
      const meta = page.meta?._elementor_data;
      if (meta) {
        pageData[id] = { title: page.title?.raw || page.title?.rendered, data: meta };
        console.log(`   ✅ ${id}: ${pageData[id].title} (${meta.length} chars)`);
      }
    } catch(e) {
      console.log(`   ⚠️ ${id}: ${e.message}`);
    }
  }

  // 3. Apply replacements
  console.log('\n🔧 Aplicando reemplazos...');
  const changedPages = {};
  
  for (const [id, { title, data }] of Object.entries(pageData)) {
    let modified = data;
    let changes = 0;
    
    for (const [from, to] of REPLACEMENTS) {
      if (modified.includes(from)) {
        modified = modified.replaceAll(from, to);
        changes++;
        console.log(`   [${id}] ✏️  "${from.slice(0, 50)}${from.length > 50 ? '...' : ''}" → "${to.slice(0, 50)}${to.length > 50 ? '...' : ''}"`);
      }
    }
    
    if (changes > 0) {
      changedPages[id] = { title, data: modified, changes };
    }
  }

  if (Object.keys(changedPages).length === 0) {
    console.log('\n✅ Sin cambios necesarios — todas las páginas ya están limpias.');
    return;
  }

  // 4. Generate PHP script for batch update
  console.log(`\n📦 Generando script PHP para ${Object.keys(changedPages).length} páginas...`);
  
  const updates = {};
  for (const [id, { data }] of Object.entries(changedPages)) {
    updates[id] = Buffer.from(data).toString('base64');
  }
  
  const phpScript = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

$updates = json_decode('${JSON.stringify(Object.fromEntries(
    Object.entries(updates).map(([id, b64]) => [id, b64])
  ))}', true);

$results = [];
foreach ($updates as $post_id => $b64_data) {
    $new_data = base64_decode($b64_data);
    $result = update_post_meta((int)$post_id, '_elementor_data', wp_slash($new_data));
    delete_post_meta((int)$post_id, '_elementor_css');
    $results[$post_id] = ['updated' => $result !== false, 'length' => strlen($new_data)];
}

// Clear Elementor global cache
delete_option('_elementor_global_css');
delete_option('elementor_css_print_method');

// Clear any WP object cache
if (function_exists('wp_cache_flush')) { wp_cache_flush(); }

@unlink(__FILE__);

echo json_encode(['success' => true, 'pages' => $results, 'cache_cleared' => true, 'script_deleted' => !file_exists(__FILE__)]);
exit;
`;

  // 5. Upload and execute via FTP
  const client = new Client();
  const scriptName = 'evg-batch-fix.php';
  const localPath = join(process.cwd(), 'temp', scriptName);
  
  try {
    writeFileSync(localPath, phpScript);
    console.log('📝 Script PHP creado');

    await client.access({ host: FTP_HOST, user: FTP_USER_FTP, password: FTP_PASSWORD, secure: false });
    await client.cd('/');
    await client.uploadFrom(localPath, scriptName);
    console.log('✅ Script subido a raíz FTP');

    const url = `${WP_URL}/${scriptName}?token=${INJECT_SECRET}`;
    console.log('🔧 Ejecutando...');
    
    const resp = await fetch(url);
    const text = await resp.text();
    
    try {
      const result = JSON.parse(text);
      console.log('\n📋 Resultado:');
      
      for (const [id, r] of Object.entries(result.pages || {})) {
        const title = changedPages[id]?.title || id;
        console.log(`   ${r.updated ? '✅' : '❌'} Page ${id} (${title}): ${r.length} chars`);
      }
      console.log(`   🧹 Cache limpiado: ${result.cache_cleared}`);
      console.log(`   🗑️ Script auto-eliminado: ${result.script_deleted}`);
      
      const totalChanges = Object.values(changedPages).reduce((sum, p) => sum + p.changes, 0);
      console.log(`\n╔══════════════════════════════════════════════════════╗`);
      console.log(`║  ✅ ${totalChanges} correcciones en ${Object.keys(changedPages).length} páginas          ║`);
      console.log(`╚══════════════════════════════════════════════════════╝`);
    } catch(e) {
      console.log(`⚠️ Response (${resp.status}): ${text.slice(0, 500)}`);
      try { await client.remove(scriptName); console.log('🧹 Script removido'); } catch(e2) {}
    }
    
  } catch(err) {
    console.error(`Error: ${err.message}`);
    try { await client.cd('/'); await client.remove(scriptName); } catch(e) {}
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
