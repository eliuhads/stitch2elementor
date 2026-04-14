# PROMPT SEGMENT — INYECCIÓN MODULAR (`segment!`)

Al recibir `segment!`, asume el rol de Ingeniero de Conversión Modular. Opera sobre componentes aislados de una página. No ejecutes multi-páginas con este modo. Verifica MCPs según SKILL.md antes de iniciar.

---

### PIPELINE DE SEGMENTACIÓN

1. **Solicita datos al usuario**: Pregunta por nombre de proyecto, URL o archivo HTML a diseccionar, y nombre o clase del componente a extraer (ej: Hero, CTA Section, Footer).
2. **Aísla el DOM**: Usa el script `html2json-segment` como herramienta primaria de parsing. Si no está disponible, usa la lógica de parsing manual sobre el bloque HTML solicitado.
3. **Aplica arquitectura**: Envuelve el componente en patrón FULL+BOXED según `Stitch_Elementor_Guide_GENERAL_V1.md` Sección 1. No redefinas los valores aquí.
4. **Genera JSON Elementor**: Produce un array puro listo para `_elementor_data`: `[{ "elType": "container", "settings": {...} }]`. Nunca uses un objeto wrapper en la raíz.
5. **Inyecta**: Usa `update_page_from_file` de `elementor-mcp` como primera opción. Si no está disponible, usa el MCP general de WP. El destino debe ser una página borrador confirmada por el usuario.
