#!/usr/bin/env node
/**
 * fix_solar_references.mjs
 * ─────────────────────────
 * Elimina TODAS las referencias solares/fotovoltaicas del sitio Evergreen
 * directamente vía la API REST de WordPress + Elementor _elementor_data.
 *
 * Uso: node scripts/fix_solar_references.mjs
 */

import 'dotenv/config';

const WP_URL  = process.env.WP_URL || process.env.WP_BASE_URL;
const WP_USER = process.env.WP_USER;
const WP_PASS = process.env.WP_APP_PASSWORD?.replace(/"/g, '');

if (!WP_URL || !WP_USER || !WP_PASS) {
  console.error('❌ Faltan variables: WP_URL, WP_USER, WP_APP_PASSWORD');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const headers = { 'Authorization': AUTH, 'Content-Type': 'application/json' };

// ── Helpers ──────────────────────────────────────────────────────────
async function getPage(id) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/pages/${id}?context=edit`, { headers });
  if (!r.ok) throw new Error(`GET page ${id}: ${r.status} ${r.statusText}`);
  return r.json();
}

async function updatePage(id, data) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/pages/${id}`, {
    method: 'POST', headers, body: JSON.stringify(data)
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`UPDATE page ${id}: ${r.status} — ${body.slice(0, 300)}`);
  }
  return r.json();
}

/** Deep-walk Elementor JSON and apply replacements */
function walkElements(elements, replacements) {
  let changes = 0;
  for (const el of elements) {
    // Walk settings
    if (el.settings) {
      for (const [key, val] of Object.entries(el.settings)) {
        if (typeof val === 'string') {
          for (const { test, from, to, field } of replacements) {
            if (field && field !== key) continue;
            if (test && !test(el)) continue;
            if (val.includes(from)) {
              el.settings[key] = val.replace(from, to);
              changes++;
              console.log(`   ✏️  [${el.id}] ${key}: "${from}" → "${to}"`);
            }
          }
        }
      }
    }
    // Recurse children
    if (el.elements?.length) {
      changes += walkElements(el.elements, replacements);
    }
  }
  return changes;
}

// ── Page-specific fix definitions ────────────────────────────────────

