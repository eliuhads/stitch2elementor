/**
 * ═══════════════════════════════════════════════════════════════
 * STITCH → ELEMENTOR CONVERTER (Template Script)
 * ═══════════════════════════════════════════════════════════════
 * 
 * This script converts Google Stitch HTML exports into native
 * Elementor Flexbox Containers and uploads them to WordPress.
 * 
 * USAGE:
 *   1. Copy this file to your project root as `stitch_to_elementor.js`
 *   2. Edit the CONFIG section below with your WordPress credentials
 *   3. Edit the PAGES array with your page names and HTML filenames
 *   4. Run: node stitch_to_elementor.js
 * 
 * PREREQUISITES:
 *   - Node.js 18+
 *   - stitch_html/ folder with downloaded .html files from Stitch
 *   - WordPress with Elementor installed
 *   - WordPress Application Password configured
 * 
 * Part of the stitch2elementor skill — free and open-source.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// ════════════════════════════════════════
// CONFIG — Edit these values for your project
// ════════════════════════════════════════

const CONFIG = {
    // WordPress credentials (must match your Application Password)
    WP_HOST: 'your-domain.com',         // No https:// prefix
    WP_USER: 'your_wp_username',
    WP_APP_PASS: 'xxxx xxxx xxxx xxxx xxxx xxxx',  // With spaces!
    WP_PROTOCOL: 'https',               // 'https' or 'http'

    // Folder containing downloaded Stitch HTML files
    HTML_DIR: './stitch_html',

    // Output folder for backup JSON files
    OUTPUT_DIR: './elementor_output',
};

// ════════════════════════════════════════
// PAGES — Define your pages here
// ════════════════════════════════════════

const PAGES = [
    // { title: 'WP Page Title', file: 'stitch-html-filename.html', slug: 'url-slug' }
    { title: 'Homepage',         file: 'homepage.html',         slug: 'home' },
    { title: 'About Us',         file: 'about.html',            slug: 'about-us' },
    { title: 'Services',         file: 'services.html',         slug: 'services' },
    { title: 'Contact',          file: 'contact.html',          slug: 'contact' },
    // Add more pages as needed...
];

// ════════════════════════════════════════
// INTERNALS — Don't edit below unless you know what you're doing
// ════════════════════════════════════════

const AUTH = Buffer.from(`${CONFIG.WP_USER}:${CONFIG.WP_APP_PASS}`).toString('base64');

/**
 * Generates a random alphanumeric ID for Elementor elements
 */
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Extracts shared dependencies from a Stitch HTML file
 * @param {string} html - Raw HTML content
 * @returns {object} { tailwindCdn, tailwindConfig, customStyles, googleFonts }
 */
function extractDependencies(html) {
    // Tailwind CDN
    const cdnMatch = html.match(/<script[^>]*src="(https:\/\/cdn\.tailwindcss\.com[^"]*)"[^>]*>/);
    const tailwindCdn = cdnMatch
        ? `<script src="${cdnMatch[1]}"></script>`
        : '<script src="https://cdn.tailwindcss.com"></script>';

    // Tailwind config (Design System tokens)
    const configMatch = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
    const tailwindConfig = configMatch ? `<script>${configMatch[1]}</script>` : '';

    // Custom styles (glassmorphism, animations, etc.)
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    const customStyles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';

    // Google Fonts
    const fontMatches = html.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/g);
    const googleFonts = fontMatches ? fontMatches.join('\n') : '';

    // Material Symbols (if present)
    const symbolMatch = html.match(/<link[^>]*Material[+]Symbols[^>]*>/);
    const materialSymbols = symbolMatch ? symbolMatch[0] : '';

    return { tailwindCdn, tailwindConfig, customStyles, googleFonts, materialSymbols };
}

/**
 * Extracts page sections from HTML body, excluding header and footer
 * @param {string} html - Raw HTML content
 * @returns {string[]} Array of section HTML strings
 */
function extractSections(html) {
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (!bodyMatch) {
        console.error('  ⚠️ No <body> found, using entire HTML as single section');
        return [html];
    }

    let body = bodyMatch[1];

    // Remove header and footer (these go to Theme Builder separately)
    body = body.replace(/<header[\s\S]*?<\/header>/gi, '');
    body = body.replace(/<footer[\s\S]*?<\/footer>/gi, '');

    // Split by <section> tags
    const sections = [];
    const sectionRegex = /<section[\s\S]*?<\/section>/gi;
    let match;

    while ((match = sectionRegex.exec(body)) !== null) {
        sections.push(match[0]);
    }

    // If no <section> tags found, try splitting by top-level <div> blocks
    if (sections.length === 0) {
        const divRegex = /<div[^>]*class="[^"]*"[^>]*>[\s\S]*?<\/div>\s*(?=<div|$)/gi;
        while ((match = divRegex.exec(body)) !== null) {
            sections.push(match[0]);
        }
    }

    // Fallback: use entire body as one section
    if (sections.length === 0) {
        sections.push(body.trim());
    }

    return sections;
}

