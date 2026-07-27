<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

error_reporting(E_ALL);
ini_set('display_errors', 1);

$wp_load = __DIR__ . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("❌ FATAL: wp-load.php not found.\n");
}
require_once($wp_load);

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
// ============================================================

global $wpdb;
$home_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_name = 'homepage' AND post_type = 'page' AND post_status = 'publish' ORDER BY ID DESC LIMIT 1");
$blog_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_name = 'blog' AND post_type = 'page' AND post_status = 'publish' ORDER BY ID DESC LIMIT 1");

if ($home_id) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_id);
    echo "✅ Portada (Homepage) actualizada dinámicamente al ID: $home_id\n";
}

if ($blog_id) {
    update_option('page_for_posts', $blog_id);
    echo "✅ Página de entradas (Blog) actualizada dinámicamente al ID: $blog_id\n";
}

echo "✅ Listo.";
