<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') { http_response_code(403); die('forbidden'); }
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
global $wpdb;

$raw = $wpdb->get_var("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id=1758 AND meta_key='_elementor_data'");
$data = json_decode($raw, true);

// Find the categories section (7ebc3f4b) and dump its deep structure
function find_element($elements, $id) {
    foreach ($elements as $el) {
        if (($el['id'] ?? '') === $id) return $el;
        if (!empty($el['elements'])) {
            $found = find_element($el['elements'], $id);
            if ($found) return $found;
        }
    }
    return null;
}

function summarize($el, $depth = 0) {
    $prefix = str_repeat('  ', $depth);
    $id = $el['id'] ?? '?';
    $type = $el['elType'] ?? '?';
    $wtype = $el['widgetType'] ?? '';
    $settings = $el['settings'] ?? [];
    
    $info = "{$prefix}[{$id}] {$type}";
    if ($wtype) $info .= " ({$wtype})";
    
    // Add relevant settings
    if ($wtype === 'icon') {
        $icon = $settings['selected_icon'] ?? $settings['icon'] ?? 'none';
        $info .= " icon=" . json_encode($icon);
    }
    if ($wtype === 'heading') {
        $info .= " title=" . json_encode($settings['title'] ?? '');
    }
    if ($wtype === 'text-editor') {
        $info .= " text=" . json_encode(substr($settings['editor'] ?? '', 0, 40));
    }
    if ($wtype === 'image') {
        $url = $settings['image']['url'] ?? '';
        $info .= " img=" . basename($url);
    }
    
    $result = [$info];
    if (!empty($el['elements'])) {
        foreach ($el['elements'] as $child) {
            $result = array_merge($result, summarize($child, $depth + 1));
        }
    }
    return $result;
}

$catSection = find_element($data, '7ebc3f4b');
$lines = $catSection ? summarize($catSection) : ['NOT FOUND'];

echo json_encode(['structure' => $lines], JSON_PRETTY_PRINT);
@unlink(__FILE__);
