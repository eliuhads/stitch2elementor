---
name: stitch2elementor
version: 4.7.0
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
  3. node scripts/compiler_v4.js → 20 JSONs + header.json + footer.json en elementor_jsons/
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
5.  **CALIDAD DEL MODELO STITCH Y RESPONSIVIDAD**: Al llamar a `generate_screen_from_text` o `edit_screens`, **SIEMPRE** debes pasar los argumentos `modelId: GEMINI_3_PRO` (o superior) y `deviceType: DESKTOP`. Queda terminantemente prohibido usar los modelos por defecto (Simple/Flash) o permitir que las pantallas se generen en dimensiones de celular (MOBILE) por defecto.
6.  **CHECKPOINT OBLIGATORIO**: Tras completar cada paso individual, escribe `pipeline_state.json` antes de continuar. Si el pipeline se interrumpe, el trigger `conti!!` (ver `CONTI!!.md`) reanuda desde el último checkpoint.
7.  **VERIFICACIÓN DE SKILLS HERMANOS EN FASE -1**: Comprueba existencia de `webp-optimizer`, `Agentic-SEO-Skill` y `ui-ux-pro-max` en el directorio de skills del agente. Si alguno falta, notifica al usuario con: `⚠️ Skill [nombre] no encontrado. La fase [X] se ejecutará sin él.` Continúa el pipeline; no abortes por un skill faltante.
8.  **OUTPUT LOCAL ANTES DE INYECTAR**: Guarda cada JSON compilado en `output/[nombre-pagina].json` antes de inyectarlo en WordPress. Esto permite reanudar desde FASE 3 sin recompilar si hay un corte.

## 4. Skills Transversales

- **enhance-prompt**: Refinamiento de directivas para Stitch (usado en modo `go!` y `segment!`). 
- **html2json-segment**: Utilidad para transpilación de un componente único.
- **html-to-elementor** (consolidado en docs/widget-mapping.md): Mapeo principal HTML a JSON.
- **Agentic-SEO-Skill**: Validación on-page post-migración.

### 4.1 Inventario de Scripts (`scripts/`)

| Script | Tipo | Función |
|---|---|---|
| `scripts/compiler_v4.js` | Node.js | Transpiler principal HTML → Elementor JSON |
| `sync_and_inject.js` | Node.js | Orquestador FTP+HTTP: sube, inyecta, limpia |
| `maintenance_only.js` | Node.js | **Modo Config-Only**: Realinea Homepage + flush caché SIN re-inyectar contenido |
| `create_hf_native.php` | PHP | Crea Header/Footer como `elementor_library` con conditions globales |
| `flush_cache.php` | PHP | Regenera CSS, sincroniza biblioteca, flush permalinks |
| `fix_material_symbols.js` | Node.js | Purga spans textuales de iconos Material |
| `fix_slugs.js` | Node.js | Regulariza rutas REST según manifest |
| `download_all_htmls.js` | Node.js | Batch download de HTMLs desde Stitch CDN a `assets_originales/` |
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

