# PROMPT MAESTRO V2 — PIPELINE COMPLETO (`go!`)

Al recibir el trigger `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la previa.

### FASE -1: COMPROBACIÓN DEL ENTORNO
1. Verifica mediante tool inspection (list_tools u otros) que los MCP `StitchMCP`, `wp-elementor` y `elementor-mcp` estén activos y con conexión. No inicies si hay fallos HTTP con WordPress.
2. Comprueba existencia de Skills hermanos (como `webp-optimizer`, `Agentic-SEO-Skill`, `ui-ux-pro-max`).

### FASE 0: PREPARACIÓN BRANDBOOK E IMÁGENES
1. **Asimila BrandBook**: Lee archivos en `INFO_BrandBook/`. Extrae colores HEX exactos y tipografías. Genera `design-system/[Nombre]/MASTER.md`. (Ignora los colores temporales "Material" provistos por Stitch).
2. **Procesa Imágenes**: Toma en total prioridad y exclusividad el contenido de `IMAGENES_FUENTES/`. Optimiza a formato WebP usando `webp-optimizer`.
3. **Subida a WordPress**: Emplea `upload_media(file_path, title, alt_text)` del MCP respectivo para subir estos assets a la Media Library. Anota sus IDs internos. NUNCA emplees URLs temporales de Google Stitch (`lh3...`).
4. **Crea el Manifest**: Arma `page_manifest.json` mapeando: nombres de página, destino HTML/JSON, URLs finales (slugs), e IDs de WP de los fondos "Hero".

### FASE 1: DESARROLLO EN GOOGLE STITCH
1. Define e integra los datos de contacto del proyecto (Teléfonos, RRSS, Cadenas URL finales).
2. Crea un proyecto en Stitch (`create_project`) y asigna el Systema de Diseño con colores HEX.
3. Solicita la renderización (`generate_screen_from_text`) usando resoluciones Desktop (>1280px). Provee datos explícitos del manifest para la validación visual y solicita un overlay oscuro inicial para fondos fotográficos.
4. Pausa la ejecución si requiere confirmación del usuario para aprobar screens. Emplea la skill `enhance-prompt` si Stitch requiere directivas finas para generar código semántico excelente.

### FASE 2: COMPILACIÓN V4.1
1. **Extracción**: Descarga todo el HTML usando scripts de sistema como bash (`curl`) o PowerShell (`Invoke-WebRequest`). NUNCA uses `read_url_content` para la exportación de archivos HTML final o perderás las clases completas de Tailwind.
2. **Lanzar Compilador**: Ejecuta `node compiler_v4.js` para extraer las plantillas JSON nativas.
3. **Regla de Plantillas**: Genera los componentes en modo `FULL+BOXED` (Container padre fondo ancho completo con pad-vertical 96px, Container hijo 'boxed' maxWidth 1200px con pad horizontal 60px). Separa el Header y Footer autónomamente del body en `header.json` y `footer.json`.

### FASE 3: INYECCIÓN ELEMENTOR
1. Crea las páginas base en borrador con `create_page` de wp-elementor-mcp (si no existían).
2. Notifica al usuario la necesidad manual de asegurar que las páginas destino tengan layout de Elementor configurado (Elementor Full Width o Elementor Canvas desde el UI de WP).
3. Inyecta los JSON empleando `update_page_from_file` SECUENCIALMENTE. Evita transacciones concurrentes destructivas al WP REST API.

### FASE 4: POST-PROCESAMIENTO Y SEO
1. Correción de URLs: Ejecuta `fix_slugs.js` para adaptar REST slugs al manifest.
2. Limpieza UX: Emplea `fix_material_symbols.js` para purgar spans textuales de iconos y `replace_stitch_images.js` para limpiar assets fallidos temporales (`lh3...`).
3. Actualiza enlaces base con `fix_internal_links.js`.
4. Delega el remate final a la `Agentic-SEO-Skill` para asegurar completitud técnica (titulos meta, Schema, description).
