/**
 * inject_css_hf.mjs — Inject CSS into Header (175) & Footer (176)
 * Also fixes page templates to elementor_header_footer
 * Uses the proven FTP+PHP pattern from inject_css_batch.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Manual .env parse (same pattern as inject_css_batch.mjs)
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

// Read CSS (filter @import lines — Elementor custom_css doesn't support them)
const globalCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-global.css'), 'utf8');
const cssRules = globalCss.split('\n').filter(l => !l.startsWith('@import')).join('\n').trim();
const cssB64 = Buffer.from(cssRules).toString('base64');

// Header = 175, Footer = 176
// All page IDs for template fix
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const pageIds = manifest.pages.filter(p => p.wp_id).map(p => p.wp_id);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT CSS H/F + FIX TEMPLATES — Evergreen LED ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`📄 Header: 175, Footer: 176`);
console.log(`📄 Pages for template fix: ${pageIds.length}`);
console.log(`📦 CSS: ${(cssRules.length / 1024).toFixed(1)}KB\n`);

// Unique filename
const uniqueName = `evg_hf_${Date.now()}.php`;

const phpScript = `<?php
/**
 * Inject CSS into Header/Footer + Fix page templates
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

// 1. Inject CSS into Header (175) and Footer (176)
$hf_ids = [175, 176];
foreach ($hf_ids as $tid) {
    $settings = get_post_meta($tid, '_elementor_page_settings', true);
    if (!is_array($settings)) $settings = [];
    $settings['custom_css'] = $css;
    update_post_meta($tid, '_elementor_page_settings', $settings);
    delete_post_meta($tid, '_elementor_css');
    clean_post_cache($tid);
    $results['hf'][] = ['id' => $tid, 'css_size' => strlen($css), 'status' => 'ok'];
}

// 2. Fix page templates to elementor_header_footer
$page_ids = [${pageIds.join(',')}];
$tpl_fixed = 0;
foreach ($page_ids as $pid) {
    $current = get_post_meta($pid, '_wp_page_template', true);
    if ($current !== 'elementor_header_footer') {
        update_post_meta($pid, '_wp_page_template', 'elementor_header_footer');
        $tpl_fixed++;
    }
}
$results['templates_fixed'] = $tpl_fixed;

// 3. Set Elementor Pro display conditions for header/footer
$conditions = get_option('elementor_pro_theme_builder_conditions', []);
if (!is_array($conditions)) $conditions = [];
$conditions[175] = [['type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '']];
$conditions[176] = [['type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '']];
update_option('elementor_pro_theme_builder_conditions', $conditions);
$results['conditions'] = 'set';

// 4. Nuclear cache purge (WAF-safe — no raw SQL)
foreach (array_merge($hf_ids, $page_ids) as $pid) {
    delete_post_meta($pid, '_elementor_css');
    update_post_meta($pid, '_elementor_version', '0.0.0');
    clean_post_cache($pid);
}
delete_option('_elementor_global_css');
if (function_exists('wp_cache_flush')) wp_cache_flush();

// LiteSpeed purge via safe API hooks (NOT raw SQL)
if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $results['litespeed'] = 'purged_api';
} elseif (function_exists('litespeed_purge_all')) {
    litespeed_purge_all();
    $results['litespeed'] = 'purged_fn';
} else {
    // Try do_action hook
    do_action('litespeed_purge_all');
    $results['litespeed'] = 'action_fired';
}

$results['cache'] = 'nuclear_purged';
$results['status'] = 'success';

@unlink(__FILE__);
$results['self_delete'] = !file_exists(__FILE__);

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;

const phpPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(phpPath, phpScript, 'utf8');

const client = new Client();
try {
  console.log(`🔗 Connecting to FTP: ${FTP_HOST}...`);
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: true,
    secureOptions: { rejectUnauthorized: false },
  });
  console.log('✅ FTP connected (TLS)');

  console.log(`📤 Uploading ${uniqueName}...`);
  await client.uploadFrom(phpPath, uniqueName);
  console.log('✅ Upload complete');
  client.close();

  // Execute
  const execUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
  console.log(`🚀 Executing: ${WP_URL}/${uniqueName}?token=***`);
  const resp = await fetch(execUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(60000),
  });

  const text = await resp.text();
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESULT:');
  console.log('═══════════════════════════════════════════════════════');
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log('RAW:', text.substring(0, 500));
  }
  console.log('═══════════════════════════════════════════════════════');

  // Verify PHP was self-deleted
  const c2 = new Client();
  await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: true, secureOptions: { rejectUnauthorized: false } });
  const rootList = await c2.list('/');
  const phpStillExists = rootList.find(f => f.name === uniqueName);
  console.log(`🗑️ PHP self-deleted: ${phpStillExists ? '❌ STILL EXISTS' : '✅ Confirmed'}`);
  if (phpStillExists) {
    await c2.remove(uniqueName);
    console.log('   → Manually removed');
  }
  c2.close();

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  try { fs.unlinkSync(phpPath); } catch {}
}

console.log('\n🏁 Done');
