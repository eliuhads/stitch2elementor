---
name: html-to-elementor
description: Convert HTML (or React/Tailwind markup) into valid, importable Elementor JSON templates. Use this skill whenever the user wants to turn HTML code into an Elementor template, generate Elementor JSON from a design, convert a landing page or section from HTML to Elementor format, create Elementor-compatible JSON for pasting or importing. Also trigger when the user mentions "Elementor JSON", "Elementor template from HTML", "convert to Elementor", or wants to build Elementor sections programmatically. Use even for partial conversions like single sections, headers, footers, or hero blocks.
---

# HTML → Elementor JSON Converter

Convert HTML/CSS markup into valid Elementor JSON templates that can be **imported via the Elementor template library** or **pasted directly into `_elementor_data` postmeta** via WP-CLI.

## Before you start

Read these reference files based on what you need:

- `docs/elementor-json-schema.md` — **Always read this first.** Official JSON structure, element types, and settings keys.
- `docs/widget-mapping.md` — How to map HTML elements to Elementor widgets with real examples.
- `docs/examples.md` — Complete input/output examples (hero section, features grid, CTA).
- `docs/gotchas.md` — **Read this before generating.** Critical lessons from real conversions.

## Two output formats

Ask the user which format they need:

### 1. Import Template (`.json` file)
Full template file importable via Elementor → Templates → Import:
```json
{
  "title": "My Section",
  "type": "page",
  "version": "0.4",
  "page_settings": [],
  "content": [ ...elements... ]
}
```

### 2. Content-only (for `_elementor_data`)
Just the `content` array, for injection via WP-CLI or MCP:
```json
[ ...elements... ]
```

If the user doesn't specify, default to **Import Template** format.

## Core conversion rules

### 1. Container hierarchy (Flexbox-first)

```
Outer container: content_width = "full"
  └─ Inner container: content_width = "boxed"
      └─ Widgets and nested containers
```

- `flex_direction: "row"` for horizontal, `"column"` for vertical
- Map `justify-content` → `flex_justify_content`
- Map `align-items` → `flex_align_items`
- Map `gap` → `flex_gap: {"unit":"px","size":"20","sizes":[],"column":"20","row":"20","isLinked":"1"}`

### 2. Widget selection strategy

**PRINCIPLE: Always prefer native Elementor widgets over the `html` widget.**

| HTML element | Elementor widget | Notes |
|---|---|---|
| `<h1>`–`<h6>` plain text | `heading` | Plain text only — strips `<i>`, `<span style>` |
| `<h1>`–`<h6>` with icons/HTML | `html` | Only fallback when heading sanitizes content |
| `<p>`, rich text | `text-editor` | Handles `<strong>`, `<em>`, `<a>`, `<ul>`, `<ol>` |
| `<img>` | `image` | Always native — gives responsive controls |
| `<a>` as button | `button` | Always native — gives hover states, sizing |
| `<ul>`/`<ol>` | `text-editor` | Put list HTML in the `editor` field |
| `<ul>` with FA icons | `icon-list` | Native widget with FA icon per item |
| `<hr>` | `divider` | Native widget |
| Empty spacing | `spacer` | Native widget with responsive height |
| SVG / embed / `<script>` | `html` | No native alternative |
| CSS/font loader | `html` | For `<link>` and `<style>` tags |

See `docs/gotchas.md` for sanitization specifics and edge cases.

### 3. Responsive settings

Desktop is the base (no suffix). Use `_tablet` and `_mobile` suffixes:

```json
{
  "padding": {"unit":"px","top":"60","right":"40","bottom":"60","left":"40","isLinked":""},
  "padding_tablet": {"unit":"px","top":"40","right":"20","bottom":"40","left":"20","isLinked":""},
  "padding_mobile": {"unit":"px","top":"20","right":"15","bottom":"20","left":"15","isLinked":""}
}
```

**Always set `flex_direction_mobile: "column"` for row layouts** unless horizontal mobile is explicitly required.

### 4. Element IDs

