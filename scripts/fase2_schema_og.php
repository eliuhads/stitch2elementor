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
$rm_titles['knowledgegraph_name'] = 'Evergreen Venezuela';
$rm_titles['knowledgegraph_logo'] = home_url('/wp-content/uploads/evergreen-logo.svg');
$rm_titles['knowledgegraph_url'] = 'https://evergreenvzla.com';

// Social profiles
$rm_titles['social_url_facebook'] = 'https://www.facebook.com/evergreenvzla';
$rm_titles['social_url_instagram'] = 'https://www.instagram.com/evergreenvzla';
$rm_titles['social_url_twitter'] = '';
$rm_titles['social_url_linkedin'] = '';

// Local Business info
$rm_titles['local_business_type'] = 'ElectricalStore';
$rm_titles['local_address']       = 'Caracas, Venezuela';
$rm_titles['local_address_country'] = 'VE';

// Phone
$rm_titles['phone_numbers'] = [
    [
        'type'   => 'customer support',
        'number' => '+58 412-555-0000'
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
$product_pages = [
    'estaciones-de-energia-portatiles' => [
        'name' => 'Estaciones de Energía Portátiles',
        'description' => 'Estaciones de energía portátil recargables con paneles solares, ideales para camping, emergencias y uso profesional en Venezuela.',
        'brand' => 'Evergreen',
        'category' => 'Energía Portátil',
    ],
    'baterias-de-energia-solar' => [
        'name' => 'Baterías de Energía Solar',
        'description' => 'Baterías de litio y AGM para almacenamiento de energía solar, con alta durabilidad y eficiencia para hogares y negocios.',
        'brand' => 'Evergreen',
        'category' => 'Almacenamiento Solar',
    ],
    'paneles-solares' => [
        'name' => 'Paneles Solares Fotovoltaicos',
        'description' => 'Paneles solares monocristalinos y policristalinos de alta eficiencia para instalaciones residenciales y comerciales en Venezuela.',
        'brand' => 'Evergreen',
        'category' => 'Energía Solar',
    ],
    'iluminacion-led-solar' => [
        'name' => 'Iluminación LED Solar',
        'description' => 'Luminarias LED alimentadas por energía solar para exteriores, calles, jardines y áreas industriales.',
        'brand' => 'Evergreen',
        'category' => 'Iluminación Solar',
    ],
    'iluminacion-convencional' => [
        'name' => 'Iluminación LED Convencional',
        'description' => 'Luminarias LED de bajo consumo para interiores y exteriores, con alta eficiencia lumínica y larga vida útil.',
        'brand' => 'Evergreen',
        'category' => 'Iluminación LED',
    ],
    'jump-starters-arrancadores' => [
        'name' => 'Jump Starters y Arrancadores',
        'description' => 'Arrancadores portátiles de baterías para vehículos con funciones de carga USB y linterna LED de emergencia.',
        'brand' => 'Evergreen',
        'category' => 'Accesorios Automotriz',
    ],
    'respaldo-energetico-residencial' => [
        'name' => 'Respaldo Energético Residencial',
        'description' => 'Sistemas de respaldo energético con baterías de litio e inversores para hogares, protección contra apagones.',
        'brand' => 'Evergreen',
        'category' => 'Respaldo Residencial',
    ],
    'respaldo-energetico-comercial' => [
        'name' => 'Respaldo Energético Comercial',
        'description' => 'Soluciones de respaldo energético industrial y comercial con plantas eléctricas e inversores de alta capacidad.',
        'brand' => 'Evergreen',
        'category' => 'Respaldo Comercial',
    ],
];

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
                'name'  => 'Evergreen Venezuela',
            ],
        ],
        'manufacturer' => [
            '@type' => 'Organization',
            'name'  => 'Evergreen',
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
