---
name: stitch2elementor
description: >
  Pipeline de doble modo (Elementor Canvas / Static HTML) para extracción, diseño y despliegue desde Google Stitch
  hacia WordPress Elementor Canvas (Novamira MCP) o sitios estáticos multi-página autocontenidos (build Python + FTPS).
  Incluye anti-errores R1-R7, checklist de aceptación, protocolo FTP probe, separación src/site,
  SEO pack automático por página, y reglas inmutables de dimensiones visuales.
---

# Skill: stitch2elementor (v19.0.0 — Dual-Mode Pipeline)

Pipeline de doble modo para convertir interfaces Stitch en sitios web listos para producción:
- **Modo Elementor**: injección programática en WordPress Elementor Canvas (Novamira MCP / FTPS + PHP)
- **Modo Static**: build Python estático multi-página (src/ → site/ → FTPS directo, sin CMS)

Cada modo tiene sus reglas de dimensiones, SEO, verificación y checklist de aceptación. Este documento es la fuente única de verdad para ambos.

---

## 📋 Dependencias (MCPs & Skills)

| Recurso | Tipo | Modo |
|---|---|---|
| `stitch` | MCP | Ambos |
| `notebooklm-mcp` | MCP | Ambos (consulta previa obligatoria) |
| `novamira-mcp` / `#wp-elementor-mcp` | MCP | Elementor |
| `obsidian-mcp` | MCP | Ambos |
| `playwright` (remoto, LAN:3000) | MCP | Ambos (verificación visual) |
| `design-taste-frontend` | Skill | Ambos (anti-slop) |
| `floydia_web_brand` | Skill | Ambos (brandbook insumo) |

---

## ⚡ Menú Interactivo v19 (10 Opciones + Selección de Modo)

```
=====================================================================
      ⚡ STITCH2ELEMENTOR v19.0 — DUAL MODE PIPELINE ⚡
=====================================================================
Elige MODO:  [E] Elementor Canvas (WP)  |  [S] Static HTML (Python)
=====================================================================
 [1] Ingresar brandbook + copys + assets (floydia_web_brand output)
 [2] Auditoría de insumos y gaps (logo, colores, copys, imágenes)
 [3] Generar en Stitch (pantallas desktop, design system)
 [4] Extraer HTMLs de Stitch a carpeta local
 ─────────────────────────────────────────────────────────────────
 Si MODO=E (Elementor):
 [5E] Compilar HTMLs → JSONs Elementor (compiler_v4.js)
 [6E] Desplegar en WordPress vía Novamira MCP / FTP+PHP
 ─────────────────────────────────────────────────────────────────
 Si MODO=S (Static HTML):
 [5S] Build sitio estático (src/ → site/ → Python pages.py)
 [6S] Desplegar sitio vía FTPS a /subcarpeta en el dominio
 ─────────────────────────────────────────────────────────────────
 [7] Post-deploy verification (HTTP 200, Playwright dual-viewport)
 [8] Solo SEO (generar/actualizar meta tags JSON-LD en build)
 [9] Solo componentes (header/footer/botón WA/íconos sociales)
 [10] Personalizado / Libre
=====================================================================
```

---

## 🏗️ Estructura de carpeta del proyecto (ambos modos)

```
PROYECTO/
├── BRANDBOOK.md              ← Brandbook v2 del cliente
├── src/                      ← FUENTES: tokens.css, build.py, pages.py, assets/
├── site/                     ← OUTPUT generado (seguro de borrar/regenerar)
├── deploy.py                 ← Subida FTPS (usa .env para credenciales)
├── seo_pack.py               ← Genera meta tags + JSON-LD por página
├── probe_docroot.py          ← Verifica docroot FTP antes de subir
└── post_deploy_verify.py     ← Checklist de aceptación automatizado
```

**REGLA**: `site/` jamás contiene fuentes. Un `rm -rf site/` no puede destruir nada que no se regenere con un comando.

---

## 🧱 Reglas Anti-Error R0–R8 (ambos modos)

> Cada regla previene un fallo real de producción. No omitir ninguna.

