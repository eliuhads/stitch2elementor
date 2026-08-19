---
name: stitch2elementor
description: >
  Pipeline de doble modo (Elementor Canvas / Static HTML) para extracción, diseño y despliegue desde Google Stitch
  hacia WordPress Elementor Canvas (Novamira MCP como SSOT) o sitios estáticos multi-página autocontenidos (build Python + FTPS).
  v25: Etapa E4.5 de purga multinivel verificada (purge_and_verify.py con marcador ALT), schema probing con verificación
  de frescura en E2 (bloqueo si probe >14 días), linter E13 de editabilidad Track B (rechaza widgets HTML opacos
  reproducibles con widgets nativos), Guardrails R0-R26, Flexbox Containers v4 y Google Colab Pro GPU Offloading.
---

# Skill: stitch2elementor (v25.0.0 — Verified Purge, Fresh Schema & Native Editability)

Pipeline para convertir interfaces Stitch en sitios web listos para producción:
- **Modo Elementor**: inyección programática en WordPress Elementor Canvas con Contenedores Flexbox y Widgets Nativos (Novamira MCP como SSOT / FTPS + REST)
- **Modo Static**: build Python estático multi-página (src/ → site/ → FTPS directo, sin CMS)

> **v23 — Por qué existe**: los modelos frontier ejecutan bien la conversión HTML→Elementor, pero los modelos
> intermedios/rápidos (Gemini Flash, Qwen Max, DeepSeek V3/V4) fallan en vectores críticos: alucinación de esquema
> Elementor, corrupción de caracteres por escape manual de JSON/HTML, desbordamiento horizontal en móviles por falta
> de especificidad CSS en Canvas, sobrecarga de CSS inline en base de datos, bloqueos por cachés compilados de Elementor,
> SVGs gigantes sin rasterizar que rompen layouts, y falsos positivos en QA por validar únicamente código HTTP 200 sin
> autoScroll ni inspección visual real.
> **La respuesta arquitectónica es consagrar a Novamira MCP como SSOT rector y aplicar herramientas deterministas**: toda transformación
> HTML→Elementor la ejecutan scripts deterministas en `scripts/` y una puerta de calidad visual (linter + Playwright autoScroll) decide
> con exit code si el payload puede desplegarse. El LLM orquesta, decide y verifica visualmente — nunca transpila a ciegas.

---

## 🧬 Matriz de Vectores de Falla (V1–V10) → Mitigación v23

| Vector | Síntoma en compilaciones | Mitigación determinista v23 |
|---|---|---|
| **V1** Alucinación de esquema | IDs duplicados, `elements` no-array, anidación flexbox inválida | `compile_ir_to_elementor.py` genera IDs uuid5 deterministas; `lint_elementor_json.py` valida estructura y unicidad recursiva; **R9 prohíbe JSON a mano** |
| **V2** Corrupción estilos/responsive | Variables CSS perdidas, breakpoints desalineados, layouts rotos en 375px | Compilador inyecta `flex_direction_mobile: column` + `width_mobile: 100%` por regla mecánica (**R10**); **R15** exige `!important` en media queries estructurales |
| **V3** Ambigüedad de instrucción | El LLM "recuerda" pasos en vez de verificarlos | **R11**: cada etapa produce artefacto JSON + exit code; la máquina decide, no la intuición. Reportes `lint.json`, `asset_matrix.json` |
| **V4** Activos/cuotas | Omisiones silenciosas de imágenes, interrupción al agotar cuota | `asset_matrix.py scan/verify` (matriz página→archivo→ratio + conteo/timestamps); fallback Gemini web documentado (Lección 23) en **R8** |
| **V5** Escaping Hell en transporte RPC | Comillas rotas, unicode corrupto, JSON inválido al inyectar por API | **R12 Transporte Base64 Obligatorio**: empaquetar HTML/JSON con `base64_encode()` en cliente y `base64_decode()` en servidor PHP |
| **V6** Sobrecarga de CSS inline en BD | 20KB+ duplicados por página, lentitud de carga, mantenimiento imposible | **R13 Desacoplamiento de CSS Maestro**: compilar hoja centralizada (`v6-styles.css`) en `/uploads/` y enlazarla con `?v=hash` |
| **V7** Caché fantasma de Elementor | Cambios en BD no se reflejan en el navegador | **R14 Purga Multinivel Novamira**: ejecutar `wp elementor flush-css` y `wp cache flush` vía Novamira MCP (**Lección 35**) |
| **V8** Desbordamiento en 375px (Overflow) | Grids o tablas rebasan el ancho del viewport móvil | **R15**: `*, *::before, *::after { box-sizing: border-box !important; }` + `overflow-x: hidden !important; max-width: 100% !important;` |
| **V9** SVGs Gigantes de Illustrator | El logo se renderiza a 2000px tapando toda la pantalla | **R19**: Prohibido usar SVGs crudos sin rasterizar a PNG/WebP (360×375) o sin límites CSS inline estrictos `max-height: 38px !important` (**Lección 32**) |
| **V10** Falsos Positivos de QA Visual | El agente da "PASS" con imágenes blancas o fallas de contraste | **R22**: Prohibido dar PASS solo por HTTP 200. Obligatorio autoScroll en Playwright CT252 e inspección visual de capturas (**Lección 33**) |

