# Changelog - stitch2elementor

## [v4.3.0] - 2026-04-15
### Corregido
- **WhatsApp Button (A1):** Eliminado `<span class="material-symbols-outlined">rocket_launch</span>` del texto del botón que Elementor renderizaba como texto plano. Reemplazado por icono nativo FA (`selected_icon: fab fa-whatsapp`).
- **Dead Code (A2):** Eliminado `content_classes = 'flex items-center gap-2'` — no es una setting nativa de Elementor (código muerto).
- **Homepage Double-Read (A3):** `homepage.html` se leía 2 veces (Header + Footer). Cacheado en variable única.
- **List ID Collisions (C5):** Reemplazado `Math.random()*10000` por `crypto.randomBytes(4)` para IDs de estilos en listas.

### Optimizado
- **extractTextColor (C2):** Cadena de 15 `!cls.startsWith(...)` reemplazada por `Set.has()` (O(1) vs O(n)).

### Eliminado
- Referencia a skill fantasma `ui-ux-pro-max` en SKILL.md (no existe).
- `PROMPT_WEB_MAESTRO_v2.txt` duplicado en raíz del proyecto.
- Tests obsoletos movidos a `archive/tests/` (`test_img.js`, `test_isolate*.js`).

### Documentación
- **PROMPT_WEB_MAESTRO_v2.md:** Eliminadas Opciones A/B/C de inyección. Fase 4 ahora es "Vía Única Híbrida" exclusiva.
- **SKILL.md:** Añadida tabla de inventario de 8 scripts reales (§4.1).
- **docs/gotchas.md:** Reescrito limpio (18 gotchas). Gotcha #13 actualizado a inyección nativa `elementor_library`. Añadido Gotcha #18 (Cache Flush obligatorio).
- **README.md:** Actualizado pipeline, scripts table, FAQ, version badge, y eliminadas skills fantasma.
- **package.json:** Versión sincronizada `2.1.0` → `4.3.0`.
- `docs/SKILL.md` renombrado a `docs/html-to-elementor-reference.md` para evitar confusión.

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
