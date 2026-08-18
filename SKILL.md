---
name: stitch2elementor
description: >
  Pipeline de doble modo (Elementor Canvas / Static HTML) para extracción, diseño y despliegue desde Google Stitch
  hacia WordPress Elementor Canvas (Novamira MCP) o sitios estáticos multi-página autocontenidos (build Python + FTPS).
  v22: Pipeline Híbrido Determinista y Atomic Flexbox Containers de Elementor v4 (elType: "container"). Incluye
  anti-errores R0-R18, Widgets Nativos Editables (heading, text-editor, image, button), transporte Base64 anti-escaping hell,
  desacoplamiento de CSS maestro, purga de caché multinivel, especificidad móvil !important, linter pre-flight
  con exit codes, IDs deterministas uuid5, matriz de activos IA con contingencia de cuota y checklist de aceptación visual.
---

# Skill: stitch2elementor (v22.0.0 — Atomic Flexbox & Deterministic Hybrid Pipeline)

Pipeline para convertir interfaces Stitch en sitios web listos para producción:
- **Modo Elementor**: inyección programática en WordPress Elementor Canvas con Contenedores Flexbox y Widgets Nativos (Novamira MCP / FTPS + PHP)
- **Modo Static**: build Python estático multi-página (src/ → site/ → FTPS directo, sin CMS)

> **v21 — Por qué existe**: los modelos frontier ejecutan bien la conversión HTML→Elementor, pero los modelos
> intermedios/rápidos (Gemini Flash, Qwen Max, DeepSeek V3/V4) fallan en vectores críticos: alucinación de esquema
> Elementor, corrupción de caracteres por escape manual de JSON/HTML, desbordamiento horizontal en móviles por falta
> de especificidad CSS en Canvas, sobrecarga de CSS inline en base de datos, y bloqueos por cachés compilados de Elementor.
> **La respuesta arquitectónica es quitarle al LLM la generación libre de JSON**: toda transformación
> HTML→Elementor la ejecutan scripts deterministas en `scripts/` y una puerta de calidad (linter) decide
> con exit code si el payload puede desplegarse. El LLM orquesta, decide y verifica — nunca transpila a mano.

---

## 🧬 Matriz de Vectores de Falla (V1–V8) → Mitigación v21

| Vector | Síntoma en compilaciones | Mitigación determinista v21 |
|---|---|---|
| **V1** Alucinación de esquema | IDs duplicados, `elements` no-array, anidación flexbox inválida | `compile_ir_to_elementor.py` genera IDs uuid5 deterministas; `lint_elementor_json.py` valida estructura y unicidad recursiva; **R9 prohíbe JSON a mano** |
| **V2** Corrupción estilos/responsive | Variables CSS perdidas, breakpoints desalineados, layouts rotos en 375px | Compilador inyecta `flex_direction_mobile: column` + `width_mobile: 100%` por regla mecánica (**R10**); **R15** exige `!important` en media queries estructurales |
| **V3** Ambigüedad de instrucción | El LLM "recuerda" pasos en vez de verificarlos | **R11**: cada etapa produce artefacto JSON + exit code; la máquina decide, no la intuición. Reportes `lint.json`, `asset_matrix.json` |
| **V4** Activos/cuotas | Omisiones silenciosas de imágenes, interrupción al agotar cuota | `asset_matrix.py scan/verify` (matriz página→archivo→ratio + conteo/timestamps); fallback Gemini web documentado (Lección 23) en **R8** |
| **V5** Escaping Hell en transporte RPC | Comillas rotas, unicode corrupto, JSON inválido al inyectar por API | **R12 Transporte Base64 Obligatorio**: empaquetar HTML/JSON con `base64_encode()` en cliente y `base64_decode()` en servidor PHP |
| **V6** Sobrecarga de CSS inline en BD | 20KB+ duplicados por página, lentitud de carga, mantenimiento imposible | **R13 Desacoplamiento de CSS Maestro**: compilar hoja centralizada (`v6-styles.css`) en `/uploads/` y enlazarla con `?v=hash` |
| **V7** Caché fantasma de Elementor | Cambios en BD no se reflejan en el navegador | **R14 Purga Multinivel**: eliminar `_elementor_css` meta, invocar `files_manager->clear_cache()`, `wp_cache_flush()` y vaciar `post_content` |
| **V8** Desbordamiento en 375px (Overflow) | Terminales, grids o tablas rebasan el ancho del viewport móvil | **R15**: `*, *::before, *::after { box-sizing: border-box !important; }` + `overflow-x: auto !important; white-space: pre-wrap !important;` en bloques de código |