const PAGE_FIXES = {
  // ─── 1668: Preguntas Frecuentes ───
  1668: {
    name: 'Preguntas Frecuentes',
    replacements: [
      {
        from: '¿Qué garantía ofrecen en sistemas solares fotovoltaicos?',
        to:   '¿Qué garantía ofrecen en sus luminarias LED industriales?'
      },
      {
        from: 'Ofrecemos una garantía estructural de 10 años y una garantía de rendimiento lineal de hasta 25 años en paneles solares monocristalinos.',
        to:   'Ofrecemos una garantía de 5 años y rendimiento certificado de hasta 50,000 horas en todas nuestras luminarias LED industriales, respaldadas por drivers de grado industrial.'
      },
      {
        from: 'Industrial Solar Panel',
        to:   'Industrial LED Lighting System',
        field: 'alt'  // only target alt text
      },
    ]
  },

  // ─── 1666: Proyectos ───
  1666: {
    name: 'Casos de Éxito y Proyectos',
    replacements: [
      // Botón "Solar" → "Público" (ya hay otro "Público", así que lo cambiamos a "Alumbrado")
      {
        test: (el) => el.id === 'aef11ac9',
        from: 'Solar',
        to:   'Alumbrado'
      },
      // "Granja Solar El Tocuyo" → proyecto LED
      {
        from: 'Granja Solar El Tocuyo',
        to:   'Iluminación Industrial El Tocuyo'
      },
      {
        from: 'Solar El Tocuyo',
        to:   'LED Industrial El Tocuyo',
        field: 'alt'
      },
      {
        from: 'Primera fase de infraestructura solar fotovoltaica para el sector agroindustrial, generando energía limpia y constante.',
        to:   'Implementación de luminarias LED de alta potencia para el sector agroindustrial, reduciendo costos operativos y mejorando la visibilidad en plantas de procesamiento.'
      },
      {
        from: '5MW',
        to:   '75%'
      },
    ]
  },

  // ─── 1665: Distribuidores ───
  1665: {
    name: 'Red de Distribuidores',
    replacements: [
      {
        from: 'PZO SOLAR',
        to:   'PZO LED CENTER'
      },
      {
        from: 'soluciones LED y energía solar',
        to:   'soluciones de iluminación LED industrial'
      },
    ]
  },

  // ─── 1664: Blog ───
  1664: {
    name: 'Blog',
    replacements: [
      {
        from: 'SOLAR TECH',
        to:   'LED TECH'
      },
      {
        from: 'estaciones de carga solar autosustentables para operaciones petroleras de alta precisión',
        to:   'sistemas de iluminación LED inteligente para operaciones petroleras de alta precisión'
      },
      {
        from: 'Mantenimiento Predictivo con IA en Sistemas Fotovoltaicos',
        to:   'Mantenimiento Predictivo con IA en Sistemas de Iluminación LED'
      },
      {
        from: 'inversores industriales en climas tropicales',
        to:   'luminarias LED industriales en climas tropicales'
      },
    ]
  },
};

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  EVERGREEN — Solar Reference Cleanup                ║');
  console.log('║  Eliminando TODAS las refs solar/fotovoltaico       ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Verify auth
  const me = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, { headers });
  if (!me.ok) { console.error('❌ Auth failed'); process.exit(1); }
  const user = await me.json();
  console.log(`✅ Autenticado como: ${user.name} (ID: ${user.id})\n`);

  let totalChanges = 0;

  for (const [pageId, config] of Object.entries(PAGE_FIXES)) {
    console.log(`\n━━━ Página ${pageId}: ${config.name} ━━━`);

    try {
      const page = await getPage(pageId);
      const metaRaw = page.meta?._elementor_data;

      if (!metaRaw) {
        console.log('   ⚠️  No Elementor data found, skipping.');
        continue;
      }

      let elements;
      try {
        elements = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw;
      } catch (e) {
        console.log(`   ⚠️  Error parsing Elementor JSON: ${e.message}`);
        continue;
      }

      const changes = walkElements(elements, config.replacements);

      if (changes === 0) {
        console.log('   ✓ Sin cambios necesarios (ya limpia o no encontrado).');
        continue;
      }

      // Save back
      const updatedData = JSON.stringify(elements);
      await updatePage(pageId, {
        meta: { _elementor_data: updatedData }
      });

      console.log(`   ✅ ${changes} correcciones aplicadas y guardadas.`);
      totalChanges += changes;

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  // ─── Handle page 1660 (Paneles Solares) - change title only ───
  console.log(`\n━━━ Página 1660: Paneles Solares Catalog ━━━`);
  try {
    await updatePage(1660, {
      title: 'Catálogo de Luminarias LED Industriales',
    });

    // Also fix Elementor content
    const page = await getPage(1660);
    const metaRaw = page.meta?._elementor_data;
    if (metaRaw) {
      let elements = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw;
      const solarReplacements = [
        { from: 'Paneles solares diseñados bajo especificaciones militares para resistir y generar en condiciones extremas.',
          to:   'Luminarias LED diseñadas bajo especificaciones industriales para operar en las condiciones más exigentes.' },
        { from: 'Módulo N-Type Ultra Eficiencia',
          to:   'Luminaria LED Ultra Eficiencia' },
        { from: 'Arquitectura de Fotoceldas N-Type',
          to:   'Arquitectura Óptica LED Avanzada' },
        { from: 'POTENCIA \nABSOLUTA.\n                        CONTROL TOTAL.',
          to:   'ILUMINACIÓN\nINDUSTRIAL.\n                        CONTROL TOTAL.' },
        { from: 'DIVISIÓN DE ENERGÍA INDUSTRIAL',
          to:   'DIVISIÓN DE ILUMINACIÓN INDUSTRIAL' },
        // Fix solar-specific tech specs
        { from: 'Silicio Monocristalino N', to: 'Driver LED Certificado' },
        { from: 'Capa Anti-Reflejante', to: 'Óptica de Alta Eficiencia' },
        { from: 'Bi-facialidad Extendida', to: 'Disipación Térmica Avanzada' },
        { from: 'Captación de albedo trasero de hasta un 30% adicional dependiendo de las condiciones de la superficie.',
          to:   'Sistema de gestión térmica pasiva que extiende la vida útil del LED más allá de las 100,000 horas.' },
        { from: 'Reducción de microfisuras y distancia de conducción de corriente, optimizando la captación lumínica.',
          to:   'Distribución óptica precisa con lentes de policarbonato de grado industrial, maximizando los lúmenes por vatio.' },
        { from: 'Coeficiente de temperatura ultra bajo, garantizando máxima salida en entornos de alto calor industrial.',
          to:   'Operación estable desde -40°C hasta +65°C, garantizando máxima salida lumínica en entornos de alto calor industrial.' },
        // alt texts
        { from: 'Close up macro shot of high tech solar panel crystalline structure', to: 'Close up of high tech LED chip array with industrial heatsink', field: 'alt' },
        // Degradation spec
        { from: 'DEGRADATION_Y1:', to: 'LUMEN_MAINT:' },
        { from: 'EFFICIENCY_MAX:', to: 'EFFICACY_MAX:' },
        { from: '23.4%', to: '190 lm/W' },
        { from: '< 1.0%', to: 'L90 > 50kh' },
        { from: 'TEMP_COEF:', to: 'CRI_INDEX:' },
        { from: '-0.29%/°C', to: 'Ra ≥ 80' },
        { from: 'SYS_STATUS', to: 'SPEC_STATUS' },
      ];
      const changes = walkElements(elements, solarReplacements);
      if (changes > 0) {
        await updatePage(1660, { meta: { _elementor_data: JSON.stringify(elements) } });
        console.log(`   ✅ Título + ${changes} correcciones Elementor aplicadas.`);
        totalChanges += changes;
      } else {
        console.log('   ✅ Título actualizado. Contenido Elementor sin matches exactos.');
      }
    }
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
  }

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  RESULTADO: ${totalChanges} correcciones totales aplicadas`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