1.  **Inyección Nativa de Clamp**: El `compiler_v4.js` inyecta fórmulas `clamp(...)` a nivel widget. Esto garantiza responsividad inmediata sin depender del Global Kit.
2.  **Grid-to-Flex Engine (v4.5+)**: El compilador integra un conversor de `grid-cols-X` y `col-span-X` de Tailwind a anchos porcentuales de Elementor (`_width`). Si el layout colapsa, verifica que el contenedor padre tenga `flex-direction: row` y `flex-wrap: wrap`.
3.  **Ancho de Elemento 'Custom'**: Para evitar que las columnas colapsen en Elementor Flexbox, el compilador debe forzar `_element_width: "custom"` en los widgets internos.
4.  **Sincronización vía PHP (Carrier Script)**: Debido a que el WP REST API bloquea el acceso al "Default Kit" (ID 8) con error `401 Forbidden`, se debe utilizar un script inyector PHP robusto (`robust_inject.php`) para sincronizar el BrandBook en la base de datos una sola vez al inicio del proyecto.
5.  **Flujo de Imágenes (Stitch → WordPress)**:
   - Las imágenes provienen **única y exclusivamente** de Google Stitch (URLs tipo `lh3.googleusercontent.com/*`).
   - El script `inject_all_pages.php` detecta estas URLs en los JSONs inyectados y las registra en la WordPress Media Library usando `media_sideload_image()` de forma nativa.
   - **No se usan carpetas locales de imágenes ni IMAGENES_FUENTES**. Solo se admite el logo del sitio en formato SVG dentro de `INFO_BrandBook/`. Utilizar imágenes locales de referencia como relleno causa graves deformaciones en la estructura de Elementor. No se descarga, comprime ni sube manualmente ningún otro asset de imagen.
   - **Vía Autónoma Híbrida (VÍA POR DEFECTO ESTRICTA)**: Ejecutar `scripts/sync_and_inject.js` que transporta el JSON vía FTP, inyecta el PHP actuante y lo dispara remotamente (`curl` / `fetch`) para que WordPress procese el sideload de media directamente desde las URLs de Stitch. El script Node auto-destruye el PHP por seguridad perimetral.

### 7.1 Inyección de Theme Builder (Header / Footer)
Nunca crees páginas estándar para el Header o el Footer. Utiliza de forma obligatoria el script `scripts/create_hf_native.php`. Este script hace lo siguiente:
1. Inyecta los JSON bajo el Custom Post Type interno de Elementor: `elementor_library`.
2. Asigna las llaves `_elementor_template_type` como `header` y `footer`.
3. **Mapeo de Menú Robusto**: Auto-descubre e inyecta el ID del Menú Nativo (fallback sequence: 'Ppal Desktop' -> 'Main Menu' -> First available). **Si el menú está vacío, debe auto-poblarse usando `wp_update_nav_menu_item()`**, ya que un menú sin ítems hará que el widget `nav-menu` desaparezca del frontend.
4. **Header Restoration (Protocolo de Fidelidad)**: Ante regresiones en el header, redirige la compilación para usar `header-global.html` como fuente canónica. Esto asegura que la barra de utilidades, el menú dinámico y el logo mantengan la estructura de la Kinetic Monolith.
5. **Diseño Premium Boxed**: Los headers deben seguir la jerarquía `Container (Full Width) > Container (Boxed 1200px)`.
6. **Logo Constraint**: El logo horizontal debe ser forzado a `192px` de ancho para evitar distorsiones visuales.
7. Sobrescribe la opción maestra `elementor_theme_builder_conditions` en la tabla `wp_options` y **OBLIGATORIAMENTE** el meta field `_elementor_conditions` con un arreglo plano `['include/general']`.
8. **Limpieza de Transients**: Elimina `elementor_conditions_cache` y `elementor_pro_condition_cache` para forzar que Elementor lea las nuevas reglas.

### 7.2 Rutina Final Obligatoria de Limpieza y Sincronización (Cache Flush & Config)

> **⚠️ ESTE PASO ES OBLIGATORIO TRAS TODA INYECCIÓN** — es la segunda mitad del Protocolo "AHORA SÍ" (ver sección anterior). Sin este paso, la Homepage queda desalineada por ID Shifting.

Todo pipeline de inyección, modificaciones globales o migración debe FINALIZAR obligatoriamente disparando el script `scripts/flush_cache.php` de forma remota pasándole los **NUEVOS** IDs (capturados post-inyección, no los anteriores). Dicho script dispara de forma nativa los siguientes métodos de WordPress/Elementor:
1. `flush_rewrite_rules(false)`: Para refrescar los Enlaces Permanentes.
2. **Configuración de Front Page**: Establece automáticamente `page_on_front` y `page_for_posts` según el `page_manifest.json` (Parámetros `home_id` y `blog_id`). **Los IDs deben estar actualizados en el manifest ANTES de ejecutar este script.**
3. `\Elementor\Plugin::$instance->files_manager->clear_cache()`: Regenerar todo CSS asíncrono y limpiar data estática (Clear Files & Data).
4. `\Elementor\Api::get_library_data(true)`: Forzar sincronización remota de biblioteca Elementor.
Esto garantiza que los cambios de Base de Datos se reflejen en DOM inmediato y la navegación sea funcional. No consultes al usuario antes de hacer esto; asúmelo como parte obligatoria del ciclo de inyección.

