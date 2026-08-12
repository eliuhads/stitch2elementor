---
name: stitch2elementor
description: >
  Pipeline técnico de conversión y extracción (Stitch ↔ HTML ↔ Elementor Canvas) powered by Novamira MCP.
  Incluye menú interactivo dinámico de 8 opciones, encadenamiento cruzado con skills de diseño visual
  (design-taste-frontend, gpt-taste, high-end-visual-design, brandkit, minimalist-ui), consulta obligatoria a NotebookLM MCP
  y declaración formal de dependencias.
---

# Skill: stitch2elementor (v18.0.0 — Pipeline Técnico Stitch ↔ HTML ↔ Elementor Canvas)

Esta habilidad se enfoca **exclusivamente en la conversión y extracción técnica** entre **Google Stitch**, **HTML + Tailwind CSS** y **WordPress Elementor Canvas** manteniendo 100% de fidelidad estética y responsiva mediante inyección directa (Novamira MCP / FTP+PHP).

---

## 📋 Declaración Formal de Dependencias (Skills & MCPs)

### MCPs Requeridos y Recomendados
- **`#wp-elementor-mcp` / `novamira-mcp`** *(Requerido)*: Inyección directa REST API / PHP execution de estructuras Elementor JSON.
- **`stitch`** *(Requerido)*: Extracción de pantallas, generación de componentes y consulta de proyectos en Google Stitch.
- **`notebooklm-mcp`** *(Requerido)*: Consulta previa a cuadernos de conocimiento sobre WordPress, Elementor, CSS y optimizaciones.
- **`obsidian-mcp`** *(Recomendado)*: Registro de decisiones de maquetación y lectura de guías en el Memory Bank.

### Skills Complementarios Requeridos y Recomendados
- **`google-labs-code/stitch-skills`** (`generate-design`, `upload-to-stitch`, `extract-static-html`) *(Requeridos)*.
- **`design-taste-frontend`** *(Requerido)*: Aplicación de principios anti-slop y jerarquía estética antes de maquetar.
- **`gpt-taste`** / **`high-end-visual-design`** *(Recomendados)*: Motion avanzado GSAP, tipografía editorial y layouts asimétricos.
- **`brandkit`** / **`minimalist-ui`** *(Recomendados)*: Paletas de colores curadas, sistemas tipográficos y micro-interacciones.

---

## ⚡ Reglas de Oro Inmutables & Integración Cruzada

1. **Regla de Integración Cruzada de Skills Visuales**:
   - Antes de maquetar o modificar cualquier componente, el agente **DEBE activar y consultar** los skills de diseño visual (`design-taste-frontend`, `gpt-taste`, `high-end-visual-design`, `brandkit`, `minimalist-ui`).
   - Queda estrictamente prohibido generar interfaces con estética genérica o "plana".

2. **Regla de Consulta Obligatoria a NotebookLM MCP**:
   - El agente **DEBE realizar una consulta previa** a **NotebookLM MCP** (`notebook_query`, `notebook_list`, `source_get_content`) sobre WordPress, Elementor Canvas, CSS y mejores prácticas antes de inventar estructuras HTML o JSON de Elementor.

3. **Manejo Anti-Fallos de Google Stitch MCP**:
   - **Refresco de Token ADC**: Si ocurren disconexiones o timeouts, ejecutar `gcloud auth application-default print-access-token`.
   - **No duplicar Tokens en Prompts**: Delegar la paleta de colores y fuentes al `designTheme` del proyecto en Stitch. No repetir tokens en prompts individuales para evitar errores `Invalid Argument`.
   - **Payload Extenso Base64**: Para fragmentos HTML o `DESIGN.md` grandes, usar fragmentación o scripts de soporte (`upload-to-stitch`).

4. **Inyección en Elementor Canvas Puro**:
   - Configuración meta obligatoria:
     - `_wp_page_template = 'elementor_canvas'`
     - `_elementor_edit_mode = 'builder'`
     - `_elementor_template_type = 'wp-page'`
     - `_elementor_data = wp_slash($json_payload)` (Array plano `[{...}]`, nunca wrapper objeto).

5. **Proporciones Estándar de Interfaz**:
   - **Navbar Fijo**: Altura exacta de `64px` (`h-16`), fondo `#0D0D1A`/95 con `backdrop-blur-xl`.
   - **Logo Corporativo**: Altura responsiva sutil de `28px` a `32px` (`h-7 md:h-8 w-auto object-contain`).
   - **Padding de `<main>`**: `pt-16` para evitar solapamientos.

---

## 🎛️ Menú Interactivo Dinámico (8 Opciones)

Al activar la skill o recibir solicitudes de conversión, el agente desplegará el siguiente menú interactivo para guiar al usuario:

