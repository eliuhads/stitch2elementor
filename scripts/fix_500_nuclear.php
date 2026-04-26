<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

global $wpdb;

$results = [];

// NUCLEAR OPTION: Delete ALL rank_math_schema entries that we injected
// RankMath will regenerate default schemas (Article, WebPage) automatically
$deleted = $wpdb->query(
    "DELETE FROM {$wpdb->postmeta} WHERE meta_key = 'rank_math_schema'"
);
$results[] = "Deleted $deleted rank_math_schema entries.";

// Also clean any leftover rank_math_schema_Product (belt and suspenders)
$deleted2 = $wpdb->query(
    "DELETE FROM {$wpdb->postmeta} WHERE meta_key = 'rank_math_schema_Product'"
);
$results[] = "Deleted $deleted2 rank_math_schema_Product entries.";

// Clear RankMath caches
delete_transient('rank_math_schema_cache');
$results[] = "RankMath schema cache cleared.";

// Now test ALL the previously-failing pages
$test_slugs = [
    'estaciones-de-energia-portatiles',
    'iluminacion-led-solar',
    'paneles-solares',
    'baterias-de-energia-solar',
    'iluminacion-convencional',
    'jump-starters-arrancadores',
    'respaldo-energetico-residencial',
    'respaldo-energetico-industrial',
];

foreach ($test_slugs as $slug) {
    $url = home_url("/$slug/");
    $response = wp_remote_get($url, [
        'timeout' => 15,
        'sslverify' => false,
        'headers' => ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0']
    ]);
    
    if (is_wp_error($response)) {
        $results[] = "❌ $slug: " . $response->get_error_message();
    } else {
        $code = wp_remote_retrieve_response_code($response);
        $emoji = ($code === 200) ? '✅' : '❌';
        $results[] = "$emoji $slug: HTTP $code";
    }
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
