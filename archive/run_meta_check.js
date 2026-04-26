const ftp = require('basic-ftp');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

async function main() {
    const client = new ftp.Client();
    try {
        const wpUrl = process.env.WP_BASE_URL;
        if (!wpUrl) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: process.env.FTP_REJECT_UNAUTHORIZED !== 'false' }
        });
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        const r = await fetchUrl(`${wpUrl}/flush_cache.php`);
        console.log(r);
        await client.remove('/flush_cache.php');
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}
main();
