/**
 * scripts/download_optimize_upload_images.mjs
 * Centralized script to:
 * 1. Find all Google CDN and Unsplash image URLs in local Elementor JSON files.
 * 2. Download and optimize them into WebP locally using 'sharp'.
 * 3. Upload them via FTP to the WordPress host.
 * 4. Register them in the WordPress Media Library via a temporary PHP script (idempotent, prevents duplicates).
 * 5. Update local JSON templates with new local media URLs and attachment IDs.
 * 6. Inject the updated layout and HTML representation into the WordPress database for all 15 pages.
 * 7. Force clear and rebuild Elementor CSS and clear LiteSpeed cache.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load environment variables (merging both local and parent .env)
dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET;
const WP_URL = process.env.WP_URL || process.env.SITE_URL;

console.log('╔═════════════════════════════════════════════════════════════════╗');
console.log('║  STITCH TO WEBP PIPELINE — DOWNLOAD, CONVERT, UPLOAD & INJECT   ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !INJECT_SECRET || !WP_URL) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 1. EXTRACT ALL EXTERNAL IMAGE URLS FROM JSON FILES
// ─────────────────────────────────────────────────────────────

const jsonsDir = path.join(ROOT, 'elementor_jsons');
const jsonFiles = fs.readdirSync(jsonsDir).filter(f => f.endsWith('.json'));

const allExternalUrls = new Set();

function findExternalUrls(obj, urlsSet = new Set()) {
  if (typeof obj === 'string') {
    if (obj.startsWith('http') && (obj.includes('lh3.googleusercontent.com') || obj.includes('images.unsplash.com'))) {
      urlsSet.add(obj);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      findExternalUrls(item, urlsSet);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      findExternalUrls(obj[key], urlsSet);
    }
  }
  return urlsSet;
}

console.log('🔍 Scanning Elementor JSON templates for external URLs...');
for (const file of jsonFiles) {
  const content = fs.readFileSync(path.join(jsonsDir, file), 'utf8');
  try {
    const data = JSON.parse(content);
    const urls = findExternalUrls(data);
    if (urls.size > 0) {
      console.log(`  Found ${urls.size} external URLs in ${file}`);
      for (const u of urls) {
        allExternalUrls.add(u);
      }
    }
  } catch (err) {
    console.error(`  ❌ Error parsing ${file}:`, err.message);
  }
}

const uniqueUrls = Array.from(allExternalUrls);
console.log(`\n📊 Total unique external image URLs found: ${uniqueUrls.length}\n`);

if (uniqueUrls.length === 0) {
  console.log('🎉 No external images to process!');
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────
// 2. DOWNLOAD AND OPTIMIZE TO WEBP LOCALLY
// ─────────────────────────────────────────────────────────────

const downloadDir = path.join(ROOT, 'temp/downloads');
const webpDir = path.join(ROOT, 'temp/webp');
fs.mkdirSync(downloadDir, { recursive: true });
fs.mkdirSync(webpDir, { recursive: true });

const urlMap = [];

for (let i = 0; i < uniqueUrls.length; i++) {
  const originalUrl = uniqueUrls[i];
  const index = i + 1;
  const webpFilename = `imagen_stich_${index}.webp`;
  const localDownloadPath = path.join(downloadDir, `img_${index}`);
  const localWebpPath = path.join(webpDir, webpFilename);
  
  urlMap.push({
    originalUrl,
    index,
    filename: webpFilename,
    localDownloadPath,
    localWebpPath,
    success: false
  });
}

console.log('⏳ Downloading images and converting to highly-optimized WebP...');
for (const item of urlMap) {
  console.log(`\n📥 [${item.index}/${urlMap.length}] Downloading: ${item.originalUrl.substring(0, 80)}...`);
  try {
    const res = await fetch(item.originalUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(item.localDownloadPath, buffer);
    console.log(`  Saved raw image locally (${(buffer.length / 1024).toFixed(0)} KB)`);
    
    // Convert using sharp
    await sharp(item.localDownloadPath)
      .webp({ quality: 82, effort: 6 })
      .toFile(item.localWebpPath);
    
    const webpSize = fs.statSync(item.localWebpPath).size;
    console.log(`  ⚡ Converted to WebP: ${item.filename} (${(webpSize / 1024).toFixed(0)} KB)`);
    item.success = true;
  } catch (err) {
    console.error(`  ❌ Failed image download/conversion:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. FTP UPLOAD TO WORDPRESS
// ─────────────────────────────────────────────────────────────

const successfulItems = urlMap.filter(item => item.success);
console.log(`\n📤 Successfully prepared ${successfulItems.length} WebP images. Connecting to FTP...`);

const client = new Client();
try {
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: false,
  });
  console.log('✅ FTP connected');
  
  // Ensure the upload directory /wp-content/uploads/stitch/ exists
  try {
    await client.ensureDir('/wp-content/uploads/stitch');
    await client.cd('/');
  } catch(e) { 
    console.log('  Note: stitch folder directory setup status:', e.message); 
  }
  
  // Upload WebP images
  for (const item of successfulItems) {
    const remotePath = `/wp-content/uploads/stitch/${item.filename}`;
    await client.uploadFrom(item.localWebpPath, remotePath);
    console.log(`  Uploaded: ${remotePath}`);
    item.remotePath = remotePath;
  }
} catch (err) {
  console.error('❌ FTP Upload error:', err.message);
  client.close();
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 4. REGISTER IMAGES IN WORDPRESS MEDIA LIBRARY VIA DYNAMIC PHP
// ─────────────────────────────────────────────────────────────

console.log('\n🎟️ Generating dynamic PHP helper to register images in WP Media Library...');

const uploadListPHP = successfulItems.map(item => {
  return `    [
        'file' => '${item.remotePath}',
        'original_url' => '${item.originalUrl.replace(/'/g, "\\'")}',
        'filename' => '${item.filename}'
    ]`;
}).join(',\n');

const registerScriptPHP = `<?php
/**
 * Dynamic WordPress Attachment Registration helper
 * Automatically maps FTP-uploaded files to Media Library and returns JSON
 * Self-deletes immediately.
 */
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

