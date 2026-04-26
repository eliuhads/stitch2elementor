Aquí está el prompt, listo para copiar y pegar directamente en Antigravity:

---

```
Eres un ingeniero de software senior. Tu tarea es aplicar una serie de mejoras 
técnicas al repositorio local del skill "stitch2elementor". Tienes acceso completo 
al sistema de archivos local, al repositorio GitHub, y a todas las herramientas 
del entorno. Ejecuta cada paso de forma autónoma y secuencial. 
No pidas confirmación salvo que encuentres un conflicto destructivo.

---

## CONTEXTO

Este repositorio es un Skill para Antigravity que convierte diseños de Google Stitch 
a WordPress Elementor vía REST API. Se detectaron 7 problemas técnicos que debes 
resolver ahora.

---

## PASO 1 — CREAR .gitignore

Crea el archivo `.gitignore` en la raíz del repositorio con este contenido exacto:

```
# Credenciales y configuración local sensible
mcp_config.json
.env
.env.local
*.env

# Outputs de trabajo del agente
design-system/
page_manifest.json
IMAGENES_FUENTES/
INFO_BrandBook/

# Node
node_modules/
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

---

## PASO 2 — CREAR mcp_config.example.json

Crea el archivo `mcp_config.example.json` en la raíz con este contenido 
(es la plantilla segura sin credenciales reales):

```json
{
  "mcpServers": {
    "StitchMCP": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://stitch.googleapis.com/mcp", 
               "--header", "X-Goog-Api-Key: TU_GOOGLE_API_KEY_AQUI"],
      "disabled": false
    },
    "wp-elementor-mcp": {
      "command": "wp-elementor-mcp",
      "args": [],
      "env": {
        "WORDPRESS_BASE_URL": "https://tu-dominio.com",
        "WORDPRESS_USERNAME": "TU_USUARIO_ADMIN",
        "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx",
        "WP_MCP_MODE": "advanced"
      },
      "disabled": false
    },
    "elementor-mcp": {
      "command": "elementor-mcp",
      "args": [],
      "env": {
        "WP_URL": "https://tu-dominio.com",
        "WP_APP_USER": "TU_USUARIO_ADMIN",
        "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      },
      "disabled": false
    }
  }
}
```

Luego actualiza la sección "3. FRAGMENTO TARGET" del archivo 
`MCP_CONFIGURATION_GUIDE.txt` para que diga: 
"Copia `mcp_config.example.json`, renómbralo a `mcp_config.json` 
y rellena tus credenciales reales. NUNCA hagas commit de `mcp_config.json`."

---

## PASO 3 — CREAR package.json

Crea `package.json` en la raíz con este contenido:

```json
{
  "name": "stitch2elementor",
  "version": "2.1.0",
  "description": "Agentic AI pipeline: Google Stitch HTML to WordPress Elementor native JSON",
  "license": "MIT",
  "author": "eliuhads",
  "main": "compiler_v4.js",
  "scripts": {
    "compile": "node compiler_v4.js",
    "fix:slugs": "node scripts/fix_slugs.js",
    "fix:symbols": "node scripts/fix_material_symbols.js",
    "fix:images": "node scripts/replace_stitch_images.js && node scripts/apply_image_replacements.js",
    "fix:buttons": "node scripts/fix_buttons.js",
    "fix:all": "npm run fix:slugs && npm run fix:symbols && npm run fix:images && npm run fix:buttons"
  },
  "dependencies": {
    "elementor-mcp": "latest",
    "wp-elementor-mcp": "latest"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["elementor", "wordpress", "google-stitch", "ai", "mcp", "antigravity"]
}
```

---

## PASO 4 — CREAR JSON SCHEMA de validación Elementor

Crea la carpeta `schemas/` y dentro el archivo `elementor_data.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Elementor Data Schema",
  "description": "Valida que el _elementor_data sea un array plano de containers nativos",
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "required": ["elType", "settings", "elements", "id"],
    "properties": {
      "elType": {
        "type": "string",
        "enum": ["container", "widget"],
        "description": "Tipo de elemento Elementor. NUNCA 'section' o 'column'."
      },
      "id": {
        "type": "string",
        "minLength": 4,
        "description": "ID único hexadecimal del elemento"
      },
      "settings": {
        "type": "object",
        "description": "Configuración del elemento. No debe contener claves 'version' o 'content' en la raíz del array."
      },
      "elements": {
        "type": "array",
        "description": "Elementos hijos del container"
      }
    },
    "not": {
      "required": ["version", "content"],
      "description": "Rechaza el wrapper {version, content} que rompe Elementor con error 500"
    }
  }
}
```

---

## PASO 5 — AGREGAR CHECKPOINTING AL PIPELINE

Abre el archivo `PROMPT_WEB_MAESTRO_v2.md` y aplica estos dos cambios:

CAMBIO A — En FASE 2, paso 1 (Extracción), reemplaza la instrucción de curl por:

```
**Extracción Segura**: Descarga el HTML con flag de error fatal:
`curl --fail --max-time 30 -L -o [nombre].html "$URL"`.
Si curl retorna código distinto de 0, detén la fase y reporta el error 
HTTP al usuario. NUNCA proceses un HTML vacío o de error.
```

CAMBIO B — Al inicio de FASE 3 (Inyección Elementor), agrega como nuevo paso 1:

```
**Validación Pre-Inyección**: Antes de inyectar cualquier página, valida 
su JSON contra `schemas/elementor_data.schema.json`. 
Comando: `node -e "const s=require('./schemas/elementor_data.schema.json'); 
const d=require('./[archivo].json'); 
const Ajv=require('ajv'); const ajv=new Ajv(); 
const valid=ajv.validate(s,d); 
if(!valid){console.error(ajv.errors);process.exit(1);}"`.
Si la validación falla, NO inyectes y reporta el error al usuario.
```

---

## PASO 6 — CREAR CHANGELOG.md

Crea `CHANGELOG.md` en la raíz:

```markdown
# Changelog

Todas las notas de cambios relevantes de stitch2elementor.

## [2.1.0] — 2026-04-26
### Agregado
- Modo `segment!` para inyecciones modulares atómicas
- Script `fix_buttons.js` para aplicar colores del BrandBook
- Guía técnica `Stitch_Elementor_Guide_GENERAL_V1.md`
- JSON Schema de validación en `schemas/`
- `.gitignore` y `mcp_config.example.json` para protección de credenciales
- `package.json` con scripts npm declarados

### Cambiado
- Curl con `--fail --max-time 30` para detección de errores HTTP
- Validación pre-inyección de JSON antes de escribir en WordPress

## [2.0.0] — 2026-01-01
### Agregado
- Pipeline completo `go!` con 4 fases
- Compilador `compiler_v4.js` (DOM walker Tailwind → Elementor JSON)
- Patrón FULL+BOXED para layouts responsivos
- Scripts de post-proceso: `fix_slugs.js`, `fix_material_symbols.js`, `replace_stitch_images.js`
```

---

## PASO 7 — UNIFICAR VERSIÓN Y CORREGIR TYPO

7a. En `Stitch_Elementor_Guide_GENERAL_V1.md`, sección 4, 
     corrige "Scripts Inlcuidos" → "Scripts Incluidos".

7b. En `README.md`, verifica que el título diga "stitch2elementor V2.1" 
     y que la referencia al compilador diga `compiler_v4.js` 
     (no `compiler_v4_template.js`).

7c. En `Stitch_Elementor_Guide_GENERAL_V1.md`, cambia el título 
     "Referencia Técnica: Stitch a Elementor V4.1" → 
     "Referencia Técnica: Stitch a Elementor V2.1 — Compiler Build 4".

---

## PASO 8 — COMMIT Y PUSH A GITHUB

Una vez que todos los archivos estén creados y modificados correctamente, 
ejecuta en la raíz del repositorio:

```bash
git add .
git status
git commit -m "fix: security, versioning, validation and docs improvements

- Add .gitignore to exclude mcp_config.json and sensitive files
- Add mcp_config.example.json as safe credential template
- Add package.json with declared npm dependencies and scripts
- Add schemas/elementor_data.schema.json for pre-injection validation
- Add curl --fail flag to prevent silent HTML scraping errors
- Add pre-injection validation step to PROMPT_WEB_MAESTRO_v2.md
- Add CHANGELOG.md with versioned history
- Fix typo: 'Inlcuidos' -> 'Incluidos' in Stitch_Elementor_Guide_GENERAL_V1.md
- Fix compiler filename inconsistency: compiler_v4_template -> compiler_v4.js
- Unify version number to 2.1.0 across all files"

git push origin main
```

---

## VERIFICACIÓN FINAL

Cuando termines, confirma que existen estos archivos en el repositorio:
- [ ] `.gitignore` (con `mcp_config.json` listado)
- [ ] `mcp_config.example.json`
- [ ] `package.json`
- [ ] `schemas/elementor_data.schema.json`
- [ ] `CHANGELOG.md`
- [ ] `PROMPT_WEB_MAESTRO_v2.md` (con curl --fail y validación pre-inyección)
- [ ] `Stitch_Elementor_Guide_GENERAL_V1.md` (typo corregido, versión unificada)
- [ ] `README.md` (nombre de compilador corregido)

Reporta qué archivos se crearon, cuáles se modificaron, y si el push fue exitoso.
```

---

**Notas para cuando lo pegues:**

El prompt está ordenado de mayor a menor criticidad de seguridad — si Antigravity lo interrumpe, los cambios más importantes (`.gitignore`, credenciales) ya habrán quedado aplicados. El paso 8 es el único que toca GitHub, así que puedes eliminarlo si prefieres hacer el push tú mismo. ¿Quieres que ajuste algún paso?