---

## 🏛️ Arquitectura v21 — Pipeline Híbrido Determinista (Modo E)

```
HTML Stitch/Editado ──► [E1 EXTRACT]  scripts/extract_ir.py
                                      DOM parse stdlib → ir.json (secciones, headings, imgs, ctas)
                              │
                              ▼
                      [E2 COMPILE]    scripts/compile_ir_to_elementor.py
                                      IR → _elementor_data · IDs uuid5 (7 hex) · R6 boxed 1240px
                                      · R10/R15 responsive mecánico · merge --header/--footer con
                                      re-hash de IDs (unicidad por construcción)
                              │
                              ▼
                      [E3 LINT]       scripts/lint_elementor_json.py  →  PUERTA OBLIGATORIA
                                      E1 parse · E2 IDs únicos · E3 elType/widgetType · E4 boxed
                                      · E5 responsive · E6 logo R4 · E7 integridad elements
                                      exit≠0 ⇒ PROHIBIDO desplegar
                              │
                              ▼
                      [E4 DEPLOY+QA]  LLM orquesta con Base64 Transport (R12) · _elementor_page_settings=array PHP
                                      (Lección 24) · CSS maestro desacoplado (R13) · Purga multinivel (R14) ·
                                      post-write verification · Playwright dual-viewport CT252 (R15)
```

**Reparto de roles (inmutable)**: el LLM decide *qué* páginas, *qué* contenido y *cuándo* desplegar;
los scripts deciden *cómo* se transforma y valida. Ningún `_elementor_data` nace de generación libre del LLM.

---

## 📋 Dependencias (MCPs & Skills)

| Recurso | Tipo | Modo |
|---|---|---|
| `stitch` | MCP | Ambos |
| `notebooklm-mcp` | MCP | Ambos (consulta previa obligatoria) |
| `novamira-mcp` / `#wp-elementor-mcp` | MCP | Elementor |
| `obsidian-mcp` | MCP | Ambos |
| `playwright` (remoto, CT252 `ws://192.168.1.252:3000/playwright`) | MCP | Ambos (verificación visual) |
| `design-taste-frontend` | Skill | Ambos (anti-slop) |
| `floydia-web-brand` | Skill | Ambos (brandbook insumo) |
| `scripts/` propios (E1–E3, asset_matrix) | Python stdlib | Ambos (E1–E3 en Modo E) |

---

## ⚡ Menú Interactivo v21 (10 Opciones + Selección de Modo)