### R0. Modo de operación — elegir ANTES de diseñar
- Si el cliente tiene WordPress activo → Modo E (Elementor). Las páginas son `elementor_library` CPT.
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
| Logo en header | `48px` Elementor image widget | `48px` (`<img height="48">` en `src/`) |
| Íconos sociales | SVG inline 28px caja × 15px SVG | Idem |
| Botón WA flotante | 56px círculo fixed bottom-right | 56px círculo fixed bottom-right |
| Botón WA inline (hero/CTA) | 40px círculo SOLO ícono, sin texto | 40px círculo SOLO ícono, sin texto |

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

El script `seo_pack.py` lee los copys desde `copys_v2/*.md` y genera un diccionario de meta por página que `build.py` inyecta automáticamente.

### R6. Diseño desde el Brandbook, no desde defaults
- **Contenedor**: `1240px` boxed centrado (salvo brandbook indique otro valor).
- **Hero**: split 2 columnas side-by-side (54% texto / 42% media), apilado en mobile.
- **Fondos**: ≥85% claros del viewport; oscuro solo en hero y footer.
- **Tipografía**: SIEMPRE la del brief/Brandbook del cliente. NO sustituir por Inter/Roboto/Arial sin justificación documentada. Si el brief prohíbe una fuente, la prohibición es ley.
- **CTAs**: duales cuando el modelo de negocio lo exija (p.ej. canal B2B + canal B2C).

### R7. Lotes atómicos — pipeline completo por cambio
```
editar src → regenerar site/ → validar local → deploy → curl 200 todo → capturas → revisión
```
Si algo falla: corregir en src y repetir el pipeline completo. Prohibido hacer parches uno-a-uno sobre artefactos vivos.

### R8. Fotos temáticas reales — jamás emojis ni placeholders
- Buscar fotos en `DRIVE/*/assets/`, `DRIVE/*/proyecto_logo_*/`, o `wp-content/uploads/` del cliente.
- Si no hay fotos reales: generar con IA (tool `generate_image`) con prompt específico del servicio/producto.
- Cada hero DEBE tener una foto/imagen representativa, no un degradado con texto ni emoji.
- **NO usar logos de otras empresas** (ej: un Sheraton logo en la página de Seguridad Industrial).

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

### Post-Write Verification (NotebookLM)
La REST API puede devolver HTTP 200 pero el payload puede haber sido descartado silenciosamente por filtros de plugins. Después de cada inyección:
```php
$stored = get_post_meta($id, '_elementor_data', true);
if (json_last_error() !== JSON_ERROR_NONE) {
    // Payload corrupto — restaurar desde backup
}
```

### Header/Footer inyectados en CADA página
Los templates de `elementor_library` type header/footer requieren Theme Builder Pro configurado. Para deployments sin Pro, la solución es inyectar directamente en el `_elementor_data` de cada página:
```php
$header_elements = json_decode(file_get_contents('header.json'), true);
$footer_elements = json_decode(file_get_contents('footer.json'), true);
$current = json_decode(get_post_meta($pid, '_elementor_data', true), true);
$merged = array_merge($header_elements, $current, $footer_elements);
update_post_meta($pid, '_elementor_data', wp_slash(json_encode($merged)));
```

### Compilador: Tailwind → Elementor Flexbox
- El `compiler_v4.js` transcompila HTML+Tailwind a JSON Elementor con mapeo semántico de propiedades Flexbox.
- El compilador lee de `assets_originales/` (línea 34 hardcodeada), NO de `stitch_html/`.
- Archivos necesarios en `assets_originales/`: todas las páginas `.html` + `header-global.html` + `footer-global.html` + `page_manifest.json`.
- Slugs: limpiar trash de WP antes de crear páginas nuevas para evitar sufijos `-2`.

### Post-Deploy Checklist (5 pasos obligatorios)
1. ✅ Header/Footer injectados en cada página
2. ✅ Menú de navegación WordPress creado
3. ✅ Logo SVG subido y configurado como `custom_logo`
4. ✅ Botón flotante de WhatsApp instalado (mu-plugin)
5. ✅ Verificación visual E2E con Playwright

---

## 🔵 Modo S — Pipeline Static HTML (específico)

