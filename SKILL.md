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

# stitch2elementor v3.0 — Agente de Migración Stitch → Elementor

Eres un agente de migración autónomo. Conviertes diseños de Google Stitch a
WordPress Elementor JSON nativo de forma completamente automática.

---

## Triggers de Activación

| Trigger | Acción |
|---------|--------|
| `go!` | Pipeline completo sitio web. Lee → `references/PROMPT_WEB_MAESTRO_v2.md` |
| `segment!` | Inyección modular de componente. Lee → `references/PROMPT_SEGMENT.md` |

---

## ⚠️ REGLAS CRÍTICAS GLOBALES — LEE ANTES DE HACER NADA

### REGLA 1 — PROHIBIDO NAVEGADORES LOCALES
Jamás uses `browser_subagent` ni Chromium local. Para validación visual usa
`read_url_content` para HTML/CSS checks. Scripts Playwright siempre a archivo
`.mjs`, NUNCA inline `node -e`.

### REGLA 2 — FORMATO JSON ELEMENTOR OBLIGATORIO
`_elementor_data` DEBE ser Array plano: `[{...}]`
NUNCA wrapper: `{"version": "x", "content": [...]}` → Error 500.

### REGLA 3 — ASSETS SIEMPRE A WP MEDIA LIBRARY
Nunca uses URLs temporales de Stitch (`lh3.googleusercontent.com`). Siempre
sube a Media Library y usa el ID interno de WordPress.

### REGLA 4 — EXTRACCIÓN HTML SOLO CON curl/PowerShell
`read_url_content` convierte HTML a Markdown y pierde clases Tailwind.
Para capturar HTML real usa `Invoke-WebRequest -UseBasicParsing`.

### REGLA 5 — NOMBRE PHP ÚNICO CON TIMESTAMP (⭐ CRÍTICA)
**LiteSpeed cachea URLs ya visitadas.** Si subes `inject.php` y lo visitas,
LiteSpeed cachea la respuesta. La segunda vez que visites esa URL, LiteSpeed
devuelve la versión cacheada SIN ejecutar PHP.

**SOLUCIÓN OBLIGATORIA**: Cada PHP inyector debe tener nombre único:
```javascript
const uniqueName = `evg_${purpose}_${Date.now()}.php`;
```
Esto GARANTIZA que LiteSpeed no tenga la URL en caché. Este fue el
descubrimiento más importante de todo el proyecto. Sin esto, NADA funciona.

### REGLA 6 — FTP RELATIVO, NUNCA /public_html/
El hosting cPanel mapea FTP root `/` al document root. Subir con path relativo:
```javascript
await client.uploadFrom(localPath, uniqueName); // ✅ relativo
// NUNCA: await client.uploadFrom(localPath, '/public_html/' + uniqueName); // ❌
```

### REGLA 7 — MODSECURITY BLOQUEA SQL EN PHP
ModSecurity (WAF) intercepta requests HTTP cuyo body/response contiene
patrones SQL como `DELETE FROM`, `DROP TABLE`, etc. Si tu PHP genera una
respuesta que contiene SQL-like strings, ModSecurity devuelve `406 Not Acceptable`.

**SOLUCIÓN**: En scripts PHP que hacen limpieza de caché, usa las APIs de
WordPress (`delete_option()`, `wp_cache_flush()`) en lugar de queries SQL raw.
Si necesitas SQL, hazlo ANTES de generar output JSON.

---

## Servidores MCP Requeridos

- **StitchMCP** — Lectura y generación de diseños
- **wp-elementor-mcp** — Inyección via REST API (puede dar 401, ver fallback)
- **elementor-mcp** — Lectura/inyección por archivo

## Skills Hermanos (opcionales)

- `webp-optimizer` → Compresión de imágenes antes de subir a WP
- `design-md` → Generación sistemática del BrandBook
- `html2json-segment` → Parser especializado (solo para trigger `segment!`)

---

## GOLDEN PATH: Pipeline Completo Probado en Producción

> **Fecha**: 2026-04-30 — 14 páginas migradas exitosamente.
> Sigue estos pasos EXACTOS. No improvisar.

### Fase 1: Preparar Inputs

```bash
# Copiar HTML principal
Copy-Item "assets_originales/stitch_v2/01_home.html" "assets_originales/homepage.html"
# Crear design_system.json y page_manifest.json
```

### Fase 2: Compilar HTML → Elementor JSON

