<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

error_reporting(E_ALL);
ini_set('display_errors', 1);

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
// ============================================================

$json_dir = __DIR__ . '/v9_json_payloads/';
$pages = [
    'Header Master' => 'header.json',
    'Footer Master' => 'footer.json'
];

global $wpdb;
$url_map = [];
// Get all attachment replacements we previously mapped
$temp_dir = __DIR__ . '/wp-content/uploads/v9_images_temp/';
if (file_exists($temp_dir)) {
    $files = scandir($temp_dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $existing = $wpdb->get_var($wpdb->prepare("SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s", '%' . $file));
        if ($existing) {
            $url_map[$file] = wp_get_attachment_url($existing);
        }
    }
}

echo "<h2>Creating Header & Footer Master pages...</h2>";

foreach($pages as $title => $json_file) {
    $path = $json_dir . $json_file;
    if(!file_exists($path)) {
        echo "Missing JSON: $path <br>";
        continue;
    }
    $content = file_get_contents($path);
    
    // Process image substitutions for Footer (like the map)
    foreach($url_map as $local_file => $wp_url) {
        $content = str_replace("%%FILE:" . $local_file . "%%", $wp_url, $content);
    }
    
    $data = json_decode($content, true);
    if(!$data) {
        echo "Failed to decode $json_file <br>";
        continue;
    }
    
    // Check if exists
    $existing = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type = 'page'", $title));
    if(!empty($existing)) {
        foreach($existing as $eid) {
            wp_delete_post($eid, true);
        }
    }
    
    $page_id = wp_insert_post([
        'post_title' => $title,
        'post_name' => sanitize_title($title),
        'post_type' => 'page',
        'post_status' => 'publish'
    ]);
    
    if(is_wp_error($page_id)) {
        echo "Error creating $title: " . $page_id->get_error_message() . "<br>";
        continue;
    }
    
    update_post_meta($page_id, '_wp_page_template', 'elementor_header_footer');
    update_post_meta($page_id, '_elementor_data', wp_slash(json_encode($data)));
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    
    // Clear cache if plugin is loaded
    if (class_exists('Elementor\Plugin') && isset(\Elementor\Plugin::$instance->posts_manager)) {
         \Elementor\Plugin::$instance->posts_manager->clear_cache($page_id);
    }
    
    echo "✅ Successfully created '$title' (ID: $page_id)<br>";
}

echo "<h3>DONE. You can safely delete this script.</h3>";
?>
