const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', err => reject(err));
    });
}

async function main() {
    const client = new ftp.Client();
    try {
        console.log('[FTP] Connecting to ' + process.env.FTP_HOST + '...');
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        // Upload the PHP script
        console.log('[FTP] Uploading inject_hf_meta.php...');
        await client.uploadFrom(path.join(__dirname, 'inject_hf_meta.php'), '/inject_hf_meta.php');
        console.log('[FTP] ✅ Uploaded');

        // Also upload the JSON payloads directory needs to exist on server
        // Check if v9_json_payloads exists remotely
        console.log('\n[FTP] Uploading header_template.json...');
        try {
            await client.ensureDir('/v9_json_payloads');
            await client.cd('/');
        } catch (e) {
            // dir might already exist
        }
        await client.uploadFrom(
            path.join(__dirname, 'v9_json_payloads', 'header_template.json'),
            '/v9_json_payloads/header_template.json'
        );
        console.log('[FTP] Uploading footer_template.json...');
        await client.uploadFrom(
            path.join(__dirname, 'v9_json_payloads', 'footer_template.json'),
            '/v9_json_payloads/footer_template.json'
        );
        console.log('[FTP] ✅ JSON payloads uploaded');

        // Execute the script via HTTP
        const injectKey = process.env.WP_INJECT_KEY;
        if (!injectKey) { console.error('❌ ERROR: WP_INJECT_KEY environment variable not set.'); process.exit(1); }
        const wpUrl = process.env.WP_BASE_URL;
        if (!wpUrl) { console.error('❌ ERROR: WP_BASE_URL environment variable not set.'); process.exit(1); }
        console.log('\n[HTTP] Triggering injection script...');
        const result = await fetchUrl(`${wpUrl}/inject_hf_meta.php?key=${encodeURIComponent(injectKey)}`);
        console.log('HTTP Status:', result.status);
        console.log('SERVER OUTPUT:');
        console.log(result.body.replace(/<[^>]*>?/gm, '')); // Strip HTML

        // Clean up - delete the PHP script and JSON files
        console.log('\n[FTP] Cleaning up...');
        try { await client.remove('/inject_hf_meta.php'); } catch (e) { console.log('  Could not delete PHP script'); }
        try { await client.remove('/v9_json_payloads/header_template.json'); } catch (e) {}
        try { await client.remove('/v9_json_payloads/footer_template.json'); } catch (e) {}
        try { await client.removeDir('/v9_json_payloads'); } catch (e) {}
        console.log('[FTP] ✅ Cleaned up');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.close();
    }
}

main();
