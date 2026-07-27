/**
 * upload_homepage_css.mjs — Upload homepage-specific CSS to WordPress
 * and register it as an enqueued stylesheet via mu-plugin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const env = process.env;
const cssPath = path.join(ROOT, 'temp', 'evergreen-homepage-custom.css');

if (!fs.existsSync(cssPath)) {
  console.error('❌ temp/evergreen-homepage-custom.css not found. Run build_homepage_css.mjs first.');
  process.exit(1);
}

const cssContent = fs.readFileSync(cssPath, 'utf8');
console.log(`📦 CSS: ${cssContent.length} bytes`);

// Also create/update the mu-plugin that enqueues the CSS
const muPlugin = `<?php
/**
 * Plugin Name: Evergreen Custom Styles
 * Description: Enqueues global and homepage-specific CSS for Stitch design fidelity.
 * Version: 2.0.0
 */

// Enqueue Google Fonts
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('evergreen-montserrat', 
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;900&display=swap', 
        [], null);
    wp_enqueue_style('evergreen-lato', 
        'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap', 
        [], null);
    wp_enqueue_style('material-symbols', 
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap', 
        [], null);
    
    // Homepage-specific CSS
    wp_enqueue_style('evergreen-homepage-custom', 
        content_url('/uploads/evergreen-homepage-custom.css'), 
        [], '5.0.0');
}, 20);
`;

const client = new Client();

try {
  console.log(`🔗 Connecting to FTP: ${env.FTP_HOST}...`);
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD || env.FTP_PASS,
    secure: true,
    secureOptions: { rejectUnauthorized: false },
  });
  console.log('✅ FTP connected');

  // 1. Upload CSS file
  const cssRemotePath = '/wp-content/uploads/evergreen-homepage-custom.css';
  const tmpCss = path.join(ROOT, 'temp', '_upload_homepage.css');
  fs.writeFileSync(tmpCss, cssContent);
  await client.uploadFrom(tmpCss, cssRemotePath);
  console.log(`✅ Uploaded CSS: ${cssRemotePath}`);

  // 2. Upload mu-plugin
  const muPath = '/wp-content/mu-plugins/evergreen-custom-styles.php';
  const tmpMu = path.join(ROOT, 'temp', '_upload_mu.php');
  fs.writeFileSync(tmpMu, muPlugin);
  
  // Ensure mu-plugins directory exists
  try {
    await client.ensureDir('/wp-content/mu-plugins/');
  } catch(e) {
    // Directory may already exist
  }
  await client.uploadFrom(tmpMu, muPath);
  console.log(`✅ Uploaded mu-plugin: ${muPath}`);

  // Cleanup temp
  fs.unlinkSync(tmpCss);
  fs.unlinkSync(tmpMu);

  // 3. Verify CSS is accessible
  console.log('\n🔍 Verifying CSS file...');
  const resp = await fetch(`${env.WP_URL || env.SITE_URL}/wp-content/uploads/evergreen-homepage-custom.css?v=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(10000),
  });
  console.log(`  HTTP ${resp.status} — ${resp.headers.get('content-type')}`);
  const body = await resp.text();
  console.log(`  Size: ${body.length} bytes`);
  console.log(`  Contains element IDs: ${body.includes('3ad51889') ? '✅' : '❌'}`);

} catch(err) {
  console.error('❌ Error:', err.message);
} finally {
  client.close();
}

console.log('\n🏁 Done');
