const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const client = new ftp.Client();
    try {
        const wpUrl = process.env.WP_BASE_URL;
        if (!wpUrl) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }

        console.log("[FTP] Conectando para configuración rápida...");
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        console.log("[FTP] Subiendo flush_cache.php...");
        await client.uploadFrom('flush_cache.php', '/flush_cache.php');

        const home_id = process.env.WP_HOME_ID || 1054;
        const token = process.env.WP_SCRIPT_TOKEN || '';
        const flushUrl = `${wpUrl}/flush_cache.php?token=${encodeURIComponent(token)}&home_id=${home_id}`;
        
        console.log(`[HTTP] Configurando Homepage ID: ${home_id}...`);
        const response = await fetch(flushUrl);
        const text = await response.text();
        
        console.log("\nRESULTADO DEL SERVIDOR:");
        console.log(text.replace(/<[^>]*>?/gm, ''));

        console.log("\n[FTP] Limpiando script temporal...");
        await client.remove('/flush_cache.php');
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.close();
    }
}

run();
