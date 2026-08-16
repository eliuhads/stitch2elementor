---
name: stitch2elementor
description: >
  Pipeline de doble modo (Elementor Canvas / Static HTML) para extracción, diseño y despliegue desde Google Stitch
  hacia WordPress Elementor Canvas (Novamira MCP) o sitios estáticos multi-página autocontenidos (build Python + FTPS).
  v20: Pipeline Híbrido Determinista (E1 Extract → E2 Compile → E3 Lint → E4 Deploy) diseñado para modelos
  no-frontier: el LLM orquesta y valida, los scripts transforman. Incluye anti-errores R0-R11, linter pre-flight
  con exit codes, IDs deterministas uuid5, matriz de activos IA con contingencia de cuota, checklist de aceptación
  y reglas inmutables de dimensiones visuales.
---

# Skill: stitch2elementor (v20.0.0 — Deterministic Hybrid Pipeline)

Pipeline para convertir interfaces Stitch en sitios web listos para producción:
- **Modo Elementor**: inyección programática en WordPress Elementor Canvas (Novamira MCP / FTPS + PHP)
- **Modo Static**: build Python estático multi-página (src/ → site/ → FTPS directo, sin CMS)

> **v20 — Por qué existe**: los modelos frontier ejecutan bien la conversión HTML→Elementor, pero los modelos
> intermedios/rápidos (Gemini Flash, Qwen Max, DeepSeek V3/V4) fallan en 4 vectores: alucinación de esquema
> Elementor, corrupción de estilos/responsive, ambigüedad de instrucción y gestión de activos/cuotas.
> **La respuesta arquitectónica es quitarle al LLM la generación libre de JSON**: toda transformación
> HTML→Elementor la ejecutan scripts deterministas en `scripts/` y una puerta de calidad (linter) decide
> con exit code si el payload puede desplegarse. El LLM orquesta, decide y verifica — nunca transpila a mano.

---

## 🧬 Matriz de Vectores de Falla (V1–V4) → Mitigación v20

| Vector | Síntoma en modelos intermedios | Mitigación determinista v20 |
|---|---|---|
| **V1** Alucinación de esquema | IDs duplicados, `elements` no-array, anidación flexbox inválida | `compile_ir_to_elementor.py` genera IDs uuid5 deterministas; `lint_elementor_json.py` valida estructura y unicidad recursiva; **R9 prohíbe JSON a mano** |
| **V2** Corrupción estilos/responsive | Variables CSS perdidas, breakpoints desalineados, layouts rotos en 375px | Compilador inyecta `flex_direction_mobile: column` + `width_mobile: 100%` por regla mecánica (**R10**); Tailwind con `important: true` (Lección 24); linter E5 bloquea contenedores sin responsive |
| **V3** Ambigüedad de instrucción | El LLM "recuerda" pasos en vez de verificarlos | **R11**: cada etapa produce artefacto JSON + exit code; la máquina decide, no la intuición. Reportes `lint.json`, `asset_matrix.json` |
| **V4** Activos/cuotas | Omisiones silenciosas de imágenes, interrupción al agotar cuota | `asset_matrix.py scan/verify` (matriz página→archivo→ratio + conteo/timestamps); fallback Gemini web documentado (Lección 23) en **R8** |

---

## 🏛️ Arquitectura v20 — Pipeline Híbrido Determinista (Modo E)