## 8. Reglas Aprendidas (Producción — 2026-04-23)

> Estas reglas fueron descubiertas durante migraciones reales y corregidas 2+ veces.
> Son **OBLIGATORIAS** — no son sugerencias.

### 8.1 MCPs NO acceden a `elementor_library`
Los MCPs `wp-elementor-mcp` y `elementor-mcp` **solo operan con `posts` y `pages`**. Los Theme Builder templates (`elementor_library`) son **INVISIBLES** para ambos MCPs. **SIEMPRE** crear Header/Footer templates usando el pipeline FTP→PHP (`create_hf_native.php`), nunca vía MCP.

### 8.2 REST API no permite `_elementor_*` meta fields
La REST API de WordPress (via Application Passwords) **NO permite** escribir meta fields protegidos con prefijo `_` como `_elementor_data`, `_elementor_template_type`, `_elementor_edit_mode`. Siempre retorna 403. **Usar `update_post_meta()` via PHP directo.**

### 8.3 MCP `elementor-mcp` NO setea `_elementor_edit_mode`
Al inyectar vía `update_page_from_file`, las páginas reciben el contenido Elementor pero **NO** se marca `_elementor_edit_mode = 'builder'`. Esto hace que WordPress las trate como páginas normales. **Solución**: Ejecutar un PHP batch post-inyección que setee este meta field, o instruir al usuario para convertirlas manualmente en wp-admin.

### 8.4 NUNCA usar `node -e` inline en PowerShell
PowerShell corrompe backticks, `${}`, `>`, pipes y comillas anidadas en comandos `node -e`. **SIEMPRE** crear un script `.js` separado para cualquier operación que no sea trivial (más de 1 línea).

### 8.5 `read_url_content` falla con WAF (406)
Hostings con ModSecurity/WAF bloquean requests sin User-Agent de navegador real. `read_url_content` recibe 406. **Alternativa**: Verificar via REST API autenticada (`GET /wp-json/wp/v2/pages/{id}`) o MCP tools.

### 8.6 Pre-flight: Validar FTP antes del pipeline
Las credenciales FTP cambian sin aviso. **ANTES** de iniciar cualquier pipeline que requiera FTP, hacer un test de conexión. Si falla, pedir credenciales actualizadas al usuario **inmediatamente**, no después de 5 intentos fallidos.

### 8.7 Pipeline Gold Standard: FTP → PHP → HTTP → Cleanup
El patrón más confiable para operaciones server-side es:
1. Subir script PHP via FTP
2. Ejecutar via HTTP con secret key (`?key=xxx`)
3. Capturar output
4. Eliminar PHP via FTP (seguridad)

Scripts de referencia: `run_hf_injection.js`, `run_flush_cache.js`.

### 8.8 Formato Estricto de _elementor_conditions
El meta field `_elementor_conditions` en plantillas de Theme Builder **DEBE** ser un array plano (ej. `['include/general']`). Si se pasa un array asociativo o multidimensional, Elementor ignorará la plantilla. Siempre limpia los transients de cache de condiciones (`elementor_conditions_cache` y `elementor_pro_condition_cache`) vía PHP tras actualizar estas reglas.

