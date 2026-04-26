# PROMPT DE AUDITORÍA PARA CLAUDE (ANTIGRAVITY)
## Repositorio: eliuhads/stitch2elementor | Fecha: 2026-04-26

---

> **INSTRUCCIÓN A CLAUDE:** Eres un experto en seguridad de aplicaciones web, PHP, Node.js y WordPress. A continuación se presenta una auditoría completa del repositorio `stitch2elementor`. Tu tarea es implementar directamente en el código todas las correcciones ordenadas por prioridad. Lee cada sección con atención antes de modificar cualquier archivo.

---

## RESUMEN EJECUTIVO

`stitch2elementor` es una herramienta de migración/deployment de diseños Google Stitch → Elementor (WordPress). Consiste en scripts Node.js y PHP que orquestan la inyección masiva de páginas vía FTP+HTTP. El repositorio es **público bajo licencia MIT**, por lo que cualquier dato sensible expuesto es un riesgo real e inmediato.

**Estado global tras auditoría:**
- ✅ No hay credenciales hardcodeadas en JS/PHP de producción
- ✅ `.env` está en `.gitignore`
- ✅ `auth_helper.php` usa `hash_equals()` (timing-safe)
- ✅ FTP usa TLS (`secure: true`)
- ⚠️ **CRÍTICO:** `mcp_config.json` (archivo de configuración real, no ejemplo) está trackeado en Git con variables `${...}` — el archivo en sí no es peligroso, pero su presencia establece un patrón confuso vs. `mcp_config.example.json`
- ⚠️ **CRÍTICO:** `screen_map.json` expone URLs firmadas de Google Stitch con tokens de acceso temporal
- ⚠️ **ALTO:** `memoria_estado.md` expone IDs internos de WordPress, slugs, nombre del cliente ("Evergreen Venezuela"), IDs de proyecto de Stitch (`projects/800373799240149310`) y estado operativo completo del sitio
- ⚠️ **ALTO:** `page_manifest.json` expone IDs reales de WordPress, estructura de sitio y dominio implícito del cliente
- ⚠️ **ALTO:** Bug sintáctico crítico en múltiples PHP scripts — la primera línea es código roto
- ⚠️ **ALTO:** `INJECT_SECRET` usado como variable sin declarar en `sync_and_inject.js`
- ⚠️ **MEDIO:** `deep_diagnose.php` tiene un slug de cliente hardcodeado como default
- ⚠️ **MEDIO:** `error_reporting(E_ALL)` + `ini_set('display_errors', 1)` en todos los PHP de producción
- ⚠️ **BAJO:** Inconsistencias de naming, documentación desactualizada, falta de rate limiting

---

## HALLAZGOS ORDENADOS POR PRIORIDAD

---

### 🔴 CRÍTICO — Implementar INMEDIATAMENTE

---

#### C1: `screen_map.json` — URLs firmadas con tokens de acceso expuestas en Git

**Archivo:** `screen_map.json`

**Problema:** El archivo contiene URLs con tokens firmados de Google (`contribution.usercontent.google.com/download?c=...`). Aunque probablemente sean tokens de corta vida, estos tokens están en el historial público de Git de forma permanente. Cualquier persona que descargue el repo puede intentar usarlos. Además el archivo revela el `project_id` interno de Stitch: `9068408183281403105`.

**Corrección:**
1. Eliminar `screen_map.json` del tracking de Git:
   ```bash
   git rm --cached screen_map.json
   echo "screen_map.json" >> .gitignore
   git commit -m "security: remove screen_map.json with signed URLs from Git tracking"
   ```
2. Crear `screen_map.example.json`:
```json
[
  {
    "title": "Nombre de Página",
    "htmlUrl": "https://TU_URL_DE_STITCH_AQUI"
  }
]
```
3. Documentar en README que `screen_map.json` se genera localmente y no debe commitearse.

---

#### C2: `memoria_estado.md` — Datos operativos privados del cliente expuestos

**Archivo:** `memoria_estado.md`

**Problema:** El archivo expone:
- Nombre real del cliente: "Evergreen Venezuela"
- IDs internos de WordPress: `1584`, `1585`, `1586`, `1600`, `1651`
- ID de proyecto de Stitch: `projects/800373799240149310`
- URLs implícitas del sitio, estado de inyección, puntajes SEO reales (100/100)
- Historial completo de operaciones en el servidor del cliente

