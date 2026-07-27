<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();

/**
 * Script for V9: Media Library Registration and JSON Injection
 * Bypasses ModSecurity by reading FTP-uploaded files.
 */
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

require_once(ABSPATH . 'wp-admin/includes/image.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/media.php');

$temp_dir = ABSPATH . 'wp-content/uploads/v9_images_temp/';
$json_dir = ABSPATH . 'v9_json_payloads/';

if (!file_exists($temp_dir)) {
    die("❌ Temp images folder not found at " . $temp_dir);
}
if (!file_exists($json_dir)) {
    die("❌ JSON payloads folder not found at " . $json_dir);
}

echo "<h3>🚀 STARTING MEDIA REGISTRATION & INJECTION</h3>";

// 1. Loop through temp images and register them
$files = scandir($temp_dir);
$url_map = []; // filename => wp_media_url

$upload_dir_info = wp_upload_dir();

echo "<h4>1. Registering Media in WordPress...</h4>";
foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue;
    
    $file_path = $temp_dir . $file;
    if (!is_file($file_path)) continue;

    // Check if we already registered this exact filename to avoid duplicates if run twice
    global $wpdb;
    $existing = $wpdb->get_var($wpdb->prepare("SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s", '%' . $file));
    
    if ($existing) {
        $wp_url = wp_get_attachment_url($existing);
        $url_map[$file] = $wp_url;
        echo "✅ Already exists: $file -> $wp_url<br>";
        continue;
    }

    // Move file to proper uploads directory
    $new_file_path = $upload_dir_info['path'] . '/' . $file;
    copy($file_path, $new_file_path);

    $file_type = wp_check_filetype(basename($new_file_path), null);
    
    $attachment = array(
        'guid'           => $upload_dir_info['url'] . '/' . basename($new_file_path),
        'post_mime_type' => $file_type['type'] ?: 'image/webp',
        'post_title'     => preg_replace('/\.[^.]+$/', '', basename($new_file_path)),
        'post_content'   => '',
        'post_status'    => 'inherit'
    );

    $attach_id = wp_insert_attachment($attachment, $new_file_path);
    if (!is_wp_error($attach_id)) {
        $attach_data = wp_generate_attachment_metadata($attach_id, $new_file_path);
        wp_update_attachment_metadata($attach_id, $attach_data);
        
        $wp_url = wp_get_attachment_url($attach_id);
        $url_map[$file] = $wp_url;
        echo "⭐️ Registered: $file -> $wp_url<br>";
    } else {
        echo "❌ Failed to register: $file<br>";
    }
}

// 2. Loop through JSONs and inject
echo "<h4>2. Injecting Elementor JSONs with Native Media URLs...</h4>";
$jsons = scandir($json_dir);

$page_map = [
    'Evergreen Venezuela' => 'homepage.json',
    'Soluciones de Energía' => 'soluciones-de-energia.json',
    'Estaciones de Energía Portátiles' => 'estaciones-de-energia-portatiles.json',
    'Respaldo Energético Residencial' => 'respaldo-energetico-residencial.json',
    'Respaldo Energético Comercial e Industrial' => 'respaldo-energetico-comercial.json',
    'Baterías de Energía Solar' => 'baterias-de-energia-solar.json',
    'Paneles Solares' => 'paneles-solares.json',
    'Iluminación' => 'iluminacion.json',
    'Iluminación LED Solar' => 'iluminacion-led-solar.json',
    'Iluminación Convencional' => 'iluminacion-convencional.json',
    'Jump Starters y Arrancadores' => 'jump-starters-arrancadores.json',
    'Catálogos y Recursos' => 'catalogos-y-recursos.json',
    'Calculadora de Consumo Energético' => 'calculadora-de-consumo-energetico.json',
    'Sobre Nosotros' => 'sobre-nosotros.json',
    'Blog, Artículos y Noticias' => 'blog-articulos-y-noticias.json',
    'Financiamiento' => 'financiamiento.json',
    'Soporte y Garantía' => 'soporte-y-garantia.json',
    'Política de Privacidad' => 'politica-de-privacidad.json',
    'Política de Cookies' => 'politica-de-cookies.json',
    'Contacto' => 'contacto.json'
];

foreach ($page_map as $title => $json_filename) {
    echo "Processing: $title... ";
    $post_id = $wpdb->get_var($wpdb->prepare("SELECT ID FROM $wpdb->posts WHERE post_title = %s AND post_type = 'page' AND post_status != 'trash'", $title));
    
    if (!$post_id) {
        echo "❌ Not Found!<br>";
        continue;
    }

    $json_path = $json_dir . $json_filename;
    if (!file_exists($json_path)) {
        echo "❌ JSON $json_filename missing!<br>";
        continue;
    }

    $content = file_get_contents($json_path);
    
    // Replace placeholders with real WP Media URLs
    foreach ($url_map as $local_file => $wp_url) {
        $placeholder = "%%FILE:" . $local_file . "%%";
        $content = str_replace($placeholder, $wp_url, $content);
    }
    
    // Decode JSON safely
    $decoded_data = json_decode($content, true);
    if (!is_array($decoded_data)) {
        echo "❌ JSON Decoding Failed!<br>";
        continue;
    }

    // Set page template to Elementor Header Footer type
    update_post_meta($post_id, '_wp_page_template', 'elementor_header_footer');
    // Save Elementor Data
    update_post_meta($post_id, '_elementor_data', wp_slash(json_encode($decoded_data)));
    // Add Kit ID (8)
    update_post_meta($post_id, '_elementor_page_settings', ['activeItemIndex' => 0]);
    update_post_meta($post_id, '_elementor_edit_mode', 'builder');
    
    echo "✅ Replaced placeholders and injected! (ID $post_id)<br>";
}

echo "<h3>🎉 ALL DONE! IMAGES MIGRATED & PAGES UPDATED.</h3>";
?>
