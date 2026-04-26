⚠️ NUNCA hagas commit de mcp_config.json. Está en .gitignore. Copia mcp_config.example.json y renómbralo.

GUÍA DE CONFIGURACIÓN DE MCP SERVERS PARA STITCH → ELEMENTOR
============================================================

SEGURIDAD — USUARIO DE WORDPRESS
---------------------------------
IMPORTANTE: No uses tu usuario Admin para el agente.
Crea un usuario WordPress dedicado con rol "Editor".
Ve a WP Admin > Usuarios > Añadir nuevo.
Rol: Editor. Luego genera su Application Password desde su perfil.
El agente nunca necesita acceso de Admin para inyectar páginas.

1. INSTALACIÓN GLOBAL (Obligatorio — evita timeouts de compilación in-time)

  npm install -g wp-elementor-mcp
  npm install -g elementor-mcp

2. CREDENCIALES REQUERIDAS

  WordPress:
  - Crea una "Application Password" en: WP Admin → Perfil → Application Passwords
  - Formato exacto requerido: "xxxx xxxx xxxx xxxx xxxx xxxx" (con espacios)

  Google Stitch:
  - Obtén una API Key en: Google Cloud Console → Credentials → API Key

3. REGLA: DESACTIVA MCPs INNECESARIOS

  Antes de iniciar, en tu mcp_config.json, establece "disabled": true en todos los
  servidores MCP no requeridos (Puppeteer, Figma, Playwright, etc.).
  Dejar MCPs activos no utilizados dispersa el contexto del LLM y genera tool calls erróneas.

4. BLOQUE PARA mcp_config.json

  ADVERTENCIA: Edita este archivo MANUALMENTE desde fuera del agente.
  Nunca lo modifiques con shell tools desde dentro del IDE o causarás un crash del event loop.

  "StitchMCP": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://stitch.googleapis.com/mcp"],
    "env": {
      "STITCH_API_KEY": "TU_GOOGLE_CLOUD_API_KEY_AQUI"
    },
    "disabled": false
  },

  "wp-elementor-mcp": {
    "command": "wp-elementor-mcp",
    "args": [],
    "env": {
      "WORDPRESS_BASE_URL": "https://tu-dominio.com",
      "WORDPRESS_USERNAME": "usuario-editor-dedicado",
      "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx",
      "WP_MCP_MODE": "advanced"
    },
    "disabled": false
  },

  "elementor-mcp": {
    "command": "elementor-mcp",
    "args": [],
    "env": {
      "WP_URL": "https://tu-dominio.com",
      "WP_APP_USER": "usuario-editor-dedicado",
      "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
    },
    "disabled": false
  }
