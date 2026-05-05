/**
 * inject_all_pages.mjs — Batch-injects ALL pending pages from page_manifest.json
 * Uses FTP+PHP pipeline (base64 encoding for payloads)
 * Skips pages that already have wp_id assigned
 * 
 * Prerequisites: .env with FTP_HOST, FTP_USER, FTP_PASSWORD, INJECT_SECRET, WP_URL
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

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT ALL PAGES — Batch Page Creator           ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Read manifest
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const pendingPages = manifest.pages.filter(p => !p.wp_id && !p.is_homepage);

if (pendingPages.length === 0) {
  console.log('✅ No pending pages to inject. All pages have wp_id assigned.');
  process.exit(0);
}

console.log(`📋 Found ${pendingPages.length} pending pages:\n`);
pendingPages.forEach((p, i) => console.log(`  ${i + 1}. ${p.title} (${p.slug})`));
console.log('');

// Read and encode all JSONs
const pagePayloads = [];
for (const page of pendingPages) {
  const jsonPath = path.join(ROOT, 'elementor_jsons', page.json);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON not found: ${page.json} — skipping`);
    continue;
  }
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const b64 = Buffer.from(jsonContent).toString('base64');
  console.log(`📦 ${page.json.padEnd(35)} ${jsonContent.length} bytes → ${b64.length} b64`);
  pagePayloads.push({ ...page, b64 });
}

console.log(`\n📊 Total payloads: ${pagePayloads.length}\n`);

// Generate PHP injection script
function generatePHP(payloads) {
  let pageBlocks = '';
  
  payloads.forEach((p, idx) => {
    const varName = `page_${idx}`;
    pageBlocks += `
// ═══════════════════════════════════════
// PAGE ${idx + 1}: ${p.title}
// ═══════════════════════════════════════
$${varName}_data = base64_decode('${p.b64}');
$${varName}_id = wp_insert_post([
    'post_title'   => '${p.title.replace(/'/g, "\\'")}',
    'post_name'    => '${p.slug}',
    'post_status'  => 'publish',
    'post_type'    => 'page',
    'meta_input'   => [
        '_elementor_edit_mode' => 'builder',
        '_wp_page_template'   => 'elementor_header_footer',
    ]
]);

if (is_wp_error($${varName}_id)) {
    $results['${p.slug}'] = ['error' => $${varName}_id->get_error_message()];
} else {
    update_post_meta($${varName}_id, '_elementor_data', wp_slash($${varName}_data));
    update_post_meta($${varName}_id, '_elementor_version', '3.25.0');
    update_post_meta($${varName}_id, '_elementor_edit_mode', 'builder');
    update_post_meta($${varName}_id, '_wp_page_template', 'elementor_header_footer');
    delete_post_meta($${varName}_id, '_elementor_css');
    clean_post_cache($${varName}_id);
    $results['${p.slug}'] = ['id' => $${varName}_id, 'status' => 'created', 'title' => '${p.title.replace(/'/g, "\\'")}'];
}
`;
  });

  return `<?php
/**
 * Auto-generated batch injection script
 * Creates ${payloads.length} pages in WordPress with Elementor data
 * Self-deletes after execution
 * Generated: ${new Date().toISOString()}
 */

// Security check
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

// Increase limits for large payloads
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

header('Content-Type: application/json; charset=utf-8');

// Bootstrap WordPress
define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

$results = [];
$results['timestamp'] = date('c');
$results['total_pages'] = ${payloads.length};

${pageBlocks}

// ═══════════════════════════════════════
// FLUSH ALL CACHES
// ═══════════════════════════════════════

// Clear WP object cache
if (function_exists('wp_cache_flush')) wp_cache_flush();

// Clear Elementor global cache
delete_option('_elementor_global_css');
delete_option('elementor_remote_info_library');

// LiteSpeed cache purge
if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $results['litespeed'] = 'purged';
} elseif (function_exists('litespeed_purge_all')) {
    litespeed_purge_all();
    $results['litespeed'] = 'purged';
} else {
    // Direct DB purge for LiteSpeed
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%litespeed%cache%'");
    $results['litespeed'] = 'db_purged';
}

$results['cache'] = 'flushed';

// Self-delete
@unlink(__FILE__);
$results['self_delete'] = !file_exists(__FILE__);

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;
}

const phpScript = generatePHP(pagePayloads);

// Write PHP to temp
const phpPath = path.join(ROOT, 'temp', 'inject_all_pages.php');
if (!fs.existsSync(path.join(ROOT, 'temp'))) {
  fs.mkdirSync(path.join(ROOT, 'temp'), { recursive: true });
}
fs.writeFileSync(phpPath, phpScript, 'utf8');
console.log(`📝 PHP script written: ${phpPath} (${(phpScript.length / 1024).toFixed(0)}KB)\n`);

// FTP upload & execute
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

    // Upload PHP to web root
    console.log('📤 Uploading inject_all_pages.php to web root...');
    await client.uploadFrom(phpPath, 'inject_all_pages.php');
    console.log('✅ Upload complete\n');

    // Execute via HTTP
    const execUrl = `${WP_URL}/inject_all_pages.php?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing: ${WP_URL}/inject_all_pages.php?token=***`);
    console.log('⏳ This may take 30-60 seconds for large payloads...\n');
    
    const response = await fetch(execUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(120000), // 2 min timeout
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
    let updatedCount = 0;
    for (const page of manifest.pages) {
      if (result[page.slug] && result[page.slug].id) {
        page.wp_id = result[page.slug].id;
        updatedCount++;
      }
    }
    
    manifest.migration_status = 'INJECTED';
    manifest.last_injection_date = new Date().toISOString();
    
    fs.writeFileSync(path.join(ROOT, 'page_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`✅ page_manifest.json updated — ${updatedCount} pages received wp_id`);

    // Print summary table
    console.log('\n📋 PAGE SUMMARY:');
    console.log('─'.repeat(70));
    console.log('  SLUG'.padEnd(30) + 'WP_ID'.padEnd(10) + 'STATUS');
    console.log('─'.repeat(70));
    for (const page of manifest.pages) {
      const wpId = page.wp_id ? String(page.wp_id) : 'PENDING';
      const status = page.wp_id ? '✅ LIVE' : '⏳ PENDING';
      console.log(`  ${page.slug.padEnd(28)}${wpId.padEnd(10)}${status}`);
    }
    console.log('─'.repeat(70));

    return result;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    throw err;
  } finally {
    client.close();
  }
}

uploadAndExecute()
  .then(() => console.log('\n🏁 Batch injection complete!'))
  .catch(err => {
    console.error('\n💀 Fatal:', err.message);
    process.exit(1);
  });
