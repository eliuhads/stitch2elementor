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

**Problem:** Elementor loads its own icon library (eicons) but does NOT automatically load Font Awesome from CDN.

**Solution:** Add an `html` widget at the top of the page that loads FA:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer">
```

---

## 4. Google Fonts may not be available

**Problem:** If the source HTML uses custom fonts, they won't render unless loaded manually.

**Solution:** Add Google Fonts link in the same loader `html` widget:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## 5. Anchor scrolling requires container wrapper

**Problem:** Setting `_css_id` on a widget is unreliable for anchor scrolling.

**Solution:** Wrap anchor targets in a dedicated container with `_css_id`. Also inject `scroll-behavior: smooth` via the loader html widget.

---

## 6. Full-width layout depends on theme and page settings

**Problem:** Many themes wrap Elementor content in their own boxed container.

**Solution:** Set the page's **Page Layout** to "Elementor Full Width" or "Elementor Canvas".

---

## 7. isLinked values are inconsistent

**Practical rule:**
- Use `true` or `"1"` for linked (all sides equal)
- Use `false` or `""` for unlinked (different values per side)

---

## 8. Widget margin vs container padding

**Best practice:**
- Use `flex_gap` on containers for uniform spacing between children
- Use `_margin` on individual widgets only for exceptions
- Set `flex_gap` to `"0"` when you want full manual control via widget margins

---

## 9. Long documents: structure for editability

- Use `text-editor` widgets for all body content
- Use `heading` widgets for plain text headings; `html` widget only for headings that need FA icons
- Wrap each section in a container with `_css_id` for anchor scrolling

---

## 10. Programmatic generation for large pages

For pages with many repeated patterns, write a script to generate the JSON. Use `uuid.uuid4().hex[:8]` for 8-char IDs.

---

## 11. CSS Grid to Elementor Flexbox Conversion

**Problem:** Tailwind grid layouts need explicit widths when converted to Elementor flexbox.

**Best approach:**
- Convert CSS grid into a structural flexbox row (`flex_direction: "row"`)
- Set `flex_wrap: "nowrap"`
- Assign proportional width to each child (e.g., `grid-cols-3` → child width `33%`)
- For mobile: `flex_direction_mobile: "column"` + `width_mobile: 100%`

---

## 12. Mass Injection and ModSecurity (WAF 406 Error)

**Problem:** Massive JSON via WordPress REST API triggers WAF "406 Not Acceptable".

**Best approach:**
- Use direct PHP injection via FTP (`sync_and_inject.js`) that bypasses WAF by processing JSON files server-side.
- Never use API-based `update_page_from_file` for large payloads on shared hosting.

---

## 13. Template Library (`elementor_library`) — Native Injection

**Problem:** Standard page-update endpoints fail for Global Headers and Footers because they are `elementor_library` Custom Post Types.

**Current solution (V4.3):**
- Use `create_hf_native.php` to programmatically create entries in `elementor_library` with `wp_insert_post()` and inject `_elementor_data` via `update_post_meta()`.
- Set display conditions via `update_post_meta($id, '_elementor_conditions', ['include/general'])` for site-wide display.
- Auto-discover WP menus by name and inject their `term_id` into `nav-menu` widget settings.
- Always purge duplicates before injection to prevent stacking.

**Important:** This replaces the old advice of "import manually via Dashboard". The automation pipeline handles it end-to-end.

---

## 14. The "DOM Walker" Strategy for Mass HTML-to-Elementor Migration

**Problem:** Dumping everything into a single `html` widget ruins editability.

**Best approach:**
Build a recursive DOM parser (Node.js `cheerio` / Python `BeautifulSoup`):
- **Containers:** Map layout tags to Elementor flexbox `container`
- **Typography:** Map `<h1>`-`<h6>` to `heading` widget
- **Rich Text:** Map `<p>` to `text-editor` widget
- **CTAs:** Map `<a>`/`<button>` to `button` widget

---

## 15. Shorthand Dimensions Crash (Margin/Padding)

**Problem:** CSS shorthand strings crash the Elementor schema.

**Best approach:** Use dimensional object:
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

---

## 16. Semantic Types and Page Settings (The Root JSON)

- The root JSON must define `"type": "page"` (or "header", "footer", "popup")
- Always pass `"page_settings": []` if no settings needed

---

## 17. Media Pipeline & Srcset (Image Widgets)

**Best approach:**
- Upload images to WordPress Media Library first via REST API
- Capture the returned Media ID and assign to `"id"` key in the image widget
- This enables native `srcset`, lazy-loading, and webp compression

---

## 18. Cache Flush Obligatorio Post-Inyección

**Problem:** After injecting `_elementor_data` via direct DB writes, Elementor serves cached CSS and the rendered page doesn't reflect changes.

**Solution:** Always execute `flush_cache.php` at the end of any injection pipeline. The script runs:
1. `flush_rewrite_rules()` — refreshes permalinks
2. Elementor CSS cache clear via `Plugin::instance()->files_manager->clear_cache()`
3. Elementor Library sync via `Source_Local::get_data()` refresh

**Rule:** This is NOT optional. Every run of `sync_and_inject.js` must call `flush_cache.php` as its final step.
