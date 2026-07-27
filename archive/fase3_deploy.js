'use strict';
const ftp = require('basic-ftp');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    const client = new ftp.Client();
    try {
        console.log(`[FTP] Connecting to ${process.env.FTP_HOST}...`);
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: true }
        });

        // 1. Upload OG Image
        const ogImagePath = path.join(__dirname, '..', 'og-image-evergreen.png');
        console.log(`[FTP] Uploading og-image-evergreen.png...`);
        await client.uploadFrom(ogImagePath, '/og-image-evergreen.png');
        console.log(`  ✅ OG Image uploaded.`);

        // 2. Upload llms.txt
        const llmsPath = path.join(__dirname, 'llms.txt');
        console.log(`[FTP] Uploading llms.txt...`);
        await client.uploadFrom(llmsPath, '/llms.txt');
        console.log(`  ✅ llms.txt uploaded.`);

        // 3. Upload robots.txt
        const robotsPath = path.join(__dirname, 'robots.txt');
        console.log(`[FTP] Uploading robots.txt...`);
        await client.uploadFrom(robotsPath, '/robots.txt');
        console.log(`  ✅ robots.txt uploaded.`);

        // 4. Upload and run OG config PHP
        const phpPath = path.join(__dirname, 'fase3_og_config.php');
        console.log(`[FTP] Uploading fase3_og_config.php...`);
        await client.uploadFrom(phpPath, '/fase3_og_config.php');

        const https = require('https');
        const url = `${process.env.WP_BASE_URL}/fase3_og_config.php`;
        console.log(`[HTTP] Executing: ${url}`);
        
        const options = {
            headers: {
                'Authorization': `Bearer ${process.env.WP_SCRIPT_TOKEN || process.env.INJECT_SECRET}`
            }
        };

        await new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log("Response:", data);
                    resolve();
                });
            }).on('error', reject);
        });

        // 5. Cleanup PHP
        console.log(`[FTP] Cleaning up PHP...`);
        await client.remove('/fase3_og_config.php');
        console.log(`  ✅ Cleaned up.`);

        console.log(`\n🎉 FASE 3 DEPLOYMENT COMPLETE`);
        console.log(`  - OG Image: ${process.env.WP_BASE_URL}/og-image-evergreen.png`);
        console.log(`  - llms.txt: ${process.env.WP_BASE_URL}/llms.txt`);
        console.log(`  - robots.txt: ${process.env.WP_BASE_URL}/robots.txt`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.close();
    }
}

main();
