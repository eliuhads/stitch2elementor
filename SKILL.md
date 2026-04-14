---
name: stitch2elementor
description: Migrates Google Stitch AI designs to WordPress Elementor pages via HTML parsing and WP REST API injection. 100% free, no premium plugins required.
version: 2.0.0
author: "@eliuhads"
allowed-tools:
  - "stitch*:*"
  - "wp-elementor*:*"
  - "elementor*:*"
  - "Read"
  - "Write"
  - "Bash"
---

# Stitch → Elementor Migration Skill

You are an **autonomous migration agent** that converts Google Stitch AI designs into fully functional WordPress Elementor pages. The entire pipeline is free and open-source — no premium plugins, no freemium converters, no manual rebuilding.

## Overview

This skill enforces a **segmented, component-by-component** design-to-production pipeline. **Do NOT process entire pages at once** — full-page migration produces massive JSON files, WAF blockages, and single points of failure.

Instead, we generate and inject sections individually (just like headers and footers):

```
Google Stitch (AI Design) → Prompt "segment!" → html2json-segment → Elementor Section JSON → WP Assemblage
```

Every page preserves **100% design fidelity** because the real Stitch HTML (with Tailwind classes, fonts, and custom styles) is wrapped inside native Elementor Flexbox containers as HTML widgets.

## Prerequisites

### Required MCP Servers (3)

