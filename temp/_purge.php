<?php
define('ABSPATH', dirname(__FILE__) . '/');
if (($_GET['t'] ?? '') !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') die('no');
require_once ABSPATH . 'wp-load.php';
header('Content-Type: text/plain');
$out = '';
if (class_exists('LiteSpeed_Cache_API')) { LiteSpeed_Cache_API::purge_all(); $out .= 'LS:purged '; }
if (class_exists('Elementor\\Plugin')) { Elementor\\Plugin::instance()->files_manager->clear_cache(); $out .= 'EL:cleared '; }
$out .= 'mu:' . (file_exists(WP_CONTENT_DIR.'/mu-plugins/evergreen-custom-styles.php')?'yes':'no') . ' ';
$out .= 'css:' . (file_exists(WP_CONTENT_DIR.'/uploads/evergreen-css/evergreen-global.css')?'yes':'no');
echo $out;
@unlink(__FILE__);
?>