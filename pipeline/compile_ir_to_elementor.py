#!/usr/bin/env python3
"""
compile_ir_to_elementor.py — stitch2elementor v20 · Etapa E2 (COMPILE)

Compila un IR JSON (salida de extract_ir.py) a un payload `_elementor_data`
válido para Elementor 3.x/4.x (flexbox containers). 100% determinista:

  - IDs de 7 chars hex derivados por uuid5 (mismo IR → mismos IDs, sin
    duplicados posibles por construcción).
  - Reglas responsive inyectadas MECÁNICAMENTE (R10): flex_direction_mobile
    column + width_mobile 100% en todo contenedor.
  - Encuadre R6: content_width boxed 1240px (configurable con --boxed-width).
  - Merge mecánico de header/footer (--header/--footer): el LLM jamás
    concatena arrays a mano (anti-V1).

Uso:
    python3 compile_ir_to_elementor.py ir.json -o page_elementor.json \
        [--header header.json] [--footer footer.json] \
        [--boxed-width 1240] [--page-settings page_settings.json] \
        [--elementor-target 4.2] [--allow-stale-schema]

Salida: archivo JSON = array `_elementor_data` listo para wp_slash().
Con --page-settings escribe además <out>.page_settings.json como ARRAY PHP
serializable (NUNCA string JSON — Lección 24).

Blindaje de versión (v25): exige 'elementor_target' en el IR (o
--elementor-target), lo valida contra la versión REAL registrada en
elementor_schema.json y bloquea si el schema lleva >14 días sin re-probeo
(regenerar con SCRIPTS/elementor_schema_probe.py vía Novamira MCP).

Stdlib-only. Exit codes: 0 OK · 1 error de entrada · 2 IR inválido
"""

import argparse
import json
import sys
import uuid
from pathlib import Path

# Namespace estable derivado del proyecto (constante entre ejecuciones)
NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "stitch2elementor.v20")

_id_counter = {"n": 0}


def new_id(seed_path):
    """ID determinista de 7 chars hex. El contador desambigua hermanos."""
    _id_counter["n"] += 1
    digest = uuid.uuid5(NAMESPACE, f"{seed_path}#{_id_counter['n']}").hex
    return digest[:7]


# ---------------------------------------------------------------------------
# Widgets (mapeo IR → widgetType)
# ---------------------------------------------------------------------------

def w_heading(child, path):
    level = min(max(child.get("level", 2), 1), 6)
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "heading",
        "settings": {
            "title": child.get("text", ""),
            "title_tag": f"h{level}",
            "align": "left",
        },
        "elements": [],
    }


def w_paragraph(child, path):
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "text-editor",
        "settings": {"editor": f"<p>{child.get('text', '')}</p>"},
        "elements": [],
    }


def w_image(child, path):
    settings = {
        "image": {"url": child.get("src", ""), "alt": child.get("alt", "")},
        "image_size": "full",
    }
    # R4 mecánico: si el asset es un logo, fijar 48px (anti-sobredimensionamiento)
    haystack = f"{child.get('src','')} {child.get('alt','')}".lower()
    if "logo" in haystack:
        settings["image_height"] = {"unit": "px", "size": 48}
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "image",
        "settings": settings,
        "elements": [],
    }


def w_button(child, path):
    href = child.get("href", "")
    is_ext = child.get("is_external", False) or bool(re.match(r"^(https?://|//|wa\.me/)", href, re.IGNORECASE))
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "button",
        "settings": {
            "text": child.get("text", "Ver más"),
            "link": {"url": href, "is_external": is_ext},
        },
        "elements": [],
    }


def w_link(child, path):
    text = child.get("text", "")
    href = child.get("href", "")
    is_ext = child.get("is_external", False) or bool(re.match(r"^(https?://|//|wa\.me/)", href, re.IGNORECASE))
    target_attr = ' target="_blank" rel="noopener noreferrer"' if is_ext else ''
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "text-editor",
        "settings": {"editor": f'<p><a href="{href}"{target_attr}>{text}</a></p>'},
        "elements": [],
    }


def w_list(child, path):
    # E13/Lección 28: widget nativo editable en vez de HTML opaco
    items = "".join(f"<li>{i}</li>" for i in child.get("items", []))
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "text-editor",
        "settings": {"editor": f'<ul class="ws-list">{items}</ul>'},
        "elements": [],
    }


def w_divider(child, path):
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "divider",
        "settings": {"style": "solid", "weight": {"unit": "px", "size": 1}},
        "elements": [],
    }


def w_quote(child, path):
    return {
        "id": new_id(path), "elType": "widget", "widgetType": "text-editor",
        "settings": {"editor": f'<blockquote><p>{child.get("text", "")}</p></blockquote>'},
        "elements": [],
    }


