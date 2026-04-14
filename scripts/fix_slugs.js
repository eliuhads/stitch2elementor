/**
 * fix_slugs.js
 * Fixes WordPress page slugs to match page_manifest.json
 * 
 * Usage: WP_URL=https://your-domain.com WP_USER=admin WP_APP_PASSWORD="xxxx xxxx xxxx" node fix_slugs.js
 * Or set variables in your shell/env before running.
 */
const fs = require('fs');
const path = require('path');
const { wpRequest, WP_URL } = require('./utils/wp-api');

// Load slug fixes from page_manifest.json at project root
const MANIFEST_PATH = path.join(__dirname, '..', 'page_manifest.json');
let SLUG_FIXES = [];
try {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  SLUG_FIXES = manifest.pages.map(p => ({ id: p.wp_id, slug: p.slug, title: p.title }));
} catch (e) {
  console.error(`ERROR: Could not load page_manifest.json from ${MANIFEST_PATH}`);
  console.error('Ensure page_manifest.json exists at project root with a "pages" array containing wp_id, slug, title.');
  process.exit(1);
}

async function fixSlugs() {
  console.log(`\nFixing ${SLUG_FIXES.length} slugs on ${WP_URL}\n`);
  for (const fix of SLUG_FIXES) {
    try {
      const result = await wpRequest('POST', `/pages/${fix.id}`, {
        slug: fix.slug,
        title: fix.title,
      });
      if (result.status === 200) {
        console.log(`✅ ${fix.id} → /${result.data.slug}/`);
      } else {
        console.log(`❌ ${fix.id}: HTTP ${result.status}`, result.data?.message || '');
      }
    } catch (e) {
      console.log(`❌ ${fix.id}: ${e.message}`);
    }
  }
  console.log('\nDone.');
}

fixSlugs();
