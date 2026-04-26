<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Boot WordPress
$wp_load = __DIR__ . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("Error: wp-load.php not found. Please place this file in your WordPress root.");
}
require_once($wp_load);

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
$expected_token = defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : getenv('WP_SCRIPT_TOKEN');
if (empty($expected_token)) { http_response_code(500); die(json_encode(['error' => 'Server misconfiguration: WP_SCRIPT_TOKEN not defined.'])); }
$provided_token = isset($_GET['token']) ? $_GET['token'] : '';
if (!hash_equals($expected_token, $provided_token)) { http_response_code(403); die(json_encode(['error' => 'Forbidden — invalid or missing token.'])); }
// ============================================================

echo "Listing Elementor Pages and Templates:\n";

$args = array(
    'post_type' => array('page', 'elementor_library'),
    'posts_per_page' => -1,
    'post_status' => 'any'
);

$query = new WP_Query($args);
if ($query->have_posts()) {
    while ($query->have_posts()) {
        $query->the_post();
        $id = get_the_ID();
        $title = get_the_title();
        $type = get_post_type();
        $elementor_edit_mode = get_post_meta($id, '_elementor_edit_mode', true);
        
        echo "ID: $id | Type: $type | Title: $title | Elementor: $elementor_edit_mode\n";
    }
}
wp_reset_postdata();
