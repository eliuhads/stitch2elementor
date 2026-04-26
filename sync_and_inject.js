const ftp = require('basic-ftp');
const fs = require('fs');
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
        const wpUrl = process.env.WP_BASE_URL;
        if (!wpUrl) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        console.log(`[FTP] Uploading updated JSON payloads...`);
        await client.ensureDir('/elementor_jsons');
        await client.ensureDir('/elementor_jsons');
        const jsonFiles = fs.readdirSync(path.join(__dirname, 'elementor_jsons')).filter(f => f.endsWith('.json'));
        for (const file of jsonFiles) {
            await client.uploadFrom(path.join(__dirname, 'elementor_jsons', file), '/elementor_jsons/' + file);
        }
        await client.cd('/');

        console.log(`[FTP] Uploading create_hf.php...`);
        await client.uploadFrom(path.join(__dirname, 'create_hf_native.php'), '/create_hf.php');
        
        console.log(`[FTP] Uploading process_media.php (to inject homepage)...`);
        await client.uploadFrom(path.join(__dirname, 'inject_all_pages.php'), '/inject_all_pages.php');

        console.log(`\n[HTTP] Triggering Header/Footer injection script via internet...`);
        const resultHF = await fetchUrl(`${wpUrl}/create_hf.php`);
        console.log("SERVER OUTPUT (HF):");
        console.log(resultHF.replace(/<[^>]*>?/gm, ''));

        console.log(`\n[HTTP] Triggering Pages injection script via internet...`);
        const resultPages = await fetchUrl(`${wpUrl}/inject_all_pages.php`);
        console.log("SERVER OUTPUT (Pages):");
        console.log(resultPages.replace(/<[^>]*>?/gm, ''));

        console.log(`\n[FTP] Uploading flush_cache.php (System maintenance)...`);
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        
        // Cargar manifest para identificar Homepage y Blog
        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'page_manifest.json'), 'utf8'));
        const homePage = manifest.pages.find(p => p.title.toLowerCase() === 'homepage');
        const blogPage = manifest.pages.find(p => p.title.toLowerCase() === 'blog');
        
        let flushUrl = `${wpUrl}/flush_cache.php`;

        console.log(`[HTTP] Triggering Elementor Cache Flush & Sync (Targeting Home: ${homePage?.wp_id || 'N/A'})...`);
        const resultCache = await fetchUrl(flushUrl);
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

