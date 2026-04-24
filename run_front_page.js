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
        console.log(`[FTP] Connecting to ${process.env.FTP_HOST}...`);
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false
        });

        console.log(`[FTP] Uploading set_front_page.php...`);
        await client.uploadFrom(path.join(__dirname, 'set_front_page.php'), '/set_front_page.php');

        console.log(`\n[HTTP] Triggering script...`);
        const result = await fetchUrl('https://evergreenvzla.com/set_front_page.php');
        console.log(result.replace(/<[^>]*>?/gm, ''));

        await client.remove('/set_front_page.php');
        console.log(`[FTP] Cleaned up successfully.`);

    } catch (e) {
        console.error("Error: ", e);
    } finally {
        client.close();
    }
}

main();
