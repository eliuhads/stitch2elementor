---
name: stitch2elementor
description: >
  Pipeline agentic completo para convertir diseños de Google Stitch a páginas
  WordPress Elementor nativas. ACTIVA ESTA SKILL SIEMPRE que el usuario escriba
  "go!", "segment!", "migrar Stitch", "compilar Elementor", "inyectar JSON WP",
  "convertir HTML Tailwind a Elementor", "crear página WordPress desde Stitch",
  "pipeline web", o cualquier combinación de Stitch + WordPress + Elementor.
  Si el usuario escribe solo "go!" o "segment!" sin más contexto, ASUMIR que
  se refiere a este pipeline y activar la skill inmediatamente sin preguntar.
---

# stitch2elementor v2.1 — Agente de Migración Stitch → Elementor

Eres un agente de migración autónomo. Conviertes diseños de Google Stitch a
WordPress Elementor JSON nativo de forma completamente automática.

## Triggers de Activación

| Trigger | Acción |
|---------|--------|
| `go!` | Pipeline completo sitio web. Lee → `references/PROMPT_WEB_MAESTRO_v2.md` |
| `segment!` | Inyección modular de componente. Lee → `references/PROMPT_SEGMENT.md` |

Al recibir cualquiera de los dos triggers, lee el archivo de referencia
correspondiente ANTES de hacer cualquier otra cosa.

## Reglas Críticas Globales (se aplican en AMBOS modos)

**REGLA 1 — PROHIBIDO NAVEGADORES LOCALES**
Jamás uses `browser_subagent`, Playwright o Chromium. Toda validación hazla
via REST API (WP Tools) o `read_url_content`.

**REGLA 2 — FORMATO JSON ELEMENTOR OBLIGATORIO**
El `_elementor_data` DEBE ser un Array plano: `[{...}]`
NUNCA un wrapper: `{"version": "x", "content": [...]}` → Rompe Elementor con error 500.

**REGLA 3 — ASSETS SIEMPRE A WP MEDIA LIBRARY**
Nunca uses URLs temporales de Stitch (`lh3.googleusercontent.com`). Siempre
sube a Media Library y usa el ID interno de WordPress.

**REGLA 4 — EXTRACCIÓN HTML SOLO CON curl/PowerShell**
`read_url_content` convierte HTML a Markdown y pierde las clases Tailwind.
Para capturar el HTML real usa `curl` o `Invoke-WebRequest`.

## Servidores MCP Requeridos

Verifica disponibilidad con `list_tools` antes de procesar cualquier página.
Si alguno falla, detente e informa al usuario antes de continuar.

- **StitchMCP** — Lectura y generación de diseños
- **wp-elementor-mcp** — Inyección via REST API (`npm i -g wp-elementor-mcp`)
- **elementor-mcp** — Lectura/inyección por archivo (`npm i -g elementor-mcp`)

## Skills Hermanos (opcionales pero recomendados)

Si no están instalados, continúa sin ellos usando capacidades nativas.

- `webp-optimizer` → Compresión de imágenes antes de subir a WP
- `ui-ux-pro-max` → Selección de paletas y tipografía del BrandBook
- `design-md` → Generación sistemática del BrandBook
- `Agentic-SEO-Skill` → Validación SEO on-page post-inyección
- `html2json-segment` → Parser especializado (solo para trigger `segment!`)

## Referencia Técnica

Para errores de mapeo responsivo, arquitecturas permitidas y debugging:
→ Lee `references/Stitch_Elementor_Guide_GENERAL_V1.md`

## Scripts Disponibles (en `scripts/`)

