# Stitch2Elementor Scripts

This directory contains the core active scripts for the `stitch2elementor` pipeline. All experimental and legacy scripts have been moved to the `archive/` directory in the project root.

## Active Pipeline Scripts

### 1. `compiler_v4.js`
The main "Web Maestro" transpilation engine.
- **Purpose**: Converts Stitch HTML templates and Tailwind classes into native Elementor JSON structures.
- **Key Features**: Auto-loads design system variables (`design_system.json`), performs aggressive DOM pruning, processes background images and flexbox layouts, and validates output.

### 2. `sync_and_inject.js`
The primary deployment orchestrator.
- **Purpose**: Uploads compiled Elementor JSON files and injector scripts to the remote WordPress server via FTP, executes the remote scripts, and performs automatic clean-up.
- **Key Features**: Requires strictly validated environment variables (`WP_BASE_URL`, `FTP_HOST`, `WP_SCRIPT_TOKEN`, etc.), uses `auth_helper.php` for `Bearer` token authentication, and utilizes `rejectUnauthorized: false` optionally for staging environments.

### 3. `upload_and_fix.js`
The specialized utility deployment orchestrator.
- **Purpose**: Uploads single-purpose PHP scripts (e.g., `fix_slugs_native.php`) alongside `auth_helper.php`, executes them, and cleans them up.

### 4. `fix_slugs_native.php`
- **Purpose**: Remotely executed via HTTP to repair or update WordPress post slugs using the REST API or native WordPress functions. Validates requests via `verify_api_token()` in `auth_helper.php`.

## Environment Requirements
The scripts rely on the `.env` file at the project root. Essential variables include:
- `WP_BASE_URL`
- `WP_SCRIPT_TOKEN`
- `INJECT_SECRET`
- `FTP_HOST`, `FTP_USER`, `FTP_PASS`

If these variables are not present, the Node.js scripts will fail gracefully before making any connections.
