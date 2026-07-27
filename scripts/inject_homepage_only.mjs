import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET;
const WP_URL = process.env.WP_URL || process.env.SITE_URL;

console.log('━━━ Update Homepage (ID 22) Layout ━━━\n');

// Read JSON
const homepageJson = fs.readFileSync(path.join(ROOT, 'elementor_jsons/homepage.json'), 'utf8');
const homepageB64 = Buffer.from(homepageJson).toString('base64');
console.log(`📦 Homepage JSON: ${homepageJson.length} bytes -> ${homepageB64.length} b64\n`);

// PHP Injection
const phpScript = `<?php
header('Content-Type: application/json; charset=utf-8');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

$homepage_data = base64_decode('${homepageB64}');
$pid = 22; // Homepage ID

$r = [];
if (get_post($pid)) {
    update_post_meta($pid, '_elementor_data', wp_slash($homepage_data));
    update_post_meta($pid, '_elementor_version', '3.25.0');
    update_post_meta($pid, '_elementor_edit_mode', 'builder');
    update_post_meta($pid, '_wp_page_template', 'elementor_header_footer');
    delete_post_meta($pid, '_elementor_css');
    clean_post_cache($pid);
    
    // Clear elementor options cache
    delete_option('_elementor_global_css');
    
    // Flush object cache
    if (function_exists('wp_cache_flush')) wp_cache_flush();
    
    // LiteSpeed cache purge
    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_all();
        $r['litespeed'] = 'purged';
    }
    
    $r['status'] = 'success';
    $r['message'] = 'Homepage layout successfully updated';
    $r['page_id'] = $pid;
} else {
    $r['status'] = 'error';
    $r['message'] = 'Page ID 22 not found';
}

@unlink(__FILE__);
echo json_encode($r, JSON_PRETTY_PRINT);
?>`;

const tempDir = path.join(ROOT, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const phpFile = `evg_update_home_${Date.now()}.php`;
const phpPath = path.join(tempDir, phpFile);
fs.writeFileSync(phpPath, phpScript, 'utf8');

async function run() {
  const client = new Client();
  try {
    console.log(`Connecting to FTP: ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });
    console.log('✅ FTP connected');
    
    await client.uploadFrom(phpPath, phpFile);
    console.log(`✅ Uploaded PHP script: ${phpFile}`);
    
    const execUrl = `${WP_URL}/${phpFile}?token=${INJECT_SECRET}`;
    console.log(`Executing injection: ${execUrl}`);
    const response = await fetch(execUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('\nResults:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.close();
    try { fs.unlinkSync(phpPath); } catch(e) {}
  }
}

run();
