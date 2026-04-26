const { Client } = require('basic-ftp');
require('dotenv').config();
const https = require('https');

if (!process.env.FTP_HOST || !process.env.FTP_USER || !process.env.FTP_PASS || !process.env.WP_BASE_URL || !process.env.WP_SCRIPT_TOKEN) {
    console.error('❌ Missing required env vars: WP_BASE_URL, FTP_HOST, FTP_USER, FTP_PASS, WP_SCRIPT_TOKEN');
    process.exit(1);
}

async function run() {
    const client = new Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: process.env.FTP_REJECT_UNAUTHORIZED !== 'false' }
        });

        console.log("Uploading auth_helper.php...");
        await client.uploadFrom("auth_helper.php", "auth_helper.php");

        console.log("Uploading fix_slugs_native.php...");
        await client.uploadFrom("scripts/fix_slugs_native.php", "fix_slugs_native.php");

        const url = `${process.env.WP_BASE_URL}/fix_slugs_native.php`;
        console.log(`Executing: ${url}`);
        
        const options = {
            headers: {
                'Authorization': `Bearer ${process.env.WP_SCRIPT_TOKEN || process.env.INJECT_SECRET}`
            }
        };

        await new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                console.log(`Status Code: ${res.statusCode}`);
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
        await client.remove("auth_helper.php");

    } catch (err) {
        console.error(err);
    }
    client.close();
}

run();
