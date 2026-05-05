/**
 * inject_css_per_page.mjs
 * Inyecta CSS global en cada página como Page Custom CSS de Elementor
 * Usa FTP + PHP para actualizar el post_meta _elementor_page_settings
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

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));

// Read the global CSS (remove @import lines — those go in a separate approach)
const globalCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-global.css'), 'utf8');

// Extract just the CSS rules (skip @import lines, we'll add font links separately)
const cssRules = globalCss
  .split('\n')
  .filter(line => !line.startsWith('@import'))
  .join('\n')
  .trim();

// All page IDs (excluding homepage 1758 which has its own CSS)
const pageIds = manifest.pages
  .filter(p => p.wp_id !== 1758)
  .map(p => p.wp_id);

// Also add header and footer
const allIds = [...pageIds];

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT PER-PAGE CSS — Evergreen LED            ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`📦 CSS rules: ${(cssRules.length / 1024).toFixed(1)}KB`);
console.log(`📄 Pages to update: ${allIds.length}`);
console.log(`   IDs: ${allIds.join(', ')}\n`);

// Build PHP that updates Elementor page settings custom_css for each page
const cssB64 = Buffer.from(cssRules).toString('base64');

const phpLines = [
  '<' + '?php',
  "define('ABSPATH', dirname(__FILE__) . '/');",
  "if (($_GET['t'] ?? '') !== '" + INJECT_SECRET + "') { http_response_code(403); die('no'); }",
  "require_once ABSPATH . 'wp-load.php';",
  "header('Content-Type: application/json');",
  "",
  "$css = base64_decode('" + cssB64 + "');",
  "$page_ids = [" + allIds.join(',') + "];",
  "$results = [];",
  "",
  "foreach ($page_ids as $pid) {",
  "  $settings = get_post_meta($pid, '_elementor_page_settings', true);",
  "  if (!is_array($settings)) $settings = [];",
  "  $settings['custom_css'] = 'selector { } ' . \"\\n\" . $css;",
  "  update_post_meta($pid, '_elementor_page_settings', $settings);",
  "  $results[] = ['id' => $pid, 'css_length' => strlen($css), 'status' => 'ok'];",
  "}",
  "",
  "// Also inject Google Fonts link in header template",  
  "$header_id = 1756;",
  "$header_settings = get_post_meta($header_id, '_elementor_page_settings', true);",
  "if (!is_array($header_settings)) $header_settings = [];",
  "$font_css = \"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap');\\n\";",
  "$font_css .= \"@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');\";",
  "$header_settings['custom_css'] = isset($header_settings['custom_css']) ? $font_css . \"\\n\" . $header_settings['custom_css'] : $font_css;",
  "update_post_meta($header_id, '_elementor_page_settings', $header_settings);",
  "$results[] = ['id' => $header_id, 'type' => 'header', 'fonts_injected' => true];",
  "",
  "// Flush Elementor CSS cache",
  "if (class_exists('Elementor\\\\Plugin')) {",
  "  Elementor\\\\Plugin::instance()->files_manager->clear_cache();",
  "  $results[] = ['elementor_cache' => 'cleared'];",
  "}",
  "",
  "// LiteSpeed purge",
  "if (class_exists('LiteSpeed_Cache_API')) {",
  "  LiteSpeed_Cache_API::purge_all();",
  "  $results[] = ['litespeed' => 'purged'];",
  "}",
  "",
  "echo json_encode(['status' => 'success', 'pages_updated' => count($page_ids), 'results' => $results], JSON_PRETTY_PRINT);",
  "@unlink(__FILE__);",
  '?' + '>',
];

const phpContent = phpLines.join("\n");
const phpPath = path.join(ROOT, 'temp', '_inject_css_pages.php');
fs.writeFileSync(phpPath, phpContent);
console.log(`📝 PHP: ${(phpContent.length / 1024).toFixed(1)}KB\n`);

// Upload
const client = new ftp.Client();
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
  await client.uploadFrom(phpPath, '/public_html/_inject_css_pages.php');
  console.log('✅ Uploaded\n');
} finally {
  client.close();
}

// Execute — add cache-busting query param
const ts = Date.now();
const url = `${SITE_URL}/_inject_css_pages.php?t=${INJECT_SECRET}&_=${ts}`;
console.log('🚀 Executing...');

try {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
    },
    signal: AbortSignal.timeout(30000)
  });
  
  const text = await resp.text();
  
  try {
    const json = JSON.parse(text);
    console.log('\n📊 RESULT:');
    console.log(JSON.stringify(json, null, 2));
  } catch {
    if (text.includes('<!doctype') || text.includes('<html')) {
      console.log('⚠️ LiteSpeed cache intercept (HTML response)');
      console.log('   PHP may not have executed. Verifying via FTP...');
      
      const c2 = new ftp.Client();
      await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
      const list = await c2.list('/public_html/');
      const exists = list.find(f => f.name === '_inject_css_pages.php');
      if (exists) {
        console.log('   ❌ PHP still exists — not executed');
        console.log('   → LiteSpeed is blocking PHP execution on root');
        console.log('   → Alternative: place PHP inside wp-admin/ or use WP-CLI');
        
        // Try alternative path: wp-admin
        console.log('\n   🔄 Trying alternative path: /wp-admin/...');
        await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
        // Move to wp-includes (less likely to be cached)
        await c2.rename('/public_html/_inject_css_pages.php', '/public_html/wp-includes/_inject_css_pages.php');
        console.log('   Moved to wp-includes/');
        c2.close();
        
        // Try executing from wp-includes
        const url2 = `${SITE_URL}/wp-includes/_inject_css_pages.php?t=${INJECT_SECRET}&_=${Date.now()}`;
        const resp2 = await fetch(url2, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(30000)
        });
        const text2 = await resp2.text();
        
        try {
          const json2 = JSON.parse(text2);
          console.log('\n   📊 RESULT (from wp-includes):');
          console.log(JSON.stringify(json2, null, 2));
        } catch {
          console.log('   Response:', text2.substring(0, 200));
        }
      } else {
        console.log('   ✅ PHP self-deleted — execution successful!');
      }
      c2.close();
    } else {
      console.log('📄 Response:', text.substring(0, 500));
    }
  }
} catch (err) {
  console.error('⚠️ Error:', err.message);
}
