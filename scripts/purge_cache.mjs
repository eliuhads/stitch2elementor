/**
 * purge_cache.mjs — Purge LiteSpeed + Elementor cache via FTP+PHP
 */
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const { FTP_HOST, FTP_USER, FTP_PASS, SITE_URL, INJECT_SECRET } = process.env;

// Build PHP as array of lines to avoid template literal issues
const phpLines = [
  '<' + '?php',
  "define('ABSPATH', dirname(__FILE__) . '/');",
  `if (($_GET['t'] ?? '') !== '${INJECT_SECRET}') die('no');`,
  "require_once ABSPATH . 'wp-load.php';",
  "header('Content-Type: text/plain');",
  "$out = '';",
  "if (class_exists('LiteSpeed_Cache_API')) { LiteSpeed_Cache_API::purge_all(); $out .= 'LS:purged '; }",
  "if (class_exists('Elementor\\\\Plugin')) { Elementor\\\\Plugin::instance()->files_manager->clear_cache(); $out .= 'EL:cleared '; }",
  "$out .= 'mu:' . (file_exists(WP_CONTENT_DIR.'/mu-plugins/evergreen-custom-styles.php')?'yes':'no') . ' ';",
  "$out .= 'css:' . (file_exists(WP_CONTENT_DIR.'/uploads/evergreen-css/evergreen-global.css')?'yes':'no');",
  "echo $out;",
  "@unlink(__FILE__);",
  '?' + '>'
];

const phpContent = phpLines.join("\n");
const tmpPath = path.join(ROOT, 'temp', '_purge.php');
fs.writeFileSync(tmpPath, phpContent);
console.log('📝 PHP written:', tmpPath);

// FTP upload
const client = new ftp.Client();
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false });
  await client.uploadFrom(tmpPath, '/public_html/_purge.php');
  console.log('✅ Uploaded _purge.php');
} finally {
  client.close();
}

// Execute
const url = `${SITE_URL}/_purge.php?t=${INJECT_SECRET}`;
console.log('🚀 Executing purge...');
try {
  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await resp.text();
  console.log('📊 Result:', text);
} catch (err) {
  console.error('⚠️ Error:', err.message);
}
