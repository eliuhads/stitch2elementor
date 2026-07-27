const https = require('https');
require('dotenv').config();
const WP_HOST = new URL(process.env.WP_BASE_URL || '').hostname;
if (!WP_HOST) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

// Sample pages to verify
const PAGES = [
  1103, // Homepage
  1107, // LED Industrial
  1113, // Sobre Nosotros
  1114, // Contacto
  1118, // Garantia
  1122, // Terminos
];

// Templates
const TEMPLATES = [1149, 1150];

function getPage(id) {
  return new Promise((resolve) => {
    https.get({
      hostname: WP_HOST,
      path: '/wp-json/wp/v2/pages/' + id,
      headers: { 'Authorization': 'Basic ' + AUTH }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve({
            id,
            title: (j.title && j.title.rendered) || '?',
            status: j.status || '?',
            slug: j.slug || '?',
            contentLen: (j.content && j.content.rendered && j.content.rendered.length) || 0,
            hasElementor: j.meta && j.meta._elementor_edit_mode === 'builder'
          });
        } catch (e) {
          resolve({ id, error: 'HTTP ' + r.statusCode });
        }
      });
    });
  });
}

function getTemplate(id) {
  return new Promise((resolve) => {
    https.get({
      hostname: WP_HOST,
      path: '/wp-json/wp/v2/elementor_library/' + id,
      headers: { 'Authorization': 'Basic ' + AUTH }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve({
            id,
            title: (j.title && j.title.rendered) || '?',
            status: j.status || '?',
            type: (j.meta && j.meta._elementor_template_type) || '?',
            contentLen: (j.content && j.content.rendered && j.content.rendered.length) || 0
          });
        } catch (e) {
          resolve({ id, error: 'HTTP ' + r.statusCode });
        }
      });
    });
  });
}

async function main() {
  console.log('=== PAGES VERIFICATION ===');
  console.log('ID     | Title                          | Status  | Content  | Elementor');
  console.log('-------|--------------------------------|---------|----------|----------');
  
  for (const id of PAGES) {
    const p = await getPage(id);
    if (p.error) {
      console.log(id + '  | ERROR: ' + p.error);
    } else {
      const title = (p.title || '').substring(0, 30).padEnd(30);
      const status = (p.status || '').padEnd(7);
      const content = String(p.contentLen).padStart(6) + 'ch';
      const elem = p.hasElementor ? 'YES' : 'NO';
      console.log(p.id + '  | ' + title + ' | ' + status + ' | ' + content + ' | ' + elem);
    }
  }

  console.log('\n=== TEMPLATES VERIFICATION ===');
  for (const id of TEMPLATES) {
    const t = await getTemplate(id);
    if (t.error) {
      console.log(id + ' | ERROR: ' + t.error);
    } else {
      console.log(t.id + ' | ' + t.title + ' | ' + t.status + ' | type:' + t.type + ' | ' + t.contentLen + 'ch');
    }
  }

  // Check front page setting
  console.log('\n=== FRONT PAGE SETTING ===');
  https.get({
    hostname: WP_HOST,
    path: '/wp-json/wp/v2/settings',
    headers: { 'Authorization': 'Basic ' + AUTH }
  }, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const s = JSON.parse(d);
        console.log('show_on_front:', s.show_on_front);
        console.log('page_on_front:', s.page_on_front);
        console.log('page_for_posts:', s.page_for_posts);
      } catch (e) {
        console.log('Settings error:', r.statusCode);
      }
    });
  });
}

main().catch(console.error);
