# Gotchas & Lessons Learned

Critical issues discovered from real-world HTML-to-Elementor conversions. Read this before generating JSON.

---

## 0. Native Elementor widgets first, `html` widget last

**This is the most important principle.** Always use native Elementor widgets when possible. They are editable in the visual editor, respond to global styles, support responsive controls, and the client can modify them without touching code.

The `html` widget renders raw HTML which means: no visual editing, no responsive controls, no global style inheritance, and the client needs to edit code to change anything.

**Use `html` widget ONLY for (AND ALWAYS SANITIZE):**
- Headings that need FA icons or colored `<span>` tags (heading widget sanitizes these away)
- Loading external CSS/fonts via `<link>` tags (with SRI tags!)
- Injecting `<style>` blocks (smooth scroll, etc.)
- SVG/embed content with no native equivalent. Ensure you **strip** `<script>`, `onload=`, etc.!

**Use native widgets for everything else:**
- TOC / link lists -> `icon-list` or `text-editor` with `<ol>`
- Paragraphs, data blocks, styled text -> `text-editor` (supports inline styles in `editor` field)
- Buttons -> `button` widget
- Images -> `image` widget
- Dividers -> `divider` widget
- Spacing -> `spacer` widget or container padding/margin

---

## 1. Heading widget sanitizes HTML

**Problem:** The `heading` widget's `title` field strips most HTML tags. If you put `<i class="fa-solid fa-shield">` or `<span style="color:red;">` in the title, Elementor removes them on save.

**What gets stripped:** `<i>`, `<span style="...">`, `<div>`, `<img>`, most inline HTML.

**What survives:** `<br>`, `<span>` without style attribute (sometimes), basic `<strong>`/`<em>`.

**Solution:** When a heading needs icons, colored text spans, or any HTML markup, use the `html` widget instead:

```json
{
  "widgetType": "html",
  "settings": {
    "html": "<h2 style=\"font-family:Oswald,sans-serif;font-size:1.15rem;font-weight:600;color:#222;\"><i class=\"fa-solid fa-lock\" style=\"color:#f7941d;margin-right:8px;\"></i> Section Title</h2>"
  }
}
```

This renders exactly as written. The tradeoff is you lose Elementor's visual typography controls, but for icon headings it's the only reliable approach.

**When to use `heading` widget:** Plain text headings with no HTML, icons, or colored spans. The heading widget is fine for `"title": "About Us"` but not for `"title": "About <span style='color:red'>Us</span>"`.

---

## 2. Text-editor widget partially sanitizes HTML

**Problem:** The `text-editor` widget's `editor` field is more permissive than `heading`, but still sanitizes some HTML on save in the visual editor.

**What works reliably:** `<p>`, `<strong>`, `<em>`, `<a>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<h3>`, `<h4>`, basic inline styles on these tags.

**What can break:** Complex nested `<div>` structures, `<style>` blocks, `<script>` tags, deeply nested styling. Elementor may rewrite or strip these when the page is opened in the editor.

**Solution:** For complex formatted blocks (data cards, highlight boxes, styled lists with custom bullets), use the `html` widget. It passes content through without sanitization.

**Practical rule:** If your text-editor content has more than 2 levels of HTML nesting or uses `<div>` blocks with inline styles, switch to `html` widget.

---

## 3. Font Awesome icons don't render by default

**Problem:** Elementor loads its own icon library (eicons) but does NOT automatically load Font Awesome from CDN. If the source HTML uses FA classes like `fa-solid fa-check`, they won't render unless FA is already loaded by the theme or a plugin.

**Solution:** Add an `html` widget at the top of the page that loads FA:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer">
```

Put this in a minimal container at the very start of the `content` array. The container should have zero padding/margin so it's invisible.

**Note:** Elementor Pro does include FA as an option in Settings > Advanced, but it's not always enabled. The CDN link is a safe fallback.

---

## 4. Google Fonts may not be available

**Problem:** If the source HTML uses fonts like Oswald, Playfair Display, etc. via Google Fonts, they won't render in Elementor unless: (a) the theme loads them, (b) they're set in Elementor's Global Fonts, or (c) they're loaded manually.

**Solution:** Add Google Fonts link in the same loader `html` widget:

```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap" rel="stylesheet">
```

> [!WARNING] SRI Integrity
> Always try to include Subresource Integrity (SRI) attributes when loading CSS/JS from CDNs to prevent supply chain attacks. Google Fonts doesn't easily support SRI natively due to dynamic responses, but libraries like Font Awesome must have them.

**Better long-term approach:** Tell the user to add these fonts to Elementor Site Settings > Global Fonts so they're available site-wide. The CDN link is a quick fix for imported templates.

---

## 5. Anchor scrolling requires container wrapper

**Problem:** Setting `_css_id` on a widget adds `id="..."` to the widget's wrapper div, but anchor scrolling (`#section-name`) is unreliable when targeting widget wrappers because Elementor's CSS can interfere with scroll positioning.

