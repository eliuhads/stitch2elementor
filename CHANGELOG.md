# Changelog

All notable changes to the `stitch2elementor` skill are documented here.

---

## [27.0.0] - 2026-08-20 — INTERACTIVE MENU, DETERMINISTIC DEPLOY MARKER & STATIC BUILD S1

### Agregado
- **Menú Interactivo de 9 Opciones**: Sistema Menu-First de onboarding de 60 segundos, semáforo de puertas (🟢 PASS · 🟡 WARN · 🔴 FAIL), glosario técnico y chuleta de comandos de referencia rápida en `SKILL.md`.
- **R24 Marcador ALT Determinista (`--deploy-marker`)**: Inyección automática en `compile_ir_to_elementor.py` en el primer widget de imagen logo/hero.
- **Puerta E14 en Linter (`--expect-marker`)**: Validación estricta en `lint_elementor_json.py` para asegurar que el marcador de versión está presente antes de cualquier despliegue.
- **Puerta E15 para Estructuras Legacy (`--strict-v4`)**: Detección y bloqueo opcional ante contenedores `section`/`column` legacy.
- **Modo S Formalizado (`build_static.py` - S1)**: Motor determinista stdlib-only para copia `src/` → `site/`, inyección de marcadores HTML y auditoría de enlaces rotos.
- **QA Visual E5/S3 (`qa_assertions.js`)**: Runner Playwright modular con autoScroll, soporte SSL y capturas multi-viewport (375px/1440px).
- **Transporte Out-of-Band R23 (`s2e_deploy.sh` & `deploy_elementor.php`)**: Plantillas con verificación criptográfica SHA256 antes de inyección en BD.
- **AST Enriquecido (`extract_ir.py` & `compile_ir_to_elementor.py`)**: Soporte completo para `h1` a `h6`, divisores `<hr>` (`w_divider`), citas `<blockquote>` (`w_quote`), detección de enlaces externos (`is_external: True`) y soporte para `<picture>`/`<source>` en `asset_matrix.py`.

### Cambiado
- **R25 Bloqueo Duro de Schema sin `probed_at`**: La falta de timestamp de probe en `elementor_schema.json` bloquea con `exit 2`.
- `SKILL.md` actualizado formalmente a v27.0.0.

---

## [25.0.0] - 2026-08-19 — NOVAMIRA-CAPABILITY DRIVEN HARDENING: PURGE E4.5, SCHEMA FRESHNESS & E13 EDITABILITY

### Agregado
- **R24 / Etapa E4.5 — `purge_and_verify.py`**: Nuevo script de purga multinivel vía Novamira MCP (`wp elementor flush-css` → `wp cache flush` → `Endurance_Page_Cache::purge_all()` en `execute-php`) con verificación posterior por marcador ALT en el HTML servido y hash del CSS regenerado (Lecciones 21/24).
- **R25 — Frescura del Schema Probed**: `compile_ir_to_elementor.py` ahora lee `probed_at` de `elementor_schema.json` y bloquea la compilación si el schema supera 14 días de antigüedad (escape: `--allow-stale-schema`). Refuerza el blindaje de versión Elementor detectada por `elementor_schema_probe.py`.
- **R26 / E13 — Editabilidad Total Track B**: `lint_elementor_json.py` rechaza widgets HTML opacos cuando existe widget nativo equivalente migrable (`heading`, `text-editor`, `image`, `button`); fixture `w_list` migrado a `text-editor` (Lección 28).

### Cambiado
- `SKILL.md` → v25.0.0: reglas R24–R26, etapa E4.5 en el pipeline y capacidades Novamira mapeadas (`execute-php`, `run-wp-cli`, filesystem R23, `create-upload-link`).
- `pipeline/elementor_schema.json`: regenerado con `probed_at` y claves reales de Elementor 4.2.2.

### Validación
- compile + lint PASS sobre fixture v25; fixture de regresión E13 falla con exit 1; schema obsoleto bloquea con exit 2; `py_compile` limpio en los 4 scripts del pipeline.
---

## [23.0.0] - 2026-08-18 — NOVAMIRA MCP SSOT, VISUAL QA & SVG DIMENSIONAL HARDENING

