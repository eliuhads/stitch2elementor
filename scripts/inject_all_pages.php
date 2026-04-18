<?php
/**
 * inject_all_pages.php — Batch Elementor Page Injector
 * stitch2elementor v4.6.4
 *
 * Reads JSON payloads from /v9_json_payloads/ and injects them into WordPress pages.
 * Pages are defined in page_manifest.json (uploaded alongside the JSONs).
 *
 * This file is uploaded via FTP and executed remotely once, then auto-deleted for security.
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- Authentication ---
$token = isset($_GET['token']) ? $_GET['token'] : '';
$expected = getenv('INJECT_SECRET') ?: (defined('INJECT_SECRET') ? INJECT_SECRET : '');
if (empty($expected)) {
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

$json_dir = __DIR__ . '/v9_json_payloads/';
$manifest_path = $json_dir . 'page_manifest.json';

// Load manifest
if (!file_exists($manifest_path)) {
    die(json_encode(['success' => false, 'error' => 'page_manifest.json not found']));
}

$manifest = json_decode(file_get_contents($manifest_path), true);
if (!$manifest || empty($manifest['pages'])) {
    die(json_encode(['success' => false, 'error' => 'Invalid or empty page_manifest.json']));
}

global $wpdb;

$success = 0;
$errors = 0;
$created_ids = [];
$error_details = [];

foreach ($manifest['pages'] as $page) {
    $json_file = $page['json'];
    $title = $page['title'];
    $slug = $page['slug'];
    
    $json_path = $json_dir . $json_file;
    if (!file_exists($json_path)) {
        $error_details[] = "Missing: $json_file";
        $errors++;
        continue;
    }
    
    $content = file_get_contents($json_path);
    $data = json_decode($content, true);
    if (!$data) {
        $error_details[] = "Invalid JSON: $json_file";
        $errors++;
        continue;
    }
    
    // Delete any existing page with same slug
    $existing = $wpdb->get_col($wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page'",
        $slug
    ));
    if (!empty($existing)) {
        foreach ($existing as $eid) {
            wp_delete_post($eid, true);
        }
    }
    
    // Create the page
    $page_id = wp_insert_post([
        'post_title'    => $title,
        'post_name'     => $slug,
        'post_type'     => 'page',
        'post_status'   => 'publish',
        'page_template' => 'elementor_header_footer',
    ]);
    
    if (is_wp_error($page_id)) {
        $error_details[] = "Failed '$title': " . $page_id->get_error_message();
        $errors++;
        continue;
    }
    
    // Inject Elementor data
    update_post_meta($page_id, '_elementor_data', wp_slash(json_encode($data)));
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    update_post_meta($page_id, '_wp_page_template', 'elementor_header_footer');
    
    // Clear per-page cache
    if (class_exists('Elementor\Plugin') && isset(\Elementor\Plugin::$instance->posts_manager)) {
        \Elementor\Plugin::$instance->posts_manager->clear_cache($page_id);
    }
    
    $created_ids[$slug] = $page_id;
    $success++;
}

echo json_encode([
    'success' => true,
    'summary' => ['created' => $success, 'errors' => $errors],
    'id_map' => $created_ids,
    'error_details' => $error_details,
    'timestamp' => date('c')
]);
?>
