# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.x.x   | ✅ Active support  |
| 1.x.x   | ❌ End of life     |

## Reporting a Vulnerability

If you discover a security vulnerability in stitch2elementor, please report it responsibly:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: **floydiamarkv@gmail.com** with subject `[SECURITY] stitch2elementor`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix and disclosure**: Within 30 days (coordinated)

## Security Best Practices for Users

### Credentials
- **NEVER** commit `.env` files or `mcp_config.json`
- Use WordPress Application Passwords (not your main password)
- Generate unique `WP_SCRIPT_TOKEN`, `WP_FLUSH_KEY`, and `WP_INJECT_KEY` values (32+ chars)

### FTP
- Always use FTPS (TLS) — `secure: true` in all connections
- Validate server certificates — `rejectUnauthorized: true`
- Consider SFTP as a more secure alternative when available

### PHP Scripts
- All server-side PHP scripts require token-based authentication
- PHP scripts auto-delete after execution
- Never expose PHP injection scripts publicly

### Network
- Use environment variables for all endpoints (never hardcode IPs or domains)
- Set `PLAYWRIGHT_WS_ENDPOINT` in `.env` for Playwright connections
