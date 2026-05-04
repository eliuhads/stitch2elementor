/**
 * fix_cta_js_inject.mjs — Nuclear option: inject gradient via JS in wp_footer
 * Since CSS rules have gradient but computedStyle shows none,
 * there's likely a CSS reset we can't find. JS inline override is definitive.
 */
import { readFileSync, writeFileSync } from 'fs';
import { Client } from 'basic-ftp';

const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx === -1) return;
  const key = line.substring(0, idx).trim();
  let val = line.substring(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  env[key] = val;
});

// MU-Plugin v4: CSS external + inline style + JS force-apply
const muPlugin = `<?php
/**
 * Plugin Name: Evergreen Homepage Custom CSS
 * Description: Loads custom CSS for homepage parity with Stitch design system
 * Version: 4.0.0
 */

// 1. Load external CSS on homepage
add_action('wp_enqueue_scripts', function() {
    if (is_front_page() || is_page(1758)) {
        wp_enqueue_style(
            'evergreen-homepage-custom',
            home_url('/wp-content/uploads/evergreen-homepage-custom.css'),
            array('elementor-frontend'),
            '4.0.0',
            'all'
        );
    }
}, 9999);

// 2. Inject CTA gradient via JS (nuclear — works when CSS fails)
add_action('wp_footer', function() {
    if (!is_front_page() && !is_page(1758)) return;
    echo '<script id="evergreen-cta-fix">
(function(){
    var el = document.querySelector("[data-id=\\"69a22305\\"]");
    if(el){
        el.style.setProperty("background-image","linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%)","important");
        el.style.setProperty("background-color","#1D8A43","important");
        el.style.setProperty("border-radius","16px","important");
        el.style.setProperty("overflow","hidden","important");
    }
    // Also handle the e-con-inner if it exists
    if(el){
        var inner = el.querySelector(".e-con-inner");
        if(inner){
            inner.style.setProperty("background","transparent","important");
            inner.style.setProperty("background-image","none","important");
        }
    }
})();
</script>';
}, 99999);
`;

writeFileSync('temp/evergreen-homepage-css.php', muPlugin);

const client = new Client();
await client.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD || env.FTP_PASS, secure: false });
await client.uploadFrom('temp/evergreen-homepage-css.php', '/wp-content/mu-plugins/evergreen-homepage-css.php');
client.close();

console.log('✅ MU-Plugin v4 deployed (CSS + JS gradient force-apply)');

// Flush cache
const resp = await fetch(`${env.WP_URL || env.SITE_URL}/flush_cache.php?token=${env.INJECT_SECRET}`).catch(() => null);
if (resp) {
  console.log(`📦 Cache: ${await resp.text()}`);
} else {
  // flush_cache.php already self-deleted, upload new one
  const flushPhp = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${env.INJECT_SECRET}') { http_response_code(403); die('forbidden'); }
require_once(__DIR__ . '/wp-load.php');
delete_post_meta(1758, '_elementor_css');
clean_post_cache(1758);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');
@unlink(__FILE__);
echo json_encode(['status' => 'flushed']);`;
  writeFileSync('temp/flush_cache.php', flushPhp);
  const c2 = new Client();
  await c2.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD || env.FTP_PASS, secure: false });
  await c2.uploadFrom('temp/flush_cache.php', '/flush_cache.php');
  c2.close();
  const r2 = await fetch(`${env.WP_URL || env.SITE_URL}/flush_cache.php?token=${env.INJECT_SECRET}`);
  console.log(`📦 Cache: ${await r2.text()}`);
}

await new Promise(r => setTimeout(r, 3000));
console.log('✅ Done');