```
HTML Stitch ──► [E1 EXTRACT]  scripts/extract_ir.py
                              DOM parse stdlib → ir.json (secciones, headings, imgs, ctas)
                      │
                      ▼
              [E2 COMPILE]    scripts/compile_ir_to_elementor.py
                              IR → _elementor_data · IDs uuid5 (7 hex) · R6 boxed 1240px
                              · R10 responsive mecánico · merge --header/--footer con
                              re-hash de IDs (unicidad por construcción)
                      │
                      ▼
              [E3 LINT]       scripts/lint_elementor_json.py  →  PUERTA OBLIGATORIA
                              E1 parse · E2 IDs únicos · E3 elType/widgetType · E4 boxed
                              · E5 responsive · E6 logo R4 · E7 integridad elements
                              exit≠0 ⇒ PROHIBIDO desplegar
                      │
                      ▼
              [E4 DEPLOY+QA]  LLM orquesta: wp_slash() · _elementor_page_settings=array PHP
                              (Lección 24) · audit mu-plugins legacy · purge EPC ·
                              post-write verification · Playwright dual-viewport CT252
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

## ⚡ Menú Interactivo v20 (10 Opciones + Selección de Modo)

```
=====================================================================
      ⚡ STITCH2ELEMENTOR v20.0 — DETERMINISTIC HYBRID PIPELINE ⚡
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
      → E4: desplegar vía Novamira MCP / FTP+PHP + post-write verify
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
Activos IA (ambos modos): asset_matrix.py scan → prompts en
DRIVE/PROMPTS/ → generación (o fallback Gemini web) → webp-optimizer
→ asset_matrix.py verify (exit=0) → recompilar.
```

---

## 🏗️ Estructura de carpeta del proyecto (ambos modos)

```
PROYECTO/
├── BRANDBOOK.md              ← Brandbook del cliente
├── src/                      ← FUENTES: tokens.css, build.py, pages.py, assets/
├── site/                     ← OUTPUT generado (seguro de borrar/regenerar)
├── deploy.py                 ← Subida FTPS (usa .env para credenciales)
├── seo_pack.py               ← Genera meta tags + JSON-LD por página
├── probe_docroot.py          ← Verifica docroot FTP antes de subir
├── post_deploy_verify.py     ← Checklist de aceptación automatizado
└── ir/                       ← v20: IRs JSON por página (E1) + payload Elementor (E2)
    └── reports/              ← v20: lint.json + asset_matrix.json (evidencia E3)
```

**REGLA**: `site/` jamás contiene fuentes. Un `rm -rf site/` no puede destruir nada que no se regenere con un comando.

---

## 🧱 Reglas Anti-Error R0–R11 (ambos modos)

> Cada regla previene un fallo real de producción. No omitir ninguna.
> R9–R11 son nuevas en v20 y blindan a los modelos no-frontier.

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

El script `seo_pack.py` lee los copys desde `copys_v2/*.md` y genera un diccionario de meta por página que `build.py` inyecta automáticamente. En Modo E, E1 (`extract_ir.py`) ya captura `title` y `meta_description` en el IR.

### R6. Diseño desde el Brandbook, no desde defaults
- **Contenedor**: `1240px` boxed centrado (salvo brandbook indique otro valor; el compilador lo valida en rango 1140–1440).
- **Hero**: split 2 columnas side-by-side (54% texto / 42% media), apilado en mobile.
- **Fondos**: ≥85% claros del viewport; oscuro solo en hero y footer.
- **Tipografía**: SIEMPRE la del brief/Brandbook del cliente. NO sustituir por Inter/Roboto/Arial sin justificación documentada. Si el brief prohíbe una fuente, la prohibición es ley.
- **CTAs**: duales cuando el modelo de negocio lo exija (p.ej. canal B2B + canal B2C).

### R7. Lotes atómicos — pipeline completo por cambio
```
editar src → E1 → E2 → E3 (lint PASS) → deploy → curl 200 todo → capturas → revisión
```
Si algo falla: corregir en src y repetir el pipeline completo. Prohibido hacer parches uno-a-uno sobre artefactos vivos.

### R8. Fotos temáticas reales — jamás emojis ni placeholders (+ contingencia de cuota)
- Buscar fotos en `DRIVE/*/assets/`, `DRIVE/*/proyecto_logo_*/`, o `wp-content/uploads/` del cliente.
- Si no hay fotos reales: generar con IA (tool `generate_image`) con prompt específico del servicio/producto.
- Cada hero DEBE tener una foto/imagen representativa, no un degradado con texto ni emoji.
- **NO usar logos de otras empresas** (ej: un Sheraton logo en la página de Seguridad Industrial).
- **Pipeline de activos v20 (Lección 23, formalizada)**:
  1. `asset_matrix.py scan <dir_html> -o asset_matrix.json` → matriz página→archivo→ratio con presupuesto WebP (heroes 16:9 <130KB, cards 4:3 <100KB).
  2. Archivo único de prompts autónomos (inglés, nombre de archivo exacto de la matriz, paleta de marca, negativos anti-slop) archivado SIEMPRE en `DRIVE/PROMPTS/` del cliente.
  3. Generación (`generate_image` o fallback) → `webp-optimizer` → `src/assets/images/`.
  4. `asset_matrix.py verify asset_matrix.json --images-dir src/assets/images/ [--newer-than "YYYY-MM-DD HH:MM"]` → exit≠0 si falta algún asset o su timestamp es anterior al corte (detecta omisiones silenciosas).
- **Contingencia de cuota agotada**: si `generate_image`/Antigravity agota cuota → ejecutar los MISMOS prompts en **Gemini web (gemini.google.com) con cuentas alternas del dueño** → descargar → optimizar → `src/assets/images/` → `asset_matrix.py verify` → recompilar + QA visual remoto.

### R9. ⛔ PROHIBIDO generar `_elementor_data` a mano (anti-V1, v20)
- Todo payload Elementor proviene de `compile_ir_to_elementor.py` (o compilador de proyecto validado con el mismo linter).
- El LLM jamás escribe, edita ni "repara" JSON Elementor en libre interpretación: si el linter falla, se corrige el HTML/IR fuente y se recompila.
- Header y footer se fusionan SOLO con `--header/--footer` del compilador (re-hash de IDs incluido). Prohibido `array_merge` manual sobre JSON editado a mano.

### R10. Responsive y estilos por regla mecánica (anti-V2, v20)
- El compilador inyecta en TODO contenedor con hijos: `flex_direction_mobile: column` + `width_mobile: 100%` (Lección 21). El linter (E5) bloquea payloads que no los tengan.
- Tailwind Play CDN 3.4 en sitios inyectados en WP: `important: true` en `tailwind.config` SIEMPRE (Lección 24: las utilities capadas pierden contra CSS no-capado del host).
- `tokens.css`/brandbook es la única fuente de variables CSS; prohibido inlinear colores ad-hoc que contradigan los tokens.

### R11. Contratos de etapa con exit code (anti-V3, v20)
- Cada etapa del pipeline produce un artefacto verificable: `ir.json` (E1), `*_elementor.json` (E2), `lint.json` (E3), `asset_matrix.json` + reporte verify (activos).
- **Exit codes contractuales**: 0=PASS, 1=FAIL bloqueante, 2=warnings (revisar), 3=mal uso. Un "creo que está bien" del LLM NO sustituye un exit 0.
- Si una etapa falla 2 veces consecutivas, detenerse y escalar al usuario con el reporte JSON — prohibido iterar a ciegas.

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
// Verificar marcador único del build (ej: alt imposible) y re-leer
```

