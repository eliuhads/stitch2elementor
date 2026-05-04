'use strict';
/**
 * SYNC AND INJECT - Master Pipeline Controller
 * 
 * stitch2elementor v4.6.7
 * Auto-creates WAF-bypassing PHP endpoints, uploads JSON payloads,
 * PHP injector scripts via FTP,
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
const INJECT_SECRET = process.env.INJECT_SECRET || '';

if (!WP_BASE_URL || !FTP_HOST || !FTP_USER || !FTP_PASS || !WP_SCRIPT_TOKEN) {
    console.error('❌ Faltan variables de entorno requeridas: WP_BASE_URL, FTP_HOST, FTP_USER, FTP_PASS, WP_SCRIPT_TOKEN');
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
        console.error('❌ page_manifest.json no encontrado en la raíz del proyecto.');
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!manifest.pages || !Array.isArray(manifest.pages)) {
        console.error('❌ page_manifest.json no tiene el array "pages".');
        process.exit(1);
    }

    const jsonDir = path.join(__dirname, '..', 'elementor_jsons');
    const fetchOptions = { headers: { 'Authorization': `Bearer ${INJECT_SECRET}` } };

    const client = new ftp.Client();
    client.ftp.verbose = false;
    let isConnected = false;

    try {
        console.log(`\n📡 [FTP] Conectando a ${FTP_HOST}...`);
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            secure: true, // TLS enforced
            secureOptions: { rejectUnauthorized: true }
        });
        isConnected = true;
        console.log('✅ Conexión FTP establecida.\n');

        // 1. Upload all JSON payloads from manifest
        console.log(`📤 [FTP] Subiendo payloads JSON a ${FTP_REMOTE}...`);
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
        console.log(`\n📊 Subidos ${uploadedCount}/${manifest.pages.length} JSONs de páginas.\n`);

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
        console.log('📤 [FTP] Subiendo scripts PHP de inyección...');
        await client.uploadFrom(path.join(__dirname, '..', 'auth_helper.php'), '/auth_helper.php');
        await client.uploadFrom(path.join(__dirname, 'create_hf_native.php'), '/create_hf.php');
        await client.uploadFrom(path.join(__dirname, 'inject_all_pages.php'), '/inject_all_pages.php');
        await client.uploadFrom(path.join(__dirname, 'flush_cache.php'), '/flush_cache.php');
        console.log('   ✅ Todos los scripts PHP subidos.\n');

        // 3. Trigger Header/Footer injection
        console.log('🚀 [HTTP] Disparando inyección de Header/Footer...');
        const resultHF = await fetchUrl(`${WP_BASE_URL}/create_hf.php`, fetchOptions);
        try {
            const hfData = JSON.parse(resultHF);
            if (hfData.success) {
                console.log('   ✅ Inyección de Header/Footer exitosa.');
                for (const [name, info] of Object.entries(hfData.results || {})) {
                    console.log(`   📄 ${name}: ${info.status || 'desconocido'} (ID: ${info.id || 'N/A'})`);
                    if (info.menu_injected) console.log(`      🔗 Menú inyectado: ${info.menu_injected}`);
                    if (info.menu_warning) console.log(`      ⚠️  ${info.menu_warning}`);
                }
            } else {
                throw new Error(`Inyección de Header/Footer FALLÓ: ${hfData.error || 'error desconocido'}`);
            }
        } catch (parseErr) {
            console.log('   ⚠️  Respuesta no-JSON (HF):');
            console.log('   ' + stripHtml(resultHF).trim().replace(/\n/g, '\n   '));
            if (!parseErr.message.includes('Inyección de')) throw new Error('Error al parsear respuesta HF');
            throw parseErr;
        }

        // 4. Trigger page injection
        console.log('\n🚀 [HTTP] Disparando inyección batch de páginas...');
        const resultPages = await fetchUrl(`${WP_BASE_URL}/inject_all_pages.php`, fetchOptions);
        let newHomeId = null;
        try {
            const pagesData = JSON.parse(resultPages);
            if (pagesData.success) {
                const summary = pagesData.summary || {};
                console.log(`   ✅ Inyección de páginas exitosa: ${summary.created || 0} creadas, ${summary.errors || 0} errores.`);
                if (pagesData.error_details && pagesData.error_details.length > 0) {
                    for (const err of pagesData.error_details) {
                        console.log(`   ⚠️  ${err}`);
                    }
                }

                // Auto-update page_manifest.json with new IDs from id_map
                const idMap = pagesData.id_map || {};
                if (Object.keys(idMap).length > 0) {
                    console.log('\n📝 [MANIFEST] Actualizando page_manifest.json con nuevos IDs de WordPress...');
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
                    console.log('   ✅ page_manifest.json actualizado con nuevos IDs.\n');

                    // Re-upload updated manifest for flush_cache.php to use
                    await client.uploadFrom(manifestPath, `${FTP_REMOTE}page_manifest.json`);
                    console.log('   ✅ Manifest actualizado re-subido al servidor.\n');
                }
            } else {
                throw new Error(`Inyección de páginas FALLÓ: ${pagesData.error || 'error desconocido'}`);
            }
        } catch (parseErr) {
            console.log('   ⚠️  Respuesta no-JSON (Páginas):');
            console.log('   ' + stripHtml(resultPages).trim().replace(/\n/g, '\n   '));
            if (!parseErr.message.includes('Inyección de')) throw new Error('Error al parsear respuesta Pages');
            throw parseErr;
        }

        // 5. Trigger cache flush + homepage realignment
        console.log('🚀 [HTTP] Disparando limpieza de caché y config de homepage...');
        const resultCache = await fetchUrl(`${WP_BASE_URL}/flush_cache.php`, fetchOptions);
        try {
            const cacheData = JSON.parse(resultCache);
            if (cacheData.success) {
                const r = cacheData.results || {};
                console.log('   ✅ Limpieza de caché exitosa.');
                if (r.page_on_front) console.log(`   🏠 Homepage asignada al ID: ${r.page_on_front} — "${r.page_on_front_title || 'desconocido'}"`);
                if (r.page_for_posts) console.log(`   📰 Blog asignado al ID: ${r.page_for_posts}`);
                console.log(`   🔗 Permalinks limpiados: ${r.permalinks_flushed ? 'OK' : 'FALLA'}`);
                console.log(`   🧹 Caché de Elementor: ${r.elementor_cache_cleared ? 'OK' : 'FALLA'}`);
                if (r.elementor_warning) console.log(`   ⚠️  ${r.elementor_warning}`);
                console.log(`   📚 Biblioteca sincronizada: ${r.library_synced ? 'OK' : 'N/A'}`);
            } else {
                console.error('   ❌ Limpieza de caché FALLÓ:', cacheData.error || 'error desconocido');
            }
        } catch (parseErr) {
            console.log('   ⚠️  Respuesta no-JSON (Caché):');
            console.log('   ' + stripHtml(resultCache).trim().replace(/\n/g, '\n   '));
        }

        console.log('\n📊 [RESUMEN]');
        if (newHomeId) {
            console.log(`   🏠 Nuevo ID de Inicio: ${newHomeId}`);
        }
        console.log(`   📄 Manifest: ${manifestPath}`);
        console.log(`   ✅ Protocolo AHORA SÍ: COMPLETADO\n`);

    } catch (e) {
        console.error('❌ ERROR:', e.message);
        process.exitCode = 1;
    } finally {
        if (isConnected) {
            console.log('\n🧹 [FTP] Eliminando archivos temporales por seguridad...');
            const filesToDelete = ['/create_hf.php', '/inject_all_pages.php', '/flush_cache.php', '/auth_helper.php', `${FTP_REMOTE}.inject_secret`];
            const deletePromises = filesToDelete.map(tmpFile => client.remove(tmpFile).catch(e => { /* ignorar */ }));
            await Promise.allSettled(deletePromises);
            console.log('   ✅ Archivos temporales eliminados.\n');
            client.close();
        }
    }
}

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});

