/**
 * verify_content_parity.mjs — Content-level parity verification
 * 
 * Compares text content between Stitch HTML files (local) and WP pages (remote)
 * Uses: cheerio for HTML parsing, fetch for WP pages
 * Does NOT require browser — pure Node.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env for WP credentials
const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  let key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  env[key] = val;
});

const WP_URL = env.WP_URL || env.SITE_URL;
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'page_manifest.json'), 'utf8'));
const pages = manifest.pages.filter(p => p.wp_id);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  CONTENT PARITY CHECK — Stitch vs WordPress     ║');
console.log('╚══════════════════════════════════════════════════╝\n');

function extractTextContent(html) {
  const $ = cheerio.load(html);
  // Remove scripts, styles, nav, footer for body content comparison
  $('script, style, noscript, link').remove();
  
  const sections = [];
  $('section, main > div').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20) sections.push(text);
  });
  
  const headings = [];
  $('h1, h2, h3, h4').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) headings.push(text);
  });
  
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || $(el).attr('data-alt') || '';
    if (src) images.push({ src: src.substring(0, 60), alt: alt.substring(0, 40) });
  });
  
  const buttons = [];
  $('button, a.bg-, a[class*="bg-"]').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length < 50) buttons.push(text);
  });
  
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  
  return { sections, headings, images, buttons, bodyText, bodyLen: bodyText.length };
}

function extractWPContent(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, link, head').remove();
  
  // Elementor-specific
  const headings = [];
  $('.elementor-heading-title, h1, h2, h3, h4').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && !headings.includes(text)) headings.push(text);
  });
  
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    if (src && !src.includes('data:image')) images.push({ src: src.substring(0, 60) });
  });
  
  const buttons = [];
  $('.elementor-button-text, .elementor-button').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length < 50) buttons.push(text);
  });
  
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  
  return { headings, images, buttons, bodyText, bodyLen: bodyText.length };
}

// Compare two arrays and return overlap percentage
function arrayOverlap(stitchArr, wpArr) {
  if (!stitchArr.length) return 100;
  let matches = 0;
  for (const s of stitchArr) {
    const sNorm = s.toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, '').trim();
    for (const w of wpArr) {
      const wNorm = w.toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, '').trim();
      if (wNorm.includes(sNorm) || sNorm.includes(wNorm)) {
        matches++;
        break;
      }
    }
  }
  return Math.round((matches / stitchArr.length) * 100);
}

const results = [];

for (const page of pages) {
  const slug = page.slug;
  const htmlPath = path.join(ROOT, 'assets_originales', page.html);
  const wpUrl = page.is_homepage ? WP_URL : `${WP_URL}/${slug}/`;
  
  console.log(`\n── ${page.title} (ID: ${page.wp_id}) ──`);
  
  try {
    // Read Stitch HTML
    const stitchHtml = fs.readFileSync(htmlPath, 'utf8');
    const stitch = extractTextContent(stitchHtml);
    
    // Fetch WP page
    const resp = await fetch(wpUrl, { headers: { 'Accept': 'text/html' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const wpHtml = await resp.text();
    const wp = extractWPContent(wpHtml);
    
    // Compare headings
    const headingParity = arrayOverlap(stitch.headings, wp.headings);
    
    // Compare button text
    const buttonParity = stitch.buttons.length > 0 ? arrayOverlap(stitch.buttons, wp.buttons) : 100;
    
    // Image count comparison
    const stitchImgCount = stitch.images.length;
    const wpImgCount = wp.images.length;
    const imgRatio = stitchImgCount > 0 ? Math.round((Math.min(wpImgCount, stitchImgCount) / stitchImgCount) * 100) : 100;
    
    // Overall score
    const overallScore = Math.round((headingParity * 0.5 + buttonParity * 0.2 + imgRatio * 0.3));
    const emoji = overallScore >= 80 ? '✅' : overallScore >= 50 ? '⚠️' : '❌';
    
    console.log(`  Stitch: ${stitch.headings.length} headings, ${stitchImgCount} images, ${stitch.buttons.length} buttons`);
    console.log(`  WP:     ${wp.headings.length} headings, ${wpImgCount} images, ${wp.buttons.length} buttons`);
    console.log(`  Heading parity: ${headingParity}%`);
    console.log(`  Button parity:  ${buttonParity}%`);
    console.log(`  Image ratio:    ${imgRatio}% (${wpImgCount}/${stitchImgCount})`);
    console.log(`  ${emoji} Overall: ${overallScore}%`);
    
    // Show missing headings
    if (headingParity < 100) {
      const wpHeadingsNorm = wp.headings.map(h => h.toLowerCase());
      const missing = stitch.headings.filter(h => {
        const norm = h.toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, '').trim();
        return !wpHeadingsNorm.some(w => w.includes(norm) || norm.includes(w));
      });
      if (missing.length > 0) {
        console.log(`  ⚠️ Missing headings in WP:`);
        missing.slice(0, 5).forEach(m => console.log(`     - "${m}"`));
      }
    }
    
    results.push({ slug, title: page.title, wpId: page.wp_id, headingParity, buttonParity, imgRatio, overallScore, emoji });
    
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    results.push({ slug, title: page.title, wpId: page.wp_id, overallScore: 0, emoji: '❌', error: err.message });
  }
}

// Summary table
console.log('\n\n' + '═'.repeat(90));
console.log('📊 CONTENT PARITY SUMMARY');
console.log('═'.repeat(90));
console.log('  ' + 'Page'.padEnd(35) + 'ID'.padEnd(7) + 'Headings'.padEnd(11) + 'Buttons'.padEnd(10) + 'Images'.padEnd(10) + 'OVERALL');
console.log('─'.repeat(90));

let totalScore = 0;
for (const r of results) {
  totalScore += r.overallScore || 0;
  console.log(
    '  ' +
    r.title.substring(0, 33).padEnd(35) +
    String(r.wpId).padEnd(7) +
    (r.headingParity !== undefined ? `${r.headingParity}%` : '?').padEnd(11) +
    (r.buttonParity !== undefined ? `${r.buttonParity}%` : '?').padEnd(10) +
    (r.imgRatio !== undefined ? `${r.imgRatio}%` : '?').padEnd(10) +
    `${r.emoji} ${r.overallScore}%`
  );
}
console.log('─'.repeat(90));
console.log(`  AVERAGE PARITY: ${Math.round(totalScore / results.length)}%`);
console.log('═'.repeat(90));
