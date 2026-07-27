/**
 * scripts/find_elementor_class_keys.mjs
 * Uploads a PHP helper to inspect existing pages and find what key Elementor uses for CSS classes.
 */

import { Client } from 'basic-ftp';
import { readFileSync, writeFileSync } from 'fs';

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

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASS = env.FTP_PASSWORD || env.FTP_PASS;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;

const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    die('forbidden');
}
require_once(__DIR__ . '/wp-load.php');

// Let's query multiple pages to inspect their elementor data settings
$query = new WP_Query([
    'post_type' => ['page', 'post', 'elementor_library'],
    'posts_per_page' => 50
]);

echo "=== FIND ELEMENTOR CLASS KEYS ===\\n";

function search_keys($elements) {
    if (!is_array($elements)) return;
    foreach ($elements as $el) {
        if (isset($el['settings']) && is_array($el['settings'])) {
            foreach ($el['settings'] as $key => $val) {
                // If the key contains "class" or "css", or the value is something like "evergreen"
                if (strpos($key, 'class') !== false || strpos($key, 'css') !== false) {
                    echo "Found Key: [" . $key . "] = [" . (is_array($val) ? json_encode($val) : $val) . "] in Element ID: " . $el['id'] . "\\n";
                }
            }
        }
        if (isset($el['elements']) && is_array($el['elements'])) {
            search_keys($el['elements']);
        }
    }
}

foreach ($query->posts as $post) {
    $meta = get_post_meta($post->ID, '_elementor_data', true);
    if ($meta) {
        $data = json_decode($meta, true);
        if ($data) {
            echo "Checking Post: " . $post->ID . " (" . $post->post_title . ")\\n";
            search_keys($data);
        }
    }
}

@unlink(__FILE__);
?>`;

writeFileSync('temp/find_keys.php', phpScript);

async function run() {
  const client = new Client();
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
    await client.uploadFrom('temp/find_keys.php', '/find_keys.php');
    client.close();
    
    const resp = await fetch(`${WP_URL}/find_keys.php?token=${INJECT_SECRET}`);
    console.log(await resp.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
