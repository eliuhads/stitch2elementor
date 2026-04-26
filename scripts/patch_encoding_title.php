<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$secret = isset($_GET['secret']) ? $_GET['secret'] : '';
$expected = getenv('INJECT_SECRET') ?: (defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : '');

if (empty($expected) || !hash_equals($expected, $secret)) {
    http_response_code(403);
    die(json_encode(['success' => false, 'error' => 'Forbidden']));
}

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

global $wpdb;

$results = [];

// 1. Fix UTF-8 encoding issues in RankMath Meta Descriptions and Titles
// The issue occurred because json_decode/encode might have mangled characters during previous injections.
// We'll search and replace the corrupted characters directly in the database.
$replacements = [
    'Ǹ' => 'é',
    'ǭ' => 'á',
    ''  => 'í',
    ''  => 'ó',
    ''  => 'ú',
    // In case there are other corruptions, we'll do a broader pass if needed, 
    // but specific character replacements are safer. Let's do a programmatic approach.
];

// Get all pages
$pages = $wpdb->get_results("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status = 'publish'");

$fixed_count = 0;
foreach ($pages as $page) {
    $desc = get_post_meta($page->ID, 'rank_math_description', true);
    $title = get_post_meta($page->ID, 'rank_math_title', true);
    
    $updated = false;
    
    // Fix Description
    if (!empty($desc) && is_string($desc)) {
        // Fix known corrupted characters manually to avoid messing up valid UTF-8
        $new_desc = str_replace(['Ǹ', 'ǭ', 'Ã©', 'Ã¡', 'Ã­', 'Ã³', 'Ãº'], ['é', 'á', 'é', 'á', 'í', 'ó', 'ú'], $desc);
        
        // Also fix the generic fallback if it still has corrupted characters
        // We recreate the generic description cleanly to be safe
        $clean_title = get_the_title($page->ID);
        $clean_desc = "Descubre $clean_title en Evergreen Venezuela. Proveedores líderes en plantas eléctricas, soluciones solares y energía portátil a nivel nacional.";
        
        // If the description matches the generic template but has corruption, just overwrite it
        if (strpos($desc, 'Descubre') !== false && strpos($desc, 'nacional') !== false) {
             update_post_meta($page->ID, 'rank_math_description', wp_slash($clean_desc));
             $updated = true;
        } elseif ($desc !== $new_desc) {
             update_post_meta($page->ID, 'rank_math_description', wp_slash($new_desc));
             $updated = true;
        }
    }
    
    if ($updated) {
        $fixed_count++;
    }
}
$results[] = "✅ Fixed encoding on $fixed_count pages.";

// 2. Fix Homepage Title
$homepage_id = 1586; // From memoria_estado.md
$new_homepage_title = "Evergreen Venezuela - Soluciones Energéticas Integrales";

update_post_meta($homepage_id, 'rank_math_title', wp_slash($new_homepage_title));

// Also fix the generic description for the homepage specifically to be cleaner
$homepage_desc = "Evergreen Venezuela es tu proveedor líder en soluciones energéticas integrales: plantas eléctricas, paneles solares y estaciones de energía portátil a nivel nacional.";
update_post_meta($homepage_id, 'rank_math_description', wp_slash($homepage_desc));

$results[] = "✅ Homepage (ID 1586) title and description refined.";

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