```
=====================================================================
      ⚡ STITCH2ELEMENTOR v21.0 — DETERMINISTIC HYBRID PIPELINE ⚡
=====================================================================
Elige MODO:  [E] Elementor Canvas (WP)  |  [S] Static HTML (Python)
=====================================================================
 [1] Ingresar brandbook + copys + assets (floydia-web-brand output)
 [2] Auditoría de insumos y gaps (logo, colores, copys, imágenes)
 [3] Generar en Stitch (pantallas desktop, design system)
 [4] Extraer HTMLs de Stitch a carpeta local
 ─────────────────────────────────────────────────────────────────
 Si MODO=E (Elementor):
 [5E] E1+E2: extract_ir.py ×página → compile_ir_to_elementor.py
      (con --header/--footer + --page-settings)
 [6E] E3: lint_elementor_json.py ×página (OBLIGATORIO, exit=0)
      → E4: desplegar vía Base64 RPC / FTP+PHP + post-write verify + purge
 ─────────────────────────────────────────────────────────────────
 Si MODO=S (Static HTML):
 [5S] Build sitio estático (src/ → site/ → Python pages.py)
 [6S] Desplegar sitio vía FTPS a /subcarpeta en el dominio
 ─────────────────────────────────────────────────────────────────
 [7] Post-deploy verification (HTTP 200, Playwright dual-viewport CT252)
 [8] Solo SEO (generar/actualizar meta tags JSON-LD en build)
 [9] Solo componentes (header/footer/botón WA/íconos sociales)
 [10] Personalizado / Libre
=====================================================================
Activos IA (ambos modos): asset_matrix.py scan → prompts en
DRIVE/PROMPTS/ → generación (o fallback Gemini web) → webp-optimizer
→ asset_matrix.py verify (exit=0) → recompilar.
```

---

## 🏗️ Estructura de carpeta del proyecto (ambos modos)

```
PROYECTO/
├── BRANDBOOK.md              ← Brandbook del cliente
├── src/                      ← FUENTES: tokens.css / v6-styles.css, build.py, pages.py, assets/
├── site/                     ← OUTPUT generado (seguro de borrar/regenerar)
├── deploy.py                 ← Subida FTPS (usa .env para credenciales)
├── seo_pack.py               ← Genera meta tags + JSON-LD por página
├── probe_docroot.py          ← Verifica docroot FTP antes de subir
├── post_deploy_verify.py     ← Checklist de aceptación automatizado
└── ir/                       ← v21: IRs JSON por página (E1) + payload Elementor (E2)
    └── reports/              ← v21: lint.json + asset_matrix.json (evidencia E3)
```

**REGLA**: `site/` jamás contiene fuentes. Un `rm -rf site/` no puede destruir nada que no se regenere con un comando.

---

## 🧱 Reglas Anti-Error R0–R16 (ambos modos)

> Cada regla previene un fallo real de producción. No omitir ninguna.

### R0. Modo de operación — elegir ANTES de diseñar
- Si el cliente tiene WordPress activo → Modo E (Elementor). Las páginas son `elementor_library` CPT o páginas estándar con template Canvas.
- Si el cliente NO quiere tocar WP o la web es un experimento → Modo S (Static). El sitio vive en `/subcarpeta/` del dominio, Apache sirve archivos reales antes que WP rewrite.
- **NUNCA combinar modos** en el mismo deploy sin reset completo.

### R1. FTP — PROBE OBLIGATORIO antes de subir
- El cwd `/` de la sesión FTPS **suele ser el docroot público** (Bluehost, cPanel).
- Subir a `/home2/{user}/public_html/{sub}/` puede devolver 404 aunque `LIST` muestre los archivos.
- **Protocolo**: ① subir `probe.html` a la raíz FTP → ② `curl` a `https://dominio/probe.html` debe ser `200` → ③ ahora sí, subir contenido a `/{subcarpeta}/` relativo a raíz FTP → ④ borrar probe.

### R2. Separación src/site — nunca borrar fuentes
- `src/` es la verdad; `site/` es efímero.
- `.gitignore` protege `site/` del versionado.

### R3. Editar fuentes, nunca artefactos generados
- Si un HTML/CSS generado está mal, se corrige en `src/pages.py` o `src/tokens.css` y se regenera.
- Editar un archivo en `site/` = corrupción en la próxima build.

### R4. Dimensiones visuales inmutables
| Elemento | Modo E | Modo S |
|---|---|---|
| Logo en header | `48px` (el compilador E2 lo fija mecánicamente si detecta "logo") | `48px` (`<img height="48">` en `src/`) |
| Íconos sociales | SVG inline 28px caja × 15px SVG | Idem |
| Botón WA flotante | 56px círculo fixed bottom-right (42px si el brandbook lo fija) | Idem |
| Botón WA inline (hero/CTA) | 40px círculo SOLO ícono, sin texto | Idem |

