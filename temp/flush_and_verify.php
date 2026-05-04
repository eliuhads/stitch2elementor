<?php
define('ABSPATH', dirname(__FILE__) . '/');
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
  http_response_code(403);
  die('Forbidden');
}
require_once ABSPATH . 'wp-load.php';
header('Content-Type: application/json');
$r = array('status' => 'ok', 'timestamp' => date('c'));
if (class_exists('LiteSpeed_Cache_API')) {
  LiteSpeed_Cache_API::purge_all();
  $r['litespeed'] = 'purged';
}
if (class_exists('Elementor\\Plugin')) {
  Elementor\\Plugin::instance()->files_manager->clear_cache();
  $r['elementor'] = 'cleared';
}

// Verify files exist
$css_path = WP_CONTENT_DIR . '/uploads/evergreen-css/';
$r['global_css_exists'] = file_exists($css_path . 'evergreen-global.css');
$r['global_css_size'] = $r['global_css_exists'] ? filesize($css_path . 'evergreen-global.css') : 0;
$r['homepage_css_exists'] = file_exists($css_path . 'evergreen-homepage-v4.css');
$r['mu_plugin_exists'] = file_exists(WP_CONTENT_DIR . '/mu-plugins/evergreen-custom-styles.php');

echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
