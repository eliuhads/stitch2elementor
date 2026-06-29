/**
 * scripts/deploy_all_pages_pure.mjs
 * 
 * PURE HTML STITCH LAYOUT INJECTOR FOR ALL PAGES
 * 
 * Dynamically processes all 15 pages defined in page_manifest.json.
 * 1. Reads the original responsive HTML from assets_originales/stitch_v3/.
 * 2. Cleans layout wrappers (header, footer, navigation overlays).
 * 3. Dynamically scans, downloads, converts to WebP, uploads, and registers any missing images.
 * 4. Packages each page into a single Elementor HTML widget container.
 * 5. Deploys it natively using the official Elementor Document Save API via a secure FTP+PHP bridge.
 * 6. Triggers a cache purge.
 */

import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

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
console.log('║  SYSTEM-WIDE PURE HTML STITCH DEPLOYER — ALL PAGES              ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !INJECT_SECRET || !WP_URL) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

// Ensure temp directories exist
const downloadDir = path.join(ROOT, 'temp/downloads');
const webpDir = path.join(ROOT, 'temp/webp');
fs.mkdirSync(downloadDir, { recursive: true });
fs.mkdirSync(webpDir, { recursive: true });

// Load manifest
const manifestPath = path.join(ROOT, 'page_manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ page_manifest.json not found!');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Load image mapping
const mappingPath = path.join(ROOT, 'temp/image_mapping.json');
let imageMapping = {};
if (fs.existsSync(mappingPath)) {
  imageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
}
console.log(`📊 Loaded ${Object.keys(imageMapping).length} existing image mappings.`);

async function registerMissingImage(originalUrl) {
  const nextIndex = Object.keys(imageMapping).length + 1;
  const filename = `imagen_stich_${nextIndex}.webp`;
  const localDownloadPath = path.join(downloadDir, `img_${nextIndex}`);
  const localWebpPath = path.join(webpDir, filename);

  console.log(`📥 Downloading missing image [${nextIndex}]: ${originalUrl.substring(0, 70)}...`);
  try {
    const res = await fetch(originalUrl);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(localDownloadPath, buffer);

    // Convert to WebP using sharp
    await sharp(localDownloadPath)
      .webp({ quality: 82, effort: 6 })
      .toFile(localWebpPath);

    console.log(`⚡ Converted to WebP: ${filename}`);

    // Upload via FTP
    const client = new Client();
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });

    const remotePath = `/wp-content/uploads/stitch/${filename}`;
    await client.uploadFrom(localWebpPath, remotePath);
    console.log(`📤 Uploaded image to ${remotePath}`);
    client.close();

    // Register attachment in WP via PHP
    const phpRegister = `<?php
    define('SHORTINIT', false);
    require_once(__DIR__ . '/wp-load.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
        die('forbidden');
    }
    
    global $wpdb;
    $full_path = ABSPATH . 'wp-content/uploads/stitch/${filename}';
    
    // Check if registered
    $relative_meta_value = 'stitch/${filename}';
    $attach_id = $wpdb->get_var($wpdb->prepare(
        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value = %s",
        $relative_meta_value
    ));
    
    if (!$attach_id) {
        $filetype = wp_check_filetype(basename($full_path));
        $attachment = [
            'post_mime_type' => $filetype['type'],
            'post_title'     => 'Stitch Image - ' . basename($filename, '.webp'),
            'post_content'   => '',
            'post_status'    => 'inherit'
        ];
        $attach_id = wp_insert_attachment($attachment, $full_path);
        if ($attach_id && !is_wp_error($attach_id)) {
            $attach_data = wp_generate_attachment_metadata($attach_id, $full_path);
            wp_update_attachment_metadata($attach_id, $attach_data);
            update_post_meta($attach_id, '_wp_attachment_image_alt', 'Imagen Stitch - Evergreen LED');
        }
    }
    
    @unlink(__FILE__);
    echo json_encode([
        'status' => 'success',
        'id' => (int)$attach_id,
        'url' => wp_get_attachment_url($attach_id)
    ]);
    ?>`;

    const uniqueRegPHP = `wp_reg_img_${Date.now()}_${nextIndex}.php`;
    const regLocalPath = path.join(ROOT, 'temp', uniqueRegPHP);
    fs.writeFileSync(regLocalPath, phpRegister, 'utf8');

    // Upload script
    const client2 = new Client();
    await client2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: true, secureOptions: { rejectUnauthorized: false } });
    await client2.uploadFrom(regLocalPath, uniqueRegPHP);
    client2.close();

    // Trigger
    const execUrl = `${WP_URL}/${uniqueRegPHP}?token=${INJECT_SECRET}`;
    const response = await fetch(execUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      imageMapping[originalUrl] = {
        id: result.id,
        url: result.url
      };
      fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2), 'utf8');
      console.log(`✅ Registered attachment ID: ${result.id} -> ${result.url}`);
      return result.url;
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(result)}`);
    }

  } catch (err) {
    console.error(`❌ Failed to process missing image: ${err.message}`);
    return '/wp-content/uploads/stitch/imagen_stich_10.webp'; // Fallback
  } finally {
    try { fs.unlinkSync(localDownloadPath); } catch {}
    try { fs.unlinkSync(localWebpPath); } catch {}
  }
}

async function processPage(page) {
  const htmlPath = path.join(ROOT, 'assets_originales', page.html);
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Source HTML not found: ${page.html}`);
    return false;
  }

  console.log(`\n📖 Processing: ${page.title} (wp_id: ${page.wp_id})`);
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(rawHtml);

  // Clean elements
  $('input#sidebar-toggle').remove();
  $('label[for="sidebar-toggle"]').remove();
  $('aside.sidebar-nav').remove();
  $('header').remove();
  $('footer').remove();

  // Localize images
  const images = $('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = $(img).attr('src') || '';
    if (src.includes('googleusercontent.com') || src.includes('aida-public') || src.includes('unsplash.com')) {
      let localUrl = '';
      if (imageMapping[src]) {
        localUrl = imageMapping[src].url;
      } else {
        localUrl = await registerMissingImage(src);
      }
      $(img).attr('src', localUrl);
      console.log(`  Mapped image: ${src.substring(0, 40)}... -> ${localUrl}`);
    }
  }

  // Extract body child elements
  let bodyHtml = '';
  $('body > section').each((i, section) => {
    bodyHtml += $.html(section) + '\n';
  });

  if (!bodyHtml.trim()) {
    $('body').children().each((i, child) => {
      const tag = child.tagName;
      if (tag !== 'script' && tag !== 'style' && tag !== 'header' && tag !== 'footer' && tag !== 'input' && tag !== 'label' && tag !== 'aside') {
        bodyHtml += $.html(child) + '\n';
      }
    });
  }

  // Build Elementor JSON Template
  const elementorJson = [
    {
      "id": "stitch_root_" + page.wp_id,
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
          "id": "stitch_html_widget_" + page.wp_id,
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

  const payloadB64 = Buffer.from(JSON.stringify(elementorJson)).toString('base64');
  
  // PHP deployer script
  const phpScript = `<?php
  header('Content-Type: application/json; charset=utf-8');
  if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
      http_response_code(403);
      die(json_encode(['error' => 'Forbidden']));
  }
  
  define('SHORTINIT', false);
  require_once(__DIR__ . '/wp-load.php');
  
  $admins = get_users(['role' => 'administrator']);
  if (!empty($admins)) {
      wp_set_current_user($admins[0]->ID);
  }
  
  if (!class_exists('\\Elementor\\Plugin')) {
      die(json_encode(['status' => 'error', 'reason' => 'Elementor not active']));
  }
  
  $post_id = ${page.wp_id};
  $json_raw = base64_decode('${payloadB64}');
  $elements = json_decode($json_raw, true);
  
  $document = \\Elementor\\Plugin::instance()->documents->get($post_id);
  $save_status = false;
  if ($document) {
      $save_status = $document->save(['elements' => $elements]);
  }
  
  $db_fallback = false;
  if (!$save_status) {
      // Direct database fallback for special pages (e.g. blog page)
      $meta_status = update_post_meta($post_id, '_elementor_data', wp_slash($json_raw));
      update_post_meta($post_id, '_elementor_edit_mode', 'builder');
      update_post_meta($post_id, '_wp_page_template', 'elementor_header_footer');
      
      $body_html = $elements[0]['elements'][0]['settings']['html'];
      $wrapper_type = ($post_id == 175) ? 'header' : (($post_id == 176) ? 'footer' : 'wp-page');
      $full_html = "<div data-elementor-type='{$wrapper_type}' data-elementor-id='{$post_id}' class='elementor elementor-{$post_id}'>\n  <div class='elementor-widget-container'>\n    {$body_html}\n  </div>\n</div>";
      
      global $wpdb;
      $wpdb_status = $wpdb->update(
          $wpdb->posts,
          ['post_content' => $full_html],
          ['ID' => $post_id],
          ['%s'],
          ['%d']
      );
      
      if ($meta_status !== false || $wpdb_status !== false) {
          $db_fallback = true;
      }
  }
  
  delete_post_meta($post_id, '_elementor_css');
  delete_post_meta($post_id, '_elementor_page_assets');
  update_post_meta($post_id, '_elementor_version', '0.0.0');
  clean_post_cache($post_id);
  
  @unlink(__FILE__);
  echo json_encode([
      'status' => ($save_status || $db_fallback) ? 'success' : 'failed',
      'post_id' => $post_id,
      'save_status' => (bool)$save_status,
      'db_fallback' => (bool)$db_fallback
  ]);
  ?>`;

  const uniqueName = `wp_pure_deploy_page_${page.wp_id}_${Date.now()}.php`;
  const phpPath = path.join(ROOT, 'temp', uniqueName);
  fs.writeFileSync(phpPath, phpScript, 'utf8');

  // FTP Upload
  const client = new Client();
  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });

    await client.uploadFrom(phpPath, uniqueName);
    client.close();

    // Trigger execution
    const execUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
    const response = await fetch(execUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    console.log(`🚀 Deployment Status for ID ${page.wp_id}:`, result.status);
    return result.status === 'success';

  } catch (err) {
    console.error(`❌ FTP/PHP Deployment Error for ID ${page.wp_id}:`, err.message);
    return false;
  } finally {
    try { fs.unlinkSync(phpPath); } catch {}
  }
}

async function run() {
  const pagesToDeploy = manifest.pages.filter(p => p.wp_id);
  console.log(`📋 Found ${pagesToDeploy.length} pages in manifest to deploy pure HTML layouts...`);

  for (const page of pagesToDeploy) {
    const success = await processPage(page);
    if (!success) {
      console.log(`⚠️ Failed to deploy page ${page.slug}`);
    }
  }

  console.log('\n🏁 Pure layouts deployment done. Run regenerate_all_posts.mjs to finalize.');
}

run();
