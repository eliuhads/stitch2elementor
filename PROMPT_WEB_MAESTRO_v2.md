# 🚀 PROMPT MAESTRO V2 — SITIO WEB COMPLETO CON IA
### Motor: Antigravity + Claude | Stack: Google Stitch → HTML → Compiler V4.1 → Native Elementor JSON → MCP → WordPress
### Workflow verificado en producción (20+ páginas, Evergreen Venezuela, Abril 2026)

---

> **¿QUÉ ES ESTE DOCUMENTO?**
> Es el "prompt maestro" que le das a tu agente Antigravity para crear un sitio web completo.
> Cópialo en el chat de Antigravity. El agente ejecutará cada fase en orden.
> **V2** incorpora TODAS las lecciones aprendidas del despliegue real de Evergreen Venezuela.
>
> **ESTRUCTURA DE CARPETAS DEL PROYECTO:**
>
> ```
> MI_PROYECTO/
> ├── INFO_BrandBook/          ← PDFs, docs o archivos con guía de marca
> │   └── LOGOS/               ← SVG, PNG en versiones color/blanco/negro
> ├── IMAGENES_FUENTES/        ← Fotos del cliente + AI Generated
> │   ├── hero section WEBP/   ← Heroes desktop + mobile (variantes)
> │   ├── FOTOS AI GENERATED/  ← Imágenes generadas por IA
> │   └── callto action WEBP/  ← Fondos de secciones CTA
> ├── CONTENIDO/               ← Textos base (opcional)
> ├── stitch_html/             ← HTMLs crudos de Stitch (se generan)
> ├── elementor_json/          ← JSONs de Elementor (se generan)
> ├── design-system/           ← MASTER.md del design system
> ├── compiler_v4.js           ← El compilador principal
> ├── page_manifest.json       ← Registro de todas las páginas
> └── .agent/skills/html-to-json/  ← Skill de conversión
> ```

---

## ═══════════════════════════════════════════════════
## FASE -1 · INSTALACIÓN Y CONFIGURACIÓN DEL ENTORNO
## (Solo una vez por máquina)
## ═══════════════════════════════════════════════════

### PASO -1A · Skills necesarios

```
VERIFICAR que existen TODOS los skills del ecosistema:

  CORE (Obligatorios):
    .agent/skills/html-to-json/SKILL.md   ← Reglas de conversión HTML→Elementor JSON
    .agent/skills/ui-ux-pro-max/SKILL.md  ← Sistema de diseño: 67 estilos, 96 paletas, 57 font pairings
    skills/design-md/SKILL.md             ← Genera DESIGN.md desde proyectos Stitch
    skills/webp-optimizer/SKILL.md        ← Convierte PNG/JPG a WebP optimizado

  DISEÑO & GENERACIÓN (Recomendados):
    skills/enhance-prompt/SKILL.md        ← Optimiza prompts para mejor output de Stitch
    skills/stitch-loop/SKILL.md           ← Loop autónomo para generar múltiples páginas

  POST-PRODUCCIÓN (Recomendados):
    skills/Agentic-SEO-Skill/SKILL.md     ← Auditoría SEO completa: 16 sub-skills, 33 scripts
    skills/visual-tester/SKILL.md         ← Auditoría visual 100% remota sin Playwright (solo Navegador Satélite o read_url_content)

  AVANZADOS (Opcionales):
    skills/react-components/SKILL.md      ← Stitch → React/Vite (si no es WordPress)
    skills/remotion/SKILL.md              ← Videos de walkthrough desde Stitch
    skills/shadcn-ui/SKILL.md             ← Componentes shadcn/ui para React/Next.js

⚠️ LEER TODOS LOS SKILLS CORE antes de continuar.
   Los demás skills se leen cuando se activa su fase.

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

  Custom Skills (incluidos en este repo — no requieren instalación externa):
    · html-to-json     → ya en .agent/skills/html-to-json/
    · ui-ux-pro-max    → ya en .agent/skills/ui-ux-pro-max/
    · webp-optimizer   → ya en skills/webp-optimizer/ (requiere: npm install sharp)
    · visual-tester    → ya en skills/visual-tester/ (Prohibido instalar playwright local. Usar backend satélite).
    · stitch2elementor → ya en skills/stitch2elementor/
```

---

### PASO -1B · Instalar los 3 Servidores MCP

```
Los MCP son "enchufes" que conectan tu agente con servicios externos.

INSTALACIÓN GLOBAL (obligatorio — evita timeouts):
  npm install -g wp-elementor-mcp   # https://github.com/eliuhads/wp-elementor-mcp
  npm install -g elementor-mcp      # https://github.com/eliuhads/elementor-mcp
  (StitchMCP se conecta via mcp-remote, no necesita npm install)

⚠️ REGLA DE ORO: NUNCA edites mcp_config.json desde el agente.
   Siempre edítalo manualmente con un editor de texto.
   Si el agente edita su propio config, el IDE se congela.
```

