const { Client } = require('basic-ftp');
require('dotenv').config();
const https = require('https');

async function run() {
    const client = new Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        console.log("Uploading fix_slugs_native.php...");
        await client.uploadFrom("scripts/fix_slugs_native.php", "fix_slugs_native.php");

        const url = `${process.env.WP_BASE_URL}/fix_slugs_native.php?secret=${process.env.INJECT_SECRET}`;
        console.log(`Executing: ${url}`);
        
        await new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log("Response:", data);
                    resolve();
                });
            }).on('error', (err) => {
                reject(err);
            });
        });

        console.log("Cleaning up...");
        await client.remove("fix_slugs_native.php");

    } catch (err) {
        console.error(err);
    }
    client.close();
}

run();
