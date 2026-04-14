# html-to-elementor

Claude Code skill to convert HTML/Tailwind markup into native Elementor JSON templates.

## Files in this folder

| File | Purpose |
|---|---|
| `SKILL.md` | Main skill file — read this first. Contains all conversion rules. |
| `elementor-json-schema.md` | Complete Elementor JSON structure reference with examples. |
| `widget-mapping.md` | HTML element → Elementor widget mapping with JSON examples. |
| `examples.md` | Full input/output examples (hero, features grid, CTA section). |
| `gotchas.md` | Critical real-world issues. Read before generating any JSON. |

## Activation

Drop this `docs/` folder into your agent's skills directory. The agent activates the skill when it detects conversion intent (see `SKILL.md` description frontmatter).
