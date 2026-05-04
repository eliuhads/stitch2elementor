<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

$page_id = 1758;
$results = [];

$images = [
    [
        'file' => '/wp-content/uploads/2026/04/led-panel-evergreen.png',
        'title' => 'Paneles LED - Evergreen',
        'alt' => 'Panel LED cuadrado de techo, luz blanca neutra, montaje empotrado',
        'widget_id' => '02453e5a'
    ],
    [
        'file' => '/wp-content/uploads/2026/04/led-strips-evergreen.png',
        'title' => 'Tiras LED - Evergreen',
        'alt' => 'Tiras LED flexibles con brillo cyan y verde en estante industrial',
        'widget_id' => '3ca2b9d3'
    ],
    [
        'file' => '/wp-content/uploads/2026/04/led-tubes-evergreen.png',
        'title' => 'Tubos LED - Evergreen',
        'alt' => 'Tubos LED profesionales en techo de almacén comercial',
        'widget_id' => 'd5c192f5'
    ]
];

// Register each image as attachment
$attachment_map = [];
foreach ($images as $img) {
    $file_path = ABSPATH . ltrim($img['file'], '/');
    if (!file_exists($file_path)) {
        $results[] = ['error' => 'File not found: ' . $file_path];
        continue;
    }
    
    $filetype = wp_check_filetype(basename($file_path));
    $attachment = [
        'post_mime_type' => $filetype['type'],
        'post_title'     => $img['title'],
        'post_content'   => '',
        'post_status'    => 'inherit'
    ];
    
    $attach_id = wp_insert_attachment($attachment, $file_path);
    $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
    wp_update_attachment_metadata($attach_id, $attach_data);
    update_post_meta($attach_id, '_wp_attachment_image_alt', $img['alt']);
    
    $attachment_map[$img['widget_id']] = [
        'id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id),
        'alt' => $img['alt']
    ];
    
    $results[] = [
        'widget_id' => $img['widget_id'],
        'attach_id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id)
    ];
}

// Update Elementor JSON with new image URLs
$json_raw = get_post_meta($page_id, '_elementor_data', true);
$data = json_decode($json_raw, true);

function update_images(&$elements, $map) {
    foreach ($elements as &$el) {
        if (isset($el['widgetType']) && $el['widgetType'] === 'image' && isset($map[$el['id']])) {
            $info = $map[$el['id']];
            $el['settings']['image'] = [
                'url' => $info['url'],
                'id' => $info['id'],
                'alt' => $info['alt'],
                'source' => 'library',
                'size' => 'full'
            ];
        }
        if (!empty($el['elements'])) {
            update_images($el['elements'], $map);
        }
    }
}

update_images($data, $attachment_map);

$new_json = wp_json_encode($data);
update_post_meta($page_id, '_elementor_data', wp_slash($new_json));

// Clear caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
clean_post_cache($page_id);
if (function_exists('wp_cache_flush')) wp_cache_flush();

@unlink(__FILE__);

echo json_encode([
    'status' => 'images_registered',
    'attachments' => $results,
    'elementor_updated' => true,
    'cache' => 'flushed'
]);
