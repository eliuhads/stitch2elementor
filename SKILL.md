---
name: stitch2elementor
description: Conversión pixel-perfect de diseños Google Stitch a WordPress Elementor powered by Novamira MCP. Inyección de HTML+Tailwind puro en contenedores Elementor Canvas con MU-Plugin de assets globales, proporciones compactas (Header 64px, Logo 28-32px) y mapeo semántico de imágenes WebP. Triggers: go! (full-site), segment! (componente aislado), clean! (limpieza), maintain! (config-only).
---

# Skill: Stitch → Elementor Canvas (v3.1.0 Novamira MCP Powered)

Esta habilidad permite convertir sitios completos o pantallas individuales de **Google Stitch** (HTML + Tailwind CSS) a **WordPress + Elementor** conservando 100% de paridad estética y responsiva mediante inyección directa en base de datos usando **Novamira MCP**.

---

## ⚡ Reglas de Oro Inmutables (v3.1.0)

1. **Vía Primaria Obligatoria — Novamira MCP**:
   - Toda inyección o modificación se debe realizar mediante las habilidades de Novamira MCP (`novamira/execute-php` y `novamira/write-file`).
   - Queda prohibido usar la interfaz web manual de Elementor o métodos que generen JSONs anidados corruptos.

2. **Proporciones Estándar de Interfaz**:
   - **Navbar Fijo**: Altura exacta de `64px` (`h-16`), fondo `#0D0D1A`/95 con `backdrop-blur-xl`.
   - **Logo Corporativo**: Altura responsiva sutil de `28px` a `32px` (`h-7 md:h-8 w-auto object-contain`).
   - **Padding del `<main>`**: `pt-16` para evitar que el navbar tape el título del Hero.
   - **Botón CTA WhatsApp**: Diseño compacto esmeralda (`#25D366`), ícono SVG oficial y texto `11px` mayúsculas.

3. **Mapeo Obligatorio de Imágenes WebP**:
   - **Prohibido** dejar URLs dinámicas de Google Cloud (`lh3.googleusercontent.com`).
   - Sustituir todas las imágenes por archivos `.webp` locales/servidor mapeados en `catalogo_assets_webp.md`.

4. **Inyección en Elementor Canvas Puro**:
   - Cada página debe configurarse como `_wp_page_template = 'elementor_canvas'`.
   - El payload contiene un único contenedor de ancho completo (`content_width: full`, padding 0, margin 0) con un widget `html` que alberga el código responsivo.

5. **MU-Plugin de Assets Globales**:
   - Inyectar en `/wp-content/mu-plugins/evergreen_stitch_assets.php` para cargar Tailwind CDN, paleta de colores de marca, Google Fonts (*Montserrat*, *Lato*) y *Material Symbols Outlined*.

---

## 🚀 Flujo de Trabajo

### 1. Ingesta desde Google Stitch
```js
// Usar MCP tool stitch (list_screens / fetch_screen_code) para exportar el HTML puro
```

### 2. Ensamblado de Header & Footer Master
- Inyectar el Header estilizado (64px) con enlaces al árbol completo de páginas (`/nosotros/`, `/catalogo/`, etc.).

### 3. Empaquetado Batch e Inyección vía Novamira MCP
```php
update_post_meta($page_id, '_elementor_edit_mode', 'builder');
update_post_meta($page_id, '_elementor_template_type', 'wp-page');
update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');
update_post_meta($page_id, '_elementor_data', wp_slash($json_payload));
```

### 4. Saneamiento y Validación Responsiva
- Eliminar de forma inmediata cualquier script PHP/JS temporal del servidor tras completar el despliegue.
- Validar con `curl` la presencia de HTTP 200 OK y clases responsivas.
