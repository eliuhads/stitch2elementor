/**
 * fix_homepage_v3.mjs — CTA gradient fix via inline CSS in post_content
 * 
 * Problem: Elementor's gradient CSS is only generated when its engine processes
 * the page from wp-admin. Since we inject via PHP, we must embed CSS directly.
 * 
 * Solution: Inject a <style> block in post_content targeting element IDs.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { Client } from 'basic-ftp';

// Parse .env
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
const HOMEPAGE_ID = 1758;

// Load current v2 JSON (already has most fixes)
let data = JSON.parse(readFileSync('elementor_jsons/homepage_fixed_v2.json', 'utf8'));

// No structural changes needed — the JSON is correct.
// The issue is purely CSS rendering.

// Save unchanged JSON
writeFileSync('elementor_jsons/homepage_fixed_v3.json', JSON.stringify(data));
console.log('✅ JSON saved (no structural changes needed)');

const jsonStr = JSON.stringify(data);
const b64 = Buffer.from(jsonStr).toString('base64');

// Custom CSS to inject — targets specific Elementor element IDs
const customCSS = `
/* CTA gradient — matches Stitch .cta-gradient */
.elementor-element-69a22305 {
  background: linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%) !important;
}
/* Hero radial gradient overlay */
.elementor-element-ecf97c6e::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(118,220,138,0.1) 0%, rgba(14,19,32,1) 100%);
  pointer-events: none;
  z-index: 0;
}
.elementor-element-ecf97c6e { position: relative; }
.elementor-element-ecf97c6e > * { position: relative; z-index: 1; }
/* Stats bar bg */
.elementor-element-2e6165fc {
  background: #1a1f2d !important;
  border: 1px solid rgba(255,255,255,0.05) !important;
  border-radius: 12px !important;
}
/* CTA button white */
.elementor-element-d730745d .elementor-button {
  background: #FFFFFF !important;
  color: #003916 !important;
  border-radius: 8px !important;
  padding: 16px 40px !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  letter-spacing: 2px !important;
  text-transform: uppercase !important;
}
/* Hero VER CATÁLOGO button */
.elementor-element-ea522493 .elementor-button {
  background: #1D8A43 !important;
  color: #FFFFFF !important;
  border-radius: 8px !important;
  padding: 16px 32px !important;
}
/* Hero outline button */
.elementor-element-803be3b3 .elementor-button {
  background: transparent !important;
  border: 2px solid #889487 !important;
  color: #FFFFFF !important;
  border-radius: 8px !important;
  padding: 16px 32px !important;
}
/* Icon widgets — stacked circle */
.elementor-element-icon_29302187 .elementor-icon,
.elementor-element-icon_44db5797 .elementor-icon,
.elementor-element-icon_7e4cf3f7 .elementor-icon {
  background: rgba(118,220,138,0.1) !important;
  border-radius: 50% !important;
  width: 64px !important;
  height: 64px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #76dc8a !important;
  font-size: 30px !important;
}
/* Divider green centered */
.elementor-element-16b62408 .elementor-divider-separator {
  border-top-color: #76dc8a !important;
  border-top-width: 4px !important;
  width: 80px !important;
  display: block !important;
  margin: 0 auto !important;
}
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap');
/* Global dark bg */
.elementor-page-1758 { background: #0E1320 !important; }
`.trim();

const cssB64 = Buffer.from(customCSS).toString('base64');

const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'forbidden']));
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$page_id = ${HOMEPAGE_ID};
$json_data = base64_decode('${b64}');
$custom_css = base64_decode('${cssB64}');

$test = json_decode($json_data, true);
if (!$test || !is_array($test)) {
    die(json_encode(['error' => 'invalid_json']));
}

// Update _elementor_data
update_post_meta($page_id, '_elementor_data', wp_slash($json_data));

// Rebuild post_content
function rebuild_html($elements) {
    $html = '';
    foreach ($elements as $el) {
        $type = isset($el['elType']) ? $el['elType'] : '';
        $id = isset($el['id']) ? $el['id'] : '';
        $settings = isset($el['settings']) ? $el['settings'] : [];
        
        if ($type === 'container') {
            $is_inner = !empty($el['isInner']);
            $parent_class = $is_inner ? 'e-child' : 'e-parent';
            $boxed = (isset($settings['content_width']) && $settings['content_width'] === 'boxed') ? 'e-con-boxed' : 'e-con-full';
            $ds = [];
            if (!empty($settings['background_background'])) $ds['background_background'] = $settings['background_background'];
            $ds_attr = !empty($ds) ? " data-settings='" . wp_json_encode($ds) . "'" : '';
            
            $html .= '<div class="elementor-element elementor-element-' . $id . ' ' . $boxed . ' e-flex e-con ' . $parent_class . '" data-id="' . $id . '" data-element_type="container"' . $ds_attr . '>';
            if ($boxed === 'e-con-boxed') $html .= '<div class="e-con-inner">';
            if (!empty($el['elements'])) $html .= rebuild_html($el['elements']);
            if ($boxed === 'e-con-boxed') $html .= '</div>';
            $html .= '</div>';
        } elseif ($type === 'widget') {
            $wtype = isset($el['widgetType']) ? $el['widgetType'] : '';
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $wtype . '" data-id="' . $id . '" data-element_type="widget" data-widget_type="' . $wtype . '.default">';
            switch ($wtype) {
                case 'heading':
                    $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                    if ($tag === 'div') $tag = 'div';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<' . $tag . ' class="elementor-heading-title elementor-size-default">' . $title . '</' . $tag . '>';
                    break;
                case 'text-editor':
                    $html .= isset($settings['editor']) ? $settings['editor'] : '';
                    break;
                case 'button':
                    $text = isset($settings['text']) ? $settings['text'] : '';
                    $url = isset($settings['link']['url']) ? $settings['link']['url'] : '#';
                    $html .= '<a class="elementor-button elementor-button-link elementor-size-sm" href="' . esc_url($url) . '"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">' . esc_html($text) . '</span></span></a>';
                    break;
                case 'image':
                    $img_url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                    $img_alt = isset($settings['image']['alt']) ? $settings['image']['alt'] : '';
                    $html .= '<img decoding="async" src="' . esc_url($img_url) . '" alt="' . esc_attr($img_alt) . '" loading="lazy" />';
                    break;
                case 'divider':
                    $html .= '<div class="elementor-divider"><span class="elementor-divider-separator"></span></div>';
                    break;
                case 'icon':
                    $icon_val = isset($settings['selected_icon']['value']) ? $settings['selected_icon']['value'] : '';
                    $html .= '<div class="elementor-icon-wrapper"><div class="elementor-icon"><i class="' . esc_attr($icon_val) . '"></i></div></div>';
                    break;
            }
            $html .= '</div>';
        }
    }
    return $html;
}

// Build with inline CSS
$rebuilt = '<style>' . $custom_css . '</style>';
$rebuilt .= '<div data-elementor-type="wp-page" data-elementor-id="' . $page_id . '" class="elementor elementor-' . $page_id . '" data-elementor-post-type="page">';
$rebuilt .= rebuild_html($test);
$rebuilt .= '</div>';

wp_update_post(['ID' => $page_id, 'post_content' => $rebuilt]);

// Clear all caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
clean_post_cache($page_id);
delete_option('_elementor_global_css');
delete_option('elementor-custom-breakpoints-files');
if (function_exists('wp_cache_flush')) wp_cache_flush();

@unlink(__FILE__);

echo json_encode([
    'status' => 'updated_v3',
    'page_id' => $page_id,
    'json_size' => strlen($json_data),
    'html_size' => strlen($rebuilt),
    'css_size' => strlen($custom_css),
    'cache' => 'flushed'
]);
`;

mkdirSync('temp', { recursive: true });
writeFileSync('temp/fix_homepage_v3.php', phpScript);
console.log(`✅ PHP generated: ${phpScript.length} bytes (CSS: ${customCSS.length} bytes)`);

// FTP upload and execute
const client = new Client();
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
  console.log('✅ FTP connected');
  await client.uploadFrom('temp/fix_homepage_v3.php', '/fix_homepage_v3.php');
  console.log('✅ PHP uploaded');
  client.close();
  
  const url = `${WP_URL}/fix_homepage_v3.php?token=${INJECT_SECRET}`;
  console.log('⏳ Executing...');
  const resp = await fetch(url);
  const text = await resp.text();
  console.log(`📦 Response (${resp.status}): ${text}`);
} catch (err) {
  console.error('❌', err.message);
}
