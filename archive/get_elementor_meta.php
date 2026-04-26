<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

require_once(__DIR__ . '/wp-load.php');

$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

global $wpdb;

// Find any elementor_library posts that are headers or footers
$posts = $wpdb->get_results("SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type = 'elementor_library' AND post_status = 'publish' LIMIT 5");

foreach($posts as $p) {
    echo "<h3>" . $p->post_title . " (ID: " . $p->ID . ")</h3>";
    $meta = get_post_meta($p->ID);
    foreach($meta as $key => $val) {
        if (strpos($key, '_elementor') !== false) {
            echo "<b>" . $key . "</b> : " . print_r(maybe_unserialize($val[0]), true) . "<br>";
        }
    }
    echo "<hr>";
}
?>
