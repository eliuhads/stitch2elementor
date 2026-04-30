#!/usr/bin/env node
/**
 * purge_wp_cache.mjs v2 — Simplified
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

const PHP_SCRIPT = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

global $wpdb;
$r = [];

// Clear ALL Elementor CSS postmeta
$r['css_deleted'] = $wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key = '_elementor_css'");

// Clear Elementor global options
delete_option('_elementor_global_css');
delete_option('elementor_css_print_method');
$r['global_css'] = true;

// Force Elementor to regenerate
if (class_exists('Elementor\\\\Plugin')) {
    $r['elementor'] = 'found';
} else {
    $r['elementor'] = 'not_loaded';
}

// WP cache flush
wp_cache_flush();
$r['wp_cache'] = true;

// Clear transients
$r['transients'] = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_%'");

// LiteSpeed purge
do_action('litespeed_purge_all');
$r['litespeed'] = true;

// List cache plugins
$active = get_option('active_plugins');
$cache = [];
foreach ($active as $p) {
    if (stripos($p, 'cache') !== false || stripos($p, 'litespeed') !== false || stripos($p, 'breeze') !== false) {
        $cache[] = $p;
    }
}
$r['cache_plugins'] = $cache;
$r['total_plugins'] = count($active);

@unlink(__FILE__);
$r['deleted'] = !file_exists(__FILE__);

echo json_encode($r);
`;

async function main() {
  console.log('━━━ Purging Caches v2 ━━━\n');
  const client = new Client();
  const scriptName = 'evg-purge.php';
  const localPath = join(process.cwd(), 'temp', scriptName);

  try {
    writeFileSync(localPath, PHP_SCRIPT);
    await client.access({ host: FTP_HOST, user: FTP_USER_FTP, password: FTP_PASSWORD, secure: false });
    await client.cd('/');
    await client.uploadFrom(localPath, scriptName);
    console.log('✅ Script subido');

    const resp = await fetch(`${WP_URL}/${scriptName}?token=${INJECT_SECRET}`);
    const text = await resp.text();
    console.log(`Response (${resp.status}):`, text.slice(0, 1000));
    
    try {
      const r = JSON.parse(text);
      console.log('\n📋 Parsed:', JSON.stringify(r, null, 2));
    } catch(e) {
      // Script might have an error, cleanup
      try { await client.remove(scriptName); console.log('🧹 Removido'); } catch(e2) {}
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
