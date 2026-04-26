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

$page_id = 1590; // respaldo-energetico-industrial

$schema = [
    '@context' => 'https://schema.org',
    '@type'    => 'Product',
    'name'     => 'Respaldo Energético Comercial e Industrial',
    'description' => 'Soluciones de respaldo energético industrial y comercial con plantas eléctricas e inversores de alta capacidad para empresas en Venezuela.',
    'brand'    => [
        '@type' => 'Brand',
        'name'  => 'Evergreen',
    ],
    'category' => 'Respaldo Comercial e Industrial',
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

update_post_meta($page_id, 'rank_math_schema_Product', wp_slash(json_encode($schema)));

echo json_encode(['success' => true, 'page_id' => $page_id, 'message' => 'Product schema injected for respaldo-energetico-industrial']);
?>