Este archivo es un diario de operaciones específico de un proyecto cliente. **No debería existir en un repositorio público MIT reutilizable.**

**Corrección:**
1. Eliminar del tracking:
   ```bash
   git rm --cached memoria_estado.md
   echo "memoria_estado.md" >> .gitignore
   git commit -m "security: remove client-specific state file from tracking"
   ```
2. Crear una plantilla genérica `memoria_estado.example.md`:
```markdown
# Estado del Proyecto - [NOMBRE_PROYECTO]

## Último Deploy
- Fecha: YYYY-MM-DD
- Páginas inyectadas: N/N
- Homepage ID: [actualizar tras deploy]
- Header ID: [actualizar tras deploy]
- Footer ID: [actualizar tras deploy]

## Pendiente
- [ ] Tarea 1
- [ ] Tarea 2
```
3. Documentar en README que este archivo es local y se crea por proyecto.

---

#### C3: `page_manifest.json` — IDs reales de WordPress expuestos (vs. el ejemplo)

**Archivo:** `page_manifest.json`

**Problema:** El archivo real (no el `_example`) está trackeado con:
- IDs reales de WP del cliente (1586-1605)
- Nombre del cliente ("Evergreen Venezuela")
- Estado real de migración ("COMPLETED")
- Fecha real de inyección ("2026-04-25")

El `page_manifest_example.json` es el archivo correcto para trackear. El real es datos de un proyecto específico.

**Corrección:**
1. Sobrescribir `page_manifest.json` con una versión genérica (template):
```json
{
  "_comment": "Copia este archivo como page_manifest.json y completa con tus páginas. Los wp_id se actualizan automáticamente tras cada inyección.",
  "home_id": null,
  "blog_id": null,
  "migration_status": "PENDING",
  "last_injection_date": null,
  "pipeline_version": "4.7.0",
  "pages": [
    {
      "html": "homepage.html",
      "json": "homepage.json",
      "wp_id": null,
      "slug": "homepage",
      "title": "Nombre de la Homepage",
      "is_homepage": true
    }
  ]
}
```
2. Agregar al `.gitignore`:
   ```
   page_manifest.json
   !page_manifest_example.json
   ```
   **O bien**, si `page_manifest.json` es el template oficial, limpiar todos los datos del cliente.

---

#### C4: Bug sintáctico crítico en scripts PHP — primera línea rota

**Archivos afectados:** `inject_all_pages.php`, `deep_diagnose.php`, `flush_cache.php`, `scripts/create_hf_native.php`, `scripts/fase2_alt_media.php`, `scripts/diagnose_500.php`, y potencialmente todos los PHP del directorio `scripts/`

**Problema:** La primera línea de cada archivo tiene este código inválido:
```php
<?php
 = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once();
verify_api_token();
```

Esta sintaxis es un **Parse Error de PHP** — la asignación `= ...` sin variable receptora crashea con `Parse error: syntax error, unexpected '='`. Los archivos sólo funcionan porque `wp-load.php` se incluye *después* (que carga el entorno que permite que el bloque real de auth funcione). Sin embargo, el primer bloque NUNCA ejecuta `verify_api_token()` correctamente — la autenticación real ocurre en el bloque **duplicado** más abajo.

**Esto significa que el primer `verify_api_token()` FALLA SILENCIOSAMENTE y la autenticación depende únicamente del segundo bloque.**

**Corrección para CADA archivo PHP afectado:**

Eliminar completamente el bloque inicial roto (líneas 2-4) y dejar sólo el patrón correcto después de `wp-load.php`:

```php
<?php
/**
 * [nombre_script].php — [descripción]
 * stitch2elementor v4.7.0
 */
error_reporting(E_ALL);
ini_set('display_errors', 0); // VER C5 — cambiar a 0 en producción

define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$auth_path = file_exists(__DIR__ . '/auth_helper.php')
    ? __DIR__ . '/auth_helper.php'
    : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

// ... resto del script
```

---

### 🟠 ALTO — Implementar en esta sesión

---

#### A1: Variable `INJECT_SECRET` no declarada en `sync_and_inject.js`

**Archivo:** `scripts/sync_and_inject.js`

**Problema:** El script usa `INJECT_SECRET` en múltiples lugares (línea ~38 y en `fetchOptions`), pero NUNCA la declara. `WP_SCRIPT_TOKEN` sí se declara correctamente, pero `INJECT_SECRET` no tiene asignación desde `process.env`. Esto causa un `ReferenceError: INJECT_SECRET is not defined` en Node.js en modo estricto, y un comportamiento silenciosamente roto en modo normal (usa `undefined` como token).

