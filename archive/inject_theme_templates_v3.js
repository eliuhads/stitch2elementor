/**
 * inject_theme_templates_v3.js
 * Reads JSON data from external files and pushes to WordPress
 * elementor_library posts (Theme Builder templates)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

function wpRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${WP_URL}/wp-json/wp/v2/${apiPath}`);
    const postData = JSON.stringify(body);
    const options = {
      hostname: fullUrl.hostname,
      port: 443,
      path: fullUrl.pathname,
      method: method,
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
        console.log(`  ${method} ${apiPath}: HTTP ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
        } else {
          console.log(`  Response: ${data.substring(0, 500)}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n=== Theme Builder Injector v3 ===\n');

  // Read JSON data files
  const headerFile = path.join(__dirname, 'header_data.json');
  const footerFile = path.join(__dirname, 'footer_data.json');

  const headerData = JSON.parse(fs.readFileSync(headerFile, 'utf8'));
  const footerData = JSON.parse(fs.readFileSync(footerFile, 'utf8'));

  console.log(`Header JSON: ${JSON.stringify(headerData).length} chars`);
  console.log(`Footer JSON: ${JSON.stringify(footerData).length} chars`);

  // Try all WP REST API approaches for elementor_library
  const methods = ['POST', 'PUT', 'PATCH'];

  for (const method of methods) {
    console.log(`\n--- Trying ${method} ---`);

    try {
      console.log('Header #151...');
      await wpRequest(method, 'elementor_library/151', {
        meta: {
          _elementor_data: JSON.stringify(headerData),
          _elementor_edit_mode: 'builder',
          _elementor_template_type: 'header'
        }
      });
      console.log('✅ Header SUCCESS!');

      console.log('Footer #156...');
      await wpRequest(method, 'elementor_library/156', {
        meta: {
          _elementor_data: JSON.stringify(footerData),
          _elementor_edit_mode: 'builder',
          _elementor_template_type: 'footer'
        }
      });
      console.log('✅ Footer SUCCESS!');

      console.log('\n=== Both templates updated! ===');
      return;
    } catch(e) {
      console.log(`❌ ${method} failed: ${e.message}`);
    }
  }

  // If REST API fails with elementor_library, try as regular posts
  console.log('\n--- Trying as posts/pages endpoint ---');
  for (const endpoint of ['posts', 'pages']) {
    for (const id of [151, 156]) {
      try {
        const data = id === 151 ? headerData : footerData;
        const label = id === 151 ? 'Header' : 'Footer';
        console.log(`${label} #${id} via ${endpoint}...`);
        await wpRequest('POST', `${endpoint}/${id}`, {
          meta: {
            _elementor_data: JSON.stringify(data),
            _elementor_edit_mode: 'builder'
          }
        });
        console.log(`✅ ${label} updated via ${endpoint}!`);
      } catch(e) {
        console.log(`  Skipped (${e.message})`);
      }
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
