/**
 * wp-api.js
 * Centralized WordPress REST API Client for stitch2elementor pipeline
 * v4.6.6
 *
 * Env vars (matching .env convention):
 *   WORDPRESS_BASE_URL  or  WP_BASE_URL
 *   WORDPRESS_USERNAME  or  WP_APP_USER  or  WP_USER
 *   WORDPRESS_APPLICATION_PASSWORD  or  WP_APP_PASSWORD
 */
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WP_URL = (
    process.env.WORDPRESS_BASE_URL ||
    process.env.WP_BASE_URL ||
    process.env.WP_URL ||
    ''
).replace(/\/+$/, '');

const WP_USER = (
    process.env.WORDPRESS_USERNAME ||
    process.env.WP_APP_USER ||
    process.env.WP_USER ||
    ''
);

const WP_APP_PASSWORD = (
    process.env.WORDPRESS_APPLICATION_PASSWORD ||
    process.env.WP_APP_PASSWORD ||
    ''
);

if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
    console.error('ERROR: Required env vars missing.');
    console.error('  Need one of: WORDPRESS_BASE_URL / WP_BASE_URL / WP_URL');
    console.error('  Need one of: WORDPRESS_USERNAME / WP_APP_USER / WP_USER');
    console.error('  Need one of: WORDPRESS_APPLICATION_PASSWORD / WP_APP_PASSWORD');
    process.exit(1);
}

const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

function wpRequest(method, apiPath, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${WP_URL}/wp-json/wp/v2${apiPath}`);
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
