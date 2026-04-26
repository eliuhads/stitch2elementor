<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

/**
 * flush_cache.php — Cache Flush + Homepage Realignment
 * stitch2elementor v4.6.6
 *
 * Actions:
 * 1. Sets page_on_front from page_manifest.json (if available)
 * 2. Flushes rewrite rules (permalinks)
 * 3. Clears Elementor CSS cache
 * 4. Syncs Elementor library
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');
$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();



$results = [];

// 1. Set page_on_front by finding the page with slug 'homepage'
$home_page = get_page_by_path('homepage');
if ($home_page) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_page->ID);
    $results['page_on_front'] = $home_page->ID;
    $results['page_on_front_title'] = $home_page->post_title;
} else {
    $results['page_on_front'] = 'not found';
}

$blog_page = get_page_by_path('blog');
if ($blog_page) {
    update_option('page_for_posts', $blog_page->ID);
    $results['page_for_posts'] = $blog_page->ID;
}

// 2. Flush rewrite rules
flush_rewrite_rules(false);
$results['permalinks_flushed'] = true;

// 3. Clear Elementor CSS cache
if (class_exists('\Elementor\Plugin')) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    $results['elementor_cache_cleared'] = true;
} else {
    $results['elementor_cache_cleared'] = false;
    $results['elementor_warning'] = 'Elementor Plugin class not found';
}

// 4. Sync Elementor library
if (class_exists('\Elementor\Api')) {
    delete_transient('elementor_remote_info_library');
    delete_option('elementor_remote_info_library');
    \Elementor\Api::get_library_data(true);
    $results['library_synced'] = true;
}

echo json_encode(['success' => true, 'results' => $results, 'timestamp' => date('c')]);
?>
