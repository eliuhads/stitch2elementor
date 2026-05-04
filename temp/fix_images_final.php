<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'd8e0f1a3b5c7d9e2f4a6b8c0d2e4f6a8a7f9b8c2d4e6f8a0b1c3d5e7f9a2b4c6') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$page_id = 1758;
$json_raw = get_post_meta($page_id, '_elementor_data', true);

// Handle double-encoding
if (is_string($json_raw)) {
    $data = json_decode($json_raw, true);
    if ($data === null) {
        $json_raw = stripslashes($json_raw);
        $data = json_decode($json_raw, true);
    }
}

if (!$data) {
    echo json_encode(['error' => 'Failed to parse _elementor_data']);
    @unlink(__FILE__);
    exit;
}

// Fix image widgets — remove absolute positioning settings
$image_widget_ids = ['02453e5a', '3ca2b9d3', 'd5c192f5'];
$fixes = [];

function fix_image_widgets(&$elements, $ids, &$fixes) {
    foreach ($elements as &$el) {
        $id = isset($el['id']) ? $el['id'] : '';
        
        if (isset($el['widgetType']) && $el['widgetType'] === 'image' && in_array($id, $ids)) {
            // Remove absolute positioning
            unset($el['settings']['_position']);
            unset($el['settings']['_offset_x']);
            unset($el['settings']['_offset_y']);
            unset($el['settings']['_element_width']);
            
            // Set proper display settings
            $el['settings']['image_size'] = 'full';
            $el['settings']['width'] = ['size' => 100, 'unit' => '%'];
            
            // Remove forced height — CSS will handle it
            unset($el['settings']['height']);
            unset($el['settings']['object-fit']);
            
            $fixes[] = $id;
        }
        
        if (!empty($el['elements'])) {
            fix_image_widgets($el['elements'], $ids, $fixes);
        }
    }
}

fix_image_widgets($data, $image_widget_ids, $fixes);

// Also fix parent containers — ensure they have proper settings
$card_ids = ['7dce1679', 'c2f4bf3b', 'f506a881'];

function fix_card_containers(&$elements, $ids) {
    foreach ($elements as &$el) {
        $id = isset($el['id']) ? $el['id'] : '';
        
        if (in_array($id, $ids)) {
            $el['settings']['min_height'] = ['size' => 280, 'unit' => 'px'];
            $el['settings']['flex_direction'] = 'column';
            $el['settings']['flex_justify_content'] = 'flex-end';
            $el['settings']['position'] = 'relative';
            $el['settings']['overflow'] = 'hidden';
        }
        
        if (!empty($el['elements'])) {
            fix_card_containers($el['elements'], $ids);
        }
    }
}

fix_card_containers($data, $card_ids);

// Save updated _elementor_data
$new_json = wp_json_encode($data);
update_post_meta($page_id, '_elementor_data', wp_slash($new_json));

