/**
 * Fix WordPress page slugs to match page_manifest.json
 * Uses WP REST API with Application Password auth
 */
const https = require('https');

require('dotenv').config();
const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

// Map from manifest: wp_id → desired slug
const SLUG_FIXES = [
  { id: 77, slug: 'soluciones-energia', title: 'Soluciones de Energía' },
  { id: 78, slug: 'estaciones-energia', title: 'Estaciones de Energía Portátiles' },
  { id: 79, slug: 'respaldo-residencial', title: 'Respaldo Energético Residencial' },
  { id: 80, slug: 'respaldo-comercial', title: 'Respaldo Energético Comercial' },
  { id: 84, slug: 'iluminacion-solar', title: 'Iluminación LED Solar' },
  { id: 87, slug: 'calculadora', title: 'Calculadora de Consumo' },
  { id: 93, slug: 'soporte', title: 'Soporte y Garantía' },
  { id: 94, slug: 'privacidad', title: 'Política de Privacidad' },
  { id: 95, slug: 'cookies', title: 'Política de Cookies' },
];

function wpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${WP_URL}/wp-json/wp/v2${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 EvergreenBot/1.0',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🔧 Fixing slugs for Evergreen pages...\n');

  for (const fix of SLUG_FIXES) {
    // First check current slug
    const getCurrent = await wpRequest('GET', `/pages/${fix.id}?_fields=id,slug,title`);
    const currentSlug = getCurrent.data?.slug || 'unknown';
    
    if (currentSlug === fix.slug) {
      console.log(`✅ ID ${fix.id} — slug already correct: "${fix.slug}"`);
      continue;
    }
    
    console.log(`🔄 ID ${fix.id} — "${currentSlug}" → "${fix.slug}"`);
    
    const result = await wpRequest('POST', `/pages/${fix.id}`, { slug: fix.slug });
    
    if (result.status === 200) {
      console.log(`   ✅ Updated! New URL: ${WP_URL}/${result.data.slug}/`);
    } else {
      console.log(`   ❌ Error (${result.status}): ${JSON.stringify(result.data?.message || result.data).substring(0, 200)}`);
    }
  }
  
  console.log('\n✅ Slug fix complete!');
}

main().catch(console.error);
