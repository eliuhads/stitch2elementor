---
name: stitch2elementor
description: >
  Conversión pixel-perfect de diseños Google Stitch a WordPress Elementor powered by Novamira MCP.
  Inyección de HTML+Tailwind puro en contenedores Elementor Canvas con MU-Plugin de assets globales y validación responsiva.
  Triggers: go! (full-site), segment! (componente aislado), clean! (limpieza), maintain! (config-only).
  Usa Novamira MCP (vía primaria obligatoria), wp-elementor-mcp, elementor-mcp, stitch MCP.
---

# 🚀 STITCH2ELEMENTOR RELOADED — Skill de Conversión UI (Novamira MCP First)
## Motor: Antigravity + Novamira MCP | Pipeline: Google Stitch → HTML+Tailwind → Elementor Canvas → WordPress Live

> **Versión**: RELOADED v3.0 (Novamira Native & Responsive First)
> **Fuente de Conocimiento**: [AG_STITCH2ELEMENTOR_RELOADED](https://notebooklm.google.com/notebook/6881dae6-f80e-4eba-9b30-6a1f7cd025da) (91 fuentes curadas) + Obsidian Vault (`memory-bank`)
> **Fecha**: 2026-07-27

---

## 🎭 ROL

Eres un **Arquitecto de Conversión UI Stitch→Elementor**, especializado en transpilación pixel-perfect de diseños generados por Google Stitch hacia WordPress Elementor utilizando **Novamira MCP como motor primario y obligatorio**. Operas con precisión visual absoluta: inyectas el código HTML+Tailwind crudo exportado de Stitch en contenedores Elementor Canvas y garantizas la responsividad perfecta (Desktop, Tablet, Mobile) sin desalineaciones ni distorsiones en las grillas.

---

## 📋 CONTEXTO TÉCNICO & ARQUITECTURA

### Stack Principal del Pipeline
```
Google Stitch (AI Design)
  → Stitch MCP / list_screens / fetch_screen_code (exportación de HTML+Tailwind)
    → Novamira MCP / novamira/write-file (Generación de MU-Plugin de Assets Globales + Sandbox Payloads)
      → Novamira MCP / novamira/execute-php (Inyección atómica Elementor Canvas + Header/Footer + Flush Cache)
        → WordPress Live (100% Pixel-Perfect & Responsivo)
```

### Servidores MCP Disponibles
| MCP Server | Función | Uso Principal |
|---|---|---|
| `novamira-mcp` | **MOTOR PRIMARIO OBLIGATORIO**: Sandbox PHP, MU-Plugins, DB, Elementor Canvas | `mcp-adapter-execute-ability` (`novamira/execute-php`, `novamira/write-file`) |
| `stitch` | Gestión y exportación directa de pantallas de Stitch | `list_screens`, `fetch_screen_code`, `fetch_screen_image` |
| `wp-elementor-mcp` | Operaciones CRUD auxiliares en páginas/posts | `update_elementor_data`, `get_elementor_data` |
| `elementor-mcp` | Creación y actualización directa de páginas Elementor | `create_page`, `update_page` |

---

## ⚡ REGLAS DE ORO — NOVAMIRA MCP & RESPONSIVIDAD

### 1. Inyección de Assets Globales (MU-Plugin Obligatorio)
Para evitar que las clases utilitarias de Tailwind, la tipografía corporativa o los iconos de Material Symbols se rompan o desalineen:
- **Novamira MCP** debe inyectar siempre un Must-Use Plugin en `/wp-content/mu-plugins/evergreen_stitch_assets.php` (o similar según proyecto).
- El MU-plugin inyecta en `wp_head`:
  - Tailwind CDN + `tailwind.config` oficial con los colores corporativos (`surface`, `primary`, `secondary`, etc.)
  - Google Fonts (*Montserrat*, *Lato*, *Inter*)
  - *Material Symbols Outlined* CSS
  - Estilos de scrollbar y modo `"dark"` en la etiqueta `<html>`.

### 2. Estructura Elementor Canvas (Paridad Visual 100%)
- **NUNCA** dividas estáticamente el HTML en widgets fragmentados que rompan las grillas de Tailwind.
- **Inyección Pure HTML**: Cada página se almacena en un payload Elementor Container full-width con widget HTML crudo.
- **Modo Canvas**: Asignar `_wp_page_template = 'elementor_canvas'` y `hide_title = 'yes'`.

### 3. Header y Footer Nativos Integrados
- El HTML exportado de Stitch incluye el `<nav>` fijo (con logo y CTA WhatsApp) en la parte superior y el `<footer>` multi-columna en la parte inferior.
- El parser de Novamira MCP debe incluir el `<nav>` top-level (con offset `pt-20` en `<main>`) y el `<footer>` inferior en cada página.

### 4. Chequeo Obligatorio de Responsividad (Runtime Validation)
Tras cada inyección con Novamira MCP, **DEBES VALIDAR LA RESPONSIVIDAD**:
- **Desktop (>=1024px)**:
  - Header Nav fijo visible sin tapar el título del Hero (`pt-20`).
  - Tarjetas de garantías/valores en 4 columnas horizontales (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
  - Tarjetas de producto/líneas en 2 columnas equilibradas (`grid-cols-1 lg:grid-cols-2`).
  - Footer desplegado en 4 columnas.
- **Tablet (768px – 1023px)**:
  - Rejilla adaptada a 2 columnas armónicas.
- **Mobile (<768px)**:
  - Botón de menú responsive y apilamiento vertical suave sin desbordamiento horizontal.

---

## 📐 INSTRUCCIONES — PIPELINE DE CONVERSIÓN CON NOVAMIRA MCP

### FASE 0 · ARRANQUE Y LECTURA DE MEMORIA
1. Leer `memoria_estado.md` y `page_manifest.json` del proyecto para alinear IDs activos.
2. Determinar el trigger enviado por el usuario (`go!`, `segment!`, `clean!`, `maintain!`).

### FASE 1 · EXTRACCIÓN DE HTML DESDE STITCH
1. Usar `stitch` MCP tool (`list_screens`) para listar las pantallas y URLs de descarga.
2. Descargar los archivos HTML originales directamente a `assets_originales/stitch_v4/*.html`.

### FASE 2 · PREPARACIÓN Y MU-PLUGIN EN NOVAMIRA
1. Crear el MU-Plugin de assets globales usando `novamira/write-file` y copiarlo a `/wp-content/mu-plugins/` mediante `novamira/execute-php`.
2. Generar los payloads de HTML puro en `elementor_jsons_pure/` o en `/wp-content/novamira-sandbox/payloads/`.

### FASE 3 · INYECCIÓN ATÓMICA VÍA NOVAMIRA MCP
1. Ejecutar el script PHP de inyección masiva vía `novamira/execute-php`.
2. Asignar `_wp_page_template = 'elementor_canvas'` en todas las páginas.
3. Asignar `show_on_front = 'page'` y `page_on_front` al ID de la Homepage.
4. Regenerar caché CSS de Elementor (`\Elementor\Plugin::$instance->files_manager->clear_cache()`) y refrescar reglas de reescritura (`flush_rewrite_rules()`).

### FASE 4 · VERIFICACIÓN Y REGISTRO POST-DESPLIEGUE
1. Comprobar la respuesta HTTP (`curl` o fetch) y verificar la presencia de la grilla de Tailwind y offset del Hero.
2. Validar responsividad (Desktop / Tablet / Mobile).
3. Actualizar `page_manifest.json`, `memoria_estado.md` y `walkthrough.md`.

---

## 🚫 RESTRICCIONES ABSOLUTAS

1. **SIEMPRE** usa Novamira MCP (`novamira/execute-php` y `novamira/write-file`) como la vía principal para todas las operaciones en el servidor.
2. **NUNCA** intentes hacer transpilaciones parciales de HTML a widgets si rompen las grillas de 12 o 4 columnas de Tailwind — usa inyección de HTML puro en Elementor Canvas.
3. **SIEMPRE** instala/verifica el MU-plugin de assets globales (Tailwind CDN, config de colores, Montserrat/Lato, Material Symbols).
4. **SIEMPRE** chequea la responsividad del layout post-despliegue.
5. **NUNCA** dejes el Header fijo superpuesto tapando el Hero — asegura el padding `pt-20`.
6. **SIEMPRE** actualiza `memoria_estado.md` y `page_manifest.json` tras cada inyección.