---

### PASO -1C · Configurar mcp_config.json

```
Windows: C:\Users\TU_USUARIO\.gemini\antigravity\mcp_config.json
Mac:     ~/.gemini/antigravity/mcp_config.json

SERVIDORES NECESARIOS:

"StitchMCP": {
  "command": "npx", "args": ["-y","mcp-remote","https://stitch.googleapis.com/mcp","--header","X-Goog-Api-Key: TU_API_KEY"],
  "disabled": false
},
"wp-elementor-mcp-NOMBRE": {
  "command": "wp-elementor-mcp", "args": [],
  "env": {
    "WORDPRESS_BASE_URL": "https://tu-dominio.com",
    "WORDPRESS_USERNAME": "tu_usuario_admin",
    "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx",
    "WP_MCP_MODE": "advanced"
  }
},
"elementor-mcp-NOMBRE": {
  "command": "elementor-mcp", "args": [],
  "env": {
    "WP_URL": "https://tu-dominio.com",
    "WP_APP_USER": "tu_usuario_admin",
    "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }
}

⚠️ APAGAR MCPs innecesarios: figma, playwright, firebase, github, context7
   Cada MCP activo consume recursos al inicio.
```

---

### PASO -1D · Prueba de conexión

```
PRUEBA 1 — StitchMCP → create_project (⛔ NUNCA list_projects — causa timeout)
PRUEBA 2 — wp-elementor-mcp → get_pages
PRUEBA 3 — elementor-mcp → get_page (cualquier ID)

⛔ NO CONTINUAR si alguna falla. Resolver conexión primero.
```

---

## ══════════════════════════════════════════════════
## FASE 0 · BRANDBOOK + IMÁGENES + ESTRUCTURA
## ══════════════════════════════════════════════════

### PASO 0A · Leer BrandBook completo

```
LEER TODOS los archivos de INFO_BrandBook/
Extraer y documentar en design-system/NOMBRE/MASTER.md:

COLORES (HEX exactos del BrandBook):
  · Primary Accent:     #______
  · CTA Principal:      #______  ← el color del botón que convierte
  · Dark Background:    #______
  · Paper/Light Bg:     #______
  · Text on Dark:       #______
  · Text on Light:      #______

TIPOGRAFÍA:
  · Headline:  [Fuente] — pesos: 700, 800, 900
  · Body:      [Fuente] — pesos: 300, 400, 500
  · Labels:    [Fuente] — peso: 700, UPPERCASE

FORMAS:
  · Border radius: ___px (BrandBook override — NO usar rounded-full de Stitch)
  · Sombras: sí/no
  · Estilo: [premium/industrial/orgánico/etc.]

ESTRUCTURA Y SLUGS (NUEVA REGLA):
  · Se utilizará el archivo `page_manifest.json` y el script `fix_slugs.js` para asegurar que el número de páginas, los slugs y la estructura de la web estén alineados 100% con las sugerencias del BrandBook. El BrandBook es la única fuente de verdad para la arquitectura de información.


⚠️ REGLA CRÍTICA: Los colores de Stitch NO coinciden con el BrandBook.
   Stitch usa tokens Material Design (primary-container, on-primary, etc.)
   que son MÁS CLAROS que los colores reales del brandbook.
   El compilador debe forzar los colores HEX del BrandBook, NO los de Stitch.

📦 SKILLS A USAR:
   → ui-ux-pro-max: Consultar paletas, font pairings, estilos de diseño
   → design-md: Generar DESIGN.md / MASTER.md automáticamente desde Stitch
```

---

### PASO 0B · Inventario de imágenes

```
REVISAR TODAS las carpetas de IMAGENES_FUENTES/

CLASIFICAR:
  · hero section WEBP/ → Desktop (landscape) + Mobile (portrait) por página
  · callto action WEBP/ → Fondos para secciones CTA
  · FOTOS AI GENERATED/ → Imágenes complementarias
  · WOOCOMMERCE PRODUCTS/ → Fotos de productos (si aplica)

PARA CADA HERO:
  · Debe tener versión DESKTOP (16:9 o landscape) + MOBILE (9:16 o portrait)
  · Si solo hay desktop, se usará con object-fit:cover (se perderá composición en mobile)
  · Nombrar: hero_ESCENA_DESCRIPCION.webp + hero_mobile_ESCENA_DESCRIPCION.webp

⚠️ REGLA: NUNCA dejar URLs temporales de Stitch (lh3.googleusercontent.com).
   Expiran en días. SIEMPRE subir a WordPress Media Library.

📦 SKILL A USAR:
   → webp-optimizer: Convertir TODAS las imágenes a WebP antes de subir.
     Ejecutar: node skills/webp-optimizer/optimize.js [carpeta_imagenes]
     Reduce peso 60-80% sin pérdida visible de calidad.
```

