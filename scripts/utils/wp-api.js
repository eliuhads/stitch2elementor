/**
 * wp-api.js
 * Centralized WordPress REST API Client for Stitch2Elementor pipeline
 */
const https = require('https');

const WP_URL = (process.env.WP_URL || '').replace(/\/+$/, '');
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
  console.error('ERROR: Required env vars missing: WP_URL, WP_USER, WP_APP_PASSWORD');
  process.exit(1);
}

const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

function wpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${WP_URL}/wp-json/wp/v2${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (url.port) {
      options.port = url.port;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = {
  wpRequest,
  WP_URL,
  AUTH,
  https
};
