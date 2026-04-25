const fs = require('fs');
const path = require('path');

const stepsDir = path.join('C:\\Users\\TEC\\.gemini\\antigravity\\brain\\920b7aac-41bb-41ba-876b-d62ac5135648\\.system_generated\\steps');

// Page slug mapping based on titles or order
const slugsMap = {
  'Homepage': 'homepage',
  'Estaciones de Energía Portátiles': 'estaciones-de-energia-portatiles',
  'Soluciones de Energía': 'soluciones-de-energia',
  'Respaldo Energético Residencial': 'respaldo-energetico-residencial',
  'Iluminación LED Industrial': 'iluminacion-led-industrial',
  'Iluminación LED Residencial': 'iluminacion-led-residencial',
  'Iluminación LED Comercial': 'iluminacion-led-comercial',
  'Arrancadores Portátiles': 'arrancadores-portatiles',
  'Paneles Solares': 'paneles-solares',
  'Accesorios y Complementos': 'accesorios-y-complementos',
  'Sobre Nosotros': 'sobre-nosotros',
  'Contacto': 'contacto',
  'Blog': 'blog',
  'Distribuidores': 'distribuidores',
  'Proyectos': 'proyectos',
  'Garantía': 'garantia',
  'Preguntas Frecuentes': 'preguntas-frecuentes',
  'Calculadora Solar': 'calculadora-solar',
  'Política de Privacidad': 'politica-de-privacidad',
  'Términos y Condiciones': 'terminos-y-condiciones'
};

const screens = [];

function parseDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            parseDirectory(fullPath);
        } else if (file === 'output.txt') {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(content);
                if (json.outputComponents) {
                    for (const comp of json.outputComponents) {
                        if (comp.design && comp.design.screens) {
                            for (const screen of comp.design.screens) {
                                if (screen.htmlCode && screen.htmlCode.downloadUrl) {
                                    screens.push({
                                        title: screen.title,
                                        htmlUrl: screen.htmlCode.downloadUrl
                                    });
                                }
                            }
                        }
                    }
                } else if (json.screens) {
                   for (const screen of json.screens) {
                        if (screen.htmlCode && screen.htmlCode.downloadUrl) {
                            screens.push({
                                title: screen.title,
                                htmlUrl: screen.htmlCode.downloadUrl
                            });
                        }
                   }
                }
            } catch (err) {
                // Ignore parse errors for non-json output.txt
            }
        }
    }
}

parseDirectory(stepsDir);

console.log(`Found ${screens.length} screens.`);

// Ensure uniqueness based on title
const uniqueScreens = [];
const seenTitles = new Set();
for (const s of screens.reverse()) { // reverse to get the latest
    if (!seenTitles.has(s.title)) {
        seenTitles.add(s.title);
        uniqueScreens.push(s);
    }
}

console.log(`Found ${uniqueScreens.length} unique screens.`);

// Map them exactly to the slugs order
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

const screenMap = [];
for (const slug of slugs) {
    // Find matching screen
    let bestMatch = null;
    for (const screen of uniqueScreens) {
        const titleLower = screen.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Custom matching logic since AI generated titles might vary
        if (slug === 'homepage' && titleLower.includes('home')) bestMatch = screen;
        else if (slug === 'estaciones-de-energia-portatiles' && (titleLower.includes('estacion') || titleLower.includes('portatiles') || titleLower.includes('portable power'))) bestMatch = screen;
        else if (slug === 'soluciones-de-energia' && titleLower.includes('soluciones')) bestMatch = screen;
        else if (slug === 'respaldo-energetico-residencial' && (titleLower.includes('residencial') || titleLower.includes('residential'))) bestMatch = screen;
        else if (slug === 'iluminacion-led-industrial' && titleLower.includes('industrial') && titleLower.includes('led')) bestMatch = screen;
        else if (slug === 'iluminacion-led-residencial' && titleLower.includes('residencial') && titleLower.includes('led')) bestMatch = screen;
        else if (slug === 'iluminacion-led-comercial' && titleLower.includes('comercial') && titleLower.includes('led')) bestMatch = screen;
        else if (slug === 'arrancadores-portatiles' && titleLower.includes('arrancador')) bestMatch = screen;
        else if (slug === 'paneles-solares' && (titleLower.includes('paneles') || titleLower.includes('solares'))) bestMatch = screen;
        else if (slug === 'accesorios-y-complementos' && (titleLower.includes('accesorios') || titleLower.includes('complementos'))) bestMatch = screen;
        else if (slug === 'sobre-nosotros' && titleLower.includes('nosotros')) bestMatch = screen;
        else if (slug === 'contacto' && titleLower.includes('contacto')) bestMatch = screen;
        else if (slug === 'blog' && (titleLower.includes('blog') || titleLower.includes('noticias'))) bestMatch = screen;
        else if (slug === 'distribuidores' && titleLower.includes('distribuidor')) bestMatch = screen;
        else if (slug === 'proyectos' && (titleLower.includes('proyecto') || titleLower.includes('casos'))) bestMatch = screen;
        else if (slug === 'garantia' && titleLower.includes('garant')) bestMatch = screen;
        else if (slug === 'preguntas-frecuentes' && (titleLower.includes('preguntas') || titleLower.includes('faq'))) bestMatch = screen;
        else if (slug === 'calculadora-solar' && titleLower.includes('calculadora')) bestMatch = screen;
        else if (slug === 'politica-de-privacidad' && titleLower.includes('privacidad')) bestMatch = screen;
        else if (slug === 'terminos-y-condiciones' && titleLower.includes('terminos')) bestMatch = screen;
    }
    
    if (bestMatch) {
        screenMap.push(bestMatch);
    } else {
        console.warn('MISSING MATCH FOR:', slug);
        screenMap.push({ title: slug, htmlUrl: null });
    }
}

fs.writeFileSync('c:\\Users\\TEC\\Desktop\\ANTIGRAVITY PROJECTS\\EVERGREEN_2.0\\screen_map.json', JSON.stringify(screenMap, null, 2));
console.log('Saved screen_map.json successfully.');
