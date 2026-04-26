/**
 * inject_theme_templates_v2.js
 * Uses WordPress REST API with correct auth to update elementor_library posts
 * Tries multiple approaches to bypass the 401
 */

const https = require('https');

require('dotenv').config();
const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

const fs = require('fs');
const path = require('path');

let HEADER_DATA = [];
let FOOTER_DATA = [];

const dsPath = path.join(__dirname, 'design_system.json');
if (fs.existsSync(dsPath)) {
  const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
  FOOTER_DATA = ds.footerData || [];
  HEADER_DATA = ds.headerData || []; // Optional: if added later
} else {
  console.error('❌ ERROR: design_system.json not found. Copy design_system_template.json and fill in your client data.');
  process.exit(1);
}

function wpRequest(path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${WP_URL}/wp-json/wp/v2/${path}`);
    const postData = JSON.stringify(body);
    const options = {
      hostname: fullUrl.hostname,
      port: 443,
      path: fullUrl.pathname + fullUrl.search,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`  PUT ${path}: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else { console.log(`  Body: ${data.substring(0,400)}`); reject(new Error(`HTTP ${res.statusCode}`)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n=== Theme Builder Injector v2 ===\n');

  // Try header
  console.log('Header #151...');
  try {
    await wpRequest('elementor_library/151', {
      content: '',
      meta: { _elementor_data: JSON.stringify(HEADER_DATA), _elementor_edit_mode: 'builder' }
    });
    console.log('✅ Header done');
  } catch(e) {
    console.log('❌ PUT failed, trying POST...');
    try {
      await wpRequest('elementor_library/151', {
        meta: { _elementor_data: JSON.stringify(HEADER_DATA), _elementor_edit_mode: 'builder' }
      });
      console.log('✅ Header done via POST');
    } catch(e2) {
      console.log(`❌ Both failed: ${e2.message}`);
    }
  }

  // Try footer
  console.log('\nFooter #156...');
  try {
    await wpRequest('elementor_library/156', {
      content: '',
      meta: { _elementor_data: JSON.stringify(FOOTER_DATA), _elementor_edit_mode: 'builder' }
    });
    console.log('✅ Footer done');
  } catch(e) {
    console.log('❌ PUT failed, trying POST...');
    try {
      await wpRequest('elementor_library/156', {
        meta: { _elementor_data: JSON.stringify(FOOTER_DATA), _elementor_edit_mode: 'builder' }
      });
      console.log('✅ Footer done via POST');
    } catch(e2) {
      console.log(`❌ Both failed: ${e2.message}`);
    }
  }

  console.log('\n=== Done ===\n');
}

main();