| Script | Propósito |
|--------|-----------|
| `compiler_v4.js` | Transpiler principal HTML→Elementor JSON |
| `fix_slugs.js` | Regulariza URLs REST sin pasar por UI |
| `replace_stitch_images.js` | Mapeo Stitch assets → WP Media IDs |
| `apply_image_replacements.js` | Aplica el mapeo generado al JSON |
| `fix_material_symbols.js` | Purga texto fantasma de iconos CSS |
| `fix_buttons.js` | Aplica colores del BrandBook a botones |
| `fix_internal_links.js` | Corrige enlaces internos post-inyección |
| `sync_and_inject.js` | Orquestador FTP+HTTP: sube, inyecta, limpia |
| `fix_all_solar_v2.mjs` | Corrección masiva de contenido vía FTP+PHP (reemplazos sobre JSON crudo) |
| `verify_db_data.mjs` | Verificación directa en DB (aísla caché vs datos reales) |
| `force_elementor_regenerate.mjs` | Reconstruye `post_content` desde `_elementor_data` + invalida caché |
| `purge_wp_cache.mjs` | Purga completa: `_elementor_css`, transients, WP object cache, LiteSpeed |

## Protección de Datos del Cliente

**NUNCA** borrar, modificar ni alterar el contenido de la carpeta `client_data/` bajo ninguna circunstancia.

## Reglas Aprendidas (Producción — 2026)

> Estas reglas fueron descubiertas durante migraciones reales.
> Son **OBLIGATORIAS** — no son sugerencias.

### Caché de Doble Capa: `_elementor_data` vs `post_content`
Elementor almacena datos del diseño en **dos capas**: `_elementor_data` (JSON en `postmeta`) y `post_content` (HTML en `wp_posts`). Actualizar solo `_elementor_data` **NO regenera** el `post_content`. **Solución**:
```php
update_post_meta($pid, '_elementor_data', wp_slash($new_json));
wp_update_post(['ID' => $pid, 'post_content' => $rebuilt_html]);
delete_post_meta($pid, '_elementor_css');
delete_post_meta($pid, '_elementor_inline_svg');
delete_post_meta($pid, '_elementor_page_assets');
update_post_meta($pid, '_elementor_version', '0.0.0');
clean_post_cache($pid);
```

### Verificación DB-Directa para Aislar Caché
Si HTTP sigue reportando contenido viejo tras corrección, inyectar PHP que lea `get_post_meta($pid, '_elementor_data', true)` directamente. Si DB limpia pero HTTP no → caché de servidor. Ref: `verify_db_data.mjs`.

### Base64 para Payloads Grandes en PHP Inyectado
JSON de Elementor (20-50KB+) dentro de PHP generado desde Node.js causa errores de escaping. **Solución**: `Buffer.from(data).toString('base64')` → `base64_decode($b64)` en PHP. Ref: `fix_all_solar_v2.mjs`.

### Caché LiteSpeed Persiste Más Allá de WordPress
Hostings cPanel con LiteSpeed NO se purgan con `wp_cache_flush()`. **Soluciones**: 1. cPanel → LiteSpeed Web Cache Manager → "Flush All". 2. wp-admin → LiteSpeed Cache → "Purge All". 3. Esperar TTL (24-48h).

### Corrección Masiva: Reemplazo sobre JSON Crudo
Para búsqueda-y-reemplazo sobre contenido Elementor, operar sobre el **string JSON crudo** con `replaceAll()`, NO parsear→modificar→serializar. Reemplazos case-sensitive, de mayor a menor longitud. Ref: `fix_all_solar_v2.mjs`.

### Patrón FTP+PHP Master
Node.js genera PHP con `INJECT_SECRET` → `temp/` → FTP upload a `/` → `fetch(url + '?token=...')` → parsea JSON → `@unlink(__FILE__)` → `finally {}`. Variables `.env`: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `INJECT_SECRET`, `WP_URL`.

### REST API no permite `_elementor_*` meta fields
REST API retorna 403 para meta fields con prefijo `_`. Usar `update_post_meta()` vía PHP directo (patrón FTP+PHP).

### Encoding UTF-8 en Meta Tags
Usar siempre `wp_slash()` en `update_post_meta()` para prevenir corrupción de acentos (á, é, í, ó, ú).
