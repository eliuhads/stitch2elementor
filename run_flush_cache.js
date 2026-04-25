const ftp = require('basic-ftp');
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
        console.log('[FTP] Connecting...');
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false
        });

        console.log('[FTP] Uploading flush_all_cache.php...');
        await client.uploadFrom(path.join(__dirname, 'flush_all_cache.php'), '/flush_all_cache.php');

        console.log('[HTTP] Executing...');
        const result = await fetchUrl('https://evergreenvzla.com/flush_all_cache.php?key=ev3rgr33n_2026_flush');
        console.log('Status:', result.status);
        console.log(result.body.replace(/<[^>]*>?/gm, ''));

        console.log('[FTP] Cleaning up...');
        await client.remove('/flush_all_cache.php');
        console.log('[FTP] ✅ Done');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.close();
    }
}

main();
