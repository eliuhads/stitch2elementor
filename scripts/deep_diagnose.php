<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

error_reporting(E_ALL);
ini_set('display_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');


$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

global $wpdb;

$results = [];

// 1. Check PHP error log for recent entries
$error_log = ini_get('error_log');
$results['error_log_path'] = $error_log;

if ($error_log && file_exists($error_log)) {
    $lines = file($error_log);
    $results['last_errors'] = array_slice($lines, -20);
} else {
    // Try WP debug log
    $wp_debug_log = ABSPATH . 'wp-content/debug.log';
    if (file_exists($wp_debug_log)) {
        $lines = file($wp_debug_log);
        $results['last_errors'] = array_slice($lines, -20);
        $results['error_log_path'] = $wp_debug_log;
    } else {
        $results['last_errors'] = 'No error log found';
    }
}

// 2. Check WP_DEBUG status
$results['wp_debug'] = defined('WP_DEBUG') ? WP_DEBUG : false;

// 3. Check memory limit
$results['memory_limit'] = ini_get('memory_limit');
$results['max_execution_time'] = ini_get('max_execution_time');

// 4. Try to render a failing page in isolation to capture the error
$test_slug = isset($_GET['slug']) ? $_GET['slug'] : 'estaciones-de-energia-portatiles';
$test_page = $wpdb->get_row($wpdb->prepare(
    "SELECT ID, post_title FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' LIMIT 1",
    $test_slug
));

if ($test_page) {
    $results['test_page'] = [
        'id' => $test_page->ID,
        'title' => $test_page->post_title,
    ];
    
    // Check elementor data size and validity
    $el_data = get_post_meta($test_page->ID, '_elementor_data', true);
    $results['test_page']['elementor_data_size'] = strlen($el_data);
    
    $decoded = json_decode($el_data, true);
    $results['test_page']['json_valid'] = ($decoded !== null);
    $results['test_page']['json_error'] = json_last_error_msg();
    
    // Count elements recursively
    $count_elements = function($elements) use (&$count_elements) {
        $count = 0;
        if (!is_array($elements)) return 0;
        foreach ($elements as $el) {
            $count++;
            if (!empty($el['elements'])) {
                $count += $count_elements($el['elements']);
            }
        }
        return $count;
    };
    
    if ($decoded) {
        $results['test_page']['element_count'] = $count_elements($decoded);
        
        // Check for any element with problematic settings
        $check_elements = function($elements, $depth = 0) use (&$check_elements) {
            $issues = [];
            foreach ($elements as $idx => $el) {
                $elType = isset($el['elType']) ? $el['elType'] : 'unknown';
                $widgetType = isset($el['widgetType']) ? $el['widgetType'] : '';
                
                // Check for missing required fields
                if (empty($el['id'])) {
                    $issues[] = "Element at depth $depth idx $idx ($elType/$widgetType) missing ID";
                }
                if (!isset($el['settings'])) {
                    $issues[] = "Element {$el['id']} ($elType/$widgetType) missing settings";
                }
                
                if (!empty($el['elements'])) {
                    $issues = array_merge($issues, $check_elements($el['elements'], $depth + 1));
                }
            }
            return $issues;
        };
        
        $issues = $check_elements($decoded);
        $results['test_page']['structural_issues'] = $issues ?: 'None found';
    }
    
    // Check ALL meta keys for this page
    $all_meta = $wpdb->get_results($wpdb->prepare(
        "SELECT meta_key, LENGTH(meta_value) as val_len FROM {$wpdb->postmeta} WHERE post_id = %d ORDER BY meta_key",
        $test_page->ID
    ));
    
    $results['test_page']['all_meta_keys'] = [];
    foreach ($all_meta as $m) {
        $results['test_page']['all_meta_keys'][$m->meta_key] = (int)$m->val_len;
    }
    
    // 5. Try wp_remote_get with error capture
    // Enable WP_DEBUG temporarily to capture output
    $url = home_url("/$test_slug/");
    $response = wp_remote_get($url, [
        'timeout' => 15,
        'sslverify' => false,
        'headers' => ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0']
    ]);
    
    if (is_wp_error($response)) {
        $results['test_page']['http_error'] = $response->get_error_message();
    } else {
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $results['test_page']['http_code'] = $code;
        $results['test_page']['body_length'] = strlen($body);
        
        // Look for PHP error messages in body
        if (preg_match('/Fatal error.*?(?:in|on)\s+([^\s]+)\s+on line\s+(\d+)/i', $body, $matches)) {
            $results['test_page']['fatal_error'] = $matches[0];
        }
        if (preg_match('/Warning.*?(?:in|on)\s+([^\s]+)/i', $body, $matches)) {
            $results['test_page']['warning'] = $matches[0];
        }
        
        // Get last 500 chars of body for clues
        if ($code >= 500) {
            $results['test_page']['body_tail'] = substr($body, -500);
        }
    }
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
