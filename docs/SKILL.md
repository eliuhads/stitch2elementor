---
name: html-to-elementor
description: Convert HTML (or React/Tailwind markup) into valid, importable Elementor JSON templates. Use this skill whenever the user wants to turn HTML code into an Elementor template, generate Elementor JSON from a design, convert a landing page or section from HTML to Elementor format, create Elementor-compatible JSON for pasting or importing. Also trigger when the user mentions "Elementor JSON", "Elementor template from HTML", "convert to Elementor", or wants to build Elementor sections programmatically. Use even for partial conversions like single sections, headers, footers, or hero blocks.
---

# HTML to Elementor JSON Converter

Convert HTML/CSS markup into valid Elementor JSON templates that can be **imported via the Elementor template library** or **pasted directly into `_elementor_data` postmeta** via WP-CLI.

## Before you start

Read these reference files based on what you need:

- `references/elementor-json-schema.md` — **Always read this first.** The official JSON structure, element types, and settings keys from Elementor developer docs + real export analysis.
- `references/widget-mapping.md` — How to map HTML elements to Elementor widgets with real examples.
- `references/examples.md` — Complete input/output examples (hero section, features grid, CTA).
- `references/gotchas.md` — **Read this before generating.** Critical lessons from real-world conversions: widget sanitization, icon loading, anchor scrolling, theme conflicts.

## Two output formats

Ask the user which format they need:

### 1. Import Template (`.json` file)
Full template file you can import in Elementor > Templates > Import:
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
Just the `content` array, for pasting into postmeta via WP-CLI:
```json
[ ...elements... ]
```

If the user doesn't specify, default to **Import Template** format since it's more portable.

## Core conversion rules

### 1. Container hierarchy (Flexbox-first)
Elementor uses containers (not the old sections/columns). Every layout wrapper becomes a container element:

```
Outer container: content_width = "full" (stretches to viewport)
  └─ Inner container: content_width = "boxed" (constrains to ~1140px)
      └─ Widgets and nested containers
```

- Use `flex_direction: "row"` for horizontal layouts, `"column"` for vertical stacking
- Map CSS `justify-content` to Elementor's `flex_justify_content` setting
- Map CSS `align-items` to Elementor's `flex_align_items` setting
- Map CSS `gap` to Elementor's `flex_gap` setting (format: `{"unit": "px", "size": "20", "sizes": [], "column": "20", "row": "20", "isLinked": "1"}`)

### 2. Widget selection strategy

**PRINCIPLE: Always prefer native Elementor widgets over the `html` widget.** Native widgets are editable in the visual editor, respond to global styles, and work with Elementor's responsive controls. The `html` widget should be a last resort.

| HTML element | Elementor widget | Notes |
|-------------|-----------------|-------|
| `<h1>`-`<h6>` plain text | `heading` | Works great for plain text headings |
| `<h1>`-`<h6>` with icons/HTML | `html` | Only because `heading` sanitizes `<i>`, `<span style>` |
| `<p>`, rich text | `text-editor` | Handles `<strong>`, `<em>`, `<a>`, `<ul>`, `<ol>`, inline styles |
| `<img>` | `image` | Always use native -- gives responsive controls |
| `<a>` as button | `button` | Always use native -- gives hover states, sizing |
| `<ul>`/`<ol>` | `text-editor` | Put the list HTML in the `editor` field |
| `<ul>` with FA icons | `icon-list` | Native widget with FA icon support per item |
| Navigation-style links | `icon-list` | Numbered/bulleted link lists (like TOC) |
| `<hr>` | `divider` | Native widget with color, width, gap controls |
| Empty spacing | `spacer` | Native widget with responsive height |
| SVG / embed / `<script>` | `html` | No native alternative exists |
| CSS/font loader | `html` | For injecting `<link>` and `<style>` tags |

**When to use `html` widget (last resort only):**
- Headings with FA icons or colored `<span>` (heading widget sanitizes these)
- Loading external CSS/fonts (`<link>` tags)
- Injecting `<style>` blocks (like `scroll-behavior: smooth`)
- Complex SVG or embed code
- Markup that has no native Elementor equivalent