---

## 🏛️ Arquitectura v23 — Pipeline Híbrido Determinista (Modo E)

```
HTML Stitch/Editado ──► [E1 EXTRACT]  scripts/extract_ir.py
                                      DOM parse stdlib → ir.json (secciones, headings, imgs, ctas)
                              │
                              ▼
                      [E2 COMPILE]    scripts/compile_ir_to_elementor.py
                                      IR → _elementor_data · IDs uuid5 (7 hex) · R6 boxed 1240px
                                      · R10/R15 responsive mecánico · merge --header/--footer con
                                      re-hash de IDs · BLINDAJE v25 (R25): exige elementor_target,
                                      valida versión real y bloquea si el schema-probe tiene >14 días
                              │
                              ▼
                      [E3 LINT]       scripts/lint_elementor_json.py  →  PUERTA OBLIGATORIA
                                      E1 parse · E2 IDs únicos · E3 elType/widgetType · E4 boxed
                                      · E5/E11 responsive · E6 logo R4/R19 · E7 integridad
                                      · E8-E12 guardrails · E13 editabilidad Track B (R26)
                                      exit≠0 ⇒ PROHIBIDO desplegar
                              │
                              ▼
                      [E4 DEPLOY]     LLM orquesta con Transporte Out-of-Band (R23) · Novamira MCP SSOT
                                      · CSS maestro desacoplado (R13) con marcador ALT único de versión
                              │
                              ▼
                      [E4.5 PURGE]    scripts/purge_and_verify.py  →  PUERTA OBLIGATORIA (R14/R24)
                                      Purga multinivel Novamira (flush-css → cache flush →
                                      Endurance_Page_Cache::purge_all) + verificación HTTP del
                                      marcador ALT · exit≠0 ⇒ repetir purga (máx. 3 intentos)
                              │
                              ▼
                      [E5 QA]         Playwright autoScroll CT252 + Inspección Visual (R22)
                                      · qa_assertions.js + visual_diff.py
```

**Reparto de roles (inmutable)**: el LLM decide *qué* páginas, *qué* contenido y *cuándo* desplegar;
los scripts deciden *cómo* se transforma y valida. Ningún `_elementor_data` nace de generación libre del LLM.

---

## 📋 Dependencias (MCPs & Herramientas)

| Recurso | Tipo | Rol / Estado en v23 |
|---|---|---|
| `novamira-mcp` | MCP | **SSOT Primario de WordPress**: ejecución de WP-CLI (`wp elementor flush-css`, `wp cache flush`, posts, plugins) |
| `#elementor-mcp` | MCP | **DEPRECATED / OBSOLETO** (Deshabilitado en opencode.jsonc) |
| `#wp-elementor-mcp` | MCP | **DEPRECATED / OBSOLETO** (Deshabilitado en opencode.jsonc) |
| `playwright` (CT252 `ws://192.168.1.252:3000/playwright`) | Runner Remoto | Verificación visual y capturas fullPage con autoScroll |
| `google-colab` (`eliutec.aux.ia1@gmail.com`) | Cloud GPU | Offloading de cálculo pesado Python, optimización masiva de medios y ML |
| `notebooklm-mcp` | MCP | Ingesta y consulta de fuentes técnicas |
| `obsidian-mcp` | MCP | Memoria persistente en Proxmox CT106 (`memory-bank/`) |
| `design-taste-frontend` | Skill | Directivas de calidad estética y anti-slop |
| `floydia-web-brand` | Skill | Insumo de Brandbook y arquitectura de contenidos |

---

## ⚡ Estrategia de Salida Dual (Modo A vs Modo B)

