# Stitch → Elementor Workflow Guide (V2.1 - NATIVE COMPILER EDITION)
## Motor: Antigravity + Claude | Stack: Google Stitch → Node.js (Compiler V4.1) → WP REST API → Elementor Native

---

## INTRODUCCIÓN - LA REVOLUCIÓN V4

Esta guía documenta el flujo definitivo para migrar diseños de Google Stitch a WordPress Elementor.
A diferencia de versiones anteriores que usaban un "HTML Widget" monolítico, la Versión 4.1 (V4.1) nativiza completamente el código. El HTML de Stitch se desglosa recursivamente y se convierte en:
  - Containers de Flexbox nativos
  - Headings nativos (H1-H6)
  - Text-editors nativos para párrafos
  - Botones e imágenes nativas

Esto significa que el cliente final puede editar TODOS los textos, colores e imágenes directamente en el panel visual de Elementor sin necesidad de tocar código.

---

## ECOSISTEMA DE SKILLS COMPLEMENTARIOS

Este pipeline usa un ecosistema de skills especializados. **Leer cada SKILL.md antes de usarlo.**

### CORE (Obligatorios)
| Skill | Ubicación | Propósito | Fase |
|-------|-----------|-----------|------|
| **html-to-json** | `.agent/skills/html-to-json/` | Schema y reglas de conversión HTML→Elementor JSON | Fase 3: Compilación |
| **ui-ux-pro-max** | `.agent/skills/ui-ux-pro-max/` | 67 estilos, 96 paletas, 57 font pairings, 99 UX guidelines | Fase 0: BrandBook |
| **design-md** | `skills/design-md/` | Genera DESIGN.md desde proyectos Stitch automáticamente | Fase 0: BrandBook |
| **webp-optimizer** | `skills/webp-optimizer/` | Convierte PNG/JPG a WebP optimizado con Sharp | Fase 0: Imágenes |

### DISEÑO & GENERACIÓN (Recomendados)
| Skill | Ubicación | Propósito | Fase |
|-------|-----------|-----------|------|
| **enhance-prompt** | `skills/enhance-prompt/` | Optimiza prompts para mejor output de Stitch | Fase 1: Diseño |
| **stitch-loop** | `skills/stitch-loop/` | Loop autónomo para generar múltiples páginas | Fase 1: Diseño |

### POST-PRODUCCIÓN (Recomendados)
| Skill | Ubicación | Propósito | Fase |
|-------|-----------|-----------|------|
| **Agentic-SEO-Skill** | `skills/Agentic-SEO-Skill/` | Auditoría SEO: 16 sub-skills, 33 scripts | Fase 6: SEO |
| **visual-tester** | `skills/visual-tester/` | Auditoría visual remota. Usa el **Navegador Satélite** (`browser_subagent`) o `read_url_content` (Prohibido Playwright local) | Fase 6: Verificación |

### AVANZADOS (Opcionales)
| Skill | Ubicación | Propósito | Fase |
|-------|-----------|-----------|------|
| **react-components** | `skills/react-components/` | Stitch → React/Vite (alternativa a WordPress) | Alternativo |
| **remotion** | `skills/remotion/` | Videos de walkthrough desde Stitch | Presentaciones |
| **shadcn-ui** | `skills/shadcn-ui/` | Componentes shadcn/ui para React/Next.js | Alternativo |

---

## PIPELINE COMPLETO (Flujo Validado en Producción)