```bash
node scripts/compiler_v4.js
node scripts/fix_material_symbols.js
```

Verifica: `elementor_jsons/` debe tener `header.json`, `footer.json`, `homepage.json`.
Todos `isArray=true`, `firstElType=container`.

### Fase 3: Inyectar Header + Footer + Homepage

```bash
node scripts/inject_three_pages.mjs
```

Resultado: JSON con IDs de header, footer, homepage. Self-deletes.

### Fase 4: Inyectar Páginas Restantes (Batch)

```bash
node scripts/inject_all_pages.mjs
```

Lee `page_manifest.json`, crea todas las páginas sin `wp_id`, actualiza manifest.

### Fase 5: Inyectar CSS Global en Todas las Páginas

**ESTE ES EL PASO MÁS IMPORTANTE PARA PARIDAD VISUAL.**

```bash
node scripts/inject_css_batch.mjs
```

Este script:
1. Lee `temp/evergreen-global.css` (excluye `@import` lines)
2. Codifica CSS a base64
3. Genera PHP con nombre único (`evg_css_{timestamp}.php`)
4. Actualiza `_elementor_page_settings.custom_css` en cada página
5. Purga caches (Elementor + WP + LiteSpeed)
6. Self-deletes

### Fase 6: Purgar Elementor CSS Cache via FTP

```bash
node scripts/purge_elementor_css.mjs
```

Elimina archivos `post-*.css` de `/wp-content/uploads/elementor/css/` via FTP.
Elementor los regenera on-demand incluyendo el custom_css inyectado.

### Fase 7: Verificar

```bash
node scripts/verify_css_loading.mjs
node scripts/verify_content_parity.mjs
```

### Post-Inyección Manual
1. wp-admin → Elementor → Templates → Header/Footer display conditions "Entire Site"
2. cPanel → LiteSpeed → "Flush All" (si disponible)

---

## ARQUITECTURA DE CSS: Tres Capas

### Capa 1: `_elementor_page_settings.custom_css` (⭐ MÉTODO PRINCIPAL)

Elementor incluye este CSS directamente en el archivo `post-XXXX.css` regenerado.
Es la forma más confiable porque:
- No depende de mu-plugins ni archivos externos
- Se regenera automáticamente con Elementor
- Funciona incluso si LiteSpeed cachea todo

```php
$settings = get_post_meta($pid, '_elementor_page_settings', true);
if (!is_array($settings)) $settings = [];
$settings['custom_css'] = $css_content;
update_post_meta($pid, '_elementor_page_settings', $settings);
delete_post_meta($pid, '_elementor_css'); // fuerza regeneración
clean_post_cache($pid);
```

**Script**: `inject_css_batch.mjs`

### Capa 2: MU-Plugin + CSS Externo (Respaldo)

Para CSS que necesita `@import` (Google Fonts) o carga condicional:

```php
<?php
// wp-content/mu-plugins/evergreen-custom-styles.php
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('evergreen-global',
        home_url('/wp-content/uploads/evergreen-css/evergreen-global.css'),
        [], '1.0.0');
    // Homepage-specific
    if (is_front_page() || is_page(1758)) {
        wp_enqueue_style('evergreen-homepage',
            home_url('/wp-content/uploads/evergreen-css/evergreen-homepage-v4.css'),
            ['evergreen-global'], '5.0.0');
    }
}, 9999);
```

**Scripts**: `inject_css_final.mjs`, `deploy_css_v4.mjs`

### Capa 3: Elementor JSON Settings Nativos

Para propiedades que Elementor controla (gradientes, tipografía nativa):

```php
$el['settings']['background_background'] = 'gradient';
$el['settings']['background_color'] = '#1D8A43';
$el['settings']['background_color_b'] = '#28B5E1';
$el['settings']['background_gradient_type'] = 'linear';
```

**Script**: `fix_cta_gradient.mjs`

---

## PATRÓN FTP+PHP MASTER (Probado en Producción)

Este es el patrón que SIEMPRE funciona. Todos los scripts exitosos lo usan.

