# PROMPT MAESTRO V2 — PIPELINE COMPLETO (`go!`)

Al recibir `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la anterior. Verifica MCPs según SKILL.md antes de iniciar.

---

### FASE 1: PREPARACIÓN BRANDBOOK E IMÁGENES

1. **Lee BrandBook**: Lee todos los archivos en `INFO_BrandBook/`. Extrae colores HEX exactos y tipografías. Genera `design-system/[Nombre]/MASTER.md`. Descarta colores "Material" temporales de Stitch.
2. **Crea el Manifest**: Genera `page_manifest.json` con: nombre de cada página, ruta HTML/JSON de destino, y slug URL final.

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

1. Crea las páginas en borrador con `create_page` de `wp-elementor-mcp` (si no existen).
2. Notifica al usuario: debe configurar manualmente el layout de cada página destino como "Elementor Full Width" o "Elementor Canvas" desde el UI de WordPress antes de continuar.
3. Inyecta los JSON con `update_page_from_file` de forma SECUENCIAL. Espera confirmación de éxito de cada inyección antes de iniciar la siguiente.

---

### FASE 5: POST-PROCESAMIENTO Y SEO

1. Ejecuta `fix_slugs.js` para adaptar los REST slugs al manifest.
2. Ejecuta `fix_material_symbols.js` para eliminar spans textuales de iconos.
3. Ejecuta `fix_buttons.js` para aplicar códigos de color del BrandBook a los botones.
4. Ejecuta `fix_internal_links.js` para actualizar enlaces internos al dominio final.
6. Delega validación final a `Agentic-SEO-Skill` (meta titles, Schema, meta descriptions).