### Agregado
- **Novamira MCP como SSOT Primario**: Adopción formal de `novamira-mcp` (vía `mcp-adapter-execute-ability` con `novamira/run-wp-cli`) como la herramienta rectora #1 para la gestión y purga en WordPress (`wp elementor flush-css` y `wp cache flush`).
- **Deprecación de MCPs Legacy**: Los servidores `elementor-mcp` y `wp-elementor-mcp` quedan marcados como oficialmente obsoletos.
- **R19 Blindaje Dimensional de Logotipos & SVGs (Lección 32)**: Prohibición estricta de SVGs con lienzos nativos gigantes (ej. 1985×2066 px); rasterizado previo obligatorio a PNG/WebP (360×375 px) y forzado de dimensiones inline y CSS (`max-height: 38px !important; width: auto !important; max-width: 160px !important;`).
- **R20 Contraste Forzado & Fallbacks en Micro-degradados (Lección 34)**: Inyección obligatoria de colores de fondo sólidos de respaldo (`bg-[#0F3D24]`), badges ámbar (`#FBBF24`) y texto de alto contraste (`#E2EFE7`) para evitar textos blancos invisibles por clases no compiladas de Tailwind.
- **R21 Carga Inmediata en Bento Cards (Lección 33)**: Erradicación de `loading="lazy"` en tarjetas de catálogo y líneas de producto en la portada para evitar recuadros blancos en capturas y primeros renders.
- **R22 Protocolo de QA Visual Realista (Cero Falsos Positivos, Lección 33)**: Prohibición de dar "PASS" basándose únicamente en código HTTP 200 o `overflow-x: false`. Se establece autoScroll previo mandatorio en Playwright Proxmox CT252 e inspección visual de las capturas completas antes de certificar.
- **Google Colab Pro GPU Offloading**: Procedimiento formal para delegar cómputo pesado de Python (generación masiva, optimización de medios, ML/tensores) a la GPU en la nube (`eliutec.aux.ia1@gmail.com`).

### Cambiado
- `SKILL.md` → v23.0.0: Matriz ampliada a V1–V10, reglas R0–R22, integración de Novamira MCP y checklist de aceptación enriquecido.

---

## [22.0.0] - 2026-08-18 — ATOMIC FLEXBOX & NATIVE EDITABLE WIDGETS

### Agregado
- **Flexbox Containers Mandatorios (R17)**: Migración obligatoria a `elType: "container"` con `container_type: "flex"`, eliminando por completo `elType: "section"` y `elType: "column"` legacy. Estructura requerida con `flex_direction`, `flex_direction_mobile: column`, `justify_content`, `align_items`, `gap` y `_css_classes`.
- **Mapeo de Widgets Atómicos Nativo-Editable (R18)**: Descomposición semántica de cada elemento HTML en su widget nativo correspondiente para 100% de editabilidad visual en Elementor:
  - `<h1>`–`<h4>` → `widgetType: "heading"`
  - `<p>` → `widgetType: "text-editor"`
  - `<img>` → `widgetType: "image"`
  - `<a>` (CTAs) → `widgetType: "button"`
  - Componentes interactivos (terminal, SVG) → `widgetType: "html"`
- **Directorio `pipeline/`**: Los scripts E1–E3 + `asset_matrix.py` + `elementor_schema.json` ahora viven en `pipeline/` como directorio canónico del repo (independiente de la carpeta `scripts/` legacy v4.x).

### Cambiado
- `SKILL.md` → v22.0.0: Checklist ampliado con R17 y R18; documentación de `flex_basis`, `flex_grow`, `flex_shrink` para columnas porcentuales.
- `README.md` → Reescritura profesional completa con arquitectura del pipeline, tabla de reglas R0–R18, estructura del proyecto, menú interactivo, y Quick Start.

### Validación
- Verificación dual Playwright en Proxmox CT252: Desktop (1440px) y Mobile (375px) con `isOverflow: false` en 100% de páginas con Contenedores Flexbox.

---

## [21.0.0] - 2026-08-17 — ANTI-ESCAPING HELL & MOBILE HARDENING

### Agregado
- **Transporte Base64 Obligatorio (R12)**: Todo payload HTML/JSON transferido a WordPress mediante JSON-RPC, REST API o PHP scripts se codifica en Base64 (`base64_encode`/`base64_decode`). Prohibido el escaping manual de comillas.
- **Desacoplamiento de CSS Maestro (R13)**: Prohibido inyectar 20KB+ de CSS inline en `_elementor_data`. Patrón: compilar hoja maestra (`v6-styles.css`) en `/wp-content/uploads/{marca}/` con query-string de versión (`?v=hash`).
- **Purga Obligatoria Multinivel (R14)**: Tras cada escritura en `_elementor_data`:
  1. `delete_post_meta($post_id, '_elementor_css')`
  2. `\Elementor\Plugin::$instance->files_manager->clear_cache()`
  3. `wp_cache_flush()`
  4. `wp_update_post(['ID' => $post_id, 'post_content' => ''])`
