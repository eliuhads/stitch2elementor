<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

// check_options.php
require_once('wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
// ============================================================

echo "CURRENT SETTINGS:\n";
echo "show_on_front: " . get_option('show_on_front') . "\n";
echo "page_on_front: " . get_option('page_on_front') . "\n";
echo "page_for_posts: " . get_option('page_for_posts') . "\n";

$home_page = get_post(get_option('page_on_front'));
echo "Home Page Title: " . ($home_page ? $home_page->post_title : 'NOT FOUND') . "\n";

echo "\nALL PAGES (ID - Title):\n";
$pages = get_pages();
foreach($pages as $page) {
    echo $page->ID . " - " . $page->post_title . "\n";
}
