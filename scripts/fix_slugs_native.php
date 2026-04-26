<?php
/**
 * fix_slugs_native.php
 * Fixes slugs and titles using native WordPress functions to bypass WAF 406.
 */

// Use SHORTINIT to bypass potential plugin fatal errors if needed, 
// but here we need wp_update_post which requires the full load or at least parts.
// We'll try full load first.

require_once('wp-load.php');




$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

$manifest_json = <<<'JSON'
[
    { "wp_id": 1586, "slug": "homepage", "title": "Evergreen Venezuela" },
    { "wp_id": 1587, "slug": "soluciones-de-energia", "title": "Soluciones de Energía" },
    { "wp_id": 1588, "slug": "estaciones-de-energia-portatiles", "title": "Estaciones de Energía Portátiles" },
    { "wp_id": 1589, "slug": "respaldo-energetico-residencial", "title": "Respaldo Energético Residencial" },
    { "wp_id": 1590, "slug": "respaldo-energetico-industrial", "title": "Respaldo Energético Comercial e Industrial" },
    { "wp_id": 1591, "slug": "baterias-de-energia-solar", "title": "Baterías de Energía Solar" },
    { "wp_id": 1592, "slug": "paneles-solares", "title": "Paneles Solares" },
    { "wp_id": 1593, "slug": "iluminacion", "title": "Iluminación" },
    { "wp_id": 1594, "slug": "iluminacion-led-solar", "title": "Iluminación LED Solar" },
    { "wp_id": 1595, "slug": "iluminacion-convencional", "title": "Iluminación Convencional" },
    { "wp_id": 1596, "slug": "jump-starters-arrancadores", "title": "Jump Starters Arrancadores" },
    { "wp_id": 1597, "slug": "calculadora-de-consumo-energetico", "title": "Calculadora de Consumo Energético" },
    { "wp_id": 1598, "slug": "catalogos-y-recursos", "title": "Catálogos y Recursos" },
    { "wp_id": 1599, "slug": "sobre-nosotros", "title": "Sobre Nosotros" },
    { "wp_id": 1600, "slug": "blog", "title": "Blog Artículos y Noticias" },
    { "wp_id": 1601, "slug": "financiamiento", "title": "Financiamiento" },
    { "wp_id": 1602, "slug": "contacto", "title": "Página de Contacto" },
    { "wp_id": 1603, "slug": "soporte-y-garantia", "title": "Soporte y Garantía" },
    { "wp_id": 1604, "slug": "politica-de-privacidad", "title": "Política de Privacidad" },
    { "wp_id": 1605, "slug": "politica-de-cookies", "title": "Política de Cookies" }
]
JSON;

$pages = json_decode($manifest_json, true);

echo "Starting slug fix...\n";

foreach ($pages as $page) {
    $id = $page['wp_id'];
    $slug = $page['slug'];
    $title = $page['title'];

    $update_data = array(
        'ID'         => $id,
        'post_name'  => $slug,
        'post_title' => $title
    );

    $result = wp_update_post($update_data);

    if (is_wp_error($result)) {
        echo "❌ ID $id: Error - " . $result->get_error_message() . "\n";
    } else {
        echo "✅ ID $id: Set to /$slug/ ($title)\n";
    }
}

echo "\nFlushing rewrite rules...\n";
flush_rewrite_rules();

echo "Done.\n";