### Track A: Modo A Encapsulado (Alta Fidelidad Visual)
- **Estructura**: Contenedor Flexbox raíz boxed (`1240px`) que encapsula un Widget HTML de alta fidelidad con Tailwind CSS, micro-degradados, Google Fonts y scripts de menú off-canvas.
- **Uso ideal**: Portadas complejas, landing pages con animaciones avanzadas, bento grids asimétricos y micro-componentes interactivos donde se requiere **100% de identidad pixel-perfect** con el diseño original de Stitch.

### Track B: Modo B Nativo (Atomic Flexbox Containers v4)
- **Estructura**: Árbol modular de Contenedores Flexbox (`elType: "container"`) con Widgets Nativos editables (`heading`, `text-editor`, `image`, `button`).
- **Uso ideal**: Páginas internas de contenido, blogs, catálogos y secciones donde el cliente final necesita editar directamente textos e imágenes en el panel visual de Elementor sin tocar código.
- **Requisito mandatorio**: Carga desacoplada de la hoja de estilos maestra (`v6-styles.css`) en `/uploads/` o inyección en cabecera para garantizar que los widgets nativos no pierdan sus clases estéticas.

---

## 🛡️ Reglas Maestras y Guardrails (R0 a R22)

### R0. 🏗️ El Criterio de Selección de Modo (E / S)
- Si el cliente requiere **WordPress / Elementor** → usar **Modo E**.
- Si el proyecto es un sitio **estático de alto rendimiento** (sin CMS) → usar **Modo S**.

### R1. 🎨 Paleta de Color Inmutable
- Extraer tokens del Brandbook. Prohibido inventar colores o usar colores genéricos del navegador.

### R2. ✍️ Tipografía con Intención
- Cargar fuentes Google Fonts en `<head>` o en el tema. Prohibido usar Inter/Roboto por defecto sin justificación.

### R3. 📐 Layout & Grid Boxed (1240px)
- El contenedor principal nunca rebasa `1240px` (o `1280px` según brandbook).

### R4. 🖼️ Tratamiento del Logo
- El logo debe tener una altura visible de **38px a 48px** en el Header y **48px a 64px** en el Footer, montado sobre cápsula clara de alto contraste si el fondo es oscuro.

### R5. 🔲 Botones & CTAs
- Botón primario de WhatsApp con enlaces parametrizados (`wa.me/58...?text=...`).

### R6. 📱 Responsive First
- Vista móvil en `375px` y escritorio en `1440px` probados en Playwright.

### R7. 🔍 SEO Técnico
- Title único, meta description, favicon, Open Graph y Schema.org JSON-LD en cada página.

### R8. 📸 Matriz de Activos WebP & Contingencia de Cuota
- Heroes (16:9, 1440×810, <130 KB) y Cards (4:3, 800×600, <90 KB).
- **Contingencia**: Si la API de generación agota cuota, ejecutar los prompts archivados en `DRIVE/PROMPTS/` en Gemini web → descargar → optimizar con Pillow LANCZOS.

### R9. 🤖 Prohibición de Generación de JSON a Mano
- Todo JSON de Elementor debe generarse mediante scripts deterministas en `scripts/`.

### R10. 🔄 Flex Direction Responsivo Mecánico
- Los contenedores flexbox deben tener `flex_direction_mobile: column` y `width_mobile: 100%`.

### R11. 🚦 Exit Codes y Puertas de Calidad
- Cada script de validación debe retornar `exit code 0`. Si falla, se aborta el despliegue.

### R12. 📦 Transporte Base64 (DEPRECADO como primario — Solo Fallback)
- El transporte Base64 en el contexto del LLM queda deprecado como vía primaria. Se conserva exclusivamente como canal de contingencia si falla el transporte por sistema de archivos.

### R23. 🚀 Despliegue Out-Of-Band vía Filesystem (Cero Overhead de Contexto)
- **Regla Madre**: El payload JSON viaja por el filesystem (`/tmp/` o `/uploads/s2e_payloads/`); el contexto del LLM solo transporta rutas de archivos y hashes SHA256 (menos de 100 tokens por deploy). El comando ejecutor `s2e_deploy.sh` o el mu-plugin `deploy_elementor.php` aplican `_elementor_data` directamente en disco.

### R13. ⚡ Desacoplamiento de CSS Maestro
- Compilar estilos globales en un archivo central (`styles.css`) en `/uploads/` enlazado con parámetro de versión `?v=hash`.

