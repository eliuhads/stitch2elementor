/**
 * scripts/regenerate_all_posts.mjs
 * 
 * Regene-master script.
 * Reads the page_manifest.json to collect all active Page, Header, and Footer IDs.
 * Generates a temporary, WAF-safe PHP script that:
 * - Bootstraps WordPress and Elementor.
 * - For each post, reads the current _elementor_data from DB.
 * - Programmatically builds a clean HTML representation of the Elementor layout.
 * - Writes that HTML directly into post_content via $wpdb->update (bypassing KSES filters).
 * - Forces Elementor to clear its rendering caches and regenerates the physical post CSS file.
 * - Performs a clean, complete flush of WP Object Cache and LiteSpeed cache.
 */

import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
console.log('║  REGENERATE ALL POSTS — SYSTEM-WIDE ATOMIC RENDER               ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !INJECT_SECRET || !WP_URL) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

// 1. Gather all Page IDs from the manifest
const manifestPath = path.join(ROOT, 'page_manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Manifest file not found!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pageIds = manifest.pages.map(p => p.wp_id).filter(id => id !== null && id !== undefined);

if (manifest.header_id) pageIds.push(manifest.header_id);
if (manifest.footer_id) pageIds.push(manifest.footer_id);

console.log(`📋 Collecting Page IDs for regeneration: ${pageIds.join(', ')}`);

// 2. Generate the WAF-safe PHP script
const phpScript = `<?php
/**
 * System-wide Elementor post content regenerator
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

global $wpdb;

// Rebuilder helper function
function elementor_html_rebuilder($elements) {
    $html = '';
    foreach ($elements as $el) {
        $settings = isset($el['settings']) ? $el['settings'] : [];
        $type = isset($el['widgetType']) ? $el['widgetType'] : (isset($el['elType']) ? $el['elType'] : '');
        
        switch ($type) {
            case 'heading':
                $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                $title = isset($settings['title']) ? $settings['title'] : '';
                if ($title) $html .= "<{$tag} class='elementor-heading-title'>{$title}</{$tag}>\\n";
                break;
            case 'text-editor':
                $editor = isset($settings['editor']) ? $settings['editor'] : '';
                if ($editor) $html .= "<div class='elementor-widget-container'>{$editor}</div>\\n";
                break;
            case 'image':
                $url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                $alt = isset($settings['alt']) ? $settings['alt'] : '';
                if ($url) $html .= '<img src="' . $url . '" alt="' . $alt . '" />\\n';
                break;
            case 'button':
                $text = isset($settings['text']) ? $settings['text'] : '';
                $link = isset($settings['link']['url']) ? $settings['link']['url'] : '#';
                if ($text) $html .= "<a href='{$link}' class='elementor-button'>{$text}</a>\\n";
                break;
            case 'nav-menu':
                $html .= "<nav class='elementor-nav-menu--main'></nav>\\n";
                break;
        }
        
        if (isset($el['elements']) && is_array($el['elements'])) {
            $html .= elementor_html_rebuilder($el['elements']);
        }
    }
    return $html;
}

$page_ids = [${pageIds.join(', ')}];
$results = [];

foreach ($page_ids as $pid) {
    $post = get_post($pid);
    if (!$post) {
        $results[$pid] = ['status' => 'not_found'];
        continue;
    }
    
    // Read _elementor_data
    $raw_meta = get_post_meta($pid, '_elementor_data', true);
    $data = json_decode($raw_meta, true);
    if (!$data) {
        $raw_meta = stripslashes($raw_meta);
        $data = json_decode($raw_meta, true);
    }
    
    if (!$data || !is_array($data)) {
        $results[$pid] = ['status' => 'empty_meta_data'];
        continue;
    }
    
    // Generate clean post_content representation from elements
    $html = elementor_html_rebuilder($data);
    $wrapper_type = ($pid == 175) ? 'header' : (($pid == 176) ? 'footer' : 'wp-page');
    
    $full_html = "<div data-elementor-type='{$wrapper_type}' data-elementor-id='{$pid}' class='elementor elementor-{$pid}'>\\n  {$html}\\n</div>";
    
    // Write directly to DB to bypass KSES filters
    $wpdb->update(
        $wpdb->posts,
        ['post_content' => $full_html],
        ['ID' => $pid],
        ['%s'],
        ['%d']
    );
    
    // Wipe elementor caches for the post
    delete_post_meta($pid, '_elementor_css');
    delete_post_meta($pid, '_elementor_inline_svg');
    delete_post_meta($pid, '_elementor_page_assets');
    update_post_meta($pid, '_elementor_version', '0.0.0');
    clean_post_cache($pid);
    
    $results[$pid] = [
        'status' => 'regenerated',
        'title' => $post->post_title,
        'html_len' => strlen($full_html)
    ];
}

// Clear all options cache and global caches
delete_option('_elementor_global_css');
delete_option('elementor_remote_info_library');

if (function_exists('wp_cache_flush')) wp_cache_flush();

if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $results['litespeed'] = 'purged_api';
} else {
    do_action('litespeed_purge_all');
    $results['litespeed'] = 'action_fired';
}

@unlink(__FILE__);
$results['self_delete'] = !file_exists(__FILE__);

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
?>`;

const uniqueName = `wp_regen_all_${Date.now()}.php`;
const phpPath = path.join(ROOT, 'temp', uniqueName);

if (!fs.existsSync(path.join(ROOT, 'temp'))) {
  fs.mkdirSync(path.join(ROOT, 'temp'), { recursive: true });
}
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

    console.log(`📤 Uploading regeneration trigger: ${uniqueName}...`);
    await client.uploadFrom(phpPath, uniqueName);
    console.log('✅ Upload complete');
    client.close();

    const execUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing: ${WP_URL}/${uniqueName}?token=***\n`);

    const response = await fetch(execUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      signal: AbortSignal.timeout(90000),
    });

    const text = await response.text();
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 REGENERATION RESULTS:');
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
    console.log(`🗑️ PHP self-deleted: ${stillExists ? '❌ STILL EXISTS' : '✅'}`);
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
