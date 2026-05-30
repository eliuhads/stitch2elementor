/**
 * scripts/append_homepage_sections.mjs
 * Appends the two missing native Elementor sections (Líneas de Producto and CTA Final)
 * to elementor_jsons/homepage.json.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const jsonPath = path.join(ROOT, 'elementor_jsons/homepage.json');

// Generate a random 8-character hex ID
function genId() {
  return crypto.randomBytes(4).toString('hex');
}

console.log('━━━ Append Sections to Homepage JSON ━━━\n');

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ homepage.json not found at: ${jsonPath}`);
  process.exit(1);
}

const homepage = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`Original homepage has ${homepage.length} root elements.`);

// Generate unique IDs for all elements to prevent collisions
const ids = {
  sec3: genId(),
  sec3_boxed: genId(),
  sec3_title_con: genId(),
  sec3_h2: genId(),
  sec3_sub: genId(),
  sec3_grid: genId(),
  
  card1: genId(),
  card1_icon_con: genId(),
  card1_icon: genId(),
  card1_h3: genId(),
  card1_p: genId(),
  card1_link: genId(),
  
  card2: genId(),
  card2_icon_con: genId(),
  card2_icon: genId(),
  card2_h3: genId(),
  card2_p: genId(),
  card2_link: genId(),
  
  sec4: genId(),
  sec4_boxed: genId(),
  sec4_h2: genId(),
  sec4_btns: genId(),
  sec4_btn_cat: genId(),
  sec4_btn_wa: genId()
};

// Section 3: Líneas de Producto (Product Lines)
const section3 = {
  id: ids.sec3,
  elType: 'container',
  isInner: false,
  settings: {
    content_width: 'full',
    background_background: 'classic',
    background_color: '#F5F7FA', // Snow bg
    padding: {
      unit: 'px',
      top: '96',
      right: '0',
      bottom: '96',
      left: '0',
      isLinked: false
    },
    padding_tablet: {
      unit: 'px',
      top: '64',
      right: '0',
      bottom: '64',
      left: '0',
      isLinked: false
    },
    padding_mobile: {
      unit: 'px',
      top: '40',
      right: '0',
      bottom: '40',
      left: '0',
      isLinked: false
    }
  },
  elements: [
    {
      id: ids.sec3_boxed,
      elType: 'container',
      isInner: true,
      settings: {
        content_width: 'boxed',
        boxed_width: {
          unit: 'px',
          size: 1200,
          sizes: []
        },
        flex_direction: 'column',
        flex_gap: {
          unit: 'px',
          size: '48',
          column: '48',
          row: '48',
          isLinked: true
        }
      },
      elements: [
        // Title Container
        {
          id: ids.sec3_title_con,
          elType: 'container',
          isInner: true,
          settings: {
            flex_direction: 'column',
            flex_align_items: 'center',
            text_align: 'center',
            flex_gap: {
              unit: 'px',
              size: '8',
              column: '8',
              row: '8',
              isLinked: true
            }
          },
          elements: [
            {
              id: ids.sec3_h2,
              elType: 'widget',
              widgetType: 'heading',
              isInner: false,
              settings: {
                title: 'Líneas de Producto',
                header_size: 'h2',
                align: 'center',
                title_color: '#1A1A2E',
                typography_typography: 'custom',
                typography_font_family: 'Montserrat',
                typography_font_weight: '700'
              },
              elements: []
            },
            {
              id: ids.sec3_sub,
              elType: 'widget',
              widgetType: 'text-editor',
              isInner: false,
              settings: {
                editor: '<p style="text-align: center; color: #4B5563; font-size: 16px; margin: 0;">Tecnología adaptada a las necesidades energéticas actuales.</p>'
              },
              elements: []
            }
          ]
        },
        // Grid Container
        {
          id: ids.sec3_grid,
          elType: 'container',
          isInner: true,
          settings: {
            flex_direction: 'row',
            flex_wrap: 'wrap',
            flex_direction_mobile: 'column',
            flex_gap: {
              unit: 'px',
              size: '32',
              column: '32',
              row: '32',
              isLinked: true
            },
            content_width: 'full'
          },
          elements: [
            // Card 1: Convencional LED
            {
              id: ids.card1,
              elType: 'container',
              isInner: true,
              settings: {
                flex_direction: 'column',
                flex_gap: {
                  unit: 'px',
                  size: '20',
                  column: '20',
                  row: '20',
                  isLinked: true
                },
                padding: {
                  unit: 'px',
                  top: '40',
                  right: '40',
                  bottom: '40',
                  left: '40',
                  isLinked: true
                },
                _element_width: 'custom',
                width: {
                  unit: '%',
                  size: 48.5,
                  sizes: []
                },
                width_tablet: {
                  unit: '%',
                  size: 100,
                  sizes: []
                },
                width_mobile: {
                  unit: '%',
                  size: 100,
                  sizes: []
                },
                background_background: 'classic',
                background_color: '#FFFFFF',
                border_radius: {
                  unit: 'px',
                  top: '16',
                  right: '16',
                  bottom: '16',
                  left: '16',
                  isLinked: true
                },
                border_border: 'solid',
                border_width: {
                  unit: 'px',
                  top: '1',
                  right: '1',
                  bottom: '1',
                  left: '1',
                  isLinked: true
                },
                border_color: '#E5E7EB',
                css_classes: 'evergreen-card'
              },
              elements: [
                // Icon Con
                {
                  id: ids.card1_icon_con,
                  elType: 'container',
                  isInner: true,
                  settings: {
                    width: {
                      unit: 'px',
                      size: 64,
                      sizes: []
                    },
                    height: {
                      unit: 'px',
                      size: 64,
                      sizes: []
                    },
                    background_background: 'classic',
                    background_color: 'rgba(29, 138, 67, 0.1)',
                    border_radius: {
                      unit: 'px',
                      top: '9999',
                      right: '9999',
                      bottom: '9999',
                      left: '9999',
                      isLinked: true
                    },
                    flex_align_items: 'center',
                    flex_justify_content: 'center',
                    css_classes: 'evergreen-card-icon-wrapper'
                  },
                  elements: [
                    {
                      id: ids.card1_icon,
                      elType: 'widget',
                      widgetType: 'text-editor',
                      isInner: false,
                      settings: {
                        editor: '<span class="material-symbols-outlined" style="font-size: 32px; color: #1D8A43; display: block; text-align: center;">lightbulb</span>'
                      },
                      elements: []
                    }
                  ]
                },
                {
                  id: ids.card1_h3,
                  elType: 'widget',
                  widgetType: 'heading',
                  isInner: false,
                  settings: {
                    title: 'Línea Convencional LED',
                    header_size: 'h3',
                    title_color: '#1A1A2E',
                    typography_typography: 'custom',
                    typography_font_family: 'Montserrat',
                    typography_font_weight: '700'
                  },
                  elements: []
                },
                {
                  id: ids.card1_p,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0;">Iluminación eficiente para espacios conectados a la red eléctrica. Alto rendimiento y durabilidad superior.</p>'
                  },
                  elements: []
                },
                {
                  id: ids.card1_link,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<a href="/iluminacion-led-convencional" style="display: inline-flex; align-items: center; color: #1D8A43; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 13px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Explorar línea <span class="material-symbols-outlined" style="font-size: 16px; margin-left: 8px;">arrow_forward</span></a>'
                  },
                  elements: []
                }
              ]
            },
            // Card 2: Autónoma Solar
            {
              id: ids.card2,
              elType: 'container',
              isInner: true,
              settings: {
                flex_direction: 'column',
                flex_gap: {
                  unit: 'px',
                  size: '20',
                  column: '20',
                  row: '20',
                  isLinked: true
                },
                padding: {
                  unit: 'px',
                  top: '40',
                  right: '40',
                  bottom: '40',
                  left: '40',
                  isLinked: true
                },
                _element_width: 'custom',
                width: {
                  unit: '%',
                  size: 48.5,
                  sizes: []
                },
                width_tablet: {
                  unit: '%',
                  size: 100,
                  sizes: []
                },
                width_mobile: {
                  unit: '%',
                  size: 100,
                  sizes: []
                },
                background_background: 'classic',
                background_color: '#FFFFFF',
                border_radius: {
                  unit: 'px',
                  top: '16',
                  right: '16',
                  bottom: '16',
                  left: '16',
                  isLinked: true
                },
                border_border: 'solid',
                border_width: {
                  unit: 'px',
                  top: '1',
                  right: '1',
                  bottom: '1',
                  left: '1',
                  isLinked: true
                },
                border_color: '#E5E7EB',
                css_classes: 'evergreen-card'
              },
              elements: [
                // Icon Con
                {
                  id: ids.card2_icon_con,
                  elType: 'container',
                  isInner: true,
                  settings: {
                    width: {
                      unit: 'px',
                      size: 64,
                      sizes: []
                    },
                    height: {
                      unit: 'px',
                      size: 64,
                      sizes: []
                    },
                    background_background: 'classic',
                    background_color: 'rgba(192, 120, 48, 0.1)',
                    border_radius: {
                      unit: 'px',
                      top: '9999',
                      right: '9999',
                      bottom: '9999',
                      left: '9999',
                      isLinked: true
                    },
                    flex_align_items: 'center',
                    flex_justify_content: 'center',
                    css_classes: 'evergreen-card-icon-wrapper-solar'
                  },
                  elements: [
                    {
                      id: ids.card2_icon,
                      elType: 'widget',
                      widgetType: 'text-editor',
                      isInner: false,
                      settings: {
                        editor: '<span class="material-symbols-outlined" style="font-size: 32px; color: #C07830; display: block; text-align: center;">solar_power</span>'
                      },
                      elements: []
                    }
                  ]
                },
                {
                  id: ids.card2_h3,
                  elType: 'widget',
                  widgetType: 'heading',
                  isInner: false,
                  settings: {
                    title: 'Línea Autónoma Solar',
                    header_size: 'h3',
                    title_color: '#1A1A2E',
                    typography_typography: 'custom',
                    typography_font_family: 'Montserrat',
                    typography_font_weight: '700'
                  },
                  elements: []
                },
                {
                  id: ids.card2_p,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0;">Soluciones de iluminación 100% autónomas. Ideales para zonas sin acceso estable a la red eléctrica.</p>'
                  },
                  elements: []
                },
                {
                  id: ids.card2_link,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<a href="/iluminacion-solar-autonoma" style="display: inline-flex; align-items: center; color: #C07830; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 13px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Explorar línea <span class="material-symbols-outlined" style="font-size: 16px; margin-left: 8px;">arrow_forward</span></a>'
                  },
                  elements: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Section 4: CTA Final
const section4 = {
  id: ids.sec4,
  elType: 'container',
  isInner: false,
  settings: {
    content_width: 'full',
    background_background: 'classic',
    background_color: '#0E1320', // Dark navy background
    padding: {
      unit: 'px',
      top: '96',
      right: '0',
      bottom: '96',
      left: '0',
      isLinked: false
    },
    padding_tablet: {
      unit: 'px',
      top: '64',
      right: '0',
      bottom: '64',
      left: '0',
      isLinked: false
    },
    padding_mobile: {
      unit: 'px',
      top: '40',
      right: '0',
      bottom: '40',
      left: '0',
      isLinked: false
    },
    css_classes: 'evergreen-cta-final'
  },
  elements: [
    {
      id: ids.sec4_boxed,
      elType: 'container',
      isInner: true,
      settings: {
        content_width: 'boxed',
        boxed_width: {
          unit: 'px',
          size: 1200,
          sizes: []
        },
        flex_direction: 'column',
        flex_align_items: 'center',
        text_align: 'center',
        flex_gap: {
          unit: 'px',
          size: '32',
          column: '32',
          row: '32',
          isLinked: true
        }
      },
      elements: [
        {
          id: ids.sec4_h2,
          elType: 'widget',
          widgetType: 'heading',
          isInner: false,
          settings: {
            title: '¿Listo para mejorar la iluminación de su proyecto?',
            header_size: 'h2',
            align: 'center',
            title_color: '#FFFFFF',
            typography_typography: 'custom',
            typography_font_family: 'Montserrat',
            typography_font_weight: '700',
            typography_font_size: {
              unit: 'px',
              size: 36,
              sizes: []
            },
            typography_font_size_tablet: {
              unit: 'px',
              size: 28,
              sizes: []
            },
            typography_font_size_mobile: {
              unit: 'px',
              size: 22,
              sizes: []
            }
          },
          elements: []
        },
        // Button Container
        {
          id: ids.sec4_btns,
          elType: 'container',
          isInner: true,
          settings: {
            flex_direction: 'row',
            flex_justify_content: 'center',
            flex_direction_mobile: 'column',
            flex_gap: {
              unit: 'px',
              size: '16',
              column: '16',
              row: '16',
              isLinked: true
            },
            content_width: 'full'
          },
          elements: [
            // Button 1: Ver Catálogo Completo
            {
              id: ids.sec4_btn_cat,
              elType: 'widget',
              widgetType: 'button',
              isInner: false,
              settings: {
                text: 'Ver Catálogo Completo',
                link: {
                  url: '/catalogo',
                  is_external: '',
                  nofollow: '',
                  custom_attributes: ''
                },
                typography_typography: 'custom',
                typography_font_family: 'Montserrat',
                typography_font_weight: '700',
                typography_font_size: {
                  unit: 'px',
                  size: 13,
                  sizes: []
                },
                button_text_color: '#FFFFFF',
                background_color: '#1D8A43',
                border_radius: {
                  unit: 'px',
                  top: '12',
                  right: '12',
                  bottom: '12',
                  left: '12',
                  isLinked: true
                },
                padding: {
                  unit: 'px',
                  top: '16',
                  right: '36',
                  bottom: '16',
                  left: '36',
                  isLinked: false
                }
              },
              elements: []
            },
            // Button 2: Cotizar por WhatsApp
            {
              id: ids.sec4_btn_wa,
              elType: 'widget',
              widgetType: 'button',
              isInner: false,
              settings: {
                text: 'Cotizar por WhatsApp',
                link: {
                  url: '#',
                  is_external: '',
                  nofollow: '',
                  custom_attributes: ''
                },
                typography_typography: 'custom',
                typography_font_family: 'Montserrat',
                typography_font_weight: '700',
                typography_font_size: {
                  unit: 'px',
                  size: 13,
                  sizes: []
                },
                button_text_color: '#FFFFFF',
                background_color: 'transparent',
                border_border: 'solid',
                border_width: {
                  unit: 'px',
                  top: '2',
                  right: '2',
                  bottom: '2',
                  left: '2',
                  isLinked: true
                },
                border_color: '#FFFFFF',
                border_radius: {
                  unit: 'px',
                  top: '12',
                  right: '12',
                  bottom: '12',
                  left: '12',
                  isLinked: true
                },
                padding: {
                  unit: 'px',
                  top: '16',
                  right: '36',
                  bottom: '16',
                  left: '36',
                  isLinked: false
                }
              },
              elements: []
            }
          ]
        }
      ]
    }
  ]
};

// Check if sections already appended (using simple ID checking)
const hasSec3 = homepage.some(el => el.id === ids.sec3 || (el.settings && el.settings.background_color === '#F5F7FA'));
if (hasSec3) {
  console.log('⚠️ It seems Section 3 is already in the JSON file. Skipping append to prevent duplication.');
} else {
  homepage.push(section3);
  homepage.push(section4);
  console.log(`✅ Appended Section 3 (ID: ${ids.sec3}) and Section 4 (ID: ${ids.sec4}) successfully!`);
  
  // Write back to homepage.json
  fs.writeFileSync(jsonPath, JSON.stringify(homepage, null, 4), 'utf8');
  console.log(`✅ Wrote updated JSON back to: ${jsonPath} (now has ${homepage.length} root elements).`);
}
