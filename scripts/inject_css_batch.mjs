/**
 * inject_css_batch.mjs — Inject CSS into all pages via FTP+PHP
 * Uses unique filename + FTP relative path (like inject_all_pages.mjs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env (manual parse like inject_all_pages.mjs)
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

// Read CSS
const globalCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-global.css'), 'utf8');
const cssRules = globalCss.split('\n').filter(l => !l.startsWith('@import')).join('\n').trim();
const cssB64 = Buffer.from(cssRules).toString('base64');

// Page IDs (all except homepage 1758)
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const pageIds = manifest.pages.filter(p => p.wp_id !== 1758).map(p => p.wp_id);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT CSS BATCH — Evergreen LED               ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`📄 Pages: ${pageIds.length} (${pageIds.join(', ')})`);
console.log(`📦 CSS: ${(cssRules.length / 1024).toFixed(1)}KB\n`);

// Unique filename to avoid LiteSpeed cache
const uniqueName = `evg_css_${Date.now()}.php`;

const phpScript = `<?php
/**
 * Batch CSS injection for Evergreen LED pages
 * Generated: ${new Date().toISOString()}
 */
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

ini_set('memory_limit', '256M');
ini_set('max_execution_time', 120);
header('Content-Type: application/json; charset=utf-8');

define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

$results = [];
$results['timestamp'] = date('c');

$css = base64_decode('${cssB64}');
$page_ids = [${pageIds.join(',')}];

foreach ($page_ids as $pid) {
    $settings = get_post_meta($pid, '_elementor_page_settings', true);
    if (!is_array($settings)) $settings = [];
    $settings['custom_css'] = $css;
    update_post_meta($pid, '_elementor_page_settings', $settings);
    
    // Also clear the page's Elementor CSS cache
    delete_post_meta($pid, '_elementor_css');
    clean_post_cache($pid);
    
    $results['pages'][] = ['id' => $pid, 'css_size' => strlen($css), 'status' => 'ok'];
}

// Flush caches
delete_option('_elementor_global_css');

if (function_exists('wp_cache_flush')) wp_cache_flush();

if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $results['litespeed'] = 'purged';
} elseif (function_exists('litespeed_purge_all')) {
    litespeed_purge_all();
    $results['litespeed'] = 'purged';
} else {
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%litespeed%cache%'");
    $results['litespeed'] = 'db_purged';
}

$results['pages_updated'] = count($page_ids);
$results['status'] = 'success';

@unlink(__FILE__);
$results['self_delete'] = !file_exists(__FILE__);

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;

const phpPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(phpPath, phpScript, 'utf8');
console.log(`📝 PHP: ${uniqueName} (${(phpScript.length / 1024).toFixed(1)}KB)\n`);

// FTP upload & execute (same pattern as inject_all_pages.mjs)
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

  // Upload using relative path (same as inject_all_pages.mjs)
  console.log(`📤 Uploading ${uniqueName}...`);
  await client.uploadFrom(phpPath, uniqueName);
  console.log('✅ Upload complete\n');

  // Execute via HTTP
  const execUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
  console.log(`🚀 Executing: ${WP_URL}/${uniqueName}?token=***`);

  const response = await fetch(execUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(60000),
  });

  const text = await response.text();
  
  try {
    const result = JSON.parse(text);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESULT:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(result, null, 2));
    console.log('═══════════════════════════════════════════════════════');
  } catch {
    console.log('\n⚠️ Non-JSON response. Checking PHP execution...');
    // Verify file deletion via FTP
    const c2 = new Client();
    await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    const rootList = await c2.list('.');
    const phpStillExists = rootList.find(f => f.name === uniqueName);
    console.log(`PHP file exists: ${phpStillExists ? '❌ YES (not executed)' : '✅ NO (executed & deleted)'}`);
    
    if (phpStillExists) {
      console.log('\n📄 Response preview:');
      console.log(text.substring(0, 300));
    }
    c2.close();
  }
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
} finally {
  client.close();
}

console.log('\n🏁 Done');
