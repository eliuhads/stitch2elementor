# Scripts Playwright — Verificación Remota vía Proxmox

## Arquitectura

```
Tu PC (Windows)  ──→  ws://192.168.1.252:3000/playwright  ──→  Contenedor Proxmox
   scripts/              WebSocket                            Chromium headless
```

El navegador **nunca** se abre localmente. Todos los scripts conectan al contenedor Proxmox vía WebSocket usando `playwright-core`.

## Requisitos

```bash
npm install playwright-core dotenv
```

> **NO instalar `playwright`** (con Chromium bundled). Solo `playwright-core` que conecta a instancias remotas.

## Variables de Entorno

En `.env` del proyecto:
```
PLAYWRIGHT_WS_ENDPOINT=ws://192.168.1.252:3000/playwright
```

## Scripts Disponibles

### 1. `playwright_visual_test.mjs` — Verificación visual básica

Toma un screenshot + ejecuta checks automáticos (H1, meta, schema, refs solar, etc.)

```bash
# Verificar sitio live
node scripts/playwright_visual_test.mjs https://evergreenvzla.com

# Verificar archivo local (debe ser accesible desde Proxmox o servido)
node scripts/playwright_visual_test.mjs https://evergreenvzla.com --screenshot home --full-page

# Mobile
node scripts/playwright_visual_test.mjs https://evergreenvzla.com --viewport 375x812 --screenshot mobile
```

**Output:** `output/screenshots/screenshot_1920x1080_<timestamp>.png`

### 2. `playwright_scroll_capture.mjs` — Capturas por scroll

Captura toda la página en secciones o por viewport scroll.

```bash
# Scroll completo (viewport por viewport)
node scripts/playwright_scroll_capture.mjs https://evergreenvzla.com

# Por secciones HTML (cada <section>, <nav>, <footer>)
node scripts/playwright_scroll_capture.mjs https://evergreenvzla.com --sections

# Tablet
node scripts/playwright_scroll_capture.mjs https://evergreenvzla.com --sections --viewport 768x1024
```

**Output:** `output/screenshots/scroll_<timestamp>/`

### 3. `playwright_responsive_check.mjs` — Test responsive automático

Verifica responsive en 5 viewports: Desktop, Laptop, Tablet, Mobile, Mobile Small.
Detecta: overflow horizontal, texto < 12px, tap targets < 44px.

```bash
node scripts/playwright_responsive_check.mjs https://evergreenvzla.com
```

**Output:** `output/screenshots/responsive_<timestamp>/` + reporte en consola

## Uso desde Antigravity/Claude

Cuando el agente necesite verificar visualmente:

```javascript
// El agente ejecuta:
run_command("node scripts/playwright_visual_test.mjs https://evergreenvzla.com --full-page")
```

❌ **NUNCA** usar `browser_subagent`, `open_browser_url`, ni herramientas de navegación internas.
✅ **SIEMPRE** usar estos scripts Node.js que conectan al Proxmox remoto.

## Troubleshooting

| Error | Solución |
|-------|----------|
| `PLAYWRIGHT_WS_ENDPOINT no definido` | Verificar que `.env` tiene la variable |
| `No se pudo conectar` | Verificar que el contenedor Proxmox está corriendo en 192.168.1.252:3000 |
| `Timeout` en goto | La URL no es accesible desde el contenedor Proxmox |
| Archivos `file:///` no cargan | Los archivos locales de Windows no son accesibles desde Proxmox. Servir con `npx serve` |

### Servir archivos locales para Proxmox

Si necesitas que Proxmox acceda a un HTML local:
```bash
# En tu PC, servir la carpeta
npx -y serve client_data/INFO_Brandbook -l 8080

# Luego desde el script usar tu IP local
node scripts/playwright_visual_test.mjs http://192.168.1.XXX:8080/evergreen_brandbook_V11.html
```
