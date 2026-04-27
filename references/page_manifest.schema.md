# Schema: page_manifest.json

Archivo generado en Fase 0 del pipeline `go!`. Mapea cada página del sitio
antes de la compilación y la inyección.

## Estructura esperada

{
  "proyecto": "Nombre del proyecto",
  "generado": "2026-01-01T00:00:00Z",
  "paginas": [
    {
      "nombre": "Home",
      "slug": "home",
      "html_fuente": "stitch_exports/home.html",
      "json_destino": "compiled/home.json",
      "wp_page_id": null,
      "hero_image_wp_id": null,
      "estado": "pendiente"
    }
  ]
}

## Valores de `estado`
- "pendiente" → no procesado aún
- "compilado" → JSON generado, no inyectado
- "inyectado" → en WordPress, pendiente validación
- "validado" → verificado vía REST API
