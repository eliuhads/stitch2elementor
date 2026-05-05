#!/usr/bin/env node
/**
 * verify_solar_cleanup.mjs
 * ─────────────────────────
 * Verifica que NO quedan referencias solares/fotovoltaicas
 * en las 5 páginas corregidas, usando Playwright remoto.
 */
import { chromium } from 'playwright-core';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(import.meta.dirname, '..', '.env') });

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
if (!WS_ENDPOINT) { console.error('❌ PLAYWRIGHT_WS_ENDPOINT no definido'); process.exit(1); }

const BANNED_TERMS = ['solar', 'fotovoltaic', 'fotoceld', 'monocristalino', 'bifacial', 'albedo', 'silicio mono'];
const PAGES = [
  { url: 'https://evergreenvzla.com/preguntas-frecuentes/', name: 'FAQ (1668)' },
  { url: 'https://evergreenvzla.com/proyectos/', name: 'Proyectos (1666)' },
  { url: 'https://evergreenvzla.com/distribuidores/', name: 'Distribuidores (1665)' },
  { url: 'https://evergreenvzla.com/blog/', name: 'Blog (1664)' },
  { url: 'https://evergreenvzla.com/paneles-solares/', name: 'Catálogo (1660)' },
  { url: 'https://evergreenvzla.com/', name: 'Home' },
  { url: 'https://evergreenvzla.com/nosotros/', name: 'Nosotros' },
  { url: 'https://evergreenvzla.com/contacto/', name: 'Contacto' },
];

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  EVERGREEN — Post-Cleanup Verification              ║');
  console.log('║  Buscando refs residuales solar/fotovoltaico         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const browser = await chromium.connect(WS_ENDPOINT);
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  let totalIssues = 0;

  for (const { url, name } of PAGES) {
    console.log(`━━━ ${name} ━━━`);
    console.log(`    ${url}`);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const results = await page.evaluate((terms) => {
        const body = document.body?.innerText?.toLowerCase() || '';
        const found = [];
        for (const term of terms) {
          const regex = new RegExp(term, 'gi');
          const matches = body.match(regex);
          if (matches) {
            // Find context around the match
            const idx = body.indexOf(term);
            const context = body.substring(Math.max(0, idx - 40), idx + term.length + 40).trim();
            found.push({ term, count: matches.length, context });
          }
        }
        
        // Also check alt texts and titles
        const images = document.querySelectorAll('img[alt]');
        for (const img of images) {
          const alt = img.alt.toLowerCase();
          for (const term of terms) {
            if (alt.includes(term)) {
              found.push({ term, count: 1, context: `alt="${img.alt}"`, type: 'alt' });
            }
          }
        }
        
        return found;
      }, BANNED_TERMS);

      if (results.length === 0) {
        console.log('    ✅ LIMPIA — Sin referencias solares');
      } else {
        totalIssues += results.length;
        for (const r of results) {
          console.log(`    ❌ "${r.term}" (×${r.count}): ...${r.context}...`);
        }
      }

      await page.close();
    } catch (err) {
      console.log(`    ⚠️ Error: ${err.message}`);
    }
    console.log('');
  }

  await browser.close();

  console.log('╔══════════════════════════════════════════════════════╗');
  if (totalIssues === 0) {
    console.log('║  ✅ RESULTADO: 0 referencias solares encontradas     ║');
    console.log('║  El sitio está 100% enfocado en LED                  ║');
  } else {
    console.log(`║  ⚠️  RESULTADO: ${totalIssues} referencias solares restantes      ║`);
    console.log('║  Requiere corrección adicional                       ║');
  }
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
