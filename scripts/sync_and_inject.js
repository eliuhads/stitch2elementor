/**
 * sync_and_inject.js — Hybrid FTP+PHP Orchestrator
 * stitch2elementor v4.6.6
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
const WP_SCRIPT_TOKEN = process.env.WP_SCRIPT_TOKEN || '';

if (!WP_BASE_URL || !FTP_HOST || !FTP_USER || !FTP_PASS || !WP_SCRIPT_TOKEN) {
    console.error('❌ Missing required env vars: WP_BASE_URL, FTP_HOST, FTP_USER, FTP_PASS, WP_SCRIPT_TOKEN');
    console.error('   Check your .env file at the project root.');
    process.exit(1);
}

if (!INJECT_SECRET) {
    console.error('❌ Missing INJECT_SECRET in .env. All PHP scripts require authentication.');
    process.exit(1);
}

function fetchUrl(url, options = {}) {
    const client = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
        client.get(url, options, (res) => {
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
    const fetchOptions = { headers: { 'Authorization': `Bearer ${INJECT_SECRET}` } };

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        console.log(`\n📡 [FTP] Connecting to ${FTP_HOST}...`);
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            secure: true, // TLS enforced
            secureOptions: { rejectUnauthorized: process.env.FTP_REJECT_UNAUTHORIZED !== 'false' }
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
        await client.uploadFrom(path.join(__dirname, '..', 'auth_helper.php'), '/auth_helper.php');
        await client.uploadFrom(path.join(__dirname, 'create_hf_native.php'), '/create_hf.php');
        await client.uploadFrom(path.join(__dirname, 'inject_all_pages.php'), '/inject_all_pages.php');
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        console.log('   ✅ All PHP scripts uploaded.\n');

        // 3. Trigger Header/Footer injection
        console.log('🚀 [HTTP] Triggering Header/Footer injection...');
        const resultHF = await fetchUrl(`${WP_BASE_URL}/create_hf.php`, fetchOptions);
        try {
            const hfData = JSON.parse(resultHF);
            if (hfData.success) {
                console.log('   ✅ Header/Footer injection successful.');
                for (const [name, info] of Object.entries(hfData.results || {})) {
                    console.log(`   📄 ${name}: ${info.status || 'unknown'} (ID: ${info.id || 'N/A'})`);
                    if (info.menu_injected) console.log(`      🔗 Menu injected: ${info.menu_injected}`);
                    if (info.menu_warning) console.log(`      ⚠️  ${info.menu_warning}`);
                }
            } else {
                console.error('   ❌ Header/Footer injection FAILED:', hfData.error || 'unknown error');
                process.exit(1);
            }
        } catch (parseErr) {
            console.log('   ⚠️  Non-JSON response (HF):');
            console.log('   ' + stripHtml(resultHF).trim().replace(/\n/g, '\n   '));
        }

        // 4. Trigger page injection
        console.log('\n🚀 [HTTP] Triggering batch page injection...');
        const resultPages = await fetchUrl(`${WP_BASE_URL}/inject_all_pages.php`, fetchOptions);
        let newHomeId = null;
        try {
            const pagesData = JSON.parse(resultPages);
            if (pagesData.success) {
                const summary = pagesData.summary || {};
                console.log(`   ✅ Page injection successful: ${summary.created || 0} created, ${summary.errors || 0} errors.`);
                if (pagesData.error_details && pagesData.error_details.length > 0) {
                    for (const err of pagesData.error_details) {
                        console.log(`   ⚠️  ${err}`);
                    }
                }

                // Auto-update page_manifest.json with new IDs from id_map
                const idMap = pagesData.id_map || {};
                if (Object.keys(idMap).length > 0) {
                    console.log('\n📝 [MANIFEST] Updating page_manifest.json with new WordPress IDs...');
                    for (const page of manifest.pages) {
                        if (idMap[page.slug] !== undefined) {
                            const oldId = page.wp_id;
                            page.wp_id = idMap[page.slug];
                            console.log(`   ${page.slug}: ${oldId || 'null'} → ${page.wp_id}`);
                            if (page.is_homepage) {
                                newHomeId = page.wp_id;
                            }
                        }
                    }
                    // Update home_id in manifest
                    if (newHomeId) {
                        manifest.home_id = newHomeId;
                        console.log(`\n   🏠 Homepage ID updated: ${newHomeId}`);
                    }
                    // Find blog_id
                    const blogPage = manifest.pages.find(p => p.is_blog && p.wp_id);
                    if (blogPage) {
                        manifest.blog_id = blogPage.wp_id;
                        console.log(`   📰 Blog ID updated: ${manifest.blog_id}`);
                    }
                    // Update metadata
                    manifest.last_injection_date = new Date().toISOString().split('T')[0];
                    manifest.migration_status = 'INJECTED';
                    // Write updated manifest
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
                    console.log('   ✅ page_manifest.json updated with new IDs.\n');

                    // Re-upload updated manifest for flush_cache.php to use
                    await client.uploadFrom(manifestPath, `${FTP_REMOTE}page_manifest.json`);
                    console.log('   ✅ Updated manifest re-uploaded to server.\n');
                }
            } else {
                console.error('   ❌ Page injection FAILED:', pagesData.error || 'unknown error');
                process.exit(1);
            }
        } catch (parseErr) {
            console.log('   ⚠️  Non-JSON response (Pages):');
            console.log('   ' + stripHtml(resultPages).trim().replace(/\n/g, '\n   '));
        }

        // 5. Trigger cache flush + homepage realignment
        console.log('🚀 [HTTP] Triggering cache flush & homepage config...');
        const resultCache = await fetchUrl(`${WP_BASE_URL}/flush_cache.php`, fetchOptions);
        try {
            const cacheData = JSON.parse(resultCache);
            if (cacheData.success) {
                const r = cacheData.results || {};
                console.log('   ✅ Cache flush successful.');
                if (r.page_on_front) console.log(`   🏠 Homepage set to ID: ${r.page_on_front} — "${r.page_on_front_title || 'unknown'}"`);
                if (r.page_for_posts) console.log(`   📰 Blog set to ID: ${r.page_for_posts}`);
                console.log(`   🔗 Permalinks flushed: ${r.permalinks_flushed ? 'OK' : 'FAIL'}`);
                console.log(`   🧹 Elementor cache: ${r.elementor_cache_cleared ? 'OK' : 'FAIL'}`);
                if (r.elementor_warning) console.log(`   ⚠️  ${r.elementor_warning}`);
                console.log(`   📚 Library synced: ${r.library_synced ? 'OK' : 'N/A'}`);
            } else {
                console.error('   ❌ Cache flush FAILED:', cacheData.error || 'unknown error');
            }
        } catch (parseErr) {
            console.log('   ⚠️  Non-JSON response (Cache):');
            console.log('   ' + stripHtml(resultCache).trim().replace(/\n/g, '\n   '));
        }

        // 6. Cleanup — delete PHP scripts + secret from server
        console.log('\n🧹 [FTP] Deleting temporary files for security...');
        for (const tmpFile of ['/create_hf.php', '/inject_all_pages.php', '/flush_cache.php', '/auth_helper.php', `${FTP_REMOTE}.inject_secret`]) {
            try { await client.remove(tmpFile); } catch (e) { /* already deleted or not found */ }
        }
        console.log('   ✅ Temporary files cleaned up.\n');

        console.log('\n📊 [SUMMARY]');
        if (newHomeId) {
            console.log(`   🏠 New Homepage ID: ${newHomeId}`);
        }
        console.log(`   📄 Manifest: ${manifestPath}`);
        console.log(`   ✅ Protocolo AHORA SÍ: COMPLETED\n`);

    } catch (e) {
        console.error('❌ ERROR:', e.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

main();
