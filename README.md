<![CDATA[<div align="center">

# ⚡ stitch2elementor (v22.0.0)

### *The Universal Deterministic Bridge from Google Stitch AI to WordPress Elementor & Static Web*

[![GitHub Stars](https://img.shields.io/github/stars/eliuhads/stitch2elementor?style=for-the-badge&color=ffd600)](https://github.com/eliuhads/stitch2elementor/stargazers)
[![Version](https://img.shields.io/badge/version-22.0.0-00e676.svg?style=for-the-badge)](CHANGELOG.md)
[![Pipeline](https://img.shields.io/badge/pipeline-Deterministic_Hybrid-00b0ff.svg?style=for-the-badge)](pipeline/)
[![Elementor](https://img.shields.io/badge/Elementor-Atomic_Flexbox_v4-ff6d00.svg?style=for-the-badge)](https://elementor.com)
[![Universal Agents](https://img.shields.io/badge/Agents-OpenCode%20%7C%20Antigravity%20%7C%20Claude%20%7C%20Cursor%20%7C%20Zed-7c4dff.svg?style=for-the-badge)](#-universal-ai-agent-compatibility)
[![Python](https://img.shields.io/badge/Python-3.10%2B%20Stdlib%20(Zero--Deps)-3776AB.svg?style=for-the-badge)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-white.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Tired of AI agents hallucinating broken Elementor JSONs, escaping strings into oblivion, or locking clients into uneditable code?</b><br>
  <code>stitch2elementor</code> turns any AI coding agent into a production-grade UI engineer that compiles Google Stitch designs into native, client-editable Elementor Flexbox Containers and lightning-fast Static HTML.
</p>

[🌟 Star on GitHub](https://github.com/eliuhads/stitch2elementor) • [📖 Architecture](#-architecture--deterministic-hybrid-pipeline) • [⚡ Universal Compatibility](#-universal-ai-agent-compatibility) • [🛡️ The 18 Anti-Error Rules](#-18-battle-tested-anti-error-rules-r0r18) • [🚀 Quick Start](#-quick-start)

---

</div>

## 💡 The Story & The Engineering Journey

Bridging modern generative UI tools like **[Google Stitch](https://stitch.withgoogle.com/)** with production CMS platforms like **WordPress Elementor** has historically been a nightmare for developers and AI agents alike:

* ❌ LLMs freely writing `_elementor_data` JSON hallucinate schemas, generate colliding IDs, and crash the Elementor canvas editor.
* ❌ Inlined CSS and manual quote-escaping create payload bloat ("Escaping Hell") and silent REST API dropouts.
* ❌ Unvetted responsive conversions result in horizontal scroll overflows on 375px mobile screens.

**`stitch2elementor` is the result of months of deep research, extensive synthesis via NotebookLM, persistent Memory Bank validation, and 22 major architectural iterations deployed in live enterprise production.**

Instead of letting LLMs guess JSON syntax, we decoupled the intelligence:
> **The AI Agent orchestrates, directs, and audits — while deterministic, zero-dependency Python scripts (stdlib only) extract, compile, and lint the AST.**

The result? **100% pixel-accurate, clean, native Elementor pages with 0 hallucination risk.**

---

## 🤖 Universal AI Agent Compatibility

`stitch2elementor` is **100% agnostic and non-exclusive**. It requires no vendor lock-in and runs inside any AI coding assistant or environment that has terminal/workspace execution capabilities:

| AI Agent / IDE | Integration Mode | Status |
|---|---|---|
| **OpenCode** | CLI / Desktop workspace skill & subtools | 🟢 Verified & Native |
| **Google Antigravity** | Agent skill (`.agents/skills/stitch2elementor/`) | 🟢 Verified & Native |
| **Claude Code (Anthropic)** | Workspace tool / CLI executor | 🟢 100% Compatible |
| **Cursor / Windsurf** | `.cursorrules` / System prompt workflow | 🟢 100% Compatible |
| **Zed Editor** | Task runner / Assistant integration | 🟢 100% Compatible |
| **Cline / Roo Code** | Custom agent role & MCP pipeline | 🟢 100% Compatible |
| **Standalone Terminal** | Pure Python 3.10+ CLI without AI | 🟢 100% Usable via CLI |

---

## 🎯 Dual-Track Deployment Engine

Choose the optimal deployment path before designing:

```
                                  ┌──────────────────────────────┐
                                  │   Google Stitch UI Design    │
                                  │    (HTML5 + Tailwind CSS)    │
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
             [ TRACK E: ELEMENTOR ]                            [ TRACK S: STATIC HTML ]
      WordPress + Elementor Canvas                      High-Performance Edge / Apache
 ──────────────────────────────────────────       ──────────────────────────────────────────
 • Atomic Flexbox Containers (v4)                 • Multi-page pure HTML5/CSS3 build
 • Native editable widgets (H1-H4, Text, Img)     • Decoupled CSS design tokens
 • Base64-safe REST / PHP transport               • Automated FTPS deployment
 • Multi-level server cache purge                 • Dual-viewport Playwright verification
```

---

## 🏛️ Architecture — Deterministic Hybrid Pipeline

```
HTML (Stitch/Edited) ──► [E1 EXTRACT]   pipeline/extract_ir.py
                                         DOM AST Parse (stdlib) → ir.json (sections, headings, imgs, ctas)
                             │
                             ▼
                     [E2 COMPILE]        pipeline/compile_ir_to_elementor.py
                                         IR → _elementor_data · uuid5 deterministic IDs (7 hex)
                                         · Boxed 1240px container · Mechanical mobile flex injection
                                         · Header/Footer merge with collision-proof re-hashing
                             │
                             ▼
                     [E3 LINT]           pipeline/lint_elementor_json.py  ──► [ MANDATORY QUALITY GATE ]
                                         7 validation passes: Schema · UUIDs · Flexbox · Boxed width
                                         · Responsive properties · Element integrity (Exit code ≠ 0 blocks deploy)
                             │
                             ▼
                     [E4 DEPLOY+QA]      Base64 RPC transport (R12) · Decoupled master CSS (/uploads/)
                                         · Multi-level cache purge (R14) · Remote Playwright QA (CT252)
```

---

## 🛡️ 18 Battle-Tested Anti-Error Rules (R0–R18)

Every rule in this engine was forged from real-world production post-mortems:

| Rule | Title | What it Prevents |
|---|---|---|
| **R0** | **Mode Selection** | Ambiguity between CMS deployment vs. standalone static build. |
| **R1** | **FTP Probe Mandatory** | Resolves docroot mismatch (`/` vs `public_html/`) before payload transmission. |
| **R2** | **Source vs Artifact Split** | Keeps `src/` as single source of truth; `site/` remains completely ephemeral. |
| **R3** | **Immutable Generated Code** | Prohibits live patches on built files; all fixes flow through `src/` recompilation. |
| **R4** | **Golden UI Dimensions** | Hard limits on logo size (48px) and action buttons to avoid visually oversized headers. |
| **R5** | **Native SEO Injection** | Auto-injects canonical links, meta tags, and structured JSON-LD schemas on build. |
| **R6** | **Brandbook Token Anchor** | 1240px boxed layouts and strict typography mapped directly from brand guidelines. |
| **R7** | **Atomic Batch Execution** | Changes are compiled in complete batches; prevents broken halfway deployments. |
| **R8** | **AI Asset Matrix & WebP** | Rigorous asset accounting matrix with budget caps (Hero <130KB, Cards <100KB). |
| **R9** | **Banned Hand-Crafted JSON** | Prohibits free-form LLM JSON synthesis. All payloads must emerge from the compiler. |
| **R10** | **Mechanical Responsive Rules**| Enforces `flex_direction_mobile: column` and `width_mobile: 100%` mechanically. |
| **R11** | **Deterministic Stage Contracts**| Every stage outputs JSON + exit code (0=Pass, 1=Fail). Machine-audited pipeline. |
| **R12** | **Base64 Payload Transport** | Eliminates character corruptions and *Escaping Hell* across PHP/REST boundaries. |
| **R13** | **Decoupled Master Stylesheet**| Stores CSS in `/wp-content/uploads/` rather than bloating the database with 20KB inline CSS. |
| **R14** | **Multi-Level Cache Purge** | Automatically purges `_elementor_css`, Elementor file manager, and WP object cache. |
| **R15** | **Mobile Breakpoint Specificity**| Mandatory `!important` containment on mobile wrappers to eliminate 375px overflow. |
| **R16** | **Canvas Reset Isolation** | Neutralizes Elementor's default background artifacts and wrapper margins. |
| **R17** | **Atomic Flexbox Containers** | Full migration to Elementor v4 `elType: "container"` (eliminates legacy sections). |
| **R18** | **Native Editable Widgets** | Mappable `heading`, `text-editor`, `image`, and `button` widgets for client editing. |

---

## ⚡ Interactive Agent Menu

When invoked, the agent operates through an intuitive, structured command interface:

```text
=====================================================================
      ⚡ STITCH2ELEMENTOR v22.0 — DETERMINISTIC AGENT PIPELINE ⚡
=====================================================================
Target Mode:  [E] Elementor Canvas (WP)  |  [S] Static HTML (Python)
=====================================================================
 [1] Ingest brandbook + copy + assets (Brand System)
 [2] Audit inputs and gaps (logo, palette, typography, photography)
 [3] Generate screens in Google Stitch MCP (desktop + design system)
 [4] Extract raw HTML/CSS from Stitch to local workspace
 ─────────────────────────────────────────────────────────────────
 Mode E (Elementor Canvas):
 [5E] E1+E2: extract_ir.py → compile_ir_to_elementor.py (Flexbox Containers)
 [6E] E3: lint_elementor_json.py (Exit=0) → E4: Base64 Deploy & Cache Purge
 ─────────────────────────────────────────────────────────────────
 Mode S (Static HTML):
 [5S] Build static pages (src/ → site/ via Python pages.py)
 [6S] Deploy static site via FTPS to target server subfolder
 ─────────────────────────────────────────────────────────────────
 [7] Post-Deploy QA (HTTP 200 checks + Playwright dual-viewport audit)
 [8] SEO Engine (Structured JSON-LD + OpenGraph + Meta verification)
 [9] Component Lab (Header, Footer, Floating WhatsApp, Social Matrix)
 [10] Free / Custom Execution
=====================================================================
```

---

## 🚀 Quick Start

### 1. Install / Clone
```bash
git clone https://github.com/eliuhads/stitch2elementor.git
cd stitch2elementor
```

### 2. Run the Deterministic Compiler Manually
```bash
# E1: Extract DOM Intermediate Representation
python3 pipeline/extract_ir.py input_stitch.html -o ir.json

# E2: Compile to Elementor Flexbox Containers
python3 pipeline/compile_ir_to_elementor.py ir.json -o page_elementor.json

# E3: Run the Quality Gate Linter (Exit Code 0 = Ready)
python3 pipeline/lint_elementor_json.py page_elementor.json
```

### 3. Agent Integration
Copy `SKILL.md` and the `pipeline/` directory into your agent workspace (e.g. `.agents/skills/stitch2elementor/` or OpenCode/Cursor tools) and let your agent operate with 100% deterministic safety.

---

## 📊 Comparison: LLM Raw Generation vs. `stitch2elementor`

| Feature | Raw LLM Generation | `stitch2elementor` Pipeline |
|---|---|---|
| **Schema Integrity** | ⚠️ Frequent invalid keys / non-arrays | ✅ 100% Compliant against JSON Schema |
| **ID Collision** | ❌ High risk (breaks Elementor editor) | ✅ Deterministic `uuid5` hash generation |
| **Mobile 375px Overflow** | ❌ Frequent horizontal scrolling | ✅ Hardened with mechanical `!important` |
| **Client Editability** | ⚠️ Often lumps everything into raw HTML | ✅ Native widgets (`heading`, `button`, etc.) |
| **Database Performance** | ❌ Bloated with 20KB+ inline CSS per page | ✅ Decoupled master stylesheet in uploads |
| **Deployment Safety** | ❌ Unverified injections | ✅ Pre-flight linter gate with exit codes |

---

## 🤝 Community, Support & Contributions

`stitch2elementor` is an open-source initiative dedicated to advancing the state of **deterministic Agentic Web Engineering**.

* 🌟 **Leave a Star**: If this repository helped you automate your web workflow, star the repo to support continuous development!
* 🐛 **Report Issues**: Found a strange edge case in Elementor or Google Stitch? Open an [Issue](https://github.com/eliuhads/stitch2elementor/issues).
* 💡 **Pull Requests**: Contributions to compiler rules, new widget mappings, and agent integrations are warmly welcomed.

---

<div align="center">

**Built with ❤️ for the AI pair-programming revolution.**  
Maintained by [@eliuhads](https://github.com/eliuhads) • Licensed under [MIT](LICENSE)

</div>
]]>
