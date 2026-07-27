/**
 * inject_three_pages.mjs — Crea e inyecta Header, Footer y Homepage
 * Usa patrón FTP+PHP (base64 encoding para payloads)
 * 
 * Prerequisitos: .env con FTP_HOST, FTP_USER, FTP_PASSWORD, INJECT_SECRET, WP_URL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  let key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
});

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASSWORD = env.FTP_PASSWORD;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;
const FTP_REMOTE_PATH = env.FTP_REMOTE_PATH || '';

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT 3 PAGES — Header + Footer + Homepage    ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Read JSONs
const headerJson = fs.readFileSync(path.join(ROOT, 'elementor_jsons/header.json'), 'utf8');
const footerJson = fs.readFileSync(path.join(ROOT, 'elementor_jsons/footer.json'), 'utf8');
const homepageJson = fs.readFileSync(path.join(ROOT, 'elementor_jsons/homepage.json'), 'utf8');

// Encode to base64
const headerB64 = Buffer.from(headerJson).toString('base64');
const footerB64 = Buffer.from(footerJson).toString('base64');
const homepageB64 = Buffer.from(homepageJson).toString('base64');

console.log(`📦 Header JSON:   ${headerJson.length} bytes → ${headerB64.length} b64`);
console.log(`📦 Footer JSON:   ${footerJson.length} bytes → ${footerB64.length} b64`);
console.log(`📦 Homepage JSON: ${homepageJson.length} bytes → ${homepageB64.length} b64\n`);

// Generate PHP injection script
const phpScript = `<?php
/**
 * Auto-generated injection script
 * Creates Header (elementor_library), Footer (elementor_library), Homepage (page)
 * Self-deletes after execution
 */