1. Leer BrandBook + Datos de Contacto ANTES de todo
2. Crear proyecto en Stitch (get_project, NUNCA list_projects)
3. Generar pantallas con prompts detallados (incluir datos reales de contacto)
4. Extraer IDs con script Node.js (regex en output files)
5. Descargar HTMLs (script con seguimiento de redirects)
6. Fix datos de contacto en HTMLs (find/replace script)
7. FIX BrandBook: footers, botones, iconos sociales (fix_brandbook_v2.js + fix_buttons.js)
8. Convertir HTML → Elementor JSON (compiler_v4.js - DOM Walker nativo)
9. Validar JSONs (validate_json.js - 0 issues requerido)
10. Hero images: auto-inyectados desde page_manifest.json hero_pairs (V4.1) — o edición manual si no hay manifest
11. Crear páginas en WordPress via MCP (create_page)
12. **INTERVENCIÓN MANUAL: Convertir cada página a Elementor Canvas**
13. Inyectar Elementor data via MCP (update_page_from_file)
14. Limpiar slugs via REST API (`fix_slugs.js`)
15. Limpiar remanentes de Material Symbols en texto (`fix_material_symbols.js`)
16. Sustitución de Imágenes Temporales de Stitch (`replace_stitch_images.js` + `apply_image_replacements.js`)
17. Actualizar links internos a nuevos slugs (`fix_internal_links.js`)
18. Re-inyectar contenido final a Elementor
19. Verificar renderizado visual en browser

---

## PRE-REQUISITOS Y ENTORNO

### Instalar Servidores MCP (una sola vez)
```
npm install -g wp-elementor-mcp   # https://github.com/eliuhads/wp-elementor-mcp
npm install -g elementor-mcp      # https://github.com/eliuhads/elementor-mcp
(StitchMCP se conecta via mcp-remote, no necesita npm install)
```

### Instalar Skills del Ecosistema
```
Verificar que existen todas las carpetas de skills:
  .agent/skills/html-to-json/
  .agent/skills/ui-ux-pro-max/
  skills/design-md/
  skills/enhance-prompt/
  skills/stitch-loop/
  skills/Agentic-SEO-Skill/
  skills/visual-tester/
  skills/webp-optimizer/
  skills/react-components/   (opcional)
  skills/remotion/           (opcional)
  skills/shadcn-ui/          (opcional)

INSTALAR SKILLS FALTANTES:

  Google Stitch Skills (repo: google-labs-code/stitch-skills):
    npx skills add google-labs-code/stitch-skills --skill design-md --global
    npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global
    npx skills add google-labs-code/stitch-skills --skill stitch-loop --global
    npx skills add google-labs-code/stitch-skills --skill react:components --global
    npx skills add google-labs-code/stitch-skills --skill shadcn-ui --global
    npx skills add google-labs-code/stitch-skills --skill remotion --global

  Agentic SEO Skill (repo: github.com/Bhanunamikaze/Agentic-SEO-Skill):
    git clone https://github.com/Bhanunamikaze/Agentic-SEO-Skill.git
    cd Agentic-SEO-Skill
    bash install.sh --target antigravity --project-dir [ruta_proyecto]

  Custom Skills (ya incluidos — no requieren instalación externa):
    · html-to-json     → .agent/skills/html-to-json/
    · ui-ux-pro-max    → .agent/skills/ui-ux-pro-max/
    · webp-optimizer   → skills/webp-optimizer/ (requiere: npm install sharp)
    · visual-tester    → skills/visual-tester/ (requiere: npx playwright install chromium)
    · stitch2elementor → skills/stitch2elementor/
```

### Configurar mcp_config.json
- StitchMCP con tu API Key de Google
- wp-elementor-mcp y elementor-mcp con misma URL, Usuario Admin y Application Password
- ¡JAMÁS! edites mcp_config.json desde el agente. Siempre manualmente
- Apagar MCPs innecesarios (figma, playwright, firebase, github, context7)

### Prueba de conexión
```
PRUEBA 1 - StitchMCP → create_project (NUNCA list_projects - causa timeout)
PRUEBA 2 - wp-elementor-mcp → get_pages
PRUEBA 3 - elementor-mcp → get_page (cualquier ID)
⛔ NO CONTINUAR si alguna falla. Resolver conexión primero.
```

---

## FASE 0: BRANDBOOK + IMÁGENES + ESTRUCTURA

### Leer BrandBook
- Leer TODOS los archivos de INFO_BrandBook/
- Extraer colores HEX exactos, tipografía, formas
- Crear design-system/MASTER.md con la paleta real

