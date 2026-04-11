# 🔌 stitch2elementor

**Migrate Google Stitch AI designs to WordPress Elementor — 100% free, no premium plugins.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-blueviolet)](https://github.com/google-deepmind/antigravity)
[![YouTube](https://img.shields.io/badge/Tutorial-YouTube-red)](https://youtube.com/@eliuhads)

---

## 🎯 What is this?

An [Antigravity](https://github.com/google-deepmind/antigravity) skill that automates the full pipeline from **Google Stitch** (AI-powered UI design) to **WordPress Elementor** pages — with zero manual rebuilding.

```
Google Stitch → HTML Export → Node.js Parser → Elementor JSON → WP REST API → WordPress
```

### Before & After

| ❌ Without this skill | ✅ With this skill |
|---|---|
| Design in Stitch, then manually rebuild every section in Elementor | Design in Stitch, run one script, done |
| Pay for premium converters (UiChemy, Figmentor) | 100% free — uses WordPress REST API |
| Lose design fidelity in translation | 100% fidelity — real Stitch HTML preserved |
| Hours of manual work per page | ~30 seconds per page (automated) |

---

## 🚀 Quick Start

### 1. Install the skill

Copy the `stitch2elementor/` folder into your project's `SKILLS/` directory.

### 2. Configure 3 MCP servers

See `examples/mcp_config_example.json` for the full configuration. You need:

| Server | Purpose |
|--------|---------|
| **StitchMCP** | Read your designs from Google Stitch |
| **wp-elementor-mcp** | Manage WordPress pages & Elementor data | [Repo](https://github.com/eliuhads/wp-elementor-mcp) |
| **elementor-mcp** | File-based Elementor data injection | [Repo](https://github.com/eliuhads/elementor-mcp) |

### 3. Design your pages in Google Stitch

Create your screens at [stitch.new](https://stitch.new) — desktop mode recommended.

### 4. Download the HTML exports

```powershell
# PowerShell
Invoke-WebRequest -Uri $downloadUrl -OutFile "stitch_html/homepage.html"
```

### 5. Run the converter

```bash
# Copy the template script
cp SKILLS/stitch2elementor/scripts/stitch_to_elementor_template.js ./stitch_to_elementor.js

# Edit CONFIG section with your WordPress credentials
# Edit PAGES array with your page names

# Run it
node stitch_to_elementor.js
```

### 6. Update Header & Footer

```bash
cp SKILLS/stitch2elementor/scripts/update_header_footer_template.js ./update_header_footer.js

# Edit CONFIG section (credentials + template IDs)
node update_header_footer.js
```

### 7. Final steps (manual)

1. **Elementor → Theme Builder** → Set Header/Footer display conditions to "Entire Site"
2. **Elementor → Tools** → Regenerate Files & Data
3. **Settings → Reading** → Set your static homepage
4. Publish your pages!

---

## 📁 Project Structure

```
your-project/
├── stitch_html/                    ← Raw HTMLs downloaded from Stitch
│   ├── homepage.html
│   ├── about.html
│   └── services.html
├── elementor_output/               ← Converted JSONs (backup)
│   ├── homepage.json
│   ├── header.json
│   └── footer.json
├── stitch_to_elementor.js          ← Your customized converter
├── update_header_footer.js         ← Your customized updater
└── SKILLS/stitch2elementor/        ← This skill
    ├── SKILL.md                    ← Full instructions for the AI agent
    ├── README.md                   ← You are here
    ├── scripts/
    │   ├── stitch_to_elementor_template.js
    │   └── update_header_footer_template.js
    └── examples/
        └── mcp_config_example.json
```

---

## ⚡ The Golden Rule

> **`_elementor_data` MUST be a string of a pure JSON ARRAY.**

```javascript
// ✅ CORRECT
meta: { _elementor_data: JSON.stringify([{...}, {...}]) }

// ❌ WRONG — causes PHP Fatal Error, kills Elementor editor
meta: { _elementor_data: JSON.stringify({ version: "0.4", content: [...] }) }
```

---

## 🚨 9 Fatal Errors to Avoid

| # | Error | What happens |
|---|-------|-------------|
| 1 | Wrapper JSON object | Elementor editor shows "Critical Error" |
| 2 | Wrong WP credentials | HTTP 401 on every API call |
| 3 | Generic/invented JSON | Pages look nothing like your Stitch design |
| 4 | Using `read_url_content` | HTML becomes Markdown, all CSS destroyed |
| 5 | Editing mcp_config from agent | IDE freezes completely |
| 6 | Parallel PATCH calls | Page content disappears (race condition) |
| 7 | Non-existent endpoints | 404 errors (`/build-page` doesn't exist) |
| 8 | Temporary image URLs | Images break after a few days |
| 9 | npx for MCP servers | Timeout errors at startup |

See `SKILL.md` for detailed explanations and solutions.

---

## 🛠 Requirements

- **Node.js** 18+
- **WordPress** with Elementor (free version works!)
- **Google Stitch** account ([stitch.new](https://stitch.new))
- **Antigravity** IDE with MCP support
- WordPress **Application Password** (free, built-in)

---

## 🎬 Video Tutorial

Watch the full tutorial on YouTube: **[Coming Soon]**

Suggested search: *"Stitch to WordPress Elementor free tutorial"*

---

## 🤝 Contributing

Found a bug? Have an improvement? Open an issue or PR!

This skill was battle-tested on a real production migration (9 pages + Header + Footer) and every error documented here was experienced firsthand.

---

## 📄 License

MIT — Use it, modify it, share it. Free forever.

Built with ❤️ by [@eliuhads](https://youtube.com/@eliuhads)
