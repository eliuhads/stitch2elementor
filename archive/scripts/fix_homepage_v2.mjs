/**
 * fix_homepage_v2.mjs — Round 2 fixes
 * 
 * Issues remaining:
 * 1. CTA gradient not rendering (Elementor gradient uses different properties)
 * 2. Icon widgets need to use Elementor icon widget instead of text-editor
 * 3. Stats numbers need Elementor widget-level styling, not inline
 * 4. Stats bar numbers color should use #76dc8a (primary green)
 */

import { readFileSync, writeFileSync } from 'fs';
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

let data = JSON.parse(readFileSync('elementor_jsons/homepage_fixed.json', 'utf8'));

function findById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.elements?.length > 0) {
      const found = findById(el.elements, id);
      if (found) return found;
    }
  }
  return null;
}

// ============================================================
// FIX A: CTA — Use classic background with color for the gradient
// Elementor gradient bg requires specific property names
// ============================================================
const ctaSection = findById(data, '69a22305');
if (ctaSection) {
  // Elementor gradient settings
  ctaSection.settings.background_background = "gradient";
  ctaSection.settings.background_color = "#1D8A43";
  ctaSection.settings.background_color_b = "#28B5E1";
  ctaSection.settings.background_gradient_type = "linear";
  ctaSection.settings.background_gradient_angle = { unit: "deg", size: 135, sizes: [] };
  ctaSection.settings.background_gradient_position = "center center";
  // More generous padding
  ctaSection.settings.padding = { unit: "px", top: "80", right: "80", bottom: "80", left: "80", isLinked: true };
  ctaSection.settings.padding_tablet = { unit: "px", top: "48", right: "40", bottom: "48", left: "40", isLinked: false };
  ctaSection.settings.padding_mobile = { unit: "px", top: "40", right: "24", bottom: "40", left: "24", isLinked: false };
  ctaSection.settings.overflow = "hidden";
  console.log('✅ FIX A: CTA gradient (linear, 135deg, green→cyan)');
}

// ============================================================
// FIX B: Stats numbers — Use Elementor heading widget style props
// Replace text-editor widgets with heading widgets for stats
// ============================================================
const statsMap = [
  { numId: '6b1f3230', value: '+185' },
  { numId: '73f0a08f', value: '+15' },
  { numId: '1eb043d9', value: '+500' },
  { numId: '5db4b9a5', value: '9' },
];

for (const { numId, value } of statsMap) {
  const el = findById(data, numId);
  if (el) {
    // Convert to heading widget for better Elementor rendering
    el.widgetType = "heading";
    el.settings = {
      title: value,
      header_size: "div",
      typography_typography: "custom",
      typography_font_family: "Space Grotesk",
      typography_font_size: { unit: "px", size: 32, sizes: [] },
      typography_font_size_tablet: { unit: "px", size: 28, sizes: [] },
      typography_font_size_mobile: { unit: "px", size: 24, sizes: [] },
      typography_font_weight: "700",
      typography_letter_spacing: { unit: "px", size: 1, sizes: [] },
      title_color: "#76dc8a",
      _margin: { unit: "px", top: "0", right: "0", bottom: "4", left: "0", isLinked: false },
    };
    delete el.settings.editor;
  }
}
console.log('✅ FIX B: Stats numbers → heading widgets, #76dc8a, 32px bold');

// ============================================================  
// FIX C: Stats labels — Use heading widget too for consistent sizing
// ============================================================
const labelsMap = [
  { id: '8ff58ec4', label: 'Productos LED' },
  { id: '52d2245c', label: 'Años de Experiencia' },
  { id: '3eec28e4', label: 'Proyectos Instalados' },
  { id: '361b6469', label: 'Categorías' },
];

for (const { id, label } of labelsMap) {
  const el = findById(data, id);
  if (el) {
    el.widgetType = "heading";
    el.settings = {
      title: label,
      header_size: "div",
      typography_typography: "custom",
      typography_font_family: "Space Grotesk",
      typography_font_size: { unit: "px", size: 10, sizes: [] },
      typography_font_weight: "600",
      typography_text_transform: "uppercase",
      typography_letter_spacing: { unit: "px", size: 1.5, sizes: [] },
      title_color: "#becabb",
    };
  }
}
console.log('✅ FIX C: Stats labels → heading widgets, 10px uppercase');

// ============================================================
// FIX D: Value prop icons — Use Elementor icon-box widget
// Replace the text-editor icon widgets with proper icon-box
// ============================================================
const iconIds = ['icon_29302187', 'icon_44db5797', 'icon_7e4cf3f7'];
const iconDetails = [
  { id: 'icon_29302187', icon: 'fas fa-ship' },
  { id: 'icon_44db5797', icon: 'fas fa-check-circle' },
  { id: 'icon_7e4cf3f7', icon: 'fas fa-cogs' },
];

for (const { id, icon } of iconDetails) {
  const el = findById(data, id);
  if (el) {
    el.widgetType = "icon";
    el.settings = {
      selected_icon: {
        value: icon,
        library: "fa-solid",
      },
      view: "stacked",
      shape: "circle",
      primary_color: "rgba(118,220,138,0.1)",
      secondary_color: "#76dc8a",
      size: { unit: "px", size: 30, sizes: [] },
      icon_padding: { unit: "px", size: 16, sizes: [] },
      align: "center",
      _margin: { unit: "px", top: "0", right: "0", bottom: "24", left: "0", isLinked: false },
    };
    delete el.settings.editor;
  }
}
console.log('✅ FIX D: Value prop icons → Elementor icon widgets');