Every element needs a unique 8-char lowercase hex `id`. Use `uuid().hex[:8]` or equivalent:
```
"id": "a1b2c3d4"
```

### 5. Styling translation

- CSS colors → `background_color`, `title_color`, `text_color`
- CSS `background-image` → `background_background: "classic"` + `background_image.url`
- CSS `font-size` → `typography_typography: "custom"` + `typography_font_size: {"unit":"px","size":32}`
- CSS `padding`/`margin` → dimensional objects (see rule 15 below — never use shorthand strings)
- CSS `border-radius` → `border_radius` with same dimensional object structure

### 6. External dependencies (icons, fonts, smooth scroll)

Add an invisible container at the top of `content` with an `html` widget that loads required resources:

```json
{
  "id": "...",
  "elType": "container",
  "isInner": false,
  "settings": {
    "content_width": "full",
    "padding": {"unit":"px","top":"0","right":"0","bottom":"0","left":"0","isLinked":true}
  },
  "elements": [{
    "id": "...",
    "elType": "widget",
    "widgetType": "html",
    "isInner": false,
    "settings": {
      "html": "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css\" integrity=\"sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\"><style>html{scroll-behavior:smooth;}</style>"
    },
    "elements": []
  }]
}
```

### 7. Anchor scrolling

Use `_css_id` on a container, not on a widget:

```json
{
  "elType": "container",
  "isInner": true,
  "settings": {
    "content_width": "full",
    "_css_id": "section-name",
    "padding": {"unit":"px","top":"0","right":"0","bottom":"0","left":"0","isLinked":true}
  },
  "elements": []
}
```

### 8. Performance and structural rules

- **Anti-DOM Bloat:** Remove empty or redundant nested containers that add no flex properties.
- Avoid nesting containers more than 3 levels deep.
- Use native widget settings for styling; use `custom_css` only for `::before`/`::after` or complex hover transitions.

### 9. Theme compatibility

Some themes wrap Elementor content in their own boxed container. **Tell the user** to set Page Layout to "Elementor Full Width" or "Elementor Canvas" in page settings.

### 10. Security and sanitization checklist

Before outputting, verify:
- [ ] Strip all `<script>`, `<iframe>`, `onload=`, `onerror=` from input HTML (especially in `html` widgets)
- [ ] All external CDN links include `integrity` and `crossorigin` attributes
- [ ] All element IDs are unique 8-char hex across the entire JSON array

### 11. JSON validation checklist

- [ ] Every element has unique 8-char hex `id`
- [ ] Every element has `elType` (`"container"` or `"widget"`)
- [ ] Widgets have `widgetType`
- [ ] All elements have `isInner` (boolean) and `elements` (array)
- [ ] `settings` is `[]` when empty or `{}` when it has settings
- [ ] No trailing commas
- [ ] All strings properly escaped (especially raw SVGs)
- [ ] Responsive suffixes used correctly (`_tablet`, `_mobile`)
- [ ] Font/icon dependencies loaded via `html` widget if needed
- [ ] Anchor IDs on containers, not widgets

### 12. Enterprise migration — DOM Walker

For 20+ page migrations, build a recursive DOM parser (`cheerio` in Node.js or `BeautifulSoup` in Python). See `docs/gotchas.md` gotcha 14 for the complete pattern.

### 13. Mass injection and WAF limits

Large JSON payloads through standard WP browser requests trigger ModSecurity (406 errors). Use `update_page_from_file` via MCP or WP-CLI direct injection. For `elementor_library` (headers/footers), import manually via WP Dashboard → Elementor → Templates → Import. See `docs/gotchas.md` gotcha 12 and 13.

### 14. CRITICAL — Settings key reference (V4 production fixes)

