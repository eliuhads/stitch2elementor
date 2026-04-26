/**
 * inject_hf_data.js
 * Injects Elementor data into existing Header/Footer templates via REST API.
 * Uses POST to update the templates with _elementor_data embedded in the request.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const WP_HOST = new URL(process.env.WP_BASE_URL || '').hostname;
if (!WP_HOST) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

function apiCall(method, endpoint, body) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : '';
        const opts = {
            hostname: WP_HOST,
            path: '/wp-json/wp/v2/' + endpoint,
            method,
            headers: {
                'Authorization': 'Basic ' + AUTH,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function main() {
    const headerData = fs.readFileSync(path.join(__dirname, 'v9_json_payloads', 'header_template.json'), 'utf8');
    const footerData = fs.readFileSync(path.join(__dirname, 'v9_json_payloads', 'footer_template.json'), 'utf8');

    console.log('Header JSON:', headerData.length, 'bytes');
    console.log('Footer JSON:', footerData.length, 'bytes');

    // Step 1: Try updating with meta fields
    console.log('\n=== HEADER #1149 ===');
    
    // First try: register meta fields first via Elementor's own endpoint
    console.log('Trying Elementor save endpoint...');
    const headerSave = await apiCall('POST', 'elementor_library/1149', {
        title: 'Header Evergreen',
        status: 'publish',
        content: headerData, // Put elementor JSON in content field as fallback
    });
    console.log('  Update status:', headerSave.status);
    if (headerSave.status >= 200 && headerSave.status < 300) {
        console.log('  ✅ Header content updated');
    } else {
        console.log('  Response:', JSON.stringify(headerSave.data).substring(0, 200));
    }

    console.log('\n=== FOOTER #1150 ===');
    const footerSave = await apiCall('POST', 'elementor_library/1150', {
        title: 'Footer Evergreen',
        status: 'publish',
        content: footerData,
    });
    console.log('  Update status:', footerSave.status);
    if (footerSave.status >= 200 && footerSave.status < 300) {
        console.log('  ✅ Footer content updated');
    } else {
        console.log('  Response:', JSON.stringify(footerSave.data).substring(0, 200));
    }

    // Step 2: Try to set template_type and conditions via separate calls
    console.log('\n=== Setting template types ===');
    
    // Try Elementor's own API endpoint for saving
    const elHeaderSave = await apiCall('POST', 'elementor_library/1149', {
        template_type: 'header',
    });
    console.log('Header template_type:', elHeaderSave.status);

    const elFooterSave = await apiCall('POST', 'elementor_library/1150', {
        template_type: 'footer',
    });
    console.log('Footer template_type:', elFooterSave.status);

    // Step 3: Try Elementor Pro's own /elementor/v1/documents endpoint
    console.log('\n=== Trying Elementor document API ===');
    const docHeader = await apiCall('POST', '../elementor/v1/documents/1149', {
        elements: headerData,
        settings: { template_type: 'header' }
    });
    console.log('Elementor doc API header:', docHeader.status, JSON.stringify(docHeader.data).substring(0, 200));

    console.log('\n=== Checking available REST routes ===');
    const routes = await apiCall('GET', '', null);
    if (routes.data && routes.data.namespaces) {
        const elRoutes = routes.data.namespaces.filter(n => n.includes('elementor'));
        console.log('Elementor namespaces:', elRoutes);
    }
    
    // Check routes that might help
    const routeList = await apiCall('GET', '../elementor/v1', null);
    if (routeList.data && routeList.data.routes) {
        const routeKeys = Object.keys(routeList.data.routes);
        console.log('Elementor v1 routes:', routeKeys);
    } else {
        console.log('Elementor v1:', routeList.status, JSON.stringify(routeList.data).substring(0, 200));
    }

    console.log('\n=== DONE ===');
}

main().catch(console.error);
