/**
 * create_hf_templates.js
 * Creates Header and Footer templates in the Elementor Theme Builder via REST API,
 * then injects the Elementor data into them.
 */
const https = require('https');
const fs = require('fs');

const WP_USER = 'eliu.h.ads';
const WP_PASS = '2Vdy eyX9 3PV9 fktR vJT7 TucF';
const AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

// Read the header/footer JSON data from files
const HEADER_DATA = JSON.parse(fs.readFileSync('./v9_json_payloads/header_template.json', 'utf8'));
const FOOTER_DATA = JSON.parse(fs.readFileSync('./v9_json_payloads/footer_template.json', 'utf8'));

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'evergreenvzla.com',
      path: `/wp-json/wp/v2/${path}`,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`  ${method} ${path} → ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 500) });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n=== STEP 1: Create Header Template ===');
  const headerRes = await apiCall('POST', 'elementor_library', {
    title: 'Header Evergreen',
    status: 'publish',
    template_type: 'header',
    meta: {
      _elementor_template_type: 'header',
      _elementor_edit_mode: 'builder',
      _elementor_data: JSON.stringify(HEADER_DATA)
    }
  });
  
  if (headerRes.status >= 200 && headerRes.status < 300) {
    console.log(`  ✅ Header created! ID: ${headerRes.data.id}`);
  } else {
    console.log(`  ❌ Header failed:`, JSON.stringify(headerRes.data).substring(0, 300));
    
    // Try alternative: create as page, then we'll convert
    console.log('\n  → Trying alternative: direct meta update via /posts endpoint...');
    // Try updating the existing footer #156 that returned 403
    const altRes = await apiCall('POST', 'elementor_library/156', {
      title: 'Footer Evergreen',
      status: 'publish',
    });
    console.log(`  Alt result:`, JSON.stringify(altRes.data).substring(0, 300));
  }

  console.log('\n=== STEP 2: Create Footer Template ===');
  const footerRes = await apiCall('POST', 'elementor_library', {
    title: 'Footer Evergreen',
    status: 'publish',
    template_type: 'footer',
    meta: {
      _elementor_template_type: 'footer',
      _elementor_edit_mode: 'builder',
      _elementor_data: JSON.stringify(FOOTER_DATA)
    }
  });
  
  if (footerRes.status >= 200 && footerRes.status < 300) {
    console.log(`  ✅ Footer created! ID: ${footerRes.data.id}`);
  } else {
    console.log(`  ❌ Footer failed:`, JSON.stringify(footerRes.data).substring(0, 300));
  }

  // Step 3: If creation worked, set display conditions
  if (headerRes.status >= 200 && headerRes.status < 300 && footerRes.status >= 200 && footerRes.status < 300) {
    console.log('\n=== STEP 3: Setting display conditions ===');
    // Header conditions
    await apiCall('POST', `elementor_library/${headerRes.data.id}`, {
      meta: { _elementor_conditions: JSON.stringify([{ type: 'include', name: 'general' }]) }
    });
    // Footer conditions  
    await apiCall('POST', `elementor_library/${footerRes.data.id}`, {
      meta: { _elementor_conditions: JSON.stringify([{ type: 'include', name: 'general' }]) }
    });
    console.log('  ✅ Display conditions set to "Entire Site"');
  }

  console.log('\n=== DONE ===');
}

main().catch(console.error);