WIDGET_MAP = {
    "heading": w_heading,
    "paragraph": w_paragraph,
    "image": w_image,
    "button": w_button,
    "link": w_link,
    "list": w_list,
    "divider": w_divider,
    "quote": w_quote,
}


# ---------------------------------------------------------------------------
# Contenedores
# ---------------------------------------------------------------------------

def container_settings(kind, boxed_width):
    """Settings de contenedor raíz con reglas R6 + R10 mecánicas."""
    return {
        "content_width": "boxed",
        "boxed_width": {"unit": "px", "size": boxed_width},
        "flex_direction": "column",
        # R10 / Lección 21 — responsive inyectado por regla, no por memoria
        "flex_direction_mobile": "column",
        "width_mobile": {"unit": "%", "size": 100},
        "_ws_section_kind": kind,
    }


def compile_section(section, idx, boxed_width):
    path = f"{section.get('kind','section')}[{idx}]"
    children = []
    for j, child in enumerate(section.get("children", [])):
        factory = WIDGET_MAP.get(child.get("type"))
        if not factory:
            continue
        children.append(factory(child, f"{path}/{child.get('type')}[{j}]"))
    return {
        "id": new_id(path),
        "elType": "container",
        "isInner": False,
        "settings": container_settings(section.get("kind", "section"),
                                       boxed_width),
        "elements": children,
    }


def _rehash_ids(el, label):
    """Re-asigna IDs de forma recursiva al fusionar elementos externos.

    Garantiza unicidad global por construcción (anti-V1): aunque el
    header/footer se haya compilado del mismo IR que el body, los IDs
    resultantes nunca colisionan. Determinista: semilla = label + id original.
    """
    old = el.get("id", "noid")
    el["id"] = new_id(f"{label}:{old}")
    for child in el.get("elements", []):
        if isinstance(child, dict):
            _rehash_ids(child, label)


def load_elements(json_path, label):
    """Carga un array de elementos Elementor (header/footer) y re-hashea IDs."""
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "elements" in data:
        data = data["elements"]
    if not isinstance(data, list):
        print(f"ERROR: {label} ({json_path}) no es un array de elementos",
              file=sys.stderr)
        sys.exit(1)
    for el in data:
        if isinstance(el, dict):
            _rehash_ids(el, label)
    return data


SCHEMA_MAX_AGE_DAYS = 14


def check_elementor_target_version(ir, target_override="", allow_stale=False):
    target = target_override or ir.get("elementor_target")
    if not target:
        print("ERROR: IR inválido — el documento debe declarar 'elementor_target' (ej: '4.2' o '4.2.2')",
              file=sys.stderr)
        sys.exit(2)

    schema_path = Path(__file__).resolve().parent / "elementor_schema.json"
    installed_version = "4.2.2"
    s_data = {}
    if schema_path.exists():
        try:
            s_data = json.loads(schema_path.read_text(encoding="utf-8"))
            installed_version = s_data.get("elementor_version", installed_version)
        except Exception:
            pass
    else:
        print("ERROR: falta elementor_schema.json — ejecutar primero "
              "scripts/elementor_schema_probe.py (Novamira MCP)", file=sys.stderr)
        sys.exit(2)

    # Frescura del schema: un probe viejo puede ocultar un upgrade de Elementor
    probed_at = s_data.get("probed_at")
    if probed_at and not allow_stale:
        try:
            from datetime import datetime, timezone
            age_days = (datetime.now(timezone.utc)
                        - datetime.fromisoformat(probed_at.replace("Z", "+00:00"))).days
            if age_days > SCHEMA_MAX_AGE_DAYS:
                print(f"ERROR: schema obsoleto — último probe hace {age_days} días "
                      f"({probed_at}, máx. {SCHEMA_MAX_AGE_DAYS}). Regenerar con "
                      "scripts/elementor_schema_probe.py o usar --allow-stale-schema",
                      file=sys.stderr)
                sys.exit(2)
        except ValueError:
            print(f"ERROR: probed_at no parseable {probed_at!r} — schema NO APTO (R25 v27). "
                  "Re-probear con scripts/elementor_schema_probe.py o usar --allow-stale-schema.",
                  file=sys.stderr)
            sys.exit(2)
    elif not probed_at and not allow_stale:
        print("ERROR: elementor_schema.json sin probed_at — schema NO APTO (R25 v27). "
              "Re-probear con scripts/elementor_schema_probe.py vía Novamira MCP "
              "o usar --allow-stale-schema (escape documentado §10.5 del skill).",
              file=sys.stderr)
        sys.exit(2)

    target_major = str(target).strip().split(".")[0]
    installed_major = str(installed_version).strip().split(".")[0]

    if target_major != installed_major:
        print(f"ERROR: Incompatibilidad de versión mayor Elementor — target declarado '{target}' "
              f"pero versión instalada es '{installed_version}' (major mismatch: {target_major} != {installed_major})",
              file=sys.stderr)
        sys.exit(2)


