**comando: segment!** (Activa el Modo Modular / Web Maestro para correcci贸n minuciosa).

**OBJETIVO ESTRICTO:** 
Ejecutar una migraci贸n de **fidelidad absoluta (100%)** 脷NICAMENTE para la p谩gina **Homepage** desde Google Stitch hacia WordPress Elementor. La exportaci贸n anterior tuvo diferencias con el modelo HTML original, por lo que requiero una conversi贸n impecable por partes.

**FASES DE EJECUCI脫N AUT脫NOMA Y SECUENCIAL:**

1. **Pre-Flight Check & Contexto:**
   - Verifica disponibilidad de los MCPs (`elementor-mcp-EVERGREEN`, `wp-elementor-mcp-EVERGREEN`, `StitchMCP`).
   - Lee `PROMPT_SEGMENT.md` y la Secci贸n 1 de `Stitch_Elementor_Guide_GENERAL_V1.md` (Patr贸n FULL+BOXED) desde la subcarpeta `stitch2elementor/` para asegurar que las proporciones del dise帽o sean id茅nticas.

2. **Limpieza del Entorno WP:**
   - Obt茅n el ID de la p谩gina "Homepage" en WordPress.
   - Restablece/Limpia su data en Elementor (o sobrescribe su contenido por completo a un estado en blanco) para garantizar que los contenedores rotos de la exportaci贸n previa no interfieran.

3. **Extracci贸n Nativa del HTML (Homepage):**
   - Descarga de nuevo el c贸digo fuente HTML puro de la Homepage desde Stitch.
   - **REGLA INQUEBRANTABLE:** Usa exclusivamente `curl` o `Invoke-WebRequest` mediante terminal. **NUNCA** uses `read_url_content` (esto reduce el DOM a Markdown y destruye las clases Tailwind). 
   - Respeta y mant茅n absolutamente intactas las URLs de las im谩genes y assets fotogr谩ficos origines (`lh3...`).

4. **Transpilaci贸n e Inyecci贸n Modular (Por Partes):**
   - Utiliza `html2json-segment` o `compiler_v4.js` para parsear y convertir el HTML en segmentos JSON compatibles con Elementor.
   - **Regla Estructural:** Envuelve estrictamente el _elementor_data final bajo el patr贸n FULL+BOXED (`[{ "elType": "container", "settings": {...} }]`). Nada de "wrappers" adicionales en la ra铆z.
   - Inyecta los componentes transpilados SECUENCIALMENTE a la Homepage en WordPress usando `update_page_from_file` o la inserci贸n del `elementor-mcp`. Espera el HTTP 200 de 茅xito tras cada inyecci贸n antes de aplicar la siguiente pieza.

5. **Ajustes de Interfaz Final:**
   - Garantiza que los iconos no se rendericen como texto (elimina los text-spans de Material Symbols si los hay).
   - Verifica que los CTAs (Botones) no est茅n rotos ni carezcan de URL/Color originario.

*(Nota Final: Ejecuta esto de forma rigurosa, no abras navegadores locales bajo ninguna circunstancia, ap贸yate netamente en herramientas MCP, manipulaci贸n de archivos y terminal shell. Detente si ocurre un fallo. SOLO procesa la Homepage).* 隆Adelante!

### REGLA DE CARPETAS
Siempre al generar, descargar o guardar archivos aseg鷕ate de ubicarlos en la subcarpeta correcta seg鷑 su tipo:
- JSONs de Elementor -> elementor_jsons/
- HTML/Crudos de Stitch -> assets_originales/
- Im醙enes y assets optimizados -> fotos_web/
- Exports finales -> exports/
- Registros de error/ejecuci髇 -> logs/