- **Especificidad Mandatoria en Mobile (R15)**: `!important` en media queries estructurales (`box-sizing`, `grid-template-columns`, `overflow-x`, `white-space`). Validación Playwright: `document.body.scrollWidth === window.innerWidth` en 375px.
- **Canvas Reset & Aislamiento (R16)**: Resets globales para `.elementor`, `.elementor-section`, `.elementor-container`, `.elementor-widget-wrap`, `.elementor-widget` con `background-color: transparent !important`.
- **Vectores de falla V5–V8** documentados con mitigaciones deterministas.
- **Lección Crítica `_elementor_page_settings`**: Debe inyectarse como array PHP asociativo, NUNCA como JSON string (provoca `Cannot access offset of type string on string` → página en blanco).

### Cambiado
- `SKILL.md` → v21.0.0: Checklist ampliado con R12–R16 y verificación dual-viewport obligatoria.

---

## [20.0.0] - 2026-08-16 — DETERMINISTIC HYBRID PIPELINE (non-frontier models)

### Agregado
- **Pipeline Híbrido Determinista E1→E4** en `pipeline/` (Python stdlib, cero dependencias):
  - `extract_ir.py` (E1): HTML Stitch → IR JSON (secciones, headings, imgs, CTAs, meta).
  - `compile_ir_to_elementor.py` (E2): IR → `_elementor_data` con IDs uuid5 deterministas (7 hex), boxed 1240px (R6), responsive mecánico R10, merge `--header/--footer` con **re-hash recursivo de IDs** (unicidad por construcción) y `page_settings` como array PHP.
  - `lint_elementor_json.py` (E3): puerta pre-flight E1–E7 (parse, IDs únicos recursivos, elType/widgetType, boxed, responsive, logo R4, integridad) con exit codes contractuales (0/1/2/3).
  - `asset_matrix.py`: matriz página→archivo→ratio+presupuesto WebP (`scan`) y verificación de cobertura/timestamps (`verify`) contra omisiones silenciosas de generación IA.
  - `elementor_schema.json`: SSOT de enumeraciones/patrones para el linter.
- **Reglas nuevas R9–R11**: R9 prohíbe generar/editar `_elementor_data` a mano; R10 inyecta responsive y Tailwind `important: true` por regla mecánica; R11 exige artefacto JSON + exit code por etapa (2 fallos ⇒ escalar al usuario).
- **Matriz de vectores de falla V1–V4** documentada en SKILL.md (alucinación de esquema, corrupción responsive, ambigüedad, activos/cuotas).

### Cambiado
- `SKILL.md` → v20.0.0: el LLM orquesta y valida; los scripts transforman. Checklist de aceptación ampliado (lint exit=0, page_settings array PHP, asset_matrix verify exit=0).
- R8 formaliza el pipeline de activos IA con contingencia de cuota (Gemini web, cuentas alternas) y verificación por matriz.

### Validación
- 8/8 pruebas PASS: round-trip E1→E2→E3 · idempotencia byte-idéntica (`cmp`) · negativo ID duplicado · negativo responsive · merge header/footer (detectó colisión real de IDs → motivó el re-hash) · asset_matrix scan/verify · `py_compile` ×4.

---

## [4.6.7] - 2026-04-26 - SECURITY & PIPELINE HARDENING

### Agregado
- Script `fix_buttons.js` para aplicar colores del BrandBook añadido a `package.json`
- JSON Schema de validación en `schemas/elementor_data.schema.json`
- `.gitignore` actualizado y `mcp_config.example.json` para protección de credenciales
- `package.json` con scripts npm declarados
- Guía técnica actualizada (unificación de versiones y typos)

### Cambiado
- Curl con `--fail --max-time 30` en pipeline para detección de errores HTTP
- Validación pre-inyección estricta del JSON antes de inyectar en WordPress

## [4.6.6] - 2026-04-18 — AUDIT-DRIVEN HARDENING

