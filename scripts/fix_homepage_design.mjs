/**
 * fix_homepage_design.mjs
 * 
 * Fixes the homepage Elementor JSON to better match the Stitch original design.
 * Key fixes:
 * 1. Hero section: Add radial gradient overlay
 * 2. Stats numbers: Use bright green (#76dc8a) and larger font
 * 3. Categories grid: Fix to 3-col grid with wrap instead of single row
 * 4. Value Props: Add icon containers and center divider
 * 5. CTA section: Add gradient background (green→blue)
 * 
 * Then injects via FTP+PHP (update existing page 1758).
 */

import { readFileSync, writeFileSync } from 'fs';
import { connect } from 'net';
import { Client } from 'basic-ftp';

// Parse .env manually
const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx === -1) return;
  const key = line.substring(0, idx).trim();
  let val = line.substring(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
});

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASS = env.FTP_PASSWORD || env.FTP_PASS;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;
const HOMEPAGE_ID = 1758;

// Load and fix the JSON
let data = JSON.parse(readFileSync('elementor_jsons/homepage.json', 'utf8'));

function findById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.elements && el.elements.length > 0) {
      const found = findById(el.elements, id);
      if (found) return found;
    }
  }
  return null;
}

function findAll(elements, predicate, results = []) {
  for (const el of elements) {
    if (predicate(el)) results.push(el);
    if (el.elements && el.elements.length > 0) {
      findAll(el.elements, predicate, results);
    }
  }
  return results;
}

// ============================================================
// FIX 1: Hero Section — Add radial gradient green overlay
// ============================================================
const heroSection = data[0]; // ecf97c6e
if (heroSection) {
  // Add the radial gradient overlay matching Stitch's hero-gradient
  heroSection.settings.background_overlay_background = "gradient";
  heroSection.settings.background_overlay_color = "rgba(118,220,138,0.08)";
  heroSection.settings.background_overlay_color_b = "rgba(14,19,32,1)";
  heroSection.settings.background_overlay_gradient_type = "radial";
  heroSection.settings.background_overlay_gradient_position = "center center";
  // Remove min_height to avoid empty space
  delete heroSection.settings.min_height;
  delete heroSection.settings.min_height_tablet;
  delete heroSection.settings.min_height_mobile;
  console.log('✅ FIX 1: Hero gradient overlay applied');
}

// ============================================================
// FIX 2: Stats Numbers — Bright green + large font
// ============================================================
const statNumbers = ['6b1f3230', '73f0a08f', '1eb043d9', '5db4b9a5'];
for (const id of statNumbers) {
  const el = findById(data, id);
  if (el) {
    // Replace dark green with bright primary green
    el.settings.editor = el.settings.editor.replace('color:#1D8A43', 'color:#76dc8a');
    // Add large font styling
    const oldContent = el.settings.editor;
    el.settings.editor = oldContent.replace(
      /style="([^"]*)"/,
      (match, styles) => `style="${styles};font-family:Space Grotesk;font-size:36px;font-weight:700;letter-spacing:0.05em"`
    );
  }
}
console.log('✅ FIX 2: Stats numbers → bright green + large font');

// ============================================================
// FIX 3: Stats labels — smaller font, uppercase
// ============================================================
const statLabels = ['8ff58ec4', '52d2245c', '3eec28e4', '361b6469'];
for (const id of statLabels) {
  const el = findById(data, id);
  if (el) {
    el.settings.editor = el.settings.editor.replace(
      /style="([^"]*)"/,
      (match, styles) => `style="${styles};font-size:10px;letter-spacing:0.1em"`
    );
  }
}
console.log('✅ FIX 3: Stats labels → smaller font + tracking');

// ============================================================
// FIX 4: Categories Grid — 3-col grid with wrap
// ============================================================
const catGrid = findById(data, '57d17676');
if (catGrid) {
  catGrid.settings.flex_wrap = "wrap";
  catGrid.settings.flex_direction = "row";
  catGrid.settings.__gridCols = 3;
  // First 3 items are image cards, last 6 are icon cards
  // Set all children width to 33%
  for (const child of catGrid.elements) {
    if (child.settings) {
      child.settings._element_width = "custom";
      child.settings.width = { unit: "%", size: 31, sizes: [] };
      child.settings.width_mobile = { unit: "%", size: 100, sizes: [] };
    }
  }
  // The first 3 image cards need aspect ratio
  const imageCards = ['7dce1679', 'c2f4bf3b', 'f506a881'];
  for (const id of imageCards) {
    const card = findById(data, id);
    if (card && card.settings) {
      card.settings.min_height = { unit: "px", size: 280, sizes: [] };
      card.settings.min_height_mobile = { unit: "px", size: 220, sizes: [] };
      card.settings.flex_direction = "column";
      card.settings.flex_justify_content = "flex-end";
      card.settings.position = "relative";
      card.settings.overflow = "hidden";
      // Make image positioned absolute (cover)
      const img = card.elements.find(e => e.widgetType === 'image');
      if (img) {
        img.settings._position = "absolute";
        img.settings._offset_x = { unit: "px", size: 0, sizes: [] };
        img.settings._offset_y = { unit: "px", size: 0, sizes: [] };
        img.settings.width = { unit: "%", size: 100, sizes: [] };
        img.settings.height = { unit: "%", size: 100, sizes: [] };
        img.settings._element_width = "full";
        img.settings.image_size = "full";
        img.settings.object_fit = "cover";
      }
    }
  }
  console.log('✅ FIX 4: Categories grid → 3-col wrap layout');
}

