/**
 * audit_stitch_images.js
 * Scans all Elementor JSON files and reports every lh3.googleusercontent.com URL.
 * Groups by file an outputs a summary with context (widget type, alt text).
 */
const fs = require('fs');
const path = require('path');

const JSON_DIR = path.join(__dirname, 'elementor_json');
const report = [];
let totalImages = 0;

function scanElement(element, filePath, results) {
  if (!element) return;

  // Image widget
  if (element.widgetType === 'image' && element.settings && element.settings.image) {
    const url = element.settings.image.url || '';
    if (url.includes('lh3.googleusercontent.com')) {
      results.push({
        widgetId: element.id,
        widgetType: 'image',
        alt: element.settings.image.alt || '(no alt)',
        url: url.substring(0, 100) + '...',
        fullUrl: url
      });
      totalImages++;
    }
  }

  // Background image on containers
  if (element.settings && element.settings.background_image && element.settings.background_image.url) {
    const bgUrl = element.settings.background_image.url;
    if (bgUrl.includes('lh3.googleusercontent.com')) {
      results.push({
        widgetId: element.id,
        widgetType: element.elType + ' (background)',
        alt: '(background)',
        url: bgUrl.substring(0, 100) + '...',
        fullUrl: bgUrl
      });
      totalImages++;
    }
  }

  // HTML widget inline images
  if (element.widgetType === 'html' && element.settings && element.settings.html) {
    const htmlContent = element.settings.html;
    const imgMatches = htmlContent.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g) || [];
    for (const imgUrl of imgMatches) {
      results.push({
        widgetId: element.id,
        widgetType: 'html (inline)',
        alt: '(inline in HTML)',
        url: imgUrl.substring(0, 100) + '...',
        fullUrl: imgUrl
      });
      totalImages++;
    }
  }

  // Text editor widget inline images
  if (element.widgetType === 'text-editor' && element.settings && element.settings.editor) {
    const editorContent = element.settings.editor;
    const imgMatches = editorContent.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\]+/g) || [];
    for (const imgUrl of imgMatches) {
      results.push({
        widgetId: element.id,
        widgetType: 'text-editor (inline img)',
        alt: '(inline in editor)',
        url: imgUrl.substring(0, 100) + '...',
        fullUrl: imgUrl
      });
      totalImages++;
    }
  }

  // Recurse
  if (element.elements && Array.isArray(element.elements)) {
    for (const child of element.elements) {
      scanElement(child, filePath, results);
    }
  }
}

// Main
console.log('🔍 Auditing Stitch temporary images in Elementor JSONs...\n');

const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
for (const file of files) {
  const filePath = path.join(JSON_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.log(`⚠ Skipping ${file} — invalid JSON`);
    continue;
  }

  const results = [];
  if (Array.isArray(data)) {
    for (const el of data) {
      scanElement(el, filePath, results);
    }
  }

  if (results.length > 0) {
    report.push({ file, count: results.length, images: results });
  }
}

// Output
console.log('═══════════════════════════════════════════════');
console.log(`📊 TOTAL: ${totalImages} temporary Stitch images across ${report.length} files`);
console.log('═══════════════════════════════════════════════\n');

for (const entry of report) {
  console.log(`📄 ${entry.file} — ${entry.count} image(s)`);
  for (let i = 0; i < entry.images.length; i++) {
    const img = entry.images[i];
    console.log(`   ${i + 1}. [${img.widgetType}] alt="${img.alt}"`);
    console.log(`      ID: ${img.widgetId}`);
  }
  console.log('');
}

// Save full report as JSON for next step
const reportPath = path.join(__dirname, 'stitch_images_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`\n💾 Full report saved to: stitch_images_report.json`);
