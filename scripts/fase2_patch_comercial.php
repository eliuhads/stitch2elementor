<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

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
