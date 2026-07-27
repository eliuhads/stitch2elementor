/**
 * verify_css_loading.mjs — Check if global CSS is enqueued on WP pages
 * Uses cheerio (no browser) to parse HTML source
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const SITE = process.env.SITE_URL;
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  VERIFY CSS LOADING — Evergreen LED             ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Test 3 representative pages
const testPages = [
  { name: 'Nosotros', slug: 'nosotros' },
  { name: 'Catálogo', slug: 'catalogo' },
  { name: 'Contacto', slug: 'contacto' },
];

for (const page of testPages) {
  const url = `${SITE}/${page.slug}/`;
  console.log(`🔍 ${page.name} → ${url}`);
  
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000)
    });
    
    const html = await resp.text();
    const $ = cheerio.load(html);
    
    // Check for our global CSS
    const globalCss = $('link[id="evergreen-global-css"]').length > 0;
    const globalHref = $('link[id="evergreen-global-css"]').attr('href') || '';
    
    // Check for homepage CSS (should only be on homepage)
    const homepageCss = $('link[id="evergreen-homepage-css"]').length > 0;
    
    // Check all stylesheets for 'evergreen'
    const allLinks = [];
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('evergreen')) {
        allLinks.push(href);
      }
    });
    
    // Check inline styles for our tokens
    const hasSpaceGrotesk = html.includes('Space+Grotesk') || html.includes('Space Grotesk');
    const hasDarkBg = html.includes('#0E1320') || html.includes('0E1320');
    
    // Check fonts loaded
    const fontLinks = [];
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('fonts.googleapis.com')) {
        fontLinks.push(href);
      }
    });
    
    console.log(`  Global CSS enqueued: ${globalCss ? '✅ YES' : '❌ NO'}`);
    if (globalHref) console.log(`  Href: ${globalHref}`);
    console.log(`  Homepage CSS: ${homepageCss ? '⚠️ YES (unexpected)' : '— (correct, not homepage)'}`);
    console.log(`  Evergreen links found: ${allLinks.length}`);
    allLinks.forEach(l => console.log(`    → ${l}`));
    console.log(`  Space Grotesk ref: ${hasSpaceGrotesk ? '✅' : '❌'}`);
    console.log(`  Dark bg (#0E1320): ${hasDarkBg ? '✅' : '❌'}`);
    console.log(`  Google Fonts: ${fontLinks.length}`);
    console.log('');
  } catch (err) {
    console.log(`  ⚠️ Error: ${err.message}\n`);
  }
}

// Also test homepage
console.log(`🔍 Homepage → ${SITE}/`);
try {
  const resp = await fetch(`${SITE}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(15000)
  });
  const html = await resp.text();
  const $ = cheerio.load(html);
  
  const globalCss = $('link[id="evergreen-global-css"]').length > 0;
  const homepageCss = $('link[id="evergreen-homepage-css"]').length > 0;
  
  console.log(`  Global CSS: ${globalCss ? '✅' : '❌'}`);
  console.log(`  Homepage CSS: ${homepageCss ? '✅ (correct — homepage only)' : '❌'}`);
} catch (err) {
  console.log(`  ⚠️ Error: ${err.message}`);
}

console.log('\n🏁 Done');
