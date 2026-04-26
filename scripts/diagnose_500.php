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

// Check pages that might have issues
$slugs = [
    'estaciones-de-energia-portatiles',
    'iluminacion-led-solar',
    'paneles-solares',
    'baterias-de-energia-solar',
    'iluminacion-convencional',
    'jump-starters-arrancadores',
    'respaldo-energetico-residencial',
    'respaldo-energetico-industrial',
];

$results = [];

foreach ($slugs as $slug) {
    $page = $wpdb->get_row($wpdb->prepare(
        "SELECT ID, post_title, post_status FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' LIMIT 1",
        $slug
    ));
    
    if (!$page) {
        $results[$slug] = ['status' => 'NOT_FOUND'];
        continue;
    }
    
    $id = $page->ID;
    
    // Check for the problematic meta
    $schema_meta = get_post_meta($id, 'rank_math_schema_Product', true);
    $elementor_data = get_post_meta($id, '_elementor_data', true);
    $edit_mode = get_post_meta($id, '_elementor_edit_mode', true);
    
    $results[$slug] = [
        'id' => $id,
        'title' => $page->post_title,
        'post_status' => $page->post_status,
        'has_schema_product' => !empty($schema_meta),
        'schema_product_type' => gettype($schema_meta),
        'schema_product_preview' => is_string($schema_meta) ? substr($schema_meta, 0, 100) : 'N/A',
        'has_elementor_data' => !empty($elementor_data),
        'elementor_data_length' => is_string($elementor_data) ? strlen($elementor_data) : 0,
        'elementor_edit_mode' => $edit_mode ?: 'NOT SET',
        'elementor_data_valid_json' => is_string($elementor_data) ? (json_decode($elementor_data) !== null ? 'YES' : 'NO') : 'N/A',
    ];
    
    // Check if removing schema_Product fixes the issue by examining the meta key format
    // RankMath expects schema in rank_math_schema_{SchemaType} but the actual format
    // should be a serialized array, not raw JSON
    $all_rm_meta = $wpdb->get_results($wpdb->prepare(
        "SELECT meta_key, LEFT(meta_value, 80) as preview FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE 'rank_math%%'",
        $id
    ));
    
    $results[$slug]['rankmath_meta'] = [];
    foreach ($all_rm_meta as $m) {
        $results[$slug]['rankmath_meta'][$m->meta_key] = $m->preview;
    }
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
