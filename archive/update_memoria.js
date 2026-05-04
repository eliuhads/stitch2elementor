const fs = require('fs');

const memoriaPath = 'memoria_estado.md';
let memoria = fs.readFileSync(memoriaPath, 'utf-8');

memoria = memoria.replace(/\[PENDIENTE\].*/, '[PENDIENTE]: Iniciar Fase 1 del ACTION-PLAN (Instalar RankMath y preparar rankmath_injector.php para SEO masivo).');
memoria = memoria.replace(/\[ESTADO\].*/, '[ESTADO]: Limpieza Semántica Masiva completada. 20 archivos HTML purgados (ALTs añadidos, Lazy Load inyectado). Transpilación V4 e Inyección Batch ejecutada con éxito. IDs de WP desplazados de nuevo (Homepage actual: 1651).');

fs.writeFileSync(memoriaPath, memoria, 'utf-8');
console.log("Memoria actualizada.");
