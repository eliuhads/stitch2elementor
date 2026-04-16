<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$json_dir = __DIR__ . '/v9_json_payloads/';
$pages = [
    'Header Master' => ['file' => 'header.json', 'type' => 'header'],
    'Footer Master' => ['file' => 'footer.json', 'type' => 'footer']
];

global $wpdb;
$url_map = [];
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

echo "<h2>Creating NATIVE Elementor Theme Builder Templates...</h2>";

foreach($pages as $title => $info) {
    $json_file = $info['file'];
    $tmpl_type = $info['type'];

    $path = $json_dir . $json_file;
    if(!file_exists($path)) {
        echo "Missing JSON: $path <br>";
        continue;
    }
    
    $content = file_get_contents($path);
    foreach($url_map as $local_file => $wp_url) {
        $content = str_replace("%%FILE:" . $local_file . "%%", $wp_url, $content);
    }
    
    $data = json_decode($content, true);
    if(!$data) {
        echo "Failed to decode $json_file <br>";
        continue;
    }

    // Menu Auto-Discovery and Injection for Header Nav-Menu
    if ($tmpl_type === 'header') {
        $menu_term = get_term_by('name', 'Ppal Desktop', 'nav_menu');
        if ($menu_term) {
            echo "🔍 Located menu 'Ppal Desktop' (ID: {$menu_term->term_id}). Injecting into nav-menu widget...<br>";
            // Recursive function to find and modify nav-menu elements
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
        } else {
            echo "⚠️ Menu 'Ppal Desktop' not found in database. WordPress nav-menu might be empty.<br>";
        }
    }
    
    // Purge ANY existing posts (both dummy pages and old elementor_library templates) with the same name
    $existing = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type IN ('page', 'elementor_library')", $title));
    if(!empty($existing)) {
        foreach($existing as $eid) {
            wp_delete_post($eid, true);
            echo "🧹 Deleted old duplicate '$title' (ID: $eid)<br>";
        }
    }
    
    // Create natively as Theme Builder Template
    $page_id = wp_insert_post([
        'post_title' => $title,
        'post_name' => sanitize_title($title),
        'post_type' => 'elementor_library',
        'post_status' => 'publish'
    ]);
    
    if(is_wp_error($page_id)) {
        echo "Error creating $title: " . $page_id->get_error_message() . "<br>";
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
    $conditions = get_option('elementor_theme_builder_conditions', []);
    if (!is_array($conditions)) $conditions = [];
    $conditions[$tmpl_type][$page_id] = [
        [ 'type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '' ]
    ];
    update_option('elementor_theme_builder_conditions', $conditions);

    // Clear cache
    if (class_exists('Elementor\Plugin') && isset(\Elementor\Plugin::$instance->posts_manager)) {
         \Elementor\Plugin::$instance->posts_manager->clear_cache($page_id);
    }
    
    echo "✅ Successfully created '$title' (ID: $page_id) as Global $tmpl_type<br>";
}

echo "<h3>DONE. Templates injected as Theme Builder & mapped across entire site!</h3>";
?>