// Rebuild post_content
function rebuild_html($elements, $depth = 0) {
    $html = '';
    foreach ($elements as $el) {
        $type = isset($el['elType']) ? $el['elType'] : '';
        $id = isset($el['id']) ? $el['id'] : '';
        $settings = isset($el['settings']) ? $el['settings'] : [];
        
        if ($type === 'container') {
            $is_inner = !empty($el['isInner']) || $depth > 0;
            $parent_class = $is_inner ? 'e-child' : 'e-parent';
            $boxed = (isset($settings['content_width']) && $settings['content_width'] === 'boxed') ? 'e-con-boxed' : 'e-con-full';
            
            $html .= '<div class="elementor-element elementor-element-' . $id . ' ' . $boxed . ' e-flex e-con ' . $parent_class . '" data-id="' . $id . '" data-element_type="container">';
            if ($boxed === 'e-con-boxed') {
                $html .= '<div class="e-con-inner">';
            }
            if (!empty($el['elements'])) {
                $html .= rebuild_html($el['elements'], $depth + 1);
            }
            if ($boxed === 'e-con-boxed') {
                $html .= '</div>';
            }
            $html .= '</div>';
        } elseif ($type === 'widget') {
            $wtype = isset($el['widgetType']) ? $el['widgetType'] : '';
            $html .= '<div class="elementor-element elementor-element-' . $id . ' elementor-widget elementor-widget-' . $wtype . '" data-id="' . $id . '" data-element_type="widget" data-widget_type="' . $wtype . '.default">';
            $html .= '<div class="elementor-widget-container">';
            
            switch ($wtype) {
                case 'heading':
                    $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<' . $tag . ' class="elementor-heading-title elementor-size-default">' . $title . '</' . $tag . '>';
                    break;
                case 'text-editor':
                    $editor = isset($settings['editor']) ? $settings['editor'] : '';
                    $html .= $editor;
                    break;
                case 'button':
                    $text = isset($settings['text']) ? $settings['text'] : '';
                    $url = isset($settings['link']['url']) ? $settings['link']['url'] : '#';
                    $html .= '<a class="elementor-button elementor-button-link elementor-size-sm" href="' . esc_attr($url) . '"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">' . esc_html($text) . '</span></span></a>';
                    break;
                case 'image':
                    $img_url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                    $img_alt = isset($settings['image']['alt']) ? $settings['image']['alt'] : '';
                    if ($img_url) {
                        $html .= '<img decoding="async" src="' . esc_attr($img_url) . '" alt="' . esc_attr($img_alt) . '" loading="lazy" />';
                    }
                    break;
                case 'divider':
                    $html .= '<div class="elementor-divider"><span class="elementor-divider-separator"></span></div>';
                    break;
                case 'icon':
                    $icon = isset($settings['selected_icon']['value']) ? $settings['selected_icon']['value'] : '';
                    $html .= '<div class="elementor-icon-wrapper"><div class="elementor-icon"><i class="' . $icon . '"></i></div></div>';
                    break;
                case 'icon-box':
                    $icon = isset($settings['selected_icon']['value']) ? $settings['selected_icon']['value'] : '';
                    $title = isset($settings['title_text']) ? $settings['title_text'] : '';
                    $desc = isset($settings['description_text']) ? $settings['description_text'] : '';
                    $tag = isset($settings['title_size']) ? $settings['title_size'] : 'h3';
                    $html .= '<div class="elementor-icon-box-wrapper"><div class="elementor-icon-box-icon"><span class="elementor-icon"><i class="' . $icon . '"></i></span></div><div class="elementor-icon-box-content"><' . $tag . ' class="elementor-icon-box-title">' . $title . '</' . $tag . '><p class="elementor-icon-box-description">' . $desc . '</p></div></div>';
                    break;
                case 'counter':
                    $end = isset($settings['ending_number']) ? $settings['ending_number'] : '0';
                    $prefix = isset($settings['prefix']) ? $settings['prefix'] : '';
                    $suffix = isset($settings['suffix']) ? $settings['suffix'] : '';
                    $title = isset($settings['title']) ? $settings['title'] : '';
                    $html .= '<div class="elementor-counter"><div class="elementor-counter-number-wrapper"><span class="elementor-counter-number-prefix">' . $prefix . '</span><span class="elementor-counter-number" data-to-value="' . $end . '">' . $end . '</span><span class="elementor-counter-number-suffix">' . $suffix . '</span></div><div class="elementor-counter-title">' . $title . '</div></div>';
                    break;
            }
            
            $html .= '</div></div>';
        }
    }
    return $html;
}

$rebuilt = '<div data-elementor-type="wp-page" data-elementor-id="' . $page_id . '" class="elementor elementor-' . $page_id . '">';
$rebuilt .= rebuild_html($data);
$rebuilt .= '</div>';

// Use $wpdb to avoid wp_kses sanitization
global $wpdb;
$wpdb->update(
    $wpdb->posts,
    ['post_content' => $rebuilt],
    ['ID' => $page_id],
    ['%s'],
    ['%d']
);

// Clear ALL caches
delete_post_meta($page_id, '_elementor_css');
delete_post_meta($page_id, '_elementor_inline_svg');
delete_post_meta($page_id, '_elementor_page_assets');
update_post_meta($page_id, '_elementor_version', '0.0.0');
clean_post_cache($page_id);
delete_option('_elementor_global_css');
if (function_exists('wp_cache_flush')) wp_cache_flush();
if (class_exists('LiteSpeed_Cache_API')) {
    LiteSpeed_Cache_API::purge_all();
}

@unlink(__FILE__);

echo json_encode([
    'status' => 'success',
    'image_widgets_fixed' => $fixes,
    'html_length' => strlen($rebuilt),
    'images_in_html' => substr_count($rebuilt, '<img'),
    'cache' => 'flushed'
]);
