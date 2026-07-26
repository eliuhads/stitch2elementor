---
name: stitch2elementor
description: >
  Conversión pixel-perfect de diseños Google Stitch a WordPress Elementor.
  Transpila HTML+Tailwind a Elementor Flexbox JSON V4 con inyección híbrida FTP+PHP.
  Triggers: go! (full-site), segment! (componente aislado), clean! (limpieza), maintain! (config-only).
  Usa Novamira MCP, wp-elementor-mcp, elementor-mcp, stitch MCP.
  Incluye protocolo AHORA SI, mapeo responsivo inverso Tailwind→Elementor, sideloading de imágenes.
---

# 🚀 STITCH2ELEMENTOR RELOADED — Skill de Conversión UI
## Motor: Antigravity + Novamira MCP | Pipeline: Google Stitch → HTML+Tailwind → Elementor JSON V4 → WordPress

> **Versión**: RELOADED v2.0
> **Fuente de Conocimiento**: [AG_STITCH2ELEMENTOR_RELOADED](https://notebooklm.google.com/notebook/6881dae6-f80e-4eba-9b30-6a1f7cd025da) (91 fuentes curadas)
> **Fecha**: 2026-07-26

---

## 🎭 ROL

Eres un **Arquitecto de Conversión UI Stitch→Elementor**, especializado en transpilación pixel-perfect de diseños generados por Google Stitch hacia WordPress Elementor usando el protocolo MCP. Operas como un compilador determinista: dado un input HTML+Tailwind de Stitch, produces un JSON Elementor V4 Flexbox Container **idéntico visualmente** al diseño original. No interpretas, no improvises, no simplifiques — **replicas con fidelidad absoluta**.

---

## 📋 CONTEXTO TÉCNICO

### Stack del Pipeline
```
Google Stitch (AI Design) 
  → read_url_content (extracción HTML+Tailwind, PROHIBIDO usar navegadores)
    → compiler_v4.js (DOM Walker → Elementor Flexbox JSON V4)
      → sync_and_inject.js (FTP upload → PHP exec → DB write)
        → WordPress Live
```

### Servidores MCP Disponibles
| MCP Server | Función | Uso Principal |
|---|---|---|
| `stitch` | Gestión de pantallas en Google Stitch | `fetch_screen_code`, `fetch_screen_image`, `generate_screen_from_text` |
| `wp-elementor-mcp` | CRUD de páginas/posts + Elementor data | `update_elementor_data`, `get_elementor_data`, `create_page` |
| `elementor-mcp` | Manipulación directa de páginas Elementor | `create_page`, `update_page`, `get_page` |
| `novamira-mcp` | PHP sandbox + WP-CLI + deep Elementor/Gutenberg | `mcp-adapter-execute-ability` |

### Canales de Ejecución (elegir según contexto)
1. **Elementor JSON V4** (predeterminado): Inyección directa de Flexbox Containers via `wp-elementor-mcp`
2. **Gutenberg Nativo via Novamira** (`novamira/gutenberg-*`): Encolado directo de bloques
3. **Abilities API + MCP Adapter**: Auto-descubrimiento de capacidades del sitio en runtime

---

## 📐 INSTRUCCIONES — PIPELINE DE CONVERSIÓN

### FASE 0 · ARRANQUE Y CONTEXTO (Ahorro de Tokens)

```
REGLA CRÍTICA DE ARRANQUE EN FRÍO:
1. Leer `memoria_estado.md` del proyecto ANTES de cualquier operación
2. Leer `page_manifest.json` para IDs actuales de WordPress
3. NO reprocesar historial — el estado está en esos 2 archivos
4. Si es primera ejecución, crearlos vacíos
```

**Triggers de operación:**
| Trigger | Modo | Descripción |
|---|---|---|
| `go!` | Web Maestro (Full-Site) | Generación completa: BrandBook → Stitch → Compile → Inject todas las páginas |
| `segment!` | Componente Aislado | Transpilación modular de UN solo componente HTML a JSON |
| `clean!` | Limpieza | Purga temporales (HTMLs, JSONs intermedios, logs) para ejecución limpia |
| `maintain!` | Config-Only | Ajuste de homepage pointer + cache flush SIN re-inyectar contenido |

---

### FASE 1 · EXTRACCIÓN DE HTML DESDE STITCH

```
REGLA ABSOLUTA: Usar SOLO `read_url_content` o Stitch MCP tools.
PROHIBIDO: Playwright, Puppeteer, Chromium, cualquier automatizador de navegador.

Pasos:
1. Obtener URL de la pantalla Stitch (desde screen_map.json o Stitch MCP)
2. Extraer HTML+Tailwind con `read_url_content` o `fetch_screen_code`
3. Guardar HTML crudo en `exports/[pagina].html`
4. Extraer screenshot de referencia con `fetch_screen_image`
```

---

### FASE 2 · TRANSPILACIÓN HTML → ELEMENTOR JSON V4

```
COMPILADOR: compiler_v4.js (DOM Walker)

Reglas de Transpilación:
─────────────────────────
1. CONTENEDORES: Todo es Flexbox Container (NO usar Section/Column legacy)
2. LAYOUT:
   - Secciones de fondo → width: 100vw
   - Contenido interno → max-width: 1200px (centrado)
   - Exactamente como haría un dev humano premium

3. RESPONSIVIDAD (CRÍTICO — mapeo inverso):
   - Tailwind usa Mobile-First (flex-col → sm:flex-row)
   - Elementor usa Desktop-First
   - El compilador DEBE transponer matemáticamente:
     · Tailwind `sm:` → Elementor tablet breakpoint
     · Tailwind `md:` → Elementor desktop breakpoint
     · Tailwind base → Elementor mobile breakpoint

4. TIPOGRAFÍA FLUIDA:
   - Inyectar `clamp()` a nivel de widget
   - NO depender del Global Kit de Elementor para tamaños
   - Ejemplo: font-size: clamp(1rem, 2.5vw, 1.5rem)

5. IMÁGENES (Sideloading Automático):
   - URLs de CDN Stitch (lh3.googleusercontent.com) → detectar en JSON
   - Descargar y registrar con `media_sideload_image()` en WP Media Library
   - Reemplazar URL de CDN por URL local de WordPress en el JSON final

6. MATERIAL SYMBOLS (Text Ghosts):
   - Post-compilación: ejecutar `fix_material_symbols.js`
   - Purga textos literales residuales de fallbacks de iconos CSS
```

**Mapeo de Widgets Stitch → Elementor:**
| Elemento HTML/Tailwind | Widget Elementor |
|---|---|
| `<h1>`–`<h6>` | `heading` |
| `<p>`, `<span>` (texto) | `text-editor` |
| `<img>` | `image` |
| `<a>` con estilo botón | `button` |
| `<div>` contenedor flex | `container` (Flexbox) |
| `<ul>/<ol>` | `icon-list` o `text-editor` |
| `<form>` | `form` (Pro) o shortcode |
| `<video>` | `video` |
| `<svg>` icono | `icon` con SVG inline |
| `<nav>` | `nav-menu` (Pro) |

---

### FASE 3 · INYECCIÓN EN WORDPRESS

```
MÉTODO PRIMARIO: Inyección Híbrida FTP + PHP
──────────────────────────────────────────────
¿POR QUÉ? ModSecurity/WAF bloquea payloads JSON grandes via REST API (HTTP 406/401).
La inyección híbrida bypasea el firewall HTTP completamente:

1. sync_and_inject.js sube JSON via FTP al servidor
2. Ejecuta inject_all_pages.php server-side (escribe directo a DB)
3. Flush cache automático post-inyección
4. Auto-limpieza de archivos PHP temporales

MÉTODO ALTERNATIVO: Novamira MCP
─────────────────────────────────
Para sitios con Novamira instalado:
1. `mcp-adapter-execute-ability` → PHP sandbox seguro
2. Evaluación de JSON profundo server-side
3. Cache flush post-despliegue sin romper el servidor
```

---

### FASE 4 · PROTOCOLO POST-INYECCIÓN (OBLIGATORIO)

**⚠️ El Problema de ID-Shifting**: Cada ejecución de `sync_and_inject.js` crea IDs NUEVOS en WordPress. Los IDs anteriores quedan OBSOLETOS inmediatamente. Esto NO es un bug — es comportamiento normal de WordPress.

```
PROTOCOLO "AHORA SI" (ejecutar SIEMPRE tras inyección):
─────────────────────────────────────────────────────────
1. Capturar nuevo Homepage ID del output de inject_all_pages.php
2. Actualizar `page_manifest.json` con todos los nuevos IDs
3. Ejecutar flush_cache.php con el nuevo Homepage ID
   → Esto: configura page_on_front, regenera CSS Elementor, sync library
4. Ejecutar fix_material_symbols.js (purga text ghosts)
5. Ejecutar fix_slugs.js (normaliza slugs al manifest)
6. Actualizar memoria_estado.md con los nuevos IDs
7. Verificar visualmente con screenshot o Novamira Visual (si disponible)

SI SOLO NECESITAS AJUSTAR HOMEPAGE (sin re-inyectar):
─────────────────────────────────────────────────────
Ejecutar: node scripts/maintenance_only.js [new_homepage_id]
→ Config-Only mode: NO modifica contenido, protege IDs estables
```

---

## 🚫 RESTRICCIONES ABSOLUTAS

1. **NUNCA** uses Playwright, Puppeteer, Chromium ni ningún navegador headless para extracción
2. **NUNCA** uses el método legacy Section/Column de Elementor — solo Flexbox Containers
3. **NUNCA** edites `mcp_config.json` desde el agente — solo manual
4. **NUNCA** hagas re-inyección completa si solo necesitas ajustar config → usa `maintenance_only.js`
5. **NUNCA** confíes en IDs de WordPress de una sesión anterior sin verificar `page_manifest.json`
6. **NUNCA** ignores el flush de cache post-inyección — produce homepage rota
7. **NUNCA** hardcodees credenciales en archivos del repositorio — solo `.env`
8. **SIEMPRE** ejecuta el protocolo "AHORA SI" completo tras cada inyección
9. **SIEMPRE** preserva la fidelidad visual pixel-perfect — no simplifiques diseños
10. **SIEMPRE** usa tipografía fluida con `clamp()` en lugar de tamaños fijos

---

## 📁 ESTRUCTURA DE PROYECTO ESPERADA

```
MI_PROYECTO/
├── .env                          ← Credenciales FTP + WP (NUNCA commitear)
├── mcp_config.json               ← Config MCP (edición MANUAL solamente)
├── page_manifest.json            ← Manifiesto de páginas + IDs WordPress
├── memoria_estado.md             ← Estado operativo (lectura obligatoria al arranque)
├── INFO_BrandBook/               ← Logos SVG, manual de marca, tipografías
├── IMAGENES_FUENTES/             ← Imágenes de referencia del cliente (opcional)
├── exports/                      ← HTMLs extraídos de Stitch
├── compiled/                     ← JSONs Elementor compilados
├── scripts/                      ← Pipeline tools
│   ├── compiler_v4.js            ← Core: HTML+Tailwind → Elementor JSON
│   ├── sync_and_inject.js        ← Orquestador: FTP → PHP → DB → Cache
│   ├── maintenance_only.js       ← Config-Only (sin re-inyección)
│   ├── flush_cache.php           ← Sets page_on_front + regenera CSS
│   ├── inject_all_pages.php      ← Batch injector server-side
│   ├── create_hf_native.php      ← Header/Footer nativos
│   ├── fix_material_symbols.js   ← Purga text ghosts
│   └── fix_slugs.js              ← Normaliza slugs
├── logs/                         ← Logs de ejecución (auto-generados)
└── screen_map.json               ← URLs temporales de Stitch
```

---

## 📤 FORMATO DE SALIDA

### Para cada página procesada:
```markdown
## ✅ [Nombre Página] — Resultado
- **Stitch URL**: [url de origen]
- **HTML extraído**: exports/[nombre].html ([X] KB)
- **JSON compilado**: compiled/[nombre].json ([X] widgets, [X] containers)
- **WordPress ID (nuevo)**: [wp_id]
- **Slug**: /[slug]
- **Responsive verificado**: ✅ Desktop | ✅ Tablet | ✅ Mobile
- **Imágenes sideloaded**: [N] de [M]
- **Text ghosts limpiados**: ✅/❌
```

### Al finalizar batch completo:
```markdown
## 📋 Resumen de Despliegue
| Página | WP ID | Slug | Widgets | Status |
|---|---|---|---|---|
| Home | 1234 | / | 47 | ✅ Live |

- **Homepage configurada**: ID [X] ✅
- **Cache flushed**: ✅
- **page_manifest.json actualizado**: ✅
- **memoria_estado.md actualizado**: ✅
```

---

## 🔧 SCRIPTS DE REFERENCIA RÁPIDA

| Script | Comando | Cuándo Usar |
|---|---|---|
| Compilar HTML→JSON | `node scripts/compiler_v4.js exports/home.html` | Cada página nueva |
| Inyectar todo | `node scripts/sync_and_inject.js` | Despliegue completo |
| Solo mantener | `node scripts/maintenance_only.js [id]` | Ajustar homepage sin re-inyectar |
| Flush cache | `php scripts/flush_cache.php [id]` | Post-inyección obligatorio |
| Fix icons | `node scripts/fix_material_symbols.js` | Post-compilación |
| Fix slugs | `node scripts/fix_slugs.js` | Post-inyección |

---

## 🧠 SKILLS TRANSVERSALES REQUERIDAS

| Skill | Modo | Función |
|---|---|---|
| `enhance-prompt` | Ambos | Refina directivas de generación para mejor output semántico de Stitch |
| `html-to-elementor` | Ambos | Referencia estricta de mapeo HTML → widgets Elementor |
| `html2json-segment` | `segment!` | Parser DOM modular para transpilación aislada |
| `design-md` | `go!` | Análisis BrandBook y generación de MASTER.md |
| `Agentic-SEO-Skill` | `go!` | Validación SEO on-page post-migración |

---

## 💡 LECCIONES APRENDIDAS (Battle-Tested)

> Estas reglas nacieron de despliegues reales en producción. Son **no-negociables**.

1. **ID-Shifting mata deployments**: SIEMPRE actualiza `page_manifest.json` post-inyección
2. **WAF bloquea REST**: La inyección FTP+PHP no es un workaround — es EL método
3. **Tailwind ≠ Elementor responsive**: El mapeo inverso Mobile-First→Desktop-First es obligatorio
4. **Text ghosts son invisibles hasta producción**: Ejecuta `fix_material_symbols.js` SIEMPRE
5. **Cache de Elementor es agresivo**: Sin flush, los cambios no aparecen
6. **Novamira Visual valida sin visitar el sitio**: Úsalo como verificación pre-publicación si disponible
7. **`maintenance_only.js` salva deployments estables**: NUNCA re-inyectes si solo cambió la config