> ⚠️ REGLA CRÍTICA: Los colores de Stitch NO coinciden con el BrandBook.
> Stitch usa tokens Material Design (primary-container, on-primary, etc.)
> que son MÁS CLAROS que los colores reales del brandbook.
> El compilador debe forzar los colores HEX del BrandBook, NO los de Stitch.
>
> 📦 **Skills a usar:** `ui-ux-pro-max` (paletas + tipografía) + `design-md` (generar MASTER.md)

### Inventario de imágenes
- Hero sections: versión DESKTOP (landscape) + MOBILE (portrait) por página
- CTA sections: fondos oscuros para secciones Call-to-Action
- Logos: PNG (WordPress NO acepta SVG por defecto - instalar "Safe SVG" si necesario)

### Subir imágenes a WordPress ANTES de compilar
```
wp-elementor-mcp → upload_media(file_path, title, alt_text)
Anotar IDs en un registro.
⚠️ NUNCA dejar URLs temporales de Stitch (lh3.googleusercontent.com). EXPIRAN.

📦 **Skill a usar:** `webp-optimizer` — Convertir TODAS las imágenes a WebP antes de subir (reduce 60-80% de peso).
```

---

## FASE 1: DISEÑO EN STITCH

1. Crea tu proyecto en Google Stitch y configura el Design System con los colores de tu BrandBook.
   - Nota: Stitch usa paletas de Material Design. Posiblemente requiera ajustes manuales luego.
   - Hallazgo: create_design_system puede fallar. Incluir directrices de diseño en el prompt de generate_screen_from_text.
2. Genera tus pantallas (SIEMPRE usar generador Desktop, mínimo 1280px).
3. Asegura que los datos de contacto del prompt sean los definitivos.

> ⚠️ REGLA: SIEMPRE leer archivo de datos de contacto ANTES de generar pantallas.
> NUNCA confiar en que Stitch generará datos correctos.
> Inyectar teléfono, redes, dirección, email en CADA prompt.
>
> 📦 **Skills a usar:** `enhance-prompt` (optimizar cada prompt) + `stitch-loop` (automatizar generación multi-página)

---

## FASE 2: EXPORTACIÓN

1. Consigue las URLs de descarga (htmlCode.downloadUrl) para cada pantalla.
2. Usa PowerShell (Invoke-WebRequest) o curl para bajar los archivos. Formato crudo "stitch_html/".

> ⛔ NUNCA uses herramientas tipo "read_url_content" que extraigan markdown. Destruyen el HTML.

3. Verificar que cada .html sea > 15KB (si es menor, la descarga falló).

---

## FASE 3: COMPILACIÓN V4.1 A NATIVO (LA MAGIA)

1. Copia el template del skill a tu proyecto:
   ```
   copy .agent/skills/stitch2elementor/scripts/compiler_v4_template.js compiler_v4.js
   ```
2. Edita el CONFIG block en `compiler_v4.js` con tus colores, fuentes y rutas del BrandBook.

3. Ejecuta el compilador V4.1:
   ```
   node compiler_v4.js
   ```
4. El compilador toma cada HTML y lo parsea a Elementor JSON nativo (elementor_json/).
   Ajusta automáticamente: gaps, márgenes reactivos (tablet/mobile), border-radius, tipografía,
   responsive flex-direction (Tailwind mobile-first → Elementor desktop-first), width fractions,
   arbitrary Tailwind colors, space-y/x gaps, y background image capture.

5. Validar JSONs (el compiler V4.1 tiene validación integrada, pero opcionalmente):
   ```
   node validate_json.js
   ```
   Resultado esperado: 0 issues en todos los archivos.

6. **HERO SECTIONS (V4.1 — Ahora semi-automático):**
   - **Auto-capture:** V4.1 extrae `<img>` dentro de `<div class="absolute inset-0">` como `background_image`.
   - **Manifest injection:** Si `page_manifest.json` tiene `hero_pairs` con IDs de WP Media Library, el compiler inyecta automáticamente `background_image + background_image_mobile + gradient overlay + min_height`.
   - **Manual fallback:** Si no tienes manifest, edita el JSON del hero a mano con:
     - `background_image`: URL + ID de WP Media Library
     - `background_overlay_background`: "gradient"
     - `min_height`: 100vh
     - Inner container: boxed 1200px + padding 60px lateral

