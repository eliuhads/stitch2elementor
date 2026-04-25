const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'veclas.env' });

async function run() {
    const client = new ftp.Client();
    try {
        console.log("[FTP] Conectando para configuración rápida...");
        await client.access({
            host: 'ftp.evergreenvzla.com',
            user: process.env.FTP_USER || 'veclas',
            password: process.env.FTP_PASSWORD || 'V3cl4s.2024!',
            secure: false
        });

        console.log("[FTP] Subiendo flush_cache.php...");
        await client.uploadFrom('flush_cache.php', '/flush_cache.php');

        const home_id = 1054;
        const flushUrl = `https://evergreenvzla.com/flush_cache.php?home_id=${home_id}`;
        
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