### 8.9 Parseo Case-Insensitive y Exclusión de HF en el Transpilador
Google Stitch a menudo exporta etiquetas HTML con casing inconsistente (ej. `<MAIN>` en lugar de `<main>`). El transpilador local (`compiler_v4.js`) **DEBE** utilizar `toLowerCase()` al evaluar `tagName`. Adicionalmente, el transpilador **debe excluir explícitamente** las etiquetas `<header>` y `<footer>` al procesar los children del `<body>` para el contenido de la página. Si no se excluyen, el menú y el pie de página quedarán duplicados visualmente (una vez por el Theme Builder y otra vez incrustados dentro del contenido de la propia página).

### 8.10 Arquitectura de Inyección Maestra V3 (Batch PHP)
Evita inyectar las páginas una por una a través del REST API. La manera más robusta descubierta (V3) es crear un script PHP (`inject_all_pages.php`) que:
1. Declare el array completo de páginas y sus relaciones jerárquicas (parent/child).
2. Purgue proactivamente los duplicados (ignorando la papelera, borrado forzado).
3. Cree las páginas nativamente usando `wp_insert_post` y asigne `_elementor_data` directamente.
4. Se dispare con una sola llamada HTTP desde Node.js, ahorrando tiempo y evitando bloqueos de permisos API o cuellos de botella de red.

### 8.11 Inyección de Global Design System (Kit Elementor)
No dependas de que el usuario configure los colores y fuentes globales a mano. Puedes inyectar el **Sistema de Diseño** completo modificando la meta del Kit por defecto (generalmente ID `8` o el ID devuelto por `get_option('elementor_active_kit')`). Inserta los arreglos `system_colors` y `system_typography` directamente en el meta `_elementor_page_settings` vía PHP.

### 8.12 Asignación Estricta de Plantillas (`_wp_page_template`)
- **Páginas Estándar**: El meta `_wp_page_template` debe ser `elementor_header_footer`. Esto permite que el Theme Builder enganche los headers y footers.
- **Templates de Header/Footer**: El meta `_wp_page_template` dentro del CPT `elementor_library` debe ser **`elementor_canvas`**. Si lo omites o le pasas `elementor_header_footer`, corres el riesgo de anidamiento recursivo.

### 8.13 Configuración Programática del Sitio
No le pidas al usuario configurar la página de inicio o el blog. Hazlo directamente por DB en tu script maestro de inyección:
```php
update_option('show_on_front', 'page');
update_option('page_on_front', $home_id);
update_option('page_for_posts', $blog_id);
```
Adicionalmente, después de tocar la DB, **siempre** purga el caché nativo de CSS de Elementor: `\Elementor\Plugin::$instance->files_manager->clear_cache();`

### 8.14 Prohibición de Carpetas Locales de Imágenes (`IMAGENES_FUENTES`)
**NUNCA** utilices ni dependas de carpetas locales como `IMAGENES_FUENTES` para el diseño. El uso de assets locales insertados artificialmente deforma los layouts de Elementor (rompe flexbox y contenedores). 
**Solución Definitiva**: El pipeline de manejo de imágenes debe restringirse **únicamente** a utilizar logos en formato **SVG** almacenados en el directorio `INFO_BrandBook/`. El resto del contenido visual se procesa de manera automatizada en el pipeline de Google Stitch → WordPress (auto-sideload de `lh3.googleusercontent.com` vía PHP). Esto evita sobreescrituras locales de assets que afecten la integridad estructural del diseño.

### 8.15 Estructura Estricta de elementor_pro_theme_builder_conditions
El nombre correcto de la opción en DB es `elementor_pro_theme_builder_conditions`. Elementor Pro itera sobre este array asumiendo que las claves de primer nivel son **IDs numéricos (Post IDs)** correspondientes a las plantillas (`$page_id`).
**NUNCA agrupes por tipo de template (`$tmpl_type`)** (ej. `'header' => [ 1418 => [...] ]`). Esto causará un **Fatal Error (Crash 500) global** en todo el sitio porque Elementor Pro intentará leer un string como ID.
**Estructura correcta obligatoria:**
```php
$conditions[$page_id] = [
    [ 'type' => 'include', 'name' => 'general', 'sub_name' => '', 'sub_id' => '' ]
];
update_option('elementor_pro_theme_builder_conditions', $conditions);
```

