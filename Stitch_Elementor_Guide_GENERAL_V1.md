# Referencia Técnica: Stitch → Elementor V4.1

Consulta este documento ante errores técnicos, dudas sobre mapeos responsivos o para obtener las especificaciones exactas del patrón de layout.

---

## 1. Patrón Arquitectónico FULL+BOXED (Única Fuente de Verdad)

Usa exclusivamente el API Flexbox nativo de Elementor. Nunca uses el sistema heredado Columns/Sections.

**Outer Container** (fondo de sección, ancho completo):
- `content_width: "full"`
- `background_color`: asignado según diseño
- `padding: { top: 96, bottom: 96, left: 0, right: 0, unit: "px" }`

**Inner Container** (contenedor de contenido, limitado):
- `content_width: "boxed"`
- `boxed_width: 1200px`
- `padding: { top: 0, bottom: 0, left: 60, right: 60, unit: "px" }`
- Ajusta `left/right` a `40px` para tablas y `20px` en Mobile.

---

## 2. Equivalencias Responsivas Tailwind → Elementor

Tailwind usa Mobile-First. Elementor usa Desktop-First. Invierte la lógica de visualización.

| Tailwind | Elementor |
|---|---|
| `flex-col sm:flex-row` | `flex_direction: "row"`, `flex_direction_mobile: "column"` |
| `flex-col lg:flex-row` | `flex_direction: "row"`, `flex_direction_tablet: "column"`, `flex_direction_mobile: "column"` |
| `space-y-4` | `flex_gap: { unit: "px", size: 16 }`, `flex_direction: "column"` |
| `w-1/2` | `width: { unit: "%", size: 50 }`, `width_mobile: { unit: "%", size: 100 }` |

Propiedades obligatorias: `flex_gap`, `flex_align_items`, `flex_justify_content`, `_margin`, `align`.
Propiedades prohibidas (legacy): `gap`, `margin` en su forma estandarizada antigua.

---

## 3. Errores Sistémicos Conocidos

- **JSON Wrapper Fatal**: El campo `_elementor_data` requiere obligatoriamente un array en la raíz: `[{...}]`. Una estructura `{ "version": "0.4", "content": [...] }` genera error 500 en el servidor.
- **HTML truncado por `read_url_content`**: Esta tool reduce el HTML a Markdown y elimina clases Tailwind. Usa `curl` o `Invoke-WebRequest` para exportar HTML completo.
- **Assets caducados (Stitch `lh3`)**: Las imágenes generadas por IA de Stitch expiran en horas. Siempre migra a WP Media Library antes de inyectar.
- **Iconos Material fantasma**: Stitch expone nombres textuales de iconos (ej: `arrow_forward`) como texto visible. Ejecuta `fix_material_symbols.js` antes de inyectar.
- **Sobreescritura de `mcp_config.json`**: Nunca edites este archivo con shell tools desde dentro del agente. Causa crashes del event loop del IDE. Edítalo manualmente desde fuera.

---

## 4. Scripts del Ecosistema Local

| Script | Función | Cuándo ejecutar |
|---|---|---|
| `compiler_v4.js` | Transpiler principal HTML → Elementor JSON | Fase 2 |
| `fix_slugs.js` | Regulariza rutas REST según el manifest | Fase 4, paso 1 |
| `replace_stitch_images.js` | Detecta URLs `lh3` y genera mapa de reemplazos | Fase 4, paso 3 |
| `apply_image_replacements.js` | Aplica el mapa de reemplazos al JSON final | Fase 4, paso 3 |
| `fix_material_symbols.js` | Purga spans textuales de iconos | Fase 4, paso 2 |
| `fix_buttons.js` | Aplica códigos de color del BrandBook a botones | Fase 4, paso 4 |
| `fix_internal_links.js` | Actualiza enlaces internos al dominio final | Fase 4, paso 5 |
