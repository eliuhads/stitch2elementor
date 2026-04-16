# Changelog

All notable changes to the `stitch2elementor` skill are documented here.

---

## [4.6.0] – 2026-04-16 — AUDITORÍA COMPLETA + REFACTORING

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
