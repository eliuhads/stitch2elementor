/**
 * fix_category_images.mjs — Rebuild post_content to include new image URLs
 * The _elementor_data was updated but post_content still has old/broken img tags
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

const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$page_id = 1758;

// Read the current _elementor_data
$json_raw = get_post_meta($page_id, '_elementor_data', true);
$data = json_decode($json_raw, true);

if (!$data) {
    echo json_encode(['error' => 'Failed to parse elementor_data']);
    @unlink(__FILE__);
    exit;
}

// Rebuild post_content from _elementor_data
function rebuild_html($elements, $depth = 0) {
    $html = '';
    foreach ($elements as $el) {
        $id = isset($el['id']) ? $el['id'] : '';
        $elType = isset($el['elType']) ? $el['elType'] : '';
        $widgetType = isset($el['widgetType']) ? $el['widgetType'] : '';
        $settings = isset($el['settings']) ? $el['settings'] : [];
        
        if ($elType === 'container') {
            $layout = isset($settings['content_width']) && $settings['content_width'] === 'boxed' ? 'e-con-boxed' : 'e-con-full';
            $childClass = $depth > 0 ? 'e-child' : 'e-parent';
            $html .= '<div class="' . $layout . ' e-flex e-con ' . $childClass . '" data-id="' . $id . '" data-element_type="container">';
            if ($layout === 'e-con-boxed') {
                $html .= '<div class="e-con-inner">';
            }
        }
        
        if ($elType === 'widget') {
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $widgetType . '" data-id="' . $id . '" data-element_type="widget" data-widget_type="' . $widgetType . '.default">';
            $html .= '<div class="elementor-widget-container">';
            
            switch ($widgetType) {
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
                    $html .= '<div class="elementor-button-wrapper"><a class="elementor-button" href="' . $url . '"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">' . $text . '</span></span></a></div>';
                    break;
                    
                case 'image':
                    $imgUrl = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                    $imgAlt = isset($settings['image']['alt']) ? $settings['image']['alt'] : '';
                    if ($imgUrl) {
                        $html .= '<img decoding="async" src="' . $imgUrl . '" alt="' . htmlspecialchars($imgAlt) . '" loading="lazy" />';
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
                    $html .= '<div class="elementor-icon-box-wrapper"><div class="elementor-icon-box-icon"><span class="elementor-icon"><i class="' . $icon . '"></i></span></div><div class="elementor-icon-box-content"><' . (isset($settings['title_size']) ? $settings['title_size'] : 'h3') . ' class="elementor-icon-box-title">' . $title . '</' . (isset($settings['title_size']) ? $settings['title_size'] : 'h3') . '><p class="elementor-icon-box-description">' . $desc . '</p></div></div>';
                    break;
                    
                case 'counter':
                    $start = isset($settings['starting_number']) ? $settings['starting_number'] : '0';
                    $end = isset($settings['ending_number']) ? $settings['ending_number'] : '0';
                    $prefix = isset($settings['prefix']) ? $settings['prefix'] : '';
                    $suffix = isset($settings['suffix']) ? $settings['suffix'] : '';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<div class="elementor-counter"><div class="elementor-counter-number-wrapper"><span class="elementor-counter-number-prefix">' . $prefix . '</span><span class="elementor-counter-number" data-duration="2000" data-to-value="' . $end . '" data-from-value="' . $start . '">' . $end . '</span><span class="elementor-counter-number-suffix">' . $suffix . '</span></div><div class="elementor-counter-title">' . $title . '</div></div>';
                    break;
                    
                default:
                    // Generic widget
                    break;
            }
            
            $html .= '</div></div>';
        }
        
        // Recurse children
        if (!empty($el['elements'])) {
            $html .= rebuild_html($el['elements'], $depth + 1);
        }
        
        if ($elType === 'container') {
            if (isset($settings['content_width']) && $settings['content_width'] === 'boxed') {
                $html .= '</div>'; // close e-con-inner
            }
            $html .= '</div>'; // close container
        }
    }
    return $html;
}

$new_html = rebuild_html($data);

// Update post_content
wp_update_post([
    'ID' => $page_id,
    'post_content' => $new_html
]);

// Clear ALL caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
clean_post_cache($page_id);
if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);

echo json_encode([
    'status' => 'post_content_rebuilt',
    'html_length' => strlen($new_html),
    'cache' => 'flushed',
    'images_found' => substr_count($new_html, '<img')
]);
`;

writeFileSync('temp/rebuild_content.php', phpScript);
console.log('✅ PHP script generated');

const client = new Client();
await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
await client.uploadFrom('temp/rebuild_content.php', '/rebuild_content.php');
console.log('✅ Uploaded to FTP');
client.close();

const url = `${WP_URL}/rebuild_content.php?token=${INJECT_SECRET}`;
console.log('⏳ Rebuilding post_content...');
const resp = await fetch(url);
const text = await resp.text();
console.log(`📦 Response (${resp.status}): ${text}`);
