/**
 * inject_category_pages.mjs
 * Creates 4 new category pages in WordPress via FTP+PHP pipeline.
 * Pages: LED (general), LED Autónomas, LED Hogar, LED Comercial e Industrial
 * 
 * Following the GOLDEN PATH pattern from stitch2elementor skill.
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'basic-ftp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Parse .env manually (no dotenv dependency) ---
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i === -1) return;
  let v = t.substring(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
  env[t.substring(0, i).trim()] = v;
});

// --- Pages to create ---
const pages = [
  {
    title: 'Iluminación LED',
    slug: 'iluminacion-led',
    htmlFile: 'led_general.html',
    parentId: 0
  },
  {
    title: 'LED Autónomas',
    slug: 'led-autonomas',
    htmlFile: 'led_autonomas.html',
    parentId: 0 // Will be set to LED parent after creation
  },
  {
    title: 'LED Hogar',
    slug: 'led-hogar',
    htmlFile: 'led_hogar.html',
    parentId: 0
  },
  {
    title: 'LED Comercial e Industrial',
    slug: 'led-comercial-industrial',
    htmlFile: 'led_comercial.html',
    parentId: 0
  }
];

// --- Read HTML files and encode to base64 ---
const htmlPayloads = {};
for (const p of pages) {
  const htmlPath = path.join(ROOT, 'temp', p.htmlFile);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing HTML: ${htmlPath}`);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  htmlPayloads[p.slug] = Buffer.from(html, 'utf8').toString('base64');
  console.log(`  ${p.slug}: ${html.length} bytes → base64 ready`);
}

// --- Read CSS global ---
const cssPath = path.join(ROOT, 'temp', 'evergreen-global.css');
let cssContent = '';
if (fs.existsSync(cssPath)) {
  cssContent = fs.readFileSync(cssPath, 'utf8')
    .split('\n')
    .filter(l => !l.trim().startsWith('@import'))
    .join('\n');
  console.log(`  CSS global: ${cssContent.length} chars`);
}
const cssBase64 = Buffer.from(cssContent, 'utf8').toString('base64');

// --- Generate PHP ---
const uniqueName = `evg_cat_${Date.now()}.php`;

// Build page creation PHP
let pageCreationPHP = '';
for (const p of pages) {
  pageCreationPHP += `
  // --- ${p.title} ---
  $html_b64 = '${htmlPayloads[p.slug]}';
  $html_content = base64_decode($html_b64);
  
  // Extract body content for Elementor
  $body_content = $html_content;
  if (preg_match('/<body[^>]*>(.*)<\\/body>/s', $html_content, $m)) {
    $body_content = $m[1];
  }
  
  // Build Elementor container with HTML widget
  $el_id = substr(md5('${p.slug}' . time()), 0, 7);
  $elementor_data = json_encode([
    [
      'id' => $el_id,
      'elType' => 'container',
      'settings' => [
        'content_width' => 'full',
        'padding' => ['unit' => 'px', 'top' => '0', 'right' => '0', 'bottom' => '0', 'left' => '0'],
        'background_background' => 'classic',
        'background_color' => '#0E1320',
      ],
      'elements' => [
        [
          'id' => substr(md5('${p.slug}_inner' . time()), 0, 7),
          'elType' => 'widget',
          'widgetType' => 'html',
          'settings' => [
            'html' => $body_content,
          ],
          'elements' => [],
        ]
      ],
      'isInner' => false,
    ]
  ]);
  
  $pid = wp_insert_post([
    'post_title' => '${p.title}',
    'post_name' => '${p.slug}',
    'post_status' => 'publish',
    'post_type' => 'page',
    'post_content' => $body_content,
    'post_parent' => 0,
  ], true);
  
  if (is_wp_error($pid)) {
    $results['${p.slug}'] = ['error' => $pid->get_error_message()];
  } else {
    // Set Elementor meta
    update_post_meta($pid, '_elementor_data', wp_slash($elementor_data));
    update_post_meta($pid, '_elementor_edit_mode', 'builder');
    update_post_meta($pid, '_elementor_template_type', 'wp-page');
    update_post_meta($pid, '_elementor_version', '3.21.0');
    update_post_meta($pid, '_wp_page_template', 'elementor_header_footer');
    
    // Inject CSS
    $css_decoded = base64_decode($css_b64);
    $settings = get_post_meta($pid, '_elementor_page_settings', true);
    if (!is_array($settings)) $settings = [];
    $settings['custom_css'] = $css_decoded;
    update_post_meta($pid, '_elementor_page_settings', $settings);
    
    // Purge caches
    delete_post_meta($pid, '_elementor_css');
    clean_post_cache($pid);
    
    $results['${p.slug}'] = [
      'wp_id' => $pid,
      'title' => '${p.title}',
      'url' => get_permalink($pid),
      'status' => 'created'
    ];
  }
`;
}

const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${env.INJECT_SECRET}') {
    http_response_code(403); die('no');
}
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 120);
header('Content-Type: application/json; charset=utf-8');
define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

$results = [];
$css_b64 = '${cssBase64}';

${pageCreationPHP}

// Set parent-child relationships (LED general = parent of the 3 subcategories)
if (isset($results['iluminacion-led']['wp_id'])) {
    $parent_id = $results['iluminacion-led']['wp_id'];
    $children = ['led-autonomas', 'led-hogar', 'led-comercial-industrial'];
    foreach ($children as $child_slug) {
        if (isset($results[$child_slug]['wp_id'])) {
            wp_update_post([
                'ID' => $results[$child_slug]['wp_id'],
                'post_parent' => $parent_id,
            ]);
            $results[$child_slug]['parent_id'] = $parent_id;
        }
    }
}

// Global cache flush
delete_option('_elementor_global_css');
wp_cache_flush();
if (function_exists('litespeed_purge_all')) litespeed_purge_all();

$results['cache'] = 'flushed';

@unlink(__FILE__);
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;

// --- Write PHP to temp file ---
const tempPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(tempPath, phpScript, 'utf8');
console.log(`\\nPHP generated: ${uniqueName} (${phpScript.length} bytes)`);

// --- FTP Upload ---
console.log('\\nUploading via FTP...');
const client = new Client();
try {
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD || env.FTP_PASS,
    secure: false,
  });
  await client.uploadFrom(tempPath, uniqueName);
  console.log(`  Uploaded: ${uniqueName}`);
  client.close();
} catch (e) {
  console.error('FTP error:', e.message);
  client.close();
  process.exit(1);
}

// --- Execute via HTTP ---
console.log('\\nExecuting PHP...');
const url = `${env.WP_URL}/${uniqueName}?token=${env.INJECT_SECRET}`;
try {
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(120000),
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`HTTP ${resp.status}:`, text.substring(0, 500));
    process.exit(1);
  }
  
  const result = await resp.json();
  console.log('\\n=== RESULTS ===');
  console.log(JSON.stringify(result, null, 2));
  
  // Output summary
  console.log('\\n=== SUMMARY ===');
  for (const [slug, data] of Object.entries(result)) {
    if (slug === 'cache') continue;
    if (data.wp_id) {
      console.log(`  ✅ ${data.title}: WP ID ${data.wp_id} → ${data.url}`);
    } else if (data.error) {
      console.log(`  ❌ ${slug}: ${data.error}`);
    }
  }
  
} catch (e) {
  console.error('Execution error:', e.message);
  process.exit(1);
}

// --- Cleanup temp PHP ---
try { fs.unlinkSync(tempPath); } catch(e) {}

console.log('\\nDone! Next: run purge_elementor_css.mjs to regenerate CSS cache.');
