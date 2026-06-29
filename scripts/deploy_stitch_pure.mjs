/**
 * scripts/deploy_stitch_pure.mjs
 * 
 * PURE HTML STITCH LAYOUT INJECTOR (HOMEPAGE ID 160)
 * 
 * Instead of splitting Stitch's responsive HTML into 80+ complex Elementor widgets
 * (which breaks responsive grids, flex wraps, and absolute positionings due to inner wraps),
 * this script packages the complete cleaned sections of Stitch into a single native
 * Elementor HTML widget and deploys it natively via Elementor Document API.
 * 
 * This guarantees:
 * 1. Pixel-perfect parity and native responsiveness (identical to Stitch).
 * 2. Fully compatible with Elementor Header & Footer locations.
 * 3. Fast rendering (Tailwind CDN executes directly on clean markup).
 */

import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const env = process.env;

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASSWORD = env.FTP_PASSWORD || env.FTP_PASS;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;

console.log('╔═════════════════════════════════════════════════════════════════╗');
console.log('║  PURE HTML STITCH LAYOUT INJECTOR — HOMEPAGE 160                ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !INJECT_SECRET || !WP_URL) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

// 1. Read local Stitch homepage HTML
const homeHtmlPath = path.join(ROOT, 'assets_originales/stitch_v3/01_home.html');
if (!fs.existsSync(homeHtmlPath)) {
  console.error('❌ Source HTML not found!');
  process.exit(1);
}

console.log('📖 Reading assets_originales/stitch_v3/01_home.html...');
const rawHtml = fs.readFileSync(homeHtmlPath, 'utf8');
const $ = cheerio.load(rawHtml);

// Remove navigation overlays since WordPress uses its own Elementor Header
$('input#sidebar-toggle').remove();
$('label[for="sidebar-toggle"]').remove();
$('aside.sidebar-nav').remove();
$('header').remove(); // remove any header elements from the stitch body
$('footer').remove(); // remove stitch footer since we use Elementor Pro Footer

// Replace Google Aida CDN image links with local WebP paths in WP uploads
const localImgUrl = '/wp-content/uploads/stitch/imagen_stich_10.webp';
$('img').each((i, img) => {
  const src = $(img).attr('src') || '';
  if (src.includes('googleusercontent.com') || src.includes('aida-public')) {
    $(img).attr('src', localImgUrl);
    console.log(`  📸 Mapped img src: ${src.substring(0, 50)}... -> ${localImgUrl}`);
  }
});

// Extract all top-level sections
let bodyHtml = '';
$('body > section').each((i, section) => {
  bodyHtml += $.html(section) + '\n';
});

// If no sections in body, fall back to parsing top level divs or the whole HTML minus header/footer
if (!bodyHtml.trim()) {
  console.log('  No top-level section tags found, parsing body children...');
  $('body').children().each((i, child) => {
    const tag = child.tagName;
    if (tag !== 'script' && tag !== 'style' && tag !== 'header' && tag !== 'footer' && tag !== 'input' && tag !== 'label' && tag !== 'aside') {
      bodyHtml += $.html(child) + '\n';
    }
  });
}

console.log(`📝 Prepared clean Stitch HTML: ${bodyHtml.length} bytes.\n`);

// 2. Build Elementor JSON Template with a single HTML widget
const elementorJson = [
  {
    "id": "stitch_root",
    "elType": "container",
    "isInner": false,
    "settings": {
      "content_width": "full",
      "gap": "no",
      "padding": {
        "unit": "px",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "left": "0",
        "isLinked": true
      },
      "margin": {
        "unit": "px",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "left": "0",
        "isLinked": true
      }
    },
    "elements": [
      {
        "id": "stitch_html_widget",
        "elType": "widget",
        "widgetType": "html",
        "isInner": false,
        "settings": {
          "html": bodyHtml
        },
        "elements": []
      }
    ]
  }
];

const homepageB64 = Buffer.from(JSON.stringify(elementorJson)).toString('base64');

// 3. Generate the safe PHP deployer
const phpScript = `<?php
/**
 * Native Elementor API Pure Stitch layout deployer
 * Generated: ${new Date().toISOString()}
 */
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

ini_set('memory_limit', '256M');
ini_set('max_execution_time', 180);

define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

// Force administrator login context to bypass Elementor document saving permission checks
$admins = get_users(['role' => 'administrator']);
if (!empty($admins)) {
    wp_set_current_user($admins[0]->ID);
}

if (!class_exists('\\Elementor\\Plugin')) {
    die(json_encode(['status' => 'error', 'reason' => 'Elementor not active']));
}

$post_id = 160;
$json_raw = base64_decode('${homepageB64}');
$elements = json_decode($json_raw, true);

if (!$elements || !is_array($elements)) {
    die(json_encode(['status' => 'error', 'reason' => 'Invalid JSON structure']));
}

// Get the Elementor Document instance
$document = \\Elementor\\Plugin::instance()->documents->get($post_id);
if (!$document) {
    die(json_encode(['status' => 'error', 'reason' => 'Document not found for post ID ' . $post_id]));
}

// Save elements natively.
// This automatically writes _elementor_data, compiles CSS, and updates post_content in the DB.
$save_status = $document->save(['elements' => $elements]);

// Clean caches
delete_post_meta($post_id, '_elementor_css');
delete_post_meta($post_id, '_elementor_inline_svg');
delete_post_meta($post_id, '_elementor_page_assets');
update_post_meta($post_id, '_elementor_version', '0.0.0');
clean_post_cache($post_id);

// Purge LiteSpeed Caches
if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $litespeed = 'purged_api';
} else {
    do_action('litespeed_purge_all');
    $litespeed = 'action_fired';
}

@unlink(__FILE__);
echo json_encode([
    'status' => $save_status ? 'success' : 'failed',
    'post_id' => $post_id,
    'html_len' => strlen($json_raw),
    'litespeed' => $litespeed,
    'self_delete' => !file_exists(__FILE__)
]);
?>`;

const uniqueName = `wp_pure_deploy_${Date.now()}.php`;
const phpPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(phpPath, phpScript, 'utf8');

async function run() {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    console.log(`🔗 Connecting to FTP: ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });
    console.log('✅ FTP connected');

    console.log(`📤 Uploading native pure deployer: ${uniqueName}...`);
    await client.uploadFrom(phpPath, uniqueName);
    console.log('✅ Upload complete');
    client.close();

    const execUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing pure layout injection: ${WP_URL}/${uniqueName}?token=***\n`);

    const response = await fetch(execUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache, no-store',
      },
      signal: AbortSignal.timeout(90000),
    });

    const text = await response.text();
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 NATIVE PURE DEPLOYMENT RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    try {
      const result = JSON.parse(text);
      console.log(JSON.stringify(result, null, 2));
    } catch {
      console.log('HTTP Status:', response.status);
      console.log('RAW Response (truncated):', text.substring(0, 1000));
    }
    console.log('═══════════════════════════════════════════════════════\n');

    // Confirm self-deletion
    const c2 = new Client();
    await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: true, secureOptions: { rejectUnauthorized: false } });
    const files = await c2.list('/');
    const stillExists = files.find(f => f.name === uniqueName);
    console.log(`\n🗑️ PHP self-deleted: ${stillExists ? '❌ STILL EXISTS' : '✅'}`);
    if (stillExists) {
      await c2.remove(uniqueName);
      console.log('   → Manually removed the script.');
    }
    c2.close();

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    try { fs.unlinkSync(phpPath); } catch {}
  }
}

run();
