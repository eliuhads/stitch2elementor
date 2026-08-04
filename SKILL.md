---
name: stitch2elementor
description: >
  Pipeline técnico de conversión y extracción (Stitch ↔ HTML ↔ Elementor Canvas) powered by Novamira MCP.
  Incluye menú interactivo dinámico de 8 opciones, encadenamiento cruzado con skills de diseño visual
  (design-taste-frontend, gpt-taste, high-end-visual-design, brandkit, minimalist-ui), consulta obligatoria a NotebookLM MCP
  y declaración formal de dependencias.
---

# Skill: stitch2elementor (v5.0.0 — Pipeline Técnico Stitch ↔ HTML ↔ Elementor Canvas)

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

## 🛠️ Scripts Principales del Repositorio (`scripts/`)

- `compiler_v4.js`: Transpilador HTML + Tailwind → Elementor Flexbox JSON.
- `sync_and_inject.js`: Orquestador FTP+HTTP para inyección segura bypassing WAF.
- `replace_stitch_images.js`: Mapeo de URLs Stitch a IDs de la Media Library de WordPress.
- `purge_wp_cache.mjs`: Limpieza completa de caché `_elementor_css`, transients y LiteSpeed.