### Header/Footer inyectados en CADA página (merge mecánico v20)
Los templates de `elementor_library` type header/footer requieren Theme Builder Pro. Para deployments sin Pro, la vía v20 es el merge en compilación:
```bash
python3 compile_ir_to_elementor.py page.ir.json -o page_elementor.json \
    --header header_elementor.json --footer footer_elementor.json --page-settings
```
El compilador re-hashea los IDs del header/footer (unicidad por construcción). El PHP de deploy solo hace `wp_slash(json_encode($elements))` del archivo resultante — cero edición manual.

### Pre-flight de despliegue (orden inmutable)
1. `lint_elementor_json.py` exit=0 en TODOS los payloads (R11).
2. Slugs: limpiar trash de WP antes de crear páginas nuevas para evitar sufijos `-2` (`wp_delete_post($id, true)`).
3. Mapeo de IDs WP: script pre-flight `get_posts(['post_type'=>'page'])` para vincular ID ↔ `post_name` antes de construir (Lección 18).
4. **Auditar `mu-plugins/` del servidor antes de inyectar** (Lección 24): neutralizar legados con rename a `.php.disabled` (reversible — NUNCA borrar).
5. WAF Mod_Security (Bluehost): payloads grandes → HTTP 406. Vía ganadora: `create-upload-link` (PUT binario) + `execute-php` con payloads pequeños que leen del FS (Lección 24).

### Post-Deploy Checklist (5 pasos obligatorios)
1. ✅ Header/Footer inyectados en cada página (merge E2, no manual)
2. ✅ Menú de navegación WordPress creado
3. ✅ Logo SVG subido y configurado como `custom_logo`
4. ✅ Botón flotante de WhatsApp instalado (mu-plugin)
5. ✅ Verificación visual E2E con Playwright (desktop 1440px + mobile 375px)