**Corrección:** En el bloque de variables de entorno (al inicio del archivo), agregar:

```javascript
const INJECT_SECRET = process.env.INJECT_SECRET || '';

if (!WP_BASE_URL || !FTP_HOST || !FTP_USER || !FTP_PASS || !WP_SCRIPT_TOKEN) {
    console.error('❌ Missing required env vars: WP_BASE_URL, FTP_HOST, FTP_USER, FTP_PASS, WP_SCRIPT_TOKEN');
    process.exit(1);
}

if (!INJECT_SECRET) {
    console.error('❌ Missing INJECT_SECRET in .env. All PHP scripts require authentication.');
    process.exit(1);
}
```

---

#### A2: `display_errors = 1` en todos los PHP scripts de producción

**Archivos afectados:** Todos los scripts PHP en `scripts/`

**Problema:** `ini_set('display_errors', 1)` hace que errores PHP (incluyendo stack traces con rutas absolutas del servidor, nombres de variables, estructura de BD) sean visibles en la respuesta HTTP. Esto es una vulnerabilidad de **information disclosure** estándar.

**Corrección:** Cambiar en todos los archivos PHP:

```php
// ANTES (inseguro):
error_reporting(E_ALL);
ini_set('display_errors', 1);

// DESPUÉS (seguro para producción):
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
// El log ya va al error_log del servidor, no a la respuesta HTTP
```

---

#### A3: Slug de cliente hardcodeado en `deep_diagnose.php`

**Archivo:** `scripts/deep_diagnose.php`

**Problema:** Línea ~35:
```php
$test_slug = isset($_GET['slug']) ? $_GET['slug'] : 'estaciones-de-energia-portatiles';
```
El slug `'estaciones-de-energia-portatiles'` es una página real del cliente "Evergreen Venezuela", hardcodeado como default. En un repo público reutilizable, esto:
1. Expone datos del cliente
2. Fallará silenciosamente para cualquier otro usuario que no tenga esa página

**Corrección:**
```php
if (!isset($_GET['slug']) || empty(trim($_GET['slug']))) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing required parameter: slug. Usage: ?slug=your-page-slug']));
}
$test_slug = sanitize_title($_GET['slug']); // usa sanitize_title de WP para limpiar el input
```

---

#### A4: Input `$_GET['slug']` sin sanitizar en `deep_diagnose.php`

**Archivo:** `scripts/deep_diagnose.php`

**Problema:** Aunque el valor pasa a `$wpdb->prepare()` (lo que previene SQL injection), el slug también se usa en `home_url("/$test_slug/")` y potencialmente en logs sin sanitizar. Usar `sanitize_title()` de WordPress es la forma correcta.

**Corrección:** (Incluida en A3 arriba — usar `sanitize_title($_GET['slug'])`)

---

### 🟡 MEDIO — Implementar como mejoras

---

#### M1: `mcp_config.json` real trackeado junto a `mcp_config.example.json`

**Problema:** Ambos `mcp_config.json` y `mcp_config.example.json` están trackeados. El real usa placeholders `${VAR}` (no valores reales), pero su presencia es confusa y establece que el archivo de config real va al repo.

**Corrección:**
1. Agregar a `.gitignore`:
   ```
   mcp_config.json
   !mcp_config.example.json
   ```
2. Renombrar `mcp_config.example.json` → mantenerlo como la única fuente de verdad

---

#### M2: `design_system_template.json` y `page_manifest.json` con datos reales

**Problema:** `design_system_template.json` puede contener tokens de diseño del proyecto real. Verificar que no tenga referencias al cliente.

**Corrección:** Revisar el archivo y anonimizar cualquier referencia a "Evergreen Venezuela" u otros datos del cliente.

---

#### M3: Documentación y README desactualizada

**Problema:** El `README.md` (18KB) probablemente describe el flujo completo del proyecto, pero debe reflejar:
- Que `mcp_config.json`, `screen_map.json`, `memoria_estado.md` y `page_manifest.json` son archivos locales/de-proyecto, no de repo
- El bug del bloque PHP inicial (C4) si ya fue corregido
- La variable `INJECT_SECRET` en `.env.example` (ya está, bien)