// ============================================================
// FIX E: CTA button — Ensure white background renders
// ============================================================
const ctaButton = findById(data, 'd730745d');
if (ctaButton) {
  ctaButton.settings.background_color = "#FFFFFF";
  ctaButton.settings.button_background_color = "#FFFFFF";
  ctaButton.settings.button_text_color = "#003916";
  ctaButton.settings.border_radius = { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true };
  ctaButton.settings.typography_typography = "custom";
  ctaButton.settings.typography_font_family = "Space Grotesk";
  ctaButton.settings.typography_font_weight = "700";
  ctaButton.settings.typography_font_size = { unit: "px", size: 13, sizes: [] };
  ctaButton.settings.typography_letter_spacing = { unit: "px", size: 2, sizes: [] };
  ctaButton.settings.button_padding = { unit: "px", top: "16", right: "40", bottom: "16", left: "40", isLinked: false };
  console.log('✅ FIX E: CTA button → white + dark green text');
}

// ============================================================
// FIX F: Hero VER CATÁLOGO button — gradient bg
// ============================================================
const heroBtn1 = findById(data, 'ea522493');
if (heroBtn1) {
  heroBtn1.settings.background_color = "#1D8A43";
  heroBtn1.settings.button_background_color = "#1D8A43";
  heroBtn1.settings.button_text_color = "#FFFFFF";
  heroBtn1.settings.border_radius = { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true };
  heroBtn1.settings.typography_letter_spacing = { unit: "px", size: 2, sizes: [] };
  heroBtn1.settings.button_padding = { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false };
  // Remove gradient from button (use solid color instead)
  delete heroBtn1.settings.background_background;
  delete heroBtn1.settings.background_color_b;
  delete heroBtn1.settings.background_gradient_angle;
  console.log('✅ FIX F: Hero button → solid green');
}

// ============================================================
// FIX G: CTA Section parent wrapper — add margin/padding
// ============================================================
const ctaWrapper = data[3]; // 319995e8
if (ctaWrapper) {
  ctaWrapper.settings.padding = { unit: "px", top: "80", right: "32", bottom: "80", left: "32", isLinked: false };
  ctaWrapper.settings.padding_mobile = { unit: "px", top: "40", right: "16", bottom: "40", left: "16", isLinked: false };
}

// ============================================================
// FIX H: Divider — centered properly
// ============================================================
const divider = findById(data, '16b62408');
if (divider) {
  divider.settings.align = "center";
  divider.settings.color = "#76dc8a";
  divider.settings.weight = { unit: "px", size: 4, sizes: [] };
  divider.settings.width = { unit: "px", size: 80, sizes: [] };
  console.log('✅ FIX H: Divider → centered, green');
}

// ============================================================
// Save and inject
// ============================================================
writeFileSync('elementor_jsons/homepage_fixed_v2.json', JSON.stringify(data));
console.log('✅ Saved: elementor_jsons/homepage_fixed_v2.json');

const jsonStr = JSON.stringify(data);
const b64 = Buffer.from(jsonStr).toString('base64');

const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'forbidden']));
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$page_id = ${HOMEPAGE_ID};
$json_data = base64_decode('${b64}');

$test = json_decode($json_data, true);
if (!$test || !is_array($test)) {
    die(json_encode(['error' => 'invalid_json']));
}

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
            $data_settings = [];
            if (!empty($settings['background_background'])) $data_settings['background_background'] = $settings['background_background'];
            $ds_attr = !empty($data_settings) ? " data-settings='" . wp_json_encode($data_settings) . "'" : '';
            
            $html .= '<div class="elementor-element elementor-element-' . $id . ' ' . $boxed . ' e-flex e-con ' . $parent_class . '" data-id="' . $id . '" data-element_type="container" data-e-type="container"' . $ds_attr . '>';
            if ($boxed === 'e-con-boxed') $html .= '<div class="e-con-inner">';
            if (!empty($el['elements'])) $html .= rebuild_html($el['elements']);
            if ($boxed === 'e-con-boxed') $html .= '</div>';
            $html .= '</div>';
        } elseif ($type === 'widget') {
            $wtype = isset($el['widgetType']) ? $el['widgetType'] : '';
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $wtype . '" data-id="' . $id . '" data-element_type="widget" data-e-type="widget" data-widget_type="' . $wtype . '.default">';
            
            switch ($wtype) {
                case 'heading':
                    $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                    if ($tag === 'div') $tag = 'div';
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

$rebuilt = '<div data-elementor-type="wp-page" data-elementor-id="' . $page_id . '" class="elementor elementor-' . $page_id . '" data-elementor-post-type="page">';
$rebuilt .= rebuild_html($test);
$rebuilt .= '</div>';

wp_update_post(['ID' => $page_id, 'post_content' => $rebuilt]);
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
    'status' => 'updated_v2',
    'page_id' => $page_id,
    'json_size' => strlen($json_data),
    'html_size' => strlen($rebuilt),
    'cache' => 'flushed'
]);
`;

writeFileSync('temp/fix_homepage_v2.php', phpScript);
console.log(`✅ PHP generated: ${phpScript.length} bytes`);

// FTP upload and execute
const client = new Client();
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
  console.log('✅ FTP connected');
  await client.uploadFrom('temp/fix_homepage_v2.php', '/fix_homepage_v2.php');
  console.log('✅ PHP uploaded');
  client.close();
  
  const url = `${WP_URL}/fix_homepage_v2.php?token=${INJECT_SECRET}`;
  console.log('⏳ Executing...');
  const resp = await fetch(url);
  const text = await resp.text();
  console.log(`📦 Response (${resp.status}): ${text}`);
} catch (err) {
  console.error('❌', err.message);
}
