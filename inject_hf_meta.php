<?php
/**
 * inject_hf_meta.php
 * One-time script to set Elementor meta fields on Header/Footer templates.
 * Upload to WordPress root, execute via HTTP, then delete.
 * 
 * SECURITY: Delete this file immediately after use!
 */

// Bootstrap WordPress
define('ABSPATH', dirname(__FILE__) . '/');
require_once(ABSPATH . 'wp-load.php');

// Verify we're authenticated or running from CLI
if (php_sapi_name() !== 'cli' && !current_user_can('manage_options')) {
    // Allow with a secret key for remote execution
    if ($_GET['key'] !== 'ev3rgr33n_2026_inject') {
        wp_die('Unauthorized');
    }
}

header('Content-Type: text/plain');

// Template IDs
$header_id = 1149;
$footer_id = 1150;

// Also check if pages 1147/1148 exist (_HEADER_TEMPLATE/_FOOTER_TEMPLATE from previous session)
$header_page_id = 1147;
$footer_page_id = 1148;

echo "=== Elementor Template Meta Injection ===\n\n";

// Read header data from file or use inline
$header_json_path = __DIR__ . '/v9_json_payloads/header_template.json';
$footer_json_path = __DIR__ . '/v9_json_payloads/footer_template.json';

$header_data = file_exists($header_json_path) ? file_get_contents($header_json_path) : '';
$footer_data = file_exists($footer_json_path) ? file_get_contents($footer_json_path) : '';

echo "Header JSON: " . strlen($header_data) . " bytes\n";
echo "Footer JSON: " . strlen($footer_data) . " bytes\n\n";

// Function to configure a template
function configure_template($post_id, $template_type, $elementor_data, $display_name) {
    echo "--- Configuring {$display_name} (ID: {$post_id}) ---\n";
    
    $post = get_post($post_id);
    if (!$post) {
        echo "  ERROR: Post {$post_id} not found!\n";
        return false;
    }
    
    echo "  Post type: {$post->post_type}\n";
    echo "  Current title: {$post->post_title}\n";
    
    // Set the post type to elementor_library if it isn't already
    if ($post->post_type !== 'elementor_library') {
        echo "  Converting post type to elementor_library...\n";
        wp_update_post(array(
            'ID' => $post_id,
            'post_type' => 'elementor_library'
        ));
    }
    
    // Set all required Elementor meta fields
    update_post_meta($post_id, '_elementor_edit_mode', 'builder');
    update_post_meta($post_id, '_elementor_template_type', $template_type);
    update_post_meta($post_id, '_elementor_version', '3.28.4');
    update_post_meta($post_id, '_wp_page_template', 'elementor_header_footer');
    
    // Set the Elementor data
    if (!empty($elementor_data)) {
        update_post_meta($post_id, '_elementor_data', $elementor_data);
        echo "  _elementor_data: " . strlen($elementor_data) . " bytes SET\n";
    }
    
    // Set display conditions (show on entire site)
    $conditions = array(
        array(
            'type' => 'include',
            'name' => 'general',
        )
    );
    update_post_meta($post_id, '_elementor_conditions', $conditions);
    
    // Also set in Elementor's conditions manager option
    $theme_conditions = get_option('elementor_pro_theme_builder_conditions', array());
    $theme_conditions[$template_type][$post_id] = array('include/general');
    update_option('elementor_pro_theme_builder_conditions', $theme_conditions);
    
    // Set taxonomy
    wp_set_object_terms($post_id, $template_type, 'elementor_library_type');
    
    echo "  _elementor_template_type: {$template_type}\n";
    echo "  _elementor_conditions: include/general (entire site)\n";
    echo "  Theme builder conditions updated\n";
    echo "  ✅ DONE\n\n";
    
    return true;
}

// Configure Header
configure_template($header_id, 'header', $header_data, 'Header');

// Configure Footer
configure_template($footer_id, 'footer', $footer_data, 'Footer');

// Clear Elementor cache
if (class_exists('\Elementor\Plugin')) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    echo "Elementor cache cleared!\n";
} else {
    echo "Note: Elementor Plugin class not loaded (CLI mode?)\n";
}

// Flush rewrite rules
flush_rewrite_rules();
echo "Rewrite rules flushed!\n";

echo "\n=== ALL DONE ===\n";
echo "Header: #{$header_id} → header template, display on entire site\n";
echo "Footer: #{$footer_id} → footer template, display on entire site\n";
echo "\n⚠️ DELETE THIS FILE NOW: rm inject_hf_meta.php\n";