```javascript
import fs from 'fs';
import { Client } from 'basic-ftp';

// 1. Parseo manual de .env (NO usar dotenv para evitar dependencias)
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i === -1) return;
  let v = t.substring(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
  env[t.substring(0, i).trim()] = v;
});

// 2. NOMBRE ÚNICO (⭐ OBLIGATORIO — evita caché LiteSpeed)
const uniqueName = `evg_task_${Date.now()}.php`;

// 3. Generar PHP (base64 para payloads grandes)
const phpScript = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${env.INJECT_SECRET}') {
    http_response_code(403); die('no');
}
ini_set('memory_limit', '256M');
header('Content-Type: application/json; charset=utf-8');
define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');
$results = [];
// ... tu lógica aquí ...
@unlink(__FILE__);
echo json_encode($results, JSON_PRETTY_PRINT);
`;

// 4. FTP upload con path RELATIVO (no /public_html/)
const client = new Client();
await client.access({ host: env.FTP_HOST, user: env.FTP_USER,
  password: env.FTP_PASSWORD, secure: false });
await client.uploadFrom(tempPath, uniqueName); // ← relativo
client.close();

// 5. Ejecutar via HTTP
const resp = await fetch(`${env.WP_URL}/${uniqueName}?token=${env.INJECT_SECRET}`, {
  headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  signal: AbortSignal.timeout(60000)
});
const result = await resp.json();
```

### Variables `.env` Requeridas

```
FTP_HOST=ftp.example.com
FTP_USER=usuario
FTP_PASSWORD=contraseña
INJECT_SECRET=token_secreto_largo
WP_URL=https://example.com
SITE_URL=https://example.com
```

---

## SCRIPTS DE REFERENCIA

### Scripts Core (Golden Path)

| Script | Propósito | Estado |
|--------|-----------|--------|
| `compiler_v4.js` | Transpiler HTML→Elementor JSON | ✅ Probado |
| `inject_three_pages.mjs` | Crea H/F/Homepage via FTP+PHP | ✅ Golden Path |
| `inject_all_pages.mjs` | Batch creation de N páginas | ✅ Probado 13 págs |
| `inject_css_batch.mjs` | CSS global via `_elementor_page_settings` | ✅ **SCRIPT CLAVE** |
| `inject_css_final.mjs` | CSS via mu-plugin + archivo externo | ✅ Respaldo |
| `purge_elementor_css.mjs` | Elimina CSS cache via FTP + regenera | ✅ Probado |
| `fix_material_symbols.js` | Purga texto fantasma de iconos CSS | ✅ Probado |

### Scripts de Verificación

| Script | Propósito |
|--------|-----------|
| `verify_css_loading.mjs` | Verifica CSS links, fonts, tokens en HTML |
| `verify_content_parity.mjs` | Compara headings/buttons entre Stitch y WP |
| `verify_db_data.mjs` | Lee `_elementor_data` directo de DB |
| `find_cache_dirs.mjs` | Escanea directorios de caché via FTP |

### Scripts de Corrección Visual

| Script | Propósito |
|--------|-----------|
| `fix_homepage_v4.mjs` | CSS externo via mu-plugin (bypasa sanitización) |
| `fix_cta_gradient.mjs` | Parchea gradient en `_elementor_data` JSON |
| `force_images.mjs` | Dual-update: `_elementor_data` + `post_content` |
| `upload_category_images.mjs` | FTP + Media Library + Elementor JSON |

---

## REGLAS APRENDIDAS EN PRODUCCIÓN (OBLIGATORIAS)

### ⭐ LiteSpeed Cachea PHP — Nombre Único Obligatorio

**Problema**: LiteSpeed cachea la URL `/inject.php` después de la primera visita.
Futuras requests a esa URL devuelven HTML cacheado sin ejecutar PHP.

**Síntoma**: El script devuelve HTML (la página 404 cacheada) en vez de JSON.
FTP verifica que el archivo PHP sigue existiendo (no fue ejecutado ni self-deleted).

**Solución DEFINITIVA**:
```javascript
const uniqueName = `evg_${purpose}_${Date.now()}.php`;
```
Cada ejecución genera un nombre nunca antes visitado → LiteSpeed no tiene caché → PHP se ejecuta.

**Validación**: Si el PHP se auto-elimina (`@unlink(__FILE__)`) y no existe en FTP post-ejecución → éxito.

### ⭐ ModSecurity (WAF) Bloquea Ciertos PHP

**Problema**: ModSecurity inspecciona el response body. Si contiene patrones
como `DELETE FROM`, `DROP TABLE`, devuelve `406 Not Acceptable`.

**Síntomas**: Response HTML con título "Not Acceptable!" y mención de Mod_Security.

**Solución**: Usar APIs de WordPress en lugar de SQL directo:
```php
// ❌ BLOQUEADO por ModSecurity:
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%litespeed%'");

