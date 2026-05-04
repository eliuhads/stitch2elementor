<?php
if (($_GET["t"] ?? "") !== "d8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6") die("no");
require_once(dirname(__FILE__) . "/wp-load.php");
header("Content-Type: application/json");
$r = [];

// Delete all Elementor CSS cache files
$css_dir = WP_CONTENT_DIR . "/uploads/elementor/css/";
if (is_dir($css_dir)) {
  $files = glob($css_dir . "post-*.css");
  foreach ($files as $f) { unlink($f); $r["deleted"][] = basename($f); }
}

// Clear Elementor global CSS option
delete_option("_elementor_global_css");

// Clear WP object cache
if (function_exists("wp_cache_flush")) { wp_cache_flush(); $r["wp_cache"] = "flushed"; }

// Try LiteSpeed purge methods
if (class_exists("LiteSpeed_Cache_API")) {
  LiteSpeed_Cache_API::purge_all();
  $r["ls"] = "api_purged";
} else {
  // Direct delete of LS cache files
  $ls_dir = WP_CONTENT_DIR . "/litespeed/";
  if (is_dir($ls_dir)) {
    $r["ls_dir"] = scandir($ls_dir);
  }
  // Also try DB method
  global $wpdb;
  $wpdb->query("DELETE FROM " . $wpdb->options . " WHERE option_name LIKE '%litespeed.cache%'");
  $r["ls"] = "db_cleaned";
}

$r["status"] = "purged";
$r["time"] = date("c");
echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
?>