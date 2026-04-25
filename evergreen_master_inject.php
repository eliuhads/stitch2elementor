<?php
/**
 * Evergreen V9 Master Injector
 * Autonomously applies Global Fonts, Colors, and Layout settings to Elementor.
 */

// 1. Boot WordPress
$wp_load = __DIR__ . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("Error: wp-load.php not found. Please place this file in your WordPress root.");
}
require_once($wp_load);

$kit_id = 8; // Default kit ID according to user screenshot
$brand_name = "Evergreen V9 Master";

// 2. Define the Design System
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

// 3. Update Meta
$settings = get_post_meta($kit_id, '_elementor_page_settings', true) ?: [];

$settings['system_colors'] = $system_colors;
$settings['system_typography'] = $system_typography;
$settings['container_width'] = [ 'unit' => 'px', 'size' => '1280' ];

update_post_meta($kit_id, '_elementor_page_settings', $settings);

// 4. Force Elementor Regeneration
if (class_exists('Elementor\Plugin')) {
     \Elementor\Plugin::$instance->posts_manager->clear_cache($kit_id);
    echo "<h1>Evergreen V9 Master Applied Successfully</h1>";
} else {
    echo "<h1>Meta Updated, but Elementor Plugin not active.</h1>";
}

// 5. Self-Destruct
unlink(__FILE__);
echo "<p>Security: Script self-deleted.</p>";
