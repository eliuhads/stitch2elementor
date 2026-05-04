<?php

/**
 * create_hf_native.php — Native Elementor Theme Builder Header/Footer Creator
 * stitch2elementor v4.6.7
 *
 * Creates Header and Footer as native Elementor Theme Builder templates
 * with global display conditions. Reads JSON payloads from /v9_json_payloads/.
 *
 * This file is uploaded via FTP and executed remotely once, then auto-deleted for security.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');
$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();



$json_dir = __DIR__ . '/v9_json_payloads/';
$pages = [
    'Header Master' => ['file' => 'header.json', 'type' => 'header'],
    'Footer Master' => ['file' => 'footer.json', 'type' => 'footer']
];

global $wpdb;

$results = [];

foreach($pages as $title => $info) {
    $json_file = $info['file'];
    $tmpl_type = $info['type'];

    $path = $json_dir . $json_file;
    if(!file_exists($path)) {
        $results[$title] = ['status' => 'skipped', 'reason' => "Missing JSON: $json_file"];
        continue;
    }
    
    $content = file_get_contents($path);
    $data = json_decode($content, true);
    if(!$data) {
        $results[$title] = ['status' => 'error', 'reason' => "Failed to decode $json_file"];
        continue;
    }

    // Menu Auto-Discovery and Injection for Header Nav-Menu
    if ($tmpl_type === 'header') {
        $menu_term = get_term_by('name', 'Ppal Desktop', 'nav_menu');
        if (!$menu_term) {
            $menu_term = get_term_by('name', 'Main Menu', 'nav_menu');
        }
        if (!$menu_term) {
            // Fallback: try to get the first available menu
            $menus = wp_get_nav_menus();
            if (!empty($menus)) {
                $menu_term = $menus[0];
            }
        }
        if ($menu_term) {
            $inject_menu = function(&$elements) use (&$inject_menu, $menu_term) {
                foreach ($elements as &$el) {
                    if (isset($el['widgetType']) && $el['widgetType'] === 'nav-menu') {
                        $el['settings']['menu'] = $menu_term->term_id;
                    }
                    if (!empty($el['elements'])) {
                        $inject_menu($el['elements']);
                    }
                }
            };
            $inject_menu($data);
            $results[$title]['menu_injected'] = $menu_term->name;
        } else {
            $results[$title]['menu_warning'] = 'No nav menus found in database';
        }
    }
    
    // Purge ANY existing posts with the same name
    $existing = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type IN ('page', 'elementor_library')", $title));
    if(!empty($existing)) {
        foreach($existing as $eid) {
            wp_delete_post($eid, true);
        }
        $results[$title]['purged_old_ids'] = $existing;
    }
    
    // Create natively as Theme Builder Template
    $page_id = wp_insert_post([
        'post_title' => $title,
        'post_name' => sanitize_title($title),
        'post_type' => 'elementor_library',
        'post_status' => 'publish'
    ]);
    
    if(is_wp_error($page_id)) {
        $results[$title] = ['status' => 'error', 'reason' => $page_id->get_error_message()];
        continue;
    }
    
    // Meta for elementor library 
    update_post_meta($page_id, '_wp_page_template', 'elementor_header_footer');
    update_post_meta($page_id, '_elementor_data', wp_slash(json_encode($data)));
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    
    // Theme builder meta flags
    update_post_meta($page_id, '_elementor_template_type', $tmpl_type);
    update_post_meta($page_id, '_elementor_conditions', ['include/general']);
    
    // Set Global Conditions in Elementor Pro Option
    $conditions = get_option('elementor_pro_theme_builder_conditions', []);
    if (!is_array($conditions)) $conditions = [];
    $conditions[$page_id] = [
        [ 'type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '' ]
    ];
    update_option('elementor_pro_theme_builder_conditions', $conditions);

    // Clear cache
    if (class_exists('Elementor\Plugin') && isset(\Elementor\Plugin::$instance->posts_manager)) {
         \Elementor\Plugin::$instance->posts_manager->clear_cache($page_id);
    }
    
    $results[$title] = ['status' => 'created', 'id' => $page_id, 'type' => "global_$tmpl_type"];
}

echo json_encode(['success' => true, 'results' => $results, 'timestamp' => date('c')]);
?>
