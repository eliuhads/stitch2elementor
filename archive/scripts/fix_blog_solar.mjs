#!/usr/bin/env node
/**
 * fix_blog_solar.mjs
 * Fix page 1664 (Blog) solar references using raw postmeta approach
 */
import 'dotenv/config';

const WP_URL  = process.env.WP_URL || process.env.WP_BASE_URL;
const WP_USER = process.env.WP_USER;
const WP_PASS = process.env.WP_APP_PASSWORD?.replace(/"/g, '');
const AUTH = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const headers = { 'Authorization': AUTH, 'Content-Type': 'application/json' };

async function main() {
  console.log('━━━ Fixing Page 1664 (Blog) — Solar References ━━━\n');

  // 1. Get the page with elementor data
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/pages/1664?context=edit`, { headers });
  const page = await r.json();
  let data = page.meta._elementor_data;

  if (!data) { console.error('No _elementor_data'); process.exit(1); }

  // 2. Apply string replacements directly on the JSON string
  const replacements = [
    ['SOLAR TECH', 'LED TECH'],
    ['estaciones de carga solar autosustentables para operaciones petroleras de alta precisión',
     'sistemas de iluminación LED inteligente para operaciones petroleras de alta precisión'],
    ['Mantenimiento Predictivo con IA en Sistemas Fotovoltaicos',
     'Mantenimiento Predictivo con IA en Sistemas de Iluminación LED'],
    ['inversores industriales en climas tropicales',
     'luminarias LED industriales en climas tropicales'],
  ];

  let changes = 0;
  for (const [from, to] of replacements) {
    if (data.includes(from)) {
      data = data.replaceAll(from, to);
      changes++;
      console.log(`✏️  "${from}" → "${to}"`);
    }
  }

  if (changes === 0) {
    console.log('✓ No changes needed.');
    return;
  }

  // 3. Try updating via meta
  console.log(`\nAttempting save via meta (${changes} changes)...`);
  let resp = await fetch(`${WP_URL}/wp-json/wp/v2/pages/1664`, {
    method: 'POST', headers,
    body: JSON.stringify({ meta: { _elementor_data: data } })
  });

  if (resp.ok) {
    console.log('✅ Saved via meta!');
    return;
  }

  // 4. Fallback: try updating via postmeta endpoint if available
  console.log('Meta update blocked. Trying raw postmeta approach...');

  // Try updating with content field (which triggers Elementor rebuild)
  // Parse the elementor JSON, build simple HTML from text widgets
  const parsed = JSON.parse(data);

  // Re-serialize and try with a different approach
  resp = await fetch(`${WP_URL}/wp-json/wp/v2/pages/1664`, {
    method: 'POST', headers,
    body: JSON.stringify({
      meta: {
        _elementor_data: data,
        _elementor_edit_mode: 'builder'
      }
    })
  });

  if (resp.ok) {
    console.log('✅ Saved with edit_mode!');
    return;
  }

  const errBody = await resp.text();
  console.log(`Status: ${resp.status}`);
  console.log(`Response: ${errBody.slice(0, 500)}`);

  // 5. Last resort: FTP approach
  console.log('\n⚠️  REST API blocks _elementor_data writes for this page.');
  console.log('Writing corrected data to file for manual import...');

  const fs = await import('fs');
  fs.writeFileSync('temp/blog_1664_fixed_elementor_data.json', data);
  console.log('📁 Saved to temp/blog_1664_fixed_elementor_data.json');
  console.log('   Use Elementor Import or direct DB update to apply.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
