<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') { http_response_code(403); die('forbidden'); }
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
global $wpdb;

$raw = $wpdb->get_var("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id=1758 AND meta_key='_elementor_data'");
$data = json_decode($raw, true);

// Recursive find all icon and icon-box widgets
function find_icons($elements, $path = '') {
    $results = [];
    foreach ($elements as $el) {
        $id = $el['id'] ?? 'unknown';
        $type = $el['elType'] ?? 'unknown';
        $wtype = $el['widgetType'] ?? '';
        $currentPath = $path . '/' . $type . ':' . $id;
        
        if ($wtype === 'icon' || $wtype === 'icon-box') {
            $settings = $el['settings'] ?? [];
            $results[] = [
                'id' => $id,
                'widgetType' => $wtype,
                'path' => $currentPath,
                'selected_icon' => $settings['selected_icon'] ?? null,
                'icon' => $settings['icon'] ?? null,
                'title_text' => $settings['title_text'] ?? null,
                'description_text' => substr($settings['description_text'] ?? '', 0, 50)
            ];
        }
        
        if (!empty($el['elements'])) {
            $results = array_merge($results, find_icons($el['elements'], $currentPath));
        }
    }
    return $results;
}

// Also find the VP section and its children
function find_section($elements, $targetId) {
    foreach ($elements as $el) {
        if (($el['id'] ?? '') === $targetId) return $el;
        if (!empty($el['elements'])) {
            $found = find_section($el['elements'], $targetId);
            if ($found) return $found;
        }
    }
    return null;
}

$icons = find_icons($data);

// Get VP section children structure
$vp = find_section($data, 'e5fe551b');
$vpChildren = [];
if ($vp && !empty($vp['elements'])) {
    foreach ($vp['elements'] as $child) {
        $childInfo = ['id' => $child['id'], 'type' => $child['elType'], 'widgetType' => $child['widgetType'] ?? ''];
        $childInfo['children'] = [];
        if (!empty($child['elements'])) {
            foreach ($child['elements'] as $gc) {
                $gcInfo = ['id' => $gc['id'], 'type' => $gc['elType'], 'widgetType' => $gc['widgetType'] ?? ''];
                $gcInfo['children'] = [];
                if (!empty($gc['elements'])) {
                    foreach ($gc['elements'] as $ggc) {
                        $gcInfo['children'][] = [
                            'id' => $ggc['id'],
                            'type' => $ggc['elType'],
                            'widgetType' => $ggc['widgetType'] ?? '',
                            'settings_keys' => array_keys($ggc['settings'] ?? []),
                            'selected_icon' => $ggc['settings']['selected_icon'] ?? null,
                            'title_text' => $ggc['settings']['title_text'] ?? null
                        ];
                    }
                }
                $childInfo['children'][] = $gcInfo;
            }
        }
        $vpChildren[] = $childInfo;
    }
}

echo json_encode(['icons' => $icons, 'vp_structure' => $vpChildren], JSON_PRETTY_PRINT);
@unlink(__FILE__);
