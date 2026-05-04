<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403); die('forbidden');
}
require_once(__DIR__ . '/wp-load.php');
// Clear page cache
clean_post_cache(1758);
delete_post_meta(1758, '_elementor_css');
delete_option('_elementor_global_css');
if (function_exists('wp_cache_flush')) wp_cache_flush();
// Try LiteSpeed purge
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}
@unlink(__FILE__);
echo json_encode(['status' => 'cache_purged']);
