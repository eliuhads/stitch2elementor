/**
 * fix_cta_final.mjs — Update MU-Plugin to inject CTA gradient via wp_footer inline style
 * This ensures the gradient loads AFTER all Elementor CSS (post-1758.css etc.)
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

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASS = env.FTP_PASSWORD || env.FTP_PASS;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;

// Updated MU-Plugin: loads external CSS + injects CTA gradient inline AFTER Elementor
const muPlugin = `<?php
/**
 * Plugin Name: Evergreen Homepage Custom CSS
 * Description: Loads custom CSS for homepage parity with Stitch design system
 * Version: 3.0.0
 */

// 1. Load external CSS on homepage
add_action('wp_enqueue_scripts', function() {
    if (is_front_page() || is_page(1758)) {
        wp_enqueue_style(
            'evergreen-homepage-custom',
            home_url('/wp-content/uploads/evergreen-homepage-custom.css'),
            array('elementor-frontend', 'elementor-post-1758'),
            '4.0.0',
            'all'
        );
    }
}, 9999);

// 2. Inject CTA gradient as inline style in footer (loads AFTER all CSS)
add_action('wp_footer', function() {
    if (!is_front_page() && !is_page(1758)) return;
    echo '<style id="evergreen-cta-override">
/* CTA Gradient — injected after all Elementor CSS */
body.elementor-page-1758 .elementor-element.elementor-element-69a22305,
body.elementor-page-1758 .elementor-element.elementor-element-69a22305.e-con,
body.elementor-page-1758 .elementor-element.elementor-element-69a22305.e-con-boxed,
body.elementor-page-1758 [data-id="69a22305"],
.elementor-1758 .elementor-element.elementor-element-69a22305 {
    background: linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%) !important;
    background-color: #1D8A43 !important;
    background-image: linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%) !important;
}
</style>';
}, 99999);
`;

writeFileSync('temp/evergreen-homepage-css.php', muPlugin);
console.log('✅ MU-Plugin v3 written');

// Upload via FTP
const client = new Client();
await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
await client.uploadFrom('temp/evergreen-homepage-css.php', '/wp-content/mu-plugins/evergreen-homepage-css.php');
console.log('✅ MU-Plugin uploaded');

// Also upload a cache-flush PHP
const flushPhp = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

// Flush Elementor CSS for page 1758
delete_post_meta(1758, '_elementor_css');
clean_post_cache(1758);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');

@unlink(__FILE__);
echo json_encode(['status' => 'cache_flushed']);
`;

writeFileSync('temp/flush_cache.php', flushPhp);
await client.uploadFrom('temp/flush_cache.php', '/flush_cache.php');
client.close();
console.log('✅ Cache flush script uploaded');

// Execute cache flush
const resp = await fetch(`${WP_URL}/flush_cache.php?token=${INJECT_SECRET}`);
const text = await resp.text();
console.log(`📦 Cache flush (${resp.status}): ${text}`);

// Wait for propagation
await new Promise(r => setTimeout(r, 3000));
console.log('✅ All done — MU-Plugin v3 with wp_footer inline gradient deployed');
