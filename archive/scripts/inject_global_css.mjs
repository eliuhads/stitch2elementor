/**
 * inject_global_css.mjs — Upload global CSS to WordPress via FTP + PHP
 * 
 * 1. Uploads CSS files directly via FTP
 * 2. Uploads mu-plugin PHP via FTP  
 * 3. Executes a small trigger PHP to flush caches
 */
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const {
  FTP_HOST, FTP_USER, FTP_PASS,
  SITE_URL, INJECT_SECRET
} = process.env;

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  INJECT GLOBAL CSS — Evergreen LED              ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Read CSS files
const globalCss = fs.readFileSync(path.join(ROOT, 'temp', 'evergreen-global.css'), 'utf8');
const homepageCssPath = path.join(ROOT, 'temp', 'evergreen-homepage-custom-v4.css');
const homepageCss = fs.existsSync(homepageCssPath) ? fs.readFileSync(homepageCssPath, 'utf8') : null;

console.log(`📦 Global CSS: ${(globalCss.length / 1024).toFixed(1)}KB`);
if (homepageCss) console.log(`📦 Homepage CSS: ${(homepageCss.length / 1024).toFixed(1)}KB`);

// Create mu-plugin file locally
const muPlugin = `<?php
/**
 * Plugin Name: Evergreen LED Custom Styles
 * Description: Global CSS overrides for Evergreen LED design system
 * Version: 1.0.0
 */

add_action('wp_enqueue_scripts', function() {
  $css_dir = content_url('/uploads/evergreen-css/');
  $css_path = WP_CONTENT_DIR . '/uploads/evergreen-css/';
  
  // Global styles for all pages
  if (file_exists($css_path . 'evergreen-global.css')) {
    wp_enqueue_style(
      'evergreen-global',
      $css_dir . 'evergreen-global.css',
      array('elementor-frontend'),
      filemtime($css_path . 'evergreen-global.css')
    );
  }
  
  // Homepage-specific overrides
  if (is_page(1758) && file_exists($css_path . 'evergreen-homepage-v4.css')) {
    wp_enqueue_style(
      'evergreen-homepage',
      $css_dir . 'evergreen-homepage-v4.css',
      array('evergreen-global'),
      filemtime($css_path . 'evergreen-homepage-v4.css')
    );
  }
}, 999);
`;

// Cache flush script
const flushPhp = `<?php
define('ABSPATH', dirname(__FILE__) . '/');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
  http_response_code(403);
  die('Forbidden');
}
require_once ABSPATH . 'wp-load.php';
header('Content-Type: application/json');
$r = array('status' => 'ok', 'timestamp' => date('c'));
if (class_exists('LiteSpeed_Cache_API')) {
  LiteSpeed_Cache_API::purge_all();
  $r['litespeed'] = 'purged';
}
if (class_exists('Elementor\\\\Plugin')) {
  Elementor\\\\Plugin::instance()->files_manager->clear_cache();
  $r['elementor'] = 'cleared';
}

// Verify files exist
$css_path = WP_CONTENT_DIR . '/uploads/evergreen-css/';
$r['global_css_exists'] = file_exists($css_path . 'evergreen-global.css');
$r['global_css_size'] = $r['global_css_exists'] ? filesize($css_path . 'evergreen-global.css') : 0;
$r['homepage_css_exists'] = file_exists($css_path . 'evergreen-homepage-v4.css');
$r['mu_plugin_exists'] = file_exists(WP_CONTENT_DIR . '/mu-plugins/evergreen-custom-styles.php');

echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
`;

// Write temp files
const muPath = path.join(ROOT, 'temp', 'evergreen-custom-styles.php');
const flushPath = path.join(ROOT, 'temp', 'flush_and_verify.php');
fs.writeFileSync(muPath, muPlugin);
fs.writeFileSync(flushPath, flushPhp);

// Write CSS files locally for FTP upload
const globalCssPath = path.join(ROOT, 'temp', 'evergreen-global.css');
const hpCssPath = path.join(ROOT, 'temp', 'evergreen-homepage-v4.css');
if (homepageCss) fs.writeFileSync(hpCssPath, homepageCss);

// FTP Upload all files
console.log(`\n🔗 Connecting to FTP: ${FTP_HOST}...`);
const client = new ftp.Client();
try {
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASS,
    secure: false
  });
  console.log('✅ FTP connected\n');

  // Ensure CSS directory exists
  await client.ensureDir('/public_html/wp-content/uploads/evergreen-css/');
  await client.cd('/');
  
  // Upload CSS files
  console.log('📤 Uploading global CSS...');
  await client.uploadFrom(globalCssPath, '/public_html/wp-content/uploads/evergreen-css/evergreen-global.css');
  console.log('  ✅ evergreen-global.css uploaded');
  
  if (homepageCss) {
    console.log('📤 Uploading homepage CSS...');
    await client.uploadFrom(hpCssPath, '/public_html/wp-content/uploads/evergreen-css/evergreen-homepage-v4.css');
    console.log('  ✅ evergreen-homepage-v4.css uploaded');
  }
  
  // Upload mu-plugin
  console.log('📤 Uploading mu-plugin...');
  await client.ensureDir('/public_html/wp-content/mu-plugins/');
  await client.cd('/');
  await client.uploadFrom(muPath, '/public_html/wp-content/mu-plugins/evergreen-custom-styles.php');
  console.log('  ✅ evergreen-custom-styles.php uploaded');
  
  // Upload cache flush script
  console.log('📤 Uploading cache flush script...');
  await client.uploadFrom(flushPath, '/public_html/flush_and_verify.php');
  console.log('  ✅ flush_and_verify.php uploaded');
  
} finally {
  client.close();
}

// Execute cache flush and verify
const url = `${SITE_URL}/flush_and_verify.php?token=${INJECT_SECRET}`;
console.log(`\n🚀 Executing cache flush + verify...`);

try {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const text = await resp.text();
  
  try {
    const result = JSON.parse(text);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(result, null, 2));
    console.log('═══════════════════════════════════════════════════════');
  } catch {
    console.log('\n📄 Server response (raw):');
    console.log(text.substring(0, 500));
  }
} catch (err) {
  console.error(`⚠️ Fetch error: ${err.message}`);
  console.log('Files were uploaded via FTP — CSS should still work on next page load.');
}

console.log('\n🏁 Global CSS injection complete!');
