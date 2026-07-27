/**
 * deploy_css_v4.mjs — Upload CSS v4.0 + update MU-Plugin + flush cache
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
const CSS_VER = '4.0.0';

const muPlugin = `<?php
/**
 * Plugin Name: Evergreen Homepage CSS
 * Description: Loads custom CSS for homepage visual parity with Stitch design
 * Version: ${CSS_VER}
 */
add_action('wp_enqueue_scripts', function() {
    if (is_front_page() || is_page(1758)) {
        wp_enqueue_style(
            'evergreen-homepage-custom',
            content_url('/uploads/evergreen-homepage-custom.css'),
            [],
            '${CSS_VER}'
        );
    }
});
`;

const flushPHP = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
delete_post_meta(1758, '_elementor_css');
delete_post_meta(1758, '_elementor_inline_svg');
delete_post_meta(1758, '_elementor_page_assets');
update_post_meta(1758, '_elementor_version', '0.0.0');
clean_post_cache(1758);
delete_post_meta(8, '_elementor_css');
update_post_meta(8, '_elementor_version', '0.0.0');
clean_post_cache(8);
delete_option('elementor-custom-breakpoints-files');
delete_option('_elementor_global_css');
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');
@unlink(__FILE__);
echo json_encode(['status' => 'cache_flushed', 'css_ver' => '${CSS_VER}']);
`;

writeFileSync('temp/evergreen-homepage-css.php', muPlugin);
writeFileSync('temp/flush_cache_v4.php', flushPHP);

async function deploy() {
  const client = new Client();
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
    console.log('✅ FTP connected');

    await client.uploadFrom('temp/evergreen-homepage-custom-v4.css', '/wp-content/uploads/evergreen-homepage-custom.css');
    console.log('✅ CSS v4.0 uploaded');

    await client.uploadFrom('temp/evergreen-homepage-css.php', '/wp-content/mu-plugins/evergreen-homepage-css.php');
    console.log('✅ MU-Plugin updated (ver ' + CSS_VER + ')');

    await client.uploadFrom('temp/flush_cache_v4.php', '/flush_cache_v4.php');
    console.log('✅ Cache flush script uploaded');
    client.close();

    const url = `${WP_URL}/flush_cache_v4.php?token=${INJECT_SECRET}`;
    console.log('⏳ Flushing cache...');
    const response = await fetch(url);
    const text = await response.text();
    console.log(`📦 Response (${response.status}): ${text}`);

    console.log('⏳ Waiting 3s...');
    await new Promise(r => setTimeout(r, 3000));

    const cssCheck = await fetch(`${WP_URL}/wp-content/uploads/evergreen-homepage-custom.css?ver=${CSS_VER}`);
    console.log(`✅ CSS check: ${cssCheck.status} (${cssCheck.headers.get('content-length')} bytes)`);
    console.log('\n🎉 CSS v4.0 deployed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  }
}

deploy();