---

### PASO 0C · Subir imágenes a WordPress Media Library

```
ANTES de compilar o inyectar, subir TODAS las imágenes al servidor:

  wp-elementor-mcp → upload_media(file_path, title, alt_text)

ANOTAR en un registro:
  | ID  | Asset                     | URL WordPress                    |
  |-----|---------------------------|----------------------------------|
  | 333 | Hero Desktop Inicio       | https://dominio.com/wp-content/... |
  | 335 | Hero Mobile Inicio        | https://dominio.com/wp-content/... |
  | 340 | Logo Horizontal           | https://dominio.com/wp-content/... |

⚠️ WordPress NO acepta SVG por defecto. Instalar plugin "Safe SVG" o subir PNG.
```

---

### PASO 0D · Definir estructura de páginas + page_manifest.json

```
Crear page_manifest.json con TODAS las páginas:

{
  "project": "Nombre Empresa",
  "pages": [
    {"title":"Homepage","html":"homepage.html","json":"inicio.json","wp_id":219,"slug":"/"},
    {"title":"Energia Solar","html":"energia-solar.html","json":"energia-solar.json","wp_id":221,"slug":"energia-solar"},
    ...
  ],
  "media": {
    "hero_desktop_inicio": {"id":333,"url":"..."},
    "hero_mobile_inicio": {"id":335,"url":"..."},
    "logo_horizontal": {"id":340,"url":"..."}
  }
}

El wp_id se asigna después de crear las páginas en WordPress.
```

---

## ══════════════════════════════════════════════════
## FASE 1 · DISEÑO EN GOOGLE STITCH
## ══════════════════════════════════════════════════

### PASO 1A · Crear proyecto y Design System en Stitch

```
StitchMCP → create_project(title: "[Empresa] — Sitio Web [Año]")
StitchMCP → create_design_system(projectId, designSystem)

Incluir en el Design System:
  · Primary: color del BrandBook
  · Font primary: fuente de títulos
  · Roundness: basado en estilo del brandbook
  · Appearance: Dark mode si el sitio es dark-first

⚠️ Si create_design_system falla, incluir directrices en cada prompt de pantalla.
```

---

### PASO 1B · Diseñar pantallas (DESKTOP, 1280px+)

```
StitchMCP → generate_screen_from_text(projectId, prompt)

PROMPT DE DISEÑO (adaptar por página):
"Diseña [página] para [empresa], [sector].
Colores: primario [HEX], fondo [HEX], CTA [HEX].
Tipografía: [fuente] títulos, [fuente] body.
Border radius: [X]px.

Secciones:
  · Hero: [descripción] — con imagen de fondo de alta calidad
  · [Sección 2]: [descripción]
  · [Sección 3]: [descripción]
  · CTA Final: [texto + botón WhatsApp]

IMPORTANTE: El hero DEBE tener una imagen de fondo con overlay oscuro.
Los datos de contacto REALES son: [teléfono, WhatsApp, dirección, redes]."

📦 SKILLS A USAR ANTES DE CADA PROMPT:
   → enhance-prompt: Pasar el prompt borrador por este skill para optimizarlo.
     El skill agrega keywords UI/UX, contexto de design system, y estructura.
   → stitch-loop: Para sitios de 10+ páginas, activar el loop autónomo.
     Genera, integra, y prepara instrucciones para la siguiente iteración.
```

---

### PASO 1C · Aprobar diseños

```
StitchMCP → get_screen(projectId, screenId)
Mostrar screenshot al usuario.
Iterar con edit_screens hasta aprobación.

⛔ NO AVANZAR hasta que TODAS las pantallas tengan aprobación del usuario.
```

---

## ══════════════════════════════════════════════════
## FASE 2 · EXPORTACIÓN: STITCH → ELEMENTOR JSON
## (El pipeline que convierte diseño en sitio real)
## ══════════════════════════════════════════════════

### PASO 2A · Descargar HTML crudo de Stitch

```
StitchMCP → get_screen(...) → guardar htmlCode.downloadUrl

DESCARGAR con PowerShell (Windows):
  Invoke-WebRequest -Uri "[URL]" -OutFile "stitch_html/homepage.html"

DESCARGAR con curl (Mac/Linux):
  curl -o stitch_html/homepage.html "[URL]"

❌ NUNCA usar read_url_content — convierte HTML a Markdown y destruye el CSS.

VERIFICAR: cada .html debe pesar > 15 KB. Si pesa menos, la descarga falló.

📦 SKILL A USAR EN ESTA FASE:
   → html-to-json: LEER .agent/skills/html-to-json/SKILL.md antes de compilar.
     Contiene el schema JSON oficial, widget mapping, y validation checklist.
```

