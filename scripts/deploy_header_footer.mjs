/**
 * scripts/deploy_header_footer.mjs
 * Uploads a PHP helper to inject Header and Footer Master templates natively
 * in the WordPress database and configures global theme conditions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

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

console.log('━━━ Deploy Header & Footer Master Templates ━━━\n');

// Read JSON files
const headerPath = path.join(ROOT, 'elementor_jsons/header.json');
const footerPath = path.join(ROOT, 'elementor_jsons/footer.json');

if (!fs.existsSync(headerPath) || !fs.existsSync(footerPath)) {
  console.error('❌ Missing header.json or footer.json in elementor_jsons/');
  process.exit(1);
}

const headerJson = fs.readFileSync(headerPath, 'utf8');
const footerJson = fs.readFileSync(footerPath, 'utf8');

const headerB64 = Buffer.from(headerJson).toString('base64');
const footerB64 = Buffer.from(footerJson).toString('base64');

console.log(`📦 Header JSON size: ${headerJson.length} bytes -> ${headerB64.length} b64`);
console.log(`📦 Footer JSON size: ${footerJson.length} bytes -> ${footerB64.length} b64`);

const phpScript = `<?php
/**
 * Auto-generated WordPress Header & Footer builder
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

$templates = [
    'Header Master' => [
        'b64' => '${headerB64}',
        'type' => 'header'
    ],
    'Footer Master' => [
        'b64' => '${footerB64}',
        'type' => 'footer'
    ]
];

$results = [];

foreach ($templates as $title => $info) {
    $tmpl_type = $info['type'];
    $raw_json = base64_decode($info['b64']);
    $data = json_decode($raw_json, true);
    
    if (!$data) {
        $results[$title] = ['status' => 'error', 'reason' => 'Failed to decode JSON'];
        continue;
    }
    
    // Menu Auto-Discovery and Injection for Header Nav-Menu
    if ($tmpl_type === 'header') {
        $menu_term = get_term_by('name', 'Ppal Desktop', 'nav_menu');
        if (!$menu_term) {
            $menu_term = get_term_by('name', 'Main Menu', 'nav_menu');
        }
        if (!$menu_term) {
            $menus = wp_get_nav_menus();
            if (!empty($menus)) {
                $menu_term = $menus[0];
            }
        }
        if ($menu_term) {
            $inject_menu = function(&$elements) use (&$inject_menu, $menu_term) {
                foreach ($elements as &$el) {
                    if (isset($el['widgetType']) && $el['widgetType'] === 'nav-menu') {
                        $el['settings']['menu'] = $menu_term->term_id;
                    }
                    if (!empty($el['elements'])) {
                        $inject_menu($el['elements']);
                    }
                }
            };
            $inject_menu($data);
            $results[$title]['menu_injected'] = $menu_term->name;
        } else {
            $results[$title]['menu_warning'] = 'No nav menus found in database';
        }
    }
    
    // Purge ANY existing posts with the same title
    $existing = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type IN ('page', 'elementor_library')", $title));
    if (!empty($existing)) {
        foreach ($existing as $eid) {
            wp_delete_post($eid, true);
        }
        $results[$title]['purged_old_ids'] = $existing;
    }
    
    // Create natively as Theme Builder Template
    $page_id = wp_insert_post([
        'post_title' => $title,
        'post_name' => sanitize_title($title),
        'post_type' => 'elementor_library',
        'post_status' => 'publish'
    ]);
    
    if (is_wp_error($page_id)) {
        $results[$title] = ['status' => 'error', 'reason' => $page_id->get_error_message()];
        continue;
    }
    
    // Meta for elementor library 
    update_post_meta($page_id, '_wp_page_template', 'elementor_header_footer');
    update_post_meta($page_id, '_elementor_data', wp_slash(json_encode($data)));
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    update_post_meta($page_id, '_elementor_template_type', $tmpl_type);
    update_post_meta($page_id, '_elementor_conditions', ['include/general']);
    wp_set_object_terms($page_id, $tmpl_type, 'elementor_library_type');
    
    // Set Global Conditions in Elementor Pro Option
    $conditions = get_option('elementor_pro_theme_builder_conditions', []);
    if (!is_array($conditions)) $conditions = [];
    $conditions[$page_id] = [
        [ 'type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '' ]
    ];
    update_option('elementor_pro_theme_builder_conditions', $conditions);
    
    // Clear cache
    if (class_exists('\\Elementor\\Plugin') && isset(\\Elementor\\Plugin::instance()->posts_manager)) {
        \\Elementor\\Plugin::instance()->posts_manager->clear_cache($page_id);
    }
    
    $results[$title] = ['status' => 'created', 'id' => $page_id, 'type' => "global_$tmpl_type"];
}

// Flush Elementor Global Cache
if (class_exists('\\Elementor\\Plugin')) {
    \\Elementor\\Plugin::instance()->files_manager->clear_cache();
}

if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);
echo json_encode([
    'success' => true,
    'results' => $results,
    'cache' => 'cleared_and_purged'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>`;

const tempDir = path.join(ROOT, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const phpFile = `evg_deploy_hf_${Date.now()}.php`;
const phpPath = path.join(tempDir, phpFile);
fs.writeFileSync(phpPath, phpScript, 'utf8');

async function run() {
  const client = new Client();
  try {
    console.log(`🔗 Connecting to FTP: ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });
    console.log('✅ FTP connected');
    
    await client.uploadFrom(phpPath, phpFile);
    console.log(`✅ Uploaded: ${phpFile}`);
    
    const execUrl = `${WP_URL}/${phpFile}?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing deployer via HTTP: ${execUrl.replace(INJECT_SECRET, '***')}`);
    
    const response = await fetch(execUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('\n📊 DEPLOY RESULTS:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('❌ Error during deployment:', err.message);
  } finally {
    client.close();
    try { fs.unlinkSync(phpPath); } catch(e) {}
  }
}

run();
