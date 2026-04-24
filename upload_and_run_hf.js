const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, 'veclas.env') });

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

        console.log(`[FTP] Uploading create_hf.php...`);
        await client.uploadFrom(path.join(__dirname, 'create_hf.php'), '/create_hf.php');

        console.log(`\n[HTTP] Triggering injection script via internet...`);
        const result = await fetchUrl('https://evergreenvzla.com/create_hf.php');
        console.log("SERVER OUTPUT:");
        console.log(result.replace(/<[^>]*>?/gm, '')); // Strip basic HTML

        console.log(`\n[FTP] Deleting create_hf.php for security...`);
        await client.remove('/create_hf.php');
        console.log(`[FTP] Cleaned up successfully.`);

    } catch (e) {
        console.error("Error: ", e);
    } finally {
        client.close();
    }
}

main();