---

### PASO 2B · Compilar con Compiler V4

```
TAREA: Ejecutar el compilador que convierte HTML → JSON nativo de Elementor.

node compiler_v4.js

RESULTADO ESPERADO:
  ✅ homepage.html → inicio.json (81 nodes, 27KB)
  ✅ energia-solar.html → energia-solar.json (104 nodes, 37KB)
  ...
  📊 Results: 22 success, 0 errors, 0 warnings
```

---

### PASO 2C · QUÉ HACE EL COMPILER V4 (referencia técnica)

```
El Compiler V4 es el corazón del pipeline. Un DOM walker recursivo que:

1. PARSEA el HTML con cheerio (librería Node.js)
2. CAMINA el árbol DOM recursivamente
3. MAPEA cada nodo HTML → widget nativo de Elementor:
   · <h1>-<h6> → widgetType: "heading" (con settings reales)
   · <p>, text blocks → widgetType: "text-editor"
   · <a> con estilo botón → widgetType: "button"
   · <img> → widgetType: "image"
   · <hr> → widgetType: "divider"
   · <div>, <section> → elType: "container" (Flexbox)

4. TRADUCE Tailwind CSS → Elementor settings:
   · text-5xl → typography_font_size: 48px
   · bg-background → background_color: #0e1320
   · flex gap-8 → flex_gap: 32px
   · grid-cols-4 → flex_direction: row, children width: 25%
   · rounded → border_radius: 4px

5. GENERA responsive settings automáticos:
   · padding → padding_tablet (×0.67) → padding_mobile (×0.5)
   · font_size → font_size_tablet (×0.75) → font_size_mobile (×0.6)
   · flex_direction: row → flex_direction_mobile: column

6. LIMPIA contenido:
   · Elimina Material Symbols text ("arrow_forward" → "→")
   · Sanitiza HTML (strip <script>, <iframe>, onerror)
   · Colapsa containers redundantes (tree pruning)

7. VALIDA el JSON:
   · Verifica todos los IDs son únicos (8-char hex)
   · Verifica todos los widgets tienen widgetType
   · Verifica containers tienen elType + elements array

⚠️ SETTINGS KEYS CORRECTOS (V4 fix):
   ✅ flex_gap (NO "gap")
   ✅ flex_align_items (NO "align_items")
   ✅ flex_justify_content (NO "justify_content")
   ✅ _margin en widgets (NO "margin")
   ✅ align en headings (NO "text_align")
   ✅ content_width: "full" o "boxed" en containers
```

---

### ⭐ PASO 2D · HERO SECTIONS — AUTO-INYECCIÓN DESDE MANIFEST (V4.1)

```
✅ V4.1 FIX: El compiler ahora extrae background images automáticamente:
  1. Imágenes en <div class="absolute inset-0"><img src="..."></div>
     → Se capturan como background_image del outer container
  2. Hero images desde page_manifest.json → media.hero_pairs
     → Se inyectan automáticamente en la primera sección

CONFIGURACIÓN EN page_manifest.json:
  {
    "pages": [
      { "html": "homepage.html", "json": "homepage.json", "hero_pair": 1 }
    ],
    "media": {
      "hero_pairs": {
        "1": {
          "name": "Familia Casa Segura",
          "desktop": { "id": 333, "url": "https://tu-sitio.com/wp-content/.../hero-desktop.webp" },
          "mobile": { "id": 335, "url": "https://tu-sitio.com/wp-content/.../hero-mobile.webp" }
        }
      }
    }
  }

⚠️ REQUISITOS:
  1. Las imágenes DEBEN estar subidas a WP Media Library ANTES de compilar
  2. Los IDs del Media Library deben ser numéricos reales
  3. El compiler auto-configura:
     · background_image + background_image_mobile
     · background_overlay (gradient rgba)
     · min_height: 100vh (desktop), 85vh (tablet), 90vh (mobile)
     · Inner container: boxed 1200px + padding 60px lateral

Si NO tienes hero_pairs en el manifest, puedes editar el JSON manualmente:
  "background_background": "classic",
  "background_image": {"url":"...","id":"...","size":"","alt":"hero","source":"library"},
  "background_position": "center center",
  "background_size": "cover",
  "background_overlay_background": "gradient",
  "background_overlay_color": "rgba(14,19,32,0.85)",
  "background_overlay_color_b": "rgba(14,19,32,0.55)",
```

---

### PASO 2E · LAYOUT STRATEGY — BOXED CONTENT (LECCIÓN APRENDIDA)

