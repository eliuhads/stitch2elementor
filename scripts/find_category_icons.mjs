/**
 * find_category_icons.mjs — Find the icon widgets inside category cards section
 */
import { readFileSync, writeFileSync } from 'fs';
import { Client } from 'basic-ftp';

const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx === -1) return;
  const key = line.substring(0, idx).trim();
  let val = line.substring(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  env[key] = val;
});

const php = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${env.INJECT_SECRET}') { http_response_code(403); die('forbidden'); }
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');
global $wpdb;

$raw = $wpdb->get_var("SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id=1758 AND meta_key='_elementor_data'");
$data = json_decode($raw, true);

// Find the categories section (7ebc3f4b) and dump its deep structure
function find_element($elements, $id) {
    foreach ($elements as $el) {
        if (($el['id'] ?? '') === $id) return $el;
        if (!empty($el['elements'])) {
            $found = find_element($el['elements'], $id);
            if ($found) return $found;
        }
    }
    return null;
}

function summarize($el, $depth = 0) {
    $prefix = str_repeat('  ', $depth);
    $id = $el['id'] ?? '?';
    $type = $el['elType'] ?? '?';
    $wtype = $el['widgetType'] ?? '';
    $settings = $el['settings'] ?? [];
    
    $info = "{$prefix}[{$id}] {$type}";
    if ($wtype) $info .= " ({$wtype})";
    
    // Add relevant settings
    if ($wtype === 'icon') {
        $icon = $settings['selected_icon'] ?? $settings['icon'] ?? 'none';
        $info .= " icon=" . json_encode($icon);
    }
    if ($wtype === 'heading') {
        $info .= " title=" . json_encode($settings['title'] ?? '');
    }
    if ($wtype === 'text-editor') {
        $info .= " text=" . json_encode(substr($settings['editor'] ?? '', 0, 40));
    }
    if ($wtype === 'image') {
        $url = $settings['image']['url'] ?? '';
        $info .= " img=" . basename($url);
    }
    
    $result = [$info];
    if (!empty($el['elements'])) {
        foreach ($el['elements'] as $child) {
            $result = array_merge($result, summarize($child, $depth + 1));
        }
    }
    return $result;
}

$catSection = find_element($data, '7ebc3f4b');
$lines = $catSection ? summarize($catSection) : ['NOT FOUND'];

echo json_encode(['structure' => $lines], JSON_PRETTY_PRINT);
@unlink(__FILE__);
`;

writeFileSync('temp/find_cat_icons.php', php);
const client = new Client();
await client.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD || env.FTP_PASS, secure: false });
await client.uploadFrom('temp/find_cat_icons.php', '/find_cat_icons.php');
client.close();

const resp = await fetch(`${env.WP_URL || env.SITE_URL}/find_cat_icons.php?token=${env.INJECT_SECRET}`);
const result = await resp.json();
console.log('=== CATEGORY SECTION STRUCTURE ===');
result.structure.forEach(l => console.log(l));
