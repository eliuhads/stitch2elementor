const fs = require('fs');
const path = require('path');

const manifestPath = 'page_manifest.json';
const sourceDir = path.join('.agent', 'skills', 'stitch2elementor', 'assets_originales');
const targetDir = 'stitch_html';

const explicitMapping = {
    'homepage.html': 'homepage.html',
    'soluciones-energia.html': 'soluciones-de-energia.html',
    'estaciones-energia.html': 'estaciones-de-energia-portatiles.html',
    'respaldo-residencial.html': 'respaldo-energetico-residencial.html',
    'respaldo-comercial.html': 'respaldo-energetico-comercial.html',
    'baterias-solar.html': 'baterias-de-energia-solar.html',
    'paneles-solares.html': 'paneles-solares.html',
    'iluminacion.html': 'iluminacion.html',
    'iluminacion-solar.html': 'iluminacion-led-solar.html',
    'iluminacion-convencional.html': 'iluminacion-convencional.html',
    'jump-starters.html': 'jump-starters-arrancadores.html',
    'calculadora.html': 'calculadora-de-consumo-energetico.html',
    'catalogos.html': 'catalogos-y-recursos.html',
    'sobre-nosotros.html': 'sobre-nosotros.html',
    'blog.html': 'blog-articulos-y-noticias.html',
    'financiamiento.html': 'financiamiento.html',
    'contacto.html': 'contacto.html',
    'soporte.html': 'soporte-y-garantia.html',
    'privacidad.html': 'politica-de-privacidad.html',
    'cookies.html': 'politica-de-cookies.html'
};

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.pages.forEach(page => {
    let srcFile = explicitMapping[page.html];
    if (srcFile) {
        fs.copyFileSync(path.join(sourceDir, srcFile), path.join(targetDir, page.html));
        console.log(`Copied ${srcFile} to ${page.html}`);
    } else {
        console.log(`MISSING: ${page.html}`);
    }
});

console.log("Copy complete!");
