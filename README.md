<![CDATA[# ⚡ stitch2elementor

**Deterministic Hybrid Pipeline for Google Stitch → WordPress Elementor & Static HTML**

![Version](https://img.shields.io/badge/version-22.0.0-00c853.svg?style=flat-square)
![Pipeline](https://img.shields.io/badge/pipeline-Deterministic_Hybrid-0091ea.svg?style=flat-square)
![Elementor](https://img.shields.io/badge/Elementor-Atomic_Flexbox_v4-ff6d00.svg?style=flat-square)
![Python](https://img.shields.io/badge/python-3.10%2B_stdlib-3776AB.svg?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat-square)

---

## What is this?

An **AI agent skill** that converts [Google Stitch](https://stitch.withgoogle.com/) designs into production-ready websites through two strictly separated modes:

| Mode | Target | How it deploys |
|---|---|---|
| **Elementor (E)** | WordPress + Elementor Canvas | Programmatic injection via REST API / FTP + PHP |
| **Static (S)** | Any hosting with FTP/SFTP | Python build (`src/ → site/`) + FTPS upload |

> **Core principle:** The LLM orchestrates, decides, and verifies — the scripts transform and validate.  
> No `_elementor_data` is ever hand-written by the model. Everything goes through the deterministic pipeline.

---

## Why v20+ exists

Models like Gemini Flash, Qwen, and DeepSeek execute HTML→Elementor conversions, but fail in critical vectors:

| Failure Vector | What goes wrong |
|---|---|
| **V1** Schema hallucination | Duplicate IDs, invalid nesting, non-array `elements` |
| **V2** Responsive corruption | Lost CSS variables, broken layouts at 375px |
| **V3** Instruction ambiguity | LLM "remembers" steps instead of verifying artifacts |
| **V4** Asset/quota issues | Silent image omissions, quota exhaustion mid-build |
| **V5** Escaping Hell | Corrupted quotes/unicode in JSON-RPC transport |
| **V6** CSS inline bloat | 20KB+ duplicated CSS per page in database |
| **V7** Ghost cache | Elementor compiled CSS not reflecting DB changes |
| **V8** Mobile overflow | Terminals, grids, tables exceeding 375px viewport |

**The architectural answer**: remove free-form JSON generation from the LLM entirely. Every HTML→Elementor transformation is executed by deterministic Python scripts with a mandatory quality gate (linter) that decides via exit code whether a payload can be deployed.

---

## Architecture — Deterministic Hybrid Pipeline (Mode E)

```
HTML (Stitch/Edited) ──► [E1 EXTRACT]   scripts/extract_ir.py
                                         DOM parse → ir.json
                             │
                             ▼
                     [E2 COMPILE]        scripts/compile_ir_to_elementor.py
                                         IR → _elementor_data
                                         uuid5 IDs · boxed 1240px
                                         responsive injection · header/footer merge
                             │
                             ▼
                     [E3 LINT]           scripts/lint_elementor_json.py
                                         7 validation passes · exit≠0 = BLOCKED
                             │
                             ▼
                     [E4 DEPLOY+QA]      Base64 transport · CSS decoupling
                                         cache purge · Playwright dual-viewport
```

### Pipeline Scripts (Python 3.10+, stdlib only)

| Script | Stage | Purpose |
|---|---|---|
| [`extract_ir.py`](pipeline/extract_ir.py) | E1 | HTML → Intermediate Representation JSON |
| [`compile_ir_to_elementor.py`](pipeline/compile_ir_to_elementor.py) | E2 | IR → `_elementor_data` with deterministic uuid5 IDs |
| [`lint_elementor_json.py`](pipeline/lint_elementor_json.py) | E3 | Pre-flight validation gate (7 checks, exit codes) |
| [`asset_matrix.py`](pipeline/asset_matrix.py) | Assets | Page→file→ratio matrix with WebP budgets |
| [`elementor_schema.json`](pipeline/elementor_schema.json) | Schema | SSOT enumerations for the linter |

---

## Anti-Error Rules (R0–R18)

18 battle-tested rules, each born from a real production failure:

| Rule | Category | Summary |
|---|---|---|
| R0 | Mode selection | Choose E or S **before** designing |
| R1 | FTP safety | Mandatory probe file before any upload |
| R2 | Source separation | `src/` is truth, `site/` is ephemeral |
| R3 | Edit sources only | Never patch generated artifacts |
| R4 | Visual dimensions | Logo 48px, social icons 28px, WA button 56px |
| R5 | SEO from day one | Title + meta + canonical + JSON-LD per page |
| R6 | Brandbook-driven | 1240px boxed, client fonts, brand palette |
| R7 | Atomic batches | Full pipeline per change, no partial patches |
| R8 | Real photos | AI-generated with quota fallback, never emojis |
| R9 | No hand-written JSON | All Elementor payloads come from the compiler |
| R10 | Mechanical responsive | Auto-inject `flex_direction_mobile: column` |
| R11 | Stage contracts | Each stage → artifact + exit code |
| R12 | Base64 transport | Encode all RPC payloads, never manual escaping |
| R13 | CSS decoupling | Master stylesheet in `/uploads/`, not inline |
| R14 | Multi-level cache purge | `_elementor_css` + `clear_cache()` + `wp_cache_flush()` |
| R15 | Mobile specificity | `!important` on structural media queries |
| R16 | Canvas reset | Neutralize Elementor's residual white backgrounds |
| R17 | Flexbox containers | `elType: "container"` only, no legacy sections |
| R18 | Atomic widget mapping | Native `heading`, `text-editor`, `image`, `button` |

---

## Project Structure

```
PROJECT/
├── BRANDBOOK.md                ← Client's brand guidelines
├── src/                        ← SOURCES: tokens.css, build.py, pages.py, assets/
├── site/                       ← OUTPUT (safe to delete/regenerate)
├── ir/                         ← IRs (E1) + Elementor payloads (E2)
│   └── reports/                ← lint.json + asset_matrix.json (E3 evidence)
├── deploy.py                   ← FTPS upload script
├── seo_pack.py                 ← Meta tags + JSON-LD generator
├── probe_docroot.py            ← FTP docroot verification
└── post_deploy_verify.py       ← Automated acceptance checklist
```

---

## Interactive Menu (10 Options)

```
=====================================================================
      ⚡ STITCH2ELEMENTOR v22.0 — ATOMIC FLEXBOX PIPELINE ⚡
=====================================================================
Mode:  [E] Elementor Canvas (WP)  |  [S] Static HTML (Python)
=====================================================================
 [1] Ingest brandbook + copy + assets
 [2] Audit inputs and gaps (logo, colors, copy, images)
 [3] Generate in Stitch (desktop screens, design system)
 [4] Extract HTMLs from Stitch to local folder
 ─────────────────────────────────────────────────────────────────
 Mode E (Elementor):
 [5E] E1+E2: extract → compile (with --header/--footer)
 [6E] E3: lint (mandatory, exit=0) → E4: deploy + verify + purge
 ─────────────────────────────────────────────────────────────────
 Mode S (Static HTML):
 [5S] Build static site (src/ → site/)
 [6S] Deploy via FTPS to /subfolder
 ─────────────────────────────────────────────────────────────────
 [7] Post-deploy verification (HTTP 200, Playwright dual-viewport)
 [8] SEO only (generate/update meta tags + JSON-LD)
 [9] Components only (header/footer/WA button/social icons)
 [10] Custom / Free
=====================================================================
```

---

## Dependencies

| Resource | Type | Mode |
|---|---|---|
| [Google Stitch](https://stitch.withgoogle.com/) MCP | MCP Server | Both |
| NotebookLM MCP | MCP Server | Both |
| Novamira MCP / WP-Elementor MCP | MCP Server | Elementor |
| Playwright (remote, Proxmox) | QA Runner | Both |
| `design-taste-frontend` | Agent Skill | Both |
| Pipeline scripts (`extract_ir`, `compile_ir`, `lint`) | Python stdlib | Mode E |
| `asset_matrix.py` | Python stdlib | Both |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/eliuhads/stitch2elementor.git

# 2. Copy pipeline scripts to your agent's skill directory
cp -r pipeline/ /path/to/your/.agents/skills/stitch2elementor/scripts/

# 3. Copy SKILL.md for agent integration
cp SKILL.md /path/to/your/.agents/skills/stitch2elementor/

# 4. Run the pipeline (example: Mode E)
python3 pipeline/extract_ir.py input.html -o ir.json
python3 pipeline/compile_ir_to_elementor.py ir.json -o page_elementor.json
python3 pipeline/lint_elementor_json.py page_elementor.json  # exit 0 = ready to deploy
```

---

## Repository Structure

```
stitch2elementor/
├── SKILL.md                    ← Agent skill definition (v22, 410 lines)
├── CHANGELOG.md                ← Full version history
├── README.md                   ← This file
├── pipeline/                   ← v20+ Deterministic Python scripts (E1-E3 + assets)
│   ├── extract_ir.py
│   ├── compile_ir_to_elementor.py
│   ├── lint_elementor_json.py
│   ├── asset_matrix.py
│   └── elementor_schema.json
├── scripts/                    ← Legacy v4.x Node.js/PHP scripts (Evergreen era)
├── archive/                    ← Archived scripts from earlier versions
├── docs/                       ← Technical documentation
├── examples/                   ← Example configs and templates
├── schemas/                    ← JSON Schema for Elementor data validation
├── templates/                  ← Project templates
└── .agent/skills/              ← Bundled sub-skills for agent orchestration
```

> **Note:** The `scripts/` directory contains legacy Node.js scripts from the v4.x era (Evergreen migration). They are preserved for reference but are **not part of the current pipeline**. The active pipeline lives in `pipeline/`.

---

## Acceptance Checklist (v22)

- [ ] Mode selected before design (E / S)
- [ ] **(E)** Flexbox Containers (`elType: "container"`) — no legacy sections
- [ ] **(E)** Native Widgets for headings, text, images, buttons
- [ ] **(E)** Base64 transport in all RPC/PHP scripts
- [ ] **(E)** Decoupled master CSS uploaded to `/uploads/`
- [ ] **(E)** Multi-level cache purge executed
- [ ] **(E)** `lint_elementor_json.py` exit=0 on all payloads
- [ ] **(E)** No hand-written `_elementor_data`
- [ ] **(E)** `_elementor_page_settings` as PHP array (not JSON string)
- [ ] Assets: `asset_matrix.py verify` exit=0 (100% coverage, WebP budgets OK)
- [ ] All URLs return HTTP 200
- [ ] Client's root site untouched (200, no modifications)
- [ ] Logo SVG at 48px (±8px) measured in DOM
- [ ] Social icons 28px with per-network colors
- [ ] WhatsApp button: floating 56px + inline 40px icon-only
- [ ] SEO pack on every page (title + desc + keywords + canonical + JSON-LD)
- [ ] Playwright dual-viewport (1440px + 375px) with `isOverflow: false`
- [ ] Zero credentials in versioned files

---

## Changelog Highlights

### v22.0.0 (2026-08-18)
- **Atomic Flexbox Containers (R17)**: Mandatory migration to `elType: "container"`, eliminating legacy sections/columns
- **Native Editable Widget Mapping (R18)**: Semantic decomposition into `heading`, `text-editor`, `image`, `button` widgets
- **Dual Validation**: Playwright verification on Proxmox CT252 for full Flexbox Container suites

### v21.0.0 (2026-08-17)
- **Base64 Transport (R12)**: Eliminated Escaping Hell in RPC/PHP
- **CSS Decoupling (R13)**: Centralized stylesheets in `/uploads/`
- **Multi-level Cache Purge (R14)**: Exhaustive Elementor cache clearing
- **Mobile Specificity (R15)**: Immutable `!important` rules for 375px
- **Canvas Isolation (R16)**: Global resets for Elementor wrappers

### v20.0.0 (2026-08-16)
- **Deterministic Hybrid Pipeline**: E1→E2→E3 Python scripts replace free-form LLM JSON generation
- **Failure Matrix V1–V4**: Documented with deterministic mitigations
- **Anti-Error Rules R9–R11**: No hand-written JSON, mechanical responsive, stage contracts

[Full changelog →](CHANGELOG.md)

---

## License

MIT — Created for the [Antigravity AI](https://github.com/eliuhads) agent suite.
]]>
