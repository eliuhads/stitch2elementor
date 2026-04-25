<?php
/**
 * Evergreen V9 Master Full Injector (V3)
 * No manifest dependency. Hardcoded array. Force Delete Trash.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "<pre style='background:#111; color:#0f0; padding:20px; font-weight:bold;'>";
echo "<h1>🚀 INICIANDO INYECCIÓN MAESTRA V3</h1>\n";

$wp_load = __DIR__ . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("❌ FATAL: wp-load.php not found.\n");
}
require_once($wp_load);
echo "✅ WordPress System Loaded.\n\n";

$pages = [
    ['slug' => 'homepage', 'title' => 'Evergreen Venezuela Homepage', 'file' => 'homepage.json'],
    ['slug' => 'estaciones-de-energia-portatiles', 'title' => 'Portable Power Stations Category', 'file' => 'estaciones-de-energia-portatiles.json'],
    ['slug' => 'soluciones-de-energia', 'title' => 'Soluciones de Energía Overview', 'file' => 'soluciones-de-energia.json'],
    ['slug' => 'respaldo-energetico-residencial', 'title' => 'Residential Energy Backup Landing Page', 'file' => 'respaldo-energetico-residencial.json'],
    ['slug' => 'iluminacion-led', 'title' => 'Iluminación Led', 'file' => null],
    ['slug' => 'iluminacion-led-industrial', 'title' => 'Iluminación LED Industrial Catalog', 'file' => 'iluminacion-led-industrial.json', 'parent_slug' => 'iluminacion-led'],
    ['slug' => 'iluminacion-led-residencial', 'title' => 'Iluminación LED Residencial Catalog', 'file' => 'iluminacion-led-residencial.json', 'parent_slug' => 'iluminacion-led'],
    ['slug' => 'iluminacion-led-comercial', 'title' => 'Iluminación LED Comercial Catalog', 'file' => 'iluminacion-led-comercial.json', 'parent_slug' => 'iluminacion-led'],
    ['slug' => 'arrancadores-portatiles', 'title' => 'Arrancadores Portátiles Product Page', 'file' => 'arrancadores-portatiles.json'],
    ['slug' => 'paneles-solares', 'title' => 'Paneles Solares Catalog', 'file' => 'paneles-solares.json'],
    ['slug' => 'accesorios-y-complementos', 'title' => 'Accesorios y Complementos Catalog', 'file' => 'accesorios-y-complementos.json'],
    ['slug' => 'sobre-nosotros', 'title' => 'Sobre Nosotros - Evergreen Venezuela', 'file' => 'sobre-nosotros.json'],
    ['slug' => 'contacto', 'title' => 'Contacto - Evergreen Venezuela', 'file' => 'contacto.json'],
    ['slug' => 'blog', 'title' => 'Noticias y Novedades - Blog', 'file' => 'blog.json'],
    ['slug' => 'distribuidores', 'title' => 'Red de Distribuidores - Evergreen Venezuela', 'file' => 'distribuidores.json'],
    ['slug' => 'proyectos', 'title' => 'Casos de Éxito y Proyectos', 'file' => 'proyectos.json'],
    ['slug' => 'garantia', 'title' => 'Página de Garantía - Evergreen Venezuela', 'file' => 'garantia.json'],
    ['slug' => 'preguntas-frecuentes', 'title' => 'Preguntas Frecuentes - Evergreen Venezuela', 'file' => 'preguntas-frecuentes.json'],
    ['slug' => 'calculadora-solar', 'title' => 'Calculadora Solar - Evergreen Venezuela', 'file' => 'calculadora-solar.json'],
    ['slug' => 'politica-de-privacidad', 'title' => 'Política de Privacidad - Evergreen Venezuela', 'file' => 'politica-de-privacidad.json'],
    ['slug' => 'terminos-y-condiciones', 'title' => 'terminos-y-condiciones', 'file' => 'terminos-y-condiciones.json']
];

global $wpdb;

echo "🗑️ LIMPIANDO LA PAPELERA ANTES DE EMPEZAR...\n";
$trashed = $wpdb->get_col("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status = 'trash'");
if (!empty($trashed)) {
    foreach($trashed as $tid) {
        wp_delete_post($tid, true);
        echo "   - Borrada página basura ID $tid\n";
    }
}
echo "✅ Papelera vacía.\n\n";

foreach ($pages as $p) {
    $slug = $p['slug'];
    $title = $p['title'];
    $file = $p['file'];
    
    echo "========================================\n";
    echo "⚡ PROCESANDO: $title ($slug)\n";
    
    $data = null;
    if ($file) {
        $json_path = __DIR__ . '/v9_json_payloads/' . $file;
        if (!file_exists($json_path)) {
            echo "❌ ERROR FATAL: No se encontró el JSON -> $file\n";
            continue;
        }
        
        $json_content = file_get_contents($json_path);
        $data = json_decode($json_content, true);
        if (!$data) {
            echo "❌ ERROR FATAL: JSON corrupto o mal formado -> $file\n";
            continue;
        }
    }
    
    $existing_ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page'", $slug));
    if (!empty($existing_ids)) {
        foreach($existing_ids as $eid) {
            echo "   ⚠️ Eliminando página repetida existente (ID $eid)...\n";
            wp_delete_post($eid, true);
        }
    }
    
    $parent_id = 0;
    if (!empty($p['parent_slug'])) {
        $parent_id = (int) $wpdb->get_var($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'page' LIMIT 1", $p['parent_slug']));
        if ($parent_id) echo "   🔗 Vinculando a padre (ID: $parent_id)\n";
    }

    echo "   🆕 Creando nueva página...\n";
    $page_id = wp_insert_post([
        'post_title' => $title,
        'post_name' => $slug,
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_parent' => $parent_id
    ]);
    
    if (is_wp_error($page_id)) {
        echo "   ❌ ERROR al crear página: " . $page_id->get_error_message() . "\n";
        continue;
    }
    echo "   ✅ Página Mágica Creada con ID: $page_id\n";
    
    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
    update_post_meta($page_id, '_elementor_template_type', 'wp-page');
    update_post_meta($page_id, '_wp_page_template', 'elementor_header_footer'); 
    
    if ($data) {
        $elementor_data = wp_slash(wp_json_encode($data));
        $updated = update_metadata('post', $page_id, '_elementor_data', $elementor_data);
        
        if ($updated !== false) {
            echo "   ✅ ¡DISEÑO INYECTADO CON ÉXITO!\n";
            if (class_exists('Elementor\Plugin') && isset(\Elementor\Plugin::$instance->posts_manager)) {
                 \Elementor\Plugin::$instance->posts_manager->clear_cache($page_id);
            }
        } else {
            echo "   ⚠️ Advertencia: No se inyectó Metadata (update_metadata retornó false).\n";
        }
    } else {
        echo "   ✅ Página estructural (padre) creada sin inyección de Elementor.\n";
    }
}

echo "\n========================================\n";
echo "🎨 INYECTANDO SISTEMA DE DISEÑO GLOBAL (Kit 8)\n";
$kit_id = 8;
$system_colors = [
    [ '_id' => 'primary', 'title' => 'Evergreen Green', 'color' => '#368A39' ],
    [ '_id' => 'secondary', 'title' => 'Energy Flash', 'color' => '#8FDA3E' ],
    [ '_id' => 'text', 'title' => 'Main Text (White)', 'color' => '#FFFFFF' ],
    [ '_id' => 'accent', 'title' => 'Tech Blue', 'color' => '#28B5E1' ],
    [ '_id' => 'bg_dark', 'title' => 'Deep Dark Background', 'color' => '#0B0F1A' ],
    [ '_id' => 'solar_amber', 'title' => 'Solar Amber', 'color' => '#F5A623' ],
    [ '_id' => 'surface_card', 'title' => 'Surface Card', 'color' => '#161C2C' ]
];

$system_typography = [
    [ '_id' => 'primary', 'title' => 'H1 - Hero Principal', 'typography_font_family' => 'Barlow Condensed', 'typography_font_weight' => '800', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(2.25rem, 1.6667rem + 2.9167vw, 4rem)' ], 'typography_letter_spacing' => [ 'unit' => 'em', 'size' => '-0.02' ] ],
    [ '_id' => 'secondary', 'title' => 'H2 - Sección Principal', 'typography_font_family' => 'Barlow Condensed', 'typography_font_weight' => '700', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1.5rem, 0.9997rem + 2.5008vw, 3rem)' ], 'typography_letter_spacing' => [ 'unit' => 'em', 'size' => '-0.02' ] ],
    [ '_id' => 'text', 'title' => 'Body - Texto General', 'typography_font_family' => 'Barlow', 'typography_font_weight' => '400', 'typography_font_size' => [ 'unit' => 'px', 'size' => '18' ] ],
    [ '_id' => 'h3_sub', 'title' => 'H3 - Subsección', 'typography_font_family' => 'Barlow Condensed', 'typography_font_weight' => '700', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1.125rem, 0.9997rem + 0.6263vw, 1.5rem)' ] ],
    [ '_id' => 'h4_card', 'title' => 'H4 - Título de Card', 'typography_font_family' => 'Barlow Condensed', 'typography_font_weight' => '700', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)' ] ],
    [ '_id' => 'h5_small', 'title' => 'H5 - Texto Pequeño Bold', 'typography_font_family' => 'Barlow Condensed', 'typography_font_weight' => '600', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(0.875rem, 0.8333rem + 0.2083vw, 1rem)' ] ],
    [ '_id' => 'body_small', 'title' => 'Body Small / Legal', 'typography_font_family' => 'Barlow', 'typography_font_weight' => '300', 'typography_font_size' => [ 'unit' => 'px', 'size' => '14' ] ],
    [ '_id' => 'tech_mono', 'title' => 'Technical (Mono)', 'typography_font_family' => 'JetBrains Mono', 'typography_font_weight' => '400', 'typography_font_size' => [ 'unit' => 'custom', 'size' => 'clamp(0.75rem, 0.7083rem + 0.2083vw, 0.875rem)' ] ]
];
$kit_settings = get_post_meta($kit_id, '_elementor_page_settings', true) ?: [];
$kit_settings['system_colors'] = $system_colors;
$kit_settings['system_typography'] = $system_typography;
$kit_settings['container_width'] = [ 'unit' => 'px', 'size' => '1280' ];
update_post_meta($kit_id, '_elementor_page_settings', $kit_settings);
echo "✅ Tema Industrial Luminance purgado e inyectado con éxito.\n";

$home_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_name = 'homepage' AND post_type = 'page' LIMIT 1");
$blog_id = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_name = 'blog' AND post_type = 'page' LIMIT 1");

if ($home_id) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_id);
    echo "🏠 Homepage configurada correctamente al ID: $home_id\n";
}
if ($blog_id) {
    update_option('page_for_posts', $blog_id);
    echo "📝 Blog configurado correctamente al ID: $blog_id\n";
}

if (did_action('elementor/loaded') || class_exists('\\Elementor\\Plugin')) {
    echo "🧹 Limpiando Caché global de CSS de Elementor...\n";
    try {
        if (isset(\Elementor\Plugin::$instance->files_manager)) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }
    } catch (Exception $e) {}
}

echo "<h1>🚀 ¡MIGRACIÓN COMPLETADA AL 100%! 🚀</h1>\n";
echo "Vuelve a la pestaña de Páginas y recarga. Deberías ver las 20 páginas listas y publicadas.\n";
echo "(He desactivado la autodestrucción automática para que puedas recargar la página libremente)\n";
echo "</pre>";
