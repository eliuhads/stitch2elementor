# Changelog - stitch2elementor

## [v4.5.1] - 2026-04-16
### Corregido
- **Protocolo de Realineación de IDs**: Identificado que la re-inyección masiva de páginas genera nuevos IDs en WordPress. Se ha actualizado el pipeline para que la fijación de la Homepage sea el paso final OBLIGATORIO para evitar desconfiguración por desplazamiento de IDs.
- **Maintenance Only Mode**: Añadido soporte para realinear la configuración de WordPress sin necesidad de re-inyectar contenido, protegiendo los IDs existentes.

## [v4.5.0] - 2026-04-16
### Añadido
- **Fijación Automática de Homepage:** El pipeline `sync_and_inject.js` extrae automáticamente los IDs de Homepage y Blog desde el manifest y los sincroniza con el servidor.
- **Maintenance Bridge 2.0:** El script `flush_cache.php` ahora actúa como un agente de configuración remota para establecer las opciones de lectura de WordPress (`page_on_front`, `page_for_posts`).

## [v4.4.0] - 2026-04-15
[...]
