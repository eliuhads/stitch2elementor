# Contributing to stitch2elementor

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Copy `.env.example` to `.env` and fill in your values
4. Run `npm install` to install dependencies

## Development Rules

### 🔒 Security First

1. **NEVER hardcode credentials, tokens, or passwords** — always use `process.env`
2. **NEVER hardcode client URLs or domains** — use `process.env.WP_BASE_URL`
3. **NEVER hardcode private IPs** — use `process.env.PLAYWRIGHT_WS_ENDPOINT`
4. **Always use `secure: true`** for FTP connections
5. **Always use `rejectUnauthorized: true`** for TLS — if you need to bypass for staging, use an environment variable flag

### 📝 Code Style

- Use ES modules (`.mjs`) for new scripts
- Load environment variables via `dotenv` at the top of every script
- Validate required environment variables before proceeding
- Use `scripts/utils/wp-api.js` for WordPress API calls (don't reinvent auth)

### 🏗️ Architecture

```
scripts/           → Production pipeline scripts
scripts/utils/     → Shared utilities (wp-api.js, etc.)
templates/         → Generic templates with placeholder data
schemas/           → JSON schemas for validation
docs/              → Technical documentation
references/        → Prompt references and guides
```

### ⚠️ What NOT to Commit

- Client-specific data (URLs, page IDs, image paths)
- `.env` files or `mcp_config.json`
- Generated outputs (`elementor_jsons/`, `exports/`, `logs/`)
- Compiled files (`__pycache__/`, `*.pyc`)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the rules above
3. Run `grep -rn "192.168\|evergreen\|password.*=.*['\"]" scripts/` to verify no sensitive data
4. Update documentation if adding new features
5. Submit a PR with a clear description of changes

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