### 🔧 Bug Fixes
- **`maintenance_only.js`**: Fixed PHP namespace escaping bug — `class_exists()` was receiving double-backslash (`\\Elementor\\Plugin`) instead of single-backslash (`\Elementor\Plugin`), causing silent failure of Elementor cache flush.
- **`sync_and_inject.js`**: Now parses JSON responses from all PHP scripts instead of logging raw text. Validates `success === true` and exits on failure. Previously reported "completed successfully" even when PHPs returned errors.

### 🚀 Features
- **`sync_and_inject.js`**: Auto-updates `page_manifest.json` with new WordPress IDs from `inject_all_pages.php` `id_map` response. This fully automates the "Protocolo AHORA SÍ" — no manual ID capture required. Also auto-updates `home_id`, `blog_id`, `last_injection_date`, and `migration_status`.
- **`create_hf_native.php`**: Added `'Main Menu'` as intermediate fallback in menu discovery chain (Ppal Desktop → Main Menu → first available).

### 🧹 Cleanup & Decontamination
- **`page_manifest_example.json`**: Rewritten with generic placeholder data (`"My Website"`, `"About Us"`, etc.). Previously contained Evergreen Venezuela project-specific pages and IDs.
- **`design_system_template.json`**: Rewritten with neutral placeholder colors (`#1A1A2E`, `#0F3460`, `#E94560`). Previously contained Evergreen Venezuela palette.
- **`robust_inject_template.php`**: Moved to `archive/`. Had hardcoded Kit ID, Evergreen colors, and no auto-destruction. Functionality replaced by `flush_cache.php` + `sync_and_inject.js`.
- **`fotos_web/`**: Deleted. Obsolete since v4.6.2 (deprecated local image folders).
- **`archive/tests/`**: Deleted (empty directory).
- **`logs/stitch_image_urls.json`**: Moved to `archive/` (project-specific snapshot, not part of generic skill).

### ⚡ Performance
- **`compiler_v4.js`**: Removed Material Symbols Outlined CSS from font loader. The pipeline purges all Material Symbols from JSON, so the ~400KB font was loading for nothing.

### 📄 Version Sync
- All PHP scripts, JS scripts, SKILL.md, README.md, package.json, and PROMPT_WEB_MAESTRO_v2.md synchronized to v4.6.6.

---

## [4.6.5] - 2026-04-18 — PROTOCOLO ID SHIFTING & POST-INYECCIÓN

### 📄 Documentación — Protocolo ID Shifting Formalizado
- **`SKILL.md`**: Nueva sección `## ⚠️ ID Shifting — Comportamiento Crítico` con Protocolo "AHORA SÍ" como lista numerada obligatoria, Modo Config-Only, y advertencia sobre IDs fijos obsoletos.
- **`SKILL.md`**: Sección 7.2 (Cache Flush) anotada con advertencia de que IDs deben estar actualizados en manifest ANTES de ejecutar flush.
- **`README.md`**: Advertencia de ID Shifting añadida en Quick Start. Ejemplo hardcodeado `1054` reemplazado por `<NEW_HOMEPAGE_ID>`.
- **`PROMPT_WEB_MAESTRO_v2.md`**: Ya contenía Protocolo AHORA SI y Modo Config-Only (integrado en v4.6.1). Confirmado vigente — sin cambios adicionales requeridos.
- **`PROMPT_SEGMENT.md` / `PROMPT_CORRECCION_SEGMENT.md`**: No aplica — fueron consolidados en `PROMPT_WEB_MAESTRO_v2.md` desde v4.6.4.

### 🔑 Conocimiento Crítico Codificado
- **ID Shifting es inherente a WordPress**: Cada `sync_and_inject.js` crea posts nuevos con IDs nuevos. Los IDs previos son inmediatamente obsoletos.
- **Protocolo AHORA SÍ (4 pasos)**: Inyectar → Capturar nuevo ID → Actualizar manifest → Ejecutar flush_cache.php. OBLIGATORIO sin excepción.
- **Modo Config-Only**: `maintenance_only.js` para cambiar Homepage sin re-inyectar (protege IDs estables).
- **IDs fijos marcados como referenciales**: `1054` y otros IDs históricos anotados como ejemplo/referencial, no como valor vigente.

---

## [4.6.4] - 2026-04-16 - AUDITORÍA MASIVA Y REFACTORIZACIÓN MODULAR

