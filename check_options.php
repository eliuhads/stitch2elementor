<?php
// check_options.php
require_once('wp-load.php');
echo "CURRENT SETTINGS:\n";
echo "show_on_front: " . get_option('show_on_front') . "\n";
echo "page_on_front: " . get_option('page_on_front') . "\n";
echo "page_for_posts: " . get_option('page_for_posts') . "\n";

$home_page = get_post(get_option('page_on_front'));
echo "Home Page Title: " . ($home_page ? home_page->post_title : 'NOT FOUND') . "\n";

echo "\nALL PAGES (ID - Title):\n";
$pages = get_pages();
foreach($pages as $page) {
    echo $page->ID . " - " . $page->post_title . "\n";
}
