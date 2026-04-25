/**
 * maintenance_only.js — Modo Config-Only (Protocolo AHORA SI)
 * stitch2elementor v4.6.6
 *
 * PROPÓSITO: Realinear Homepage en WordPress y limpiar caché Elementor
 *            SIN re-inyectar contenido ni alterar IDs de páginas.
 *
 * CUÁNDO USAR:
 *   - Tras un crash de pipeline donde los IDs son conocidos pero la Homepage no está seteada
 *   - Cuando solo se necesita cambiar qué página actúa como Homepage
 *   - Para mantenimiento post-inyección cuando sync_and_inject.js ya se ejecutó
 *
 * USO:
 *   node scripts/maintenance_only.js [home_id]
 *   node scripts/maintenance_only.js           → usa home_id del page_manifest.json
 *   node scripts/maintenance_only.js 1054      → fuerza ID específico
 */

const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ─── Configuración ────────────────────────────────────────────────────────────
const FTP_HOST    = process.env.FTP_HOST;
const FTP_USER    = process.env.FTP_USER;
const FTP_PASS    = process.env.FTP_PASS;
const FTP_REMOTE  = process.env.FTP_REMOTE_DIR || '/public_html/v9_json_payloads/';
const WP_BASE_URL = process.env.WP_BASE_URL;

// Capturar home_id: argumento CLI > page_manifest.json > error
let homeId = parseInt(process.argv[2], 10);
if (!homeId) {
  const manifestPath = path.join(__dirname, '..', 'page_manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    homeId = manifest.home_id;
  }
}

if (!homeId || isNaN(homeId)) {
  console.error('❌ ERROR: No se pudo determinar el home_id.');
  console.error('   Uso: node scripts/maintenance_only.js [home_id]');
  console.error('   O bien, establece "home_id" en page_manifest.json');
  process.exit(1);
}

console.log(`\n🔧  MODO CONFIG-ONLY — Protocolo AHORA SI`);
console.log(`   Homepage ID: ${homeId}`);
console.log(`   Sitio: ${WP_BASE_URL}\n`);

// ─── Script PHP de Mantenimiento ──────────────────────────────────────────────
function buildMaintenancePHP(homeId) {
  return `<?php
/**
 * maintenance_only_runner.php — Auto-destruible
 * Realinea Homepage + Flush Caché Elementor
 * Generado por maintenance_only.js — stitch2elementor v4.6.6
 */

// Seguridad básica: solo desde localhost o con token
$token = isset($_GET['token']) ? $_GET['token'] : '';
$expected = '${process.env.INJECT_SECRET || ''}';
if ($token !== $expected) {
  http_response_code(403);
  die('Forbidden');
}

define('ABSPATH', dirname(__FILE__) . '/wp/');
$wp_load = dirname(__FILE__) . '/wp-load.php';
if (!file_exists($wp_load)) {
  // Búsqueda alternativa
  $wp_load = dirname(dirname(__FILE__)) . '/wp-load.php';
}
if (!file_exists($wp_load)) {
  die(json_encode(['success' => false, 'error' => 'wp-load.php not found']));
}
require_once($wp_load);

$results = [];
$home_id = intval(${homeId});

// 1. Configurar Front Page
update_option('show_on_front', 'page');
update_option('page_on_front', $home_id);
$results['page_on_front'] = $home_id;
$results['page_on_front_title'] = get_the_title($home_id);

// 2. Flush Rewrite Rules
flush_rewrite_rules(false);
$results['permalinks_flushed'] = true;

// 3. Limpiar Caché Elementor
if (class_exists('\\Elementor\\Plugin')) {
  \\Elementor\\Plugin::$instance->files_manager->clear_cache();
  $results['elementor_cache_cleared'] = true;
} else {
  $results['elementor_cache_cleared'] = false;
  $results['elementor_warning'] = 'Elementor Plugin class not found';
}

// 4. Sincronizar Biblioteca Elementor
if (class_exists('\\Elementor\\Api')) {
  \\Elementor\\Api::get_library_data(true);
  $results['library_synced'] = true;
}

// 5. Auto-destruir este script
$self = __FILE__;
$results['self_destruct'] = unlink($self);

echo json_encode(['success' => true, 'results' => $results, 'timestamp' => date('c')]);
?>`;
}

// ─── Pipeline Principal ───────────────────────────────────────────────────────
async function run() {
  const phpFilename = `maintenance_only_runner_${Date.now()}.php`;
  const phpContent = buildMaintenancePHP(homeId);
  const localTmp = path.join(__dirname, '..', 'exports', phpFilename);
  const secret = process.env.INJECT_SECRET;
  if (!secret) {
    console.error('❌ ERROR: INJECT_SECRET no está definido en .env');
    process.exit(1);
  }

  // Escribir PHP temporal
  fs.mkdirSync(path.join(__dirname, '..', 'exports'), { recursive: true });
  fs.writeFileSync(localTmp, phpContent, 'utf-8');

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    // 1. Conectar FTP
    console.log('📡  Conectando al servidor FTP...');
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });
    console.log('✅  Conexión FTP establecida.\n');

    // 2. Subir PHP
    console.log(`📤  Subiendo ${phpFilename}...`);
    await client.ensureDir(FTP_REMOTE);
    await client.uploadFrom(localTmp, phpFilename);
    console.log(`✅  PHP subido a: ${FTP_REMOTE}${phpFilename}\n`);

    // 3. Disparar PHP
    const phpUrl = `${WP_BASE_URL.replace(/\/$/, '')}/v9_json_payloads/${phpFilename}?token=${secret}`;
    console.log(`🚀  Disparando script de mantenimiento...`);
    console.log(`    URL: ${phpUrl}\n`);

    const { execSync } = require('child_process');
    let response;
    try {
      response = execSync(`curl -s "${phpUrl}"`, { timeout: 30000 }).toString();
    } catch (e) {
      // Fallback PowerShell
      response = execSync(`powershell -Command "(Invoke-WebRequest -Uri '${phpUrl}' -UseBasicParsing).Content"`, { timeout: 30000 }).toString();
    }

    console.log('📋  Respuesta del servidor:');
    try {
      const parsed = JSON.parse(response);
      if (parsed.success) {
        const r = parsed.results;
        console.log(`\n✅  MANTENIMIENTO COMPLETADO`);
        console.log(`   📄  Homepage: ID ${r.page_on_front} — "${r.page_on_front_title}"`);
        console.log(`   🔗  Permalinks flush: ${r.permalinks_flushed ? 'OK' : 'FAIL'}`);
        console.log(`   🧹  Caché Elementor: ${r.elementor_cache_cleared ? 'OK' : 'FAIL (check warning)'}`);
        if (r.elementor_warning) console.log(`   ⚠️   ${r.elementor_warning}`);
        console.log(`   📚  Biblioteca sincronizada: ${r.library_synced ? 'OK' : 'N/A'}`);
        console.log(`   💣  Auto-destrucción PHP: ${r.self_destruct ? 'OK' : 'Manual cleanup needed'}`);
        console.log(`   🕐  Timestamp: ${parsed.timestamp}\n`);
      } else {
        console.error('❌  El script PHP reportó un error:', parsed.error);
      }
    } catch {
      console.log(response);
    }

  } catch (err) {
    console.error('❌  ERROR:', err.message);
    process.exit(1);
  } finally {
    client.close();
    // Limpiar archivo temporal local
    if (fs.existsSync(localTmp)) fs.unlinkSync(localTmp);
  }

  console.log('\n🏁  maintenance_only.js completado.\n');
}

run();