### Caché edge (Newfold/Bluehost)
- `Endurance_Page_Cache::purge_all()` SÍ purga programático (Lección 24, V8) — verificar siempre con test de marcador ALT.
- Si el marcador no aparece tras purge: la caché edge solo expira por TTL o purge manual del dueño en el portal (Lección 21). No gastar >3 intentos programáticos; escalar al dueño.

---

## 🔵 Modo S — Pipeline Static HTML (específico)

### Build: src → site
- `src/tokens.css`: design tokens del Brandbook (`:root { --brand-deep: #... }`)
- `src/build.py`: partials compartidos (header, footer, social_icons, hero, cards, callouts, cta_final)
- `src/pages.py`: una función `page()` por ruta, contenido real desde `copys_v2/`
- `src/assets/`: logo SVG real, fotos temáticas en WebP (presupuesto R8)

Ejecutar `python3 pages.py` regenera `site/` completo.

### Deploy: FTPS directo
- `deploy.py` lee hostname ftp, usuario y path remoto del `.env`.
- Si el dominio tiene Cloudflare proxy → usar hostname directo del servidor proporcionado por el hosting (ej: `server.example-hosting.com` en lugar del dominio), no el dominio con CDN.
- El path remoto base se determina con `probe_docroot.py` (ver R1).

### Verificación
- `post_deploy_verify.py`: curl a todas las URLs → capturas Playwright dual-viewport → medición de logo px → reporte

---

## 🖼️ Estándares de Assets Visuales (ambos modos)

### Logo
- Fuente: `DRIVE/proyecto_logo_{cliente}/..._cropped.svg`
- Tamaño: 48px de alto en header desktop, 36px en mobile (E2 lo fija si detecta "logo" en src/alt)
- Formato: `<img src="assets/logo-{cliente}.svg" height="48" class="logo-img">`
- NUNCA placeholder genérico, NUNCA texto plano `<span>`, NUNCA logo improvisado en SVG inline

### Iconos sociales
- SVG inline, 28px caja × 15px SVG interno
- CADA red con su color de marca (no monocromático)
- WhatsApp `#25D366`, Instagram degradado, Facebook `#1877F2`, TikTok `#000`, YouTube `#FF0000`, MercadoLibre `#FFE600`, Threads `#000`, Linktree `#28A745`

### Botón WhatsApp
- Flotante: círculo 56px `#25D366` fixed bottom-right 24px (o 42px si el brandbook lo fija)
- Inline (hero/CTA): círculo 40px SOLO ícono, sin texto. Acompañado de label externo opcional
- CTA del hero: SIEMPRE dual (ícono WA + botón secundario con texto)

### Imágenes temáticas
- Buscar primero en assets reales del cliente
- Si no hay: pipeline R8 con `asset_matrix.py` (matriz → prompts → generación/fallback → verify)
- Cada página DEBE tener una imagen en su hero

---

## 📦 Scripts del Skill (v20, deterministas, Python stdlib)

> **Rutas**: en el workspace viven en `scripts/` junto a este SKILL.md
> (`.agents/skills/stitch2elementor/scripts/`). En el repo GitHub
> (`eliuhads/stitch2elementor`) viven en `pipeline/` en la raíz, para no
> mezclarse con los scripts legacy de `scripts/`.

| Script | Etapa | Propósito | Exit codes |
|---|---|---|---|
| `extract_ir.py` | E1 | HTML Stitch/editado → IR JSON (secciones, headings, imgs, CTAs, meta) | 0 OK · 1 entrada · 2 sin contenido |
| `compile_ir_to_elementor.py` | E2 | IR → `_elementor_data` (IDs uuid5, R6/R10 mecánicos, merge header/footer con re-hash, page_settings array PHP) | 0 OK · 1 entrada · 2 IR inválido |
| `lint_elementor_json.py` | E3 | Puerta pre-flight: E1–E7 (parse, IDs únicos, tipos, boxed, responsive, logo R4, integridad) | 0 PASS · 1 FAIL · 2 WARN · 3 uso |
| `asset_matrix.py` | Activos | `scan`: matriz página→archivo→ratio+presupuesto · `verify`: cobertura/timestamps/pesos (Lección 23) | 0 OK · 1 faltantes · 3 uso |
| `elementor_schema.json` | E3 | SSOT de enumeraciones/patrones para el linter (stdlib, sin jsonschema) | — |

