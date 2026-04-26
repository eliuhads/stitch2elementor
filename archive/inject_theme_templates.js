/**
 * inject_theme_templates.js
 * Injects header and footer data into the REAL Elementor Theme Builder templates
 * Header: #151 (elementor_library)
 * Footer: #156 (elementor_library)
 */

const https = require('https');
const url = require('url');

// WordPress credentials (same as MCP config)
require('dotenv').config();
const WP_URL = process.env.WP_BASE_URL;
if (!WP_URL) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
const AUTH = Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`).toString('base64');

// ═══════════════════════════════════════
// HEADER DATA (ID=151)
// ═══════════════════════════════════════
const HEADER_DATA = [
  {
    id: "hdr_main",
    elType: "container",
    isInner: false,
    settings: {
      content_width: "full",
      background_background: "classic",
      background_color: "rgba(11,15,26,0.95)",
      flex_direction: "row",
      flex_justify_content: "space-between",
      flex_align_items: "center",
      padding: { unit: "px", top: "12", right: "40", bottom: "12", left: "40", isLinked: false },
      padding_tablet: { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false },
      padding_mobile: { unit: "px", top: "10", right: "16", bottom: "10", left: "16", isLinked: false },
      z_index: 100
    },
    elements: [
      {
        id: "hdr_logo_w",
        elType: "widget",
        widgetType: "image",
        isInner: false,
        settings: {
          image: {
            url: "https://evergreenvzla.com/wp-content/uploads/2026/04/logo_evergreen_completo_horizontal_texto-1-scaled.webp",
            id: 64,
            alt: "Evergreen Venezuela",
            source: "library"
          },
          image_size: "full",
          width: { unit: "px", size: 180, sizes: [] },
          width_tablet: { unit: "px", size: 150, sizes: [] },
          width_mobile: { unit: "px", size: 120, sizes: [] },
          align: "left",
          link: { url: "https://evergreenvzla.com/", is_external: false, nofollow: false }
        },
        elements: []
      },
      {
        id: "hdr_nav_c",
        elType: "container",
        isInner: true,
        settings: {
          content_width: "full",
          flex_direction: "row",
          flex_gap: { unit: "px", size: "28", sizes: [], column: "28", row: "28", isLinked: "1" },
          flex_align_items: "center",
          hide_mobile: "hidden-phone"
        },
        elements: [
          { id: "nav_01", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Inicio</a>' },
            elements: [] },
          { id: "nav_02", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/iluminacion/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Iluminación</a>' },
            elements: [] },
          { id: "nav_03", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/soluciones-energia/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Energía Solar</a>' },
            elements: [] },
          { id: "nav_04", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/catalogos/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Catálogos</a>' },
            elements: [] },
          { id: "nav_05", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/sobre-nosotros/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Nosotros</a>' },
            elements: [] },
          { id: "nav_06", elType: "widget", widgetType: "text-editor", isInner: false,
            settings: { editor: '<a href="https://evergreenvzla.com/contacto/" style="font-family:Barlow,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em">Contacto</a>' },
            elements: [] }
        ]
      },
      {
        id: "hdr_cta_w",
        elType: "widget",
        widgetType: "button",
        isInner: false,
        settings: {
          text: "Cotiza Ahora",
          link: { url: "https://wa.me/584123118100", is_external: true, nofollow: false },
          align: "right",
          typography_typography: "custom",
          typography_font_family: "Barlow Condensed",
          typography_font_size: { unit: "px", size: 14, sizes: [] },
          typography_font_weight: "700",
          typography_text_transform: "uppercase",
          typography_letter_spacing: { unit: "px", size: 0.5, sizes: [] },
          button_text_color: "#0B0F1A",
          background_color: "#8FDA3E",
          border_radius: { unit: "px", top: "4", right: "4", bottom: "4", left: "4", isLinked: true },
          text_padding: { unit: "px", top: "10", right: "24", bottom: "10", left: "24", isLinked: false },
          hover_color: "#0B0F1A",
          button_background_hover_color: "#6CB82E"
        },
        elements: []
      }
    ]
  }
];

// ═══════════════════════════════════════
// FOOTER DATA (ID=156)
// ═══════════════════════════════════════
const FOOTER_DATA = [
  {
    id: "ftr_main",
    elType: "container",
    isInner: false,
    settings: {
      content_width: "full",
      background_background: "classic",
      background_color: "#0B0F1A",
      border_border: "solid",
      border_width: { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false },
      border_color: "rgba(255,255,255,0.06)",
      padding: { unit: "px", top: "80", right: "0", bottom: "48", left: "0", isLinked: false },
      padding_tablet: { unit: "px", top: "64", right: "0", bottom: "32", left: "0", isLinked: false },
      padding_mobile: { unit: "px", top: "48", right: "0", bottom: "24", left: "0", isLinked: false }
    },
    elements: [
      {
        id: "ftr_box",
        elType: "container",
        isInner: true,
        settings: {
          content_width: "boxed",
          boxed_width: { unit: "px", size: 1200, sizes: [] },
          padding: { unit: "px", top: "0", right: "60", bottom: "0", left: "60", isLinked: false },
          padding_tablet: { unit: "px", top: "0", right: "40", bottom: "0", left: "40", isLinked: false },
          padding_mobile: { unit: "px", top: "0", right: "20", bottom: "0", left: "20", isLinked: false }
        },
        elements: [
          {
            id: "ftr_row",
            elType: "container",
            isInner: true,
            settings: {
              content_width: "full",
              flex_direction: "row",
              flex_wrap: "wrap",
              flex_gap: { unit: "px", size: "48", sizes: [], column: "48", row: "48", isLinked: "1" },
              flex_direction_mobile: "column",
              width: { unit: "%", size: 100 }
            },
            elements: [
              // COL 1 — Logo + Desc + Social
              {
                id: "fc1_wrap",
                elType: "container",
                isInner: true,
                settings: { content_width: "full", flex_direction: "column", flex_gap: { unit: "px", size: "20", sizes: [], column: "20", row: "20", isLinked: "1" }, width: { unit: "%", size: 30 }, width_mobile: { unit: "%", size: 100 } },
                elements: [
                  { id: "fc1_logo", elType: "widget", widgetType: "image", isInner: false,
                    settings: { image: { url: "https://evergreenvzla.com/wp-content/uploads/2026/04/logo_evergreen_completo_horizontal_texto-1-scaled.webp", id: 64, alt: "Evergreen Venezuela Logo", source: "library" }, image_size: "full", width: { unit: "px", size: 192, sizes: [] } }, elements: [] },
                  { id: "fc1_desc", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<p style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;line-height:1.6">Fabricantes de iluminación LED y soluciones de energía solar. Más de 15 años iluminando Venezuela.</p>' }, elements: [] },
                  { id: "fc1_soc", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<div style="display:flex;gap:16px;flex-wrap:wrap"><a href="https://www.instagram.com/luzledevergreen" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:13px;text-decoration:none">Instagram</a><a href="https://www.facebook.com/people/Evergreen-Venezuela/" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:13px;text-decoration:none">Facebook</a><a href="https://www.tiktok.com/@luzledevergreen" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:13px;text-decoration:none">TikTok</a><a href="https://www.youtube.com/@luzledevergreen" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:13px;text-decoration:none">YouTube</a><a href="https://www.linkedin.com/company/evergreenvzla" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:13px;text-decoration:none">LinkedIn</a></div>' }, elements: [] }
                ]
              },
              // COL 2 — Navegación
              {
                id: "fc2_wrap",
                elType: "container",
                isInner: true,
                settings: { content_width: "full", flex_direction: "column", flex_gap: { unit: "px", size: "12", sizes: [], column: "12", row: "12", isLinked: "1" }, width: { unit: "%", size: 20 }, width_mobile: { unit: "%", size: 100 } },
                elements: [
                  { id: "fc2_hd", elType: "widget", widgetType: "heading", isInner: false,
                    settings: { title: "Navegación", header_size: "h5", typography_typography: "custom", typography_font_family: "Barlow Condensed", typography_font_size: { unit: "px", size: 16, sizes: [] }, typography_font_weight: "700", typography_text_transform: "uppercase", typography_letter_spacing: { unit: "px", size: 0.5, sizes: [] }, title_color: "#8FDA3E" }, elements: [] },
                  { id: "fc2_lnk", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"><li><a href="https://evergreenvzla.com/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Inicio</a></li><li><a href="https://evergreenvzla.com/iluminacion/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Iluminación</a></li><li><a href="https://evergreenvzla.com/soluciones-energia/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Energía Solar</a></li><li><a href="https://evergreenvzla.com/sobre-nosotros/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Sobre Nosotros</a></li><li><a href="https://evergreenvzla.com/contacto/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Contacto</a></li></ul>' }, elements: [] }
                ]
              },
              // COL 3 — Recursos
              {
                id: "fc3_wrap",
                elType: "container",
                isInner: true,
                settings: { content_width: "full", flex_direction: "column", flex_gap: { unit: "px", size: "12", sizes: [], column: "12", row: "12", isLinked: "1" }, width: { unit: "%", size: 20 }, width_mobile: { unit: "%", size: 100 } },
                elements: [
                  { id: "fc3_hd", elType: "widget", widgetType: "heading", isInner: false,
                    settings: { title: "Recursos", header_size: "h5", typography_typography: "custom", typography_font_family: "Barlow Condensed", typography_font_size: { unit: "px", size: 16, sizes: [] }, typography_font_weight: "700", typography_text_transform: "uppercase", typography_letter_spacing: { unit: "px", size: 0.5, sizes: [] }, title_color: "#8FDA3E" }, elements: [] },
                  { id: "fc3_lnk", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px"><li><a href="https://online.fliphtml5.com/bbtix/gofe/" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Catálogo Iluminación</a></li><li><a href="https://heyzine.com/flip-book/19d84a97c8.html" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Catálogo Energía Solar</a></li><li><a href="https://evergreenvzla.com/calculadora/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Calculadora de Consumo</a></li><li><a href="https://evergreenvzla.com/soporte/" style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;text-decoration:none">Soporte y Garantía</a></li></ul>' }, elements: [] }
                ]
              },
              // COL 4 — Contacto
              {
                id: "fc4_wrap",
                elType: "container",
                isInner: true,
                settings: { content_width: "full", flex_direction: "column", flex_gap: { unit: "px", size: "16", sizes: [], column: "16", row: "16", isLinked: "1" }, width: { unit: "%", size: 25 }, width_mobile: { unit: "%", size: 100 } },
                elements: [
                  { id: "fc4_hd", elType: "widget", widgetType: "heading", isInner: false,
                    settings: { title: "Contacto", header_size: "h5", typography_typography: "custom", typography_font_family: "Barlow Condensed", typography_font_size: { unit: "px", size: 16, sizes: [] }, typography_font_weight: "700", typography_text_transform: "uppercase", typography_letter_spacing: { unit: "px", size: 0.5, sizes: [] }, title_color: "#8FDA3E" }, elements: [] },
                  { id: "fc4_wa", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<div style="display:flex;flex-direction:column;gap:4px"><span style="color:#368A39;font-family:Barlow Condensed,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">WhatsApp</span><a href="https://wa.me/584123118100" target="_blank" rel="noopener" style="color:#FFFFFF;font-family:Barlow,sans-serif;font-size:16px;font-weight:500;text-decoration:none">+58 412 311 8100</a></div>' }, elements: [] },
                  { id: "fc4_em", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<div style="display:flex;flex-direction:column;gap:4px"><span style="color:#368A39;font-family:Barlow Condensed,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Email</span><a href="mailto:info@evergreenvzla.com" style="color:#FFFFFF;font-family:Barlow,sans-serif;font-size:16px;font-weight:500;text-decoration:none">info@evergreenvzla.com</a></div>' }, elements: [] },
                  { id: "fc4_ad", elType: "widget", widgetType: "text-editor", isInner: false,
                    settings: { editor: '<div style="display:flex;flex-direction:column;gap:4px"><span style="color:#368A39;font-family:Barlow Condensed,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Dirección</span><p style="color:rgba(255,255,255,0.5);font-family:Barlow,sans-serif;font-size:14px;line-height:1.5;margin:0">Calle Suapure con Calle Orinoco, Qta Flavia, Colinas de Bello Monte, Caracas, Miranda 1080</p></div>' }, elements: [] }
                ]
              }
            ]
          },
          // Copyright row
          {
            id: "ftr_copy_r",
            elType: "container",
            isInner: true,
            settings: {
              content_width: "full",
              text_align: "center",
              padding: { unit: "px", top: "32", right: "0", bottom: "0", left: "0", isLinked: false },
              margin: { unit: "px", top: "32", right: "0", bottom: "0", left: "0", isLinked: false },
              border_border: "solid",
              border_width: { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false },
              border_color: "rgba(255,255,255,0.06)"
            },
            elements: [
              { id: "ftr_copy_t", elType: "widget", widgetType: "text-editor", isInner: false,
                settings: { editor: '<p style="color:rgba(255,255,255,0.3);font-family:Barlow,sans-serif;font-size:13px;font-weight:300">© 2026 Evergreen Venezuela. Todos los derechos reservados.</p>' }, elements: [] }
            ]
          }
        ]
      }
    ]
  }
];

// ═══════════════════════════════════════
// REST API FUNCTION
// ═══════════════════════════════════════
function wpApiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(`${WP_URL}/wp-json/wp/v2/${path}`);
    const postData = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.path,
      method: method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  → ${method} ${path}: HTTP ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          console.error(`  ❌ Error body: ${data.substring(0, 300)}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Elementor Theme Builder Template Injector');
  console.log('  Header: #151 | Footer: #156');
  console.log('═══════════════════════════════════════\n');

  // Update HEADER #151
  console.log('📌 Updating Header Template #151...');
  try {
    await wpApiCall('POST', 'elementor_library/151', {
      meta: {
        _elementor_data: JSON.stringify(HEADER_DATA),
        _elementor_edit_mode: 'builder',
        _elementor_template_type: 'header'
      }
    });
    console.log('  ✅ Header #151 updated!\n');
  } catch (e) {
    console.error(`  ❌ Header failed: ${e.message}\n`);
  }

  // Update FOOTER #156
  console.log('📌 Updating Footer Template #156...');
  try {
    await wpApiCall('POST', 'elementor_library/156', {
      meta: {
        _elementor_data: JSON.stringify(FOOTER_DATA),
        _elementor_edit_mode: 'builder',
        _elementor_template_type: 'footer'
      }
    });
    console.log('  ✅ Footer #156 updated!\n');
  } catch (e) {
    console.error(`  ❌ Footer failed: ${e.message}\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('  DONE! Now go to WP Admin:');
  console.log('  Elementor → Tools → Regenerate Files & Data');
  console.log('═══════════════════════════════════════');
}

main().catch(console.error);
