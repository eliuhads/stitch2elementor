/**
 * inject_via_wp_ajax.js 
 * Injects Elementor data into Theme Builder templates via WordPress admin-ajax.php
 * This bypasses the REST API limitation with elementor_library post type
 * by using the wp-json/elementor/v1/document endpoint (Elementor Pro REST API)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { uploadFileToFTP } = require('./ftp_utils'); // Injecting FTP deployer

require('dotenv').config();
const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const WP_HOST = new URL(WP_URL).hostname;
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

function request(method, fullPath, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const postData = contentType === 'application/json' ? JSON.stringify(body) : body;
    const options = {
      hostname: WP_HOST,
      port: 443,
      path: fullPath,
      method: method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`  ${method} ${fullPath.substring(0,60)}... : HTTP ${res.statusCode}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function ensureBridgeInstalled() {
  console.log('--- Ensuring PHP Injection Bridge is uploaded via FTP ---');
  const bridgePath = path.join(__dirname, 'evergreen_robust_inject.php');
  if (fs.existsSync(bridgePath)) {
    await uploadFileToFTP(bridgePath);
  } else {
    console.warn(`[FTP Warn] El archivo ${bridgePath} no fue encontrado localmente.`);
  }
}

async function main() {
  await ensureBridgeInstalled(); // Automatically install the bridge upon starting
  console.log('\n=== Elementor Theme Builder Injector (Multi-Strategy) ===\n');

  const headerData = JSON.parse(fs.readFileSync(path.join(__dirname, 'header_data.json'), 'utf8'));
  const footerData = JSON.parse(fs.readFileSync(path.join(__dirname, 'footer_data.json'), 'utf8'));

  // ════════════════════════════════════════════════
  // Strategy 1: Elementor's own REST API endpoint
  // ════════════════════════════════════════════════
  console.log('--- Strategy 1: Elementor REST API /elementor/v1/document ---');
  for (const [id, data, label] of [[151, headerData, 'Header'], [156, footerData, 'Footer']]) {
    const res = await request('POST', `/wp-json/elementor/v1/document/${id}`, {
      elements: data,
      settings: {}
    });
    console.log(`  ${label} #${id}: ${res.status} — ${res.body.substring(0,200)}`);
    if (res.status >= 200 && res.status < 300) {
      console.log(`  ✅ ${label} updated via Elementor API!`);
    }
  }

  // ════════════════════════════════════════════════
  // Strategy 2: WP REST API with explicit custom post type support
  // Using the internal endpoint that accepts meta updates
  // ════════════════════════════════════════════════
  console.log('\n--- Strategy 2: WordPress REST API with meta ---');
  for (const [id, data, label] of [[151, headerData, 'Header'], [156, footerData, 'Footer']]) {
    // Try updating directly via generic posts endpoint (not pages)
    const res = await request('POST', `/wp-json/wp/v2/posts/${id}`, {
      meta: {
        _elementor_data: JSON.stringify(data),
        _elementor_edit_mode: 'builder'
      }
    });
    console.log(`  ${label} via /posts/${id}: ${res.status} — ${res.body.substring(0,200)}`);
  }

  // ════════════════════════════════════════════════
  // Strategy 3: Use the nonce-less admin-post.php approach
  // Save elementor data via the save-builder endpoint  
  // ════════════════════════════════════════════════
  console.log('\n--- Strategy 3: Elementor save endpoint ---');
  for (const [id, data, label] of [[151, headerData, 'Header'], [156, footerData, 'Footer']]) {
    const saveData = JSON.stringify({
      elements: data,
      settings: {
        template_type: label.toLowerCase()
      }
    });
    const res = await request('POST', `/wp-json/elementor/v1/documents/${id}/save`, {
      elements: JSON.stringify(data),
      settings: JSON.stringify({ template_type: label.toLowerCase() })
    });
    console.log(`  ${label} via /documents/${id}/save: ${res.status} — ${res.body.substring(0,200)}`);
  }

  console.log('\n=== Done ===\n');
}

main().catch(console.error);
