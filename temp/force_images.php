<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$page_id = 1758;
$results = [];

// Image map
$image_map = json_decode('{"02453e5a":{"url":"https://evergreenvzla.com/wp-content/uploads/2026/04/led-panel-evergreen.png","id":1767,"alt":"Panel LED cuadrado de techo, luz blanca neutra, montaje empotrado"},"3ca2b9d3":{"url":"https://evergreenvzla.com/wp-content/uploads/2026/04/led-strips-evergreen.png","id":1768,"alt":"Tiras LED flexibles con brillo cyan y verde en estante industrial"},"d5c192f5":{"url":"https://evergreenvzla.com/wp-content/uploads/2026/04/led-tubes-evergreen.png","id":1769,"alt":"Tubos LED profesionales en techo de almacén comercial"}}', true);

// 1. Fix _elementor_data - replace old URLs AND fix positioning
$json_raw = get_post_meta($page_id, '_elementor_data', true);

// Check if json_raw is double-encoded
if (is_string($json_raw)) {
    $data = json_decode($json_raw, true);
    if ($data === null) {
        // Try unwrapping
        $json_raw = stripslashes($json_raw);
        $data = json_decode($json_raw, true);
    }
}

if (!$data) {
    echo json_encode(['error' => 'Failed to parse _elementor_data', 'raw_len' => strlen($json_raw), 'first_100' => substr($json_raw, 0, 100)]);
    @unlink(__FILE__);
    exit;
}

function fix_images_and_position(&$elements, $map) {
    $fixes = [];
    foreach ($elements as &$el) {
        $id = isset($el['id']) ? $el['id'] : '';
        
        // Fix image widgets
        if (isset($el['widgetType']) && $el['widgetType'] === 'image' && isset($map[$id])) {
            $info = $map[$id];
            $el['settings']['image'] = [
                'url' => $info['url'],
                'id' => (int)$info['id'],
                'alt' => $info['alt'],
                'source' => 'library',
                'size' => 'full'
            ];
            // Remove absolute positioning - let it flow naturally
            unset($el['settings']['_position']);
            unset($el['settings']['_element_width']);
            // Set proper width
            $el['settings']['image_size'] = 'full';
            $el['settings']['width'] = ['size' => 100, 'unit' => '%'];
            $el['settings']['height'] = ['size' => 200, 'unit' => 'px'];
            $el['settings']['object-fit'] = 'cover';
            
            $fixes[] = $id;
        }
        
        if (!empty($el['elements'])) {
            $child_fixes = fix_images_and_position($el['elements'], $map);
            $fixes = array_merge($fixes, $child_fixes);
        }
    }
    return $fixes;
}

$fixed_ids = fix_images_and_position($data, $image_map);

// Save updated _elementor_data
$new_json = wp_json_encode($data);
update_post_meta($page_id, '_elementor_data', wp_slash($new_json));

// 2. Also fix post_content - replace old google URLs with new local URLs
$post = get_post($page_id);
$content = $post->post_content;
$old_urls = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD9L9CUxssG-1FBfZ8oWlsloh8nkVXUNjhRHKbGlWiYw7aRmOnAyWc6aiJLrjq-qqPykzYwTi5Sx-l1GB5mUl9j1HulGc-T4mw-_LkCxhsThtSm-AYc3XM68VZ6uRP1Sx7boogIkHgm2vlGqLJQvKzu9GC6aiEyvHX4fnQmUuKCZg2Q9bUx7SUmGb4RM0uC3-CbkxJARSJcN6YAM9Eo3I4itrmU3WNxcVwsXS8CvZXHMCYN1cx7ZwlGrPxQwwnNXmQ1Ork5wkfhieQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB4eCtK4IrYV1I42lR0Jq0mhUzGnPAJwKG07epC9CfjrSEhYrrclm0-C1t3S2aRde76KdLedzSOwIyxU_mLHrwh6mNndbqnUz6asEnxdytf2bWTAjZxbaHBtwxf85naHlsMDJVyXYR7Ue9H2Kqs9uNViCpr7AYyRpDavTh0myVkVK6e0qoomnElsjTOBDnZ-NMTSn0WWaBAsphCcUB1v10pZTBYRH9CSpz0o_JFRf9C3r5sxH3DF1aWf-p27WNNsnJIbo6ZLFlcnvo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAJa2g9onvARgdoxZYfPnMkcdwOf1HXdFPBbivdReVBLs-zX6kTz4Zn1YeJy-w5WyT46BE6FH1fkvedemliONeOAAlkf-wA2j-u02lHpBib6QUlPiuZe-yJF8tCSRzMK8IORGxpYBwxvAZFIvSerWsjZNkIYG-uYDqhtm3J5N4zte_5L2TLZRnhFGK-cGqhYo5GJ9nKC1pL2-kZihQ0DAg7fBJKZvjjBj4cbgg6xbjafIX-yceD9XDxhx8StK02MpV5IBsfngR5g9M'
];
$new_urls = [
    'https://evergreenvzla.com/wp-content/uploads/2026/04/led-panel-evergreen.png',
    'https://evergreenvzla.com/wp-content/uploads/2026/04/led-strips-evergreen.png',
    'https://evergreenvzla.com/wp-content/uploads/2026/04/led-tubes-evergreen.png'
];

$replacements = 0;
for ($i = 0; $i < count($old_urls); $i++) {
    $before = $content;
    $content = str_replace($old_urls[$i], $new_urls[$i], $content);
    if ($content !== $before) $replacements++;
}

// Also remove absolute positioning classes from post_content
$content = str_replace('elementor-absolute', '', $content);

// Use wpdb directly to avoid wp_kses sanitization
global $wpdb;
$wpdb->update(
    $wpdb->posts,
    ['post_content' => $content],
    ['ID' => $page_id],
    ['%s'],
    ['%d']
);
clean_post_cache($page_id);

// 3. Clear all caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);

echo json_encode([
    'status' => 'success',
    'elementor_data_fixed' => $fixed_ids,
    'post_content_url_replacements' => $replacements,
    'cache' => 'flushed'
]);
