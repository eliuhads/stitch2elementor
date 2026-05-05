#!/usr/bin/env node
/**
 * fix_blog_direct_db.mjs v3
 * Uploads PHP to FTP ROOT (where wp-load.php lives)
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const WP_URL = process.env.WP_URL;
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET || process.env.WP_SCRIPT_TOKEN;

const fixedData = readFileSync('temp/blog_1664_fixed_elementor_data.json', 'utf8');
const b64Data = Buffer.from(fixedData).toString('base64');

const PHP_SCRIPT = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

$post_id = 1664;
$new_data = base64_decode('${b64Data}');

$result = update_post_meta($post_id, '_elementor_data', wp_slash($new_data));
delete_post_meta($post_id, '_elementor_css');

@unlink(__FILE__);

echo json_encode([
    'success' => true,
    'post_id' => $post_id,
    'meta_updated' => $result !== false,
    'data_length' => strlen($new_data),
    'script_deleted' => !file_exists(__FILE__)
]);
exit;
`;

async function main() {
  console.log('━━━ Fix Blog Page 1664 via Direct DB v3 ━━━\n');

  const client = new Client();
  const scriptName = 'evg-temp-fix.php';
  const localPath = join(process.cwd(), 'temp', scriptName);

  try {
    writeFileSync(localPath, PHP_SCRIPT);
    console.log('📝 PHP script creado');

    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    
    // Upload to FTP ROOT (/) where wp-load.php lives
    await client.cd('/');
    const list = await client.list();
    console.log(`📁 wp-load.php en raíz: ${!!list.find(f => f.name === 'wp-load.php')}`);
    
    await client.uploadFrom(localPath, scriptName);
    console.log('✅ Script subido a raíz FTP');

    // Execute
    const url = `${WP_URL}/${scriptName}?token=${INJECT_SECRET}`;
    console.log('🔧 Ejecutando...');
    
    const resp = await fetch(url);
    const text = await resp.text();
    
    try {
      const result = JSON.parse(text);
      console.log('📋 Resultado:', JSON.stringify(result, null, 2));
      if (result.success) {
        console.log('\n✅ ¡Página 1664 (Blog) actualizada exitosamente!');
      }
    } catch(e) {
      console.log(`⚠️ Response (${resp.status}): ${text.slice(0, 300)}`);
      try { await client.remove(scriptName); console.log('🧹 Script removido'); } catch(e2) {}
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    try { await client.cd('/'); await client.remove(scriptName); } catch(e) {}
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
