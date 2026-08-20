<?php
/**
 * Plugin Name: S2E Deploy Executor (mu-plugin)
 * Description: Aplica _elementor_data desde uploads/s2e_payloads/ con verificación
 *              SHA256 + respaldo automático. Solo invocable vía WP-CLI.
 */
if (!defined('ABSPATH')) exit;

function s2e_deploy($post_id, $payload_rel_path, $expected_sha256) {
    if (!defined('WP_CLI') || !WP_CLI) {
        return new WP_Error('s2e_denied', 'Solo ejecutable vía WP-CLI');
    }
    $base = realpath(WP_CONTENT_DIR . '/uploads/s2e_payloads');
    $real = realpath(ABSPATH . ltrim($payload_rel_path, '/'));
    if (!$base || !$real || strpos($real, $base) !== 0) {
        return new WP_Error('s2e_path', 'Payload fuera de uploads/s2e_payloads/');
    }
    $json = file_get_contents($real);
    if ($json === false || hash('sha256', $json) !== strtolower($expected_sha256)) {
        return new WP_Error('s2e_hash', 'SHA256 no coincide — transporte corrupto o payload equivocado');
    }
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return new WP_Error('s2e_json', 'JSON inválido');
    }
    // Defensa en profundidad: respaldo en meta además del respaldo E4.0 del pipeline
    $prev = get_post_meta($post_id, '_elementor_data', true);
    if ($prev) update_post_meta($post_id, '_elementor_data_backup_s2e', $prev);
    update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($data)));
    update_post_meta($post_id, '_elementor_edit_mode', 'builder');
    return 'deployed';
}
