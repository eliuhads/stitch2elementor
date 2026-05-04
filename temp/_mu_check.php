<?php
/**
 * Plugin Name: Evergreen LED Custom Styles
 * Description: Global CSS overrides for Evergreen LED design system
 * Version: 1.0.0
 */

add_action('wp_enqueue_scripts', function() {
  $css_dir = content_url('/uploads/evergreen-css/');
  $css_path = WP_CONTENT_DIR . '/uploads/evergreen-css/';
  
  // Global styles for all pages
  if (file_exists($css_path . 'evergreen-global.css')) {
    wp_enqueue_style(
      'evergreen-global',
      $css_dir . 'evergreen-global.css',
      array('elementor-frontend'),
      filemtime($css_path . 'evergreen-global.css')
    );
  }
  
  // Homepage-specific overrides
  if (is_page(1758) && file_exists($css_path . 'evergreen-homepage-v4.css')) {
    wp_enqueue_style(
      'evergreen-homepage',
      $css_dir . 'evergreen-homepage-v4.css',
      array('evergreen-global'),
      filemtime($css_path . 'evergreen-homepage-v4.css')
    );
  }
}, 999);