```
⚠️ ERROR APRENDIDO: Usar "content_width": "full" en TODO causa que el texto
   se pegue a los bordes de la pantalla en desktop.

SOLUCIÓN — PATRÓN "FULL + BOXED":
Cada sección del sitio sigue este patrón de 2 niveles:

  OUTER CONTAINER (full — se extiende al viewport):
    content_width: "full"
    background_color: "#0e1320"  ← el fondo cubre todo el ancho
    padding: 96px top/bottom, 0px left/right

  INNER CONTAINER (boxed — contiene el contenido):
    content_width: "boxed"
    boxed_width: 1200px  ← ancho máximo del contenido
    padding: 0px top/bottom, 60px left/right  ← márgenes internos

RESPONSIVE:
  Desktop:  boxed_width 1200px, padding lateral 60px
  Tablet:   boxed_width auto, padding lateral 40px
  Mobile:   boxed_width auto, padding lateral 20px

Este patrón garantiza:
  ✅ Fondos que cubren todo el viewport
  ✅ Contenido centrado con márgenes respirados
  ✅ Responsive automático
```

---

## ══════════════════════════════════════════════════
## FASE 3 · INYECCIÓN EN WORDPRESS Y THEME BUILDER
## ══════════════════════════════════════════════════

### PASO 3A · Compilación Limpia y Configuración de Theme Builder (V4.4+)

```
El compiler V4.4 omite automáticamente <nav> y <footer> de las páginas, creando `header.json` y `footer.json` independientes.

PARA ESTABLECER EL HEADER Y FOOTER GLOBAL:
  1. Crear dos páginas transitorias con el MCP:
     mcp_elementor-mcp-EVERGREEN_create_page(title: "[TEMPLATE] Global Header", elementor_data: "[]", status: "draft")
     mcp_elementor-mcp-EVERGREEN_create_page(title: "[TEMPLATE] Global Footer", elementor_data: "[]", status: "draft")
  2. Inyectar `header.json` y `footer.json` en esas páginas usando `update_page_from_file`.
  3. INTERVENCIÓN MANUAL DEL USUARIO:
     - Entrar a esas páginas en Elementor y "Guardar como Plantilla".
     - Ir a `Theme Builder` -> Header/Footer -> Insertar plantilla -> Condición: Entire Site.
```

---

### PASO 3B · Elementor Full Width Y Páginas Individuales

```
Para CADA página:
  elementor-mcp → update_page_from_file(
    elementorFilePath: "ruta/al/json",
    pageId: [ID de WordPress],
    status: "publish"
  )

RESULTADO ESPERADO: true (por cada página)

⚠️ Si el JSON es muy grande (>100KB), puede disparar ModSecurity (error 406).
   Solución: usar update_page_from_file (lee directo del filesystem, evita WAF).

INTERVENCIÓN MANUAL POST-INYECCIÓN:
   - WordPress Admin → Páginas → Editar (Bulk Edit) 
   - Cambiar Template a "Elementor Full Width" (Ancho Completo).
   - Esto empata el Header/Footer de Theme Builder con nuestras páginas.

---

## ══════════════════════════════════════════════════
## FASE 4 · SEO + COPY + VERIFICACIÓN FINAL
## ══════════════════════════════════════════════════

### PASO 4A · SEO por página

```
POR CADA PÁGINA:
  Meta Title: [Keyword] | [Empresa]  (máx 60 chars)
  Meta Description: [Beneficio + keyword + CTA]  (150-160 chars)
  Slug: minúsculas, guiones, español
  H1: contiene keyword exacta

⚠️ WordPress NO cambia el slug al cambiar el título via API.
   Usar REST API directa: POST /wp-json/wp/v2/pages/{id} con body {"slug":"nuevo-slug"}

📦 SKILL A USAR:
   → Agentic-SEO-Skill: Ejecutar auditoría SEO completa por página.
     Incluye: Technical SEO, Core Web Vitals, E-E-A-T, Schema Markup,
     meta tags, hreflang, structured data, y recomendaciones priorizadas.
     Ejecutar los scripts de análisis para obtener evidencia real.
```

---

### PASO 4B · Verificación visual

```
VERIFICAR CADA PÁGINA:
  □ Hero image visible con overlay oscuro
  □ H1 visible y legible sobre la imagen
  □ Botones CTA funcionales (WhatsApp abre chat)
  □ Contenido centrado (no pegado a bordes)
  □ Footer con datos de contacto reales
  □ Mobile: contenido apilado verticalmente
  □ Tablet: márgenes intermedios correctos
  □ Links de navegación funcionan
  □ Imágenes cargan (no URLs temporales de Stitch)

📦 SKILL A USAR:
   → visual-tester: Automatizar verificación con Playwright headless.
     Toma screenshots desktop y mobile de cada URL.
     Detecta errores 404/500 automáticamente.
     Ejecutar: node skills/visual-tester/test.js [URLs...]
