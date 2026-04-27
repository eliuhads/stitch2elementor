<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

// Get all published pages to inject default generic product schema (if needed)
$pages = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'posts_per_page' => -1]);
$site_name = get_bloginfo('name');
$results = [];

foreach ($pages as $page) {
    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Product',
        'name'     => $page->post_title,
        'description' => wp_trim_words($page->post_content, 20),
        'brand'    => [
            '@type' => 'Brand',
            'name'  => $site_name,
        ],
        'category' => 'Product',
        'offers'   => [
            '@type'         => 'Offer',
            'availability'  => 'https://schema.org/InStock',
            'priceCurrency' => 'USD',
            'seller'        => [
                '@type' => 'Organization',
                'name'  => $site_name,
            ],
        ],
        'manufacturer' => [
            '@type' => 'Organization',
            'name'  => $site_name,
        ],
    ];

    update_post_meta($page->ID, 'rank_math_schema_Product', wp_slash(json_encode($schema)));
    $results[] = "Product schema injected for {$page->post_name}";
}

echo json_encode(['success' => true, 'message' => 'Product schemas injected']);
?>
