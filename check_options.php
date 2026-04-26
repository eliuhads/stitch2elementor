<?php
// check_options.php
require_once('wp-load.php');

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
$expected_token = defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : getenv('WP_SCRIPT_TOKEN');
if (empty($expected_token)) { http_response_code(500); die(json_encode(['error' => 'Server misconfiguration: WP_SCRIPT_TOKEN not defined.'])); }
$provided_token = isset($_GET['token']) ? $_GET['token'] : '';
if (!hash_equals($expected_token, $provided_token)) { http_response_code(403); die(json_encode(['error' => 'Forbidden — invalid or missing token.'])); }
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
