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

// 1. Get all pages
$query = "SELECT ID, post_title, post_name, post_excerpt FROM {$wpdb->posts} WHERE post_type IN ('page') AND post_status = 'publish'";
$pages = $wpdb->get_results($query);

$results = [];

foreach($pages as $page) {
    $id = $page->ID;
    $title = $page->post_title;
    
    // --- RANK MATH SEO INJECTION ---
    $focus_keyword = strtolower($title);
    $seo_title = $title . ' - Evergreen Venezuela';
    // Remove "Inicio - " if present
    if ($title === 'Inicio' || $title === 'Homepage') {
        $seo_title = 'Evergreen Venezuela - Soluciones Energéticas Integrales';
        $focus_keyword = 'soluciones energeticas venezuela';
    }
    
    $seo_desc = $page->post_excerpt ? $page->post_excerpt : "Descubre $title en Evergreen Venezuela. Proveedores líderes en plantas eléctricas, soluciones solares y energía portátil a nivel nacional.";
    
    update_post_meta($id, 'rank_math_title', wp_slash($seo_title));
    update_post_meta($id, 'rank_math_description', wp_slash($seo_desc));
    update_post_meta($id, 'rank_math_focus_keyword', wp_slash($focus_keyword));
    
    // --- H1 HIERARCHY FIX ---
    $elementor_data_raw = get_post_meta($id, '_elementor_data', true);
    $h1_fixed = false;
    $h1_count = 0;
    if (!empty($elementor_data_raw)) {
        // Strip slashes if necessary (WordPress sometimes stores JSON with slashed quotes in meta, though usually get_post_meta handles it)
        $elementor_data = json_decode($elementor_data_raw, true);
        if ($elementor_data && is_array($elementor_data)) {
            
            $fix_h1 = function(&$elements) use (&$fix_h1, &$h1_count, &$h1_fixed) {
                foreach ($elements as &$el) {
                    if (isset($el['widgetType']) && $el['widgetType'] === 'heading') {
                        $tag = isset($el['settings']['header_size']) ? $el['settings']['header_size'] : ''; // '' is elementor default, usually h2
                        // If it's explicitly h1
                        if ($tag === 'h1') {
                            $h1_count++;
                            if ($h1_count > 1) {
                                // Demote to h2
                                $el['settings']['header_size'] = 'h2';
                                $h1_fixed = true;
                            }
                        }
                    }
                    if (!empty($el['elements'])) {
                        $fix_h1($el['elements']);
                    }
                }
            };
            
            $fix_h1($elementor_data);
            
            if ($h1_fixed) {
                update_post_meta($id, '_elementor_data', wp_slash(json_encode($elementor_data)));
            }
        }
    }
    
    $results[$id] = [
        'title' => $title,
        'seo_injected' => true,
        'h1_count_before' => $h1_count,
        'h1_fixed' => $h1_fixed
    ];
}

echo json_encode(['success' => true, 'results' => $results]);
?>