**Solution:** Wrap anchor targets in a dedicated container with `_css_id`:

```json
{
  "elType": "container",
  "isInner": true,
  "settings": {
    "content_width": "full",
    "_css_id": "section-name",
    "padding": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true}
  },
  "elements": [ ...section content... ]
}
```

**Also required:** Inject `scroll-behavior: smooth` via the loader html widget:

```html
<style>html{scroll-behavior:smooth;}</style>
```

Without this, clicking TOC links causes an instant jump instead of smooth scroll.

---

## 6. Full-width layout depends on theme and page settings

**Problem:** Many themes (Phlox, Astra, GeneratePress, Hello) wrap Elementor content in their own boxed container. Setting `content_width: "full"` in the JSON only stretches to the theme's container width, not the viewport.

**The JSON template alone cannot fix this.**

**Solution:** Always remind the user to:
1. Set the page's **Page Layout** to "Elementor Full Width" or "Elementor Canvas" (in WordPress page editor sidebar, or Elementor Page Settings)
2. Or set the default in Elementor > Settings > General > Default Page Layout

**Elementor Canvas** removes the theme header/footer entirely. **Elementor Full Width** keeps theme header/footer but gives full-width content area.

---

## 7. isLinked values are inconsistent

**Problem:** In real Elementor exports, the `isLinked` field in spacing/sizing objects can be `true`, `false`, `""` (empty string), or `"1"` (string). This inconsistency comes from Elementor's internal handling.

**Practical rule:**
- Use `true` or `"1"` for linked (all sides equal)
- Use `false` or `""` for unlinked (different values per side)
- Both formats work on import, but be consistent within your template

---

## 8. Widget margin vs container padding

**Problem:** Spacing between widgets can be controlled two ways: widget `_margin` or container `flex_gap`. Using both creates double spacing.

**Best practice:**
- Use `flex_gap` on containers for uniform spacing between children
- Use `_margin` on individual widgets only for exceptions (e.g., extra space before a heading)
- Set `flex_gap` to `"0"` when you want full manual control via widget margins

---

## 9. Long documents: structure for editability

**Problem:** Legal pages, policies, and long-form documents have many sections. The temptation is to dump everything into `html` widgets for speed, but this makes the page impossible to edit visually.

**Best approach:**
- Use `text-editor` widgets for all body content (paragraphs, lists, data blocks with inline styles)
- Use `heading` widgets for plain text headings; `html` widget only for headings that need FA icons
- Wrap each section in a container with `_css_id` for anchor scrolling
- Use `icon-list` or `text-editor` with `<ol>` for the table of contents
- Apply typography via Elementor settings (`typography_typography: "custom"` etc.) rather than inline styles where possible

**Result:** The client can click on any section in Elementor's visual editor and change text, colors, and spacing without touching code.

---

## 10. Programmatic generation for large pages

For pages with many repeated patterns (9 sections of a privacy policy, 20 FAQ items, etc.), write a Python script to generate the JSON rather than hand-crafting it. This:
- Eliminates copy-paste errors
- Ensures consistent IDs (use `random.choice('0123456789abcdef')` for 8-char IDs)
- Makes it easy to iterate on the template
- Allows structural validation before output

Pattern:
```python
import json, uuid

def gen_id():
    # Use uuid for guaranteed uniqueness to avoid DOM collision issues
    return uuid.uuid4().hex[:8]

def make_section(anchor, title, content_html):
    return {
        "id": gen_id(),
        "elType": "container",
        "isInner": True,
        "settings": {"content_width": "full", "_css_id": anchor},
        "elements": [
            {"id": gen_id(), "elType": "widget", "widgetType": "html",
             "isInner": False, "settings": {"html": f"<h2>{title}</h2>"}, "elements": []},
            {"id": gen_id(), "elType": "widget", "widgetType": "html",
             "isInner": False, "settings": {"html": content_html}, "elements": []}
        ]
    }
```

---

## 11. CSS Grid to Elementor Flexbox Conversion

**Problem:** Pure Elementor v0.4 JSON heavily relies on Flexbox Containers. When converting Tailwind grid layouts (e.g., `grid grid-cols-3` or `grid grid-cols-4`), simply setting `flex_wrap: "wrap"` often causes child elements to stack vertically or display incorrectly because they lack explicit widths.

