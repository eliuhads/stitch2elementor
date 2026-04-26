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

// Keyword map: filename fragments → descriptive ALT text (Spanish, SEO-optimized)
$keyword_map = [
    'solar'       => 'Panel solar fotovoltaico Evergreen Venezuela',
    'panel'       => 'Panel solar de alta eficiencia para hogares y empresas',
    'bateria'     => 'Batería de litio para almacenamiento de energía solar',
    'battery'     => 'Batería de litio para almacenamiento de energía solar',
    'inversor'    => 'Inversor de corriente para sistemas solares',
    'inverter'    => 'Inversor de corriente para sistemas solares',
    'planta'      => 'Planta eléctrica de respaldo energético industrial',
    'generator'   => 'Generador eléctrico portátil Evergreen',
    'led'         => 'Luminaria LED de bajo consumo energético',
    'luminaria'   => 'Sistema de iluminación LED profesional',
    'lamp'        => 'Lámpara LED de alta eficiencia lumínica',
    'light'       => 'Sistema de iluminación LED Evergreen',
    'jump'        => 'Jump Starter arrancador portátil de vehículos',
    'arrancador'  => 'Arrancador de baterías portátil multifunción',
    'starter'     => 'Jump Starter portátil con carga USB',
    'portatil'    => 'Estación de energía portátil para exteriores',
    'portable'    => 'Estación de energía portátil multifunción',
    'station'     => 'Estación de energía portátil Evergreen',
    'estacion'    => 'Estación de energía portátil recargable',
    'residencial' => 'Sistema de respaldo energético residencial',
    'comercial'   => 'Solución energética comercial e industrial',
    'industrial'  => 'Equipo de energía industrial de alta capacidad',
    'ups'         => 'UPS sistema de alimentación ininterrumpida',
    'respaldo'    => 'Sistema de respaldo energético con baterías',
    'cable'       => 'Cable de conexión para sistemas de energía',
    'conector'    => 'Conector eléctrico para instalaciones solares',
    'logo'        => 'Logo Evergreen Venezuela soluciones energéticas',
    'evergreen'   => 'Evergreen Venezuela proveedor de soluciones energéticas',
    'hero'        => 'Soluciones energéticas integrales Evergreen Venezuela',
    'banner'      => 'Productos de energía renovable y portátil en Venezuela',
    'icon'        => 'Icono de servicio energético Evergreen',
    'team'        => 'Equipo profesional de Evergreen Venezuela',
    'office'      => 'Oficinas de Evergreen Venezuela',
    'install'     => 'Instalación profesional de sistemas solares',
    'catalogo'    => 'Catálogo de productos energéticos Evergreen',
    'catalog'     => 'Catálogo de soluciones de energía Evergreen',
    'financ'      => 'Opciones de financiamiento para energía solar',
    'garantia'    => 'Garantía y soporte técnico Evergreen',
    'warranty'    => 'Programa de garantía Evergreen Venezuela',
    'soporte'     => 'Servicio de soporte técnico especializado',
];

// Get ALL attachments (images)
$attachments = $wpdb->get_results(
    "SELECT ID, post_title, post_parent, guid 
     FROM {$wpdb->posts} 
     WHERE post_type = 'attachment' 
     AND post_mime_type LIKE 'image/%'"
);

$results = ['updated' => 0, 'skipped' => 0, 'details' => []];

foreach ($attachments as $att) {
    $current_alt = get_post_meta($att->ID, '_wp_attachment_image_alt', true);
    
    // Skip if already has a meaningful alt (more than 10 chars)
    if (!empty($current_alt) && strlen($current_alt) > 10) {
        $results['skipped']++;
        continue;
    }
    
    // Extract filename without extension
    $filename = pathinfo(basename($att->guid), PATHINFO_FILENAME);
    $filename_lower = strtolower($filename);
    
    // Try to match against keyword map
    $alt_text = '';
    foreach ($keyword_map as $fragment => $description) {
        if (strpos($filename_lower, $fragment) !== false) {
            $alt_text = $description;
            break;
        }
    }
    
    // Fallback: use parent page title if available
    if (empty($alt_text) && $att->post_parent > 0) {
        $parent = get_post($att->post_parent);
        if ($parent) {
            $alt_text = 'Imagen de ' . $parent->post_title . ' - Evergreen Venezuela';
        }
    }
    
    // Final fallback: clean filename
    if (empty($alt_text)) {
        $clean = str_replace(['-', '_', '.'], ' ', $filename);
        $clean = ucfirst(trim(preg_replace('/\s+/', ' ', $clean)));
        $alt_text = $clean . ' - Evergreen Venezuela';
    }
    
    update_post_meta($att->ID, '_wp_attachment_image_alt', wp_slash($alt_text));
    
    $results['updated']++;
    $results['details'][] = [
        'id' => $att->ID,
        'file' => basename($att->guid),
        'alt' => $alt_text
    ];
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