## 📦 Scripts del Repositorio de proyecto (por deploy)

| Script | Tipo | Propósito |
|---|---|---|
| `compiler_v4.js` | Node | Transpilador legacy Tailwind → Elementor JSON (proyectos V6-; si se usa, su salida DEBE pasar el linter v20) |
| `sync_and_inject.js` | Node | Orquestador FTP+HTTP bypass WAF (Modo E) |
| `create_hf_native.php` | PHP | Header/Footer Elementor CPT nativos (Modo E) |
| `fix_material_symbols.js` | Node | Purga texto fantasma de CSS fallbacks |
| `fix_slugs.js` | Node | Normaliza slugs WP |
| `purge_wp_cache.mjs` | Node | Limpieza caché Elementor |
| `probe_docroot.py` | Python | Detecta docroot FTP real (Modo S, R1) |
| `seo_pack.py` | Python | Genera meta+JSON-LD por página (Ambos modos) |
| `post_deploy_verify.py` | Python | Checklist automatizado con curl+Playwright (Ambos modos) |

---

## ✅ Checklist de Aceptación Final v20 (ambos modos)

- [ ] Modo correcto elegido antes de diseñar (E / S)
- [ ] **(Modo E) E3: `lint_elementor_json.py` exit=0 en TODOS los payloads — evidencia en `ir/reports/`**
- [ ] **(Modo E) Ningún `_elementor_data` fue escrito/editado a mano (R9) — todo proviene del compilador**
- [ ] **(Modo E) `_elementor_page_settings` inyectado como array PHP (Lección 24), verificado con post-write read**
- [ ] **Activos IA: `asset_matrix.py verify` exit=0 (100% cobertura, timestamps ≥ corte, presupuestos WebP OK)**
- [ ] Probe FTP devolvió 200
- [ ] src/ y site/ separados (las fuentes no viven en site/)
- [ ] Todas las URLs devuelven HTTP 200
- [ ] Sitio raíz del cliente intacto (200, sin tocar)
- [ ] Logo real SVG a 48px (±8px) medido en DOM
- [ ] Iconos sociales 28px con color de cada red
- [ ] Botón WhatsApp: flotante 56px (o 42px brandbook) + inline 40px solo ícono
- [ ] SEO pack presente en cada página (title + desc + keywords + canonical + JSON-LD)
- [ ] Keyword primaria del meta = H1 de la página
- [ ] Capturas desktop 1440px + mobile 375px revisadas visualmente (Playwright remoto CT252)
- [ ] Fotos temáticas reales en cada hero (no emojis, no placeholders, no logos de otras empresas)
- [ ] Cero credenciales en archivos versionados o subidos
- [ ] Skill actualizado en memory-bank si se descubrió un error nuevo

---

## 📝 Changelog v20.0.0 (2026-08-16)

- **Arquitectura**: Pipeline Híbrido Determinista E1→E4; el LLM orquesta, los scripts transforman.
- **Nuevos scripts stdlib**: `extract_ir.py`, `compile_ir_to_elementor.py`, `lint_elementor_json.py`, `asset_matrix.py` + `elementor_schema.json` (8/8 pruebas PASS: round-trip, idempotencia, 3 casos negativos, merge, matriz).
- **Nuevas reglas**: R9 (prohibido JSON Elementor a mano), R10 (responsive/Tailwind important por regla mecánica), R11 (contratos de etapa con exit codes).
- **Fix de diseño detectado por el propio pipeline**: merge header/footer re-hashea IDs (unicidad por construcción, anti-V1).
- **R8 ampliada**: matriz de activos con `verify` (omisiones silenciosas) + fallback Gemini web formalizado.
- **Lecciones integradas**: L18 (mapeo IDs), L21 (responsive + caché edge), L23 (activos/cuota), L24 (page_settings array PHP, `important:true`, mu-plugins audit, WAF 406, purge EPC).
