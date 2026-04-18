<?php
/**
 * flush_cache.php — Cache Flush + Homepage Realignment
 * stitch2elementor v4.6.5
 *
 * Actions:
 * 1. Sets page_on_front from page_manifest.json (if available)
 * 2. Flushes rewrite rules (permalinks)
 * 3. Clears Elementor CSS cache
 * 4. Syncs Elementor library
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- Authentication ---
$token = isset($_GET['token']) ? $_GET['token'] : '';
$expected = getenv('INJECT_SECRET') ?: (defined('INJECT_SECRET') ? INJECT_SECRET : '');
if (empty($expected)) {
    // Try reading from a companion file uploaded by sync_and_inject.js
    $secret_file = __DIR__ . '/v9_json_payloads/.inject_secret';
    if (file_exists($secret_file)) {
        $expected = trim(file_get_contents($secret_file));
    }
}
if (empty($token) || empty($expected) || $token !== $expected) {
    http_response_code(403);
    die(json_encode(['success' => false, 'error' => 'Forbidden — invalid or missing token']));
}

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$results = [];

// 1. Set page_on_front from manifest (if available)
$manifest_path = __DIR__ . '/v9_json_payloads/page_manifest.json';
if (file_exists($manifest_path)) {
    $manifest = json_decode(file_get_contents($manifest_path), true);
    if (!empty($manifest['home_id'])) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', intval($manifest['home_id']));
        $results['page_on_front'] = intval($manifest['home_id']);
        $results['page_on_front_title'] = get_the_title(intval($manifest['home_id']));
    }
    if (!empty($manifest['blog_id'])) {
        update_option('page_for_posts', intval($manifest['blog_id']));
        $results['page_for_posts'] = intval($manifest['blog_id']);
    }
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