**Corrección:** Agregar una sección "Archivos locales (no commitear)" al README.

---

#### M4: `fase3_deploy.js` — verificar si tiene el mismo bug de INJECT_SECRET

**Archivo:** `scripts/fase3_deploy.js`

**Problema:** Este script de deploy puede tener el mismo patrón de variable no declarada.

**Corrección:** Revisar y aplicar el mismo fix de A1.

---

#### M5: Rate limiting inexistente en endpoints PHP

**Problema:** Los scripts PHP no tienen ningún mecanismo de rate limiting. Si bien requieren token Bearer, un atacante con el token podría hacer spam de requests.

**Corrección:** Agregar en `auth_helper.php` un mecanismo básico de rate limiting usando transients de WordPress:

```php
function check_rate_limit($max_requests = 10, $window_seconds = 60) {
    $ip_key = 'ratelimit_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $current = (int) get_transient($ip_key);
    if ($current >= $max_requests) {
        http_response_code(429);
        die(json_encode(['error' => 'Too Many Requests. Try again later.']));
    }
    set_transient($ip_key, $current + 1, $window_seconds);
}
```

Llamar `check_rate_limit()` al inicio de `verify_api_token()`.

---

### 🔵 BAJO — Mejoras de calidad y mantenibilidad

---

#### B1: Inconsistencia de naming — `WP_SCRIPT_TOKEN` vs `INJECT_SECRET`

**Problema:** Se usan dos nombres de token distintos para autenticación del mismo sistema. `WP_SCRIPT_TOKEN` en PHP y `.env`, `INJECT_SECRET` en JS. Confuso para nuevos usuarios.

**Corrección sugerida:** Unificar a un solo token, o documentar claramente la diferencia en `.env.example`. Si tienen propósitos distintos, añadir comentario explicativo.

---

#### B2: FTP `secureOptions.rejectUnauthorized` configurable

**Archivo:** `scripts/sync_and_inject.js`

**Problema:** `rejectUnauthorized: process.env.FTP_REJECT_UNAUTHORIZED !== 'false'` permite deshabilitar la validación TLS con una variable de entorno. Aunque tiene intención de facilitar development, es un patrón peligroso — si alguien setea `FTP_REJECT_UNAUTHORIZED=false` en producción, la conexión FTP es vulnerable a MITM.

**Corrección:** Eliminar esta opción y siempre usar `rejectUnauthorized: true`. Si se necesita para dev local, documentar que debe usarse un certificado auto-firmado añadido al store de Node.

---

#### B3: Ausencia de `'use strict'` en scripts Node.js

**Problema:** Ningún script JS tiene `'use strict'`. En modo estricto, el `ReferenceError` de `INJECT_SECRET` (A1) habría sido evidente en desarrollo.

**Corrección:** Agregar `'use strict';` al inicio de cada `.js`, o usar módulos ES (`type: module` en `package.json`).

---

#### B4: `logs/` directorio en repo

**Problema:** El directorio `logs/` está trackeado. Los logs pueden contener información sensible (IDs, URLs, tokens, errores con stack traces).

**Corrección:**
```bash
git rm -r --cached logs/
echo "logs/" >> .gitignore
echo "logs/.gitkeep" # mantener el directorio vacío
touch logs/.gitkeep
git add logs/.gitkeep
git commit -m "chore: move logs to gitignore, keep empty dir"
```

---

#### B5: `exports/` directorio en repo

**Problema:** Similar a `logs/`, el directorio `exports/` puede contener JSONs de Elementor generados con datos del cliente.

**Corrección:** Mismo tratamiento que `logs/` — agregar a `.gitignore` con `.gitkeep`.

---

## TABLA RESUMEN DE CORRECCIONES