```

---

## ════════════════════════════════════════════
## LOS 16 ERRORES FATALES
## (Documentados en migraciones reales — V2.1 actualizado Abril 2026)
## ════════════════════════════════════════════

```
ERROR #1 — JSON wrapper vs array puro
  _elementor_data = '[{...}]'  ← CORRECTO
  _elementor_data = '{"version":"0.4","content":[...]}' ← FATAL

ERROR #2 — Credenciales inconsistentes
  Un solo usuario Admin, una sola App Password, en TODOS los MCPs.

ERROR #3 — JSON inventado sin leer el HTML
  SIEMPRE parsear el HTML real. NUNCA generar de memoria.

ERROR #4 — read_url_content para descargar HTML
  Convierte a Markdown. SIEMPRE usar Invoke-WebRequest o curl.

ERROR #5 — Editar mcp_config.json desde el agente
  El IDE se congela. Editar MANUALMENTE.

ERROR #6 — Llamadas paralelas a la API
  Las escrituras deben ser SECUENCIALES. Lecturas pueden ser paralelas.

ERROR #7 — Endpoints que no existen
  NO /build-page, NO /flush-css. Solo WP REST API estándar.

ERROR #8 — URLs temporales de Stitch en producción
  Las lh3.googleusercontent.com EXPIRAN. Subir a WP Media Library.
  Solución Automatizada: `audit_stitch_images.js` + `replace_stitch_images.js` + `apply_image_replacements.js`.
  NUNCA inyectes el sitio final sin haber pasado la herramienta de reemplazo y limpieza de assets.

ERROR #9 — Usar npx para servidores MCP
  npm install -g evita timeouts de descarga.

ERROR #10 — Settings keys incorrectos del compilador
  ✅ flex_gap (NO "gap")
  ✅ flex_align_items (NO "align_items")
  ✅ flex_justify_content (NO "justify_content")
  ✅ _margin en widgets (NO "margin")
  ✅ align en headings (NO "text_align")

ERROR #11 — Content_width: full en todo
  Causa que el texto se pegue a los bordes.
  Usar patrón FULL + BOXED (outer full, inner boxed 1200px).

ERROR #12 — No incluir background images en heroes
  V4.1 FIX: Ahora el compiler extrae <img> de absolute inset-0 como backgrounds.
  También auto-inyecta hero_pairs desde page_manifest.json.
  Si falta un hero, editar manualmente con background_image + overlay.

ERROR #13 — Material Symbols como texto
  Stitch genera "arrow_forward", "factory", etc. como TEXTO.
  El compiler corrige algunos y el script `fix_material_symbols.js` debe utilizarse POST-CÓMPUTO para limpiar el resto directo de los Elementor JSON de los Span e Input elements.
  Para iconos integrados completos: usar SVG inline.

ERROR #14 — WordPress no acepta SVG
  Instalar plugin "Safe SVG" o usar PNG.

ERROR #15 — Stitch genera colores de tokens, no BrandBook
  bg-primary-container ≠ color del BrandBook.
  Post-procesamiento OBLIGATORIO para forzar HEX reales.

ERROR #16 — Tailwind es MOBILE-FIRST, Elementor es DESKTOP-FIRST ⭐ NUEVO
  Tailwind: flex-col sm:flex-row = "column by default, row on small+"
  Elementor: flex_direction = "desktop first, overrides for tablet/mobile"
  MAPEO CORRECTO:
    flex-col sm:flex-row  → desktop: row, mobile: column
    flex-col md:flex-row  → desktop: row, mobile: column
    flex-col lg:flex-row  → desktop: row, tablet: column, mobile: column
  SIN ESTO: todos los layouts de 2 columnas se ven apilados en desktop.
  Este es el ERROR MÁS COMÚN y MÁS DESTRUCTIVO.
```

---

## ════════════════════════════════════════════
## REGLA DE CSS GLOBAL (NO corregir individualmente)
## ════════════════════════════════════════════

```
⚠️ La solución correcta para forzar BrandBook es un CSS GLOBAL inyectado
   en el converter/compilador. NO corregir botones/colores individualmente
   en cada HTML.

El CSS global usa !important para forzar BrandBook en TODOS los botones:
  · button, a[class*="bg-primary"] → color del BrandBook, radio correcto
  · .bg-primary-container → color primario del BrandBook
  · .rounded-full → radio del BrandBook (ej: 4px)
  · nav button, nav a[class*="bg-"] → color primario, 12px font

Esto elimina la necesidad de scripts de fix por cada página.
```

---

## ════════════════════════════════════════════
## ARQUITECTURA: CONTAINERS, NO SECTIONS
## ════════════════════════════════════════════

```
⛔ NUNCA usar elType: "section" al generar JSON para Elementor moderno.
   Elementor moderno usa Flexbox Containers, no el viejo sistema Section > Column.

El wrapper principal SIEMPRE debe ser:
  {
    "elType": "container",
    "settings": { "content_width": "full", ... }
  }