---

## FASE 4: ESTRATEGIA FULL + BOXED LAYOUT

Si inyectamos `content_width: "full"` en todo, el contenido se pega a los bordes de la pantalla.
El compilador y tu edición manual deben respetar este patrón:

```
OUTER CONTAINER → content_width: "full", background_color (cubre toda la pantalla)
  INNER CONTAINER → content_width: "boxed", boxed_width: 1200px, padding horizontal: 60px

RESPONSIVE:
  Desktop:  boxed_width 1200px, padding lateral 60px
  Tablet:   boxed_width auto, padding lateral 40px
  Mobile:   boxed_width auto, padding lateral 20px
```

> ⚠️ Este patrón garantiza fondos full-width + contenido centrado + responsive automático.

---

## FASE 5: INYECCIÓN DIRECTA Y THEME BUILDER

1. **COMPILACIÓN:** (V4.4+) El compiler omite `nav` y `footer` por defecto en las páginas para evitar duplicados, y genera archivos `header.json` y `footer.json` independientes.
2. Inyecta los JSON correspondientes a tus páginas usando el MCP local:
   ```
   elementor-mcp → update_page_from_file
   ```
3. **INTERVENCIÓN MANUAL 1: Elementor Full Width**
   - Para que tus páginas usen el Header y Footer global pero a ancho completo, debes ir a la configuración de WordPress y asegurarte de que estén configuradas bajo la plantilla de **"Elementor Full Width" (Elementor Ancho Completo)**. NOTA: Por ahora, si pruebas standalone y la Navbar/Footer está compilada dentro del Body, usarías "Elementor Canvas", pero en la V4.4+ nuestro estándar es Theme Builder.

4. **INTERVENCIÓN MANUAL 2: Global Header & Footer (Theme Builder)**
   - Crea una página o solicita al agente crear dos páginas contenedoras (ej. `[TEMPLATE] Global Header` y `[TEMPLATE] Global Footer`).
   - El agente inyecta el `header.json` y `footer.json` en esas páginas transitorias.
   - Entra a esas páginas en Elementor y guárdalas como "Template" (Plantilla).
   - Ve a **Theme Builder**, asigna estas nuevas Plantillas como el "Header" y "Footer" oficiales, y dales condición de mostrarse en `Entire Site`.

5. Sube las imágenes a tu Biblioteca WP. No dejes refs de Google (`lh3.google...`).

---

## FASE 6: POST-PROCESAMIENTO

### Slugs
WordPress NO cambia el slug al cambiar título via API.
Para cambiar slugs, usar REST API directa:
```
POST /wp-json/wp/v2/pages/{id} con body {"slug":"nueva-url"} y autenticación Basic + App Password.
Solución: fix_slugs.js (Lee el `page_manifest.json` y sincroniza las URLs automáticamente).
```

### Sustitución de Imágenes (Crucial)
Las URLs de imágenes nativas generadas por Stitch (`lh3.googleusercontent.com`) expiran en días.
**LA REGAL DE ORO:** Se deben reemplazar por fuentes permanentes desde WP Media Library.
```
Flujo de automatización:
1. audit_stitch_images.js -> Genera un listado de todas las imágenes temporales.
2. replace_stitch_images.js -> Sube masivamente a WP usando WP-Elementor-MCP.
3. apply_image_replacements.js -> Inyecta las URLs permanentes a los JSON de Elementor.
```

### Limpieza de Artefactos Visuales (Material Symbols)
Stitch introduce frecuentemente nombres de íconos en puro texto dentro de botones (`arrow_forward`, `bolt`, etc).
```
Solución: fix_material_symbols.js -> Limpia spans y texto en los JSON Elementor, convirtiéndolos en Unicode limpio o eliminando texto huérfano.
```