global $wpdb;
$uploaded_files = [
${uploadListPHP}
];

$mapping = [];

foreach ($uploaded_files as $file_info) {
    $remote_file = $file_info['file'];
    $original_url = $file_info['original_url'];
    $filename = $file_info['filename'];
    
    $full_path = ABSPATH . ltrim($remote_file, '/');
    if (!file_exists($full_path)) {
        continue;
    }
    
    // Idempotent Check: Is it already registered in media library?
    $relative_meta_value = 'stitch/' . $filename;
    $attach_id = $wpdb->get_var($wpdb->prepare(
        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value = %s",
        $relative_meta_value
    ));
    
    if (!$attach_id) {
        // Register attachment
        $filetype = wp_check_filetype(basename($full_path));
        $attachment = [
            'post_mime_type' => $filetype['type'],
            'post_title'     => 'Stitch Image - ' . preg_replace('/\\.[^.]+$/', '', $filename),
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
    
    if ($attach_id && !is_wp_error($attach_id)) {
        $mapping[$original_url] = [
            'id' => (int)$attach_id,
            'url' => wp_get_attachment_url($attach_id)
        ];
    }
}

@unlink(__FILE__);
echo json_encode([
    'status' => 'success',
    'mapping' => $mapping
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>`;

const regPhpFile = `evg_reg_images_${Date.now()}.php`;
const regLocalPath = path.join(ROOT, 'temp', regPhpFile);
fs.writeFileSync(regLocalPath, registerScriptPHP, 'utf8');

let imageMapping = {};

try {
  console.log(`📤 Uploading registration script: ${regPhpFile}...`);
  await client.uploadFrom(regLocalPath, regPhpFile);
  
  const regUrl = `${WP_URL}/${regPhpFile}?token=${INJECT_SECRET}`;
  console.log(`🚀 Executing registration via HTTP: ${regUrl.replace(INJECT_SECRET, '***')}`);
  
  const response = await fetch(regUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const result = await response.json();
  if (result.status === 'success') {
    imageMapping = result.mapping;
    console.log(`✅ WordPress successfully registered ${Object.keys(imageMapping).length} media items.`);
  } else {
    throw new Error(`WordPress error: ${JSON.stringify(result)}`);
  }
} catch (err) {
  console.error('❌ Error during WordPress registration:', err.message);
  client.close();
  try { fs.unlinkSync(regLocalPath); } catch(e) {}
  process.exit(1);
} finally {
  try { fs.unlinkSync(regLocalPath); } catch(e) {}
}

// Save image mapping locally for audit/reference
fs.writeFileSync(path.join(ROOT, 'temp/image_mapping.json'), JSON.stringify(imageMapping, null, 2), 'utf8');
console.log('💾 Saved image mapping to temp/image_mapping.json');

// ─────────────────────────────────────────────────────────────
// 5. UPDATE LOCAL ELEMENTOR JSON TEMPLATES
// ─────────────────────────────────────────────────────────────

console.log('\n📝 Replacing external references inside local Elementor JSON files...');

function updateElementorUrls(obj, mapping) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        updateElementorUrls(obj[i], mapping);
      }
    }
  } else if (obj !== null && typeof obj === 'object') {
    // Check if this object is an Elementor image block
    if (typeof obj.url === 'string' && mapping[obj.url]) {
      const mapped = mapping[obj.url];
      obj.url = mapped.url;
      if ('id' in obj) {
        obj.id = mapped.id;
      }
      if ('source' in obj) {
        obj.source = 'library';
      }
    }
    
    // Also recursively update all child keys
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        updateElementorUrls(obj[key], mapping);
      } else if (typeof obj[key] === 'string' && mapping[obj[key]]) {
        obj[key] = mapping[obj[key]].url;
      }
    }
  }
}

for (const file of jsonFiles) {
  const jsonPath = path.join(jsonsDir, file);
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  try {
    const data = JSON.parse(jsonContent);
    const initialStr = JSON.stringify(data);
    
    updateElementorUrls(data, imageMapping);
    
    const finalStr = JSON.stringify(data, null, 4);
    if (initialStr !== JSON.stringify(data)) {
      fs.writeFileSync(jsonPath, finalStr, 'utf8');
      console.log(`  Updated: ${file}`);
    } else {
      console.log(`  No images replaced in: ${file}`);
    }
  } catch (err) {
    console.error(`  ❌ Error updating ${file}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 6. DB INJECTION — BULK UPDATE WP DATABASE FOR ALL 15 PAGES
// ─────────────────────────────────────────────────────────────

console.log('\n💾 Generating WordPress database bulk update script...');

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const pageWpIds = manifest.pages.map(p => p.wp_id).filter(id => id !== null && id !== undefined);

if (pageWpIds.length === 0) {
  console.error('❌ No active Page IDs found in page_manifest.json! Make sure the pages exist.');
  client.close();
  process.exit(1);
}

console.log(`📋 Found active WordPress Page IDs: ${pageWpIds.join(', ')}`);

// Encode the replacements array into the PHP script to replace URLs in HTML rendering (post_content)
const oldUrlsPHP = Object.keys(imageMapping);
const newUrlsPHP = Object.keys(imageMapping).map(k => imageMapping[k].url);

const dbInjectPHP = `<?php
/**
 * Auto-generated WordPress database injection script
 * Bulks update _elementor_data and post_content to replace external image links
 * Self-deletes immediately.
 */
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

global $wpdb;

$page_ids = [${pageWpIds.join(', ')}];
$mapping = json_decode('${JSON.stringify(imageMapping)}', true);

$old_urls = json_decode('${JSON.stringify(oldUrlsPHP)}', true);
$new_urls = json_decode('${JSON.stringify(newUrlsPHP)}', true);

$results = [];

// Recursive JSON updater function in PHP
function php_update_elementor_urls(&$elements, $map) {
    foreach ($elements as &$el) {
        if (isset($el['widgetType']) && $el['widgetType'] === 'image') {
            if (isset($el['settings']['image']['url']) && isset($map[$el['settings']['image']['url']])) {
                $mapped = $map[$el['settings']['image']['url']];
                $el['settings']['image']['url'] = $mapped['url'];
                $el['settings']['image']['id'] = (int)$mapped['id'];
                $el['settings']['image']['source'] = 'library';
            }
        }
        
        // Handle generic key values
        if (isset($el['settings']) && is_array($el['settings'])) {
            foreach ($el['settings'] as $key => $val) {
                if (is_string($val) && isset($map[$val])) {
                    $el['settings'][$key] = $map[$val]['url'];
                } elseif (is_array($val)) {
                    // Check sub-arrays like image block or backgrounds
                    if (isset($val['url']) && isset($map[$val['url']])) {
                        $el['settings'][$key]['url'] = $map[$val['url']]['url'];
                        if (array_key_exists('id', $val)) {
                            $el['settings'][$key]['id'] = (int)$map[$val['url']]['id'];
                        }
                        if (array_key_exists('source', $val)) {
                            $el['settings'][$key]['source'] = 'library';
                        }
                    }
                }
            }
        }
        
        if (!empty($el['elements']) && is_array($el['elements'])) {
            php_update_elementor_urls($el['elements'], $map);
        }
    }
}

foreach ($page_ids as $pid) {
    $post = get_post($pid);
    if (!$post) {
        $results[$pid] = ['status' => 'not_found'];
        continue;
    }
    
    // 1. Update _elementor_data post meta
    $json_raw = get_post_meta($pid, '_elementor_data', true);
    if (is_string($json_raw)) {
        $data = json_decode($json_raw, true);
        if ($data === null) {
            $json_raw = stripslashes($json_raw);
            $data = json_decode($json_raw, true);
        }
    }
    
    $meta_updated = false;
    if ($data && is_array($data)) {
        php_update_elementor_urls($data, $mapping);
        $new_json = wp_json_encode($data);
        update_post_meta($pid, '_elementor_data', wp_slash($new_json));
        $meta_updated = true;
    }
    
    // 2. Update post_content (replace URLs inside final HTML rendering)
    $content = $post->post_content;
    $replacements_count = 0;
    
    for ($i = 0; $i < count($old_urls); $i++) {
        $before = $content;
        $content = str_replace($old_urls[$i], $new_urls[$i], $content);
        // Also replace escaped/slashed slashes in JSON-encoded HTML if they exist
        $escaped_old = str_replace('/', '\\/', $old_urls[$i]);
        $escaped_new = str_replace('/', '\\/', $new_urls[$i]);
        $content = str_replace($escaped_old, $escaped_new, $content);
        
        if ($content !== $before) {
            $replacements_count++;
        }
    }
    
    // Update the database using $wpdb
    $wpdb->update(
        $wpdb->posts,
        ['post_content' => $content],
        ['ID' => $pid],
        ['%s'],
        ['%d']
    );
    
    // 3. Clear Elementor CSS cache files
    delete_post_meta($pid, '_elementor_css');
    delete_post_meta($pid, '_elementor_inline_svg');
    delete_post_meta($pid, '_elementor_page_assets');
    update_post_meta($pid, '_elementor_version', '0.0.0');
    clean_post_cache($pid);
    
    $results[$pid] = [
        'status' => 'updated',
        'title' => $post->post_title,
        'elementor_meta_updated' => $meta_updated,
        'html_url_replacements' => $replacements_count
    ];
}

// Global cache purge
delete_option('_elementor_global_css');
if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);
echo json_encode([
    'status' => 'success',
    'pages_processed' => $results,
    'global_cache' => 'flushed'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>`;

const dbInjectFile = `evg_db_inject_imgs_${Date.now()}.php`;
const dbInjectLocalPath = path.join(ROOT, 'temp', dbInjectFile);
fs.writeFileSync(dbInjectLocalPath, dbInjectPHP, 'utf8');

try {
  console.log(`📤 Uploading database injection script: ${dbInjectFile}...`);
  await client.uploadFrom(dbInjectLocalPath, dbInjectFile);
  
  const injectUrl = `${WP_URL}/${dbInjectFile}?token=${INJECT_SECRET}`;
  console.log(`🚀 Executing database injection via HTTP: ${injectUrl.replace(INJECT_SECRET, '***')}`);
  
  const response = await fetch(injectUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const result = await response.json();
  if (result.status === 'success') {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 DATABASE INJECTION RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(JSON.stringify(result.pages_processed, null, 2));
    console.log('═══════════════════════════════════════════════════════\n');
  } else {
    throw new Error(`Database injection error: ${JSON.stringify(result)}`);
  }
} catch (err) {
  console.error('❌ Error during WordPress database injection:', err.message);
} finally {
  client.close();
  try { fs.unlinkSync(dbInjectLocalPath); } catch(e) {}
}

console.log('🏁 Pipeline successfully complete!');