// Security check
if (!isset(\$_GET['token']) || \$_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

header('Content-Type: application/json; charset=utf-8');

// Bootstrap WordPress
define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

\$results = [];

// ═══════════════════════════════════════
// 1. CREATE HEADER (elementor_library)
// ═══════════════════════════════════════
\$header_data = base64_decode('${headerB64}');
\$header_id = wp_insert_post([
    'post_title'  => 'Header — Evergreen LED',
    'post_status' => 'publish',
    'post_type'   => 'elementor_library',
    'meta_input'  => [
        '_elementor_template_type' => 'header',
        '_elementor_edit_mode'     => 'builder',
    ]
]);

if (is_wp_error(\$header_id)) {
    \$results['header'] = ['error' => \$header_id->get_error_message()];
} else {
    update_post_meta(\$header_id, '_elementor_data', wp_slash(\$header_data));
    update_post_meta(\$header_id, '_elementor_version', '3.25.0');
    update_post_meta(\$header_id, '_elementor_edit_mode', 'builder');
    update_post_meta(\$header_id, '_elementor_template_type', 'header');
    delete_post_meta(\$header_id, '_elementor_css');
    clean_post_cache(\$header_id);
    \$results['header'] = ['id' => \$header_id, 'status' => 'created'];
}

// ═══════════════════════════════════════
// 2. CREATE FOOTER (elementor_library)
// ═══════════════════════════════════════
\$footer_data = base64_decode('${footerB64}');
\$footer_id = wp_insert_post([
    'post_title'  => 'Footer — Evergreen LED',
    'post_status' => 'publish',
    'post_type'   => 'elementor_library',
    'meta_input'  => [
        '_elementor_template_type' => 'footer',
        '_elementor_edit_mode'     => 'builder',
    ]
]);

if (is_wp_error(\$footer_id)) {
    \$results['footer'] = ['error' => \$footer_id->get_error_message()];
} else {
    update_post_meta(\$footer_id, '_elementor_data', wp_slash(\$footer_data));
    update_post_meta(\$footer_id, '_elementor_version', '3.25.0');
    update_post_meta(\$footer_id, '_elementor_edit_mode', 'builder');
    update_post_meta(\$footer_id, '_elementor_template_type', 'footer');
    delete_post_meta(\$footer_id, '_elementor_css');
    clean_post_cache(\$footer_id);
    \$results['footer'] = ['id' => \$footer_id, 'status' => 'created'];
}

// ═══════════════════════════════════════
// 3. CREATE HOMEPAGE (page)
// ═══════════════════════════════════════
\$homepage_data = base64_decode('${homepageB64}');
\$homepage_id = wp_insert_post([
    'post_title'   => 'Inicio — Evergreen LED Venezuela',
    'post_name'    => 'inicio',
    'post_status'  => 'publish',
    'post_type'    => 'page',
    'meta_input'   => [
        '_elementor_edit_mode' => 'builder',
        '_wp_page_template'   => 'elementor_header_footer',
    ]
]);

if (is_wp_error(\$homepage_id)) {
    \$results['homepage'] = ['error' => \$homepage_id->get_error_message()];
} else {
    update_post_meta(\$homepage_id, '_elementor_data', wp_slash(\$homepage_data));
    update_post_meta(\$homepage_id, '_elementor_version', '3.25.0');
    update_post_meta(\$homepage_id, '_elementor_edit_mode', 'builder');
    update_post_meta(\$homepage_id, '_wp_page_template', 'elementor_header_footer');
    delete_post_meta(\$homepage_id, '_elementor_css');
    clean_post_cache(\$homepage_id);
    
    // Set as front page
    update_option('show_on_front', 'page');
    update_option('page_on_front', \$homepage_id);
    
    \$results['homepage'] = ['id' => \$homepage_id, 'status' => 'created', 'is_front_page' => true];
}

// ═══════════════════════════════════════
// 4. FLUSH CACHE
// ═══════════════════════════════════════
// Clear Elementor CSS cache
delete_post_meta(\$header_id ?? 0, '_elementor_css');
delete_post_meta(\$footer_id ?? 0, '_elementor_css');
delete_post_meta(\$homepage_id ?? 0, '_elementor_css');

// Clear WP object cache
if (function_exists('wp_cache_flush')) wp_cache_flush();

// Clear Elementor global cache
delete_option('_elementor_global_css');
delete_option('elementor_remote_info_library');

\$results['cache'] = 'flushed';

// Self-delete
@unlink(__FILE__);
\$results['self_delete'] = !file_exists(__FILE__);

echo json_encode(\$results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;

// Write PHP to temp
const phpPath = path.join(ROOT, 'temp', 'inject_three_pages.php');
if (!fs.existsSync(path.join(ROOT, 'temp'))) {
  fs.mkdirSync(path.join(ROOT, 'temp'), { recursive: true });
}
fs.writeFileSync(phpPath, phpScript, 'utf8');
console.log(`📝 PHP script written: ${phpPath} (${phpScript.length} bytes)\n`);

// FTP upload
async function uploadAndExecute() {
  const client = new Client();
  client.ftp.verbose = false;
  
  try {
    console.log(`🔗 Connecting to FTP: ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });
    console.log('✅ FTP connected\n');

    // Upload to FTP root (which IS the web root for this hosting)
    // Note: FTP_REMOTE_PATH (/home2/qdqcvpmy/public_html) is a subdirectory, NOT the web root
    // The FTP root (/) contains wp-load.php and is the actual document root
    console.log('📂 Using FTP root (/) as web root');

    // Upload PHP
    console.log('📤 Uploading inject_three_pages.php...');
    await client.uploadFrom(phpPath, 'inject_three_pages.php');
    console.log('✅ Upload complete\n');

    // Execute via HTTP
    const execUrl = `${WP_URL}/inject_three_pages.php?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing: ${WP_URL}/inject_three_pages.php?token=***\n`);
    
    const response = await fetch(execUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 500)}`);
    }

    const result = await response.json();
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 INJECTION RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(result, null, 2));
    console.log('═══════════════════════════════════════════════════════\n');

    // Update manifest with new IDs
    if (result.homepage && result.homepage.id) {
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
      manifest.home_id = result.homepage.id;
      manifest.pages[0].wp_id = result.homepage.id;
      manifest.migration_status = 'INJECTED';
      manifest.last_injection_date = new Date().toISOString();
      
      if (result.header && result.header.id) manifest.header_id = result.header.id;
      if (result.footer && result.footer.id) manifest.footer_id = result.footer.id;
      
      fs.writeFileSync(path.join(ROOT, 'page_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
      console.log('✅ page_manifest.json updated with new IDs');
    }

    return result;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw err;
  } finally {
    client.close();
  }
}

uploadAndExecute()
  .then(() => console.log('\n🏁 Pipeline complete!'))
  .catch(err => {
    console.error('\n💀 Fatal:', err.message);
    process.exit(1);
  });
