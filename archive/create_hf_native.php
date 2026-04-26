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
$templates = [
    'Header Master' => ['file' => 'header.json', 'type' => 'header'],
    'Footer Master' => ['file' => 'footer.json', 'type' => 'footer']
];

global $wpdb;

echo "<h2>🔧 Creating NATIVE Elementor Theme Builder Templates...</h2>";

// ============================================================
// STEP 1: Clean up ALL existing HF templates to avoid conflicts
// ============================================================
$existing_hf = $wpdb->get_results(
    "SELECT p.ID, p.post_title, pm.meta_value as tmpl_type 
     FROM {$wpdb->posts} p 
     LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_elementor_template_type'
     WHERE p.post_type = 'elementor_library' 
     AND pm.meta_value IN ('header', 'footer')
     AND p.post_status IN ('publish', 'draft', 'trash')"
);

foreach ($existing_hf as $old) {
    wp_delete_post($old->ID, true);
    echo "🧹 Purged old {$old->tmpl_type} template: '{$old->post_title}' (ID: {$old->ID})<br>";
}

// Also purge any page-type posts with same names
foreach ($templates as $title => $info) {
    $dupes = $wpdb->get_col($wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type IN ('page', 'elementor_library')", $title
    ));
    foreach ($dupes as $eid) {
        wp_delete_post($eid, true);
        echo "🧹 Purged duplicate '{$title}' (ID: {$eid})<br>";
    }
}

// ============================================================
// STEP 2: Reset the global theme builder conditions completely
// ============================================================
delete_option('elementor_pro_theme_builder_conditions');

$new_conditions = [];

// ============================================================
// STEP 3: Create each template
// ============================================================
foreach ($templates as $title => $info) {
    $json_file = $info['file'];
    $tmpl_type = $info['type'];

    $path = $json_dir . $json_file;
    if (!file_exists($path)) {
        echo "❌ Missing JSON: $path<br>";
        continue;
    }
    
    $content = file_get_contents($path);
    $data = json_decode($content, true);
    if (!$data) {
        echo "❌ Failed to decode $json_file<br>";
        continue;
    }

    // Menu Auto-Discovery for Header
    if ($tmpl_type === 'header') {
        $menu_term = null;
        foreach (['Ppal Desktop', 'Main Menu', 'primary'] as $try_name) {
            $menu_term = get_term_by('name', $try_name, 'nav_menu');
            if ($menu_term) break;
            $menu_term = get_term_by('slug', $try_name, 'nav_menu');
            if ($menu_term) break;
        }
        if (!$menu_term) {
            $all_menus = get_terms('nav_menu', ['hide_empty' => false]);
            if (!empty($all_menus)) {
                $menu_term = $all_menus[0];
            }
        }
        if ($menu_term) {
            echo "🔍 Found menu '{$menu_term->name}' (ID: {$menu_term->term_id})<br>";
            // Recursively inject menu ID into any nav-menu widget
            $inject_menu = function(&$elements) use (&$inject_menu, $menu_term) {
                foreach ($elements as &$el) {
                    if (isset($el['widgetType']) && $el['widgetType'] === 'nav-menu') {
                        $el['settings']['menu'] = (string)$menu_term->term_id;
                    }
                    if (!empty($el['elements'])) {
                        $inject_menu($el['elements']);
                    }
                }
            };
            $inject_menu($data);
        } else {
            echo "⚠️ No WordPress menus found.<br>";
        }
    }

    // Create the template post
    $page_id = wp_insert_post([
        'post_title'  => $title,
        'post_name'   => sanitize_title($title),
        'post_type'   => 'elementor_library',
        'post_status' => 'publish',
        'post_content' => '',
    ]);
    
    if (is_wp_error($page_id)) {
        echo "❌ Error creating $title: " . $page_id->get_error_message() . "<br>";
        continue;
    }
    
    // ============================================================
    // CRITICAL META: These are the EXACT keys Elementor Pro checks
    // ============================================================
    
    // 1. Elementor Data (the actual layout)
    update_post_meta($page_id, '_elementor_data', wp_slash(json_encode($data)));
    
    // 2. Edit mode
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    
    // 3. Template type (header/footer) — this tells Elementor what kind of template it is
    update_post_meta($page_id, '_elementor_template_type', $tmpl_type);
    
    // 4. Page template — must be 'elementor_canvas' for header/footer
    update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');
    
    // 5. Conditions — FLAT STRING ARRAY format: ['include/general']
    // This is how Elementor Pro stores per-post conditions
    update_post_meta($page_id, '_elementor_conditions', ['include/general']);
    
    // 6. Version
    update_post_meta($page_id, '_elementor_version', defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : '3.25.0');
    
    // 7. Elementor Pro Version
    if (defined('ELEMENTOR_PRO_VERSION')) {
        update_post_meta($page_id, '_elementor_pro_version', ELEMENTOR_PRO_VERSION);
    }
    
    // 8. Template sub type (for Elementor Pro theme builder)
    update_post_meta($page_id, '_elementor_template_sub_type', '');
    
    // 9. Document type taxonomy
    wp_set_object_terms($page_id, $tmpl_type, 'elementor_library_type');
    
    // Build global conditions map
    // Format: $conditions['header']['123'] = ['include/general']
    $new_conditions[$tmpl_type][$page_id] = ['include/general'];
    
    // Clear individual post CSS cache
    delete_post_meta($page_id, '_elementor_css');
    delete_post_meta($page_id, '_elementor_inline_css');
    
    echo "✅ Created '$title' as Theme Builder $tmpl_type (ID: $page_id)<br>";
}

// ============================================================
// STEP 4: Save the GLOBAL conditions option
// ============================================================
// Elementor Pro uses 'elementor_pro_theme_builder_conditions' internally (not 'elementor_theme_builder_conditions')
// But some versions use both. Set both to be safe.
update_option('elementor_pro_theme_builder_conditions', $new_conditions);
update_option('elementor_theme_builder_conditions', $new_conditions);

echo "<br>📋 Global conditions saved: " . json_encode($new_conditions) . "<br>";

// ============================================================
// STEP 5: Clear all Elementor caches to force regeneration
// ============================================================
if (class_exists('Elementor\Plugin')) {
    // Clear file manager cache (regenerates CSS)
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    echo "✅ Elementor CSS cache cleared<br>";
}

// Clear theme builder conditions cache
delete_transient('elementor_conditions_cache');
delete_transient('elementor_pro_condition_cache');

echo "<h3>🎉 Theme Builder Header & Footer injected with 'Entire Site' conditions!</h3>";
?>