/**
 * Creates Elementor JSON data from Stitch HTML sections
 * @param {string[]} sections - Array of section HTML strings
 * @param {object} deps - Shared dependencies from extractDependencies()
 * @returns {object[]} Elementor-compatible JSON array
 */
function createElementorData(sections, deps) {
    const sharedHead = [
        deps.tailwindCdn,
        deps.googleFonts,
        deps.materialSymbols,
        deps.tailwindConfig,
        deps.customStyles
    ].filter(Boolean).join('\n');

    return sections.map((sectionHtml, index) => ({
        id: generateId(),
        elType: "container",
        isInner: false,
        settings: {
            content_width: "full",
            padding: {
                unit: "px",
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            }
        },
        elements: [{
            id: generateId(),
            elType: "widget",
            widgetType: "html",
            settings: {
                // Only the first section gets the shared dependencies
                html: (index === 0 ? sharedHead + '\n' : '') + sectionHtml
            },
            elements: []
        }]
    }));
}

/**
 * Creates a WordPress page via REST API with Elementor data
 * @param {string} title - Page title
 * @param {string} slug - URL slug
 * @param {object[]} elementorData - Elementor JSON array
 * @returns {Promise<number>} Created page ID
 */
function createWPPage(title, slug, elementorData) {
    const body = JSON.stringify({
        title: title,
        content: '<!-- Stitch to Elementor Import -->',
        status: 'draft',
        slug: slug,
        meta: {
            _elementor_data: JSON.stringify(elementorData), // ← PURE ARRAY!
            _elementor_edit_mode: 'builder',
            _elementor_template_type: 'page'
        }
    });

    const httpModule = CONFIG.WP_PROTOCOL === 'https' ? https : http;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.WP_HOST,
            path: '/wp-json/wp/v2/pages',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            }
        };

        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const result = JSON.parse(data);
                    resolve(result.id);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * Main execution
 */
async function run() {
    console.log('═══════════════════════════════════════');
    console.log('  STITCH → ELEMENTOR CONVERTER');
    console.log('═══════════════════════════════════════\n');

    // Create output directory
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
        fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    const results = [];

    for (const page of PAGES) {
        const htmlPath = path.join(CONFIG.HTML_DIR, page.file);

        // Check HTML file exists
        if (!fs.existsSync(htmlPath)) {
            console.error(`❌ SKIP: ${page.file} not found in ${CONFIG.HTML_DIR}/`);
            results.push({ ...page, status: 'SKIPPED', reason: 'File not found' });
            continue;
        }

        console.log(`📄 Processing: ${page.title} (${page.file})`);

        // Read and parse HTML
        const html = fs.readFileSync(htmlPath, 'utf8');
        const deps = extractDependencies(html);
        const sections = extractSections(html);

        console.log(`   📐 Found ${sections.length} sections`);

        // Create Elementor data
        const elementorData = createElementorData(sections, deps);

        // Save backup JSON
        const jsonPath = path.join(CONFIG.OUTPUT_DIR, page.file.replace('.html', '.json'));
        fs.writeFileSync(jsonPath, JSON.stringify(elementorData, null, 2));
        console.log(`   💾 Backup saved: ${jsonPath}`);

        // Upload to WordPress
        try {
            const pageId = await createWPPage(page.title, page.slug, elementorData);
            console.log(`   ✅ CREATED: "${page.title}" → ID: ${pageId}\n`);
            results.push({ ...page, status: 'SUCCESS', wpId: pageId });
        } catch (error) {
            console.error(`   ❌ FAILED: ${error.message}\n`);
            results.push({ ...page, status: 'FAILED', error: error.message });
        }
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════\n');

    const success = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status !== 'SUCCESS');

    console.log(`✅ Success: ${success.length}/${results.length}`);
    success.forEach(r => console.log(`   • ${r.title} → ID: ${r.wpId}`));

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => console.log(`   • ${r.title}: ${r.reason || r.error}`));
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Go to WP Admin → Pages');
    console.log('   2. Click "Edit with Elementor" on a test page');
    console.log('   3. Verify the design loads correctly');
    console.log('   4. Run update_header_footer.js for global Header/Footer');
    console.log('   5. Elementor → Tools → Regenerate Files & Data\n');
}

run().catch(console.error);