```
========================================================================
           ⚡ STITCH2ELEMENTOR v5.0 — MENÚ INTERACTIVO DE OPENCANVAS ⚡
========================================================================
[1] 📥 Ingresar data (Carpeta Brandbook creada por floydia_web_brand)
[2] 🔍 Análisis de data proporcionada (Auditoría de insumos y sugerencias)
[3] 📄 Convertir UNA página Stitch → Elementor Canvas
[4] 🌐 Convertir TODAS las páginas Stitch → Elementor Canvas
[5] 🎨 Crear web en Stitch (Modo 1 a 1 con confirmación o Lote completo)
[6] 📦 Extraer Stitch a carpeta en HTML (Modo 1 a 1 o Lote completo)
[7] ✏️ Modificar pantalla existente en Stitch
[8] ⚙️ Personalizado / Opción libre del usuario
========================================================================
```

---

## 🚀 Detalle de Flujos del Menú

### Opción [1] — Ingresar Data Brandbook
- Lee los insumos creados previamente por el skill `floydia_web_brand` (`brandbook_v2.md`, `sitemap_seo.md`, `copys_por_pagina.md`).
- Valida la disponibilidad de tokens visuales y arquitectura requerida.

### Opción [2] — Análisis de Data & Auditoría
- Evalúa la completitud de los datos (imágenes WebP, paleta HSL, tipografías Google Fonts, estructura de URLs).
- Genera un informe de brechas antes de iniciar la conversión.

### Opción [3] & [4] — Conversión a Elementor Canvas (Individual / Masiva)
- Extrae el HTML + Tailwind de la pantalla en Stitch (`fetch_screen_code`).
- Realiza el parseo y empaquetado a JSON de Elementor (`compiler_v4.js`).
- Inyecta vía Novamira MCP / FTP+PHP con doble capa de invalidación de caché (`_elementor_data` + `post_content`).

### Opción [5] — Crear Web en Stitch (1 a 1 o Lote)
- Permite seleccionar generación paso a paso con vista previa y confirmación previa del usuario, o generación en lote.
- Aplica el `designTheme` configurado.

### Opción [6] — Extraer Stitch a HTML Local
- Exporta pantallas de Stitch a archivos HTML planos en el workspace local (`extract-static-html`).

### Opción [7] — Modificar Pantalla Existente en Stitch
- Envía prompts de refinamiento a pantallas existentes en Stitch utilizando `generate-design` o `edit_screens`.

### Opción [8] — Libre / Personalizado
- Permite cualquier combinación de comandos, scripts o consultas a medida del usuario.

---

## 🏗️ Header/Footer Native Template Handling (v5.0.0+)

### Logo Preservation
- El compiler usa el widget `image` de Elementor con la URL del logo desde `design_system.json` (`logoUrl`).
- Si no hay URL configurada, se genera un heading con `logoText` como fallback.
- Tamaños responsivos: `160px` desktop → `140px` tablet → `120px` mobile con `object-fit: contain`.

### Header Template
- Fuente primaria: `header-global.html` en `assets_originales/`. Fallback: `homepage.html`.
- Colores dinámicos del `design_system.json` (no hardcoded).
- Output: `header.json` listo para inyección como `elementor_library` type `header`.

### Footer Template
- Fuente primaria: `footer-global.html` en `assets_originales/`. Fallback: `homepage.html`.
- Output: `footer.json` listo para inyección como `elementor_library` type `footer`.

### Inyección como Theme Builder Templates
- Vía Novamira MCP: `elementor/create-template` con sub-type `"header"` / `"footer"`.
- Asignar display conditions con `elementor/update-theme-builder-conditions` para "Entire Site".
- Post-inyección: ejecutar `elementor/clear-cache` para regenerar CSS.
- **Obligatorio**: inicializar `_elementor_version` meta en todas las creaciones programáticas.

### Meta Structure Requerida
```
post_type: elementor_library
_elementor_edit_mode: builder
_elementor_template_type: header | footer
_elementor_data: [JSON payload]
_elementor_version: (current Elementor version)
```

---

## 🛠️ Scripts Principales del Repositorio (`scripts/`)

- `compiler_v4.js`: Transpilador HTML + Tailwind → Elementor Flexbox JSON. Incluye logo preservation, responsive breakpoints, y header/footer separation.
- `sync_and_inject.js`: Orquestador FTP+HTTP para inyección segura bypassing WAF.
- `create_hf_native.php`: Crea Header/Footer como `elementor_library` CPT con condiciones globales.
- `fix_material_symbols.js`: Purga texto fantasma de Material Symbols CSS fallbacks.
- `fix_slugs.js`: Normaliza slugs de páginas post-inyección según `page_manifest.json`.
- `purge_wp_cache.mjs`: Limpieza completa de caché `_elementor_css`, transients y LiteSpeed.

---

