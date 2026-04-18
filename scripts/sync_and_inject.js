/**
 * sync_and_inject.js — Hybrid FTP+PHP Orchestrator
 * stitch2elementor v4.6.5
 *
 * Uploads JSON payloads + PHP injector scripts via FTP,
 * triggers them remotely, then auto-deletes for security.
 *
 * Reads ALL pages from page_manifest.json — no hardcoded filenames.
 * Uses WP_BASE_URL from .env — no hardcoded domains.
 */

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const WP_BASE_URL = (process.env.WP_BASE_URL || '').replace(/\/+$/, '');
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASS = process.env.FTP_PASS || process.env.FTP_PASSWORD;
const FTP_REMOTE = process.env.FTP_REMOTE_DIR || '/v9_json_payloads/';
const INJECT_SECRET = process.env.INJECT_SECRET || '';

if (!WP_BASE_URL || !FTP_HOST || !FTP_USER || !FTP_PASS) {
    console.error('❌ Missing required env vars: WP_BASE_URL, FTP_HOST, FTP_USER, FTP_PASS');
    console.error('   Check your .env file at the project root.');
    process.exit(1);
}

if (!INJECT_SECRET) {
    console.error('❌ Missing INJECT_SECRET in .env. All PHP scripts require authentication.');
    process.exit(1);
}

function fetchUrl(url) {
    const client = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

function stripHtml(str) {
    return str.replace(/<[^>]*>?/gm, '');
}

async function main() {
    // Load manifest
    const manifestPath = path.join(__dirname, '..', 'page_manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error('❌ page_manifest.json not found at project root.');
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!manifest.pages || !Array.isArray(manifest.pages)) {
        console.error('❌ page_manifest.json has no "pages" array.');
        process.exit(1);
    }

    const jsonDir = path.join(__dirname, '..', 'elementor_jsons');
    const tokenParam = `?token=${INJECT_SECRET}`;

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        console.log(`\n📡 [FTP] Connecting to ${FTP_HOST}...`);
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            secure: false // Set to true for FTPS if your server supports it
        });
        console.log('✅ FTP connection established.\n');

        // 1. Upload all JSON payloads from manifest
        console.log(`📤 [FTP] Uploading JSON payloads to ${FTP_REMOTE}...`);
        await client.ensureDir(FTP_REMOTE);

        // Always upload header.json and footer.json if they exist
        for (const special of ['header.json', 'footer.json']) {
            const specialPath = path.join(jsonDir, special);
            if (fs.existsSync(specialPath)) {
                await client.uploadFrom(specialPath, `${FTP_REMOTE}${special}`);
                console.log(`   ✅ ${special}`);
            }
        }

        // Upload all page JSONs from manifest
        let uploadedCount = 0;
        for (const page of manifest.pages) {
            const jsonPath = path.join(jsonDir, page.json);
            if (fs.existsSync(jsonPath)) {
                await client.uploadFrom(jsonPath, `${FTP_REMOTE}${page.json}`);
                console.log(`   ✅ ${page.json}`);
                uploadedCount++;
            } else {
                console.log(`   ⚠️  Missing: ${page.json}`);
            }
        }
        console.log(`\n📊 Uploaded ${uploadedCount}/${manifest.pages.length} page JSONs.\n`);

        // Upload page_manifest.json for the PHP injector
        await client.uploadFrom(manifestPath, `${FTP_REMOTE}page_manifest.json`);
        console.log('   ✅ page_manifest.json');

        // Upload .inject_secret for PHP-side auth
        const secretTmp = path.join(__dirname, '..', '.inject_secret_tmp');
        fs.writeFileSync(secretTmp, INJECT_SECRET, 'utf-8');
        await client.uploadFrom(secretTmp, `${FTP_REMOTE}.inject_secret`);
        fs.unlinkSync(secretTmp);
        console.log('   ✅ .inject_secret\n');

        // 2. Upload PHP scripts
        await client.cd('/');
        console.log('📤 [FTP] Uploading PHP injection scripts...');
        await client.uploadFrom(path.join(__dirname, 'create_hf_native.php'), '/create_hf.php');
        await client.uploadFrom(path.join(__dirname, 'inject_all_pages.php'), '/inject_all_pages.php');
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        console.log('   ✅ All PHP scripts uploaded.\n');

        // 3. Trigger Header/Footer injection
        console.log('🚀 [HTTP] Triggering Header/Footer injection...');
        const resultHF = await fetchUrl(`${WP_BASE_URL}/create_hf.php${tokenParam}`);
        console.log('   SERVER OUTPUT (HF):');
        console.log('   ' + stripHtml(resultHF).trim().replace(/\n/g, '\n   '));

        // 4. Trigger page injection
        console.log('\n🚀 [HTTP] Triggering batch page injection...');
        const resultPages = await fetchUrl(`${WP_BASE_URL}/inject_all_pages.php${tokenParam}`);
        console.log('   SERVER OUTPUT (Pages):');
        console.log('   ' + stripHtml(resultPages).trim().replace(/\n/g, '\n   '));

        // 5. Trigger cache flush + homepage realignment
        console.log('\n🚀 [HTTP] Triggering cache flush & homepage config...');
        const resultCache = await fetchUrl(`${WP_BASE_URL}/flush_cache.php${tokenParam}`);
        console.log('   SERVER OUTPUT (Cache):');
        console.log('   ' + stripHtml(resultCache).trim().replace(/\n/g, '\n   '));

        // 6. Cleanup — delete PHP scripts + secret from server
        console.log('\n🧹 [FTP] Deleting temporary files for security...');
        for (const tmpFile of ['/create_hf.php', '/inject_all_pages.php', '/flush_cache.php', `${FTP_REMOTE}.inject_secret`]) {
            try { await client.remove(tmpFile); } catch (e) { /* already deleted or not found */ }
        }
        console.log('   ✅ Temporary files cleaned up.\n');

        console.log('🏁 sync_and_inject.js completed successfully.\n');

    } catch (e) {
        console.error('❌ ERROR:', e.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

main();
