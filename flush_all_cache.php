<?php
/**
 * flush_elementor_cache.php
 * Forces Elementor to regenerate all CSS files and clear all caches.
 * DELETE AFTER USE.
 */
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

if ($_GET['key'] !== 'ev3rgr33n_2026_flush') {
    wp_die('Unauthorized');
}

header('Content-Type: text/plain');
echo "=== Elementor Full Cache Flush ===\n\n";

// 1. Clear Elementor CSS cache
if (class_exists('\Elementor\Plugin')) {
    // Clear files manager cache (CSS files)
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    echo "✅ files_manager->clear_cache() done\n";

    // Force CSS regeneration
    delete_option('elementor_css_print_method');
    echo "✅ CSS print method reset\n";
    
    // Clear data manager
    if (method_exists(\Elementor\Plugin::$instance, 'documents')) {
        // Iterate all published elementor pages and clear their CSS
        $posts = get_posts([
            'post_type' => ['page', 'post', 'elementor_library'],
            'post_status' => 'publish',
            'numberposts' => -1,
            'meta_key' => '_elementor_edit_mode',
            'meta_value' => 'builder'
        ]);
        
        echo "Found " . count($posts) . " Elementor posts to regenerate\n";
        
        foreach ($posts as $post) {
            // Delete the CSS file cache for each post
            delete_post_meta($post->ID, '_elementor_css');
            
            // Clear the document CSS
            $css_file = \Elementor\Core\Files\CSS\Post::create($post->ID);
            $css_file->update();
            
            echo "  → Regenerated CSS for #{$post->ID} ({$post->post_title})\n";
        }
    }
} else {
    echo "⚠️ Elementor Plugin not loaded\n";
}

// 2. Clear Elementor Pro theme builder cache
delete_option('elementor_pro_theme_builder_conditions');

// Re-set the conditions for header/footer
$conditions = [];
// Find header and footer templates
$templates = get_posts([
    'post_type' => 'elementor_library',
    'post_status' => 'publish',
    'numberposts' => -1,
]);

foreach ($templates as $tmpl) {
    $type = get_post_meta($tmpl->ID, '_elementor_template_type', true);
    if ($type === 'header' || $type === 'footer') {
        $conditions[$type][$tmpl->ID] = ['include/general'];
        echo "✅ Restored condition: {$type} #{$tmpl->ID} → include/general\n";
    }
}

update_option('elementor_pro_theme_builder_conditions', $conditions);
echo "✅ Theme builder conditions restored\n";

// 3. Clear WordPress object cache
wp_cache_flush();
echo "✅ WordPress object cache flushed\n";

// 4. Clear transients
global $wpdb;
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_elementor%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_elementor%'");
echo "✅ Elementor transients cleared\n";

// 5. Flush rewrite rules
flush_rewrite_rules();
echo "✅ Rewrite rules flushed\n";

echo "\n=== ALL CACHES CLEARED & CSS REGENERATED ===\n";
echo "⚠️ DELETE THIS FILE NOW\n";