### 🚀 Mejoras de Eficiencia
- **Iconos Purgados Nativamente**: Se integró un pre-procesamiento en cheerio para limpiar spans con clases `.material-symbols-outlined` previo al recorrido del AST en `compiler_v4.js`. Esto evita tener que inyectar el script externo `fix_material_symbols.js`.
- **Limpieza de Array Root**: `wrapAsTemplate` fue simplificado para evitar el wrapper versionado (`{ version, content }`) y obligar una entrega estricta de array puro, evadiendo errores recurrentes de importación Elementor. 

### 🧹 Limpieza y Consolidación ("De-cluttering")
- **Prompts Modulares Consolidables**: Eliminadas reglas duales ambiguas en `PROMPT_SEGMENT.md` y `PROMPT_CORRECCION_SEGMENT.md`. Toda lógica modular "segment!" ahora vive de forma centralizada en el `PROMPT_WEB_MAESTRO_v2.md`.
- **Test Scripts Zombis**: Todos los scripts de mock experimentales dentro de la carpeta `archive/tests/` fueron purgados por causar conflicto contextual.

---

## [4.6.3] – 2026-04-16 — AUDITORÍA: DESVINCULAR COMPILER DE PROYECTO ESPECÍFICO

### 🔴 Bugs Corregidos
- **Fix A1 — Hardcodes eliminados de `compiler_v4.js`**:
  - Logo URL, logoAlt, logoText → placeholders vacíos. Deben definirse en `design_system.json`
  - `'LUMEN INDUSTRIAL'` removido del logo detection → ahora usa `CONFIG.logoText.toUpperCase()` genérico
  - WhatsApp number `wa.me/584123118100` → `CONFIG.whatsappUrl` (configurable por proyecto)
  - Banner `COMPILER V4.2 — Nativización Perfecta` → `COMPILER V4 — stitch2elementor`
- **Fix A6 — `google_maps` widget**: `zoom` corregido de `{unit:'px', size:14}` (incorrecto) a `14` (entero plano que Elementor espera)

### ✨ Nuevos Campos en `design_system.json`
- `whatsappUrl` — URL de WhatsApp del header (requerido para nav)
- `instagramUrl` — URL de Instagram (opcional, para footer/social)
- `facebookUrl` — URL de Facebook (opcional, para footer/social)
- Todos documentados en `design_system_template.json`

### 🗑️ Archivos Eliminados (Limpieza B5, A5)
- `orchestrator_go.js` (raíz) — duplicado, la versión activa está en `archive/`
- `scripts/ftp_injector.js` — duplicado, la versión activa está en `archive/`

### 📄 Archivos Actualizados
- `compiler_v4.js` — Todos los fixes anteriores + comentario indicando "no hardcodear datos de cliente"
- `design_system_template.json` — Añadidos campos de contacto
- `SKILL.md`, `package.json` — Bump a `4.6.3`

---

## [4.6.2] – 2026-04-16 — IMAGEN WORKFLOW CLEANUP

### 🔴 Breaking Change (Conceptual)
- **Eliminado**: Toda referencia a carpetas locales de imágenes (`fotos_web/`, `IMAGENES_FUENTES`, `v9_images_temp/`)
- **Flujo único de imágenes**: Las imágenes provienen **exclusivamente** de Google Stitch. El PHP inyector (`inject_all_pages.php`) llama a `media_sideload_image()` de WordPress directamente sobre las URLs de Stitch — sin descarga local, sin carpetas intermedias, sin scripts adicionales.

### 📁 Archivos Actualizados
- `SKILL.md`: Eliminado `fotos_web/` de estructura de carpetas, eliminado `webp-optimizer` de skills transversales, reescrita sección 7.3 de flujo de imágenes
- `PROMPT_WEB_MAESTRO_v2.md`: Eliminado paso "Migrar imágenes" de FASE 3; URLs de Stitch se dejan intactas hasta la inyección PHP
- `README.md`: Feature actualizada a "Automatic Image Sideload", eliminado `webp-optimizer` de skills transversales, pipeline actualizado

---



