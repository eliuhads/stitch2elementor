# Changelog

All notable changes to the `stitch2elementor` skill are documented here.

## [5.0.0] - 2026-06-30 - PURE HTML LAYOUT INJECTION, SERVER-LEVEL CACHE & DATABASE CACHE PURGING

### Agregado
- **Inyección de Layout Stitch Puro sitio completo**: Integración a escala para todas las 15 páginas. Extrae el HTML limpio de Stitch (`body > section`) y lo inyecta en un único widget HTML nativo de Elementor, evitando la sobrecarga de divs anidados de Elementor y garantizando paridad visual al 100%.
- **Desactivación de Proxy Nginx de Bluehost**: Integración automática mediante `$epc->toggle_nginx(0)` que modifica la configuración de cPanel de la cuenta y fuerza la recarga de Nginx, evitando que sirva versiones en caché obsoletas con cabeceras `date` antiguas.
- **Purga de Caché de Elementor en Base de Datos**: Script para limpiar las claves `_elementor_css` y `_elementor_element_cache` de la tabla `wp_postmeta` de WordPress, forzando la recompilación limpia de estilos desde el JSON.
- **Validación de Sintaxis de Tailwind**: Regla estricta para evitar llaves y propiedades duplicadas en el objeto `borderRadius` de la configuración de Tailwind que invaliden el script en el navegador.

### Cambiado
- Eliminados los plugins MU obsoletos (`evergreen-custom-styles.php` y `evergreen-theme-override.php`) para evitar colisiones.
- Sincronizados todos los archivos a la versión `5.0.0`.

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
