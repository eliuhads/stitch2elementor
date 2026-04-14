# 🔌 stitch2elementor

**Migrate Google Stitch AI designs to WordPress Elementor — 100% free, no premium plugins.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-blueviolet)](https://github.com/google-deepmind/antigravity)

Automatiza completamente el pipeline desde un diseño de **Google Stitch** extraído en HTML hacia un formato compatible listado como Array nativo de **WordPress Elementor** integrando su API REST vía Antigravity.

## 🔀 Triggers de LLM
- `go!` : Workflow completo. Genera sitio web entero, validación de BrandBook, SEO, compilación masiva, inyección total.
- `segment!` : Workflow modular. Extrae y convierte una sola sección para inyectar con precisión quirúrgica.

## 🚀 Quick Start Setup
1. Instala en el sistema global local los servidores MCP para prevenir timeouts:
   ```bash
   npm i -g wp-elementor-mcp elementor-mcp
   ```
2. Adhiere tus Application Passwords de WP y APIKeys locales de Google a `mcp_config.json`.
3. Desde Antigravity dispara el proceso escribiendo el comando de trigger (`go!` o `segment!`).

## La Regla de Oro
`_elementor_data` SIEMPRE debe inyectarse como un string de un JSON ARRAY PURO:
✅ CORRECTO: `meta: { _elementor_data: JSON.stringify([{...}, {...}]) }`
❌ INCORRECTO: `meta: { _elementor_data: JSON.stringify({ version: "0.4", content: [...] }) }` (Causa Fatal Error en WP).

Este proyecto genera componentes de layouts Flexbox Native, respetando anchos de content (FULL+BOXED) y breakpoints Responsive en cada render.
