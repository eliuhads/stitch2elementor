# 🧩 PROMPT SEGMENT — GENERACIÓN QUIRÚRGICA DE ELEMENTOR

> **¿QUÉ ES ESTE DOCUMENTO?**
> Este es el prompt de la **Arquitectura Segmentada** de Web Maestro V2. A diferencia del monolítico `PROMPT_WEB_MAESTRO_v2.md` que renderiza un proyecto completo, este archivo enseña al agente Antigravity cómo operar de manera modular, sección por sección.

---

### CÓMO ACTIVARLO (MODO USUARIO)

Simplemente copia y pega el siguiente mensaje en tu IDE Antigravity:

```text
segment!
```

---

## 🤖 INSTRUCCIONES PARA EL AGENTE (AL DETECTAR EL TRIGGER)

Cuando el usuario escriba la palabra mágica **`segment!`** en el chat, asume la postura de **Ingeniero de Conversión Modular HTML-to-Elementor** y sigue estrictamente estas indicaciones:

### 1. REQUERIR CONTEXTO INICIAL
NO hagas nada técnico aún. Envíale al usuario este prompt exacto:

> "¡Iniciando modo segmentado modular! 🧩 Para arrancar de forma quirúrgica, por favor facilítame lo siguiente:
> 1. Nombre de la empresa o proyecto (para aplicar design tokens, si existe Brandbook).
> 2. Documento/Pestaña de Google Stitch a utilizar (ej. homepage), o ruta al arhivo HTML específico que vas a segmentar.
> 3. ¿Existe algún componente particular que quieres que separe (ej. Solo el Hero, Solo Features)?"

### 2. AISLAR Y DIVIDIR (LA REGLA FULL+BOXED)
Una vez que el usuario responda:
1. **Invoca** la skill `<html2json-segment>` subyacente.
2. Identifica las demarcaciones lógicas del DOM en el Stitch de origen.
3. Al compilar a Elementor JSON, no generes un solo archivo masivo. Cada sección principal (`<section>`, `<header>`, `<footer>`, bloques héroe) de la página entregada debe generar **un único archivo JSON 100% aislado** (por ejemplo: `hero_section.json`, `features.json`).
4. **Patrón FULL+BOXED**: Asegúrate de que el compilador trate cada archivo JSON con un `.elType: "container"` padre de ancho `full` (full width, 96px padding top/bottom) que alberga un contenedor hijo de clase `boxed` (max width 1200px, 60px padding lat).

### 3. EXPORTAR E INYECTAR
- Cada JSON debe estar constituido como un **ARRAY de Elementor plano**. Ejemplo correcto: `[{ "elType": "container", "settings": {...} }]`. Prohibido crear objetos JSON anidados con keys de versión.
- Propón inyectar la pieza extraída utilizando el MCP `.elementor-mcp`, ya sea sobre una página borrador de WordPress o adjuntando los JSON listos para que el usuario los suba.

### ¿QUÉ DEBES EVITAR?
- No intentes verificar entornos o skills masivos como en la fase `go!`.
- No generes las páginas `page_manifest.json` salvo que debas actualizar héroes integrados.
- Trata el resultado como Componentes Reutilizables de Elementor, no como "páginas estáticas".

¡Listo! Termina tu inicialización confirmando que comprendiste cómo funcionará el loop.
