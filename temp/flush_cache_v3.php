<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403);
    die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

// Clear Elementor CSS cache for homepage
delete_post_meta(1758, '_elementor_css');
delete_post_meta(1758, '_elementor_inline_svg');
delete_post_meta(1758, '_elementor_page_assets');
update_post_meta(1758, '_elementor_version', '0.0.0');
clean_post_cache(1758);

// Clear header/footer template caches
delete_post_meta(8, '_elementor_css');
update_post_meta(8, '_elementor_version', '0.0.0');
clean_post_cache(8);

// Global Elementor CSS
delete_option('elementor-custom-breakpoints-files');
delete_option('_elementor_global_css');

// Object cache
if (function_exists('wp_cache_flush')) wp_cache_flush();

// LiteSpeed
if (class_exists('LiteSpeed\Purge')) {
    LiteSpeed\Purge::purge_all();
}
do_action('litespeed_purge_all');

@unlink(__FILE__);
echo json_encode(['status' => 'cache_flushed', 'css_ver' => '3.0.0']);
