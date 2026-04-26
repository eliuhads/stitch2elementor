const { Client } = require('basic-ftp');
require('dotenv').config();
const https = require('https');
const path = require('path');

async function run() {
    const scriptPath = process.argv[2];
    if (!scriptPath) {
        console.error("Usage: node run_remote_php.js <path/to/script.php>");
        process.exit(1);
    }
    const scriptName = path.basename(scriptPath);
    
    const client = new Client();
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        console.log(`Uploading ${scriptName}...`);
        await client.uploadFrom(scriptPath, scriptName);

        const url = `${process.env.WP_BASE_URL}/${scriptName}?secret=${process.env.INJECT_SECRET}`;
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
        await client.remove(scriptName);

    } catch (err) {
        console.error(err);
    }
    client.close();
}

run();