**When NOT to use `html` widget:**
- Table of contents -- use `text-editor` with `<ol>` list, or `icon-list` widget
- Paragraphs with bold/links -- use `text-editor`
- Bullet lists -- use `text-editor` with `<ul>` or `icon-list` widget
- Buttons -- use `button` widget
- Images -- use `image` widget
- Data blocks / styled boxes -- use `text-editor` with inline styles in `editor` field
- Anything the user might want to edit visually later

See `references/widget-mapping.md` for full details and `references/gotchas.md` for sanitization specifics.

### 3. Responsive settings
Elementor uses suffixed keys for breakpoints. Desktop is the base (no suffix):

```json
{
  "padding": {"unit": "px", "top": "60", "right": "40", "bottom": "60", "left": "40", "isLinked": ""},
  "padding_tablet": {"unit": "px", "top": "40", "right": "20", "bottom": "40", "left": "20", "isLinked": ""},
  "padding_mobile": {"unit": "px", "top": "20", "right": "15", "bottom": "20", "left": "15", "isLinked": ""}
}
```

Same suffix pattern applies to: `flex_direction_tablet`, `flex_direction_mobile`, `flex_gap_tablet`, `flex_gap_mobile`, `flex_align_items_tablet`, etc.

**Always set mobile `flex_direction` to `"column"` for row layouts** unless the user explicitly needs horizontal mobile layout.

### 4. Element IDs
Every element needs a unique `id` -- an 8-character lowercase hex string. Generate unique ones (e.g. using `uuid` slices) to prevent DOM collision:
```
"id": "a1b2c3d4"
```

### 5. Styling translation
- CSS colors -> Elementor color settings (e.g., `background_color`, `title_color`)
- CSS `background-image` -> `background_background: "classic"` + `background_image.url`
- CSS `font-size` -> `typography_typography: "custom"` + `typography_font_size: {"unit": "px", "size": 32}`
- CSS `font-weight` -> `typography_font_weight: "600"`
- CSS `padding`/`margin` -> `padding`/`_margin` objects with `unit`, `top`, `right`, `bottom`, `left`, `isLinked`
- CSS `border-radius` -> `border_radius` with same structure

### 6. External dependencies (icons, fonts, smooth scroll)

If the source HTML uses Font Awesome, Google Fonts, or `scroll-behavior: smooth`, you MUST inject a loader. Add an invisible container at the very top of the `content` array with an `html` widget that loads the required resources:

```json
{
  "id": "...",
  "elType": "container",
  "isInner": false,
  "settings": {
    "content_width": "full",
    "padding": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true},
    "margin": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true}
  },
  "elements": [{
    "id": "...",
    "elType": "widget",
    "widgetType": "html",
    "isInner": false,
    "settings": {
      "html": "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css\" integrity=\"sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\"><link href=\"https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap\" rel=\"stylesheet\"><style>html{scroll-behavior:smooth;}</style>"
    },
    "elements": []
  }]
}
```

This ensures icons and fonts render even if the theme doesn't load them. The `scroll-behavior: smooth` enables anchor link scrolling from TOCs.

### 7. Anchor scrolling (TOC links, jump links)

Elementor's `_css_id` setting adds an `id` attribute to an element's wrapper div. To make anchor links like `#section-name` work:

**Wrap each anchor target in a container** with `_css_id` set to the anchor name:

```json
{
  "id": "...",
  "elType": "container",
  "isInner": true,
  "settings": {
    "content_width": "full",
    "_css_id": "section-name",
    "padding": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true}
  },
  "elements": [ ...section content widgets... ]
}
```

Do NOT put `_css_id` directly on a widget -- it works on the widget wrapper but scroll targeting is unreliable. A dedicated container is more predictable.

### 8. Performance & Structural rules
- **Tree Pruning (Anti-DOM Bloat):** Actively remove or bypass empty, redundant nested containers (like a `<div>` inside a `<div>` that offers no new flex layout properties). Collapse them to prevent inflating the JSON tree.
- Avoid nesting containers more than 3 levels deep
- Use native Elementor widget settings for styling when possible
- Use `custom_css` only for pseudo-elements (::before, ::after) or complex hover transitions
- Minimize containers -- if a section only has stacked widgets, one container with `flex_direction: "column"` is enough
- For long documents (legal pages, policies), wrap each section in a container for anchor scrolling, and use native widgets inside for editability