El widgetType debe ir directamente dentro del container.
No se necesita "column". Eliminar toda referencia a elType: "section".

⚠️ REGLA DE LOGOS Y NAVEGACIÓN (V4.4+):
   El compilador V4.4 incluye un "Logo Override" que ubica el texto de logo ("EVERGREEN") recursivamente en el DOM y lo sustituye por una imagen nativa (192px width).
   Además, el compilador debe OMITIR el `<nav>` y `<footer>` de los arrays de las páginas individuales.
   Dichos elementos se guardan en `.json` separados (`header.json`, `footer.json`) y se inyectan en plantillas independientes ("Global Header/Footer") para ser activados en el **Theme Builder** usando **Elementor Full Width**.

```

---

## ════════════════════════════════════════════
## MAPEO RESPONSIVE: TAILWIND → ELEMENTOR (REFERENCIA RÁPIDA)
## ════════════════════════════════════════════

```
⚠️ REGLA DE ORO: Tailwind es MOBILE-FIRST, Elementor es DESKTOP-FIRST.
   El compilador V4.1 maneja esto automáticamente, pero al editar JSON
   a mano, usa esta tabla:

   TAILWIND CLASS           → ELEMENTOR SETTINGS
   ─────────────────────────────────────────────────
   flex-col                 → flex_direction: "column"
   flex-row                 → flex_direction: "row"
   flex-col sm:flex-row     → flex_direction: "row",
                              flex_direction_mobile: "column"
   flex-col md:flex-row     → flex_direction: "row",
                              flex_direction_mobile: "column"
   flex-col lg:flex-row     → flex_direction: "row",
                              flex_direction_tablet: "column",
                              flex_direction_mobile: "column"
   space-y-4                → flex_gap: {unit:"px",size:16,...},
                              flex_direction: "column"
   space-x-4                → flex_gap: {unit:"px",size:16,...},
                              flex_direction: "row"
   w-1/2                    → width: {unit:"%",size:50},
                              width_mobile: {unit:"%",size:100}
   w-1/3                    → width: {unit:"%",size:33},
                              width_mobile: {unit:"%",size:100}
   gap-6                    → flex_gap: {unit:"px",size:24,...}
   items-center             → flex_align_items: "center"
   justify-between          → flex_justify_content: "space-between"
   h-screen / min-h-screen  → min_height: {unit:"vh",size:100}
   bg-[#hex]/80             → background_color: "rgba(r,g,b,0.8)"
   text-[#hex]              → color en inline style
   border-l-4               → border_border: "solid",
                              border_width: {top:0,right:0,bottom:0,left:4}
```

---

## ════════════════════════════════════════════
## SCRIPTS DE MANTENIMIENTO
## ════════════════════════════════════════════

```
| Script                        | Función                                              |
|-------------------------------|------------------------------------------------------|
| compiler_v4.js                | ACTUAL — Compilador HTML→Native Elementor JSON       |
| validate_json.js              | Valida que no queden bad keys del V3                 |
| fix_contact_data.js           | Inyecta datos de contacto reales en HTMLs             |
| fix_nav_links.js              | Corrige links de navegación del menú                 |
| fix_internal_links.js         | Actualiza links internos a nuevos slugs              |
| fix_brandbook_v2.js           | Reemplaza footers y CTAs con versión BrandBook       |
| fix_buttons.js                | Corrige colores y radios de botones                  |
| fix_slugs.js                  | Cambia slugs via REST API directa leyendo el manifest|
| fix_material_symbols.js       | Limpia palabras fantasma (arrow_forward, search).    |
| audit_stitch_images.js        | Mapea en consola IDs y Widgets que usan Google URLs. |
| replace_stitch_images.js      | Script maestro sube assets a WP y prepara el mapping.|
| apply_image_replacements.js   | Inyecta recursivamente URLs permanentes de WP.       |
| convert_html_to_elementor.js  | (LEGACY V3 — reemplazado por compiler_v4)            |
| check_old.js                  | Verifica elementos no-BrandBook remanentes           |

⚠️ Los scripts de find/replace deben ser MUY específicos.
   Separar fix de navegación y fix de redes sociales en scripts diferentes.
   Usar el contenido del enlace (texto visible) para diferenciar.
```

---

## ════════════════════════════════════════════
## CHECKLIST RÁPIDA — WORKFLOW COMPLETO
## ════════════════════════════════════════════

```
FASE -1 — ENTORNO (una sola vez):
  □ Skills html-to-json + ui-ux-pro-max instalados
  □ npm install -g wp-elementor-mcp && npm install -g elementor-mcp
  □ mcp_config.json configurado (StitchMCP + wp-elementor + elementor)
  □ MCPs innecesarios desactivados
  □ 3 conexiones verificadas ✅

FASE 0 — PREPARACIÓN:
  □ BrandBook leído → MASTER.md creado con colores HEX reales
  □ Imágenes inventariadas (hero desktop+mobile, CTA, productos)
  □ Imágenes subidas a WordPress Media Library con IDs anotados
  □ Logo subido (PNG si SVG bloqueado)
  □ page_manifest.json creado
  □ Estructura de páginas aprobada por usuario

FASE 1 — DISEÑO EN STITCH:
  □ Proyecto creado en Stitch + Design System configurado
  □ Pantalla por página (DESKTOP, 1280px+)
  □ Datos de contacto REALES en cada prompt
  □ Hero con imagen de fondo + overlay en cada prompt
  □ Todas las pantallas aprobadas por usuario ✅

FASE 2 — COMPILACIÓN:
  □ HTML descargado con Invoke-WebRequest (NO read_url_content)
  □ Cada .html > 15KB ✅
  □ compiler_v4.js ejecutado — 0 errors, 0 warnings
  □ validate_json.js ejecutado — 0 issues
  □ Hero JSONs editados manualmente:
    □ background_image desde WP Media (NO URLs de Stitch)
    □ background_overlay gradient
    □ min_height: 100vh
    □ Inner container: boxed 1200px + padding 60px lateral
  □ Logo incluido en header/nav containers

FASE 3 — INYECCIÓN:
  □ Páginas creadas en WordPress (si no existían)
  □ Cada página convertida a Elementor Canvas (MANUAL)
  □ JSONs inyectados via update_page_from_file
  □ Todos returnaron true ✅

FASE 4 — PUBLICACIÓN Y SANITIZACIÓN:
  □ SEO: meta titles + descriptions + slugs + schema
  □ Slugs estandarizados usando `fix_slugs.js` (Rest API Directa)
  □ Sanear "Material Symbols" remanentes usando `fix_material_symbols.js`
  □ Sustitución Definitiva Imágenes Google `lh3` a URLs Permanentes WP con `replace_stitch_images.js`
  □ Reinyectar JSONs en WP.
  □ Responsive verificado (desktop/tablet/mobile)
  □ Hero images visibles con overlay
  □ Contenido centrado (no pegado a bordes)
  □ Links de navegación funcionan
  □ WhatsApp CTA funciona
  □ Pages publicadas (draft → publish) ✅
```

---

## ════════════════════════════════════════════
## MEDIA LIBRARY REGISTRY
## (Completar durante Fase 0C)
## ════════════════════════════════════════════

```
| ID  | Asset                          | URL WordPress                                           |
|-----|--------------------------------|---------------------------------------------------------|
| 333 | Hero Desktop Inicio            | https://evergreenvzla.com/wp-content/uploads/2026/04/.. |
| 335 | Hero Mobile Inicio             | https://evergreenvzla.com/wp-content/uploads/2026/04/.. |
| 340 | Logo Horizontal Completo       | https://evergreenvzla.com/wp-content/uploads/2026/04/.. |
| ... | [agregar más según se suban]   | ...                                                     |
```

---

## ════════════════════════════════════════════
## DATOS DE CONTACTO — FUENTE DE VERDAD (TEMPLATE)
## (Completar con los datos reales de cada proyecto)
## ════════════════════════════════════════════

```
⚠️ SIEMPRE leer este registro ANTES de generar pantallas en Stitch.
   NUNCA confiar en que Stitch generará datos correctos.
   Inyectar estos datos en CADA prompt de diseño.

| Campo           | Valor                                                        |
|-----------------|--------------------------------------------------------------|
| Teléfono/WA     | +__ ___ ___ ____ | https://wa.me/__________             |
| Instagram       | https://www.instagram.com/________                           |
| Facebook        | https://www.facebook.com/________                            |
| TikTok          | https://www.tiktok.com/@________                             |
| X (Twitter)     | https://x.com/________                                       |
| YouTube         | https://www.youtube.com/@________                            |
| LinkedIn        | https://www.linkedin.com/company/________                    |
| Email           | ________@________.com                                        |
| Dirección       | ________________________________________________             |
| Catálogos       | [URLs de catálogos digitales si aplica]                       |
| Linktree        | https://linktr.ee/________                                   |

⛔ NUNCA confiar en Material Symbols para iconos de redes sociales.
   Stitch asigna iconos FALSOS (retweet=Instagram, social_leaderboard=Facebook).
   SIEMPRE reemplazar con SVGs reales post-generación.
```

---

*PROMPT MAESTRO V2.1 — Sitio Web Completo con IA*
*Motor: Antigravity + Claude | Google Stitch → HTML → Compiler V4.1 → Native Elementor JSON → MCP → WordPress*
*Flujo verificado en producción · 20+ páginas Evergreen Venezuela · Abril 2026*
*Incluye 16 errores fatales + mapeo responsivo Tailwind↔Elementor*
