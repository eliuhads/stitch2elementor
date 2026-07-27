#!/usr/bin/env node
/**
 * final_fix_and_rebuild.mjs
 * 1. Fixes remaining solar alt text in page 1660
 * 2. Forces Elementor to rebuild HTML for all affected pages
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

const PAGE_IDS = [1651, 1660, 1664, 1665, 1666, 1668, 1594];

const PHP_SCRIPT = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

$r = [];

// 1. Fix page 1660 remaining alt text
$data = get_post_meta(1660, '_elementor_data', true);
$fixes = [
    'Massive industrial solar farm stretching to horizon' => 'Massive industrial LED lighting installation stretching to horizon',
    'industrial solar farm' => 'industrial LED lighting facility',
    'solar farm' => 'LED facility',
];

$changes = 0;
foreach ($fixes as $from => $to) {
    if (strpos($data, $from) !== false) {
        $data = str_replace($from, $to, $data);
        $changes++;
    }
}

if ($changes > 0) {
    update_post_meta(1660, '_elementor_data', wp_slash($data));
    $r['page_1660_fixes'] = $changes;
}

// 2. Force rebuild of Elementor HTML for all pages
$pages = [${PAGE_IDS.join(',')}];
foreach ($pages as $pid) {
    // Delete cached CSS
    delete_post_meta($pid, '_elementor_css');
    
    // Delete the cached rendered content
    delete_post_meta($pid, '_elementor_inline_svg');
    
    // Trigger Elementor to mark page as needing rebuild
    update_post_meta($pid, '_elementor_version', '0.0.0');
    
    // Clear the post cache
    clean_post_cache($pid);
    
    $r['rebuilt'][] = $pid;
}

// 3. Flush Elementor global CSS
delete_option('_elementor_global_css');
delete_option('elementor_css_print_method');

// 4. Clear ALL object cache
wp_cache_flush();

// 5. Clear ALL page cache - this handles server-level caching
if (function_exists('wp_cache_flush_runtime')) {
    wp_cache_flush_runtime();
}

// 6. Try to clear LiteSpeed cache (hosting level)
do_action('litespeed_purge_all');

$r['cache_flushed'] = true;

// 7. Verify page 1660 is clean
$data_check = get_post_meta(1660, '_elementor_data', true);
$lower = strtolower($data_check);
$r['page_1660_solar_count'] = substr_count($lower, 'solar');
$r['page_1660_clean'] = (substr_count($lower, 'solar') === 0);

@unlink(__FILE__);
$r['script_deleted'] = !file_exists(__FILE__);

echo json_encode($r, JSON_PRETTY_PRINT);
exit;
`;

async function main() {
  console.log('━━━ Final Fix + Elementor Rebuild ━━━\n');
  const client = new Client();
  const scriptName = 'evg-final-fix.php';
  const localPath = join(process.cwd(), 'temp', scriptName);

  try {
    writeFileSync(localPath, PHP_SCRIPT);
    await client.access({ host: FTP_HOST, user: FTP_USER_FTP, password: FTP_PASSWORD, secure: false });
    await client.cd('/');
    await client.uploadFrom(localPath, scriptName);
    console.log('✅ Script subido');

    const resp = await fetch(`${WP_URL}/${scriptName}?token=${INJECT_SECRET}`);
    const result = await resp.json();
    console.log('📋 Resultado:', JSON.stringify(result, null, 2));
  } catch(err) {
    console.error(err.message);
    try { await client.cd('/'); await client.remove(scriptName); } catch(e) {}
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(console.error);
