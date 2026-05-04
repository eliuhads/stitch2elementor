<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$post_id = 1758;
$target_id = '69a22305';
$data = get_post_meta($post_id, '_elementor_data', true);

if (is_string($data)) {
    $elements = json_decode($data, true);
} else {
    $elements = $data;
}

if (!$elements) {
    echo json_encode(['error' => 'no elementor data']);
    @unlink(__FILE__);
    exit;
}

function patch_gradient(&$elements, $target_id) {
    foreach ($elements as &$el) {
        if (isset($el['id']) && $el['id'] === $target_id) {
            // Set gradient background in Elementor settings
            $el['settings']['background_background'] = 'gradient';
            $el['settings']['background_color'] = '#1D8A43';
            $el['settings']['background_color_b'] = '#28B5E1';
            $el['settings']['background_gradient_type'] = 'linear';
            $el['settings']['background_gradient_angle'] = ['unit' => 'deg', 'size' => 135];
            $el['settings']['background_gradient_position'] = 'center center';
            return true;
        }
        if (isset($el['elements']) && is_array($el['elements'])) {
            if (patch_gradient($el['elements'], $target_id)) return true;
        }
    }
    return false;
}

$found = patch_gradient($elements, $target_id);
if (!$found) {
    echo json_encode(['error' => 'element not found', 'id' => $target_id]);
    @unlink(__FILE__);
    exit;
}

$json = wp_slash(wp_json_encode($elements));
update_post_meta($post_id, '_elementor_data', $json);

// Clear Elementor CSS cache
delete_post_meta($post_id, '_elementor_css');
update_post_meta($post_id, '_elementor_version', '0.0.0');
clean_post_cache($post_id);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');

@unlink(__FILE__);
echo json_encode(['status' => 'gradient_patched', 'target' => $target_id]);