### Build: src → site
- `src/tokens.css`: design tokens del Brandbook (`:root { --brand-deep: #... }`)
- `src/build.py`: partials compartidos (header, footer, social_icons, hero, cards, callouts, cta_final)
- `src/pages.py`: una función `page()` por ruta, contenido real desde `copys_v2/`
- `src/assets/`: logo SVG real, fotos temáticas en PNG/JPG

Ejecutar `python3 pages.py` regenera `site/` completo.

### Deploy: FTPS directo
- `deploy.py` lee hostname ftp, usuario y path remoto del `.env` (secciones 08-09, 18).
- Si el dominio tiene Cloudflare proxy → usar hostname directo del servidor proporcionado por el hosting (ej: `server.example-hosting.com` en lugar del dominio), no el dominio con CDN.
- El path remoto base se determina con `probe_docroot.py` (ver R1).

### Verificación
- `post_deploy_verify.py`: curl a todas las URLs → capturas Playwright dual-viewport → medición de logo px → reporte

---

## 🖼️ Estándares de Assets Visuales (ambos modos)

### Logo
- Fuente: `DRIVE/proyecto_logo_{cliente}/..._cropped.svg`
- Tamaño: 48px de alto en header desktop, 36px en mobile
- Formato: `<img src="assets/logo-{cliente}.svg" height="48" class="logo-img">`
- NUNCA placeholder genérico, NUNCA texto plano `<span>`, NUNCA logo improvisado en SVG inline

### Iconos sociales
- SVG inline, 28px caja × 15px SVG interno
- CADA red con su color de marca (no monocromático)
- WhatsApp `#25D366`, Instagram degradado, Facebook `#1877F2`, TikTok `#000`, YouTube `#FF0000`, MercadoLibre `#FFE600`, Threads `#000`, Linktree `#28A745`

### Botón WhatsApp
- Flotante: círculo 56px `#25D366` fixed bottom-right 24px
- Inline (hero/CTA): círculo 40px SOLO ícono, sin texto. Acompañado de label externo opcional
- CTA del hero: SIEMPRE dual (ícono WA + botón secundario con texto)

### Imágenes temáticas
- Buscar primero en assets reales del cliente
- Si no hay: generar con IA (herramienta `generate_image`) con prompt descriptivo del servicio/producto
- Cada página DEBE tener una imagen en su hero

---

## 📦 Scripts del Repositorio

| Script | Tipo | Propósito |
|---|---|---|
| `compiler_v4.js` | Node | Transpilador Tailwind → Elementor JSON (Modo E) |
| `sync_and_inject.js` | Node | Orquestador FTP+HTTP bypass WAF (Modo E) |
| `create_hf_native.php` | PHP | Header/Footer Elementor CPT nativos (Modo E) |
| `fix_material_symbols.js` | Node | Purga texto fantasma de CSS fallbacks |
| `fix_slugs.js` | Node | Normaliza slugs WP |
| `purge_wp_cache.mjs` | Node | Limpieza caché Elementor |
| `probe_docroot.py` | Python | Detecta docroot FTP real (Modo S, R1) |
| `seo_pack.py` | Python | Genera meta+JSON-LD por página (Ambos modos) |
| `post_deploy_verify.py` | Python | Checklist automatizado con curl+Playwright (Ambos modos) |

---

## ✅ Checklist de Aceptación Final (ambos modos)

- [ ] Modo correcto elegido antes de diseñar (E / S)
- [ ] Probe FTP devolvió 200
- [ ] src/ y site/ separados (las fuentes no viven en site/)
- [ ] Todas las URLs devuelven HTTP 200
- [ ] Sitio raíz del cliente intacto (200, sin tocar)
- [ ] Logo real SVG a 48px (±8px) medido en DOM
- [ ] Iconos sociales 28px con color de cada red
- [ ] Botón WhatsApp: flotante 56px + inline 40px solo ícono
- [ ] SEO pack presente en cada página (title + desc + keywords + canonical + JSON-LD)
- [ ] Keyword primaria del meta = H1 de la página
- [ ] Capturas desktop 1440px + mobile 375px revisadas visualmente
- [ ] Fotos temáticas reales en cada hero (no emojis, no placeholders, no logos de otras empresas)
- [ ] Cero credenciales en archivos versionados o subidos
- [ ] Skill actualizado en memory-bank si se descubrió un error nuevo
