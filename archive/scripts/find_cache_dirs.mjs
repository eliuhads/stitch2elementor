/**
 * find_cache_dirs.mjs — Find and clear LiteSpeed cache via FTP
 */
import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i === -1) return;
  let v = t.substring(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
  env[t.substring(0, i).trim()] = v;
});

const c = new Client();
await c.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });

console.log('=== WP-CONTENT directories ===');
const wpContent = await c.list('/public_html/wp-content/');
const cacheDirs = wpContent.filter(i => i.isDirectory && (i.name.includes('cache') || i.name.includes('litespeed')));
console.log('Cache-related:', cacheDirs.map(d => d.name));

for (const d of cacheDirs) {
  console.log('\n📁 ' + d.name + '/');
  try {
    const items = await c.list('/public_html/wp-content/' + d.name + '/');
    for (const item of items) {
      if (item.isDirectory) {
        console.log('  📁 ' + item.name + '/');
        try {
          const sub = await c.list('/public_html/wp-content/' + d.name + '/' + item.name + '/');
          for (const s of sub) {
            console.log('    ' + (s.isDirectory ? '📁 ' : '📄 ') + s.name + (s.isDirectory ? '/' : ` (${s.size}B)`));
          }
        } catch {}
      } else {
        console.log('  📄 ' + item.name + ' (' + item.size + 'B)');
      }
    }
  } catch (e) {
    console.log('  Error: ' + e.message);
  }
}

// Now force a cache purge by uploading a PHP with unique name
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;
const uniqueName = `evg_purge_${Date.now()}.php`;

const php = [
  '<' + '?php',
  'if (($_GET["t"] ?? "") !== "' + INJECT_SECRET + '") die("no");',
  'require_once(dirname(__FILE__) . "/wp-load.php");',
  'header("Content-Type: application/json");',
  '$r = [];',
  '',
  '// Delete all Elementor CSS cache files',
  '$css_dir = WP_CONTENT_DIR . "/uploads/elementor/css/";',
  'if (is_dir($css_dir)) {',
  '  $files = glob($css_dir . "post-*.css");',
  '  foreach ($files as $f) { unlink($f); $r["deleted"][] = basename($f); }',
  '}',
  '',
  '// Clear Elementor global CSS option',
  'delete_option("_elementor_global_css");',
  '',
  '// Clear WP object cache',
  'if (function_exists("wp_cache_flush")) { wp_cache_flush(); $r["wp_cache"] = "flushed"; }',
  '',
  '// Try LiteSpeed purge methods',
  'if (class_exists("LiteSpeed_Cache_API")) {',
  '  LiteSpeed_Cache_API::purge_all();',
  '  $r["ls"] = "api_purged";',
  '} else {',
  '  // Direct delete of LS cache files',
  '  $ls_dir = WP_CONTENT_DIR . "/litespeed/";',
  '  if (is_dir($ls_dir)) {',
  '    $r["ls_dir"] = scandir($ls_dir);',
  '  }',
  '  // Also try DB method',
  '  global $wpdb;',
  '  $wpdb->query("DELETE FROM " . $wpdb->options . " WHERE option_name LIKE \'%litespeed.cache%\'");',
  '  $r["ls"] = "db_cleaned";',
  '}',
  '',
  '$r["status"] = "purged";',
  '$r["time"] = date("c");',
  'echo json_encode($r, JSON_PRETTY_PRINT);',
  '@unlink(__FILE__);',
  '?' + '>',
].join('\n');

const phpPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(phpPath, php);
await c.uploadFrom(phpPath, uniqueName);
console.log('\n🚀 Purging caches via ' + uniqueName);

const resp = await fetch(WP_URL + '/' + uniqueName + '?t=' + INJECT_SECRET, {
  headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
  signal: AbortSignal.timeout(30000)
});
const text = await resp.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log('Response:', text.substring(0, 300));
}

c.close();