| Wrong key (V3) | Correct key (V4) | Notes |
|---|---|---|
| `gap` | `flex_gap` | `{"unit":"px","size":"20","sizes":[],"column":"20","row":"20","isLinked":"1"}` |
| `align_items` | `flex_align_items` | Values: `flex-start`, `center`, `flex-end`, `stretch` |
| `justify_content` | `flex_justify_content` | Values: `flex-start`, `center`, `flex-end`, `space-between` |
| `margin` (on widgets) | `_margin` (on widgets) | `{"unit":"px","top":"0","right":"0","bottom":"16","left":"0","isLinked":false}` |
| `text_align` (headings) | `align` (headings) | Values: `left`, `center`, `right` |
| (missing) | `content_width` | `"full"` or `"boxed"` — required on every container |
| (missing) | `boxed_width` | `{"unit":"px","size":1200,"sizes":[]}` — for boxed containers |

### 15. CRITICAL — Padding/margin format (no shorthand strings)

Never pass CSS shorthand strings like `"padding": "15px 30px"` — crashes Elementor schema. Always use dimensional objects:

```json
{
  "padding": {
    "unit": "px",
    "top": "15", "right": "30", "bottom": "10", "left": "30",
    "isLinked": false
  }
}
```

### 16. CRITICAL — Root JSON semantic types

The root `type` field must be explicit: `"page"`, `"header"`, `"footer"`, `"popup"`. Always include `"page_settings": []` (empty array, not null or undefined) to prevent schema validation failures.

### 17. CRITICAL — Hero section background images

The compiler cannot extract hero backgrounds from Stitch HTML (rendered as `<img class="absolute inset-0 object-cover">`). Heroes must be manually set in JSON. Required settings:

```json
{
  "background_background": "classic",
  "background_image": {"url":"WP_MEDIA_URL","id":"MEDIA_ID","size":"","alt":"desc","source":"library"},
  "background_position": "center center",
  "background_size": "cover",
  "background_overlay_background": "gradient",
  "background_overlay_color": "rgba(14,19,32,0.85)",
  "background_overlay_color_b": "rgba(14,19,32,0.55)",
  "background_overlay_gradient_angle": {"unit":"deg","size":135,"sizes":[]},
  "min_height": {"unit":"vh","size":100,"sizes":[]}
}
```
Never use `lh3.googleusercontent.com` URLs — they expire within hours.

### 18. CRITICAL — Media pipeline and srcset

When mapping `<img src>` to an `image` widget, always include the WordPress Media Library `id` alongside the `url`. Without the internal ID, Elementor cannot generate responsive `srcset` variants or apply WebP compression:

```json
"image": {
  "url": "https://your-domain.com/wp-content/uploads/image.webp",
  "id": 42
}
```
Upload images to WP Media Library first, capture the returned ID, then build the widget.

### 19. CRITICAL — FULL+BOXED layout pattern (single source of truth)

```
OUTER CONTAINER (content_width: "full"):
  padding: {top:96, bottom:96, left:0, right:0, unit:"px"}

  INNER CONTAINER (content_width: "boxed"):
    boxed_width: {"unit":"px","size":1200,"sizes":[]}
    padding desktop: {top:0, bottom:0, left:60, right:60, unit:"px"}
    padding tablet:  {top:0, bottom:0, left:40, right:40, unit:"px"}
    padding mobile:  {top:0, bottom:0, left:20, right:20, unit:"px"}
```

## Step-by-step conversion process

1. **Analyze source** — Identify Tailwind layout, font/icon dependencies, global components (Header/Footer).
2. **Build walker** — For multi-page: DOM parser script. For single sections: simulate recursively.
3. **Map structure** — HTML wrappers → `container`. Set `flex_wrap: nowrap` for grids, pass exact `%` widths to children.
4. **Sanitize** — Strip `<script>`, `<iframe>`, inline events (`onload`).
5. **Apply native widgets** — `heading`, `text-editor`, `button`, `image` over `html` widget.
6. **Inject typography/styles** — Translate CSS/Tailwind into exact `settings` parameters. Use `_tablet`/`_mobile` keys.
7. **Generate unique IDs** — Strict 8-char hex per node.
8. **Validate** — Run through checklists 10 and 11.
9. **Inject** — Via `update_page_from_file` MCP or WP-CLI.
10. **Verify** — Confirm page layout is "Elementor Full Width" and test visual render.