**Validación post-deploy (Playwright)**:
```js
const h = await page.locator('.logo-img').evaluate(el => el.getBoundingClientRect().height);
if (h < 36 || h > 56) throw new Error(`Logo fuera de rango: ${h}px (esperado 48±8px)`);
```

### R5. SEO Pack desde el PRIMER build (no como parche)
Cada página generada incluye, sin excepción:
- `<title>` ≤ 60 caracteres
- `<meta name="description">` 150–160 caracteres
- `<meta name="keywords">` alineadas a la keyword primaria del copy fuente
- `<link rel="canonical">` absoluto
- `<script type="application/ld+json">` (Organization, FAQPage, Service, CollectionPage, ContactPage según tipo)
- **Coherencia**: la keyword primaria debe aparecer en el H1 de la página.

### R6. Diseño desde el Brandbook, no desde defaults
- **Contenedor**: `1240px` boxed centrado (salvo brandbook indique otro valor; el compilador lo valida en rango 1140–1440).
- **Hero**: split 2 columnas side-by-side (54% texto / 42% media), apilado en mobile.
- **Fondos**: Consistentes con la paleta de marca (Dark Ink `#0B111C` o modo claro del brief).
- **Tipografía**: SIEMPRE la del brief/Brandbook del cliente. NO sustituir por Inter/Roboto/Arial sin justificación documentada.

### R7. Lotes atómicos — pipeline completo por cambio
```
editar src → E1 → E2 → E3 (lint PASS) → deploy → curl 200 todo → capturas → revisión
```
Si algo falla: corregir en src y repetir el pipeline completo. Prohibido hacer parches uno-a-uno sobre artefactos vivos.

### R8. Fotos temáticas reales — jamás emojis ni placeholders (+ contingencia de cuota)
- Buscar fotos en `DRIVE/*/assets/`, `DRIVE/*/proyecto_logo_*/`, o `wp-content/uploads/` del cliente.
- Si no hay fotos reales: generar con IA (tool `generate_image`) con prompt específico del servicio/producto.
- Cada hero DEBE tener una foto/imagen representativa, no un degradado con texto ni emoji.
- **Pipeline de activos v21 (Lección 23)**:
  1. `asset_matrix.py scan <dir_html> -o asset_matrix.json` → matriz página→archivo→ratio con presupuesto WebP (heroes 16:9 <130KB, cards 4:3 <100KB).
  2. Archivo único de prompts autónomos archivado SIEMPRE en `DRIVE/PROMPTS/` del cliente.
  3. Generación (`generate_image` o fallback) → `webp-optimizer` → `src/assets/images/`.
  4. `asset_matrix.py verify asset_matrix.json --images-dir src/assets/images/` → exit≠0 si falta algún asset.
- **Contingencia de cuota agotada**: ejecutar los MISMOS prompts en **Gemini web (gemini.google.com) con cuentas alternas del dueño** → descargar → optimizar → `src/assets/images/` → recompilar + QA visual remoto.

### R9. ⛔ PROHIBIDO generar `_elementor_data` a mano (anti-V1)
- Todo payload Elementor proviene de `compile_ir_to_elementor.py` o de plantillas estructuradas validadas con el linter.
- El LLM jamás escribe ni "repara" JSON Elementor en libre interpretación: si el linter falla, se corrige el HTML/IR fuente y se recompila.

### R10. Responsive y estilos por regla mecánica (anti-V2)
- El compilador inyecta en TODO contenedor con hijos: `flex_direction_mobile: column` + `width_mobile: 100%`.
- Tailwind Play CDN en sitios inyectados en WP: `important: true` en `tailwind.config` SIEMPRE (Lección 24).
- `tokens.css`/brandbook es la única fuente de variables CSS; prohibido inlinear colores ad-hoc.

