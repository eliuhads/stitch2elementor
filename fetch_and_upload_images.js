const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');
const JSON_DIR = path.join(__dirname, '.agent/skills/stitch2elementor/elementor_jsons');
const TEMP_DIR = path.join(__dirname, 'v9_images_temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Regex to capture Google CDN Image URLs (handles subfolders like /aida-public/)
const URL_REGEX = /https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g;

/**
 * Downloads a file to temp folder via HTTPS
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlinkSync(destPath);
                return resolve(false);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(true));
            });
        }).on('error', (err) => {
            fs.unlinkSync(destPath);
            resolve(false);
        });
    });
}

/**
 * Uploads a local file to WordPress Media Library
 */
function uploadToWP(localPath, originalUrlHash) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(localPath)) return resolve(null);
        
        const fileName = `stitch_original_${originalUrlHash}.webp`;
        const content = fs.readFileSync(localPath);
        
        const url = new URL(`${WP_URL}/wp-json/wp/v2/media`);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': 'image/webp',
                'Content-Length': content.length,
                'User-Agent': 'EvergreenBot/V2'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode !== 201) {
                    console.error(`❌ HTTP Error ${res.statusCode}: ${data}`);
                }
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode === 201 && parsed.source_url) {
                        resolve(parsed.source_url);
                    } else {
                        console.log(`❌ WP API Payload Error on ${fileName}:`, parsed.message || res.statusCode);
                        resolve(null);
                    }
                } catch (e) {
                    console.log(`❌ WP Parse Error: Could not parse response as JSON. Data preview: ${data.substring(0, 100)}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error('WP REQ ERROR:', e.message);
            resolve(null);
        });
        
        req.write(content);
        req.end();
    });
}

async function run() {
    console.log("🚀 STARTING ORIGINAL STITCH IMAGE MIGRATION");
    
    const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
    const uniqueUrls = new Set();
    const urlMap = {}; // Original URL -> WP URL

    // 1. Scan and Extract 
    console.log(`\n🔍 Scanning ${files.length} JSON files for Stitch images...`);
    for (const file of files) {
        const content = fs.readFileSync(path.join(JSON_DIR, file), 'utf-8');
        const matches = content.match(URL_REGEX);
        if (matches) {
            matches.forEach(m => uniqueUrls.add(m));
        }
    }
    
    console.log(`📦 Found ${uniqueUrls.size} unique original images to migrate.`);

    // 2. Fetch and Upload
    console.log(`\n☁️ Downloading from Google CDN & Uploading to WordPress Media Library...`);
    let counter = 1;
    for (const url of uniqueUrls) {
        process.stdout.write(`   [${counter}/${uniqueUrls.size}] Processing: ${url.substring(0, 50)}... `);
        
        // Use a simple hash of the URL to generate a unique safe filename
        const hash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        const shortHash = hash.substring(hash.length - 15);
        const fileName = `stitch_orig_${shortHash}.webp`;
        const tempPath = path.join(TEMP_DIR, fileName);
        
        const downSuccess = await downloadFile(url, tempPath);
        if (!downSuccess) {
            console.log(`❌ Download failed.`);
            counter++;
            continue;
        }

        urlMap[url] = fileName;
        console.log(`✅ Downloaded -> ${fileName}`);
        counter++;
    }

    fs.writeFileSync(path.join(TEMP_DIR, 'image_mapping.json'), JSON.stringify(urlMap, null, 2));

    // 3. Rewrite JSONs locally with the LOCAL image filenames as placeholders
    // The PHP script will later upload these and replace the filenames with the real WP URLs.
    console.log(`\n📝 Rewriting JSON payloads to use local placeholder filenames...`);
    let replacedCount = 0;
    const payloadDir = path.join(__dirname, 'v9_json_payloads');
    if (!fs.existsSync(payloadDir)) fs.mkdirSync(payloadDir);

    for (const file of files) {
        const filePath = path.join(JSON_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        
        let fileChanged = false;
        for (const [origUrl, fileName] of Object.entries(urlMap)) {
            if (content.includes(origUrl)) {
                // Global replace
                const regex = new RegExp(origUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                // We use a specific tag so PHP knows what to replace: %%FILE:stitch_orig_XXX.webp%%
                content = content.replace(regex, `%%FILE:${fileName}%%`);
                fileChanged = true;
                replacedCount++;
            }
        }
        
        fs.writeFileSync(path.join(payloadDir, file), content, 'utf-8');
        if (fileChanged) console.log(`   ✔️ Rewrote ${file}`);
    }

    console.log(`\n🎉 COMPLETADO! Replaced ${replacedCount} references with placeholders.`);
    console.log(`📁 Target JSONs are in v9_json_payloads/ ready for FTP.`);
}

run();
