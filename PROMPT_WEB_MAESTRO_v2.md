# PROMPT: WEB MAESTRO V2 [v4.6.7] — PIPELINE COMPLETO (`go!`) y MODULAR (`segment!`)

## ⚙️ Protocolo de Checkpoint (LEER PRIMERO)

Antes de iniciar cada paso individual:
1. Verifica si `pipeline_state.json` existe y tiene `trigger: "go!"`.
   Si existe con datos, pregunta al usuario: `¿Continuar pipeline existente o iniciar nuevo?`

Después de completar cada paso individual:
1. Actualiza `pipeline_state.json` con el estado actual.
2. Muestra `✅ [nombre del paso]` al usuario.
3. Espera `conti!!` antes de ejecutar el siguiente paso.

La lista de pasos para `pendientes[]` es:
- "env-check-mcps"
- "env-check-skills"
- "brandbook-read"
- "manifest-create"
- "stitch-create-project"
- "stitch-generate-[pagina]" (uno por página)
- "stitch-approve-screens"
- "compile-[pagina]" (uno por página)
- "wp-create-pages"
- "wp-inject-[pagina]" (uno por página)
- "wp-inject-header"
- "wp-inject-footer"
- "post-fix-slugs"
- "post-fix-symbols"
- "post-fix-images"
- "post-fix-links"
- "seo-delegate"

---

Al recibir `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la anterior. Verifica MCPs según SKILL.md antes de iniciar.

---

## PIPELINE COMPLETO (`go!`)

### FASE 1: PREPARACIÓN BRANDBOOK Y LOGOS

1. **Lee BrandBook**: Lee todos los archivos en `INFO_BrandBook/`. Extrae colores HEX exactos, tipografías y SOLO archivos de logo en formato SVG. NUNCA uses imágenes de referencia de carpetas locales (provocan deformación del layout). Genera `design-system/[Nombre]/MASTER.md`. Descarta colores "Material" temporales de Stitch.
2. **Genera `design_system.json`**: Basándote en el BrandBook, crea o actualiza `design_system.json` en el root del skill con colores, fuentes, typoScale, logoUrl, etc. El compiler lo cargará automáticamente.
3. **Crea el Manifest**: Genera `page_manifest.json` con: nombre de cada página, archivos HTML/JSON de origen/destino, slug URL final y título.

---

### FASE 2: GENERACIÓN EN STITCH

1. **Optimiza prompts**: Usa el skill `enhance-prompt` para refinar las directivas que enviarás a Stitch.
2. **Genera pantallas**: Usa `StitchMCP` → `generate_screen_from_text` para crear cada pantalla del sitio. **OBLIGATORIO**: Debes configurar siempre el parámetro `modelId` con el valor `GEMINI_3_PRO` o superior, y el parámetro `deviceType` con el valor `DESKTOP` para garantizar layouts expansivos y responsivos (nunca uses MOBILE ni dejes los valores por defecto).
3. **Extracción Segura**: Descarga el HTML con flag de error fatal: `curl --fail --max-time 30 -L -o [nombre].html "$URL"`. Si curl retorna código distinto de 0, detén la fase y reporta el error HTTP al usuario. NUNCA proceses un HTML vacío o de error. **NUNCA** uses `read_url_content` (destruye clases Tailwind). Guarda en `assets_originales/`.

---

### FASE 3: COMPILACIÓN Y POST-PROCESAMIENTO

1. **Compilar JSONs**: Ejecuta `node scripts/compiler_v4.js`. Genera los N JSONs de páginas + `header.json` + `footer.json` en `elementor_jsons/`.
2. **Purgar Material Symbols**: Ejecuta `node scripts/fix_material_symbols.js` para eliminar residuos textuales de iconos.
3. **Verificar JSONs**: Abre 2-3 archivos JSON al azar y confirma:
   - Son arrays `[{...}]` (nunca wrapper objects)
   - Tienen `elType`, `id`, `isInner` en cada nodo
   - Los containers usan `flex_gap` (no `gap`), `flex_align_items` (no `align_items`)
   - Las URLs de imágenes son de Google Stitch (`lh3.googleusercontent.com/*`) — **no las reemplaces manualmente**: el inyector PHP las procesa automáticamente durante la FASE 4.

---

### FASE 4: INYECCIÓN ELEMENTOR

> **⚠️ DOCTRINA ID-SHIFTING**: Cada ejecución de `sync_and_inject.js` asigna **NUEVOS IDs** en WordPress. Cualquier `wp_id` previo queda OBSOLETO inmediatamente. El flujo correcto es SIEMPRE: inyectar → capturar nuevos IDs → realinear Homepage → limpiar caché.

1. **Validación Pre-Inyección**: Antes de inyectar cualquier página, valida su JSON contra `schemas/elementor_data.schema.json`. Comando: `node -e "const s=require('./schemas/elementor_data.schema.json'); const d=require('./[archivo].json'); const Ajv=require('ajv'); const ajv=new Ajv(); const valid=ajv.validate(s,d); if(!valid){console.error(ajv.errors);process.exit(1);}"`. Si la validación falla, NO inyectes y reporta el error al usuario.

2. **Inyección Híbrida Autónoma (VÍA ÚNICA)**: Ejecuta `node scripts/sync_and_inject.js` que automáticamente:
    - Sube JSONs y PHPs inyectores vía FTP a `v9_json_payloads/`
    - Copia `page_manifest.json` al servidor para el inyector PHP
    - Dispara `create_hf_native.php` (Header/Footer como `elementor_library`)
    - Dispara `inject_all_pages.php` (inyecta las N páginas secuencialmente)
    - **⚠️ ATENCIÓN: Esto cambiará los IDs de las páginas en WordPress.**
    - **Paso Crítico de Realineación ("Protocolo AHORA SI")**: Dispara `flush_cache.php` pasándole los nuevos IDs para fijar la Homepage/Blog y limpiar caché (OBLIGATORIO)
    - Auto-elimina los PHPs del servidor por seguridad perimetral

3. **Protocolo AHORA SI — Flujo de Éxito Confirmado** (ejecutar SIEMPRE post-inyección):
    ```
    1. Inyectar páginas → Los IDs cambian en WordPress
    2. Capturar el NUEVO ID de Homepage (del log de sync_and_inject.js o via MCP get_pages)
    3. Actualizar 'home_id' en page_manifest.json con el nuevo ID
    4. Ejecutar flush_cache.php con el nuevo ID → Fija Homepage + limpia caché Elementor
    ```

4. **Modo Config-Only** (usar cuando NO se quiere re-inyectar contenido):
    - Si solo se necesita cambiar la Homepage sin alterar los IDs actuales, usar `node scripts/maintenance_only.js`
    - Este modo aplica SOLO el paso de configuración de `page_on_front` y `flush_cache` sin tocar el contenido
    - **Cuándo usarlo**: Tras un crash de pipeline, para corregir la Homepage sin perder los IDs estables

5. **Post-inyección**: 
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
7. **ID-Shifting es inevitable**: Tras cualquier `sync_and_inject.js`, ejecuta siempre el Protocolo AHORA SI. Nunca asumas que los IDs anteriores son válidos.
8. **Modo Config-Only para mantenimiento**: Si el sitio está estable y solo necesitas ajustar la Homepage, usa `maintenance_only.js` — nunca re-inyectes solo para eso.
