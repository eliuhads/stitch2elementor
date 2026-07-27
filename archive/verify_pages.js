const fs = require('fs');
require('dotenv').config();

async function checkPages() {
    console.log("🔍 Verificando URLs del sitio...");
    const wpUrl = process.env.WP_BASE_URL;
    if (!wpUrl) { console.error('❌ ERROR: WP_BASE_URL not set in .env'); process.exit(1); }
    const manifest = JSON.parse(fs.readFileSync('page_manifest.json', 'utf8'));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const page of manifest.pages) {
        if (!page.slug) continue;
        
        let url = page.slug === '/' 
            ? `${wpUrl}/` 
            : `${wpUrl}/${page.slug}/`;
            
        try {
            const res = await fetch(url);
            if (res.ok) {
                const html = await res.text();
                // Check for Elementor footprint
                const hasElementor = html.includes('elementor-page') || html.includes('elementor-');
                const hasHeader = html.includes('Ppal Desktop') || html.includes('Ver Catálogo') || html.includes('elementor-location-header');
                const hasFooter = html.includes('HECHO CON PRECISIÓN INDUSTRIAL') || html.includes('elementor-location-footer');
                
                console.log(`✅ [200 OK] ${page.title} (${url})`);
                console.log(`   - Elementor detectado: ${hasElementor ? 'Sí' : 'No'}`);
                console.log(`   - Header Theme Builder: ${hasHeader ? 'Sí' : 'No'}`);
                console.log(`   - Footer Theme Builder: ${hasFooter ? 'Sí' : 'No'}`);
                
                if (hasElementor && hasHeader && hasFooter) {
                    successCount++;
                } else {
                    console.log("   ⚠️ Faltan elementos clave.");
                    failCount++;
                }
            } else {
                console.log(`❌ [${res.status}] Error en ${page.title} (${url})`);
                failCount++;
            }
        } catch (e) {
            console.log(`❌ Error de conexión en ${page.title}: ${e.message}`);
            failCount++;
        }
    }
    
    console.log(`\n📊 Resumen: ${successCount} correctas, ${failCount} con advertencias/errores.`);
}

checkPages();
