/**
 * purge_elementor_css.mjs — Delete Elementor CSS cache files + trigger regeneration
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

// Delete Elementor generated CSS files via FTP
const cssDir = '/public_html/wp-content/uploads/elementor/css/';
console.log('📁 Listing Elementor CSS cache...');
const files = await c.list(cssDir);
const postCss = files.filter(f => f.name.startsWith('post-') && f.name.endsWith('.css'));
console.log(`Found ${postCss.length} post CSS files\n`);

for (const f of postCss) {
  try {
    await c.remove(cssDir + f.name);
    console.log(`  🗑️ Deleted: ${f.name} (${f.size}B)`);
  } catch (e) {
    console.log(`  ⚠️ Failed: ${f.name} — ${e.message}`);
  }
}

// Also delete global CSS
const globalCss = files.filter(f => f.name.startsWith('global-') || f.name.startsWith('base-'));
for (const f of globalCss) {
  try {
    await c.remove(cssDir + f.name);
    console.log(`  🗑️ Deleted: ${f.name}`);
  } catch {}
}

console.log('\n✅ Elementor CSS cache cleared via FTP');

// Now upload a minimal PHP to delete the _elementor_global_css option
// (WAF-safe — no SQL keywords)
const uniqueName = `evg_regen_${Date.now()}.php`;
const php = [
  '<' + '?php',
  'if (($_GET["t"] ?? "") !== "' + env.INJECT_SECRET + '") die("no");',
  'require_once(dirname(__FILE__) . "/wp-load.php");',
  'header("Content-Type: application/json");',
  '$r = array();',
  'delete_option("_elementor_global_css");',
  'wp_cache_flush();',
  'if (class_exists("Elementor\\\\Plugin")) {',
  '  Elementor\\\\Plugin::instance()->files_manager->clear_cache();',
  '  $r["elementor"] = "regenerated";',
  '}',
  '$r["status"] = "ok";',
  '$r["time"] = date("c");',
  'echo json_encode($r);',
  '@unlink(__FILE__);',
  '?' + '>',
].join('\n');

const phpPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(phpPath, php);
await c.uploadFrom(phpPath, uniqueName);
c.close();

console.log('\n🚀 Triggering Elementor CSS regeneration...');
const resp = await fetch((env.WP_URL || env.SITE_URL) + '/' + uniqueName + '?t=' + env.INJECT_SECRET, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cache-Control': 'no-cache' },
  signal: AbortSignal.timeout(30000)
});
const text = await resp.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log('Response:', text.substring(0, 300));
}

// Quick re-check: fetch a page and look for our CSS
console.log('\n🔍 Verification: fetching Nosotros...');
const pageResp = await fetch((env.WP_URL || env.SITE_URL) + '/nosotros/?_=' + Date.now(), {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
  signal: AbortSignal.timeout(15000)
});
const html = await pageResp.text();
const hasGlobalCss = html.includes('evergreen-global');
const hasDarkBg = html.includes('0E1320');
const hasCustomCss = html.includes('body.elementor-page');
console.log(`  evergreen-global link: ${hasGlobalCss ? '✅' : '❌'}`);
console.log(`  Dark bg in source: ${hasDarkBg ? '✅' : '❌'}`);
console.log(`  Custom CSS rules: ${hasCustomCss ? '✅' : '❌'}`);

// Check post-1771.css timestamp
const postCssMatch = html.match(/post-1771\.css\?ver=(\d+)/);
if (postCssMatch) console.log(`  post-1771.css ver: ${postCssMatch[1]} (new if > ${Math.floor(Date.now()/1000)})`);
