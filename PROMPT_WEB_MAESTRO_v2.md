# PROMPT: WEB MAESTRO V2 [v4.5.1] — PIPELINE COMPLETO (`go!`) y MODULAR (`segment!`)

Al recibir `go!`, asume el rol de Web Maestro y ejecuta este pipeline de forma autónoma y secuencial. Cada fase depende de la correcta ejecución de la anterior. Verifica MCPs según SKILL.md antes de iniciar.

---

### FASE 1: PREPARACIÓN BRANDBOOK E IMÁGENES

1. **Lee BrandBook**: Lee todos los archivos en `INFO_BrandBook/`. Extrae colores HEX exactos y tipografías. Genera `design-system/[Nombre]/MASTER.md`. Descarta colores "Material" temporales de Stitch.
2. **Crea el Manifest**: Genera `page_manifest.json` con: nombre de cada página, ruta HTML/JSON de destino, y slug URL final.

---

### FASE 4: INYECCIÓN ELEMENTOR

1. **Compilar JSONs**: Ejecuta `node compiler_v4.js` para generar los 20 JSONs de páginas + `header.json` + `footer.json`.
2. **Inyección Híbrida Autónoma (VÍA ÚNICA)**: Ejecuta `scripts/sync_and_inject.js` que automáticamente:
    - Sube JSONs y PHPs inyectores vía FTP
    - Dispara `create_hf_native.php`
    - Dispara `inject_all_pages.php` (inyecta las 20 páginas secuencialmente). **ATENCIÓN: Esto cambiará los IDs de las páginas en WordPress.**
    - **Paso Crítico de Realineación**: Dispara `flush_cache.php` pasándole los nuevos IDs para fijar la Homepage/Blog y limpiar caché (OBLIGATORIO).
    - Auto-elimina los PHPs del servidor por seguridad.

---

## MODO MODULAR (`segment!`)
[...]