### R14. 🧹 Purga de Caché Multinivel con Novamira MCP (v25: 3 niveles + verificación)
- Tras todo despliegue en WordPress, ejecutar vía `novamira-mcp` EN ESTE ORDEN:
  1. `novamira/run-wp-cli` → `wp elementor flush-css`
  2. `novamira/run-wp-cli` → `wp cache flush`
  3. `novamira/execute-php` →
     ```php
     if (class_exists('\\Endurance_Page_Cache')) {
         \\Endurance_Page_Cache::purge_all();
     }
     return 'purged';
     ```
- Inmediatamente después, ejecutar la puerta **E4.5**: `scripts/purge_and_verify.py <URL> --marker 'alt="s2e-vN-<slug>"'` (ver R24).

### R15. 📱 Especificidad Mandatoria en Mobile Breakpoints (Anti-Overflow)
- Inyectar universalmente:
  ```css
  *, *::before, *::after { box-sizing: border-box !important; }
  html, body, .elementor, .brand-wrapper {
    overflow-x: hidden !important;
    max-width: 100% !important;
  }
  ```

### R16. 🛡️ Canvas Reset & Aislamiento de Wrappers
- Anular fondos blancos residuales de Elementor con `.elementor { background-color: transparent !important; }`.

### R17. ⚡ Flexbox Containers Mandatorios v4
- Usar `elType: "container"` con `"container_type": "flex"`. Prohibido usar secciones/columnas obsoletas.

### R18. 🎯 Mapeo de Widgets Atómicos Nativo-Editable
- Mapear a `heading`, `text-editor`, `image` y `button` con clases maestras para permitir edición en el panel de Elementor.

---

### 🚨 NUEVAS REGLAS v23 (R19 a R22)

### R19. 📐 Blindaje Dimensional de Logotipos & SVGs (Lección 32)
- **Problema**: Los archivos SVG vectoriales exportados directamente desde Illustrator contienen lienzos nativos gigantescos (ej. `1985 × 2066 px`). Si se insertan sin rasterizar o sin dimensiones absolutas fijas, el navegador los renderiza a tamaño natural ocupando toda la pantalla y rompiendo el layout.
- **Regla Obligatoria**:
  1. Exportar siempre una versión rasterizada nítida de alta densidad PNG/WebP (ej. `360 × 375 px`, 20 KB) con fondo transparente mediante Inkscape o Pillow.
  2. Forzar dimensiones máximas estrictas tanto en CSS como en estilos inline:
     ```html
     <img src="assets/images/logo.png" alt="Logo" class="logo-header-img" style="max-height: 38px !important; width: auto !important; max-width: 160px !important; object-fit: contain !important;" height="38">
     ```
  3. Prohibir el uso de `wattsaver-logo-official.svg` crudo en la etiqueta `<img>` del Header sin contenedor con tamaño rígido.

### R20. 🎨 Contraste Obligatorio & Fallbacks en Micro-degradados (Lección 34)
- **Problema**: Las clases utilitarias personalizadas de Tailwind (como `from-energy-a to-energy-b` o `bg-surface-alt`) pueden no compilarse si no están definidas explícitamente en el CDN o tema, dejando el fondo transparente con texto blanco invisible sobre fondo claro.
- **Regla Obligatoria**:
  1. En toda tarjeta con degradado o fondo oscuro, definir siempre un color de fondo sólido directo de respaldo:
     ```html
     <div class="bg-[#0F3D24] bg-gradient-to-br from-[#0F3D24] to-[#1A633B] border border-[#F59E0B]/50 ...">
     ```
  2. Emplear badges de alto contraste (dorado ámbar `#FBBF24` o esmeralda brillante `#4ADE80`) y textos secundarios claros (`#E2EFE7`) sobre fondos oscuros.
  3. En la Top Trust Bar, forzar `#4ADE80` para textos clave sobre fondo `#0A170F`.

### R21. ⚡ `loading="lazy"` PERMITIDO (Buena Práctica Web Real)
- `loading="lazy"` está PERMITIDO y recomendado como estándar de rendimiento web en tarjetas de catálogo y elementos below-the-fold.
- La garantía de renderizado no recae en eliminar `loading="lazy"` del código fuente, sino en el script de QA (`qa_assertions.js`), el cual realiza un `autoScroll` completo y espera `networkidle` antes de capturar el estado final.