### 9. Theme compatibility

Some themes (Phlox, Astra, etc.) wrap Elementor content in their own boxed container. The JSON template alone cannot force full-width layout. **Tell the user** to:
1. Set Page Layout to "Elementor Full Width" or "Elementor Canvas" in page settings
2. Or go to Elementor > Settings > General and set Default Page Layout

### 10. Security & Sanitization checklist
**CRITICAL SECURITY STEP:** Before outputting, you MUST sanitize the source HTML:
- [ ] **XSS Prevention**: Strip all `<script>`, `<iframe>`, `onload=`, `onerror=`, and any inline javascript from the input HTML before placing it into the JSON (especially within `html` widgets).
- [ ] **SRI Hashes**: Ensure all external CDN links (like FontAwesome) use `integrity` and `crossorigin` attributes.
- [ ] **ID Collision**: Ensure randomly generated 8-char hex IDs are completely unique across the entire JSON array.

### 11. JSON validation checklist
Before outputting, verify:
- [ ] Every element has a unique 8-char hex `id`
- [ ] Every element has `elType` ("container" or "widget")
- [ ] Widgets have `widgetType` set
- [ ] All elements have `isInner` (boolean) and `elements` (array)
- [ ] `settings` is `[]` (empty array) when no settings, or `{}` (object) when it has settings
- [ ] No trailing commas in JSON
- [ ] All strings properly escaped, especially **raw SVGs** (ensure double quotes `\"` and line breaks are strictly escaped to prevent JSON corruption)
- [ ] Responsive suffixes used correctly (`_tablet`, `_mobile`)
- [ ] The JSON is valid and parseable
- [ ] Font/icon dependencies are loaded via html widget if needed
- [ ] Anchor IDs are on containers, not widgets

## 12. Enterprise Migration Strategy (DOM Walker)

For large-scale migrations (like replacing 20+ Tailwind HTML templates), manual JSON crafting or basic text replacement is insufficient and error-prone. The definitive strategy proven to work is the **Recursive DOM Walker**:
1. Use an automated parser (e.g., `cheerio` in Node.js) to read the source HTML.
2. Recursively crawl the DOM tree.
3. Map every layout tag (`<section>`, `<div>`) to a Flexbox `container`.
4. Accurately translate Tailwind grid classes (`grid-cols-X`) into Flexbox `row` + `nowrap` + proportional child widths, reverting to `column` for mobile.
5. Map typography and atomic nodes (`<h1>`, `<p>`, `<a>`) to their exact native Elementor widgets (`heading`, `text-editor`, `button`).
6. Build and inject a single invisible `html` widget per page to load necessary fonts or CSS variables.
By outputting this through a compiler script, you guarantee 100% native Elementor editability devoid of monolithic HTML blocks.

## 13. Mass Injection and WAF Limits

When updating massive pages, avoid passing large stringified JSON payloads through standard WordPress browsers or generic REST endpoints, as they often trigger ModSecurity (WAF 406 Not Acceptable errors).
**Instead:**
- Leverage local MCP integration tools (like `update_page_from_file`).
- Or use WP-CLI to inject the JSON directly into the `_elementor_data` postmeta directly on the server.
- Note: Global Elements (like Headers or Footers) under the `elementor_library` custom post type may have strict permissions. Be prepared to manually import these specific JSON files via the Elementor Template Library interface.

## Step-by-step conversion process (Architectural Flow)