**Best approach:**
- Convert the CSS grid into a structural flexbox row (`flex_direction: "row"`).
- Set `flex_wrap: "nowrap"` so the items are forced to stay on the same line.
- Explicitly calculate and assign a proportional width to each child container based on the grid columns (e.g., for `grid-cols-3`, set child width to `33%`).
- For mobile responsiveness, stack them vertically by setting `flex_direction_mobile: "column"` on the parent container, and override the child width with `width_mobile: 100%`.

**Example mapping logic:**
- Parent: `{"flex_direction": "row", "flex_wrap": "nowrap", "flex_direction_mobile": "column"}`
- Child (for 3 cols): `{"width": {"unit": "%", "size": 33}, "width_mobile": {"unit": "%", "size": 100}}`

**Result:** Flawless multi-column grids that render properly as rows on desktop and naturally stack into single columns on mobile devices without wrapping artifacts.

---

## 12. Mass Injection and ModSecurity (WAF 406 Error)

**Problem:** Updating Elementor data for entire pages by pasting massive JSON strings via the WordPress API/Editor can frequently trigger Server Web Application Firewalls (like ModSecurity) resulting in a "406 Not Acceptable" error.

**Best approach:**
- Avoid trying to save massive strings directly through standard HTTP POST browser requests if you encounter this.
- Use direct injection via WP-CLI or dedicated MCP File-to-Database tools (e.g., `update_page_from_file`) that bypass typical WAF payload inspections by processing the JSON file locally on the server.

---

## 13. Template Library (`elementor_library`) Permissions

**Problem:** When injecting JSON into Global Headers, Footers, or custom sections saved in Elementor's Template Library, standard Page-update endpoints often fail because these are of the Custom Post Type `elementor_library`, which may have different permission requirements or hidden WP structure.

**Best approach:**
- Standard automated page builders should focus on standard pages (`page` or `post`).
- For Header and Footer templates, generate the JSON as a file, and import it manually via the WordPress Dashboard -> Elementor -> Templates -> Import Template feature, or by pasting it directly into the template's editor.

---

## 14. The "DOM Walker" Strategy for Mass HTML-to-Elementor Migration

**Problem:** Converting a full library of Tailwind/HTML pages into Elementor by dumping everything into a single Elementor `html` widget ruins editability.

**Best approach:**
Instead of hand-crafting JSON or wrapping HTML blocks, build a recursive DOM parser (e.g., in Node.js using `cheerio` or Python using `BeautifulSoup`).
- **Containers:** Map layout tags (`<section>`, `<div>`) to Elementor flexbox `container`. Map Tailwind flex/grid classes to `flex_direction`, `flex_wrap`, `justify_content`, etc.
- **Typography:** Map `<h1>`-`<h6>` directly to Elementor's native `heading` widget.
- **Rich Text:** Map `<p>` and standalone `<span>` to the `text-editor` widget.
- **CTAs:** Map `<a>` and `<button>` directly to the `button` widget.
- **Result:** You convert raw HTML into a 100% native, purely editable Elementor JSON tree, granting the client full power over typography and layout without ever seeing `<div class="...">` code again.


## 15. Shorthand Dimensions Crash (Margin/Padding)

**Problem:** Passing standard CSS shorthand strings like `padding: "15px 30px 10px 30px"` to Elementor JSON will crash the schema or cause visual layout collapses. Elementor uses a dimensional object dictionary.

**Best approach:**
- Break down dimensional rules into an exact object structure:
```json
{
  "padding": {
    "unit": "px",
    "top": "15",
    "right": "30",
    "bottom": "10",
    "left": "30",
    "isLinked": false
  }
}
```
- Always set `isLinked` (boolean) correctly, otherwise Elementor's UI link icon will desync.

---

## 16. Semantic Types and Page Settings (The Root JSON)

**Problem:** Generating a JSON with an arbitrary `type` string or omitting `page_settings` causes import failures or unability to override global theme layouts (like forcing Elementor Canvas).

**Best approach:**
- The root JSON must explicitly define `"type": "page"` (or "header", "footer", "popup").
- If no page settings are needed, strictly pass an empty array `"page_settings": []` (which maps to PHP empty structures). Leaving it undefined or null may break strict schema validations internally in WordPress.

---

## 17. Media Pipeline & Srcset (Image Widgets)

**Problem:** When mapping an `<img>` src directly into the `"url": "..."` parameter of an image widget, Elementor loses the ability to automatically generate responsive `srcset` variations or apply webp compressions native to WordPress, causing performance drops.

**Best approach:**
- For a perfect pipeline, use the WordPress REST API to programmatically upload the image into the media library first.
- Capture the returned WordPress Media ID, and assign it to the `"id"` key inside the image widget's object alongside the `url`. Having the internal ID allows Elementor to leverage native resizing and lazy-loading properly.