### R11. Contratos de etapa con exit code (anti-V3)
- Cada etapa produce un artefacto verificable: `ir.json` (E1), `*_elementor.json` (E2), `lint.json` (E3), `asset_matrix.json` (activos).
- **Exit codes contractuales**: 0=PASS, 1=FAIL bloqueante. 2 fallos consecutivos ⇒ detenerse y escalar al usuario con el reporte JSON.

---

### R12. 📦 Transporte Base64 Obligatorio en Deployments RPC (Anti-Escaping Hell, v21)
- **Regla**: Al transferir payloads HTML o JSON a WordPress mediante JSON-RPC, REST API o PHP scripts, el cliente Python/Node **DEBE codificar siempre en Base64**:
  ```python
  b64_html = base64.b64encode(html_content.encode("utf-8")).decode("utf-8")
  ```
  Y el script en el servidor lo decodifica de forma segura:
  ```php
  $html = base64_decode($b64_html);
  ```
- **Prohibición**: Queda prohibido construir strings JSON en el cliente haciendo escaping manual de comillas dobles, comillas simples o barras invertidas.

---

### R13. 🎨 Desacoplamiento de CSS Maestro vs. CSS Inline (Anti-Database Bloat, v21)
- **Regla**: Prohibido inyectar 20KB+ de CSS dentro de la etiqueta `<style>` de cada página en `_elementor_data`.
- **Patrón**: Compilar una hoja de estilos maestra (`styles.css` / `v6-styles.css`), subirla a `/wp-content/uploads/{marca}/` y enlazarla con query-string de versión (`?v=hash`).
- **Beneficio**: Cualquier corrección de media query o color se actualiza en todas las páginas instantáneamente sin requerir re-inyecciones masivas en la base de datos.

---

### R14. 🧹 Purga Obligatoria Multinivel de Elementor (Anti-Ghost Cache, v21)
- **Regla**: Tras cualquier escritura en `_elementor_data`, el script de deploy DEBE ejecutar obligatoriamente:
  ```php
  // 1. Eliminar caché de CSS compilado por Elementor
  delete_post_meta($post_id, '_elementor_css');
  // 2. Limpiar caché de archivos del plugin
  \Elementor\Plugin::$instance->files_manager->clear_cache();
  // 3. Vaciar transients y object cache de WordPress
  wp_cache_flush();
  // 4. Purgar post_content para forzar render de Elementor Canvas
  wp_update_post(['ID' => $post_id, 'post_content' => '']);
  ```

---

### R15. 📱 Especificidad Mandatoria en Mobile Breakpoints (Anti-Overflow, v21)
- **Regla**: Para evitar que los estilos de escritorio de Elementor Canvas anulen las media queries móviles:
  ```css
  /* Universal Box-Sizing Obligatorio */
  *, *::before, *::after { box-sizing: border-box !important; }

  @media (max-width: 992px) {
    .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .hero-mockup { width: 100% !important; max-width: 100% !important; }
    .grid-bento { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 768px) {
    .container { padding: 0 16px !important; }
    .hero-actions { flex-direction: column !important; width: 100% !important; }
    .hero-actions a { width: 100% !important; text-align: center !important; }
    .terminal-body {
      overflow-x: auto !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      font-size: 11px !important;
    }
  }
  ```
- **Validación Playwright**: Se evalúa `document.body.scrollWidth === window.innerWidth` en viewport 375px. Si `isOverflow: true`, el build es RECHAZADO.

### R16. 🛡️ Canvas Reset & Aislamiento de Wrappers (v21)
- **Regla**: Todo layout de Elementor Canvas debe anular los estilos residuales de Elementor que añaden fondos blancos o márgenes:
  ```css
  .elementor, .elementor-section, .elementor-container, .elementor-widget-wrap, .elementor-widget {
    background-color: transparent !important;
  }
  ```
  Y encapsular todo el contenido en un contenedor raíz (`.brand-wrapper`) con `width: 100%; min-height: 100vh; overflow-x: hidden;`.

