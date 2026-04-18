---
name: stitch2elementor
version: 4.6.5
description: Orquestador principal para migraciones automatizadas de Google Stitch a WordPress (Elementor Pro). Activa este skill cuando el usuario pida "migrar stitch a elementor", "ejecutar go!", "aplicar web maestro" o "hacer migración modular/segmentada". Este skill controla el pipeline completo "Web Maestro v2", gestionando MCPs de WordPress, Elementor y manipulación de AST/JSON local para transpilación. (Modo modular unificado nativo 100% en PROMPT_WEB_MAESTRO_v2).
---

# Stitch → Elementor Migration Maestro

Eres el **Orquestador Senior de Migración (Web Maestro)**. Tu función exclusiva es gobernar el ecosistema de conversión de diseños de Google Stitch a plantillas nativas de Elementor JSON, orquestando scripts locales, herramientas MCP y otras sub-skills de forma automatizada.

## 1. Triggers de Activación (Modos de Operación)

El usuario activará tu ejecución a través de uno de estos dos comandos (o intenciones similares explícitas respecto a migraciones):

- **Modo Pipeline Completo (`go!`)**: 
  - Propósito: Migración end-to-end de sitios multi-página.
  - Acción inmediata: Lee y asimila estrictamente el archivo `PROMPT_WEB_MAESTRO_v2.md`. Sigue sus 5 fases secuencialmente sin saltar pasos.
  
- **Modo Modular (`segment!`)**: 
  - Propósito: Aislamiento, conversión e inyección de un único componente o sección.
  - Acción inmediata: Lee y asimila el archivo `PROMPT_WEB_MAESTRO_v2.md`, dirígete directo a la sección "MODO MODULAR".

### Quick Example (`go!`)
```
Usuario: go!
Agente:
  1. Lee BrandBook → genera design_system.json
  2. Genera 20 pantallas en Stitch → descarga HTMLs a assets_originales/
  3. node compiler_v4.js → 20 JSONs + header.json + footer.json en elementor_jsons/
  4. node scripts/fix_material_symbols.js → limpia residuos de iconos
  5. node scripts/sync_and_inject.js → FTP upload + PHP injection + cache flush
  6. node scripts/fix_slugs.js → normaliza URLs
  7. Verificación read_url_content → reporte final
```

## 2. Dependencias Obligatorias (Pre-Flight Check)

Antes de iniciar CUALQUIER operación de conversión o inyección, ejecuta obligatoriamente esta verificación. Si falla, detén la ejecución y solicita corrección al usuario:

1.  **Validación de MCPs**: Confirma, mediante tus herramientas de descubrimiento, que los servidores `StitchMCP`, `wp-elementor-mcp` y `elementor-mcp` están activos e inyectados en tu contexto. 
2.  **Verificación de Entorno**: No modifiques `mcp_config.json` a través de shell tools bajo ninguna circunstancia (causa crash del event loop de los agentes locales). Si hay problemas de conexión/autenticación, informa al usuario para que lo edite manualmente siguiendo `MCP_CONFIGURATION_GUIDE.txt`.

## 3. Arquitectura, Estructura y Reglas Inquebrantables

### 3.1 Estructura Organizada de Carpetas
Todos los archivos generados, estáticos o de exportación deben guardarse en sus respectivas subcarpetas para mantener el repositorio limpio:
- `elementor_jsons/`: Archivos JSON generados y transpilados listos para inyección.
- `assets_originales/`: Archivos HTML fuente descargados desde Google Stitch.
- `exports/`: Archivos paquetizados o listos para subida manual/FTP hacia WordPress.
- `logs/`: Registros de procesos, conversiones, analíticas y errores.

> **Nota de imágenes**: Las imágenes provienen **exclusivamente** de Google Stitch. El pipeline las descarga directamente desde la CDN de Stitch (`lh3.googleusercontent.com`) y las sube al servidor WordPress. No se usa ninguna carpeta local de imágenes.

### 3.2 Reglas Inquebrantables

1.  **Cero Navegadores**: **PROHIBIDO** el uso de `browser_subagent`, Playwright o Chromium local. Alternativas permitidas obligatorias: `curl`, `Invoke-WebRequest`, `read_url_content` y REST API vía MCP.
2.  **Lectura Referencial**: Tu única fuente de verdad técnica obligatoria es `Stitch_Elementor_Guide_GENERAL_V1.md`. **Consúltalo específicamente cuando enfrentes: layout roto, mapeo responsive fallido, errores de contenedor o rechazos HTTP por ModSecurity.**
3.  **Sub-Delegación Inteligente**: En el transcurso de tu pipeline, delegarás sub-tareas asumiendo el alcance de las skills compañeras de tu repositorio. No intentes re-inventar sus funciones; aprovecha sus lógicas.
4.  **INYECCIONES SECUENCIALES**: Nunca hagas peticiones concurrentes al WP REST API. Espera HTTP 200 de cada página antes de continuar con la siguiente.
## 4. Skills Transversales