### R22. 👁️ Protocolo de QA Visual Realista (Cero Falsos Positivos, Lección 33)
- **Problema**: Informar que un despliegue fue "exitoso" basándose únicamente en que el servidor devolvió código `HTTP 200` y `isOverflow: false` provoca falsos positivos graves (logos gigantes, textos invisibles o imágenes no renderizadas).
- **Protocolo de Verificación Obligatorio**:
  1. **Ejecución Remota en Proxmox CT252**: Todo test visual se corre contra `ws://192.168.1.252:3000/playwright`.
  2. **AutoScroll Obligatorio**: Antes de capturar el screenshot fullPage, el script DEBE realizar un desplazamiento suave completo (`window.scrollBy`) para activar todas las animaciones (`.rv.in`) y disparar la carga de todos los recursos asíncronos.
  3. **Inspección Visual Humana/Visión**: El agente TIENE PROHIBIDO emitir la certificación final sin antes visualizar la captura generada mediante herramientas de visualización (`view_file` sobre la captura PNG) y comprobar:
     - Logotipo visible y con tamaño proporcional en Header y Footer.
     - Contraste legible en todos los bloques de texto y tarjetas.
     - Carga efectiva de todas las imágenes de la cuadrícula Bento.
     - Cero barras de desplazamiento horizontal.

---

### 🚨 NUEVAS REGLAS v25 (R24 a R26)

### R24. 🔎 Verificación Post-Purga con Marcador ALT (Etapa E4.5, Lecciones 21/24)
- **Problema**: `flush-css` + `cache flush` no siempre alcanzan la caché del hosting (Endurance/Bluehost); la página publicada sigue sirviendo la versión vieja y el QA valida un fantasma.
- **Regla Obligatoria**:
  1. El deploy inyecta un marcador ALT único de versión en el logo/hero: `alt="s2e-v<N>-<slug>"`.
  2. Tras la purga de 3 niveles (R14), ejecutar `scripts/purge_and_verify.py <URL> --marker 'alt="s2e-v<N>-<slug>"' [--css-hash <hash>]`.
  3. exit 0 ⇒ continuar a E5; exit 1 ⇒ repetir purga multinivel y re-verificar (máx. 3 intentos; luego documentar el bloqueo en el journal).

### R25. 🛡️ Schema Probing Fresco en E2 (Anti-Deriva de Versión)
- El compilador EXIGE `elementor_target` en el IR (o `--elementor-target`) y lo valida contra la versión REAL registrada en `elementor_schema.json`.
- Si el schema lleva **>14 días** sin re-probeo (`probed_at`), la compilación se BLOQUEA (exit 2). Regenerar con `SCRIPTS/elementor_schema_probe.py` (Novamira MCP → `novamira/execute-php`); escape de emergencia: `--allow-stale-schema`.

### R26. ✏️ Editabilidad Total Track B (Linter E13, Lección 28)
- Todo widget `html` cuyo contenido sea reproducible con widgets nativos (`heading`, `text-editor`, `image`, `button`, `icon-list`) es RECHAZADO por el linter con sugerencia del widget equivalente.
- Escape documentado: `--allow-opaque-html` degrada a warning (solo para Track A genuino con divs/svg/nav/forms).
- El compilador ya emite listas como `text-editor` nativo; extender el mapeo IR→widget antes de recurrir a HTML opaco.

---

## 🚀 Protocolo de Google Colab Pro GPU Offloading

Para tareas que requieran alto poder de cómputo (procesamiento de lotes de imágenes, generación masiva, pipelines de machine learning o tensores pesados):
1. **Cuenta Google Pro Asignada**: `eliutec.aux.ia1@gmail.com` (acceso a GPUs T4 / A100 y TPU).
2. **Entorno**: Conexión remota mediante la extensión oficial `Google.colab` en VS Code / Antigravity.
3. **Flujo de Trabajo**: El código fuente se mantiene versionado en el workspace local (`.ipynb` o `.py`), mientras que la ejecución pesada se delega 100% al hardware acelerado en la nube de Google, preservando intacta la memoria RAM y CPU de la laptop local HP15.

---

## ✅ Checklist de Aceptación Final v25 (Ambos Modos)

