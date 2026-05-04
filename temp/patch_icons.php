<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') { http_response_code(403); die('forbidden'); }
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
global $wpdb;

$raw = $wpdb->get_var("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id=1758 AND meta_key='_elementor_data'");
$data = json_decode($raw, true);

// Icon mapping: widget_id => new icon settings
$icon_map = [
    'icon_29302187' => ['value' => 'fas fa-ship', 'library' => 'fa-solid'],           // sailing → ship (closest)
    'icon_44db5797' => ['value' => 'fas fa-shield-alt', 'library' => 'fa-solid'],      // verified → shield
    'icon_7e4cf3f7' => ['value' => 'fas fa-hard-hat', 'library' => 'fa-solid']         // engineering → hard-hat
];

function patch_icons(&$elements, $icon_map) {
    $patched = 0;
    foreach ($elements as &$el) {
        $id = $el['id'] ?? '';
        if (isset($icon_map[$id])) {
            $el['settings']['selected_icon'] = $icon_map[$id];
            $el['settings']['icon'] = $icon_map[$id];
            $patched++;
        }
        if (!empty($el['elements'])) {
            $patched += patch_icons($el['elements'], $icon_map);
        }
    }
    return $patched;
}

$patched = patch_icons($data, $icon_map);

// Save
$json = json_encode($data);
$escaped = $wpdb->_real_escape($json);
$wpdb->query("UPDATE {$wpdb->postmeta} SET meta_value = '{$escaped}' WHERE post_id=1758 AND meta_key='_elementor_data'");

// Clear Elementor CSS cache
delete_post_meta(1758, '_elementor_css');
clean_post_cache(1758);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');

echo json_encode(['patched' => $patched, 'status' => 'ok']);
@unlink(__FILE__);
