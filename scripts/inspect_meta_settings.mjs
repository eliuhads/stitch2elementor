/**
 * scripts/inspect_meta_settings.mjs
 * Uploads a PHP helper to inspect the actual _elementor_data settings stored in the database for post 22.
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
$meta = get_post_meta(22, '_elementor_data', true);
if (is_string($meta)) {
    $data = json_decode($meta, true);
} else {
    $data = $meta;
}

echo "=== DB ELEMENTOR DATA COWL ===\\n";
if (!$data) {
    echo "No data found or decode failed\\n";
} else {
    foreach ($data as $idx => $el) {
        echo "Root Element " . $idx . " [ID: " . $el['id'] . "] [Type: " . $el['elType'] . "]\\n";
        echo "  Settings:\\n";
        print_r($el['settings']);
        echo "\\n";
    }
}
@unlink(__FILE__);
?>`;

writeFileSync('temp/inspect_meta.php', phpScript);

async function run() {
  const client = new Client();
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
    await client.uploadFrom('temp/inspect_meta.php', '/inspect_meta.php');
    client.close();
    
    const resp = await fetch(`${WP_URL}/inspect_meta.php?token=${INJECT_SECRET}`);
    console.log(await resp.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
