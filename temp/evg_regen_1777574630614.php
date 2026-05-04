<?php
if (($_GET["t"] ?? "") !== "d8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6") die("no");
require_once(dirname(__FILE__) . "/wp-load.php");
header("Content-Type: application/json");
$r = array();
delete_option("_elementor_global_css");
wp_cache_flush();
if (class_exists("Elementor\\Plugin")) {
  Elementor\\Plugin::instance()->files_manager->clear_cache();
  $r["elementor"] = "regenerated";
}
$r["status"] = "ok";
$r["time"] = date("c");
echo json_encode($r);
@unlink(__FILE__);
?>