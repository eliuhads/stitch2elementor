# MODO: ACTUALIZACIÓN Y CIERRE (actual!!)

**Instrucción Inmediata para el Agente:** Al ejecutar este archivo, debes seguir estos pasos para asimilar y preservar el conocimiento adquirido durante la sesión de trabajo.

1. **Extracción de Conocimiento Empírico:**
   - Revisa el historial de la conversación actual.
   - Identifica cualquier error resuelto, bug parcheado, regla de compatibilidad descubierta (ej. comportamiento de WordPress, Elementor o Flexbox), o atajo operacional.
   - Extrae este conocimiento y añádelo formalmente a las secciones correspondientes del archivo `SKILL.md` (o `docs/gotchas.md` si es un edge case específico).

2. **Revisión de `memoria_estado.md`:**
   - Asegúrate de que el archivo `memoria_estado.md` refleje el estado exacto en el que dejas el proyecto: Última acción realizada, contexto actual claro, y el paso siguiente bloqueante o pendiente.

3. **Ejecución de Repositorio (Git Push):**
   - Haz un stage (`git add`) de todos los archivos modificados que no estén en la lista de exclusión (evitar archivos sensibles como `mcp_config.json`, `.env`, `memoria_estado.md`, `page_manifest.json`, y logs).
   - Crea un commit con un mensaje semántico describiendo las actualizaciones (ej. `docs(skill): update learned rules for flexbox`).
   - Sube los cambios al repositorio remoto (`git push`).

4. **Notificación Final:**
   - Responde con un resumen de los aprendizajes documentados y confirma que los cambios han sido subidos al repositorio. Escribe la palabra clave `CHECKPOINT`.
