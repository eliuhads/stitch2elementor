/**
 * ═══════════════════════════════════════════════════════════════
 * STITCH → ELEMENTOR: Header & Footer Updater (Template Script)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Updates existing Elementor Theme Builder templates (Header/Footer)
 * with the real Stitch design extracted from any page's HTML.
 * 
 * USAGE:
 *   1. Copy this file to your project root as `update_header_footer.js`
 *   2. Edit the CONFIG section below
 *   3. Run: node update_header_footer.js
 * 
 * HOW TO FIND YOUR TEMPLATE IDs:
 *   Use wp-elementor-mcp → get_elementor_templates
 *   Look for templates with slugs like "elementor-header-XX" and "elementor-footer-XX"
 * 
 * Part of the stitch2elementor skill — free and open-source.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// ════════════════════════════════════════
// CONFIG — Edit these values
// ════════════════════════════════════════

const CONFIG = {
    // WordPress credentials
    WP_HOST: 'your-domain.com',
    WP_USER: 'your_wp_username',
    WP_APP_PASS: 'xxxx xxxx xxxx xxxx xxxx xxxx',
    WP_PROTOCOL: 'https',

    // Source HTML file (any page with header/footer, usually homepage)
    SOURCE_HTML: './stitch_html/homepage.html',

    // Elementor template IDs (find with get_elementor_templates)
    HEADER_TEMPLATE_ID: null,  // e.g., 45
    FOOTER_TEMPLATE_ID: null,  // e.g., 52

    // Output folder for backup
    OUTPUT_DIR: './elementor_output',
};

// ════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════

if (!CONFIG.HEADER_TEMPLATE_ID || !CONFIG.FOOTER_TEMPLATE_ID) {
    console.error('❌ ERROR: You must set HEADER_TEMPLATE_ID and FOOTER_TEMPLATE_ID in CONFIG.');
    console.error('   Run wp-elementor-mcp → get_elementor_templates to find them.');
    process.exit(1);
}

// ════════════════════════════════════════
// INTERNALS
// ════════════════════════════════════════

const AUTH = Buffer.from(`${CONFIG.WP_USER}:${CONFIG.WP_APP_PASS}`).toString('base64');

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// Read source HTML
const html = fs.readFileSync(CONFIG.SOURCE_HTML, 'utf8');

// Extract header
const headerMatch = html.match(/<header[\s\S]*?<\/header>/);
const headerHtml = headerMatch ? headerMatch[0] : '';

// Extract footer
const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
const footerHtml = footerMatch ? footerMatch[0] : '';

// Extract shared dependencies
const cdnMatch = html.match(/<script[^>]*src="(https:\/\/cdn\.tailwindcss\.com[^"]*)"[^>]*>/);
const tailwindCdn = cdnMatch
    ? `<script src="${cdnMatch[1]}"></script>`
    : '<script src="https://cdn.tailwindcss.com"></script>';

const configMatch = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
const tailwindConfig = configMatch ? `<script>${configMatch[1]}</script>` : '';

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const customStyles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';

const fontMatches = html.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/g);
const googleFonts = fontMatches ? fontMatches.join('\n') : '';

const SHARED_DEPS = [tailwindCdn, googleFonts, tailwindConfig, customStyles]
    .filter(Boolean).join('\n');

/**
 * Wraps content in Elementor container + HTML widget
 */
function makeElementorData(contentHtml) {
    return [{
        id: generateId(),
        elType: "container",
        isInner: false,
        settings: {
            content_width: "full",
            padding: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true }
        },
        elements: [{
            id: generateId(),
            elType: "widget",
            widgetType: "html",
            settings: {
                html: SHARED_DEPS + '\n' + contentHtml
            },
            elements: []
        }]
    }];
}

/**
 * Updates an Elementor template via WP REST API
 */
function updateTemplate(templateId, elementorData, templateType) {
    const body = JSON.stringify({
        meta: {
            _elementor_data: JSON.stringify(elementorData),
            _elementor_edit_mode: 'builder',
            _elementor_template_type: templateType
        }
    });

    const httpModule = CONFIG.WP_PROTOCOL === 'https' ? https : http;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.WP_HOST,
            path: `/wp-json/wp/v2/elementor_library/${templateId}`,
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
                    resolve();
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

async function run() {
    console.log('═══════════════════════════════════════');
    console.log('  HEADER & FOOTER UPDATER');
    console.log('═══════════════════════════════════════\n');

    console.log(`📄 Source: ${CONFIG.SOURCE_HTML}`);
    console.log(`📐 Header HTML: ${headerHtml.length} chars`);
    console.log(`📐 Footer HTML: ${footerHtml.length} chars\n`);

    if (!headerHtml) console.warn('⚠️  No <header> found in source HTML');
    if (!footerHtml) console.warn('⚠️  No <footer> found in source HTML');

    // Create output directory
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
        fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    // Generate Elementor data
    const headerData = makeElementorData(headerHtml);
    const footerData = makeElementorData(footerHtml);

    // Save backup
    fs.writeFileSync(`${CONFIG.OUTPUT_DIR}/header.json`, JSON.stringify(headerData, null, 2));
    fs.writeFileSync(`${CONFIG.OUTPUT_DIR}/footer.json`, JSON.stringify(footerData, null, 2));
    console.log('💾 Backup saved to', CONFIG.OUTPUT_DIR, '\n');

    // Update Header
    if (headerHtml && CONFIG.HEADER_TEMPLATE_ID) {
        try {
            await updateTemplate(CONFIG.HEADER_TEMPLATE_ID, headerData, 'header');
            console.log(`✅ Header (ID ${CONFIG.HEADER_TEMPLATE_ID}) updated successfully`);
        } catch (e) {
            console.error(`❌ Header failed: ${e.message}`);
        }
    }

    // Update Footer
    if (footerHtml && CONFIG.FOOTER_TEMPLATE_ID) {
        try {
            await updateTemplate(CONFIG.FOOTER_TEMPLATE_ID, footerData, 'footer');
            console.log(`✅ Footer (ID ${CONFIG.FOOTER_TEMPLATE_ID}) updated successfully`);
        } catch (e) {
            console.error(`❌ Footer failed: ${e.message}`);
        }
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Go to WP Admin → Elementor → Theme Builder');
    console.log('   2. Verify Header and Footer templates');
    console.log('   3. Set Display Conditions → "Entire Site" for both');
    console.log('   4. Elementor → Tools → Regenerate Files & Data');
    console.log('   5. Visit your site to confirm Header/Footer are visible\n');
}

run().catch(console.error);
