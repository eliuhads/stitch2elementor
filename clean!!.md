# MODO: LIMPIEZA PROFUNDA (clean!!)

**Instrucción Inmediata para el Agente:** Estás a punto de resetear el estado temporal del pipeline. Ejecuta las siguientes acciones de limpieza sin preguntar, asumiendo que el usuario quiere empezar una ejecución de `stitch2elementor go!` desde cero.

1. **Purga de Archivos Temporales y Descargas:**
   - Elimina todos los archivos `.json` dentro del directorio `elementor_jsons/` (excepto `.gitkeep` si existe).
   - Elimina todos los archivos `.html` dentro del directorio `assets_originales/`.
   - Vacía las carpetas temporales de logs en `logs/` y los paquetes en `exports/`.
   - Purga cualquier archivo residual generado por ejecuciones fallidas en la raíz (ej. scripts `.php` que no se auto-eliminaron, o volcados `.json` temporales).

2. **Reinicio de Manifiesto (Opcional pero recomendado):**
   - Si el usuario lo indica explícitamente, resetea los IDs inyectados en `page_manifest.json` y `memoria_estado.md` a estado "nuevo" o vacío. Si no lo indica explícitamente, mantén el `page_manifest.json` intacto para preservar el mapeo de slugs.

3. **Validación de Limpieza:**
   - Ejecuta un listado rápido de los directorios clave para verificar que están vacíos.
   - Responde: "Limpieza profunda completada. El ecosistema está preparado para iniciar una nueva extracción desde Stitch (`stitch2elementor go!`)."