### Links internos
Después de cambiar slugs, actualizar todos los links internos de navegación:
```
Solución: fix_internal_links.js
```

### Header y Footer
> ⚠️ Los templates del Theme Builder (Header/Footer) NO son editables via MCP.
> Solo operan sobre pages/posts, no elementor_library.
> En Elementor Canvas, cada página tiene su propio nav/footer embebido.

---

## SETTINGS KEYS DE ELEMENTOR (ERRORES FATALES SILENCIOSOS)

El JSON pasa validación y la inyección da `true`, pero el layout **NO funciona silenciosamente**. Sin error, simplemente no hace nada.

| Key INCORRECTO (V3) | Key CORRECTO (V4) | Impacto |
|----------------------|--------------------|---------|
| `gap: {unit,size}` | `flex_gap: {unit,size,sizes,column,row,isLinked}` | Espaciado entre elementos |
| `align_items` | `flex_align_items` | Alineación vertical |
| `justify_content` | `flex_justify_content` | Distribución horizontal |
| `margin` en widgets | `_margin` en widgets | Márgenes de widgets |
| `text_align` en headings | `align` en headings | Alineación de texto |
| sin content_width | `content_width: "full"/"boxed"` | Ancho de contenido |

---

## REGLA DE CSS GLOBAL (NO corregir individualmente)

> La solución correcta para forzar BrandBook es un CSS GLOBAL inyectado en el converter.
> NO corregir botones/colores individualmente en cada HTML.
> El CSS global usa `!important` para forzar BrandBook en TODOS los botones automáticamente:
> - `button, a[class*="bg-primary"]` → color del BrandBook, radio correcto
> - `.bg-primary-container` → color primario del BrandBook
> - `.rounded-full` → radio del BrandBook (ej: 4px)
> - `nav button, nav a[class*="bg-"]` → color primario, 12px font

---

## ARQUITECTURA: CONTAINERS, NO SECTIONS

> ⛔ NUNCA usar `elType: "section"` al generar JSON para Elementor moderno.
> El wrapper principal SIEMPRE debe ser:
> ```json
> {
>   "elType": "container",
>   "settings": { "content_width": "full", ... }
> }
> ```
> El widgetType debe ir directamente dentro del container. No se necesita "column".

---

## ICONOS DE REDES SOCIALES

> ⛔ NUNCA confiar en Material Symbols para iconos de redes sociales.
> Stitch asigna iconos FALSOS (retweet=Instagram, social_leaderboard=Facebook).
> SIEMPRE reemplazar con SVGs reales post-generación.
> SVGs inline embebidos directamente en el HTML, no font icons.
> Solución: fix_brandbook_v2.js reemplaza TODOS los footers con SVGs reales.

---

## ERRORES ADICIONALES DOCUMENTADOS

- **PowerShell**: En Windows, usar `;` para encadenar comandos, NO `&&`
- **Scripts de fix**: Los scripts de find/replace deben ser MUY específicos. Separar fix de navegación y fix de redes sociales en scripts diferentes.
- **MCP npx**: Usar `npm install -g` para servidores MCP, evita timeouts de descarga con npx.
- **StitchMCP**: NUNCA usar `list_projects` (timeout excesivo). Usar `create_project` o `get_project` con ID conocido.
- **Extraer IDs de Stitch**: Los outputs son archivos de 1 línea ~25KB, PowerShell no puede con regex. Usar script Node.js.
- **API paralelas**: Las escrituras deben ser SECUENCIALES. Lecturas pueden ser paralelas.
- **Endpoints falsos**: NO /build-page, NO /flush-css. Solo WP REST API estándar.

---

## SCRIPTS DE MANTENIMIENTO

