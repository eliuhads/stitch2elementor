---
name: stitch2elementor
description: >
  Pipeline de doble modo (Elementor Canvas / Static HTML) para extracción, diseño y despliegue desde Google Stitch
  hacia WordPress Elementor Canvas (Novamira MCP como SSOT) o sitios estáticos multi-página autocontenidos (build Python + FTPS).
  v23: Consagración de Novamira MCP (WP-CLI + REST) como SSOT primario, Deprecación de MCPs legacy, Guardrails R0-R22
  (Blindaje dimensional de logos/SVGs, Contraste forzado en degradados, Carga inmediata en Bento Cards, Protocolo de QA
  Visual Realista contra falsos positivos con autoScroll en Proxmox CT252), Flexbox Containers v4 y Google Colab Pro GPU Offloading.
---

# Skill: stitch2elementor (v23.0.0 — Atomic Flexbox & Deterministic Hybrid Pipeline)

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
                                      re-hash de IDs (unicidad por construcción)
                              │
                              ▼
                      [E3 LINT]       scripts/lint_elementor_json.py  →  PUERTA OBLIGATORIA
                                      E1 parse · E2 IDs únicos · E3 elType/widgetType · E4 boxed
                                      · E5 responsive · E6 logo R4/R19 · E7 integridad elements
                                      exit≠0 ⇒ PROHIBIDO desplegar
                              │
                              ▼
                      [E4 DEPLOY+QA]  LLM orquesta con Base64 Transport (R12) · Novamira MCP SSOT
                                      · CSS maestro desacoplado (R13) · Purga multinivel Novamira (R14) ·
                                      Playwright autoScroll CT252 + Inspección Visual Humana (R22)
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

### R12. 📦 Transporte Base64 Obligatorio (Anti-Escaping Hell)
- Enviar cargas útiles codificadas en Base64 para evitar corrupción de comillas o caracteres especiales.

### R13. ⚡ Desacoplamiento de CSS Maestro
- Compilar estilos globales en un archivo central (`styles.css`) en `/uploads/` enlazado con parámetro de versión `?v=hash`.

### R14. 🧹 Purga de Caché Multinivel con Novamira MCP
- Tras todo despliegue en WordPress, ejecutar vía `novamira-mcp`:
  1. `wp elementor flush-css`
  2. `wp cache flush`

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

### R21. ⚡ Erradicación de `loading="lazy"` en Bento Cards Críticas (Lección 33)
- **Problema**: Las imágenes con `loading="lazy"` ubicadas en tarjetas de catálogo o bento grids debajo del pliegue pueden no cargarse a tiempo durante capturas de pantalla de Playwright o en conexiones lentas, mostrando recuadros en blanco.
- **Regla Obligatoria**:
  - En las tarjetas principales de productos y servicios de la portada, utilizar carga inmediata:
    ```html
    <img src="assets/images/card-deteccion.webp" alt="..." class="w-full aspect-[4/3] object-cover" decoding="async">
    ```
  - Reservar `loading="lazy"` exclusivamente para footers o galerías secundarias profundas.

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

## 🚀 Protocolo de Google Colab Pro GPU Offloading

Para tareas que requieran alto poder de cómputo (procesamiento de lotes de imágenes, generación masiva, pipelines de machine learning o tensores pesados):
1. **Cuenta Google Pro Asignada**: `eliutec.aux.ia1@gmail.com` (acceso a GPUs T4 / A100 y TPU).
2. **Entorno**: Conexión remota mediante la extensión oficial `Google.colab` en VS Code / Antigravity.
3. **Flujo de Trabajo**: El código fuente se mantiene versionado en el workspace local (`.ipynb` o `.py`), mientras que la ejecución pesada se delega 100% al hardware acelerado en la nube de Google, preservando intacta la memoria RAM y CPU de la laptop local HP15.

---

## ✅ Checklist de Aceptación Final v23 (Ambos Modos)

- [ ] **Modo elegido conscientemente antes de construir (E / S)**
- [ ] **(Modo E) Novamira MCP utilizado como SSOT para purga y sincronización (R14)**
- [ ] **(Modo E) Flexbox Containers (`elType: "container"`) utilizados en lugar de secciones obsoletas (R17)**
- [ ] **(Modo E) Widgets Nativos aplicados para componentes editables en Modo B (R18)**
- [ ] **(Modo E) Transporte en Base64 aplicado en scripts de inyección (R12)**
- [ ] **(Modo E) Purga multinivel Novamira (`wp elementor flush-css` y `wp cache flush`) ejecutada (R14)**
- [ ] **Logotipos con dimensiones estrictas y versión rasterizada nítida PNG/WebP (R19)**
- [ ] **Contraste verificado con estilos sólidos de respaldo en tarjetas y barras (R20)**
- [ ] **Bento cards principales sin `loading="lazy"` para render instantáneo (R21)**
- [ ] **Activos WebP optimizados con Pillow LANCZOS (Heroes <130 KB, Cards <90 KB) (R8)**
- [ ] **QA Visual Playwright en Proxmox CT252 ejecutado con autoScroll e inspección de captura (R22)**
- [ ] **Cero credenciales en archivos versionados o subidos**

---

## 📝 Changelog

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
