const fs = require('fs');
const https = require('https');
const path = require('path');

const WP_HOST = 'evergreenvzla.com';
const WP_USER = 'eliu.h.ads';
const WP_APP_PASS = 'zKBL lilb 3hEN nPfF Vjvr oWYF';
const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');
const MANIFEST_PATH = path.join(__dirname, 'page_manifest.json');

async function getPageIdBySlug(slug) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: WP_HOST,
            path: `/wp-json/wp/v2/pages?slug=${slug}&_fields=id`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'User-Agent': 'Node-Admin'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const pages = JSON.parse(data);
                    if (pages.length > 0) resolve(pages[0].id);
                    else resolve(null);
                } else reject(new Error(`Failed to GET slug ${slug} (${res.statusCode})`));
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function updateElementorPage(id, jsonContent) {
    // The payload for Elementor data MUST be pure stringified JSON array going into _elementor_data
    const body = JSON.stringify({
        meta: {
            _elementor_data: jsonContent,
            _elementor_edit_mode: "builder",
            _elementor_template_type: "page"
        }
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: WP_HOST,
            path: `/wp-json/wp/v2/pages/${id}`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'Node-Admin'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                else reject(new Error(`Failed to update ${id} (${res.statusCode}): ${data.slice(0, 100)}`));
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function run() {
    console.log('🚀 Mass Updating WordPress Pages from compiler V4 JSON...');
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    for (const page of manifest) {
        if (!fs.existsSync(page.jsonPath)) {
            console.log(`⚠️  Skipping ${page.slug} - JSON missing`);
            continue;
        }

        try {
            const pageId = await getPageIdBySlug(page.slug);
            if (!pageId) {
                console.log(`❌ Skipped ${page.slug} - Not found in WP`);
                continue;
            }

            const jsonStr = fs.readFileSync(page.jsonPath, 'utf8');
            await updateElementorPage(pageId, jsonStr);
            console.log(`✅ Push Success (ID: ${pageId}) -> ${page.slug}`);
            
            // Artificial delay to prevent ModSecurity drops
            await new Promise(r => setTimeout(r, 600)); 
            
        } catch (err) {
            console.error(`❌ Error on ${page.slug}: ${err.message}`);
        }
    }
}

run().catch(console.error);
