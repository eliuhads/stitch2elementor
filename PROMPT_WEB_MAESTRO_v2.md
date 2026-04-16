# PROMPT: WEB MAESTRO V2 [v4.6.0] — PIPELINE COMPLETO (`go!`) y MODULAR (`segment!`)

Al recibir `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la anterior. Verifica MCPs según SKILL.md antes de iniciar.

---

## PIPELINE COMPLETO (`go!`)

### FASE 1: PREPARACIÓN BRANDBOOK E IMÁGENES

1. **Lee BrandBook**: Lee todos los archivos en `INFO_BrandBook/`. Extrae colores HEX exactos y tipografías. Genera `design-system/[Nombre]/MASTER.md`. Descarta colores "Material" temporales de Stitch.
2. **Genera `design_system.json`**: Basándote en el BrandBook, crea o actualiza `design_system.json` en el root del skill con colores, fuentes, typoScale, logoUrl, etc. El compiler lo cargará automáticamente.
3. **Crea el Manifest**: Genera `page_manifest.json` con: nombre de cada página, archivos HTML/JSON de origen/destino, slug URL final y título.

---

### FASE 2: GENERACIÓN EN STITCH

1. **Optimiza prompts**: Usa el skill `enhance-prompt` para refinar las directivas que enviarás a Stitch.
2. **Genera pantallas**: Usa `StitchMCP` → `generate_screen_from_text` para crear cada pantalla del sitio.
3. **Descarga HTML**: Para cada pantalla generada, descarga el HTML completo usando `curl` o `Invoke-WebRequest`. **NUNCA** uses `read_url_content` (destruye clases Tailwind). Guarda en `assets_originales/`.

---

### FASE 3: COMPILACIÓN Y POST-PROCESAMIENTO

1. **Compilar JSONs**: Ejecuta `node compiler_v4.js`. Genera los N JSONs de páginas + `header.json` + `footer.json` en `elementor_jsons/`.
2. **Purgar Material Symbols**: Ejecuta `node scripts/fix_material_symbols.js` para eliminar residuos textuales de iconos.
3. **Migrar imágenes** (si aplica): Ejecuta scripts de auditoría/reemplazo de imágenes `lh3.googleusercontent.com` para mapear a WordPress Media Library.
4. **Verificar JSONs**: Abre 2-3 archivos JSON al azar y confirma:
   - Son arrays `[{...}]` (nunca wrapper objects)
   - Tienen `elType`, `id`, `isInner` en cada nodo
   - Los containers usan `flex_gap` (no `gap`), `flex_align_items` (no `align_items`)

---

### FASE 4: INYECCIÓN ELEMENTOR

1. **Inyección Híbrida Autónoma (VÍA ÚNICA)**: Ejecuta `node scripts/sync_and_inject.js` que automáticamente:
    - Sube JSONs y PHPs inyectores vía FTP a `v9_json_payloads/`
    - Copia `page_manifest.json` al servidor para el inyector PHP
    - Dispara `create_hf_native.php` (Header/Footer como `elementor_library`)
    - Dispara `inject_all_pages.php` (inyecta las N páginas secuencialmente)
    - **⚠️ ATENCIÓN: Esto cambiará los IDs de las páginas en WordPress.**
    - **Paso Crítico de Realineación**: Dispara `flush_cache.php` pasándole los nuevos IDs para fijar la Homepage/Blog y limpiar caché (OBLIGATORIO)
    - Auto-elimina los PHPs del servidor por seguridad perimetral

2. **Post-inyección**: 
    - Ejecuta `node scripts/fix_slugs.js` para normalizar URLs según el manifest
    - Verifica slugs con `read_url_content` sobre 2-3 páginas aleatorias

---

### FASE 5: VERIFICACIÓN Y SEO

1. **Verificación Visual**: Usa `read_url_content` sobre cada página inyectada y confirma que el HTML renderizado contiene los títulos, imágenes y CTAs esperados.
2. **Verificación Estructural**: Usa MCP tools (`get_page_structure`) para confirmar que la jerarquía de containers es correcta.
3. **SEO On-Page**: Delega al skill `Agentic-SEO-Skill` para validar meta titles, Schema, descriptions, alt text de imágenes.
4. **Reporte Final**: Genera un resumen Markdown con:
   - Páginas inyectadas (nombre, ID, slug, estado)
   - Errores encontrados y resueltos
   - IDs de Homepage y Blog configurados

---

## MODO MODULAR (`segment!`)

El modo modular permite aislar, convertir e inyectar un **único componente o sección** sin ejecutar el pipeline completo.

### Paso 1: Identificar el Componente
- El usuario especifica qué sección quiere migrar (ej: "Hero de la homepage", "Footer", "Pricing Table")
- Identifica la página de destino en WordPress (ID o slug)

### Paso 2: Extraer HTML del Componente
- Navega al HTML fuente en `assets_originales/` y aísla SOLO el markup del componente
- Si no existe el HTML, descárgalo con `curl` desde Stitch

### Paso 3: Transpilación
- Aplica el patrón FULL+BOXED al componente aislado:
  - **Outer Container**: `content_width: "full"`, background del diseño
  - **Inner Container**: `content_width: "boxed"`, `boxed_width: 1200px`
- Usa las funciones del `compiler_v4.js` como referencia de mapping
- Genera un array JSON puro `[{...}]`

### Paso 4: Validación Pre-Inyección
- Verifica que el JSON es un array válido
- Confirma que no hay wrappers `{ version, content }` 
- Revisa que todos los nodos tienen `id`, `elType`, `isInner`, `elements`

### Paso 5: Inyección Micro
- Usa MCP tools (`update_elementor_data`) para inyectar el JSON en la página destino
- O apéndelo como nueva sección al final del contenido existente
- Ejecuta `flush_cache.php` para regenerar CSS

### Paso 6: Verificación
- Usa `read_url_content` para confirmar que el componente aparece correctamente
- Verifica que el contenido colindante no fue alterado

---

## REGLAS TRANSVERSALES (ambos modos)

1. **Nunca** abras navegadores locales (Playwright, Chromium, browser_subagent)
2. **Siempre** ejecuta `flush_cache.php` al final de cualquier inyección
3. **Nunca** envíes JSON con wrapper objects — siempre `[{...}]` plain array
4. **Nunca** hagas peticiones REST API concurrentes — secuencial estricto
5. **Siempre** consulta `Stitch_Elementor_Guide_GENERAL_V1.md` ante errores de layout
6. **Siempre** verifica que `design_system.json` existe antes de compilar
