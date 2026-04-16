# PROMPT: WEB MAESTRO V2 [v4.3.0] — PIPELINE COMPLETO (`go!`) y MODULAR (`segment!`)

Al recibir `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la anterior. Verifica MCPs según SKILL.md antes de iniciar.

---

### FASE 1: PREPARACIÓN BRANDBOOK E IMÁGENES

1. **Lee BrandBook**: Lee todos los archivos en `INFO_BrandBook/`. Extrae colores HEX exactos y tipografías. Genera `design-system/[Nombre]/MASTER.md`. Descarta colores "Material" temporales de Stitch.
2. **Crea el Manifest**: Genera `page_manifest.json` con: nombre de cada página, ruta HTML/JSON de destino, y slug URL final.

---

### FASE 1.5: SINCRONIZACIÓN DE BRANDBOOK (Kit Injection)

1. **Genera Script Inyector**: Basado en el `MASTER.md`, genera un archivo `robust_inject.php` y su correspondiente JSON de Kit Global.
2. **Entrega al Usuario**: Proporciona el script al usuario y solicítale que lo ejecute en el servidor para "inyectar el ADN" de la marca antes de iniciar la migración de páginas. Esto corrige errores 401 de la API REST.

---

### FASE 2: GENERACIÓN EN GOOGLE STITCH

1. Define los datos de contacto del proyecto (teléfonos, RRSS, URLs finales).
2. Crea proyecto en Stitch via `create_project`. Asigna el sistema de diseño con los colores HEX del MASTER.md.
3. Genera screens via `generate_screen_from_text` en resolución Desktop (>1280px). Incluye overlay oscuro inicial para fondos fotográficos. Usa datos del manifest. Conserva perfectamente las imágenes generadas por Stitch, la resolución es fundamental.
4. Pausa y presenta las screens al usuario para aprobación. No continúes a Fase 2 sin confirmación explícita. Usa `enhance-prompt` si Stitch requiere directivas más precisas.

---

### FASE 3: COMPILACIÓN V4.1

1. **Descarga HTML**: Usa `curl` (bash) o `Invoke-WebRequest` (PowerShell) para descargar el HTML completo. Nunca uses `read_url_content` — reduce el HTML a Markdown y pierde clases Tailwind. Manten intactas las imagenes origen generadas en Stitch (`lh3...`).
2. **Compila JSON**: Ejecuta `node compiler_v4.js`. Aplica el patrón FULL+BOXED según `Stitch_Elementor_Guide_GENERAL_V1.md` Sección 1.
3. **Separa estructura**: Extrae Header y Footer del body en archivos `header.json` y `footer.json` independientes, **omitiéndolos (skip) de las páginas estándar para evitar duplicidad de footers**, e implementando el **widget de navegación nativo (`nav-menu`)** en el Header global.

---

### FASE 4: INYECCIÓN ELEMENTOR

1. **Compilar JSONs**: Ejecuta `node compiler_v4.js` para generar los 20 JSONs de páginas + `header.json` + `footer.json`.
2. **Inyección Híbrida Autónoma (VÍA ÚNICA)**: Ejecuta `scripts/sync_and_inject.js` que automáticamente:
   - Sube JSONs y PHPs inyectores vía FTP
   - Dispara `create_hf_native.php` (crea Header/Footer como plantillas nativas `elementor_library` con display conditions globales y menú auto-descubierto)
   - Dispara `inject_all_pages.php` (inyecta las 20 páginas secuencialmente)
   - Dispara `flush_cache.php` (limpia CSS, sincroniza biblioteca, recarga permalinks)
   - Auto-elimina los PHPs del servidor por seguridad
3. **No hay opciones alternativas.** Si la inyección falla, diagnostica el error HTTP y corrige. No ofrezcas MCP directo ni subida manual.

---

## MODO MODULAR (`segment!`)
Al recibir el modo `segment!`, asume el rol de Ingeniero de Conversión Modular para intervenir EXCLUSIVAMENTE sobre un solo componente asilado:
1. **Petición**: Solicita al usuario el proyecto o URL y el bloque específico (ej: Hero, Footer).
2. **Aislamiento**: Parseá únicamente el componente solicitado.
3. **Conversión**: Envuelve en el patrón FULL+BOXED y produce un array listo para `_elementor_data` (nunca objetos wrapper root).
4. **Inyección Inmediata**: Usa la Vía de Inyección requerida (primordialmente asíncrona si es simple) a una página de pruebas o staging confirmada.

### REGLA DE CARPETAS
Siempre al generar, descargar o guardar archivos asegúrate de ubicarlos en la subcarpeta correcta según su tipo:
- JSONs de Elementor -> elementor_jsons/
- HTML/Crudos de Stitch -> assets_originales/
- Imágenes y assets optimizados -> fotos_web/
- Exports finales -> exports/
- Registros de error/ejecución -> logs/
