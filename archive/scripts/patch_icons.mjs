/**
 * patch_icons.mjs — Fix Value Props icons from FA to correct ones + fix category icons
 * 
 * Strategy: Since Elementor only supports FontAwesome (not Material Symbols),
 * we'll use the closest FA equivalents OR inject Material Symbols via CSS/JS.
 * 
 * STITCH icons (Material Symbols Outlined):
 *   sailing → FA closest: fa-ship ✓ (already correct shape, just needs visual match)
 *   verified → FA closest: fa-certificate or fa-shield-alt  
 *   engineering → FA closest: fa-hard-hat or fa-tools
 * 
 * Actually looking at screenshots more carefully:
 *   Stitch icon 1 (Importación Directa): sailing = ship/boat → needs to look like outlined boat
 *   Stitch icon 2 (Garantía y Calidad): verified = shield with check → fa-shield-alt or fa-certificate  
 *   Stitch icon 3 (Asesoría Técnica): engineering = person with gear → fa-hard-hat or fa-user-cog
 * 
 * We'll use a hybrid approach:
 * 1. Update FA icons to closest match via PHP JSON patch
 * 2. Then inject Material Symbols font via CSS to override with exact matches
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

// PHP to patch icon widgets in _elementor_data
const php = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${env.INJECT_SECRET}') { http_response_code(403); die('forbidden'); }
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
global $wpdb;

$raw = $wpdb->get_var("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id=1758 AND meta_key='_elementor_data'");
$data = json_decode($raw, true);

// Icon mapping: widget_id => new icon settings
$icon_map = [
    'icon_29302187' => ['value' => 'fas fa-ship', 'library' => 'fa-solid'],           // sailing → ship (closest)
    'icon_44db5797' => ['value' => 'fas fa-shield-alt', 'library' => 'fa-solid'],      // verified → shield
    'icon_7e4cf3f7' => ['value' => 'fas fa-hard-hat', 'library' => 'fa-solid']         // engineering → hard-hat
];

function patch_icons(&$elements, $icon_map) {
    $patched = 0;
    foreach ($elements as &$el) {
        $id = $el['id'] ?? '';
        if (isset($icon_map[$id])) {
            $el['settings']['selected_icon'] = $icon_map[$id];
            $el['settings']['icon'] = $icon_map[$id];
            $patched++;
        }
        if (!empty($el['elements'])) {
            $patched += patch_icons($el['elements'], $icon_map);
        }
    }
    return $patched;
}

$patched = patch_icons($data, $icon_map);

// Save
$json = json_encode($data);
$escaped = $wpdb->_real_escape($json);
$wpdb->query("UPDATE {$wpdb->postmeta} SET meta_value = '{$escaped}' WHERE post_id=1758 AND meta_key='_elementor_data'");

// Clear Elementor CSS cache
delete_post_meta(1758, '_elementor_css');
clean_post_cache(1758);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');

echo json_encode(['patched' => $patched, 'status' => 'ok']);
@unlink(__FILE__);
`;

writeFileSync('temp/patch_icons.php', php);
const client = new Client();
await client.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD || env.FTP_PASS, secure: false });
await client.uploadFrom('temp/patch_icons.php', '/patch_icons.php');
client.close();

const resp = await fetch(`${env.WP_URL || env.SITE_URL}/patch_icons.php?token=${env.INJECT_SECRET}`);
const result = await resp.json();
console.log('Icon patch result:', result);

// Now update MU-Plugin to also load Material Symbols + override FA icons with Material Symbols
const muPlugin = `<?php
/**
 * Plugin Name: Evergreen Homepage Custom CSS
 * Description: Loads custom CSS + icon overrides for homepage parity with Stitch design system
 * Version: 5.0.0
 */

// 1. Load external CSS + Material Symbols font
add_action('wp_enqueue_scripts', function() {
    if (is_front_page() || is_page(1758)) {
        // Material Symbols font
        wp_enqueue_style(
            'material-symbols-outlined',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
            array(),
            null,
            'all'
        );
        
        // Custom CSS
        wp_enqueue_style(
            'evergreen-homepage-custom',
            home_url('/wp-content/uploads/evergreen-homepage-custom.css'),
            array('elementor-frontend'),
            '5.0.0',
            'all'
        );
    }
}, 9999);

// 2. Inject CTA gradient + Material Symbols icon overrides via JS
add_action('wp_footer', function() {
    if (!is_front_page() && !is_page(1758)) return;
    echo '<script id="evergreen-homepage-fix">
(function(){
    // CTA gradient fix
    var cta = document.querySelector("[data-id=\\"69a22305\\"]");
    if(cta){
        cta.style.setProperty("background-image","linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%)","important");
        cta.style.setProperty("background-color","#1D8A43","important");
        cta.style.setProperty("border-radius","16px","important");
        cta.style.setProperty("overflow","hidden","important");
        var inner = cta.querySelector(".e-con-inner");
        if(inner){
            inner.style.setProperty("background","transparent","important");
        }
    }
    
    // Value Props icon override: replace FA icons with Material Symbols
    var iconMap = {
        "icon_29302187": "sailing",
        "icon_44db5797": "verified",
        "icon_7e4cf3f7": "engineering"
    };
    
    Object.entries(iconMap).forEach(function(entry){
        var widgetId = entry[0];
        var symbolName = entry[1];
        var widget = document.querySelector("[data-id=\\"" + widgetId + "\\"]");
        if(widget){
            var iconContainer = widget.querySelector(".elementor-icon");
            if(iconContainer){
                // Replace FA icon with Material Symbol
                iconContainer.innerHTML = "<span class=\\"material-symbols-outlined\\" style=\\"font-size:inherit;color:inherit;\\">" + symbolName + "</span>";
                // Ensure proper styling
                iconContainer.style.setProperty("display","flex","important");
                iconContainer.style.setProperty("align-items","center","important");
                iconContainer.style.setProperty("justify-content","center","important");
            }
        }
    });

    // Category card icons (text-only cards with FA icons)
    // Stitch uses: lightbulb, highlight, traffic, wall_lamp, filter_center_focus, factory
    var catIcons = document.querySelectorAll("[data-id=\\"7ebc3f4b\\"] .elementor-widget-icon .elementor-icon");
    var catSymbols = ["lightbulb", "highlight", "traffic", "wall_lamp", "filter_center_focus", "factory"];
    catIcons.forEach(function(el, i){
        if(catSymbols[i]){
            el.innerHTML = "<span class=\\"material-symbols-outlined\\" style=\\"font-size:inherit;color:inherit;\\">" + catSymbols[i] + "</span>";
            el.style.setProperty("display","flex","important");
            el.style.setProperty("align-items","center","important");
            el.style.setProperty("justify-content","center","important");
        }
    });
})();
</script>';
}, 99999);
`;

writeFileSync('temp/evergreen-homepage-css.php', muPlugin);
const c2 = new Client();
await c2.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD || env.FTP_PASS, secure: false });
await c2.uploadFrom('temp/evergreen-homepage-css.php', '/wp-content/mu-plugins/evergreen-homepage-css.php');
c2.close();

console.log('✅ MU-Plugin v5 deployed (Material Symbols icons + CTA gradient)');
console.log('✅ Icon patches applied to Elementor JSON');
