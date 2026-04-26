const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dir = 'assets_originales';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let totalCorrections = {
    missingAlt: 0,
    improvedAlt: 0,
    lazyLoadAdded: 0,
    emptyLinks: 0
};

console.log("=== LIMPIEZA MASIVA HTML ===");

files.forEach(file => {
    if(file === 'header-global.html' || file === 'footer-global.html') return;
    
    const filePath = path.join(dir, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });
    
    let modified = false;
    
    $('img').each(function(i, el) {
        let alt = $(el).attr('alt');
        let dataAlt = $(el).attr('data-alt');
        
        if (!alt || alt.trim() === '') {
            $(el).attr('alt', dataAlt ? dataAlt : 'Producto Evergreen Venezuela');
            totalCorrections.missingAlt++;
            modified = true;
        } else if (alt.length < 15) {
            $(el).attr('alt', alt + ' - Soluciones Energeticas');
            totalCorrections.improvedAlt++;
            modified = true;
        }
        
        if (i > 0 && !$(el).attr('loading')) {
            $(el).attr('loading', 'lazy');
            totalCorrections.lazyLoadAdded++;
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, $.html(), 'utf-8');
        console.log(`[LIMPIADO] ${file}`);
    }
});

console.log("\n=== REPORTE GLOBAL ===");
console.log("- Imagenes sin atributo ALT reparadas:", totalCorrections.missingAlt);
console.log("- Atributos ALT genericos optimizados:", totalCorrections.improvedAlt);
console.log("- Imagenes con loading='lazy' anadido:", totalCorrections.lazyLoadAdded);

