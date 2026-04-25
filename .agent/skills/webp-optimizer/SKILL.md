---
name: webp-optimizer
description: Convierte directorios de imágenes PNG/JPG en archivos WebP altamente optimizados usando Sharp.
---

# WebP Optimizer Skill

Este skill de Antigravity utiliza la librería `sharp` para procesar imágenes masivamente. 
Perfecto para entornos WordPress y Elementor que requieren optimización de carga.

## Uso

Para usar este skill, el agente o usuario debe ejecutar el script `optimize.js` en el servidor intermedio.

### Comando de Conversión
```bash
cd "C:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN\skills\webp-optimizer"
node optimize.js "C:\ruta\a\carpeta\origen" "C:\ruta\a\carpeta\destino"
```

### Reglas
- Si no se especifica ruta de origen, usa la carpeta activa (.).
- Si no se especifica ruta destino, procesa las `.webp` en la misma carpeta origen.
- Conserva el mismo basename pero cambia la extensión a `.webp`.
