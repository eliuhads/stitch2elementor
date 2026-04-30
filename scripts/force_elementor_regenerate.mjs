#!/usr/bin/env node
/**
 * force_elementor_regenerate.mjs
 * Forces Elementor to regenerate HTML by touching the post_content
 * and clearing all rendering caches.
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const WP_URL = process.env.WP_URL;
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER_FTP = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET || process.env.WP_SCRIPT_TOKEN;

const PAGE_IDS = [1651, 1660, 1665, 1666, 1668, 1594];

const PHP_SCRIPT = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

// Make sure Elementor is loaded
if (!did_action('elementor/loaded')) {
    // Try to load Elementor
    $elementor_file = WP_PLUGIN_DIR . '/elementor/elementor.php';
    if (file_exists($elementor_file)) {
        include_once($elementor_file);
    }
}

$pages = [${PAGE_IDS.join(',')}];
$r = [];

foreach ($pages as $pid) {
    // Get the _elementor_data
    $elementor_data = get_post_meta($pid, '_elementor_data', true);
    
    if (empty($elementor_data)) {
        $r[$pid] = ['error' => 'no elementor data'];
        continue;
    }
    
    // Parse the JSON to rebuild post_content
    $elements = json_decode($elementor_data, true);
    
    if (!is_array($elements)) {
        $r[$pid] = ['error' => 'invalid json'];
        continue;
    }
    
    // Build flat text content from elements
    $content = build_content_from_elements($elements);
    
    // Update the post content (this is what the front-end actually displays)
    $update = wp_update_post([
        'ID' => $pid,
        'post_content' => $content
    ], true);
    
    // Delete ALL Elementor caches for this post
    delete_post_meta($pid, '_elementor_css');
    delete_post_meta($pid, '_elementor_inline_svg');
    delete_post_meta($pid, '_elementor_page_assets');
    
    // Reset version to force complete rebuild
    update_post_meta($pid, '_elementor_version', '0.0.0');
    
    // Clear post cache
    clean_post_cache($pid);
    
    $r[$pid] = [
        'title' => get_the_title($pid),
        'content_updated' => !is_wp_error($update),
        'content_length' => strlen($content),
        'has_solar_in_content' => (stripos($content, 'solar') !== false) ? 'YES' : 'NO'
    ];
}

// Global cache flush
wp_cache_flush();
delete_option('_elementor_global_css');

// Try harder LiteSpeed flush
if (defined('LSCWP_V')) {
    do_action('litespeed_purge_all');
    $r['litespeed'] = 'purged';
}

@unlink(__FILE__);
$r['deleted'] = !file_exists(__FILE__);

echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;

function build_content_from_elements($elements) {
    $html = '';
    foreach ($elements as $el) {
        $settings = isset($el['settings']) ? $el['settings'] : [];
        $type = isset($el['widgetType']) ? $el['widgetType'] : (isset($el['elType']) ? $el['elType'] : '');
        
        switch ($type) {
            case 'heading':
                $tag = isset($settings['header_size']) ? $settings['header_size'] : 'h2';
                $title = isset($settings['title']) ? $settings['title'] : '';
                if ($title) $html .= "<{$tag}>{$title}</{$tag}>\\n";
                break;
            case 'text-editor':
                $editor = isset($settings['editor']) ? $settings['editor'] : '';
                if ($editor) $html .= $editor . "\\n";
                break;
            case 'image':
                $url = isset($settings['image']['url']) ? $settings['image']['url'] : '';
                $alt = isset($settings['alt']) ? $settings['alt'] : '';
                if ($url) $html .= '<img src="' . $url . '" alt="' . $alt . '" />\\n';
                break;
            case 'button':
                $text = isset($settings['text']) ? $settings['text'] : '';
                if ($text) $html .= "<a>{$text}</a>\\n";
                break;
        }
        
        if (isset($el['elements']) && is_array($el['elements'])) {
            $html .= build_content_from_elements($el['elements']);
        }
    }
    return $html;
}
`;

async function main() {
  console.log('━━━ Force Elementor HTML Regeneration ━━━\n');
  const client = new Client();
  const scriptName = 'evg-regenerate.php';
  const localPath = join(process.cwd(), 'temp', scriptName);

  try {
    writeFileSync(localPath, PHP_SCRIPT);
    await client.access({ host: FTP_HOST, user: FTP_USER_FTP, password: FTP_PASSWORD, secure: false });
    await client.cd('/');
    await client.uploadFrom(localPath, scriptName);
    console.log('✅ Script subido');

    const resp = await fetch(`${WP_URL}/${scriptName}?token=${INJECT_SECRET}`);
    const text = await resp.text();
    
    try {
      const result = JSON.parse(text);
      console.log('📋 Resultado:', JSON.stringify(result, null, 2));
    } catch(e) {
      console.log(`Response: ${text.slice(0, 500)}`);
      try { await client.remove(scriptName); } catch(e2) {}
    }
  } catch(err) {
    console.error(err.message);
    try { await client.cd('/'); await client.remove(scriptName); } catch(e) {}
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(console.error);
