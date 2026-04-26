# MODO: AUDITORÍA EXHAUSTIVA (auditoria!!)

**Instrucción Inmediata para el Agente:** Al leer este documento, detén la ejecución del pipeline y realiza una auditoría completa del skill `stitch2elementor` y del repositorio actual.

1. **Auditoría de Incongruencias y Errores:**
   - Lee el `SKILL.md` y verifica que los pasos descritos coincidan con los scripts existentes en la carpeta `scripts/`.
   - Busca dependencias cíclicas, rutas de archivos que no existan, o pasos duplicados en el flujo de trabajo.

2. **Revisión de Seguridad y Credenciales:**
   - Escanea el directorio (especialmente `scripts/`, `logs/` y la raíz) en busca de credenciales filtradas (ej. tokens de Application Passwords, contraseñas FTP, o claves API hardcodeadas).
   - Asegúrate de que todos los archivos listados en el `.gitignore` y en las reglas de exclusión de commit (como `mcp_config.json` y `.env`) no estén trackeados por git.

3. **Mejoras y Estilo:**
   - Evalúa el código de los scripts principales (ej. `compiler_v4.js`, `sync_and_inject.js`) e identifica oportunidades para optimizar el rendimiento o mejorar el manejo de errores (ej. control de promesas, gestión de errores HTTP 500).
   - Verifica que el tono de las respuestas y logs cumpla con la "Language Policy" descrita en `SKILL.md`.

4. **Reporte:**
   - Genera un archivo llamado `REPORTE_AUDITORIA_[FECHA].md` en la carpeta `logs/` detallando tus hallazgos, categorizados por: Crítico, Advertencia y Sugerencia de Mejora.
   - Presenta un resumen ejecutivo en tu respuesta.
