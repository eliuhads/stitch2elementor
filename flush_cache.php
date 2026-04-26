<?php
// Script to flush cache, rewrite rules, and sync Elementor library
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

// ============================================================
// SECURITY: Token-based authentication
// ============================================================
$expected_token = defined('WP_SCRIPT_TOKEN') ? WP_SCRIPT_TOKEN : getenv('WP_SCRIPT_TOKEN');
if (empty($expected_token)) { http_response_code(500); die(json_encode(['error' => 'Server misconfiguration: WP_SCRIPT_TOKEN not defined.'])); }
$provided_token = isset($_GET['token']) ? $_GET['token'] : '';
if (!hash_equals($expected_token, $provided_token)) { http_response_code(403); die(json_encode(['error' => 'Forbidden — invalid or missing token.'])); }
// ============================================================

echo "<h2>🔧 Ejecutando mantenimiento del sistema...</h2>";

// 1. Guardar cambios en enlaces permanentes
flush_rewrite_rules(false);
echo "✅ Enlaces permanentes (Permalinks) actualizados y reescritos.<br>";

// 1.5. Configurar Homepage y Blog si se proporcionan IDs
if (isset($_GET['home_id']) || isset($_GET['blog_id'])) {
    echo "<h3>🏠 Configurando Front-end del sitio...</h3>";
    update_option('show_on_front', 'page');
    
    if (isset($_GET['home_id']) && !empty($_GET['home_id'])) {
        update_option('page_on_front', intval($_GET['home_id']));
        echo "✅ Portada (Homepage) establecida al ID: " . intval($_GET['home_id']) . "<br>";
    }
    
    if (isset($_GET['blog_id']) && !empty($_GET['blog_id'])) {
        update_option('page_for_posts', intval($_GET['blog_id']));
        echo "✅ Página de entradas (Blog) establecida al ID: " . intval($_GET['blog_id']) . "<br>";
    }
}

// 2. Clear Files & Data (Regenerate CSS & Data)
if (class_exists('\Elementor\Plugin')) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    echo "✅ Archivos CSS de Elementor regenerados y caché borrada.<br>";
} else {
    echo "⚠️ Elementor no encontrado.<br>";
}

// 3. Sincronizar Biblioteca
if (class_exists('\Elementor\Api')) {
    // Delete transient to force library sync
    delete_transient('elementor_remote_info_library');
    delete_option('elementor_remote_info_library');
    \Elementor\Api::get_library_data(true);
    echo "✅ Biblioteca de Elementor sincronizada exitosamente.<br>";
} else {
    echo "⚠️ Elementor API no encontrada.<br>";
}

echo "<h3>🎉 Todos los comandos se han ejecutado con éxito. Puedes cerrar esta ventana.</h3>";
?>