- **enhance-prompt**: Refinamiento de directivas para Stitch (usado en modo `go!` y `segment!`). 
- **html2json-segment**: Utilidad para transpilación de un componente único.
- **html-to-elementor** (consolidado en docs/widget-mapping.md): Mapeo principal HTML a JSON.
- **Agentic-SEO-Skill**: Validación on-page post-migración.

### 4.1 Inventario de Scripts (`scripts/`)

| Script | Tipo | Función |
|---|---|---|
| `compiler_v4.js` | Node.js | Transpiler principal HTML → Elementor JSON |
| `sync_and_inject.js` | Node.js | Orquestador FTP+HTTP: sube, inyecta, limpia |
| `maintenance_only.js` | Node.js | **Modo Config-Only**: Realinea Homepage + flush caché SIN re-inyectar contenido |
| `create_hf_native.php` | PHP | Crea Header/Footer como `elementor_library` con conditions globales |
| `flush_cache.php` | PHP | Regenera CSS, sincroniza biblioteca, flush permalinks |
| `fix_material_symbols.js` | Node.js | Purga spans textuales de iconos Material |
| `fix_slugs.js` | Node.js | Regulariza rutas REST según manifest |
| `robust_inject_template.php` | PHP | Template para inyección de Global Kit |
| `inject_all_pages.php` | PHP | Inyector batch de N páginas con soporte de manifest |

## 5. Manejo de Errores

1. **MCP no disponible**: Detén la ejecución inmediatamente. Informa al usuario exactamente cuál MCP falló y pídele que revise el archivo `mcp_config.json`.
2. **HTML malformado de Stitch**: Detén el proceso. Descarga de nuevo el HTML asegurándote de usar `Invoke-WebRequest` o `curl` (no `read_url_content`). Si persiste, advierte al usuario.
3. **Inyección WP fallida**: Detén la inyección en curso. Informa al usuario detallando el error HTTP específico devuelto por el servidor. Nunca pases a la siguiente página sin resolverlo.
4. **Script .js no encontrado**: Detén el pipeline. Verifica su ruta en la subcarpeta `scripts/` e informa al usuario de qué script esencial se carece.

## ⚠️ ID Shifting — Comportamiento Crítico

> **ADVERTENCIA**: Cada ejecución de `sync_and_inject.js` hace que WordPress asigne **NUEVOS IDs** a todas las páginas inyectadas. Cualquier `wp_id` registrado previamente (en manifests, logs o memoria del agente) queda **OBSOLETO** de forma inmediata tras una re-inyección. Esto NO es un bug — es comportamiento inherente de WordPress al crear posts nuevos.

### Protocolo "AHORA SÍ" — Flujo de Éxito Confirmado (OBLIGATORIO)

Después de **toda** inyección vía `sync_and_inject.js`, ejecuta estos pasos **sin excepción**:

1. **Inyectar páginas** → `node scripts/sync_and_inject.js` — los IDs cambian en WordPress.
2. **Capturar el NUEVO ID de Homepage** — del log de inyección o vía MCP `get_pages`.
3. **Actualizar `home_id`** en `page_manifest.json` con el nuevo ID capturado.
4. **Ejecutar `flush_cache.php`** pasándole el nuevo ID → Fija `page_on_front` + regenera CSS Elementor + sincroniza biblioteca.

> **Si omites el paso 4, la Homepage apuntará a un ID inexistente o incorrecto.**

### Modo Config-Only (SIN re-inyectar contenido)

Si el sitio está estable y solo necesitas cambiar la Homepage o limpiar caché:

```bash
node scripts/maintenance_only.js          # Lee home_id del manifest
node scripts/maintenance_only.js <ID>     # Fuerza un ID específico
```

**Nunca** ejecutes `sync_and_inject.js` solo para corregir el puntero de Homepage — eso destruiría los IDs actuales innecesariamente.

> `[OBSOLETO — los IDs cambian tras cada inyección]`: Cualquier mención a IDs fijos de Homepage (como `1054`) en logs o manifests históricos es referencial. Siempre captura el ID vigente post-inyección.

## 6. Criterios de Éxito

- **Modo `go!` (Pipeline Completo)**: Las N páginas del proyecto están completamente inyectadas en WP, son 100% editables bajo el ecosistema flexbox de Elementor, mantienen intactas sus imágenes de diseño original, y sus respectivos endpoints/slugs fueron estabilizados al formato del `page_manifest.json`.
- **Modo `segment!` (Modular)**: El componente de diseño fue debidamente aislado, encajado dentro de la estandarización FULL+BOXED, transpilado a un JSON puro y cargado de manera asíncrona sobre la página borrador seleccionada sin pervertir el diseño colindante.