- [ ] **Modo elegido conscientemente antes de construir (E / S)**
- [ ] **(Modo E) Novamira MCP utilizado como SSOT para purga y sincronización (R14)**
- [ ] **(Modo E) Flexbox Containers (`elType: "container"`) utilizados en lugar de secciones obsoletas (R17)**
- [ ] **(Modo E) Widgets Nativos aplicados para componentes editables en Modo B (R18)**
- [ ] **(Modo E) Transporte Out-of-Band R23 aplicado (Base64 R12 solo como fallback)**
- [ ] **(Modo E) Schema fresco: `elementor_schema.json` con probe de ≤14 días (R25)**
- [ ] **(Modo E) Purga multinivel 3 niveles ejecutada (flush-css → cache flush → Endurance purge) (R14)**
- [ ] **(Modo E) Puerta E4.5 PASS: `purge_and_verify.py` verificó el marcador ALT (R24)**
- [ ] **(Modo E) Linter E13 PASS: cero widgets HTML opacos reproducibles (R26)**
- [ ] **Logotipos con dimensiones estrictas y versión rasterizada nítida PNG/WebP (R19)**
- [ ] **Contraste verificado con estilos sólidos de respaldo en tarjetas y barras (R20)**
- [ ] **Bento cards principales renderizadas tras autoScroll del QA (R21)**
- [ ] **Activos WebP optimizados con Pillow LANCZOS (Heroes <130 KB, Cards <90 KB) (R8)**
- [ ] **QA Visual Playwright en Proxmox CT252 ejecutado con autoScroll e inspección de captura (R22)**
- [ ] **Cero credenciales en archivos versionados o subidos**

---

## 📝 Changelog

### v25.0.0 (2026-08-19)
- **R24 / Etapa E4.5 — Purga Multinivel Verificada**: nuevo script `scripts/purge_and_verify.py` (stdlib) que verifica por HTTP el marcador ALT único de despliegue tras la purga de 3 niveles (`wp elementor flush-css` → `wp cache flush` → `Endurance_Page_Cache::purge_all()` vía Novamira MCP). Elimina los falsos PASS por caché fantasma del hosting (Lecciones 21/24).
- **R25 — Schema Probing Fresco en E2**: `compile_ir_to_elementor.py` bloquea si `elementor_schema.json` lleva >14 días sin re-probeo (`probed_at`); `SCRIPTS/elementor_schema_probe.py` ahora estampa timestamp. Nuevas banderas `--elementor-target` y `--allow-stale-schema`.
- **R26 — Editabilidad Total Track B (Linter E13)**: `lint_elementor_json.py` rechaza widgets HTML opacos reproducibles con widgets nativos y sugiere el equivalente; bandera de escape `--allow-opaque-html`. El compilador emite listas como `text-editor` nativo (Lección 28).

### v23.0.0 (2026-08-18)
- **Consagración de Novamira MCP como SSOT**: Adopción formal de `novamira-mcp` (WP-CLI + REST) como el estándar #1 de gestión en WordPress y deprecación definitiva de los MCPs legacy de Elementor.
- **R19 Blindaje Dimensional de Logotipos & SVGs**: Regla contra SVGs con lienzos nativos gigantes; forzado de dimensiones inline y uso de PNG/WebP de alta densidad (360×375).
- **R20 Contraste Forzado & Fallbacks en Degradados**: Definición de fondos sólidos directos de respaldo y badges de alto contraste para evitar textos invisibles por clases no compiladas.
- **R21 Carga Inmediata en Bento Cards**: Erradicación de `loading="lazy"` en tarjetas de portada para evitar recuadros en blanco.
- **R22 Protocolo de QA Visual Realista**: Prohibición de dar "PASS" solo por HTTP 200; autoScroll mandatorio e inspección visual de capturas en Proxmox CT252.
- **Google Colab Pro GPU Offloading**: Integración formal del protocolo de aceleración en la nube para procesamiento pesado.

### v22.0.0 (2026-08-18)
- **Flexbox Containers Mandatorios (R17)**: Migración obligatoria a `elType: "container"` eliminando secciones/columnas legacy (`elType: "section"`/`elType: "column"`).
- **Mapeo de Widgets Atómicos Nativo-Editable (R18)**: Descomposición semántica en widgets `heading`, `text-editor`, `image` y `button` con clases maestras para 100% de editabilidad visual en Elementor.

### v21.0.0 (2026-08-17)
- **Transporte Base64 (R12)**: Eliminado el riesgo de *Escaping Hell* en RPC/PHP empaquetando HTML/JSON en Base64.
- **Desacoplamiento CSS Maestro (R13)**: Hojas de estilo centralizadas en `/uploads/` en lugar de inflar la base de datos con CSS inline repetido.
- **Purga de Caché Multinivel (R14)**: Procedimiento exhaustivo para eliminar `_elementor_css`, `files_manager->clear_cache()`, `wp_cache_flush()` y `post_content`.
- **Especificidad Móvil Mandatoria (R15)**: Reglas inmutables con `!important` que garantizan 0% de desbordamiento horizontal en 375px.