| Script | Función |
|--------|---------|
| compiler_v4.js | **ACTUAL V4.1** - Compilador HTML→Native Elementor JSON (1600+ líneas, 16 production fixes) |
| validate_json.js | Valida que no queden bad keys del V3 |
| fix_contact_data.js | Inyecta datos de contacto reales en HTMLs |
| fix_nav_links.js | Corrige links de navegación del menú |
| fix_internal_links.js | Actualiza links internos a nuevos slugs |
| fix_brandbook_v2.js | Reemplaza footers y CTAs con versión BrandBook |
| fix_buttons.js | Corrige colores y radios de botones |
| fix_slugs.js | Cambia slugs via REST API directa leyendo el manifest |
| fix_material_symbols.js | NUEVO ✨ Limpia palabras fantasma (arrow_forward, search) generadas por Google Stitch en JSON. |
| audit_stitch_images.js | NUEVO ✨ Mapea en consola IDs y Widgets que usan lh3.googleusercontent.com |
| replace_stitch_images.js | NUEVO ✨ Script maestro que sube assets locales a WP y prepara el mapping. |
| apply_image_replacements.js | NUEVO ✨ Inyecta recursivamente URLs permanentes de WP a los Elementor JSON. |
| convert_html_to_elementor.js | (LEGACY V3 - reemplazado por compiler_v4) |
| check_old.js | Verifica elementos no-BrandBook remanentes |

---

## LOS 16 ERRORES FATALES (Resumen Rápido)

1. JSON wrapper vs array puro → `_elementor_data = '[{...}]'` CORRECTO
2. Credenciales inconsistentes → Un solo usuario Admin en TODOS los MCPs
3. JSON inventado sin leer HTML → SIEMPRE parsear el HTML real
4. read_url_content para descargar HTML → Convierte a Markdown. Usar Invoke-WebRequest
5. Editar mcp_config.json desde el agente → IDE se congela
6. Llamadas paralelas a la API → Escrituras SECUENCIALES
7. Endpoints que no existen → Solo WP REST API estándar
8. URLs temporales de Stitch → EXPIRAN. Subir a WP Media Library
9. Usar npx para servidores MCP → npm install -g evita timeouts
10. Settings keys incorrectos → flex_gap, flex_align_items, _margin, align
11. Content_width full en todo → Patrón FULL + BOXED
12. No incluir background images en heroes → V4.1 auto-captura + manifest injection
13. Material Symbols como texto → Reemplazar con SVG o unicode (→)
14. WordPress no acepta SVG → Instalar "Safe SVG" o usar PNG
15. Stitch genera colores de tokens, no BrandBook → Post-procesamiento obligatorio
16. **⭐ NUEVO: Tailwind es MOBILE-FIRST, Elementor es DESKTOP-FIRST** → `flex-col sm:flex-row` = desktop: row, mobile: column (el error más destructivo)

---

## MAPEO RESPONSIVE RÁPIDO: TAILWIND → ELEMENTOR

| Tailwind | Elementor |
|----------|----------|
| `flex-col sm:flex-row` | `flex_direction: "row"`, `flex_direction_mobile: "column"` |
| `flex-col lg:flex-row` | `flex_direction: "row"`, `flex_direction_tablet: "column"`, `flex_direction_mobile: "column"` |
| `space-y-4` | `flex_gap: {unit:"px",size:16}`, `flex_direction: "column"` |
| `w-1/2` | `width: {unit:"%",size:50}`, `width_mobile: {unit:"%",size:100}` |
| `h-screen` | `min_height: {unit:"vh",size:100}` |
| `bg-[#hex]/80` | `background_color: "rgba(r,g,b,0.8)"` |
| `border-l-4` | `border_border: "solid"`, `border_width: {top:0,right:0,bottom:0,left:4}` |
| `items-center` | `flex_align_items: "center"` |
| `justify-between` | `flex_justify_content: "space-between"` |

---

¡SIGUIENDO ESTA GUÍA, TU SITIO WEB SERÁ 100% PROFESIONAL, VELOZ Y EDITABLE POR EL CLIENTE FINAL!

*Flujo verificado en producción — 20+ páginas Evergreen Venezuela — Abril 2026*
*Compiler V4.1 — 16 production fixes — Template en scripts/compiler_v4_template.js*
