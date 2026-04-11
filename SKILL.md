---
name: stitch2elementor
description: Migrates Google Stitch AI designs to WordPress Elementor pages via HTML parsing and WP REST API injection. 100% free, no premium plugins required.
version: 2.0.0
author: "@eliuhads"
allowed-tools:
  - "stitch*:*"
  - "wp-elementor*:*"
  - "elementor*:*"
  - "Read"
  - "Write"
  - "Bash"
---

# Stitch → Elementor Migration Skill

You are an **autonomous migration agent** that converts Google Stitch AI designs into fully functional WordPress Elementor pages. The entire pipeline is free and open-source — no premium plugins, no freemium converters, no manual rebuilding.

## Overview

This skill enables a complete design-to-production pipeline:

```
Google Stitch (AI Design) → HTML Export → Node.js Parser → Elementor JSON → WP REST API → WordPress
```

Every page preserves **100% design fidelity** because the real Stitch HTML (with Tailwind classes, fonts, and custom styles) is wrapped inside native Elementor Flexbox containers as HTML widgets.

## Prerequisites

### Required MCP Servers (3)

| Server | Purpose | Install |
|--------|---------|---------|
| **StitchMCP** | Read designs from Google Stitch | `mcp-remote` pointing to `stitch.googleapis.com/mcp` |
| **wp-elementor-mcp** | Manage WordPress pages + Elementor data | `npm install -g wp-elementor-mcp` | [Repo](https://github.com/eliuhads/wp-elementor-mcp) |
| **elementor-mcp** | File-based Elementor injection | `npm install -g elementor-mcp` | [Repo](https://github.com/eliuhads/elementor-mcp) |

### Required WordPress Setup

- WordPress with Elementor (free version works)
- An Application Password for REST API auth (WP Admin → Users → Profile → Application Passwords)
- Admin-level user permissions

### Required Local Tools

- Node.js 18+ (for the converter script)
- PowerShell or Bash (for downloading HTML files)

## Companion Skills Ecosystem

This skill orchestrates a full design-to-production pipeline. The following companion skills extend its capabilities at each phase. **Read each skill's SKILL.md before using it.**

### CORE SKILLS (Required — Used in every migration)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **html-to-json** | `.agent/skills/html-to-json/` | Rules and schema for converting HTML/CSS to valid Elementor JSON. Defines widget mapping, container hierarchy, responsive keys, and validation checklists. | Phase 2: Compilation |
| **ui-ux-pro-max** | `.agent/skills/ui-ux-pro-max/` | Design intelligence database: 67 styles, 96 palettes, 57 font pairings, 99 UX guidelines. Use to select color schemes, typography, and design direction. | Phase 0: BrandBook + Phase 1: Stitch Design |
| **design-md** | `skills/design-md/` | Analyzes Stitch projects and synthesizes a semantic design system into `DESIGN.md` files. Extracts tokens, colors, typography, and spacing from Stitch screens. | Phase 0: BrandBook → MASTER.md |
| **webp-optimizer** | `skills/webp-optimizer/` | Batch converts PNG/JPG images to optimized WebP using Sharp. Critical for WordPress performance and page load speed. | Phase 0: Image Preparation |

### DESIGN & GENERATION SKILLS (Recommended — Improve Stitch output quality)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **enhance-prompt** | `skills/enhance-prompt/` | Transforms vague UI ideas into polished, Stitch-optimized prompts. Adds UI/UX keywords, injects design system context, structures output for better generation. | Phase 1: Before generate_screen_from_text |
| **stitch-loop** | `skills/stitch-loop/` | Autonomous iterative site-building loop. Generates a page, integrates it, prepares instructions for the next iteration. Useful for building multi-page sites. | Phase 1: Multi-page generation |

### POST-PRODUCTION SKILLS (Recommended — Quality and SEO)

| Skill | Location | Purpose | Pipeline Phase |
|-------|----------|---------|----------------|
| **Agentic-SEO-Skill** | `skills/Agentic-SEO-Skill/` | Full SEO audit suite: 16 sub-skills, 10 specialist agents, 33 scripts. Technical SEO, Core Web Vitals, E-E-A-T, schema markup, hreflang, GEO/AEO analysis. | Phase 4: SEO + Verification |
| **visual-tester** | `skills/visual-tester/` | Auditoría visual remota. Usa el **Navegador Satélite** (`browser_subagent`) o `read_url_content` para verificar 404/500 y comprobar rendering, protegiendo los recursos locales (PROHIBIDO usar Playwright local). | Phase 4: Visual Verification |

### ADVANCED SKILLS (Optional — For specific needs)

| Skill | Location | Purpose | When to Use |
|-------|----------|---------|-------------|
| **react-components** | `skills/react-components/` | Converts Stitch designs into modular Vite + React components with AST validation. | When building React apps instead of WordPress |
| **remotion** | `skills/remotion/` | Generates walkthrough videos from Stitch projects using Remotion with transitions and zooming. | For marketing demos or client presentations |
| **shadcn-ui** | `skills/shadcn-ui/` | Expert shadcn/ui component integration with Radix UI and Tailwind CSS. | When building modern React/Next.js interfaces |

### How the Skills Fit in the Pipeline

```
[Phase 0: Preparation]
  ui-ux-pro-max → Select design direction, palettes, typography
  design-md → Analyze BrandBook → Generate DESIGN.md / MASTER.md
  webp-optimizer → Convert all images to optimized WebP

[Phase 1: Design in Stitch]
  enhance-prompt → Polish prompts before sending to Stitch
  stitch-loop → Automate multi-page generation iteratively

[Phase 2: Compilation]
  html-to-json → Schema, rules, widget mapping for Elementor JSON
  compiler_v4.js → Execute the actual DOM walker conversion

[Phase 3: Injection]
  MCP servers → Upload to WordPress

[Phase 4: Quality & SEO]
  Agentic-SEO-Skill → Full SEO audit per page
  visual-tester → Screenshot verification desktop/mobile

[Optional]
  react-components → If target is React, not WordPress
  remotion → Client presentation videos
  shadcn-ui → Modern React component library
```

⚠️ **READ EACH SKILL'S SKILL.md** before using it. Each contains specific instructions, prerequisites, and usage patterns.

### How to Install the Skills

**Google Stitch Skills** (from `google-labs-code/stitch-skills` repo):
```bash
# Install individual skills via npx:
npx skills add google-labs-code/stitch-skills --skill design-md --global
npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global
npx skills add google-labs-code/stitch-skills --skill react:components --global
npx skills add google-labs-code/stitch-skills --skill shadcn-ui --global
npx skills add google-labs-code/stitch-skills --skill stitch-loop --global
npx skills add google-labs-code/stitch-skills --skill remotion --global
```

**Agentic SEO Skill** (from `Bhanunamikaze/Agentic-SEO-Skill` repo):
```bash
git clone https://github.com/Bhanunamikaze/Agentic-SEO-Skill.git
cd Agentic-SEO-Skill
bash install.sh --target antigravity --project-dir /path/to/your/project
```

**Custom Skills** (included in this repo — no external install needed):
- `html-to-json` → Already in `.agent/skills/html-to-json/`
- `ui-ux-pro-max` → Already in `.agent/skills/ui-ux-pro-max/`
- `webp-optimizer` → Already in `skills/webp-optimizer/` (requires `npm install sharp`)
- `visual-tester` → Already in `skills/visual-tester/` (requires `npx playwright install chromium`)
- `stitch2elementor` → Already in `skills/stitch2elementor/` (this skill)

## MCP Configuration

### StitchMCP

```json
{
  "StitchMCP": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://stitch.googleapis.com/mcp",
             "--header", "X-Goog-Api-Key: YOUR_GOOGLE_API_KEY"],
    "env": {},
    "disabled": false
  }
}
```

**Available tools (verified):**
- `list_projects` → List all user projects (**⛔ AVOID — causes timeout. Use `get_project` with known ID instead**)
- `get_project` → Get project metadata + screen list (**✅ PREFERRED**)
- `get_screen` → Get screenshot URL + HTML download URL
- `list_screens` → List all screens in a project
- `generate_screen_from_text` → Generate new screens from a prompt
- `edit_screens` → Edit existing screens
- `create_design_system` / `update_design_system` → Manage Design System tokens

⚠️ **WARNING:** The tools `extract_design_context` and `get_screen_code` do NOT exist in StitchMCP. These are incorrect names found in some documentation. Always use `get_screen` to retrieve HTML.

### wp-elementor-mcp

```json
{
  "wp-elementor-mcp": {
    "command": "wp-elementor-mcp",
    "args": [],
    "env": {
      "WORDPRESS_BASE_URL": "https://your-domain.com",
      "WORDPRESS_USERNAME": "your_wp_user",
      "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx",
      "WP_MCP_MODE": "advanced"
    },
    "disabled": false
  }
}
```

**Key tools used:**
- `get_pages` → List existing WP pages
- `get_elementor_templates` → List Header/Footer/Kit templates
- `get_elementor_data` → Read Elementor structure of a page
- `get_page_structure` → Simplified page tree view

### elementor-mcp

```json
{
  "elementor-mcp": {
    "command": "elementor-mcp",
    "args": [],
    "env": {
      "WP_URL": "https://your-domain.com",
      "WP_APP_USER": "your_wp_user",
      "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
    },
    "disabled": false
  }
}
```

**Key tools used:**
- `create_page` → Create pages with Elementor data
- `update_page` → Update existing pages
- `update_page_from_file` → Inject JSON from local file

## The Golden Rule

> **`_elementor_data` MUST be a string containing a pure JSON ARRAY.**

```
✅ CORRECT:   "[{...}, {...}, {...}]"
❌ INCORRECT: "{ \"version\": \"0.4\", \"content\": [{...}] }"
```

Violating this rule causes a **PHP Fatal Error** that kills the Elementor visual editor. The page becomes un-editable until the data is fixed.

## Execution Protocol

### Phase 1: Discover & Download

#### Step 1.1 — Find the Stitch Project

```
StitchMCP → get_project(projectId)   ⛔ NEVER use list_projects (causes timeout)
```

Use a known `projectId` or create a new project with `create_project`.

#### Step 1.2 — Get Screen Download URLs

For each screen in the project:

```
StitchMCP → get_screen(projectId, screenId)
```

Each response contains:
- `screenshot.downloadUrl` → Visual reference image (temporary URL)
- `htmlCode.downloadUrl` → ⭐ **The real HTML generated by Stitch**

#### Step 1.3 — Download Raw HTML

**CRITICAL: Use PowerShell/curl, NEVER `read_url_content`.**

`read_url_content` converts HTML to Markdown and destroys all CSS classes, Tailwind utilities, and structural tags.

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path "stitch_html" | Out-Null
Invoke-WebRequest -Uri $downloadUrl -OutFile "stitch_html/page-name.html"
```

**Bash/curl:**
```bash
mkdir -p stitch_html
curl -o stitch_html/page-name.html "$downloadUrl"
```

Verify each file is > 15KB (valid HTML with Tailwind classes).

### Phase 2: Parse & Convert

#### Step 2.1 — Understand Stitch HTML Anatomy

Every Stitch HTML export has this structure:

```html
<html>
  <head>
    <script src="tailwindcss CDN">              <!-- Dependency #1 -->
    <link href="Google Fonts">                   <!-- Dependency #2 -->
    <script id="tailwind-config">...</script>    <!-- Design System tokens -->
    <style>...</style>                           <!-- Custom CSS (glassmorphism, etc.) -->
  </head>
  <body>
    <header>...</header>    <!-- EXCLUDE for pages (goes to Theme Builder) -->
    <section>...</section>  <!-- → Elementor Container #1 -->
    <section>...</section>  <!-- → Elementor Container #2 -->
    <section>...</section>  <!-- → Elementor Container #N -->
    <footer>...</footer>    <!-- EXCLUDE for pages (goes to Theme Builder) -->
  </body>
</html>
```

#### Step 2.2 — Run the Converter Script

Use the provided `scripts/compiler_v4_template.js` (V4.1 production-hardened). The script:

1. Reads each `.html` file from `stitch_html/`
2. Extracts shared dependencies:
   - `<script id="tailwind-config">` → Design System configuration
   - `<style>` → Custom CSS styles
   - Tailwind CDN reference
   - Google Fonts links
3. Extracts `<body>` content, **excluding** `<header>` and `<footer>`
4. Splits the body into individual `<section>` blocks
5. Wraps each section in an Elementor container structure:

```javascript
{
    id: generateId(),           // Random alphanumeric
    elType: "container",        // ALWAYS "container" (Flexbox)
    isInner: false,
    settings: {
        content_width: "full",
        padding: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true }
    },
    elements: [{
        id: generateId(),
        elType: "widget",
        widgetType: "html",     // Native Elementor HTML widget
        settings: {
            html: SHARED_DEPS + SECTION_HTML
        },
        elements: []
    }]
}
```

6. Packages all containers into a pure JSON array `[container1, container2, ...]`
7. Saves backup JSON files to `elementor_output/`
8. Uploads to WordPress via REST API

**IMPORTANT:** Only the **first** container needs the shared dependencies (Tailwind CDN, config, fonts). Subsequent containers only need their `<section>` HTML.

### Phase 3: Upload to WordPress

#### Step 3.1 — Create Pages via REST API

For each page, POST to the WordPress REST API:

```
POST https://your-domain.com/wp-json/wp/v2/pages
Authorization: Basic base64(user:application_password)
Content-Type: application/json

{
    "title": "Page Title",
    "content": "<!-- Stitch Import -->",
    "status": "draft",
    "meta": {
        "_elementor_data": JSON.stringify(elementorArray),  // ← PURE ARRAY
        "_elementor_edit_mode": "builder",
        "_elementor_template_type": "page"
    }
}
```

#### Step 3.2 — Verify

Go to WP Admin → Pages → click "Edit with Elementor" on at least one test page.
If the visual editor loads with the design visible → ✅ success.

### Phase 4: Global Header & Footer

#### Step 4.1 — Find Template IDs

```
wp-elementor-mcp → get_elementor_templates
```

Identify the Header and Footer template IDs.

#### Step 4.2 — Extract & Upload

From `stitch_html/homepage.html`:
- Extract the `<header>` block → wrap in Elementor container
- Extract the `<footer>` block → wrap in Elementor container

Upload to the template endpoint:

```
POST https://your-domain.com/wp-json/wp/v2/elementor_library/{templateId}

{
    "meta": {
        "_elementor_data": JSON.stringify(elementorArray),
        "_elementor_edit_mode": "builder",
        "_elementor_template_type": "header"  // or "footer"
    }
}
```

#### Step 4.3 — Configure Display Conditions (Manual)

The REST API cannot set display conditions. Do this manually:
1. WP Admin → Elementor → Theme Builder
2. Header → Edit Conditions → "Entire Site"
3. Footer → Edit Conditions → "Entire Site"
4. Regenerate CSS: WP Admin → Elementor → Tools → Regenerate Files & Data

## File Structure

```
your-project/
├── stitch_html/                    ← Raw HTMLs downloaded from Stitch
│   ├── homepage.html
│   ├── about.html
│   ├── services.html
│   └── contact.html
├── elementor_json/                 ← Compiled Elementor JSONs
│   ├── homepage.json
│   ├── header.json
│   ├── footer.json
│   └── ...
├── compiler_v4.js                  ← Production compiler (copy from template)
├── page_manifest.json              ← Page registry + media IDs + hero pairs
├── design-system/
│   └── MASTER.md                   ← Extracted BrandBook tokens
├── .agent/skills/stitch2elementor/ ← This skill
│   ├── SKILL.md                    ← You are here
│   ├── PROMPT_WEB_MAESTRO_v2.md    ← Full workflow prompt
│   ├── Stitch_Elementor_Guide.md   ← Quick reference guide
│   ├── scripts/
│   │   ├── compiler_v4_template.js ← ⭐ Production compiler (V4.1, 1600+ lines)
│   │   ├── push_all_to_wp_template.js
│   │   ├── stitch_to_elementor_template.js  (legacy V3 — reference only)
│   │   ├── update_header_footer_template.js
│   │   ├── fix_material_symbols.js ← Cleans Material Symbols text in buttons/html
│   │   ├── fix_slugs.js ← WP REST API Slug Synchronizer
│   │   ├── audit_stitch_images.js ← Audits temporary Stitch images
│   │   ├── replace_stitch_images.js ← Uploads and prepares image replacement mapping
│   │   └── apply_image_replacements.js ← Applies custom image mapping to Elementor JSONs
│   ├── docs/                       ← Reference documentation
│   │   ├── elementor-json-schema.md
│   │   ├── widget-mapping.md
│   │   ├── examples.md
│   │   └── gotchas.md
│   └── examples/
│       └── mcp_config_example.json
```

## Fatal Errors to Avoid

| # | Error | Symptom | Cause | Solution |
|---|-------|---------|-------|----------|
| 1 | **Wrapper JSON** | "Critical Error" in Elementor editor | `_elementor_data` has `{version, content}` wrapper | Always send pure array `[{...}]` |
| 2 | **Wrong credentials** | HTTP 401 `rest_cannot_create` | Script uses different user than MCP config | Sync credentials everywhere |
| 3 | **Generic JSON** | Pages look nothing like Stitch design | Script invents JSON without reading real HTML | Always parse real Stitch HTML |
| 4 | **read_url_content** | HTML becomes Markdown, all CSS lost | Using wrong tool to download | Use `Invoke-WebRequest` or `curl` |
| 5 | **Editing mcp_config.json from agent** | IDE freezes completely | Agent modifies its own config at runtime | Always edit config manually |
| 6 | **Parallel PATCH calls** | Page content disappears | Two API calls overwrite each other | Always use SEQUENTIAL calls |
| 7 | **Non-existent endpoints** | HTTP 404 | Using `/build-page` or `/flush-css` | Use standard WP REST API |
| 8 | **Temporary image URLs** | Images stop loading after days | Using `lh3.googleusercontent.com` URLs | Upload to WP Media Library |
| 9 | **npx timeout** | `context deadline exceeded` | npx downloads at runtime | Install MCP servers globally |

## Performance Tips

### Disable Unused MCP Servers

Every active MCP server injects dozens of tools into the agent's context. More tools = slower reasoning and higher error rates.

**Only keep active:**
- `StitchMCP` — reading designs
- `wp-elementor-mcp` — WordPress management
- `elementor-mcp` — file-based injection

**Disable everything else** (Figma, Playwright, Firebase, etc.) unless you specifically need them for the current task.

### Credential Synchronization

Maintain a single source of truth for WordPress credentials:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   mcp_config.json   │    │  Node.js scripts    │    │   elementor-mcp     │
│   (wp-elementor)    │    │  (REST API calls)   │    │   config            │
│                     │    │                     │    │                     │
│  USER: same_user    │ == │  USER: same_user    │ == │  USER: same_user    │
│  PASS: same_pass    │    │  PASS: same_pass    │    │  PASS: same_pass    │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

If ANY of these differ, you'll get 401 errors in some tools but not others — extremely confusing to debug.

## Quick Start Checklist

```
□ Install 3 MCP servers (StitchMCP + wp-elementor-mcp + elementor-mcp)
□ Configure WordPress Application Password
□ Sync credentials across mcp_config.json and scripts
□ Disable unused MCP servers
□ Verify connections: list_projects + get_pages
□ Design screens in Google Stitch (DESKTOP mode recommended)
□ Run get_screen for each screen → collect downloadUrls
□ Download HTML with Invoke-WebRequest → stitch_html/ folder
□ Run: node stitch_to_elementor.js → creates pages in WordPress
□ Verify at least 1 page loads in Elementor visual editor
□ Run: node update_header_footer.js → updates global templates
□ Configure Display Conditions: Header + Footer → "Entire Site"
□ Regenerate CSS: Elementor → Tools → Regenerate Files & Data
□ Set static homepage in Settings → Reading
□ Publish approved pages (draft → publish)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stitch MCP won't connect | Verify API key in mcp_config.json, try restarting Antigravity |
| WordPress API returns 401 | Check Application Password format (with spaces), verify user role is Admin |
| Elementor shows blank page | Regenerate CSS: Elementor → Tools → Regenerate Files & Data |
| Pages look different from Stitch | Ensure you downloaded raw HTML (not Markdown conversion) |
| Editor freezes on "Critical Error" | Check `_elementor_data` format — must be pure array string |
| Images broken after a few days | Re-upload to WP Media Library, don't use temporary Stitch URLs |
| Header/Footer not showing on all pages | Set Display Conditions to "Entire Site" in Theme Builder |
| Agent is very slow | Disable unused MCP servers to reduce tool injection overhead |

## NEW IN V4.1: Native Elementor Migration Workflow (Production-Hardened)

The legacy V3 workflow used the monolithic Elementor `html` widget. The V4 compiler parses the HTML and maps UI elements natively to Elementor widgets (e.g., Headings, Buttons, TextEditor) utilizing Elementor's Flexbox Container system for maximum responsiveness and client editability without touching code.

**V4.1** (April 2026) adds 16 production bugfixes discovered during a 20-page
migration. The `scripts/compiler_v4_template.js` in this skill IS the production
compiler — copy it to your project root and customize the CONFIG block.

**Boxed Layout Requirement:** When generating containers, DO NOT use `content_width: "full"` exclusively as it breaks layout paddings. Always adhere to the **FULL + BOXED Pattern**:
- Outer Container (`content_width: "full"`, background and heavy padding)
- Inner Container (`content_width: "boxed"`, width: 1200px, responsive left/right padding)

**Settings Keys Fixes required for V4 JSON Injection:**
- Use `flex_gap` instead of `gap`.
- Use `_margin` instead of `margin`.
- Use `flex_justify_content` instead of `justify_content`.
- Use `flex_align_items` instead of `align_items`.
- Use `align` on Headings instead of `text_align`.

**Hero Images:** The compiler auto-injects hero backgrounds from `page_manifest.json`
media.hero_pairs. Each page entry can specify `"hero_pair": 1` to automatically get
desktop/mobile background images with gradient overlay. You MUST upload
images to WP Media Library first and record their IDs in the manifest.

**Post-Compiler Automations provided in `scripts/`**:
- **Image Replacement**: Use `audit_stitch_images.js`, `replace_stitch_images.js`, and `apply_image_replacements.js` to automatically replace expiring `lh3.googleusercontent.com` URLs with permanent Media Library WebP assets via the MCP tools and JSON modification.
- **Material Symbols Cleanup**: Run `fix_material_symbols.js` on Elementor JSONs to find text nodes containing material symbol identifiers (e.g., `arrow_forward`) and replace or remove them, correcting buttons and span tags.
- **Slug synchronization**: Use `fix_slugs.js` to automatically match WordPress post slugs to your `page_manifest.json` utilizing native WP REST API `PUT` endpoints.

This solidifies the pipeline to completely free human intervention from manual asset migrations and symbol-cleaning!

## License

This skill is free and open-source. Use it, modify it, share it.
Built with ❤️ by the community, for the community.



---
# HTML to Elementor JSON Guidelines (Integrated)
# HTML to Elementor JSON Guidelines

The raw DOM extraction rules, widget mappings, and Flexbox hierarchy conversions are maintained externally in the sister skill html-to-json.

👉 **[See ../html-to-json/SKILL.md](../html-to-json/SKILL.md)** for low-level conversion logic, Schema references, and DOM Walker anti-bloat strategies.

These are the battle-tested fixes discovered during 8+ conversations and a full 20-page production migration (Evergreen Venezuela, April 2026). **If you are building a new compiler or modifying the template, read ALL of these.**

The production-hardened compiler is at `scripts/compiler_v4_template.js` — copy to your project root as `compiler_v4.js`, update CONFIG, and run.

### Fix #1 — Tailwind Mobile-First ≠ Elementor Desktop-First
**Problem:** Tailwind is mobile-first (`flex-col sm:flex-row`). Elementor is desktop-first.
**Impact:** Side-by-side layouts rendered as stacked columns on desktop.
**Solution:** The compiler now correctly maps:
```
flex-col sm:flex-row  → desktop: row, mobile: column
flex-col md:flex-row  → desktop: row, mobile: column
flex-col lg:flex-row  → desktop: row, tablet: column, mobile: column
```
This is the **#1 most impactful fix**. Without it, your entire site looks wrong.

### Fix #2 — `bg-[#hex]/opacity` Patterns
**Problem:** Tailwind arbitrary values like `bg-[#0B0F1A]/80` were ignored.
**Solution:** Regex extracts hex + opacity, converts to `rgba(r,g,b,opacity)`.
Also fixes `text-[#28B5E1]` and `border-[#368A39]` arbitrary values.

### Fix #3 — `space-y-*` / `space-x-*` → flex_gap
**Problem:** `space-y-4` creates vertical spacing but the compiler didn't capture it.
**Solution:** Maps to `flex_gap` + forces `flex_direction: column` (for space-y) or `row` (for space-x).

### Fix #4 — `h-screen` → min_height: 100vh
**Problem:** `h-screen` was not mapped. Old template used `min-h-screen → 800px` (wrong).
**Solution:** Both `h-screen` and `min-h-screen` now map to `{unit: 'vh', size: 100}`.

### Fix #5 — `border-l-4` + Arbitrary Border Colors
**Problem:** Left/right/bottom borders were ignored. Only `border-t-4` worked.
**Solution:** Added handlers for `border-l-4`, `border-r-4`, `border-b-4`, `border-t`, and arbitrary `border-[#hex]` colors.

### Fix #6 — Width Classes (`w-1/2`, `w-1/3`, `md:w-1/2`)
**Problem:** Tailwind fractional widths weren't translated. Side-by-side containers both took 100%.
**Impact:** Critical for 2-column and 3-column layouts.
**Solution:** Maps `w-1/2` → `width: {unit:'%', size:50}` + `width_mobile: {unit:'%', size:100}`.

### Fix #7 — Text-Only Divs → text-editor Widgets
**Problem:** Divs with only text (no child elements) were wrapped in containers with no widget inside. The text was invisible.
**Impact:** Stats banners ("15+ Years", "5000+ Clients") showed as empty dark bars.
**Solution:** Detect `$(el).children().length === 0 && text` → emit `text-editor` widget with inline styling.

### Fix #8 — Captured Background Images from `absolute inset-0`
**Problem:** Stitch uses `<div class="absolute inset-0"><img src="..." class="object-cover"></div>` for section backgrounds. These were being skipped as decorative.
**Solution:** `processSection()` now scans for `absolute inset-0` children with `<img>` tags and captures the src as `background_image` on the outer container.

### Fix #9 — Default Dark Background on ALL Sections
**Problem:** Sections without explicit `bg-*` classes rendered as white.
**Impact:** The entire page looked like a broken light-theme site.
**Solution:** `processSection()` defaults to `CONFIG.colors.background` if no bg is found.

### Fix #10 — Smarter Tree Pruning
**Problem:** Over-aggressive tree pruning collapsed containers that had `flex_direction`, `background`, `flex_gap`, `width`, `border`, `min_height`, or `padding`.
**Impact:** Layout structures were destroyed.
**Solution:** Check for "structural role" before flattening:
```js
const hasStructuralRole = containerSettings.flex_direction ||
  containerSettings.background_background ||
  containerSettings.flex_gap ||
  containerSettings.width ||
  containerSettings.border_border ||
  containerSettings.min_height ||
  containerSettings.padding;
```

### Fix #11 — Hero Image Auto-Injection from Manifest
**Problem:** Manually editing hero JSONs for 20 pages was tedious and error-prone.
**Solution:** `page_manifest.json` now has `hero_pairs` with WP Media Library IDs. The compiler auto-injects `background_image + background_image_mobile + overlay` on the first section.

### Fix #12 — `border-white/XX` Opacity Patterns
**Problem:** `border-white/20` was treated as a class name, not parsed.
**Solution:** Regex extracts the opacity number, converts to `rgba(255,255,255,opacity)`.

### Fix #13 — `text-white/70` Opacity Text Colors
**Problem:** Like border-white, text opacity variants weren't parsed.
**Solution:** `extractTextColor()` handles `text-white/XX` → `rgba(255,255,255,opacity)`.

### Fix #14 — `flex-shrink-0` Empty Containers
**Problem:** Icon placeholder divs with `flex-shrink-0` produced empty dark bars after Material Symbols were stripped.
**Solution:** Skip containers with `flex-shrink-0` if they have zero children after processing.

### Fix #15 — `flex` Class Without Direction → Default Row
**Problem:** A `<div class="flex">` without explicit `flex-row` defaulted to no direction.
**Solution:** If `flex` class is present and no `flex_direction` was set, default to `row`.

### Fix #16 — Flex Row Containers Get Auto Mobile Stacking
**Problem:** Row containers without explicit responsive classes didn't stack on mobile.
**Solution:** All `flex_direction: 'row'` containers automatically get `flex_direction_mobile: 'column'` and `flex_wrap: 'nowrap'`.

---

**These fixes are ALL included in `scripts/compiler_v4_template.js`.** Copy it to your project root, update CONFIG, and run.

*V2.0.0 — Production-hardened, April 2026 — Verified with 20-page Evergreen Venezuela migration*