### 8.16 Bypass SHORTINIT para Errores Fatales de Elementor
Si inyectas una opción corrupta que crashea Elementor Pro (como el caso 8.15), cualquier script HTTP estándar que haga `require_once('wp-load.php')` **fallará** devolviendo 500, porque `wp-load.php` inicializa los plugins. Para enviar un script de rescate (ej. `delete_option(...)`), debes obligatoriamente usar la constante `SHORTINIT` antes de cargar el core. Esto previene que Elementor se ejecute y permite manipular la BD con seguridad.

### 8.17 Flexbox Item Custom Width (Regla Crítica Elementor V4)
En la nueva estructura de Contenedores Flexbox de Elementor (V3.16+ / V4), si configuras un porcentaje de ancho a un contenedor hijo (ej. mapear `w-1/2` a `width: 50%`), **NO ES SUFICIENTE** con pasar la propiedad `width`. Si omites el declarador de activación, Elementor confundirá la propiedad `width` con el "Boxed Width" interno y el contenedor hijo colapsará a 0 o al tamaño de su contenido.
**Solución Estricta**: Cada vez que se defina un custom `width` en el objeto `settings` de un contenedor o widget para flex, debes acompañarlo obligatoriamente de `_element_width: "custom"`.
Ejemplo:
```javascript
settings: {
  _element_width: "custom",
  width: { unit: "%", size: 50, sizes: [] }
}
```

### 8.18 Estabilidad de Colores de Fondo (Backgrounds)
Elementor puede ignorar formatos de color como `rgba(11, 15, 26, 0.95)` en la propiedad `background_color` al inyectar JSONs nativamente si el Theme Builder o los Global Colors entran en conflicto. Cuando mapees fondos para secciones críticas (como Headers transparentes oscuros o Footers), **usa siempre códigos hexadecimales literales (ej. `#0B0F1A` o `#0B0F1AF2`)** para asegurar que el motor interno no descarte la propiedad y renderice los contenedores en blanco por defecto.

### 8.19 Header: Parsear `header-global.html` como fuente canónica
`processNavAsHeader` **DEBE** buscar `$('header').first()` (no `$('nav').first()`) porque `header-global.html` envuelve la navegación dentro de un `<header>` con utility bar + main nav row. Si solo buscas `<nav>`, pierdes la estructura completa (utility bar, CTA, logo). **Fallback**: si no existe `<header>`, usa `<nav>` del homepage. Además, **NUNCA** inyectes `_position: 'fixed'` ni `z_index: 999` en el JSON del header — Elementor Theme Builder gestiona sticky/fixed nativamente vía sus propios controles de Motion Effects.

### 8.20 Grid-to-Flex: `col-span-N` debe resolver a porcentajes proporcionales
La extracción de `grid-cols-N` y `col-span-N` en `extractContainerSettings` genera marcadores internos `__gridCols` y `__colSpan`. Estos **DEBEN** resolverse al procesar los hijos del grid container: `width = Math.round((colSpan / gridCols) * 100)%`. Sin esto, el Hero Section colapsa porque todos los hijos reciben el mismo ancho uniforme `100/N%` ignorando sus spans reales. Ejemplo: `grid-cols-12` + `col-span-8` → `67%`, `col-span-4` → `33%`. Limpia los marcadores internos (`delete settings.__colSpan`) antes de serializar el JSON.

### 8.21 Nav-Menu: Slug de menú obligatorio (`menu: 'ppal-desktop'`)
El widget `nav-menu` de Elementor **REQUIERE** la propiedad `menu` con el slug exacto del menú WordPress (ej. `'ppal-desktop'`). Sin esta propiedad, Elementor selecciona el primer menú disponible o no renderiza nada. Confirma el slug correcto en wp-admin → Apariencia → Menús antes de hardcodearlo en el compilador.

