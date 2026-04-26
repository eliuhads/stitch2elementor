<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$secret = isset($_GET['secret']) ? $_GET['secret'] : '';
$expected = getenv('INJECT_SECRET') ?: (defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : '');

if (empty($expected) || !hash_equals($expected, $secret)) {
    http_response_code(403);
    die(json_encode(['success' => false, 'error' => 'Forbidden']));
}

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$results = [];

// 1. Set default OG image in RankMath
$og_image_url = home_url('/og-image-evergreen.png');

$rm_general = get_option('rank-math-options-general', []);
$rm_general['open_graph_image_type'] = 'custom_image';
$rm_general['open_graph_image']      = $og_image_url;
update_option('rank-math-options-general', $rm_general);
$results[] = "✅ Default OG image set: $og_image_url";

// 2. Set OG image for each published page that doesn't have one
global $wpdb;
$pages = $wpdb->get_results(
    "SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status = 'publish'"
);

$og_count = 0;
foreach ($pages as $page) {
    $current_og = get_post_meta($page->ID, 'rank_math_facebook_image', true);
    if (empty($current_og)) {
        update_post_meta($page->ID, 'rank_math_facebook_image', $og_image_url);
        update_post_meta($page->ID, 'rank_math_twitter_use_facebook', 'on');
        $og_count++;
    }
}
$results[] = "✅ OG image assigned to $og_count pages.";

// 3. Verify llms.txt and robots.txt exist
if (file_exists(ABSPATH . 'llms.txt')) {
    $results[] = "✅ llms.txt verified at site root.";
} else {
    $results[] = "⚠️ llms.txt NOT found at site root.";
}

if (file_exists(ABSPATH . 'robots.txt')) {
    $results[] = "✅ robots.txt verified at site root.";
} else {
    $results[] = "⚠️ robots.txt NOT found at site root.";
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
