const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const screenMap = JSON.parse(fs.readFileSync('screen_map.json', 'utf8'));
const outputDir = path.join(__dirname, 'assets_originales');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Page slug mapping (same order as screen_map)
const slugs = [
  'homepage',
  'estaciones-de-energia-portatiles',
  'soluciones-de-energia',
  'respaldo-energetico-residencial',
  'iluminacion-led-industrial',
  'iluminacion-led-residencial',
  'iluminacion-led-comercial',
  'arrancadores-portatiles',
  'paneles-solares',
  'accesorios-y-complementos',
  'sobre-nosotros',
  'contacto',
  'blog',
  'distribuidores',
  'proyectos',
  'garantia',
  'preguntas-frecuentes',
  'calculadora-solar',
  'politica-de-privacidad',
  'terminos-y-condiciones'
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${response.statusCode} for ${dest}`));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log(`Downloading ${screenMap.length} HTML files...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < screenMap.length; i++) {
    const screen = screenMap[i];
    const slug = slugs[i] || `screen_${i}`;
    const filename = `${slug}.html`;
    const dest = path.join(outputDir, filename);
    
    if (!screen.htmlUrl) {
      console.log(`  SKIP [${i+1}] ${screen.title} — no URL`);
      failed++;
      continue;
    }
    
    try {
      process.stdout.write(`  [${i+1}/${screenMap.length}] ${filename}...`);
      await downloadFile(screen.htmlUrl, dest);
      const stats = fs.statSync(dest);
      console.log(` ✓ (${(stats.size/1024).toFixed(1)}KB)`);
      success++;
    } catch (err) {
      console.log(` ✗ ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\nDone: ${success} downloaded, ${failed} failed`);
  console.log(`Output directory: ${outputDir}`);
}

main().catch(console.error);