| Server | Purpose | Install |
|--------|---------|---------|
| **StitchMCP** | Read designs from Google Stitch | `mcp-remote` pointing to `stitch.googleapis.com/mcp` |
| **wp-elementor-mcp** | Manage WordPress pages + Elementor data | `npm install -g wp-elementor-mcp` | [Repo](https://github.com/eliuhads/wp-elementor-mcp) |
| **elementor-mcp** | File-based Elementor injection | `npm install -g elementor-mcp` | [Repo](https://github.com/eliuhads/elementor-mcp) |

### Required WordPress Setup

- WordPress with Elementor (free version works)
- An Application Password for REST API auth (WP Admin → Users → Profile → Application Passwords)
- Admin-level user permissions

### Required Local Tools

- Node.js 18+ (for the converter script)
- PowerShell or Bash (for downloading HTML files)

## Companion Skills Ecosystem

This skill orchestrates a full design-to-production pipeline. The following companion skills extend its capabilities at each phase. **Read each skill's SKILL.md before using it.**

### CORE SKILLS (Required — Used in every migration)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **html-to-json** | `.agent/skills/html-to-json/` | Rules and schema for converting HTML/CSS to valid Elementor JSON. Defines widget mapping, container hierarchy, responsive keys, and validation checklists. | Phase 2: Compilation |
| **ui-ux-pro-max** | `.agent/skills/ui-ux-pro-max/` | Design intelligence database: 67 styles, 96 palettes, 57 font pairings, 99 UX guidelines. Use to select color schemes, typography, and design direction. | Phase 0: BrandBook + Phase 1: Stitch Design |
| **design-md** | `skills/design-md/` | Analyzes Stitch projects and synthesizes a semantic design system into `DESIGN.md` files. Extracts tokens, colors, typography, and spacing from Stitch screens. | Phase 0: BrandBook → MASTER.md |
| **webp-optimizer** | `skills/webp-optimizer/` | Batch converts PNG/JPG images to optimized WebP using Sharp. Critical for WordPress performance and page load speed. | Phase 0: Image Preparation |

### DESIGN & GENERATION SKILLS (Recommended — Improve Stitch output quality)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **enhance-prompt** | `skills/enhance-prompt/` | Transforms vague UI ideas into polished, Stitch-optimized prompts. Adds UI/UX keywords, injects design system context, structures output for better generation. | Phase 1: Before generate_screen_from_text |
| **stitch-loop** | `skills/stitch-loop/` | Autonomous iterative site-building loop. Generates a page, integrates it, prepares instructions for the next iteration. Useful for building multi-page sites. | Phase 1: Multi-page generation |
| **html2json-segment** | `skills/html2json-segment/` | Generates native Elementor JSON templates segment by segment with FULL+BOXED structure. Use `segment!` trigger. | Phase 1/2: Segment JSON Gen |

### POST-PRODUCTION SKILLS (Recommended — Quality and SEO)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **Agentic-SEO-Skill** | `skills/Agentic-SEO-Skill/` | Full SEO audit suite: 16 sub-skills, 10 specialist agents, 33 scripts. Technical SEO, Core Web Vitals, E-E-A-T, schema markup, hreflang, GEO/AEO analysis. | Phase 4: SEO + Verification |
| **visual-tester** | `skills/visual-tester/` | Auditoría visual 100% remota usando `read_url_content` y MCP API tools. **🚫 PROHIBIDO abrir navegadores locales (browser_subagent, Playwright, Chromium).** Toda verificación debe ser vía API o HTTP estático. | Phase 4: Visual Verification |

> **🚫 REGLA CRÍTICA GLOBAL — NUNCA ABRIR NAVEGADORES LOCALES:**
> Está **TERMINANTEMENTE PROHIBIDO** usar `browser_subagent`, Playwright, Puppeteer, o cualquier herramienta que abra Chrome/Chromium en la máquina del usuario. Consume recursos, congela el sistema y es **INACEPTABLE**. Toda verificación visual se hace con `read_url_content` (URLs públicas) o MCP API tools (`get_elementor_elements`, `get_page`, `validate_elementor_data`).


### ADVANCED SKILLS (Optional — For specific needs)

| Skill | Location | Purpose | When to Use |
|-------|----------|---------|-------------|
| **react-components** | `skills/react-components/` | Converts Stitch designs into modular Vite + React components with AST validation. | When building React apps instead of WordPress |
| **remotion** | `skills/remotion/` | Generates walkthrough videos from Stitch projects using Remotion with transitions and zooming. | For marketing demos or client presentations |
| **shadcn-ui** | `skills/shadcn-ui/` | Expert shadcn/ui component integration with Radix UI and Tailwind CSS. | When building modern React/Next.js interfaces |

### How the Skills Fit in the Pipeline

```
[Phase 0: Preparation]
  ui-ux-pro-max → Select design direction, palettes, typography
  design-md → Analyze BrandBook → Generate DESIGN.md / MASTER.md
  webp-optimizer → Convert all images to optimized WebP

[Phase 1: Design in Stitch]
  enhance-prompt → Polish prompts before sending to Stitch
  stitch-loop → Automate multi-page generation iteratively
  html2json-segment → Generate Elementor JSON sections (segment!) directly

[Phase 2: Compilation]
  html-to-json → Schema, rules, widget mapping for Elementor JSON
## License

This skill is free and open-source. Use it, modify it, share it.
Built with ❤️ by the community, for the community.



---
# HTML to Elementor JSON Guidelines (Integrated)
# HTML to Elementor JSON Guidelines

The raw DOM extraction rules, widget mappings, and Flexbox hierarchy conversions are maintained externally in the sister skill html-to-json.

👉 **[See ../html-to-json/SKILL.md](../html-to-json/SKILL.md)** for low-level conversion logic, Schema references, and DOM Walker anti-bloat strategies.

These are the battle-tested fixes discovered during 8+ conversations and a full 20-page production migration (Evergreen Venezuela, April 2026). **If you are building a new compiler or modifying the template, read ALL of these.**

The production-hardened compiler is at `scripts/compiler_v4_template.js` — copy to your project root as `compiler_v4.js`, update CONFIG, and run.

### Fix #1 — Tailwind Mobile-First ≠ Elementor Desktop-First
**Problem:** Tailwind is mobile-first (`flex-col sm:flex-row`). Elementor is desktop-first.
**Impact:** Side-by-side layouts rendered as stacked columns on desktop.
**Solution:** The compiler now correctly maps:
```
flex-col sm:flex-row  → desktop: row, mobile: column
flex-col md:flex-row  → desktop: row, mobile: column
flex-col lg:flex-row  → desktop: row, tablet: column, mobile: column
```
This is the **#1 most impactful fix**. Without it, your entire site looks wrong.

### Fix #2 — `bg-[#hex]/opacity` Patterns
**Problem:** Tailwind arbitrary values like `bg-[#0B0F1A]/80` were ignored.
**Solution:** Regex extracts hex + opacity, converts to `rgba(r,g,b,opacity)`.
Also fixes `text-[#28B5E1]` and `border-[#368A39]` arbitrary values.

### Fix #3 — `space-y-*` / `space-x-*` → flex_gap
**Problem:** `space-y-4` creates vertical spacing but the compiler didn't capture it.
**Solution:** Maps to `flex_gap` + forces `flex_direction: column` (for space-y) or `row` (for space-x).

### Fix #4 — `h-screen` → min_height: 100vh
**Problem:** `h-screen` was not mapped. Old template used `min-h-screen → 800px` (wrong).
**Solution:** Both `h-screen` and `min-h-screen` now map to `{unit: 'vh', size: 100}`.

### Fix #5 — `border-l-4` + Arbitrary Border Colors
**Problem:** Left/right/bottom borders were ignored. Only `border-t-4` worked.
**Solution:** Added handlers for `border-l-4`, `border-r-4`, `border-b-4`, `border-t`, and arbitrary `border-[#hex]` colors.

### Fix #6 — Width Classes (`w-1/2`, `w-1/3`, `md:w-1/2`)
**Problem:** Tailwind fractional widths weren't translated. Side-by-side containers both took 100%.
**Impact:** Critical for 2-column and 3-column layouts.
**Solution:** Maps `w-1/2` → `width: {unit:'%', size:50}` + `width_mobile: {unit:'%', size:100}`.

### Fix #7 — Text-Only Divs → text-editor Widgets
**Problem:** Divs with only text (no child elements) were wrapped in containers with no widget inside. The text was invisible.
**Impact:** Stats banners ("15+ Years", "5000+ Clients") showed as empty dark bars.
**Solution:** Detect `$(el).children().length === 0 && text` → emit `text-editor` widget with inline styling.

### Fix #8 — Captured Background Images from `absolute inset-0`
**Problem:** Stitch uses `<div class="absolute inset-0"><img src="..." class="object-cover"></div>` for section backgrounds. These were being skipped as decorative.
**Solution:** `processSection()` now scans for `absolute inset-0` children with `<img>` tags and captures the src as `background_image` on the outer container.

### Fix #9 — Default Dark Background on ALL Sections
**Problem:** Sections without explicit `bg-*` classes rendered as white.
**Impact:** The entire page looked like a broken light-theme site.
**Solution:** `processSection()` defaults to `CONFIG.colors.background` if no bg is found.

### Fix #10 — Smarter Tree Pruning
**Problem:** Over-aggressive tree pruning collapsed containers that had `flex_direction`, `background`, `flex_gap`, `width`, `border`, `min_height`, or `padding`.
**Impact:** Layout structures were destroyed.
**Solution:** Check for "structural role" before flattening:
```js
const hasStructuralRole = containerSettings.flex_direction ||
  containerSettings.background_background ||
  containerSettings.flex_gap ||
  containerSettings.width ||
  containerSettings.border_border ||
  containerSettings.min_height ||
  containerSettings.padding;
```

### Fix #11 — Hero Image Auto-Injection from Manifest
**Problem:** Manually editing hero JSONs for 20 pages was tedious and error-prone.
**Solution:** `page_manifest.json` now has `hero_pairs` with WP Media Library IDs. The compiler auto-injects `background_image + background_image_mobile + overlay` on the first section.

### Fix #12 — `border-white/XX` Opacity Patterns
**Problem:** `border-white/20` was treated as a class name, not parsed.
**Solution:** Regex extracts the opacity number, converts to `rgba(255,255,255,opacity)`.

### Fix #13 — `text-white/70` Opacity Text Colors
**Problem:** Like border-white, text opacity variants weren't parsed.
**Solution:** `extractTextColor()` handles `text-white/XX` → `rgba(255,255,255,opacity)`.

### Fix #14 — `flex-shrink-0` Empty Containers
**Problem:** Icon placeholder divs with `flex-shrink-0` produced empty dark bars after Material Symbols were stripped.
**Solution:** Skip containers with `flex-shrink-0` if they have zero children after processing.

### Fix #15 — `flex` Class Without Direction → Default Row
**Problem:** A `<div class="flex">` without explicit `flex-row` defaulted to no direction.
**Solution:** If `flex` class is present and no `flex_direction` was set, default to `row`.

### Fix #16 — Flex Row Containers Get Auto Mobile Stacking
**Problem:** Row containers without explicit responsive classes didn't stack on mobile.
**Solution:** All `flex_direction: 'row'` containers automatically get `flex_direction_mobile: 'column'` and `flex_wrap: 'nowrap'`.

---

**These fixes are ALL included in `scripts/compiler_v4_template.js`.** Copy it to your project root, update CONFIG, and run.

*V2.0.0 — Production-hardened, April 2026 — Verified with 20-page Evergreen Venezuela migration*



### Fix #17 � Native Elementor Icon Widgets for Material Symbols
**Problem:** Early compiler versions stripped <span class="material-symbols-outlined"> because Elementor doesn't natively use Material Symbols offline.
**Impact:** Pages were missing critical UI semantic and visual icons.
**Solution:** Added mapMaterialToFontAwesome() dictionary mapping. Now, the compiler intercepts Material Symbols and emits native Elementor widgetType: 'icon' nodes using equivalent FontAwesome 5 solid vectors.

### Fix #18 � Background Image ALT Transfer for Contextual Asset Mapping
**Problem:** The apply_image_replacements.js script mapped WP media assets by reading the alt string in JSON. However, the compiler was hardcoding alt: 'background' when extracting absolute inset-0 img elements.
**Impact:** Different sections (like Hero and CTA) would end up mapping to the same generic default image (solar_res).
**Solution:** The compiler now actively transfers the alt or data-alt attributes from the Stitch original img to the outerSettings.background_image.alt, allowing downstream scripts to assign section-specific background replacements.

### Fix #19 � Comprehensive Custom Button Class Detection
**Problem:** Buttons relying strictly on custom arbitrary Tailwind utility values (like bg-[#8FDA3E] or px-12) bypassed the button detection logic and were rendered as plain text-editor links.
**Impact:** Important generic CTAs and WhatsApp buttons were broken visually.
**Solution:** Expanded the button recognition logic tag === 'a' to check for higher range padding values (px-12) and dynamically detect arbitrary background classes (c.startsWith('bg-[')).

---
*V2.1.0 � Production-hardened, Final Adjustments April 2026*


---

# HISTORIAL DE ACTUALIZACIONES (MIGRATED)
# Actualizaciones del Pipeline — Evergreen Venezuela

## PENDIENTES / TODO FUTURO

### 1. Automatización de Elementor Template Type y Theme Builder
- **Problema:** Actualmente el usuario debe intervenir manualmente en WP para dos cosas:
  - Inicializar cada página en "Elementor Full Width" (ya que la REST API a veces falla si nunca se ha abierto el editor de Elementor para que grabe sus metadatos).
  - Guardar el `header.json` y `footer.json` en templates del Theme Builder "Entire Site".
- **Objetivo Futuro:** Encontrar via programación un modo con el `WP-Elementor-MCP` que permita:
  - Forzar los meta fields (`_elementor_edit_mode`, `_wp_page_template = elementor_header_footer`) correctamente y obligar a WP a refrescar sin necesidad del clásico click humano en "Editar con Elementor".
  - Inyectar directamente Elementor Templates globales (y asignarle las display conditions `Entire Site`) vía API sin usar páginas puente `[TEMPLATE]`.

### 2. Modificación de `html2json-segment` skill (Wrapper Elementor)
- **Problema:** El skill generaba secciones exportando el JSON en formato crudo de `Array` en la raíz `[ {...} ]`. Esto causaba el error **"Invalid Content In File"** al intentar usar el botón manual de "Importar plantilla" en la Biblioteca de WordPress/Elementor.
- **Solución implementada:** Se debe proveer el wrapper clásico de exportación de template para que Elementor lo acepte en el importador UI.
- **Objetivo Futuro:** Actualizar el archivo `SKILL.md` en `html2json-segment` para que, en lugar del array directo, exija este wrapper en la raíz cuando se genera para importación visual de archivo:
```json
{
  "version": "0.4",
  "title": "{{Nombre de la Sección}}",
  "type": "section",
  "content": [
    // El array de contenedores va aquí adentro
  ]
}
```

### 3. Automatización End-to-End de la skill `html2json-segment`
- **Problema:** La skill estaba diseñada para exportar JSON como texto y pedir al usuario que lo copie/pegue o lo importe manualmente, así como pedirle que asigne las fotos a mano.
- **Solución implementada:** Se integró la capacidad de inyectar directo a WordPress. El asistente JAMÁS debe mandar al usuario a hacer tareas rutinarias (como importar en la UI de WP). Debe usar los MCP de Elementor (`wp-elementor-mcp` o `elementor-mcp`) para buscar la página, borrar el contenido previo si se solicitó, inyectar el JSON y asignar directamente las URLs de la Biblioteca de Medios en la data del JSON antes de inyectar.
- **Objetivo Futuro:** Reescribir `html2json-segment` para exigir que el despliegue a la página sea 100% automático (vía API).

### 4. Hito Alcanzado: Despliegue de Homepage
- **Logro:** Se inyectó exitosamente `homepage_cleaned.json` a la página "Homepage" (ID 75) utilizando `update_page_from_file` vía MCP. 
- **Conclusión:** Se comprobó que Elementor lee perfectamente el formato de Array Crudo en su backend (`_elementor_data`) cuando se inyecta programáticamente. El "Wrapper" solo es necesario si se importa a través del UI/Boton "Importar plantilla". Por tanto, la automatización del flujo es viable 100% con los crudos del Array que arroja el compilador V4.

### Actualizaci�n 13-04-2026: Correcci�n Final del Compilador V4 & Injection (V2.1.0)
Se han solucionado tres deficiencias cr�ticas en la fidelidad visual de los elementos inyectados program�ticamente:
1. **Iconos Nativos (Fix #17)**: El compilador ya no elimina los spans vac�os de Material Symbols, sino que los mapea en un diccionario hacia FontAwesome y genera estructuralmente el nodo 'icon' en Elementor.
2. **Transferencia de Atributos ALT de Fondos (Fix #18)**: El compilador ahora extrae el 'alt' / 'data-alt' originado en los contenedores de Stitch (<img class='absolute inset-0'>) y los transfiere al 'background_image.alt', evitando la colisi�n de im�genes gen�ricas que provocaba que secciones dispares (como CTA y Hero) heredaran la misma imagen.
3. **Parseo Robusto de Botones (Fix #19)**: Modificada la validaci�n de '<button>' y '<a>' para clasificar enlaces con altas cantidades de padding (px-12) y colores duros en Tailwind (bg-[#8FDA3E]) como botones Elementor leg�timos, asegurando coherencia visual en CTAs generales.
- **Acci�n:** Estas modificaciones fueron integradas en 'compiler_v4.js', corridas globalmente y publicadas en 'elemento_json', para luego inyectar con la herramienta de 'wp-elementor_mcp' bajo el pageId 75, resultando en una r�plica exacta sin interacci�n manual GUI. El archivo base en 'stitch2elementor/SKILL.md' tambi�n fue actualizado reflejando estas adiciones.


