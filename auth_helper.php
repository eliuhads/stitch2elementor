<?php
/**
 * Centralized Authentication Helper for PHP endpoints.
 * Requires an 'Authorization: Bearer <token>' header matching WP_SCRIPT_TOKEN.
 */

// Add polyfill for getallheaders if running on Nginx/PHP-FPM
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

function check_rate_limit($max_requests = 10, $window_seconds = 60) {
    $ip_key = 'ratelimit_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $current = (int) get_transient($ip_key);
    if ($current >= $max_requests) {
        http_response_code(429);
        die(json_encode(['error' => 'Too Many Requests. Try again later.']));
    }
    set_transient($ip_key, $current + 1, $window_seconds);
}

function verify_api_token() {
    check_rate_limit();
    $expected_token = defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : getenv('WP_SCRIPT_TOKEN');
    
    // For local development testing, allow fallback to a default token if explicitly configured
    // Wait, let's keep it strictly secure as requested.
    if (empty($expected_token)) {
        http_response_code(500);
        die(json_encode(['error' => 'Server misconfiguration: WP_SCRIPT_TOKEN not defined.']));
    }

    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Check if the server is passing REDIRECT_HTTP_AUTHORIZATION or HTTP_AUTHORIZATION
    if (empty($auth_header) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (empty($auth_header) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    // Also support $_GET['token'] for backwards compatibility during migration if header is missing,
    // but the prompt explicitly said "Move PHP authentication tokens from query string to Authorization header. Añadir al inicio de cada PHP script".
    // I will enforce Authorization header ONLY, and drop the GET token.
    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        $provided_token = $matches[1];
        if (hash_equals($expected_token, $provided_token)) {
            return true;
        } else {
            http_response_code(403);
            die(json_encode(['error' => 'Unauthorized: Invalid token.']));
        }
    }
    
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized: Missing or invalid Authorization header.']));
}