### R17. ⚡ Flexbox Containers Mandatorios v4 (Anti-Legacy Sections, v22)
- **Regla**: En Elementor v3.16+ y v4 (Atomic Editor), queda **estrictamente prohibido** usar `elType: "section"` y `elType: "column"`.
- **Estructura Requerida**: Todo layout modular debe construirse con **`elType: "container"`** y `"container_type": "flex"`:
  ```json
  {
    "id": "cnt_a1b2c3d",
    "elType": "container",
    "isInner": false,
    "settings": {
      "container_type": "flex",
      "content_width": "boxed",
      "width": { "unit": "px", "size": 1240, "sizes": [] },
      "flex_direction": "row",
      "flex_direction_mobile": "column",
      "justify_content": "space-between",
      "align_items": "center",
      "gap": { "unit": "px", "size": 24, "sizes": [] },
      "_css_classes": "hero-section container"
    },
    "elements": [ /* Contenedores hijos (isInner: true) o widgets atómicos */ ]
  }
  ```
- Para columnas y tarjetas dentro de una fila flexbox, calibrar `"width"` y `"flex_basis"` como objeto porcentual `{"unit": "%", "size": 64, "sizes": []}` con `"flex_grow": 0` y `"flex_shrink": 0`.

### R18. 🎯 Mapeo de Widgets Atómicos Nativo-Editable en Flexbox (v22)
- **Regla**: Para lograr que el usuario pueda hacer clic y editar cualquier componente en el panel visual de Elementor sin romper la estética, cada elemento HTML se mapea a su widget nativo correspondiente dentro de los contenedores Flexbox:
  1. **Títulos y H1-H4** → `widgetType: "heading"` (`settings: {"title": "...", "header_size": "h1", "_css_classes": "hero-title"}`)
  2. **Párrafos y Textos** → `widgetType: "text-editor"` (`settings: {"editor": "<p>...</p>", "_css_classes": "hero-desc"}`)
  3. **Imágenes WebP** → `widgetType: "image"` (`settings: {"image": {"url": "...webp", "id": ""}, "image_size": "full", "_css_classes": "card-img"}`)
  4. **Botones de CTA y WhatsApp** → `widgetType: "button"` (`settings: {"text": "...", "link": {"url": "..."}, "button_type": "default", "_css_classes": "btn-primary"}`)
  5. **Micro-componentes Interactivos** (Terminal Shell JS / SVG de Logo) → `widgetType: "html"` (`settings: {"html": "..."}`)

---

## 🔴 Modo E — Pipeline Elementor Canvas (específico)

### `wp_slash()` — LECCIÓN CRÍTICA
WordPress ejecuta `stripslashes()` en `update_post_meta()`. Sin `wp_slash()`, el JSON de Elementor se corrompe y las páginas salen en blanco.
```php
// ❌ INCORRECTO
update_post_meta($id, '_elementor_data', $json);
// ✅ CORRECTO
update_post_meta($id, '_elementor_data', wp_slash($json));
```

### `_elementor_page_settings` = array PHP, NUNCA JSON string (Lección 24)
```php
// ❌ Provoca "Cannot access offset of type string on string" → página en blanco
update_post_meta($pid, '_elementor_page_settings', '{"hide_title":"yes"}');
// ✅ Correcto (el compilador genera <out>.page_settings.json con esta estructura)
update_post_meta($pid, '_elementor_page_settings', ['hide_title' => 'yes']);
```

### Post-Write Verification (obligatoria)
La REST API puede devolver HTTP 200 pero el payload puede haber sido descartado silenciosamente por filtros de plugins. Después de cada inyección:
```php
$stored = get_post_meta($id, '_elementor_data', true);
json_decode($stored);
if (json_last_error() !== JSON_ERROR_NONE) {
    // Payload corrupto — restaurar desde backup
}
```

---

## 🔵 Modo S — Pipeline Static HTML (específico)

