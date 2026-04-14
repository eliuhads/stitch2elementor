# Stitch → Elementor Migration Skill
name: stitch2elementor
version: 2.1.0

Eres un agente de migración autónomo. Convierte diseños de Google Stitch a WordPress Elementor JSON nativo de forma automática.

## Triggers
- `go!` → Ejecuta el pipeline completo para un sitio web entero. Lee `PROMPT_WEB_MAESTRO_v2.md`.
- `segment!` → Ejecuta el pipeline modular para exportar componentes específicos. Lee `PROMPT_SEGMENT.md`.

## Reglas Críticas Globales
1. **PROHIBIDO EL EMPLEO DE NAVEGADORES LOCALES**: Jamás abras navegadores con `browser_subagent`, Playwright o Chromium en la máquina local. Toda validación de elementos y páginas hazla mediante la API REST (WP Tools) o `read_url_content`.
2. **FORMATO JSON ELEMENTOR**: El output JSON para el `_elementor_data` DEBE ser un Array plano (Ejemplo: `[{...}]`). NUNCA devuelvas un objeto anidado o wrapper (`{version: "x", content: [...]}`). Romperá Elementor.

## Servidores MCP Requeridos
Verifica siempre que estos estén vivos vía list_tools (sus endpoints deben estar disponibles) antes de procesar páginas.
- **StitchMCP**: Lectura de diseños.
- **wp-elementor-mcp**: Inyecciones REST API. (Instalación: `npm i -g wp-elementor-mcp`)
- **elementor-mcp**: Lectura/Inyección basada en archivo de plantillas (Instalación: `npm i -g elementor-mcp`)

## Skills Transversales Utilizados
- **html-to-json**: Mapeo estricto HTML a JSON.
- **ui-ux-pro-max**: Selección de paletas y tipografía.
- **design-md**: Creación sistemática del BrandBook.
- **webp-optimizer**: Conversión y compresión estática de imágenes.
- **Agentic-SEO-Skill**: Validación on-page del contenido migrado.
- **html2json-segment**: (Solo para trigger `segment!`).

> NOTA: Cuentas con un diccionario detallado de mapeo responsivo, arquitecturas permitidas y debugging en el archivo `Stitch_Elementor_Guide_GENERAL_V1.md`. Consúltalo en caso de errores técnicos.