1. **Analyze the Source** -- Understand the Tailwind/HTML layout structure, theme dependencies (fonts, icons), and isolate Global components (Header/Footer).
2. **Build the Walker** -- For multi-page projects, build a DOM conversion script. For single sections, simulate the recursive walker mentally.
3. **Map the Structure** -- Convert HTML wrappers to `container`. CRITICAL: Ensure `flex_wrap: nowrap` for grids, passing exact % widths to children.
4. **Sanitize the Content** -- Actively strip `<script>`, `<iframe>`, or inline events (`onload`). `heading` widgets will auto-sanitize inline tags.
5. **Apply Native Widgets** -- Avoid the `html` widget. Use `heading`, `text-editor`, `button`, and `image`.
6. **Inject Typography & Styles** -- Translate CSS/Tailwind into the exact `settings` parameters within the Elementor JSON logic. Use `_tablet` and `_mobile` keys for responsive adaptations.
7. **Generate Unique IDs** -- Enforce strict 8-character hex ID generation for every single node to prevent DOM collisions.
8. **Validate** -- Run through the JSON validation checklist. No trailing commas, valid Flexbox hierarchy.
9. **Inject** -- Push to the WordPress environment via MCP server scripts (`update_page_from_file`) or WP-CLI to bypass WAF limitations.
10. **Verify** -- Instruct the user to verify the Page Layout setting is "Elementor Full Width" and test the visual render.

## 14. CRITICAL — Elementor Settings Key Reference (V4 Production Fixes)

**These keys were initially incorrect and caused silent layout failures. The JSON accepts injection without errors, but the layout simply doesn't work.**

| WRONG Key (V3)          | CORRECT Key (V4)           | Format / Notes                                              |
|-------------------------|----------------------------|-------------------------------------------------------------|
| `gap`                   | `flex_gap`                 | `{"unit":"px","size":"20","sizes":[],"column":"20","row":"20","isLinked":"1"}` |
| `align_items`           | `flex_align_items`         | Values: `flex-start`, `center`, `flex-end`, `stretch`       |
| `justify_content`       | `flex_justify_content`     | Values: `flex-start`, `center`, `flex-end`, `space-between` |
| `margin` (on widgets)   | `_margin` (on widgets)     | `{"unit":"px","top":"0","right":"0","bottom":"16","left":"0","isLinked":false}` |
| `text_align` (headings) | `align` (headings)         | Values: `left`, `center`, `right`                           |
| (missing)               | `content_width`            | `"full"` or `"boxed"` — REQUIRED on every container         |
| (missing)               | `boxed_width`              | `{"unit":"px","size":1200,"sizes":[]}` — for boxed containers |

### Responsive suffixes: `_tablet`, `_mobile`
Apply to: `padding`, `flex_direction`, `flex_gap`, `typography_font_size`, `min_height`, `background_image`, etc.

## 15. CRITICAL — Hero Section Background Images

**The compiler CANNOT extract hero background images from Stitch HTML.** Stitch renders heroes with `<img class="absolute inset-0 object-cover">` which the DOM walker discards. Heroes MUST be manually edited in the JSON.

### Required hero container settings:
```json
{
  "background_background": "classic",
  "background_image": {"url":"WP_MEDIA_URL","id":"MEDIA_ID","size":"","alt":"desc","source":"library"},
  "background_image_mobile": {"url":"MOBILE_URL","id":"MOBILE_ID","size":"","alt":"","source":"library"},
  "background_position": "center center",
  "background_size": "cover",
  "background_overlay_background": "gradient",
  "background_overlay_color": "rgba(14,19,32,0.85)",
  "background_overlay_color_b": "rgba(14,19,32,0.55)",
  "background_overlay_gradient_angle": {"unit":"deg","size":135,"sizes":[]},
  "min_height": {"unit":"vh","size":100,"sizes":[]}
}
```

### Image requirements:
- Desktop: landscape (16:9) — upload to WP Media Library FIRST
- Mobile: portrait (9:16) — separate upload
- **NEVER use Stitch temp URLs (lh3.googleusercontent.com) — they expire**

## 16. CRITICAL — Boxed Layout Strategy ("FULL + BOXED" Pattern)

**Using `content_width: "full"` everywhere causes text to stick to viewport edges.**

### The correct pattern (2-level nesting per section):
```
OUTER CONTAINER (content_width: "full"):
  background: covers full viewport width
  padding: vertical only (96px top/bottom, 0 sides)

  INNER CONTAINER (content_width: "boxed"):
    boxed_width: 1200px (max content width)
    padding: 0 vertical, 60px horizontal (desktop)
    padding_tablet: 0/40px
    padding_mobile: 0/20px
```

This ensures backgrounds span the viewport while content stays centered with breathing room.
