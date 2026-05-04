/**
 * fix_cta_gradient.mjs — Inject gradient directly into Elementor JSON for CTA container
 * This bypasses all CSS specificity issues by setting the background in Elementor's own data
 */
import { readFileSync } from 'fs';
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

const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;
const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASS = env.FTP_PASSWORD || env.FTP_PASS;

// PHP that patches the Elementor JSON to add gradient to CTA container 69a22305
const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

$post_id = 1758;
$target_id = '69a22305';
$data = get_post_meta($post_id, '_elementor_data', true);

if (is_string($data)) {
    $elements = json_decode($data, true);
} else {
    $elements = $data;
}

if (!$elements) {
    echo json_encode(['error' => 'no elementor data']);
    @unlink(__FILE__);
    exit;
}

function patch_gradient(&$elements, $target_id) {
    foreach ($elements as &$el) {
        if (isset($el['id']) && $el['id'] === $target_id) {
            // Set gradient background in Elementor settings
            $el['settings']['background_background'] = 'gradient';
            $el['settings']['background_color'] = '#1D8A43';
            $el['settings']['background_color_b'] = '#28B5E1';
            $el['settings']['background_gradient_type'] = 'linear';
            $el['settings']['background_gradient_angle'] = ['unit' => 'deg', 'size' => 135];
            $el['settings']['background_gradient_position'] = 'center center';
            return true;
        }
        if (isset($el['elements']) && is_array($el['elements'])) {
            if (patch_gradient($el['elements'], $target_id)) return true;
        }
    }
    return false;
}

$found = patch_gradient($elements, $target_id);
if (!$found) {
    echo json_encode(['error' => 'element not found', 'id' => $target_id]);
    @unlink(__FILE__);
    exit;
}

$json = wp_slash(wp_json_encode($elements));
update_post_meta($post_id, '_elementor_data', $json);

// Clear Elementor CSS cache
delete_post_meta($post_id, '_elementor_css');
update_post_meta($post_id, '_elementor_version', '0.0.0');
clean_post_cache($post_id);
if (function_exists('wp_cache_flush')) wp_cache_flush();
do_action('litespeed_purge_all');

@unlink(__FILE__);
echo json_encode(['status' => 'gradient_patched', 'target' => $target_id]);
`;

import { writeFileSync } from 'fs';
writeFileSync('temp/fix_cta_gradient.php', phpScript);

const client = new Client();
await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
await client.uploadFrom('temp/fix_cta_gradient.php', '/fix_cta_gradient.php');
client.close();
console.log('✅ PHP uploaded');

const resp = await fetch(`${WP_URL}/fix_cta_gradient.php?token=${INJECT_SECRET}`);
const text = await resp.text();
console.log(`📦 Response (${resp.status}): ${text}`);

// Wait for Elementor to regenerate CSS
await new Promise(r => setTimeout(r, 5000));
console.log('✅ Done — gradient injected into Elementor JSON');
