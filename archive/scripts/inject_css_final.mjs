/**
 * inject_css_via_wp_option.mjs
 * Inyecta CSS global en la opción wp_head de WordPress usando un PHP
 * que escribe en functions.php del theme hijo o en un mu-plugin con flush
 */
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const { FTP_HOST, FTP_USER, FTP_PASS, SITE_URL, INJECT_SECRET } = process.env;

// Read CSS
const globalCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-global.css'), 'utf8');
const homepageCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-homepage-custom-v4.css'), 'utf8');

// Encode CSS for PHP
const globalB64 = Buffer.from(globalCss).toString('base64');
const homepageB64 = Buffer.from(homepageCss).toString('base64');

// PHP: writes CSS to wp_options as custom_css and flushes all caches
const phpLines = [
  '<' + '?php',
  "define('ABSPATH', dirname(__FILE__) . '/');",
  "if (($_GET['t'] ?? '') !== '" + INJECT_SECRET + "') { http_response_code(403); die('no'); }",
  "require_once ABSPATH . 'wp-load.php';",
  "header('Content-Type: application/json');",
  "$r = [];",
  "",
  "// Write CSS files",
  "$dir = WP_CONTENT_DIR . '/uploads/evergreen-css/';",
  "if (!is_dir($dir)) mkdir($dir, 0755, true);",
  "file_put_contents($dir . 'evergreen-global.css', base64_decode('" + globalB64 + "'));",
  "file_put_contents($dir . 'evergreen-homepage-v4.css', base64_decode('" + homepageB64 + "'));",
  "$r['css_written'] = true;",
  "",
  "// Update mu-plugin with opcache reset",
  "$mu = WP_CONTENT_DIR . '/mu-plugins/evergreen-custom-styles.php';",
  "$mu_code = '<' . '?php' . \"\\n\";",
  "$mu_code .= '/* Plugin Name: Evergreen LED Styles */' . \"\\n\";",
  "$mu_code .= '/* Version: 1.0.' . time() . ' */' . \"\\n\";",
  "$mu_code .= \"add_action('wp_enqueue_scripts', function() {\\n\";",
  "$mu_code .= \"  \\$d = content_url('/uploads/evergreen-css/');\\n\";",
  "$mu_code .= \"  \\$p = WP_CONTENT_DIR . '/uploads/evergreen-css/';\\n\";",
  "$mu_code .= \"  if (file_exists(\\$p . 'evergreen-global.css'))\\n\";",
  "$mu_code .= \"    wp_enqueue_style('evergreen-global', \\$d . 'evergreen-global.css', array('elementor-frontend'), filemtime(\\$p . 'evergreen-global.css'));\\n\";",
  "$mu_code .= \"  if (is_page(1758) && file_exists(\\$p . 'evergreen-homepage-v4.css'))\\n\";",
  "$mu_code .= \"    wp_enqueue_style('evergreen-homepage', \\$d . 'evergreen-homepage-v4.css', array('evergreen-global'), filemtime(\\$p . 'evergreen-homepage-v4.css'));\\n\";",
  "$mu_code .= \"}, 999);\\n\";",
  "file_put_contents($mu, $mu_code);",
  "$r['mu_plugin'] = $mu;",
  "$r['mu_size'] = filesize($mu);",
  "",
  "// Reset opcache if available",
  "if (function_exists('opcache_reset')) { opcache_reset(); $r['opcache'] = 'reset'; }",
  "if (function_exists('opcache_invalidate')) { opcache_invalidate($mu, true); $r['opcache_invalidate'] = true; }",
  "",
  "// LiteSpeed purge",
  "if (class_exists('LiteSpeed_Cache_API')) { LiteSpeed_Cache_API::purge_all(); $r['litespeed'] = 'purged'; }",
  "",
  "// Elementor cache",
  "if (class_exists('Elementor\\\\Plugin')) {",
  "  Elementor\\\\Plugin::instance()->files_manager->clear_cache();",
  "  $r['elementor'] = 'cleared';",
  "}",
  "",
  "// Test the mu-plugin loads",
  "$r['mu_exists'] = file_exists($mu);",
  "$r['css_exists'] = file_exists(WP_CONTENT_DIR . '/uploads/evergreen-css/evergreen-global.css');",
  "$r['css_size'] = filesize(WP_CONTENT_DIR . '/uploads/evergreen-css/evergreen-global.css');",
  "$r['status'] = 'success';",
  "$r['time'] = date('c');",
  "",
  "echo json_encode($r, JSON_PRETTY_PRINT);",
  "@unlink(__FILE__);",
  '?' + '>',
];

const phpContent = phpLines.join("\n");
const phpPath = path.join(ROOT, 'temp', '_css_inject.php');
fs.writeFileSync(phpPath, phpContent);
console.log('📝 PHP:', (phpContent.length / 1024).toFixed(1) + 'KB');

// Upload
const client = new ftp.Client();
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
  
  // Clean old PHP files first
  const rootFiles = await client.list('/public_html/');
  for (const f of rootFiles) {
    if (['_purge.php', 'inject_global_css.php', 'inject_all_pages.php', 'evergreen_robust_inject.php'].includes(f.name)) {
      try { await client.remove('/public_html/' + f.name); console.log('🗑️ Cleaned: ' + f.name); } catch {}
    }
  }
  
  await client.uploadFrom(phpPath, '/public_html/_css_inject.php');
  console.log('✅ Uploaded _css_inject.php');
} finally {
  client.close();
}

// Execute
const url = `${SITE_URL}/_css_inject.php?t=${INJECT_SECRET}`;
console.log('🚀 Executing...');
try {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(20000)
  });
  const text = await resp.text();
  
  // Try JSON parse
  try {
    const json = JSON.parse(text);
    console.log('\n📊 RESULT:');
    console.log(JSON.stringify(json, null, 2));
  } catch {
    // Check if it's a WP page (cached response)
    if (text.includes('<!doctype') || text.includes('<html')) {
      console.log('⚠️ Got HTML response (LiteSpeed cache). Checking if PHP executed...');
      // Verify via FTP if the file was consumed (self-delete)
      const c2 = new ftp.Client();
      await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
      const list = await c2.list('/public_html/');
      const exists = list.find(f => f.name === '_css_inject.php');
      console.log('PHP file still exists:', exists ? 'YES (not executed)' : 'NO (executed & self-deleted)');
      
      // Check mu-plugin was updated
      const tmpCheck = path.join(ROOT, 'temp', '_mu_verify.php');
      await c2.downloadTo(tmpCheck, '/public_html/wp-content/mu-plugins/evergreen-custom-styles.php');
      const muContent = fs.readFileSync(tmpCheck, 'utf8');
      console.log('MU-plugin version:', muContent.includes('1.0.') ? 'Updated ✅' : 'Old ❌');
      console.log('MU-plugin size:', muContent.length, 'bytes');
      c2.close();
    } else {
      console.log('📄 Raw response:', text.substring(0, 500));
    }
  }
} catch (err) {
  console.error('⚠️ Error:', err.message);
}
