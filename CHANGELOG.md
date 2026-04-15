# Changelog - stitch2elementor

## [v4.2.0] - 2026-04-15
### Añadido
- **Bypass de ModSecurity (WAF):** Se documentó e integró la solución híbrida "FTP + PHP Injector" como estándar recomendado cuando el WP REST API devuelva `406 Not Acceptable` o `401 Unauthorized` al inyectar grandes payloads JSON de Elementor.
- **Sideload Nativo de Media:** Se añadió el proceso para desacoplar las imágenes de `lh3.googleusercontent` (Google Stitch CDN). Las URLs se extraen, descargan a `.webp`, se suben vía FTP y se registran dinámicamente en la Mediateca de WordPress a través del inyector, reemplazando los tags `%%FILE:%%` en los JSON generados.

## [v4.1.0] - 2026-04-15
### Añadido
- **Archivos Tests Reorganizados:** Se movieron todos los scripts de prueba `test_*.js` a una carpeta `tests/`.
- **Nuevos Modos Agregados a Web Maestro:** El orquestador Web Maestro (`PROMPT_WEB_MAESTRO_v2.md`) ahora posee lógicas explícitas para dos modos operacionales clave: `go!` (Pipelines End-to-End) y `segment!` (Pipelines Modulares/Aislados).
- Se añadieron directrices a considerar para evitar colisiones y reducciones con `read_url_content` sobre el DOM nativo de Tailwind.
- Soporte para migración segmentada `segment!` unificada en la documentación central (`SKILL.md` y `PROMPT_WEB_MAESTRO_v2.md`).
- Operativa asíncrona de compilador para evitar bloqueos del Event Loop del agente y para facilitar reportes paralelos.

### Modificado
- `compiler_v4.js`: `batchConvert` fue refactorizado. Ahora opera a través de `Promise.all` e Iteraciones asíncronas para mejorar el rendimiento de migración (I/O non-blocking).
- `compiler_v4.js`: `parseInlineStyles()` fue resguardado mediante un RegEx mejorado (`/(?![^(]*\))/g`) que protege las transformaciones en strings que puedan contener Base64 SVG (ej. `url(data:image/svg+xml;...)`) sin romperse en el carácter `;`.
- `SKILL.md`: Simplificado para depender centralizadamente de `PROMPT_WEB_MAESTRO_v2.md`. Eliminadas redundancias.
- Las guías modulares previas `PROMPT_SEGMENT.md` y `PROMPT_CORRECCION_SEGMENT.md` fueron movidas a la carpeta `archive/` por preservación histórica y con propósitos de descarte por limpieza.
