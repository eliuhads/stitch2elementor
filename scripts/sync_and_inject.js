const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

        console.log(`[FTP] Uploading updated JSON payloads...`);
        const jsonDir = path.join(__dirname, '..', 'elementor_jsons');
        await client.ensureDir('/v9_json_payloads');
        await client.uploadFrom(path.join(jsonDir, 'header.json'), '/v9_json_payloads/header.json');
        await client.uploadFrom(path.join(jsonDir, 'footer.json'), '/v9_json_payloads/footer.json');
        await client.uploadFrom(path.join(jsonDir, 'homepage.json'), '/v9_json_payloads/homepage.json');
        await client.cd('/');

        console.log(`[FTP] Uploading create_hf.php...`);
        await client.uploadFrom(path.join(__dirname, 'create_hf_native.php'), '/create_hf.php');
        
        console.log(`[FTP] Uploading process_media.php (to inject homepage)...`);
        await client.uploadFrom(path.join(__dirname, 'inject_all_pages.php'), '/inject_all_pages.php');

        console.log(`\n[HTTP] Triggering Header/Footer injection script via internet...`);
        const resultHF = await fetchUrl('https://evergreenvzla.com/create_hf.php');
        console.log("SERVER OUTPUT (HF):");
        console.log(resultHF.replace(/<[^>]*>?/gm, ''));

        console.log(`\n[HTTP] Triggering Pages injection script via internet...`);
        const resultPages = await fetchUrl('https://evergreenvzla.com/inject_all_pages.php');
        console.log("SERVER OUTPUT (Pages):");
        console.log(resultPages.replace(/<[^>]*>?/gm, ''));

        console.log(`\n[FTP] Uploading flush_cache.php (System maintenance)...`);
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        console.log(`[HTTP] Triggering Elementor Cache Flush & Sync...`);
        const resultCache = await fetchUrl('https://evergreenvzla.com/flush_cache.php');
        console.log("SERVER OUTPUT (Cache Maintenance):");
        console.log(resultCache.replace(/<[^>]*>?/gm, ''));

        console.log(`\n[FTP] Deleting temporary PHP files for security...`);
        await client.remove('/create_hf.php');
        await client.remove('/inject_all_pages.php');
        await client.remove('/flush_cache.php');
        console.log(`[FTP] Cleaned up successfully.`);

    } catch (e) {
        console.error("Error: ", e);
    } finally {
        client.close();
    }
}

main();
