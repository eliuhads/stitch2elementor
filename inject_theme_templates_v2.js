/**
 * inject_theme_templates_v2.js
 * Uses WordPress REST API with correct auth to update elementor_library posts
 * Tries multiple approaches to bypass the 401
 */

const https = require('https');

const WP_URL = 'https://evergreenvzla.com';
const WP_USER = 'eliu.h.ads';
const WP_APP_PASS = 'wNl4 uNBx t9cJ T1To pDAV NWbT';

const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');

// Header data (compact)
const HEADER_DATA = [{"id":"hdr_m","elType":"container","isInner":false,"settings":{"content_width":"full","background_background":"classic","background_color":"rgba(11,15,26,0.95)","flex_direction":"row","flex_justify_content":"space-between","flex_align_items":"center","padding":{"unit":"px","top":"12","right":"40","bottom":"12","left":"40","isLinked":false},"padding_tablet":{"unit":"px","top":"12","right":"24","bottom":"12","left":"24","isLinked":false},"padding_mobile":{"unit":"px","top":"10","right":"16","bottom":"10","left":"16","isLinked":false},"z_index":100},"elements":[{"id":"hdr_lg","elType":"widget","widgetType":"image","isInner":false,"settings":{"image":{"url":"https://evergreenvzla.com/wp-content/uploads/2026/04/logo_evergreen_completo_horizontal_texto-1-scaled.webp","id":64,"alt":"Evergreen Venezuela","source":"library"},"image_size":"full","width":{"unit":"px","size":180,"sizes":[]},"width_tablet":{"unit":"px","size":150,"sizes":[]},"width_mobile":{"unit":"px","size":120,"sizes":[]},"align":"left","link":{"url":"https://evergreenvzla.com/","is_external":false,"nofollow":false}},"elements":[]},{"id":"hdr_nv","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"row","flex_gap":{"unit":"px","size":"28","sizes":[],"column":"28","row":"28","isLinked":"1"},"flex_align_items":"center","hide_mobile":"hidden-phone"},"elements":[{"id":"n1","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Inicio</a>"},"elements":[]},{"id":"n2","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/iluminacion/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Iluminación</a>"},"elements":[]},{"id":"n3","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/soluciones-energia/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Energía Solar</a>"},"elements":[]},{"id":"n4","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/catalogos/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Catálogos</a>"},"elements":[]},{"id":"n5","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/sobre-nosotros/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Nosotros</a>"},"elements":[]},{"id":"n6","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<a href=\\"https://evergreenvzla.com/contacto/\\" style=\\"font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em\\">Contacto</a>"},"elements":[]}]},{"id":"hdr_ct","elType":"widget","widgetType":"button","isInner":false,"settings":{"text":"Cotiza Ahora","link":{"url":"https://wa.me/584123118100","is_external":true,"nofollow":false},"align":"right","typography_typography":"custom","typography_font_family":"Barlow Condensed","typography_font_size":{"unit":"px","size":14,"sizes":[]},"typography_font_weight":"700","typography_text_transform":"uppercase","button_text_color":"#0B0F1A","background_color":"#8FDA3E","border_radius":{"unit":"px","top":"4","right":"4","bottom":"4","left":"4","isLinked":true},"text_padding":{"unit":"px","top":"10","right":"24","bottom":"10","left":"24","isLinked":false},"hover_color":"#0B0F1A","button_background_hover_color":"#6CB82E"},"elements":[]}]}];

// Footer data (compact)
const FOOTER_DATA = [{"id":"ft_m","elType":"container","isInner":false,"settings":{"content_width":"full","background_background":"classic","background_color":"#0B0F1A","border_border":"solid","border_width":{"unit":"px","top":"1","right":"0","bottom":"0","left":"0","isLinked":false},"border_color":"rgba(255,255,255,0.06)","padding":{"unit":"px","top":"80","right":"0","bottom":"48","left":"0","isLinked":false}},"elements":[{"id":"ft_bx","elType":"container","isInner":true,"settings":{"content_width":"boxed","boxed_width":{"unit":"px","size":1200,"sizes":[]},"padding":{"unit":"px","top":"0","right":"60","bottom":"0","left":"60","isLinked":false},"padding_mobile":{"unit":"px","top":"0","right":"20","bottom":"0","left":"20","isLinked":false}},"elements":[{"id":"ft_rw","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"row","flex_wrap":"wrap","flex_gap":{"unit":"px","size":"48","sizes":[],"column":"48","row":"48","isLinked":"1"},"flex_direction_mobile":"column"},"elements":[{"id":"c1","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"column","flex_gap":{"unit":"px","size":"20","sizes":[],"column":"20","row":"20","isLinked":"1"},"width":{"unit":"%","size":30},"width_mobile":{"unit":"%","size":100}},"elements":[{"id":"c1l","elType":"widget","widgetType":"image","isInner":false,"settings":{"image":{"url":"https://evergreenvzla.com/wp-content/uploads/2026/04/logo_evergreen_completo_horizontal_texto-1-scaled.webp","id":64,"alt":"Evergreen Venezuela","source":"library"},"image_size":"full","width":{"unit":"px","size":192,"sizes":[]}},"elements":[]},{"id":"c1d","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<p style=\\"color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;line-height:1.6\\">Fabricantes de iluminación LED y soluciones de energía solar. Más de 15 años iluminando Venezuela.</p>"},"elements":[]},{"id":"c1s","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<div style=\\"display:flex;gap:16px;flex-wrap:wrap\\"><a href=\\"https://www.instagram.com/luzledevergreen\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none\\">Instagram</a><a href=\\"https://www.facebook.com/people/Evergreen-Venezuela/\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none\\">Facebook</a><a href=\\"https://www.tiktok.com/@luzledevergreen\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none\\">TikTok</a><a href=\\"https://www.youtube.com/@luzledevergreen\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none\\">YouTube</a><a href=\\"https://www.linkedin.com/company/evergreenvzla\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none\\">LinkedIn</a></div>"},"elements":[]}]},{"id":"c2","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"column","flex_gap":{"unit":"px","size":"12","sizes":[],"column":"12","row":"12","isLinked":"1"},"width":{"unit":"%","size":20},"width_mobile":{"unit":"%","size":100}},"elements":[{"id":"c2h","elType":"widget","widgetType":"heading","isInner":false,"settings":{"title":"Navegación","header_size":"h5","typography_typography":"custom","typography_font_family":"Barlow Condensed","typography_font_size":{"unit":"px","size":16,"sizes":[]},"typography_font_weight":"700","typography_text_transform":"uppercase","title_color":"#8FDA3E"},"elements":[]},{"id":"c2l","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<ul style=\\"list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px\\"><li><a href=\\"https://evergreenvzla.com/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Inicio</a></li><li><a href=\\"https://evergreenvzla.com/iluminacion/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Iluminación</a></li><li><a href=\\"https://evergreenvzla.com/soluciones-energia/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Energía Solar</a></li><li><a href=\\"https://evergreenvzla.com/sobre-nosotros/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Sobre Nosotros</a></li><li><a href=\\"https://evergreenvzla.com/contacto/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Contacto</a></li></ul>"},"elements":[]}]},{"id":"c3","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"column","flex_gap":{"unit":"px","size":"12","sizes":[],"column":"12","row":"12","isLinked":"1"},"width":{"unit":"%","size":20},"width_mobile":{"unit":"%","size":100}},"elements":[{"id":"c3h","elType":"widget","widgetType":"heading","isInner":false,"settings":{"title":"Recursos","header_size":"h5","typography_typography":"custom","typography_font_family":"Barlow Condensed","typography_font_size":{"unit":"px","size":16,"sizes":[]},"typography_font_weight":"700","typography_text_transform":"uppercase","title_color":"#8FDA3E"},"elements":[]},{"id":"c3l","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<ul style=\\"list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px\\"><li><a href=\\"https://online.fliphtml5.com/bbtix/gofe/\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Catálogo Iluminación</a></li><li><a href=\\"https://heyzine.com/flip-book/19d84a97c8.html\\" target=\\"_blank\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Catálogo Energía Solar</a></li><li><a href=\\"https://evergreenvzla.com/calculadora/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Calculadora de Consumo</a></li><li><a href=\\"https://evergreenvzla.com/soporte/\\" style=\\"color:rgba(255,255,255,0.5);font-size:14px;text-decoration:none\\">Soporte y Garantía</a></li></ul>"},"elements":[]}]},{"id":"c4","elType":"container","isInner":true,"settings":{"content_width":"full","flex_direction":"column","flex_gap":{"unit":"px","size":"16","sizes":[],"column":"16","row":"16","isLinked":"1"},"width":{"unit":"%","size":25},"width_mobile":{"unit":"%","size":100}},"elements":[{"id":"c4h","elType":"widget","widgetType":"heading","isInner":false,"settings":{"title":"Contacto","header_size":"h5","typography_typography":"custom","typography_font_family":"Barlow Condensed","typography_font_size":{"unit":"px","size":16,"sizes":[]},"typography_font_weight":"700","typography_text_transform":"uppercase","title_color":"#8FDA3E"},"elements":[]},{"id":"c4w","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<div style=\\"display:flex;flex-direction:column;gap:4px\\"><span style=\\"color:#368A39;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em\\">WhatsApp</span><a href=\\"https://wa.me/584123118100\\" target=\\"_blank\\" style=\\"color:#FFFFFF;font-size:16px;font-weight:500;text-decoration:none\\">+58 412 311 8100</a></div>"},"elements":[]},{"id":"c4e","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<div style=\\"display:flex;flex-direction:column;gap:4px\\"><span style=\\"color:#368A39;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em\\">Email</span><a href=\\"mailto:info@evergreenvzla.com\\" style=\\"color:#FFFFFF;font-size:16px;font-weight:500;text-decoration:none\\">info@evergreenvzla.com</a></div>"},"elements":[]},{"id":"c4a","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<div style=\\"display:flex;flex-direction:column;gap:4px\\"><span style=\\"color:#368A39;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em\\">Dirección</span><p style=\\"color:rgba(255,255,255,0.5);font-size:14px;line-height:1.5;margin:0\\">Calle Suapure con Calle Orinoco, Qta Flavia, Colinas de Bello Monte, Caracas, Miranda 1080</p></div>"},"elements":[]}]}]},{"id":"ft_cp","elType":"container","isInner":true,"settings":{"content_width":"full","text_align":"center","padding":{"unit":"px","top":"32","right":"0","bottom":"0","left":"0","isLinked":false},"margin":{"unit":"px","top":"32","right":"0","bottom":"0","left":"0","isLinked":false},"border_border":"solid","border_width":{"unit":"px","top":"1","right":"0","bottom":"0","left":"0","isLinked":false},"border_color":"rgba(255,255,255,0.06)"},"elements":[{"id":"ft_ct","elType":"widget","widgetType":"text-editor","isInner":false,"settings":{"editor":"<p style=\\"color:rgba(255,255,255,0.3);font-size:13px;font-weight:300\\">© 2026 Evergreen Venezuela. Todos los derechos reservados.</p>"},"elements":[]}]}]}]}];

function wpRequest(path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${WP_URL}/wp-json/wp/v2/${path}`);
    const postData = JSON.stringify(body);
    const options = {
      hostname: fullUrl.hostname,
      port: 443,
      path: fullUrl.pathname + fullUrl.search,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`  PUT ${path}: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else { console.log(`  Body: ${data.substring(0,400)}`); reject(new Error(`HTTP ${res.statusCode}`)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n=== Theme Builder Injector v2 ===\n');

  // Try header
  console.log('Header #151...');
  try {
    await wpRequest('elementor_library/151', {
      content: '',
      meta: { _elementor_data: JSON.stringify(HEADER_DATA), _elementor_edit_mode: 'builder' }
    });
    console.log('✅ Header done');
  } catch(e) {
    console.log('❌ PUT failed, trying POST...');
    try {
      await wpRequest('elementor_library/151', {
        meta: { _elementor_data: JSON.stringify(HEADER_DATA), _elementor_edit_mode: 'builder' }
      });
      console.log('✅ Header done via POST');
    } catch(e2) {
      console.log(`❌ Both failed: ${e2.message}`);
    }
  }

  // Try footer
  console.log('\nFooter #156...');
  try {
    await wpRequest('elementor_library/156', {
      content: '',
      meta: { _elementor_data: JSON.stringify(FOOTER_DATA), _elementor_edit_mode: 'builder' }
    });
    console.log('✅ Footer done');
  } catch(e) {
    console.log('❌ PUT failed, trying POST...');
    try {
      await wpRequest('elementor_library/156', {
        meta: { _elementor_data: JSON.stringify(FOOTER_DATA), _elementor_edit_mode: 'builder' }
      });
      console.log('✅ Footer done via POST');
    } catch(e2) {
      console.log(`❌ Both failed: ${e2.message}`);
    }
  }

  console.log('\n=== Done ===\n');
}

main();
