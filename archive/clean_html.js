const fs = require('fs');
const cheerio = require('cheerio');

const filePath = 'assets_originales/iluminacion-led-solar.html';
const html = fs.readFileSync(filePath, 'utf-8');
const $ = cheerio.load(html, { decodeEntities: false });

let corrections = {
    missingAlt: 0,
    improvedAlt: 0,
    lazyLoadAdded: 0,
    emptyLinks: 0
};

$('img').each(function(i, el) {
    let alt = $(el).attr('alt');
    let dataAlt = $(el).attr('data-alt');
    
    if (!alt || alt.trim() === '') {
        $(el).attr('alt', dataAlt ? dataAlt : 'Iluminacion LED Solar Evergreen');
        corrections.missingAlt++;
    } else if (alt === 'Calles' || alt === 'Plazas' || alt === 'Estacionamientos') {
        $(el).attr('alt', alt + ' iluminadas con tecnologia solar LED');
        corrections.improvedAlt++;
    }
    
    if (i > 0 && !$(el).attr('loading')) {
        $(el).attr('loading', 'lazy');
        corrections.lazyLoadAdded++;
    }
});

$('main a[href="#"]').each(function(i, el) {
    corrections.emptyLinks++;
});

let h1Count = $('h1').length;

console.log("=== REPORTE DE LIMPIEZA HTML (iluminacion-led-solar) ===");
console.log("- Imagenes sin atributo ALT reparadas:", corrections.missingAlt);
console.log("- Atributos ALT genericos optimizados:", corrections.improvedAlt);
console.log("- Imagenes con loading='lazy' anadido (Performance):", corrections.lazyLoadAdded);
console.log("- Enlaces vacios (href='#') en contenido:", corrections.emptyLinks);
console.log("- Cantidad de etiquetas H1:", h1Count, h1Count === 1 ? "(Correcto)" : "(Requiere ajuste)");

fs.writeFileSync('assets_originales/iluminacion-led-solar_cleaned.html', $.html(), 'utf-8');