### 8.22 FontLoader: NO inyectar contenedores HTML con `<link>` y `<style>` globales
El `buildFontLoader()` (contenedor con widget `html` que carga Font Awesome, Google Fonts y Material Symbols) **interfiere destructivamente** con el Theme Builder de Elementor. Al inyectarse como último elemento del `_elementor_data`, empuja el DOM, rompe anchos Flexbox del Header global y genera conflictos CSS. **Solución**: desactivar `buildFontLoader()` en el compilador. Las fuentes deben cargarse via Elementor → Site Settings → Custom Fonts o via `functions.php` del tema hijo.

### 8.23 WAF Bypass Activo (User-Agent Spoofer)
Herramientas automatizadas o scripts Python/Node reciben 406 Not Acceptable por ModSecurity WAF. **Solución:** Siempre inyectar headers emulando un navegador real (ej. `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`) en peticiones HTTP al servidor de producción.

### 8.24 Optimización Semántica Pre-Transpilación
Antes de ejecutar `compiler_v4.js`, purga y optimiza masivamente el HTML crudo descargado de Stitch usando utilidades tipo Cheerio (ej. `clean_all_html.js`). Esto permite inyectar dinámicamente `alt` fallbacks (desde `data-alt`), aplicar `loading="lazy"` a imágenes non-hero, y regularizar `<H1>`, heredando estas mejoras orgánicamente en el JSON final sin modificar la lógica pesada del compilador.

### 8.25 Inyección Aislada (Evitando ID Shifting)
Para actualizar una **única página** sin desencadenar un ID Shifting masivo mediante `sync_and_inject.js`, usa el MCP de Elementor (`mcp_elementor-mcp-EVERGREEN_update_page_from_file`) pasando el `pageId` actual (obtenido por slug). Esto preserva el ID de Base de Datos y evita tener que remapear `home_id` o vaciar el caché repetidamente.

---

## 9. Control de Calidad Final

-   **Tolerancia Cero**: Si un script interno de post-procesamiento arroja una excepción, **detén inmediatamente el pipeline**. No prosigas ignorando el fallo; diagnostica y repara.
-   **Garantía de Fidelidad**: El Output Inyectado siempre debe garantizar la ausencia de "Material Symbol text-spans", estar provisto de un "design system" robusto (con su `clamp()` incrustado) y purgado de recursos volátiles.

## 10. Documentos de Operación Asistida (Prompts de Utilidad)

En la raíz del proyecto existen varios archivos `.md` con el sufijo `!!` (ej. `actual!!.md`, `clean!!.md`). Estos **NO se ejecutan automáticamente** ni son scripts. Son **Plantillas de Prompt (Prompt Templates)** diseñadas para estandarizar operaciones complejas del Agente IA.

Para usarlos, el usuario simplemente debe pedírselo al agente (Ej: *"ejecuta clean!!.md"* o *"aplica auditoria!!.md"*). El agente leerá el documento y ejecutará las instrucciones paso a paso detalladas en él.

*   **`actual!!.md`**: Ejecútalo al final de una sesión de trabajo para forzar al agente a extraer el conocimiento empírico adquirido (learnings, bugs resueltos) y actualizar la documentación del proyecto y GitHub.
*   **`auditoria!!.md`**: Ejecútalo para forzar al agente a realizar un chequeo completo y exhaustivo del SEO, enlaces rotos, estructura de etiquetas y performance tras una migración.
*   **`clean!!.md`**: Ejecútalo para realizar una limpieza profunda del espacio de trabajo (archivos temporales, scripts obsoletos) y del entorno de WordPress (caché, transitorios, etc.).
*   **`continue!!.md`**: Ejecútalo al iniciar una nueva sesión para que el agente lea rápidamente el contexto anterior, los objetivos pendientes y retome el flujo de trabajo sin perder tiempo.
*   **`MAINTENANCE.md`**: Referencia técnica (no prompt directo) para tareas de mantenimiento de la sincronización de Elementor sin necesidad de re-inyectar.
