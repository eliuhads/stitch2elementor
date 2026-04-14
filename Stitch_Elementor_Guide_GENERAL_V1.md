# Referencia Técnica: Stitch a Elementor V4.1

Este manual contiene las directivas fundamentales de conversión semántica del HTML de Stitch en configuraciones Elementor nativas, además de las advertencias anti-bloqueo del sistema.

## 1. Patrón Arquitectónico Flex Container (FULL+BOXED)
Nunca asumas configuraciones heredadas de "Columns o Sections". Usa el API Flexbox nativo de Elementor.

Para prevenir que el contenido horizontal colisione con el Viewport en resoluciones >1024px, emplea:
- **Outer Container**: `content_width: "full"`, Background color asignado. Padding `{top:96, bottom:96, left:0, right:0, unit:'px'}`.
- **Inner Container**: `content_width: "boxed"`, `boxed_width: 1200px`. Padding `{top:0, bottom:0, left:60, right:60, unit:'px'}` (Ajustar a 40px param tables, y 20px Mobile).

## 2. Equivalencias Responsivas críticas
Tailwind se rige "Mobile First", Elementor asume "Desktop First". Debes invertir la regla arquitectónica de visualización.
- `flex-col sm:flex-row` → `flex_direction: "row"`, `flex_direction_mobile: "column"`.
- `flex-col lg:flex-row` → `flex_direction: "row"`, `flex_direction_tablet: "column"`, `flex_direction_mobile: "column"`.
- `space-y-4` → `flex_gap: {unit:"px", size:16}`, `flex_direction: "column"`.
- `w-1/2` → `width: {unit:"%", size:50}`, `width_mobile: {unit:"%", size:100}`.
- Valores Mapeados Obligatorios: `flex_gap`, `flex_align_items`, `flex_justify_content`, `_margin` y `align` (NUNCA usar properties antiguas estandarizadas `gap` o `margin`).

## 3. Listado de Control de Prevención (Errores Sistémicos)
- **JSON Wrapper Fatal**: `_elementor_data` necesita obligaroriamente que introduzcas la cabecera array list `[{}]`. Estructuras como `{"version": "0.4", "content": [...]}` generan quiebre 500 del servidor.
- **URL Scraping fallidos**: El uso de `read_url_content` reduce la captura HTML a Markdown. Para HTML real se requiere `curl` o `Invoke-WebRequest`.
- **Assets de caducidad (Stitch lh3):** Siempre migra las fuentes a WP MEDIA LIBRARY; las fotos generadas por IA de Stitch duran pocas horas.
- **Sanitización Material**: Stitch expone nombres visuales por iconos erróneamente detectados; ejecuta `fix_material_symbols.js` previo inyección.
- **Editor Config Overwrite**: Nunca edites el `mcp_config.json` directamente con shell tools dentro del agente o causarás crashes del event loop IDE.

## 4. Scripts Inlcuidos del Ecosistema Local
- `compiler_v4.js`: Transpiler Principal.
- `fix_slugs.js`: Regularización de Rutas REST sin pasar por UI Elementor.
- `replace_stitch_images.js` y `apply_image_replacements.js`: Enlace sistemático de Assets WP vs Stitch RAW.
- `fix_buttons.js`: Aplicación forzada CSS color codes desde variables del Brandbook.