### 🔴 Critical Knowledge (FUNDAMENTAL — No olvidar)
- **ID-Shifting**: `sync_and_inject.js` siempre asigna **NUEVOS** IDs en WordPress. Los IDs previos quedan obsoletos inmediatamente tras cada re-inyección.
- **Mantenimiento Post-Inyección OBLIGATORIO**: Siempre disparar `flush_cache.php` con el nuevo ID post-inyección para fijar Homepage.
- **Protocolo "AHORA SI"**: Flujo de éxito confirmado: Inyectar → Capturar nuevo ID de Homepage → Realinear Homepage con `flush_cache.php`.
- **Modo Config-Only**: Usar `maintenance_only.js` cuando solo se necesita cambiar Homepage sin re-inyectar contenido (protege IDs actuales).

### 🟢 Estado de Migración Evergreen Venezuela
- **Homepage Final**: ID **1054** — seteada exitosamente.
- **Fidelidad**: Caché regenerada y biblioteca Elementor sincronizada.
- **Pipeline**: Automatizado y documentado en versión de máxima estabilidad.

### 📁 Archivos Actualizados
- `page_manifest.json`: ID de Homepage actualizado a 1054, añadidos campos `home_id`, `blog_id`, `migration_status`, advertencia de ID-Shifting
- `PROMPT_WEB_MAESTRO_v2.md`: Protocolo AHORA SI y Modo Config-Only codificados en FASE 4 + reglas transversales 7 y 8
- `scripts/maintenance_only.js`: **[NUEVO]** Script de mantenimiento puro para realineación de Homepage sin re-inyección

---



### 🔴 Critical Fixes
- **A2**: Fixed `fix_material_symbols.js` targeting non-existent `elementor_json` → `elementor_jsons`
- **A3**: Fixed `sync_and_inject.js` loading `veclas.env` instead of root `.env`
- **A4**: Fixed `sync_and_inject.js` referencing `v9_json_payloads/` instead of `elementor_jsons/`
- **A7**: Normalized `isLinked` in `buildFlexGap()` from string `'1'` to boolean `true`
- **A10**: Extracted hardcoded logo URL/text to `CONFIG` (now configurable via `design_system.json`)
- **A11**: Created missing `inject_all_pages.php` script referenced by `sync_and_inject.js`

### 🟡 Sync & Docs
- Unified version to `4.6.0` across `package.json`, `SKILL.md`, `README.md`
- Complete rewrite of `PROMPT_WEB_MAESTRO_v2.md` (was 28 lines, now covers all 5 phases + segment mode)
- Updated compiler banner to use dynamic font names from CONFIG

### 🟢 New Capabilities  
- **`<form>` handler**: Forms now compile to `html` widget (preserving structure)
- **`<video>` handler**: Video elements compile to `html` widget with controls
- **`<iframe>` handler**: YouTube/Vimeo → native `video` widget, Google Maps → `google_maps` widget, others → `html`
- **`<table>` handler**: Tables compile to `text-editor` with overflow wrapper
- **`design_system_template.json`**: Template for customizing design system per-project
- **`inject_all_pages.php`**: Batch page injector with manifest support

### 📁 File Restructure
- Moved `ftp_injector.js` to `archive/` (duplicates `sync_and_inject.js`)
- Moved `orchestrator_go.js` to `archive/` (hardcoded SCREEN_MAP outdated)
- Moved `html-to-elementor-reference.md` to `archive/` (consolidated into `widget-mapping.md`)

---

## [4.5.1] – 2026-04-15

### Fixed
- Homepage ID realignment protocol for post-injection ID shifts
- `flush_cache.php` now handles `page_on_front` configuration
- SCREEN_MAP IDs updated for latest WordPress state

---

## [4.5.0] – 2026-04-15

### Added
- Hybrid FTP+PHP injection pipeline to bypass WAF 406 errors
- `create_hf_native.php` for Theme Builder templates
- `robust_inject_template.php` for Global Kit injection
- Nav-menu auto-discovery and injection

---

## [4.4.0] – 2026-04-14

### Added
- Logo override in compiler (text→image replacement)
- Stitch-native asset workflow (removed dependency on IMAGENES_FUENTES)
- Material Symbols cleanup integrated into compiler

### Fixed
- JSON output format: plain array instead of wrapper objects

---

## [4.3.0] – 2026-04-14

### Added
- Initial DOM Walker compiler (`compiler_v4.js`)
- Cheerio-based HTML parsing
- Tailwind-to-Elementor class mapping
- FULL+BOXED container pattern
- Responsive flex direction mapping

---

## [4.0.0] – 2026-04-13

### Added
- Pipeline architecture design
- MCP configuration guide
- Widget mapping reference docs
- Gotchas document with 18 known issues