## 🧱 Reglas Anti-Error v18.0.0 (Aprendidas en producción — 2026-08-11)

> Cada regla previene un fallo real medido en producción. **No omitir ninguna.**

### R1. FTP Bluehost — PROBE antes de subir
- El cwd `/` de la sesión FTPS **ya es el docroot público** en la mayoría de cuentas Bluehost.
- Subir a rutas absolutas estilo `/home2/{user}/public_html/{subcarpeta}/` puede terminar en 404 aunque `LIST` muestre los archivos, porque el vhost de Apache no apunta ahí.
- **Protocolo obligatorio**:
  1. Subir `probe.html` trivial a la raíz del FTP.
  2. `curl -s -o /dev/null -w "%{http_code}" https://{dominio}/probe.html` debe ser `200`.
  3. Sólo entonces subir el contenido real a `/{subcarpeta}/` **relativo a la raíz del FTP**.
  4. Borrar el probe al terminar.
- Si el dominio está detrás de proxy (Cloudflare), usar el hostname directo del servidor para FTP y considerar el caché del proxy en las pruebas.

### R2. Separar fuentes del output generado
- Estructura obligatoria del proyecto:
  ```
  PROYECTO/
  ├── src/    ← tokens.css, build.*, pages.*, assets/ (FUENTES — nunca borrar)
  ├── site/   ← SOLO artefactos generados (seguro de borrar/regenerar)
  └── deploy.*
  ```
- **Nunca** guardar en `site/` (o carpeta de output) nada que no se regenere con un solo comando. Un `rm -rf` del output no puede destruir fuentes.

### R3. Editar fuentes, nunca artefactos
- Los HTML/CSS generados son **regenerables**. Cualquier corrección va a la fuente.
- Editar un artefacto generado = corrupción garantizada en la siguiente build.

### R4. Dimensiones visuales INMUTABLES (anti-sobredimensionamiento)
| Elemento | Regla |
|---|---|
| Logo en header | `height: 40px` (aceptable 36–45px; **>52px = defecto visual**) |
| Íconos sociales | caja 28px / SVG interno 15px; cada red con **su** color de marca |
| Botón WhatsApp flotante/CTA | círculo 38–44px, SOLO ícono SVG (18–22px), **sin texto** |

- **Validación automática post-deploy** (Playwright):
```js
const h = await page.evalOnSelector('.logo-img', el => el.getBoundingClientRect().height);
if (h > 45) throw new Error(`Logo sobredimensionado: ${h}px`);
```

### R5. SEO Pack obligatorio POR PÁGINA en el primer build
Cada página generada incluye, sin excepción:
- `<title>` ≤ 60 caracteres.
- `<meta name="description">` de 150–160 caracteres.
- `<meta name="keywords">` alineadas a la keyword primaria/secundarias del copy fuente.
- `<link rel="canonical">` absoluto.
- `<script type="application/ld+json">` (Organization / FAQPage / Service según el tipo de página).
- **Coherencia**: la keyword primaria del meta debe aparecer en el H1 de la página.

### R6. Diseño a partir del Brandbook del cliente, no por defecto
- Contenedor `1240px` centrado (salvo que el brandbook diga otro valor).
- Hero 2 columnas side-by-side en desktop (aprox. 54% texto / 42% media), apilado en mobile.
- Fondos claros ≥ 85% del viewport salvo especificación contraria; oscuro reservado a hero/footer.
- **Tipografía**: usar las familias del brandbook del cliente. No sustituir por fuentes genéricas sin justificación documentada.
- CTAs duales cuando el brief lo exija (p.ej. canal B2B + canal B2C).

### R7. Lotes atómicos, cero iteraciones sueltas
Pipeline indivisible por cambio:
```
editar src → regenerar site/ → validar local (parse+links) → deploy →
curl HTTP 200 en todas las URLs → capturas dual-viewport → revisión ocular
```
- Si algo falla: corregir en `src/` y repetir el pipeline **completo**.
- Los parches uno-a-uno sobre artefactos vivos están prohibidos.

## ✅ Checklist de Aceptación (obligatorio antes de dar por terminado)
- [ ] Probe FTP respondió 200 antes del primer upload real.
- [ ] Todas las páginas devuelven HTTP 200 tras el deploy.
- [ ] El sitio raíz/original del cliente responde 200 e intacto (si aplica).
- [ ] Logo ≤ 45px de alto medido en DOM; íconos sociales 28px; WhatsApp ícono-solo.
- [ ] SEO pack presente en cada página y coherente con su H1.
- [ ] Cero credenciales/secretos en archivos versionados o subidos (usar variables de entorno).
- [ ] Capturas desktop (1440px) y mobile (375px) revisadas visualmente.
- [ ] `lessons-learned` del workspace actualizado con cualquier error nuevo descubierto.

