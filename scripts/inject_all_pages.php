<?php
/**
 * inject_all_pages.php — Batch Elementor Page Injector
 * Reads JSON payloads from /v9_json_payloads/ and injects them into WordPress pages.
 * 
 * This file is uploaded via FTP and executed remotely once, then auto-deleted for security.
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$json_dir = __DIR__ . '/v9_json_payloads/';
$manifest_path = $json_dir . 'page_manifest.json';

echo "<h2>🚀 Evergreen Batch Page Injector</h2>";

// Load manifest
if (!file_exists($manifest_path)) {
    die("ERROR: page_manifest.json not found in $json_dir");
}

$manifest = json_decode(file_get_contents($manifest_path), true);
if (!$manifest || empty($manifest['pages'])) {
    die("ERROR: Invalid or empty page_manifest.json");
}

global $wpdb;

// Build image URL replacement map from sideloaded media
$url_map = [];
$temp_dir = __DIR__ . '/wp-content/uploads/v9_images_temp/';
if (file_exists($temp_dir)) {
    $files = scandir($temp_dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s",
            '%' . $file
        ));
        if ($existing) {
            $url_map[$file] = wp_get_attachment_url($existing);
        }
    }
}
echo "<p>📸 Image replacement map: " . count($url_map) . " entries</p>";

$success = 0;
$errors = 0;
$created_ids = [];

foreach ($manifest['pages'] as $page) {
    $json_file = $page['json'];
    $title = $page['title'];
    $slug = $page['slug'];
    
    $json_path = $json_dir . $json_file;
    if (!file_exists($json_path)) {
        echo "⚠️ Missing: $json_file<br>";
        $errors++;
        continue;
    }
    
    $content = file_get_contents($json_path);
    
    // Apply image replacements
    foreach ($url_map as $local_file => $wp_url) {
        $content = str_replace("%%FILE:" . $local_file . "%%", $wp_url, $content);
    }
    
    $data = json_decode($content, true);
    if (!$data) {
        echo "❌ Invalid JSON: $json_file<br>";
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
            echo "🧹 Deleted existing '$title' (ID: $eid)<br>";
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
        echo "❌ Failed to create '$title': " . $page_id->get_error_message() . "<br>";
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
    echo "✅ Created '$title' (ID: $page_id, slug: /$slug/)<br>";
    $success++;
}

// Output summary and new ID map
echo "<h3>📊 Results: $success success, $errors errors</h3>";
echo "<h3>🆔 New Page ID Map:</h3><pre>";
echo json_encode($created_ids, JSON_PRETTY_PRINT);
echo "</pre>";

echo "<h3>✅ DONE. All pages injected.</h3>";
?>