### Build: src → site
- `src/tokens.css`: design tokens del Brandbook (`:root { --brand-deep: #... }`)
- `src/build.py`: partials compartidos (header, footer, social_icons, hero, cards, callouts, cta_final)
- `src/pages.py`: una función `page()` por ruta, contenido real desde `copys_v2/`
- `src/assets/`: logo SVG real, fotos temáticas en WebP (presupuesto R8)

Ejecutar `python3 pages.py` regenera `site/` completo.

---

## ✅ Checklist de Aceptación Final v22 (ambos modos)

- [ ] Modo correcto elegido antes de diseñar (E / S)
- [ ] **(Modo E) Flexbox Containers (`elType: "container"`) utilizados en lugar de secciones obsoletas (R17)**
- [ ] **(Modo E) Widgets Nativos aplicados para títulos, textos, imágenes y botones editables (R18)**
- [ ] **(Modo E) Transporte en Base64 aplicado en todos los scripts RPC / PHP (R12)**
- [ ] **(Modo E) CSS Maestro desacoplado subido a `/uploads/` y enlazado con versión (R13)**
- [ ] **(Modo E) Purga de caché multinivel (`_elementor_css` + `clear_cache`) ejecutada (R14)**
- [ ] **(Modo E) E3: `lint_elementor_json.py` exit=0 en TODOS los payloads**
- [ ] **(Modo E) Ningún `_elementor_data` fue escrito a mano (R9) — todo proviene del compilador**
- [ ] **(Modo E) `_elementor_page_settings` inyectado como array PHP (Lección 24)**
- [ ] **Activos IA: `asset_matrix.py verify` exit=0 (100% cobertura, presupuestos WebP OK)**
- [ ] Probe FTP devolvió 200
- [ ] src/ y site/ separados (las fuentes no viven en site/)
- [ ] Todas las URLs devuelven HTTP 200
- [ ] Sitio raíz del cliente intacto (200, sin tocar)
- [ ] Logo real SVG a 48px (±8px) medido en DOM
- [ ] Iconos sociales 28px con color de cada red
- [ ] Botón WhatsApp: flotante 56px + inline 40px solo ícono
- [ ] SEO pack presente en cada página (title + desc + keywords + canonical + JSON-LD)
- [ ] **Auditoría visual Playwright (Proxmox CT252): Desktop (1440px) y Mobile (375px) con `isOverflow: false` en 100% de páginas (R15)**
- [ ] Cero credenciales en archivos versionados o subidos

---

## 📝 Changelog

### v22.0.0 (2026-08-18)
- **Flexbox Containers Mandatorios (R17)**: Migración obligatoria a `elType: "container"` eliminando secciones/columnas legacy (`elType: "section"`/`elType: "column"`).
- **Mapeo de Widgets Atómicos Nativo-Editable (R18)**: Descomposición semántica en widgets `heading`, `text-editor`, `image` y `button` con clases maestras para 100% de editabilidad visual en Elementor.
- **Validación Dual**: Verificación con Playwright Proxmox CT252 de suites completas en Contenedores Flexbox sin desbordamiento horizontal.

### v21.0.0 (2026-08-17)
- **Transporte Base64 (R12)**: Eliminado el riesgo de *Escaping Hell* en RPC/PHP empaquetando HTML/JSON en Base64.
- **Desacoplamiento CSS Maestro (R13)**: Hojas de estilo centralizadas en `/uploads/` en lugar de inflar la base de datos con CSS inline repetido.
- **Purga de Caché Multinivel (R14)**: Procedimiento exhaustivo para eliminar `_elementor_css`, `files_manager->clear_cache()`, `wp_cache_flush()` y `post_content`.
- **Especificidad Móvil Mandatoria (R15)**: Reglas inmutables con `!important` para `.hero-grid`, `.hero-mockup`, `.terminal-body`, y `box-sizing` que garantizan 0% de desbordamiento horizontal en 375px.
- **Aislamiento Canvas (R16)**: Resets globales para `.elementor` y contenedores base.
- **Ampliación de Vectores de Falla**: Matriz V1–V8 documentada con mitigaciones deterministas.
