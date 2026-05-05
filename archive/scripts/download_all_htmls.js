/**
 * download_all_htmls.js — Downloads all Stitch screens to assets_originales/
 * Maps screen titles to manifest filenames
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ASSETS_DIR = path.join(__dirname, '../assets_originales');

// Mapping: manifest html filename → Stitch download URL
const DOWNLOADS = {
  'soluciones-de-energia.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2ZhOTQ2NDFiMmE0NzQ2YjZhNTE3ZmU3NGVkZDBjODI3EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'estaciones-de-energia-portatiles.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzA1OWU3YzE5ZDc3NzRlOThiNDhmNzFjYjFjNTM5ZGI4EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'respaldo-energetico-residencial.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzdmNTk5YjM5YjQyODQ0ZGFhN2JhNjk0YTdlMGI4MmRmEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'respaldo-energetico-comercial.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzhlOTA2OGY3NDFjYzRlOTJiNjgzYTc2NDk5YzIyYmQyEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'baterias-de-energia-solar.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzdiMDNjOWI0NTFhZDRkZDY4MjgwMzNjNWYyY2Q1NzE0EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'paneles-solares.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzdiMjQzZjRhYzQ3OTQ0YWI4NGZkNjFhMDUzMzk2MDk5EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=89354086',
  'iluminacion.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzY4ODE5M2Q1MWQzYzQ2ODJhNjY1NjcwY2IzNTc5NWViEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'iluminacion-led-solar.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzRkZjU4MjI3MTE4OTQ4NzQ5YmE4ZjY4YWVkODI1MTAwEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'iluminacion-convencional.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzQ3MjhlMmJlNjcyMjQwNDhhNGRmYzVjM2EzZWVkNWZmEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'jump-starters-arrancadores.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzE3NWExZTZjYmMzMDQzOWNhZGNkMjc4ZmMxZDU2ZDU2EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'calculadora-de-consumo-energetico.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzM1YTU1ZGY3NjY4YzRjZmJhMjQyMmY5ZTVmMDlhYjczEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'catalogos-y-recursos.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2Q2OTViMTk1ZjFiNDQzZjdhZDdlYjQ3MGE2MzExY2EyEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'sobre-nosotros.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2VhYzc3OTk4MzQ5NDRjYmJhOTE1ZGZmYzRkZWQwN2ViEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'blog-articulos-y-noticias.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2E1NTg2MTI5ZjY5ZDQwMDRhNDFjMTQ2ZDg5Yjc0NjFhEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'financiamiento.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzIzOGQyZjY2YmFkNzQwOGRiM2VmYWFkZWI2M2Y1MmE0EgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'contacto.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzE5ZmJmMTZmMWVkMDRkNDdhZjY5NDYyZjc0YTJkMjQzEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'soporte-y-garantia.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzZiMDcyMzljMDdjYjQ5YmNhMTI5ZGYxMDhhNTRkYjYyEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'politica-de-privacidad.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzk2NmIyNjY4ZWVlNjQ5ZTU4MDg1YjdhYjY2MWU5NDdjEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
  'politica-de-cookies.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2Q1MDRkY2M1MDk0NzQ1NjBiYWRiMjM4MTk1NDRjMTJjEgsSBxDj1MWL0B4YAZIBIgoKcHJvamVjdF9pZBIUQhI4MDAzNzM3OTkyNDAxNDkzMTA&filename=&opi=96797242',
};

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const handler = (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location;
        const mod = redirectUrl.startsWith('https') ? https : http;
        mod.get(redirectUrl, handler).on('error', reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${path.basename(destPath)}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    };
    https.get(url, handler).on('error', reject);
  });
}

async function main() {
  console.log(`📥 Downloading ${Object.keys(DOWNLOADS).length} HTML files from Stitch...\n`);
  let success = 0, fail = 0;

  for (const [filename, url] of Object.entries(DOWNLOADS)) {
    const dest = path.join(ASSETS_DIR, filename);
    if (fs.existsSync(dest)) {
      const stat = fs.statSync(dest);
      if (stat.size > 500) {
        console.log(`  ⏭️  ${filename} (already exists, ${Math.round(stat.size/1024)}KB)`);
        success++;
        continue;
      }
    }
    try {
      await download(url, dest);
      const stat = fs.statSync(dest);
      console.log(`  ✅ ${filename} (${Math.round(stat.size/1024)}KB)`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${filename}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n📊 Downloaded: ${success} success, ${fail} failed`);
}

main().catch(console.error);
