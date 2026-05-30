/**
 * scripts/add_dark_stripe_homepage.mjs
 * Inserts a premium dark features stripe (~400px high) into elementor_jsons/homepage.json
 * right before Section 3 (Líneas de Producto).
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

console.log('━━━ Insert Dark Stripe into Homepage JSON ━━━\n');

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ homepage.json not found at: ${jsonPath}`);
  process.exit(1);
}

const homepage = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`Original homepage has ${homepage.length} root elements.`);

const ids = {
  sec: genId(),
  boxed: genId(),
  col1: genId(),
  label: genId(),
  h2: genId(),
  p: genId(),
  
  col2: genId(),
  row1: genId(),
  icon1_con: genId(),
  icon1: genId(),
  txt1: genId(),
  
  row2: genId(),
  icon2_con: genId(),
  icon2: genId(),
  txt2: genId(),
  
  row3: genId(),
  icon3_con: genId(),
  icon3: genId(),
  txt3: genId()
};

const newSection = {
  id: ids.sec,
  elType: 'container',
  isInner: false,
  settings: {
    content_width: 'full',
    background_background: 'classic',
    background_color: '#0E1320', // Dark background
    padding: {
      unit: 'px',
      top: '80',
      right: '0',
      bottom: '80',
      left: '0',
      isLinked: false
    },
    padding_tablet: {
      unit: 'px',
      top: '60',
      right: '0',
      bottom: '60',
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
    min_height: {
      unit: 'px',
      size: 400,
      sizes: []
    },
    flex_align_items: 'center',
    flex_justify_content: 'center',
    css_classes: 'evergreen-dark-stripe'
  },
  elements: [
    {
      id: ids.boxed,
      elType: 'container',
      isInner: true,
      settings: {
        content_width: 'boxed',
        boxed_width: {
          unit: 'px',
          size: 1200,
          sizes: []
        },
        flex_direction: 'row',
        flex_wrap: 'wrap',
        flex_direction_mobile: 'column',
        flex_gap: {
          unit: 'px',
          size: '40',
          column: '40',
          row: '40',
          isLinked: true
        }
      },
      elements: [
        // Column 1: Statement (Left)
        {
          id: ids.col1,
          elType: 'container',
          isInner: true,
          settings: {
            flex_direction: 'column',
            flex_gap: {
              unit: 'px',
              size: '16',
              column: '16',
              row: '16',
              isLinked: true
            },
            _element_width: 'custom',
            width: {
              unit: '%',
              size: 50,
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
            }
          },
          elements: [
            {
              id: ids.label,
              elType: 'widget',
              widgetType: 'text-editor',
              isInner: false,
              settings: {
                editor: '<p style="color: #8FDA3E; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Tecnología de Vanguardia</p>'
              },
              elements: []
            },
            {
              id: ids.h2,
              elType: 'widget',
              widgetType: 'heading',
              isInner: false,
              settings: {
                title: 'Soluciones de Iluminación de Alto Rendimiento',
                header_size: 'h2',
                title_color: '#FFFFFF',
                typography_typography: 'custom',
                typography_font_family: 'Montserrat',
                typography_font_weight: '700',
                typography_font_size: {
                  unit: 'px',
                  size: 32,
                  sizes: []
                },
                typography_font_size_mobile: {
                  unit: 'px',
                  size: 24,
                  sizes: []
                }
              },
              elements: []
            },
            {
              id: ids.p,
              elType: 'widget',
              widgetType: 'text-editor',
              isInner: false,
              settings: {
                editor: '<p style="color: #94A3B8; font-size: 15px; line-height: 1.7; margin: 0;">Nuestros productos están diseñados bajo estrictos estándares internacionales de calidad, garantizando un ahorro energético de hasta el 70% y una durabilidad óptima para entornos comerciales, industriales y residenciales.</p>'
              },
              elements: []
            }
          ]
        },
        // Column 2: Metrics (Right)
        {
          id: ids.col2,
          elType: 'container',
          isInner: true,
          settings: {
            flex_direction: 'column',
            flex_gap: {
              unit: 'px',
              size: '24',
              column: '24',
              row: '24',
              isLinked: true
            },
            _element_width: 'custom',
            width: {
              unit: '%',
              size: 45,
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
            margin: {
              unit: 'px',
              top: '0',
              right: '0',
              bottom: '0',
              left: 'auto',
              isLinked: false
            }
          },
          elements: [
            // Row 1: Ahorro
            {
              id: ids.row1,
              elType: 'container',
              isInner: true,
              settings: {
                flex_direction: 'row',
                flex_align_items: 'center',
                flex_gap: {
                  unit: 'px',
                  size: '16',
                  column: '16',
                  row: '16',
                  isLinked: true
                }
              },
              elements: [
                {
                  id: ids.icon1_con,
                  elType: 'container',
                  isInner: true,
                  settings: {
                    content_width: 'full',
                    css_classes: 'evergreen-dark-stripe-icon-con',
                    _element_width: 'custom',
                    width: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    height: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    background_background: 'classic',
                    background_color: 'rgba(29, 138, 67, 0.15)',
                    border_radius: {
                      unit: 'px',
                      top: '8',
                      right: '8',
                      bottom: '8',
                      left: '8',
                      isLinked: true
                    },
                    flex_align_items: 'center',
                    flex_justify_content: 'center'
                  },
                  elements: [
                    {
                      id: ids.icon1,
                      elType: 'widget',
                      widgetType: 'text-editor',
                      isInner: false,
                      settings: {
                        editor: '<span class="material-symbols-outlined" style="font-size: 24px; color: #8FDA3E; display: block; text-align: center;">bolt</span>'
                      },
                      elements: []
                    }
                  ]
                },
                {
                  id: ids.txt1,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<div style="display:flex; flex-direction:column;"><span style="color:#FFFFFF; font-family:Montserrat,sans-serif; font-weight:700; font-size:18px;">+70% Ahorro</span><span style="color:#94A3B8; font-size:13px;">En consumo eléctrico vs iluminación tradicional</span></div>'
                  },
                  elements: []
                }
              ]
            },
            // Row 2: Garantía
            {
              id: ids.row2,
              elType: 'container',
              isInner: true,
              settings: {
                flex_direction: 'row',
                flex_align_items: 'center',
                flex_gap: {
                  unit: 'px',
                  size: '16',
                  column: '16',
                  row: '16',
                  isLinked: true
                }
              },
              elements: [
                {
                  id: ids.icon2_con,
                  elType: 'container',
                  isInner: true,
                  settings: {
                    content_width: 'full',
                    css_classes: 'evergreen-dark-stripe-icon-con',
                    _element_width: 'custom',
                    width: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    height: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    background_background: 'classic',
                    background_color: 'rgba(29, 138, 67, 0.15)',
                    border_radius: {
                      unit: 'px',
                      top: '8',
                      right: '8',
                      bottom: '8',
                      left: '8',
                      isLinked: true
                    },
                    flex_align_items: 'center',
                    flex_justify_content: 'center'
                  },
                  elements: [
                    {
                      id: ids.icon2,
                      elType: 'widget',
                      widgetType: 'text-editor',
                      isInner: false,
                      settings: {
                        editor: '<span class="material-symbols-outlined" style="font-size: 24px; color: #8FDA3E; display: block; text-align: center;">shield</span>'
                      },
                      elements: []
                    }
                  ]
                },
                {
                  id: ids.txt2,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<div style="display:flex; flex-direction:column;"><span style="color:#FFFFFF; font-family:Montserrat,sans-serif; font-weight:700; font-size:18px;">Garantía Escrita</span><span style="color:#94A3B8; font-size:13px;">Soporte local y respuesta inmediata en Caracas</span></div>'
                  },
                  elements: []
                }
              ]
            },
            // Row 3: Lúmenes
            {
              id: ids.row3,
              elType: 'container',
              isInner: true,
              settings: {
                flex_direction: 'row',
                flex_align_items: 'center',
                flex_gap: {
                  unit: 'px',
                  size: '16',
                  column: '16',
                  row: '16',
                  isLinked: true
                }
              },
              elements: [
                {
                  id: ids.icon3_con,
                  elType: 'container',
                  isInner: true,
                  settings: {
                    content_width: 'full',
                    css_classes: 'evergreen-dark-stripe-icon-con',
                    _element_width: 'custom',
                    width: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    height: {
                      unit: 'px',
                      size: 48,
                      sizes: []
                    },
                    background_background: 'classic',
                    background_color: 'rgba(29, 138, 67, 0.15)',
                    border_radius: {
                      unit: 'px',
                      top: '8',
                      right: '8',
                      bottom: '8',
                      left: '8',
                      isLinked: true
                    },
                    flex_align_items: 'center',
                    flex_justify_content: 'center'
                  },
                  elements: [
                    {
                      id: ids.icon3,
                      elType: 'widget',
                      widgetType: 'text-editor',
                      isInner: false,
                      settings: {
                        editor: '<span class="material-symbols-outlined" style="font-size: 24px; color: #8FDA3E; display: block; text-align: center;">workspace_premium</span>'
                      },
                      elements: []
                    }
                  ]
                },
                {
                  id: ids.txt3,
                  elType: 'widget',
                  widgetType: 'text-editor',
                  isInner: false,
                  settings: {
                    editor: '<div style="display:flex; flex-direction:column;"><span style="color:#FFFFFF; font-family:Montserrat,sans-serif; font-weight:700; font-size:18px;">100% Lúmenes Reales</span><span style="color:#94A3B8; font-size:13px;">Fichas técnicas verídicas comprobadas en laboratorio</span></div>'
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

// Check if a dark stripe is already in the array
const stripeIdx = homepage.findIndex(el => el.settings && (el.settings._css_classes === 'evergreen-dark-stripe' || el.settings.css_classes === 'evergreen-dark-stripe'));
if (stripeIdx !== -1) {
  console.log(`♻️ Dark stripe found at index ${stripeIdx}. Replacing it to apply updates...`);
  homepage[stripeIdx] = newSection;
} else {
  // Insert at Index 1 (after Index 0: Hero+Trust, before the product lines)
  homepage.splice(1, 0, newSection);
  console.log(`✅ Inserted new Dark Stripe (ID: ${ids.sec}) before "Líneas de Producto"!`);
}

fs.writeFileSync(jsonPath, JSON.stringify(homepage, null, 4), 'utf8');
console.log(`✅ Wrote updated JSON back to: ${jsonPath} (has ${homepage.length} root elements).`);
