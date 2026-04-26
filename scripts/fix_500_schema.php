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

global $wpdb;

// 1. Remove the incorrectly formatted rank_math_schema_Product meta from ALL pages
$deleted = $wpdb->query(
    "DELETE FROM {$wpdb->postmeta} WHERE meta_key = 'rank_math_schema_Product'"
);

$results = [];
$results[] = "Deleted $deleted instances of rank_math_schema_Product meta.";

// 2. Inject schema the CORRECT way RankMath expects it
// RankMath stores schemas in a single meta key: rank_math_schema
// The value is a JSON string containing an array of schema objects
$product_pages = [
    'estaciones-de-energia-portatiles' => [
        'name' => 'Estaciones de Energía Portátiles',
        'description' => 'Estaciones de energía portátil recargables con paneles solares, ideales para camping, emergencias y uso profesional en Venezuela.',
    ],
    'baterias-de-energia-solar' => [
        'name' => 'Baterías de Energía Solar',
        'description' => 'Baterías de litio y AGM para almacenamiento de energía solar, con alta durabilidad y eficiencia.',
    ],
    'paneles-solares' => [
        'name' => 'Paneles Solares Fotovoltaicos',
        'description' => 'Paneles solares monocristalinos y policristalinos de alta eficiencia para instalaciones residenciales y comerciales.',
    ],
    'iluminacion-led-solar' => [
        'name' => 'Iluminación LED Solar',
        'description' => 'Luminarias LED alimentadas por energía solar para exteriores, calles, jardines y áreas industriales.',
    ],
    'iluminacion-convencional' => [
        'name' => 'Iluminación LED Convencional',
        'description' => 'Luminarias LED de bajo consumo para interiores y exteriores, con alta eficiencia lumínica.',
    ],
    'jump-starters-arrancadores' => [
        'name' => 'Jump Starters y Arrancadores',
        'description' => 'Arrancadores portátiles de baterías para vehículos con funciones de carga USB y linterna LED.',
    ],
    'respaldo-energetico-residencial' => [
        'name' => 'Respaldo Energético Residencial',
        'description' => 'Sistemas de respaldo energético con baterías de litio e inversores para hogares.',
    ],
    'respaldo-energetico-industrial' => [
        'name' => 'Respaldo Energético Comercial e Industrial',
        'description' => 'Soluciones de respaldo energético industrial y comercial con plantas eléctricas e inversores de alta capacidad.',
    ],
];

foreach ($product_pages as $slug => $product) {
    $page = $wpdb->get_row($wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' AND post_status = 'publish' LIMIT 1",
        $slug
    ));
    
    if (!$page) {
        $results[] = "⚠️ Page not found: $slug";
        continue;
    }
    
    // RankMath correct schema format: stored in rank_math_schema
    // It expects a JSON-encoded object where keys are schema IDs
    $schema = [
        'metadata' => [
            'title' => 'Product',
            'type'  => 'template',
            'shortcode' => 'product_schema',
            'isPrimary' => true,
        ],
        '@type' => 'Product',
        'name'  => $product['name'],
        'description' => $product['description'],
        'brand' => [
            '@type' => 'Brand',
            'name'  => 'Evergreen',
        ],
        'offers' => [
            '@type'        => 'Offer',
            'availability' => 'InStock',
            'priceCurrency' => 'USD',
        ],
    ];
    
    // Wrap in the array format RankMath expects
    $schema_array = ['product-schema' => $schema];
    
    update_post_meta($page->ID, 'rank_math_schema', wp_slash(json_encode($schema_array)));
    $results[] = "✅ Correct schema injected: $slug (ID: {$page->ID})";
}

// 3. Clear RankMath internal caches
delete_transient('rank_math_schema_cache');

// 4. Test a page to see if it renders
$test_slug = 'iluminacion-led-solar';
$test_page = $wpdb->get_row($wpdb->prepare(
    "SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' LIMIT 1",
    $test_slug
));

if ($test_page) {
    $test_url = home_url("/$test_slug/");
    $response = wp_remote_get($test_url, ['timeout' => 10, 'sslverify' => false]);
    if (is_wp_error($response)) {
        $results[] = "⚠️ Test GET failed: " . $response->get_error_message();
    } else {
        $code = wp_remote_retrieve_response_code($response);
        $results[] = "🔍 Test GET $test_slug: HTTP $code";
    }
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