// ============================================================
// FIX 5: Value Props — Add icon widgets before each title
// ============================================================
const iconMap = {
  '29302187': { icon: 'sailing', title: 'Importación Directa' },
  '44db5797': { icon: 'verified', title: 'Garantía y Calidad' },
  '7e4cf3f7': { icon: 'engineering', title: 'Asesoría Técnica' },
};

for (const [containerId, { icon }] of Object.entries(iconMap)) {
  const container = findById(data, containerId);
  if (container) {
    // Add icon as HTML widget before the heading
    const iconWidget = {
      id: 'icon_' + containerId.substring(0, 8),
      elType: "widget",
      widgetType: "text-editor",
      isInner: false,
      settings: {
        editor: `<div style="width:64px;height:64px;border-radius:50%;background:rgba(118,220,138,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span class="material-symbols-outlined" style="color:#76dc8a;font-size:30px">${icon}</span></div>`,
        _margin: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true }
      },
      elements: []
    };
    // Insert at position 0 (before heading)
    container.elements.unshift(iconWidget);
  }
}

// Fix divider to center
const divider = findById(data, '16b62408');
if (divider) {
  divider.settings.align = "center";
  divider.settings.width = { unit: "px", size: 80, sizes: [] };
}
console.log('✅ FIX 5: Value props → icons + centered divider');

// ============================================================
// FIX 6: CTA Section — Gradient background
// ============================================================
const ctaSection = findById(data, '69a22305');
if (ctaSection) {
  ctaSection.settings.background_background = "gradient";
  ctaSection.settings.background_color = "#1D8A43";
  ctaSection.settings.background_color_b = "#28B5E1";
  ctaSection.settings.background_gradient_angle = { unit: "deg", size: 135, sizes: [] };
  ctaSection.settings.padding = { unit: "px", top: "80", right: "80", bottom: "80", left: "80", isLinked: true };
  ctaSection.settings.padding_mobile = { unit: "px", top: "40", right: "24", bottom: "40", left: "24", isLinked: false };
  ctaSection.settings.border_radius = { unit: "px", top: "16", right: "16", bottom: "16", left: "16", isLinked: true };
  console.log('✅ FIX 6: CTA section → gradient background');
}

// ============================================================
// FIX 7: CTA Button — white bg, dark text
// ============================================================
const ctaButton = findById(data, 'd730745d');
if (ctaButton) {
  ctaButton.settings.background_color = "#FFFFFF";
  ctaButton.settings.button_text_color = "#00210a";
  ctaButton.settings.border_radius = { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true };
  ctaButton.settings.button_padding = { unit: "px", top: "16", right: "40", bottom: "16", left: "40", isLinked: false };
  console.log('✅ FIX 7: CTA button → white bg + dark text');
}

// ============================================================
// FIX 8: Hero buttons — proper styling
// ============================================================
const heroBtn1 = findById(data, 'ea522493'); // VER CATÁLOGO
if (heroBtn1) {
  heroBtn1.settings.background_color = "transparent";
  heroBtn1.settings.background_background = "gradient";
  heroBtn1.settings.background_color = "#1D8A43";
  heroBtn1.settings.background_color_b = "#28B5E1";
  heroBtn1.settings.background_gradient_angle = { unit: "deg", size: 135, sizes: [] };
  heroBtn1.settings.button_padding = { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false };
  heroBtn1.settings.border_radius = { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true };
}

const heroBtn2 = findById(data, '803be3b3'); // HABLAR CON UN ASESOR
if (heroBtn2) {
  heroBtn2.settings.border_color = "#889487"; // outline color from Stitch
  heroBtn2.settings.button_padding = { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false };
  heroBtn2.settings.border_radius = { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true };
}
console.log('✅ FIX 8: Hero buttons → gradient + outline styling');