| ID | Archivo(s) | Tipo | Prioridad | Acción |
|----|-----------|------|-----------|--------|
| C1 | `screen_map.json` | Seguridad | 🔴 Crítico | `git rm --cached` + `.gitignore` + crear ejemplo |
| C2 | `memoria_estado.md` | Privacidad | 🔴 Crítico | `git rm --cached` + `.gitignore` + crear ejemplo |
| C3 | `page_manifest.json` | Privacidad | 🔴 Crítico | Limpiar datos cliente o mover a `.gitignore` |
| C4 | Todos los PHP scripts | Bug sintáctico | 🔴 Crítico | Eliminar primer bloque PHP roto de cada archivo |
| A1 | `sync_and_inject.js` | Bug lógico | 🟠 Alto | Declarar `INJECT_SECRET` desde `process.env` |
| A2 | Todos los PHP scripts | Seguridad | 🟠 Alto | Cambiar `display_errors` de `1` a `0` |
| A3 | `deep_diagnose.php` | Seguridad+Bug | 🟠 Alto | Eliminar slug hardcodeado del cliente |
| A4 | `deep_diagnose.php` | Seguridad | 🟠 Alto | Sanitizar `$_GET['slug']` con `sanitize_title()` |
| M1 | `mcp_config.json` | Estructura | 🟡 Medio | Agregar a `.gitignore` |
| M2 | Varios JSON | Privacidad | 🟡 Medio | Anonimizar datos del cliente |
| M3 | `README.md` | Documentación | 🟡 Medio | Actualizar sección de archivos locales |
| M4 | `fase3_deploy.js` | Bug potencial | 🟡 Medio | Verificar y aplicar fix de INJECT_SECRET |
| M5 | `auth_helper.php` | Seguridad | 🟡 Medio | Agregar rate limiting con transients de WP |
| B1 | `.env.example` | Naming | 🔵 Bajo | Documentar diferencia entre tokens |
| B2 | `sync_and_inject.js` | Seguridad | 🔵 Bajo | Eliminar opción `rejectUnauthorized` configurable |
| B3 | Todos los `.js` | Calidad | 🔵 Bajo | Agregar `'use strict'` |
| B4 | `logs/` | Privacidad | 🔵 Bajo | Agregar a `.gitignore` con `.gitkeep` |
| B5 | `exports/` | Privacidad | 🔵 Bajo | Agregar a `.gitignore` con `.gitkeep` |

---

## INSTRUCCIONES PRECISAS PARA CLAUDE

### Orden de ejecución recomendado:

**PASO 1 — Limpieza Git (ejecutar en terminal, no edición de código):**
```bash
git rm --cached screen_map.json memoria_estado.md
# Si page_manifest.json se va a mover a .gitignore:
# git rm --cached page_manifest.json
```

**PASO 2 — Actualizar `.gitignore`** (agregar al final del archivo existente):
```
# Archivos locales de proyecto — NO commitear
screen_map.json
memoria_estado.md
logs/
exports/
mcp_config.json

# Mantener ejemplos
!screen_map.example.json
!page_manifest_example.json
!mcp_config.example.json
```

**PASO 3 — Corregir TODOS los PHP scripts** (aplicar a cada archivo en `scripts/`):
Eliminar las líneas 2-4 del inicio de cada PHP (el bloque roto con `= file_exists...` + `require_once()` vacío + `verify_api_token()`).
Cambiar `ini_set('display_errors', 1)` a `ini_set('display_errors', 0)`.

**PASO 4 — Corregir `sync_and_inject.js`:**
Agregar `const INJECT_SECRET = process.env.INJECT_SECRET || '';` en el bloque de declaración de variables (después de `WP_SCRIPT_TOKEN`).

**PASO 5 — Corregir `deep_diagnose.php`:**
Reemplazar el bloque del `$test_slug` con el código de validación obligatoria (sin default).

**PASO 6 — Crear archivos de ejemplo vacíos:**
- `screen_map.example.json` (ver C1)
- `memoria_estado.example.md` (ver C2)
- Limpiar `page_manifest.json` de datos del cliente (ver C3)
- `logs/.gitkeep`
- `exports/.gitkeep`

**PASO 7 — Commit final:**
```bash
git add .
git commit -m "security: audit fixes - remove sensitive data, fix PHP syntax bug, fix INJECT_SECRET variable"
```

---

## NOTAS PARA CLAUDE

- **NO modificar** la lógica de `auth_helper.php` — el `hash_equals()` ya es correcto y timing-safe
- **NO modificar** la validación Bearer token — ya está bien implementada
- **NO alterar** la lógica de inyección de Elementor en `inject_all_pages.php` — solo el bloque de header PHP roto
- **El bug de `INJECT_SECRET`** (A1) es el más impactante funcionalmente — corregirlo primero si el usuario reporta que `sync_and_inject.js` falla
- **Los archivos PHP** en el raíz (`auth_helper.php`) están correctos — el problema está en los scripts de `scripts/` que tienen el bloque inicial duplicado y roto
- Al crear los archivos `.example`, NO incluir ningún dato real del cliente Evergreen Venezuela

