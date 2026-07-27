/**
 * scripts/rebuild_homepage.mjs
 * Uploads a PHP helper to inject the new two-column WebP-optimized homepage layout
 * and rebuild the static HTML post_content in the WordPress posts table.
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

console.log('━━━ Rebuild Homepage (ID 22) Static HTML & Meta ━━━\n');

// Read current homepage JSON
const homepageJson = fs.readFileSync(path.join(ROOT, 'elementor_jsons/homepage.json'), 'utf8');
const homepageB64 = Buffer.from(homepageJson).toString('base64');
console.log(`📦 Homepage JSON size: ${homepageJson.length} bytes -> ${homepageB64.length} b64`);

const phpScript = `<?php
/**
 * Auto-generated WordPress homepage injector and HTML rebuilder
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
$pid = 22; // Homepage Page ID

$homepage_data = base64_decode('${homepageB64}');
$data = json_decode($homepage_data, true);

if (!$data) {
    echo json_encode(['error' => 'Failed to decode homepage JSON']);
    @unlink(__FILE__);
    exit;
}

// Update post meta settings
update_post_meta($pid, '_elementor_data', wp_slash($homepage_data));
update_post_meta($pid, '_elementor_version', '3.25.0');
update_post_meta($pid, '_elementor_edit_mode', 'builder');
update_post_meta($pid, '_wp_page_template', 'elementor_header_footer');

// Recursive HTML rebuilder for static rendering in post_content
function rebuild_html($elements, $depth = 0) {
    $html = '';
    foreach ($elements as $el) {
        $type = isset($el['elType']) ? $el['elType'] : '';
        $id = isset($el['id']) ? $el['id'] : '';
        $settings = isset($el['settings']) ? $el['settings'] : [];
        
        if ($type === 'container') {
            $is_inner = !empty($el['isInner']) || $depth > 0;
            $parent_class = $is_inner ? 'e-child' : 'e-parent';
            $boxed = (isset($settings['content_width']) && $settings['content_width'] === 'boxed') ? 'e-con-boxed' : 'e-con-full';
            $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : (isset($settings['css_classes']) ? $settings['css_classes'] : '');
            
            $html .= '<div class="elementor-element elementor-element-' . $id . ' ' . $boxed . ' e-flex e-con ' . $parent_class . ' ' . esc_attr($css_classes) . '" data-id="' . $id . '" data-element_type="container">';
            if ($boxed === 'e-con-boxed') {
                $html .= '<div class="e-con-inner">';
            }
            if (!empty($el['elements'])) {
                $html .= rebuild_html($el['elements'], $depth + 1);
            }
            if ($boxed === 'e-con-boxed') {
                $html .= '</div>';
            }
            $html .= '</div>';
        } elseif ($type === 'widget') {
            $wtype = isset($el['widgetType']) ? $el['widgetType'] : '';
            $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : (isset($settings['css_classes']) ? $settings['css_classes'] : '');
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $wtype . ' ' . esc_attr($css_classes) . '" data-id="' . $id . '" data-element_type="widget" data-widget_type="' . $wtype . '.default">';
            $html .= '<div class="elementor-widget-container">';
            
            switch ($wtype) {
                case 'heading':
                    $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<' . $tag . ' class="elementor-heading-title elementor-size-default">' . $title . '</' . $tag . '>';
                    break;
                case 'text-editor':
                    $editor = isset($settings['editor']) ? $settings['editor'] : '';
                    $html .= $editor;
                    break;
                case 'button':
                    $text = isset($settings['text']) ? $settings['text'] : '';
                    $url = isset($settings['link']['url']) ? $settings['link']['url'] : '#';
                    $html .= '<a class="elementor-button elementor-button-link elementor-size-sm" href="' . esc_attr($url) . '"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">' . esc_html($text) . '</span></span></a>';
                    break;
                case 'image':
                    $img_url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                    $img_alt = isset($settings['image']['alt']) ? $settings['image']['alt'] : '';
                    if ($img_url) {
                        $html .= '<img decoding="async" src="' . esc_attr($img_url) . '" alt="' . esc_attr($img_alt) . '" loading="lazy" />';
                    }
                    break;
                case 'divider':
                    $html .= '<div class="elementor-divider"><span class="elementor-divider-separator"></span></div>';
                    break;
                case 'icon':
                    $icon = isset($settings['selected_icon']['value']) ? $settings['selected_icon']['value'] : '';
                    $html .= '<div class="elementor-icon-wrapper"><div class="elementor-icon"><i class="' . $icon . '"></i></div></div>';
                    break;
                case 'icon-box':
                    $icon = isset($settings['selected_icon']['value']) ? $settings['selected_icon']['value'] : '';
                    $title = isset($settings['title_text']) ? $settings['title_text'] : '';
                    $desc = isset($settings['description_text']) ? $settings['description_text'] : '';
                    $tag = isset($settings['title_size']) ? $settings['title_size'] : 'h3';
                    $html .= '<div class="elementor-icon-box-wrapper"><div class="elementor-icon-box-icon"><span class="elementor-icon"><i class="' . $icon . '"></i></span></div><div class="elementor-icon-box-content"><' . $tag . ' class="elementor-icon-box-title">' . $title . '</' . $tag . '><p class="elementor-icon-box-description">' . $desc . '</p></div></div>';
                    break;
                case 'counter':
                    $end = isset($settings['ending_number']) ? $settings['ending_number'] : '0';
                    $prefix = isset($settings['prefix']) ? $settings['prefix'] : '';
                    $suffix = isset($settings['suffix']) ? $settings['suffix'] : '';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<div class="elementor-counter"><div class="elementor-counter-number-wrapper"><span class="elementor-counter-number-prefix">' . $prefix . '</span><span class="elementor-counter-number" data-to-value="' . $end . '">' . $end . '</span><span class="elementor-counter-number-suffix">' . $suffix . '</span></div><div class="elementor-counter-title">' . $title . '</div></div>';
                    break;
            }
            
            $html .= '</div></div>';
        }
    }
    return $html;
}

$rebuilt = '<div data-elementor-type="wp-page" data-elementor-id="' . $pid . '" class="elementor elementor-' . $pid . '">';
$rebuilt .= rebuild_html($data);
$rebuilt .= '</div>';

// Update standard WP database column
$wpdb->update(
    $wpdb->posts,
    ['post_content' => $rebuilt],
    ['ID' => $pid],
    ['%s'],
    ['%d']
);

// Clear page and layout caches
delete_post_meta($pid, '_elementor_css');
delete_post_meta($pid, '_elementor_inline_svg');
delete_post_meta($pid, '_elementor_page_assets');
update_post_meta($pid, '_elementor_version', '0.0.0');

// Force global Elementor CSS clear
if (class_exists('\\Elementor\\Plugin')) {
    \\Elementor\\Plugin::instance()->files_manager->clear_cache();
}

clean_post_cache($pid);
if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);
echo json_encode([
    'status' => 'success',
    'page_id' => $pid,
    'html_length' => strlen($rebuilt),
    'images_rebuilt' => substr_count($rebuilt, '<img'),
    'cache' => 'cleared_and_purged'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>`;

const tempDir = path.join(ROOT, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const phpFile = `evg_rebuild_home_${Date.now()}.php`;
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
    console.log(`🚀 Executing rebuilder via HTTP: ${execUrl.replace(INJECT_SECRET, '***')}`);
    
    const response = await fetch(execUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('\n📊 REBUILD RESULTS:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('❌ Error during rebuild:', err.message);
  } finally {
    client.close();
    try { fs.unlinkSync(phpPath); } catch(e) {}
  }
}

run();
