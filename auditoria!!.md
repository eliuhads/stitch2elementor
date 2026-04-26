# MODO: AUDITORÍA ARQUITECTÓNICA Y DE SEGURIDAD (auditoria!!)

**Instrucción Inmediata para el Agente:** Al leer este documento, detén cualquier flujo de trabajo de inyección o compilación y entra en **Modo Auditor (Sólo Lectura y Diagnóstico)**. Debes ejecutar un análisis exhaustivo del ecosistema `stitch2elementor` y generar un informe de grado de producción.

Sigue rigurosamente estas 6 dimensiones de auditoría:

## 1. Auditoría de Integridad Estructural y AST
- **Verificación del Transpilador (`compiler_v4.js`)**: Analiza la lógica de parseo AST. ¿Existen validaciones para evitar colapsos al recibir HTML malformado de Stitch? ¿Está implementada correctamente la regla de Flexbox (Regla 8.6) para anchos personalizados (`_element_width: "custom"`)?
- **Validación del Output (`elementor_jsons/`)**: Selecciona una muestra aleatoria de JSON compilados (si existen). Verifica que sean arreglos planos `[{...}]` sin wrappers y que no contengan llaves internas de desarrollo (`__gridCols`, `__colSpan`).
- **Control de Mapeo de Widgets**: Revisa `docs/widget-mapping.md` contra el código actual. ¿El transpilador está usando los widgets nativos recomendados o está abusando del widget `html`?

## 2. Análisis del Perímetro de Seguridad y Credenciales
- **Escaneo de Filtraciones**: Rastrea todo el repositorio (incluyendo `.agent/`, `scripts/`, `logs/` y archivos `.md`) en busca de:
  - Tokens JWT o Passwords de aplicación (`XXXX XXXX XXXX XXXX`).
  - Credenciales de servidores FTP o URLs de producción harcodeadas.
- **Validación de Entorno**: Confirma que el `.gitignore` está excluyendo agresivamente `mcp_config.json`, `.env`, `memoria_estado.md`, `page_manifest.json` y la carpeta `logs/`.
- **Destrucción de Carga Útil**: Revisa en `sync_and_inject.js` si la lógica de auto-eliminación de los scripts PHP inyectados en el servidor remoto es segura (¿Se eliminan siempre, incluso si la inyección de la BD falla?).

## 3. Revisión de Lógica de Despliegue (WordPress Sync)
- **ID Shifting y Caché**: Comprueba que todos los pipelines en `sync_and_inject.js` terminen obligatoriamente en una llamada a `flush_cache.php` (Regla 8.18). 
- **Inyección de Theme Builder**: Verifica que `create_hf_native.php` asigne correctamente las `elementor_pro_theme_builder_conditions` a IDs de post válidos, y no genere bucles iterando tipos de strings (Regla 8.1).
- **Control de Rutas**: Valida que `page_manifest.json` tenga un formato estandarizado para evitar errores 404.

## 4. Auditoría de Deuda Técnica y Código Legacy
- **Archivos Huérfanos**: Busca scripts en la carpeta raíz o en `scripts/` que ya no se mencionen en el flujo operativo de `SKILL.md` o que tengan funciones duplicadas.
- **Eficiencia del Código**: Identifica "Cuellos de botella" lógicos en la manipulación de arreglos grandes o bucles síncronos innecesarios en Node.js que puedan causar tiempos de espera (timeouts) en el MCP.

## 5. Alineación de Estilo y Cumplimiento de Políticas
- **Language Policy**: Asegúrate de que las respuestas proyectadas por los scripts CLI (console.logs) mantengan un formato coherente (inglés para logs técnicos, español para reportes al usuario).
- **Compatibilidad con Gotchas**: Coteja los flujos automatizados contra las reglas descritas en `docs/gotchas.md`. ¿Algún script viola un principio descubierto recientemente?

---

## 6. Salida Esperada: El Reporte de Auditoría
Al finalizar la evaluación, genera un artefacto Markdown detallado en la carpeta `logs/` con la nomenclatura `REPORTE_AUDITORIA_ARQUITECTURA.md`. 
Estructura el documento en las siguientes categorías:

1. 🔴 **CRÍTICO (Riesgo de Crash/Seguridad)**: Problemas que romperían el despliegue o filtran datos.
2. 🟠 **ADVERTENCIA (Deuda Técnica/Incongruencia)**: Lógica deprecada, duplicidades o desviaciones de los *gotchas*.
3. 🔵 **OPORTUNIDAD DE MEJORA (Performance/Limpieza)**: Sugerencias de refactorización o estandarización.

> **Acción del Agente**: Una vez escrito el reporte, presenta al usuario un resumen ejecutivo corto y pregúntale por cuál de los hallazgos críticos o advertencias desea empezar a trabajar. No hagas cambios automáticos durante la fase de auditoría.
