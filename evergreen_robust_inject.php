<?php
/**
 * Evergreen V9 Robust Injector
 * With Verbose Logging and Error Handling
 */

// 1. Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "<pre>Starting Evergreen V9 Injection...\n";

// 2. Boot WordPress
$wp_load = __DIR__ . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("ERROR: wp-load.php not found at " . __DIR__ . ". Please place this file in your WordPress root.\n");
}
require_once($wp_load);
echo "WordPress loaded successfully.\n";

$kit_id = 8; // Based on your screenshot
echo "Targeting Kit ID: $kit_id\n";

// 3. Define the Design System
$system_colors = [
    [ '_id' => 'primary', 'title' => 'Evergreen Green', 'color' => '#368A39' ],
    [ '_id' => 'secondary', 'title' => 'Energy Flash', 'color' => '#8FDA3E' ],
    [ '_id' => 'text', 'title' => 'Main Text (White)', 'color' => '#FFFFFF' ],
    [ '_id' => 'accent', 'title' => 'Tech Blue', 'color' => '#28B5E1' ],
    [ '_id' => 'bg_dark', 'title' => 'Deep Dark Background', 'color' => '#0B0F1A' ],
    [ '_id' => 'solar_amber', 'title' => 'Solar Amber', 'color' => '#F5A623' ],
    [ '_id' => 'surface_card', 'title' => 'Surface Card', 'color' => '#161C2C' ]
];

$system_typography = [
    [
        '_id' => 'primary',
        'title' => 'H1 - Hero Principal',
        'typography_font_family' => 'Barlow Condensed',
        'typography_font_weight' => '800',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(2.25rem, 1.6667rem + 2.9167vw, 4rem)' ],
        'typography_letter_spacing' => [ 'unit' => 'em', 'size' => '-0.02' ]
    ],
    [
        '_id' => 'secondary',
        'title' => 'H2 - Sección Principal',
        'typography_font_family' => 'Barlow Condensed',
        'typography_font_weight' => '700',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1.5rem, 0.9997rem + 2.5008vw, 3rem)' ],
        'typography_letter_spacing' => [ 'unit' => 'em', 'size' => '-0.02' ]
    ],
    [
        '_id' => 'text',
        'title' => 'Body - Texto General',
        'typography_font_family' => 'Barlow',
        'typography_font_weight' => '400',
        'typography_font_size' => [ 'unit' => 'px', 'size' => '18' ]
    ],
    [
        '_id' => 'h3_sub',
        'title' => 'H3 - Subsección',
        'typography_font_family' => 'Barlow Condensed',
        'typography_font_weight' => '700',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1.125rem, 0.9997rem + 0.6263vw, 1.5rem)' ]
    ],
    [
        '_id' => 'h4_card',
        'title' => 'H4 - Título de Card',
        'typography_font_family' => 'Barlow Condensed',
        'typography_font_weight' => '700',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)' ]
    ],
    [
        '_id' => 'h5_small',
        'title' => 'H5 - Texto Pequeño Bold',
        'typography_font_family' => 'Barlow Condensed',
        'typography_font_weight' => '600',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(0.875rem, 0.8333rem + 0.2083vw, 1rem)' ]
    ],
    [
        '_id' => 'body_small',
        'title' => 'Body Small / Legal',
        'typography_font_family' => 'Barlow',
        'typography_font_weight' => '300',
        'typography_font_size' => [ 'unit' => 'px', 'size' => '14' ]
    ],
    [
        '_id' => 'tech_mono',
        'title' => 'Technical (Mono)',
        'typography_font_family' => 'JetBrains Mono',
        'typography_font_weight' => '400',
        'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(0.75rem, 0.7083rem + 0.2083vw, 0.875rem)' ]
    ]
];

// 4. Update Database
try {
    $current_settings = get_post_meta($kit_id, '_elementor_page_settings', true);
    if (!is_array($current_settings)) $current_settings = [];
    
    $current_settings['system_colors'] = $system_colors;
    $current_settings['system_typography'] = $system_typography;
    $current_settings['container_width'] = [ 'unit' => 'px', 'size' => '1280' ];
    
    $updated = update_post_meta($kit_id, '_elementor_page_settings', $current_settings);
    
    if ($updated) {
        echo "SUCCESS: Database metadata updated for Kit ID $kit_id.\n";
    } else {
        echo "INFO: Database metadata was already up-to-date or no changes made.\n";
    }
} catch (Exception $e) {
    die("ERROR during database update: " . $e->getMessage() . "\n");
}

// 5. Clear Cache (Safe Way)
if (did_action('elementor/loaded') || class_exists('\\Elementor\\Plugin')) {
    echo "Elementor detected. Clearing CSS cache...\n";
    try {
        if (isset(\Elementor\Plugin::$instance->files_manager)) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
            echo "CSS Cache cleared.\n";
        } else {
            echo "Warning: files_manager not found. Please regenerate CSS manually in Elementor > Tools.\n";
        }
    } catch (Exception $e) {
        echo "Non-critical error clearing cache: " . $e->getMessage() . "\n";
    }
} else {
    echo "Warning: Elementor context not found. Styles updated in DB, but regeneration might be needed manually.\n";
}

echo "\n--- INJECTION COMPLETE ---\n";
echo "Please delete this file manually from your server for security.\n";
echo "</pre>";