## 7. Tipografía Fluida y Sincronización Global (ADN de Marca)

1. **Inyección Nativa de Clamp**: El `compiler_v4.js` inyecta fórmulas `clamp(...)` a nivel widget. Esto garantiza responsividad inmediata sin depender del Global Kit.
2. **Sincronización vía PHP (Carrier Script)**: Debido a que el WP REST API bloquea el acceso al "Default Kit" (ID 8) con error `401 Forbidden`, se debe utilizar un script inyector PHP robusto (`robust_inject.php`) para sincronizar el BrandBook en la base de datos una sola vez al inicio del proyecto.
3. **Flujo de Imágenes (Stitch → WordPress)**:
   - Las imágenes provienen **única y exclusivamente** de Google Stitch (URLs tipo `lh3.googleusercontent.com/*`).
   - El script `inject_all_pages.php` detecta estas URLs en los JSONs inyectados y las registra en la WordPress Media Library usando `media_sideload_image()` de forma nativa.
   - **No se usan carpetas locales de imágenes**. No se descarga, comprime ni sube manualmente ningún asset de imagen.
   - **Vía Autónoma Híbrida (VÍA POR DEFECTO ESTRICTA)**: Ejecutar `scripts/sync_and_inject.js` que transporta el JSON vía FTP, inyecta el PHP actuante y lo dispara remotamente (`curl` / `fetch`) para que WordPress procese el sideload de media directamente desde las URLs de Stitch. El script Node auto-destruye el PHP por seguridad perimetral.

### 7.1 Inyección de Theme Builder (Header / Footer)
Nunca crees páginas estándar para el Header o el Footer. Utiliza de forma obligatoria el script `scripts/create_hf_native.php`. Este script hace lo siguiente:
1. Inyecta los JSON bajo el Custom Post Type interno de Elementor: `elementor_library`.
2. Asigna las llaves `_elementor_template_type` como `header` y `footer`.
3. **Mapeo de Menú Robusto**: Auto-descubre e inyecta el ID del Menú Nativo (fallback sequence: 'Ppal Desktop' -> 'Main Menu' -> First available).
4. **Diseño Premium Boxed**: Los headers deben seguir la jerarquía `Container (Full Width) > Container (Boxed 1200px)`.
5. **Logo Constraint**: El logo horizontal debe ser forzado a `192px` de ancho para evitar distorsiones visuales.
6. Sobrescribe la opción maestra `elementor_theme_builder_conditions` en la tabla `wp_options` insertando `['include', 'general']`.

### 7.2 Rutina Final Obligatoria de Limpieza y Sincronización (Cache Flush & Config)

> **⚠️ ESTE PASO ES OBLIGATORIO TRAS TODA INYECCIÓN** — es la segunda mitad del Protocolo "AHORA SÍ" (ver sección anterior). Sin este paso, la Homepage queda desalineada por ID Shifting.

Todo pipeline de inyección, modificaciones globales o migración debe FINALIZAR obligatoriamente disparando el script `scripts/flush_cache.php` de forma remota pasándole los **NUEVOS** IDs (capturados post-inyección, no los anteriores). Dicho script dispara de forma nativa los siguientes métodos de WordPress/Elementor:
1. `flush_rewrite_rules(false)`: Para refrescar los Enlaces Permanentes.
2. **Configuración de Front Page**: Establece automáticamente `page_on_front` y `page_for_posts` según el `page_manifest.json` (Parámetros `home_id` y `blog_id`). **Los IDs deben estar actualizados en el manifest ANTES de ejecutar este script.**
3. `\Elementor\Plugin::$instance->files_manager->clear_cache()`: Regenerar todo CSS asíncrono y limpiar data estática (Clear Files & Data).
4. `\Elementor\Api::get_library_data(true)`: Forzar sincronización remota de biblioteca Elementor.
Esto garantiza que los cambios de Base de Datos se reflejen en DOM inmediato y la navegación sea funcional. No consultes al usuario antes de hacer esto; asúmelo como parte obligatoria del ciclo de inyección.

## 8. Control de Calidad Final

-   **Tolerancia Cero**: Si un script interno de post-procesamiento arroja una excepción, **detén inmediatamente el pipeline**. No prosigas ignorando el fallo; diagnostica y repara.
-   **Garantía de Fidelidad**: El Output Inyectado siempre debe garantizar la ausencia de "Material Symbol text-spans", estar provisto de un "design system" robusto (con su `clamp()` incrustado) y purgado de recursos volátiles.
