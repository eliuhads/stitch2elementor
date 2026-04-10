# 🚀 PROMPT MAESTRO V2 — SITIO WEB COMPLETO CON IA
### Motor: Antigravity + Claude | Stack: Google Stitch → HTML → Compiler V4 → Native Elementor JSON → MCP → WordPress
### Workflow verificado en producción (22 páginas, Evergreen Venezuela, Abril 2026)

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
VERIFICAR que existen:
  .agent/skills/html-to-json/SKILL.md   ← Reglas de conversión HTML→JSON
  .agent/skills/ui-ux-pro-max/SKILL.md  ← Sistema de diseño y paletas

⚠️ LEER AMBOS SKILLS COMPLETOS antes de continuar.
```

---

### PASO -1B · Instalar los 3 Servidores MCP

```
Los MCP son "enchufes" que conectan tu agente con servicios externos.

INSTALACIÓN GLOBAL (obligatorio — evita timeouts):
  npm install -g wp-elementor-mcp
  npm install -g elementor-mcp
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
PRUEBA 1 — StitchMCP → list_projects (o create_project)
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

⚠️ REGLA CRÍTICA: Los colores de Stitch NO coinciden con el BrandBook.
   Stitch usa tokens Material Design (primary-container, on-primary, etc.)
   que son MÁS CLAROS que los colores reales del brandbook.
   El compilador debe forzar los colores HEX del BrandBook, NO los de Stitch.
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

### ⭐ PASO 2D · HERO SECTIONS — REQUIERE EDICIÓN MANUAL

```
⚠️ LIMITACIÓN CRÍTICA DEL COMPILER V4:
El compiler NO puede extraer background images del HTML de Stitch.
Stitch usa <img class="absolute inset-0 object-cover"> para heroes,
pero el compiler las descarta como imágenes posicionales.

SOLUCIÓN — EDITAR EL JSON DEL HERO A MANO:
Para cada página con hero section, editar el JSON generado y:

1. BACKGROUND IMAGE en el container del hero:
   "background_background": "classic",
   "background_image": {"url":"[URL DE WP MEDIA]","id":"[MEDIA ID]","size":"","alt":"[desc]","source":"library"},
   "background_image_mobile": {"url":"[URL MOBILE]","id":"[ID]","size":"","alt":"","source":"library"},
   "background_position": "center center",
   "background_size": "cover",

2. GRADIENT OVERLAY encima de la imagen:
   "background_overlay_background": "gradient",
   "background_overlay_color": "rgba(14,19,32,0.85)",
   "background_overlay_color_b": "rgba(14,19,32,0.55)",
   "background_overlay_gradient_angle": {"unit":"deg","size":135},

3. HERO HEIGHT:
   "min_height": {"unit":"vh","size":100},
   "min_height_tablet": {"unit":"vh","size":85},
   "min_height_mobile": {"unit":"vh","size":90},

4. LAYOUT BOXED (márgenes correctos):
   Usar un inner container con:
   "content_width": "boxed",
   "boxed_width": {"unit":"px","size":1200},
   "padding": {"unit":"px","top":"0","right":"60","bottom":"0","left":"60","isLinked":false},
   "padding_tablet": {"...","right":"40","...","left":"40"},
   "padding_mobile": {"...","right":"20","...","left":"20"},
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
## FASE 3 · INYECCIÓN EN WORDPRESS
## ══════════════════════════════════════════════════

### PASO 3A · Crear páginas en WordPress (si no existen)

```
wp-elementor-mcp → create_page(title, content, status: "draft")

DESPUÉS de crear, el USUARIO debe manualmente:
  WordPress Admin → Páginas → cada página → Editar con Elementor
  → Configuración → Layout → "Elementor Canvas"
  → Publicar

⚠️ Este paso es OBLIGATORIO antes de inyectar contenido.
   MCP no puede activar Elementor Canvas programáticamente.
```

---

### PASO 3B · Inyectar JSONs con MCP

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
```

---

### PASO 3C · Header y Footer

```
⚠️ LECCIÓN APRENDIDA: Los templates del Theme Builder (Header/Footer) NO son
   editables via MCP. Solo operan sobre pages/posts, no elementor_library.

OPCIONES:
  A) Elementor Canvas: cada página tiene su propio nav/footer embebido
     (el compiler lo incluye automáticamente)
  B) Theme Builder: editar manualmente en Elementor
     WordPress Admin → Elementor → Theme Builder → Header/Footer
     → Display Conditions → "Entire Site"
```

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
```

---

## ════════════════════════════════════════════
## LOS 15 ERRORES FATALES
## (Documentados en migraciones reales — V2 actualizado)
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
  El compiler no extrae <img> posicionales de Stitch.
  EDITAR MANUALMENTE el JSON del hero con background_image + overlay.

ERROR #13 — Material Symbols como texto
  Stitch genera "arrow_forward", "factory", etc. como TEXTO.
  El compiler debe reemplazarlos: "arrow_forward" → "→"
  Para iconos de redes sociales: usar SVG inline, NO Material Symbols.

ERROR #14 — WordPress no acepta SVG
  Instalar plugin "Safe SVG" o usar PNG.

ERROR #15 — Stitch genera colores de tokens, no BrandBook
  bg-primary-container ≠ color del BrandBook.
  Post-procesamiento OBLIGATORIO para forzar HEX reales.
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

FASE 4 — PUBLICACIÓN:
  □ SEO: meta titles + descriptions + slugs + schema
  □ Responsive verificado (desktop/tablet/mobile)
  □ Hero images visibles con overlay
  □ Contenido centrado (no pegado a bordes)
  □ Links de navegación funcionan
  □ WhatsApp CTA funciona
  □ Imágenes permanentes (no URLs temporales)
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

*PROMPT MAESTRO V2 — Sitio Web Completo con IA*
*Motor: Antigravity + Claude | Google Stitch → HTML → Compiler V4 → Native Elementor JSON → MCP → WordPress*
*Flujo verificado en producción · 22pp Evergreen Venezuela · Abril 2026*