// ============================================================
// FIX 9: Reduce section padding for tighter layout
// ============================================================
// Categories section (7ebc3f4b) — Add padding
const catSection = data[1]; // 7ebc3f4b
if (catSection) {
  catSection.settings.padding = { unit: "px", top: "80", right: "0", bottom: "80", left: "0", isLinked: false };
}

// CTA wrapper section (319995e8) — Add padding
const ctaWrapper = data[3]; // 319995e8
if (ctaWrapper) {
  ctaWrapper.settings.padding = { unit: "px", top: "80", right: "32", bottom: "80", left: "32", isLinked: false };
}
console.log('✅ FIX 9: Section padding tightened');

// ============================================================
// Save fixed JSON
// ============================================================
writeFileSync('elementor_jsons/homepage_fixed.json', JSON.stringify(data));
console.log('✅ Saved: elementor_jsons/homepage_fixed.json');

// ============================================================
// Generate PHP injector and upload via FTP
// ============================================================
const jsonStr = JSON.stringify(data);
const b64 = Buffer.from(jsonStr).toString('base64');

const phpScript = `<?php
// Security check
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'forbidden']));
}

header('Content-Type: application/json');

require_once(__DIR__ . '/wp-load.php');

$page_id = ${HOMEPAGE_ID};
$b64_data = '${b64}';
$json_data = base64_decode($b64_data);

// Validate JSON
$test = json_decode($json_data, true);
if (!$test || !is_array($test)) {
    die(json_encode(['error' => 'invalid_json', 'len' => strlen($json_data)]));
}

// Update _elementor_data
update_post_meta($page_id, '_elementor_data', wp_slash($json_data));

// Rebuild post_content from elementor data
$rebuilt = '';
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
            $ds_attr = !empty($data_settings) ? " data-settings='" . json_encode($data_settings) . "'" : '';
            
            $html .= '<div class="elementor-element elementor-element-' . $id . ' ' . $boxed . ' e-flex e-con ' . $parent_class . '" data-id="' . $id . '" data-element_type="container" data-e-type="container"' . $ds_attr . '>';
            if ($boxed === 'e-con-boxed') {
                $html .= '<div class="e-con-inner">';
            }
            if (!empty($el['elements'])) {
                $html .= rebuild_html($el['elements']);
            }
            if ($boxed === 'e-con-boxed') {
                $html .= '</div>';
            }
            $html .= '</div>';
        } elseif ($type === 'widget') {
            $wtype = isset($el['widgetType']) ? $el['widgetType'] : '';
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $wtype . '" data-id="' . $id . '" data-element_type="widget" data-e-type="widget" data-widget_type="' . $wtype . '.default">';
            
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
                    $html .= '<a class="elementor-button elementor-button-link elementor-size-sm" href="' . $url . '"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">' . $text . '</span></span></a>';
                    break;
                case 'image':
                    $img_url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                    $img_alt = isset($settings['image']['alt']) ? $settings['image']['alt'] : '';
                    $html .= '<img decoding="async" src="' . $img_url . '" alt="' . htmlspecialchars($img_alt) . '" loading="lazy" />';
                    break;
                case 'divider':
                    $html .= '<div class="elementor-divider"><span class="elementor-divider-separator"></span></div>';
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

// Update post_content
wp_update_post(['ID' => $page_id, 'post_content' => $rebuilt]);

// Clear all caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
clean_post_cache($page_id);

// Clear global Elementor CSS
delete_option('elementor-custom-breakpoints-files');
delete_option('_elementor_global_css');

// Flush object cache
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}

// Self-delete
@unlink(__FILE__);

echo json_encode([
    'status' => 'updated',
    'page_id' => $page_id,
    'json_size' => strlen($json_data),
    'html_size' => strlen($rebuilt),
    'cache' => 'flushed'
]);
`;

writeFileSync('temp/fix_homepage.php', phpScript);
console.log(`✅ PHP injector generated: ${phpScript.length} bytes`);

// Upload via FTP and execute
async function injectViaFTP() {
  const client = new Client();
  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });
    console.log('✅ FTP connected');
    
    // Upload to root (/)
    await client.uploadFrom('temp/fix_homepage.php', '/fix_homepage.php');
    console.log('✅ PHP uploaded to /fix_homepage.php');
    
    client.close();
    
    // Execute the PHP
    const url = `${WP_URL}/fix_homepage.php?token=${INJECT_SECRET}`;
    console.log(`⏳ Executing: ${url.substring(0, 60)}...`);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'User-Agent': 'EvergreenBot/1.0' }
    });
    const text = await response.text();
    console.log(`📦 Response (${response.status}): ${text}`);
    
    try {
      const result = JSON.parse(text);
      console.log('✅ Injection result:', result);
    } catch {
      console.log('⚠️ Non-JSON response — check manually');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  }
}

injectViaFTP();