// ✅ FUNCIONA:
delete_option('_elementor_global_css');
wp_cache_flush();
```

### ⭐ MCP REST API da 401 — Fallback a FTP+PHP

Ambos MCPs (`wp-elementor-mcp` y `elementor-mcp`) fallan con 401 al crear páginas.
**No perder tiempo con MCP `create_page`**. Ir directo a FTP+PHP con `wp_insert_post()`.

### ⭐ FTP Root = Web Root (NO usar FTP_REMOTE_PATH)

cPanel mapea FTP `/` al document root. `FTP_REMOTE_PATH` apunta a subdirectorio no servido.
**Siempre subir a FTP root** (path relativo, sin `/public_html/`).

### ⭐ WordPress Sanitiza `<style>` en `post_content`

`wp_kses_post()` elimina `<style>` tags. **NUNCA inyectar CSS en `post_content`**.
Usar `_elementor_page_settings.custom_css` o mu-plugin.

### ⭐ Dual-Update: `_elementor_data` + `post_content`

Actualizar solo `_elementor_data` NO regenera `post_content`. Los widgets no aparecen.
**Siempre actualizar AMBOS** en la misma ejecución PHP:

```php
// 1. JSON
update_post_meta($pid, '_elementor_data', wp_slash($new_json));
// 2. HTML (con $wpdb para evitar sanitización)
global $wpdb;
$wpdb->update($wpdb->posts, ['post_content' => $html], ['ID' => $pid], ['%s'], ['%d']);
// 3. Cache flush
delete_post_meta($pid, '_elementor_css');
update_post_meta($pid, '_elementor_version', '0.0.0');
clean_post_cache($pid);
```

### ⭐ Elementor CSS Cache = Archivos Estáticos

Elementor genera `post-XXXX.css` en `/wp-content/uploads/elementor/css/`.
Estos archivos incluyen el `custom_css` de `_elementor_page_settings`.
Para forzar regeneración:
1. Eliminar archivos via FTP (`purge_elementor_css.mjs`)
2. O: `delete_post_meta($pid, '_elementor_css')` + `delete_option('_elementor_global_css')`
3. Elementor regenera on-demand en la siguiente visita

### ⭐ Base64 para Payloads Grandes

JSON de Elementor (20-50KB+) causa errores de escaping en PHP generado.
**Solución**: `Buffer.from(data).toString('base64')` → `base64_decode()` en PHP.

### ⭐ `_elementor_data` Puede Estar Double-Encoded

Después de múltiples inyecciones, intentar `stripslashes()` antes de fallar:
```php
$data = json_decode($json_raw, true);
if ($data === null) {
    $data = json_decode(stripslashes($json_raw), true);
}
```

### ⭐ CSS Version Bumping Obligatorio

LiteSpeed + browser cache sirven CSS stale. Al desplegar CSS, SIEMPRE bump versión:
```php
wp_enqueue_style('name', $url, [], '5.0.0'); // ← BUMP
```

### ⭐ PowerShell ≠ Bash

- PowerShell aliasa `curl` a `Invoke-WebRequest`
- Inline `node -e "..."` falla con `$`, regex, comillas anidadas
- **Solución**: Escribir scripts a archivo `.mjs` y ejecutar con `node script.mjs`

### ⭐ Elementor NO Genera CSS para Gradientes Inyectados via PHP

Gradientes en JSON (`background_background: 'gradient'`) no generan CSS automático.
**Solución**: Parchear JSON nativo O usar CSS externo con selectores por `data-id`.

### ⭐ Data-IDs de Elementor NO Son Estables

Después de re-inyecciones los `data-id` cambian. Siempre re-descubrir IDs antes de CSS fixes.

---

## CSS GLOBAL — Design System Tokens

El archivo `temp/evergreen-global.css` contiene el design system completo.
Estructura probada (~277 líneas, 8.7KB):

```
1. Google Fonts (@import — Space Grotesk + Work Sans + Material Symbols)
2. body.elementor-page — bg #0E1320, font Work Sans, color #dee2f5
3. Headings h1-h4 — Space Grotesk, sizes 48/32/24/18px
4. Text editor — Work Sans 16px, color #becabb
5. Buttons — Space Grotesk, uppercase, border-radius 8px, hover effects
6. Header — Glassmorphism (rgba bg + backdrop-filter blur)
7. Nav menu — Space Grotesk, active color #76dc8a
8. Footer — bg #0E1320, border-top slate
9. Product cards — hover border-color, image border-radius
10. Tables — thead bg #1a1f2d, accent #76dc8a
11. Forms — bg #1a1f2d, focus border #76dc8a
12. Dividers — border-top #76dc8a
13. Icons — color #76dc8a
14. Responsive — mobile 32/24/20px, tablet 40/28px
```

**Selectores clave** (funcionan en TODAS las páginas sin data-id):
- `body.elementor-page` — cualquier página Elementor
- `.elementor-location-header` — header template
- `.elementor-location-footer` — footer template
- `.elementor-heading-title` — todos los headings
- `.elementor-widget-text-editor` — todos los bloques de texto
- `.elementor-button` — todos los botones

---

## CACHÉ: Guía de Purge Multi-Capa

### Orden de Purge (de más a menos específico)

```
1. Elementor page CSS:   delete_post_meta($pid, '_elementor_css')
2. Elementor global CSS: delete_option('_elementor_global_css')
3. Elementor version:    update_post_meta($pid, '_elementor_version', '0.0.0')
4. WP post cache:        clean_post_cache($pid)
5. WP object cache:      wp_cache_flush()
6. LiteSpeed (API):      LiteSpeed_Cache_API::purge_all()
7. LiteSpeed (función):  litespeed_purge_all()
8. LiteSpeed (FTP):      Eliminar archivos en /wp-content/litespeed/
9. Elementor CSS files:   Eliminar post-*.css via FTP en /wp-content/uploads/elementor/css/
```

### Cuándo Usar Cada Nivel

| Cambio | Purge Necesario |
|--------|----------------|
| Cambio en `_elementor_data` | Niveles 1-5 |
| Cambio en CSS externo | Niveles 2-7 + version bump |
| Cambio en `custom_css` page settings | Niveles 1-5 + eliminar post-*.css (nivel 9) |
| Nada funciona | Niveles 1-9 (nuclear) |

---

## CORRECCIÓN VISUAL: Workflow Probado

```
1. Diagnóstico → read_url_content + verify_css_loading.mjs
2. Identificar → ¿CSS? ¿JSON? ¿Imágenes? ¿Cache?
3. Si CSS → editar evergreen-global.css → inject_css_batch.mjs → purge_elementor_css.mjs
4. Si JSON → pattern dual-update (_elementor_data + post_content)
5. Si imágenes → FTP upload + Media Library + JSON update
6. Si cache → purge multi-capa (niveles 1-9)
7. Verificar → verify_css_loading.mjs + read_url_content
8. Iterar → típicamente 3-5 ciclos para paridad completa
```

---

## IMÁGENES: Pipeline Completo

```
1. generate_image (AI) → imágenes locales
2. FTP upload → /wp-content/uploads/YYYY/MM/nombre.ext
3. PHP: wp_insert_attachment() + wp_generate_attachment_metadata()
4. PHP: update_post_meta() para alt text
5. JSON: _elementor_data con {url, id, alt, source:'library', size:'full'}
6. HTML: post_content con <img src="nueva_url" />
7. Cache: flush multi-capa
```

**Trampas**:
- SOLO `_elementor_data` → imágenes no aparecen (necesita `post_content`)
- SOLO `post_content` → Elementor restaura datos viejos
- `wp_update_post()` para HTML → WP sanitiza URLs

**Solución**: Actualizar AMBOS + `$wpdb->update()` para HTML.

---

## REFERENCIA: page_manifest.json

```json
{
  "home_id": 1758,
  "header_id": 1756,
  "footer_id": 1757,
  "pipeline_version": "4.8.0",
  "pages": [
    { "html": "stitch_v2/01_home.html", "json": "homepage.json", "wp_id": 1758, "slug": "inicio" },
    { "html": "stitch_v2/02_nosotros.html", "json": "nosotros.json", "wp_id": 1771, "slug": "nosotros" }
  ]
}
```

---

## Protección de Datos del Cliente

**NUNCA** borrar, modificar ni alterar el contenido de `client_data/`.

---

## REFERENCIA TÉCNICA

Para errores de mapeo responsivo, arquitecturas permitidas y debugging:
→ Lee `references/Stitch_Elementor_Guide_GENERAL_V1.md`
