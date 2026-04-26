<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

$results = [];

// =============================================
// 1. SCHEMA: Organization + LocalBusiness
// =============================================
// RankMath stores structured data settings in rank-math-options-general
$rm_general = get_option('rank-math-options-general', []);

// Local SEO / Organization settings via RankMath titles & meta
$rm_titles = get_option('rank-math-options-titles', []);

// Set Knowledge Graph type to Organization (company)
$rm_titles['knowledgegraph_type'] = 'company';
$rm_titles['knowledgegraph_name'] = get_bloginfo('name');
$rm_titles['knowledgegraph_logo'] = '';
$rm_titles['knowledgegraph_url'] = home_url();

// Social profiles
$rm_titles['social_url_facebook'] = '';
$rm_titles['social_url_instagram'] = '';
$rm_titles['social_url_twitter'] = '';
$rm_titles['social_url_linkedin'] = '';

// Local Business info
$rm_titles['local_business_type'] = 'ElectricalStore';
$rm_titles['local_address']       = '';
$rm_titles['local_address_country'] = '';

// Phone
$rm_titles['phone_numbers'] = [
    [
        'type'   => 'customer support',
        'number' => ''
    ]
];

// Opening Hours
$rm_titles['opening_hours'] = [
    ['day' => 'Monday',    'time' => '08:00-17:00'],
    ['day' => 'Tuesday',   'time' => '08:00-17:00'],
    ['day' => 'Wednesday', 'time' => '08:00-17:00'],
    ['day' => 'Thursday',  'time' => '08:00-17:00'],
    ['day' => 'Friday',    'time' => '08:00-17:00'],
    ['day' => 'Saturday',  'time' => '09:00-13:00'],
];

update_option('rank-math-options-titles', $rm_titles);
$results[] = 'Organization + LocalBusiness schema configured.';

// =============================================
// 2. SCHEMA: Product (per product page)
// =============================================
// Map slugs to product schema data
$pages = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'posts_per_page' => -1]);
$product_pages = [];
$site_name = get_bloginfo('name');
foreach ($pages as $p) {
    $product_pages[$p->post_name] = [
        'name' => $p->post_title,
        'description' => wp_trim_words($p->post_content, 20),
        'brand' => $site_name,
        'category' => 'Product'
    ];
}

global $wpdb;

foreach ($product_pages as $slug => $product) {
    $page = $wpdb->get_row($wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' AND post_status = 'publish' LIMIT 1",
        $slug
    ));
    
    if (!$page) {
        $results[] = "⚠️ Page not found: $slug";
        continue;
    }
    
    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Product',
        'name'     => $product['name'],
        'description' => $product['description'],
        'brand'    => [
            '@type' => 'Brand',
            'name'  => $product['brand'],
        ],
        'category' => $product['category'],
        'offers'   => [
            '@type'         => 'Offer',
            'availability'  => 'https://schema.org/InStock',
            'priceCurrency' => 'USD',
            'seller'        => [
                '@type' => 'Organization',
                'name' => $site_name,
            ],
        ],
        'manufacturer' => [
            '@type' => 'Organization',
            'name' => $site_name,
        ],
    ];
    
    // RankMath stores custom schema in rank_math_schema_{type}
    // The proper way is via the rank_math_schema meta
    update_post_meta($page->ID, 'rank_math_schema_Product', wp_slash(json_encode($schema)));
    
    $results[] = "✅ Product schema injected: $slug (ID: {$page->ID})";
}

// =============================================
// 3. OPEN GRAPH DEFAULTS (Global)
// =============================================
$rm_general['open_graph_image_overlay'] = 'off';
$rm_general['open_graph_image_type']    = 'custom_image';

// Default OG fallback
$rm_titles['homepage_facebook_title']       = 'Evergreen Venezuela - Soluciones Energéticas Integrales';
$rm_titles['homepage_facebook_description'] = 'Proveedores líderes en plantas eléctricas, soluciones solares, baterías de litio y energía portátil a nivel nacional.';
$rm_titles['homepage_twitter_title']        = 'Evergreen Venezuela - Energía Solar y Portátil';
$rm_titles['homepage_twitter_description']  = 'Soluciones energéticas integrales: paneles solares, estaciones portátiles, iluminación LED y respaldo energético.';

// Default OG for pages
$rm_titles['pt_page_facebook_title']       = '%title% - Evergreen Venezuela';
$rm_titles['pt_page_facebook_description'] = '%excerpt%';
$rm_titles['pt_page_twitter_title']        = '%title% - Evergreen Venezuela';

update_option('rank-math-options-general', $rm_general);
update_option('rank-math-options-titles', $rm_titles);
$results[] = 'Open Graph defaults configured.';

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