def compile_ir(ir, boxed_width=1240, header_path=None, footer_path=None,
               target_override="", allow_stale=False):
    check_elementor_target_version(ir, target_override, allow_stale=allow_stale)

    if not isinstance(ir.get("sections"), list) or not ir["sections"]:
        print("ERROR: IR inválido — falta 'sections' no vacío", file=sys.stderr)
        sys.exit(2)

    body = [compile_section(s, i, boxed_width)
            for i, s in enumerate(ir["sections"])]

    elements = []
    if header_path:                       # merge mecánico (anti-V1)
        elements += load_elements(header_path, "header")
    elements += body
    if footer_path:
        elements += load_elements(footer_path, "footer")
    return elements


def default_page_settings():
    """_elementor_page_settings como estructura PHP-array serializable (L24)."""
    return {"hide_title": "yes"}


def inject_deploy_marker(elements, marker):
    """Inyecta el marcador ALT de despliegue en el primer widget image cuyo
    src/alt sugiera logo o hero (R24). Devuelve True si lo inyectó."""
    if not marker:
        return False
    def walk(el):
        if not isinstance(el, dict):
            return False
        if el.get("elType") == "widget" and el.get("widgetType") == "image":
            img = el.get("settings", {}).get("image", {})
            if isinstance(img, dict):
                haystack = f"{img.get('url', '')} {img.get('alt', '')}".lower()
                if "logo" in haystack or "hero" in haystack:
                    img["alt"] = marker
                    el["settings"]["image"] = img
                    return True
        return any(walk(c) for c in el.get("elements", []) if isinstance(c, dict))
    return any(walk(el) for el in elements if isinstance(el, dict))


def main():
    ap = argparse.ArgumentParser(description="IR JSON → _elementor_data (E2)")
    ap.add_argument("input", help="IR JSON de entrada (extract_ir.py)")
    ap.add_argument("-o", "--output", required=True,
                    help="Archivo de salida _elementor_data (array JSON)")
    ap.add_argument("--header", help="JSON de elementos header (opcional)")
    ap.add_argument("--footer", help="JSON de elementos footer (opcional)")
    ap.add_argument("--boxed-width", type=int, default=1240,
                    help="Ancho boxed px (default 1240, rango R6 1140–1440)")
    ap.add_argument("--page-settings", action="store_true",
                    help="Escribe además <output>.page_settings.json")
    ap.add_argument("--elementor-target", default="",
                    help="Override del 'elementor_target' declarado en el IR")
    ap.add_argument("--deploy-marker", default="",
                    help="Marcador ALT único de despliegue (ej. s2e-v7-home). Se inyecta "
                         "en el alt del logo/hero de forma determinista (R24); E4.5 lo verifica por HTTP.")
    ap.add_argument("--allow-stale-schema", action="store_true",
                    help="Permite compilar con schema de probe >14 días (emergencia)")
    args = ap.parse_args()

    if not 1140 <= args.boxed_width <= 1440:
        print(f"ERROR: boxed-width {args.boxed_width} fuera de rango R6 "
              "(1140–1440)", file=sys.stderr)
        sys.exit(1)

    try:
        ir = json.loads(Path(args.input).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR leyendo IR: {e}", file=sys.stderr)
        sys.exit(1)

    elements = compile_ir(ir, args.boxed_width, args.header, args.footer,
                          target_override=args.elementor_target,
                          allow_stale=args.allow_stale_schema)

    if args.deploy_marker:
        if inject_deploy_marker(elements, args.deploy_marker):
            print(f"OK deploy-marker: alt=\"{args.deploy_marker}\" inyectado en logo/hero (R24)")
        else:
            print(f"ERROR: --deploy-marker '{args.deploy_marker}' no encontró widget image "
                  "de logo/hero. Declara el alt en el IR y recompila.", file=sys.stderr)
            sys.exit(2)

    out = Path(args.output)
    out.write_text(json.dumps(elements, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    print(f"OK compile: {len(elements)} contenedores raíz → {out}")

    if args.page_settings:
        ps_path = out.with_suffix(out.suffix + ".page_settings.json")
        ps_path.write_text(json.dumps(default_page_settings(),
                                      ensure_ascii=False, indent=2) + "\n",
                           encoding="utf-8")
        print(f"OK page_settings (array PHP, Lección 24) → {ps_path}")


if __name__ == "__main__":
    main()
