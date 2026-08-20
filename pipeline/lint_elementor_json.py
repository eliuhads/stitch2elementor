#!/usr/bin/env python3
"""
lint_elementor_json.py — stitch2elementor v27 · Etapa E3 (LINT pre-flight)

Puerta de calidad OBLIGATORIA antes de cualquier deploy. Si exit != 0, el
payload NO se inyecta en WordPress. Diseñado para que modelos no-frontier
no puedan "declarar" que un JSON es válido: la máquina decide.

Validaciones (SSOT: elementor_schema.json + Guardrails Prose->Code):
  E1  JSON parseable y raíz = array de elementos (o payload con elementor_data)
  E2  IDs: patrón ^[a-f0-9]{7,8}$, únicos de forma RECURSIVA
  E3  elType ∈ {container, section, column, widget}; widget ⇒ widgetType ∈ lista
  E4  Contenedores raíz: content_width=boxed y boxed_width ∈ [1140, 1440]
  E5/E11 Responsive: todo container flex con elementos lleva flex_direction_mobile=column
      y width_mobile=100% (ex-R10)
  E6  R4: widgets image cuyo src/alt sugiere logo → height en [36, 56] si está fijado
  E7  Sin claves 'elements' no-array ni arrays vacíos colgando
  E8  (ex-R19): ningún SVG con viewBox > 500.000 px² sin rasterizar; logos con max-height/max-width
  E9  (ex-R20): todo nodo con clase Tailwind bg-[...]/text-[...] tiene color sólido de respaldo
  E10 (ex-R15/R16): CSS compilado o custom_css contiene box-sizing, overflow-x y .elementor{background:transparent}
  E12 (ex-R7): presencia de title, meta description, OG y JSON-LD por página (en settings o meta)
  E13 Editabilidad Track B (Lección 28): widget HTML opaco cuyo contenido es
      reproducible con widgets nativos (heading/text-editor/image/button/icon-list)
      ⇒ error con sugerencia de widget nativo; --allow-opaque-html lo degrada a warning
  E14 Marcador de despliegue presente en alts de imagen (--expect-marker, R24)
  E15 Detección de estructuras legacy section/column (--strict-v4 convierte en ERROR, R17)

Uso:
    python3 lint_elementor_json.py page_elementor.json [--css styles.css] [--meta meta.json] \
        [--expect-marker s2e-vN-slug] [--strict-v4] [--report lint.json]

Exit codes: 0 PASS · 1 FAIL (errores) · 2 warnings solamente · 3 mal uso
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, Any, List

SCHEMA_PATH = Path(__file__).resolve().parent / "elementor_schema.json"


def load_schema():
    try:
        return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except OSError:
        return {
            "id_pattern": "^[a-f0-9]{7,8}$",
            "allowed_elTypes": ["container", "section", "column", "widget"],
            "allowed_widgetTypes": ["heading", "text-editor", "image", "button",
                                    "icon-list", "divider", "spacer", "html",
                                    "image-box", "icon-box"],
            "root_container_rules": {"boxed_width_min_px": 1140,
                                     "boxed_width_max_px": 1440},
            "dimension_rules_R4": {"logo_height_px": {"min": 36, "max": 56}}
        }


class Linter:
    def __init__(self, schema, css_content="", meta_content=None,
                 allow_opaque_html=False, expect_marker="", strict_v4=False):
        self.schema = schema
        self.errors = []
        self.warnings = []
        self.seen_ids = {}
        self.id_re = re.compile(schema.get("id_pattern", "^[a-f0-9]{7,8}$"))
        self.root_rules = schema.get("root_container_rules", {})
        self.dims = schema.get("dimension_rules_R4", {})
        self.css_content = css_content
        self.meta_content = meta_content or {}
        self.allow_opaque_html = allow_opaque_html
        self.expect_marker = expect_marker
        self.strict_v4 = strict_v4

    def err(self, code, path, msg):
        self.errors.append({"code": code, "path": path, "msg": msg})

    def warn(self, code, path, msg):
        self.warnings.append({"code": code, "path": path, "msg": msg})

    # -- E2: IDs -------------------------------------------------------------
    def check_id(self, el, path):
        eid = el.get("id")
        if not isinstance(eid, str) or not self.id_re.match(eid):
            self.err("E2", path, f"id inválido: {eid!r} (patrón {self.schema.get('id_pattern')})")
            return
        if eid in self.seen_ids:
            self.err("E2", path, f"id DUPLICADO '{eid}' (ya visto en {self.seen_ids[eid]})")
        else:
            self.seen_ids[eid] = path

    # -- E3: tipos ------------------------------------------------------------
    def check_types(self, el, path):
        et = el.get("elType")
        if et not in self.schema["allowed_elTypes"]:
            self.err("E3", path, f"elType desconocido: {et!r}")
            return
        if et == "widget":
            wt = el.get("widgetType")
            if not wt:
                self.err("E3", path, "widget sin widgetType")
            elif wt not in self.schema["allowed_widgetTypes"]:
                self.warn("E3", path, f"widgetType no estándar: {wt!r}")

    # -- E4/E5/E11: reglas de contenedor --------------------------------------
    def check_container(self, el, path, is_root):
        s = el.get("settings", {})
        if not isinstance(s, dict):
            self.err("E4", path, "settings no es objeto")
            return
        if is_root:
            if s.get("content_width") != "boxed":
                self.err("E4", path, "contenedor raíz sin content_width=boxed (R6)")
            bw = s.get("boxed_width", {})
            size = bw.get("size") if isinstance(bw, dict) else (bw if isinstance(bw, (int, float)) else None)
            lo = self.root_rules.get("boxed_width_min_px", 1140)
            hi = self.root_rules.get("boxed_width_max_px", 1440)
            if size is not None and not (lo <= size <= hi):
                self.err("E4", path, f"boxed_width.size={size!r} fuera de [{lo},{hi}] (R6)")
        
        # E11 (ex-R10): todo container flex tiene flex_direction_mobile:column y width_mobile:100%
        if el.get("elements") or el.get("elType") in ("container", "section"):
            if s.get("flex_direction_mobile") != "column":
                self.err("E11", path, "falta flex_direction_mobile=column en contenedor flex (E11/ex-R10)")
            wm = s.get("width_mobile", {})
            size_wm = wm.get("size") if isinstance(wm, dict) else wm
            if size_wm != 100:
                self.err("E11", path, "falta width_mobile=100% en contenedor flex (E11/ex-R10)")

    # -- E6: R4 logo -----------------------------------------------------------
    def check_widget_dims(self, el, path):
        if el.get("widgetType") != "image":
            return
        s = el.get("settings", {})
        img = s.get("image", {}) if isinstance(s.get("image"), dict) else {}
        haystack = f"{img.get('url','')} {img.get('alt','')}".lower()
        if "logo" not in haystack:
            return
        h = s.get("image_height", s.get("height"))
        size = h.get("size") if isinstance(h, dict) else h
        if size is None:
            self.warn("E6", path, "logo sin height fijado (R4 target 48px)")
            return
        rule = self.dims.get("logo_height_px", {"min": 36, "max": 56})
        if not (rule["min"] <= size <= rule["max"]):
            self.err("E6", path, f"logo height={size}px fuera de [{rule['min']},{rule['max']}] (R4)")

    # -- E8: (ex-R19) SVG grande o sin blindaje --------------------------------
    def check_svg_viewbox(self, content: str, path: str):
        svg_matches = re.finditer(r'<svg[^>]*viewBox=["\']([^"\']+)["\'][^>]*>', content, re.IGNORECASE)
        for m in svg_matches:
            vb = m.group(1).strip().split()
            if len(vb) == 4:
                try:
                    w = float(vb[2])
                    h = float(vb[3])
                    area = w * h
                    if area > 500000:
                        self.err("E8", path, f"SVG con viewBox {w}x{h} (área {area:.0f} px² > 500.000 px²) sin rasterizar (E8/ex-R19)")
                except ValueError:
                    pass
        # Verificar logos SVG sin max-height/max-width
        if "<svg" in content.lower() and "logo" in content.lower():
            if not ("max-height" in content.lower() or "max-width" in content.lower() or "height=" in content.lower()):
                self.err("E8", path, "Logo SVG sin restricción dimensional explícita max-height/max-width (E8/ex-R19)")

    # -- E9: (ex-R20) Fallback color sólido en Tailwind bg-[...] / text-[...] ---
    def check_tailwind_fallbacks(self, content: str, path: str):
        tw_matches = re.finditer(r'<[^>]*class=["\'][^"\']*(bg-\[[^\]]+\]|text-\[[^\]]+\])[^"\']*["\'][^>]*>', content)
        for m in tw_matches:
            tag = m.group(0)
            tw_class = re.search(r'(bg-\[[^\]]+\]|text-\[[^\]]+\])', tag).group(1)
            has_fallback = ("style=" in tag and ("background-color:" in tag or "background:" in tag or "color:" in tag))
            if not has_fallback:
                self.err("E9", path, f"Nodo con clase Tailwind '{tw_class}' carece de color sólido inline de respaldo (E9/ex-R20)")

    # -- E10: (ex-R15/R16) CSS compilado box-sizing, overflow-x, .elementor transparent
    def check_compiled_css(self, css_text: str):
        if not css_text:
            return
        css_lower = css_text.lower()
        if "box-sizing" not in css_lower:
            self.err("E10", "$css", "CSS compilado carece de regla 'box-sizing: border-box !important' (E10/ex-R15)")
        if "overflow-x" not in css_lower:
            self.err("E10", "$css", "CSS compilado carece de regla 'overflow-x: hidden !important' (E10/ex-R15)")
        if ".elementor" not in css_lower or ("background" not in css_lower and "background-color" not in css_lower):
            self.err("E10", "$css", "CSS compilado carece de '.elementor { background: transparent !important }' (E10/ex-R16)")

    # -- E12: (ex-R7) SEO Pack: title, meta description, OG y JSON-LD ----------
    def check_seo_metadata(self, meta_dict: Dict[str, Any], raw_payload: Any):
        # Buscar en meta_dict o en settings de la página
        title = meta_dict.get("title") or meta_dict.get("meta_title")
        desc = meta_dict.get("description") or meta_dict.get("meta_description")
        og = meta_dict.get("og") or meta_dict.get("og:title") or meta_dict.get("og_title")
        json_ld = meta_dict.get("json_ld") or meta_dict.get("schema") or meta_dict.get("_floydia_jsonld")
        
        # Si no se pasó meta explícito, buscar si el payload contiene un envoltorio de página
        if isinstance(raw_payload, dict):
            title = title or raw_payload.get("title") or raw_payload.get("page_settings", {}).get("post_title")
            desc = desc or raw_payload.get("meta_description") or raw_payload.get("page_settings", {}).get("meta_description")
            og = og or raw_payload.get("og") or raw_payload.get("page_settings", {}).get("og")
            json_ld = json_ld or raw_payload.get("json_ld") or raw_payload.get("page_settings", {}).get("json_ld")
            
        if meta_dict or (isinstance(raw_payload, dict) and ("page_settings" in raw_payload or "meta" in raw_payload)):
            if not title:
                self.err("E12", "$meta", "Falta 'title' o meta title por página (E12/ex-R7)")
            if not desc:
                self.err("E12", "$meta", "Falta 'meta description' por página (E12/ex-R7)")
            if not og:
                self.err("E12", "$meta", "Falta metadata Open Graph (OG) por página (E12/ex-R7)")
            if not json_ld:
                self.err("E12", "$meta", "Falta bloque Schema estructurado JSON-LD por página (E12/ex-R7)")

    # -- E13: Editabilidad Track B (Lección 28) --------------------------------
    NATIVE_HINTS = (
        (r"<h[1-6]\b", "heading"),
        (r"<img\b", "image"),
        (r"<a\b[^>]*class=['\"][^'\"]*(btn|button)", "button"),
        (r"<ul\b", "icon-list / text-editor"),
        (r"<p\b", "text-editor"),
    )
    COMPLEX_TAGS = {"div", "section", "nav", "header", "footer", "form",
                    "svg", "table", "iframe", "video", "canvas", "script",
                    "style", "template"}

    def check_html_editability(self, el, path):
        if el.get("widgetType") != "html":
            return
        html = (el.get("settings", {}) or {}).get("html", "") or ""
        if not html.strip():
            return
        inner = re.sub(r"<(script|style)\b.*?</\1>", "", html,
                       flags=re.S | re.I)
        tags = set(t.lower() for t in re.findall(r"<([a-z][a-z0-9-]*)\b",
                                                 inner, flags=re.I))
        if tags & self.COMPLEX_TAGS:
            return  # HTML genuinamente complejo: Track A legítimo
        suggestions = [w for pat, w in self.NATIVE_HINTS
                       if re.search(pat, inner, flags=re.I)]
        if not suggestions:
            return
        uniq = ", ".join(dict.fromkeys(suggestions))
        msg = (f"widget HTML opaco reproducible con widgets nativos editables "
               f"({uniq}) — E13/Lección 28; usar --allow-opaque-html si es intencional")
        if self.allow_opaque_html:
            self.warn("E13", path, msg)
        else:
            self.err("E13", path, msg)

    # -- E14: marcador de despliegue (R24) ------------------------------
    def check_deploy_marker(self, elements):
        if not self.expect_marker:
            return
        found = False
        def walk(el):
            nonlocal found
            if found or not isinstance(el, dict):
                return
            if el.get("elType") == "widget" and el.get("widgetType") == "image":
                img = el.get("settings", {}).get("image", {})
                if isinstance(img, dict) and self.expect_marker in str(img.get("alt", "")):
                    found = True
                    return
            for c in el.get("elements", []):
                walk(c)
        for el in elements:
            walk(el)
        if not found:
            self.err("E14", "$", f"marcador de despliegue '{self.expect_marker}' ausente "
                                 "en alts de imagen — recompilar con --deploy-marker (R24)")

    # -- E7: integridad de 'elements' ------------------------------------------
    def check_elements_key(self, el, path):
        if "elements" not in el:
            return True
        ch = el["elements"]
        if not isinstance(ch, list):
            self.err("E7", path, "'elements' no es array")
            return False
        if el.get("elType") in ("container", "section") and not ch:
            self.warn("E7", path, "contenedor con elements vacío")
        return True

    # -- recorrido -------------------------------------------------------------
    def walk(self, el, path, is_root=False):
        if not isinstance(el, dict):
            self.err("E1", path, "elemento no es objeto")
            return
        self.check_id(el, path)
        self.check_types(el, path)

        # -- E15: estructuras legacy (R17) ----------------------------------
        if el.get("elType") in ("section", "column"):
            msg = (f"elType legacy '{el.get('elType')}' — R17 exige Flexbox Containers "
                   "('container'); migrar o compilar con scripts/")
            if self.strict_v4:
                self.err("E15", path, msg)
            else:
                self.warn("E15", path, msg)

        if el.get("elType") in ("container", "section"):
            self.check_container(el, path, is_root)
        self.check_widget_dims(el, path)
        self.check_html_editability(el, path)
        
        # Inspeccionar HTML y texto para E8 y E9
        s = el.get("settings", {})
        if isinstance(s, dict):
            raw_html = s.get("html", "") or s.get("editor", "") or ""
            if raw_html:
                self.check_svg_viewbox(raw_html, path)
                self.check_tailwind_fallbacks(raw_html, path)
                
        if self.check_elements_key(el, path):
            for i, child in enumerate(el.get("elements", [])):
                self.walk(child, f"{path}/{el.get('elType','?')}[{i}]")

    def run(self, raw_data):
        elements_data = raw_data
        custom_css = self.css_content
        
        if isinstance(raw_data, dict):
            if "elementor_data" in raw_data:
                elements_data = raw_data["elementor_data"]
            if "css" in raw_data and not custom_css:
                custom_css = raw_data["css"]
            if "custom_css" in raw_data.get("page_settings", {}) and not custom_css:
                custom_css = raw_data["page_settings"]["custom_css"]
                
        if not isinstance(elements_data, list):
            self.err("E1", "$", "_elementor_data raíz no es array")
            return
        if not elements_data:
            self.err("E1", "$", "_elementor_data vacío")
            return
            
        for i, el in enumerate(elements_data):
            self.walk(el, f"$[{i}]", is_root=True)

        self.check_deploy_marker(elements_data)
            
        if custom_css:
            self.check_compiled_css(custom_css)
            
        self.check_seo_metadata(self.meta_content, raw_data)


def main():
    ap = argparse.ArgumentParser(description="Linter pre-flight _elementor_data (E1 a E15)")
    ap.add_argument("input", help="JSON _elementor_data a validar")
    ap.add_argument("--css", help="Ruta al archivo CSS compilado a validar (E10)")
    ap.add_argument("--meta", help="Ruta al archivo JSON de metadatos SEO (E12)")
    ap.add_argument("--expect-marker", default="",
                    help="E14: exige que algún widget image lleve este marcador en su alt (R24)")
    ap.add_argument("--strict-v4", action="store_true",
                    help="E15: convierte en ERROR el uso de elType section/column legacy (R17)")
    ap.add_argument("--report", help="Escribe reporte JSON de hallazgos")
    ap.add_argument("--allow-opaque-html", action="store_true",
                    help="Degrada E13 (HTML opaco reproducible) de error a warning")
    args = ap.parse_args()

    try:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    except OSError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(3)
    except json.JSONDecodeError as e:
        print(f"FAIL E1: JSON no parseable: {e}", file=sys.stderr)
        sys.exit(1)

    css_text = ""
    if args.css and Path(args.css).exists():
        css_text = Path(args.css).read_text(encoding="utf-8")

    meta_dict = {}
    if args.meta and Path(args.meta).exists():
        try:
            meta_dict = json.loads(Path(args.meta).read_text(encoding="utf-8"))
        except Exception:
            pass

    linter = Linter(load_schema(), css_content=css_text, meta_content=meta_dict,
                    allow_opaque_html=args.allow_opaque_html,
                    expect_marker=args.expect_marker,
                    strict_v4=args.strict_v4)
    linter.run(data)

    result = {
        "file": args.input,
        "ids_checked": len(linter.seen_ids),
        "errors": linter.errors,
        "warnings": linter.warnings,
        "verdict": "FAIL" if linter.errors else (
            "WARN" if linter.warnings else "PASS"),
    }
    if args.report:
        Path(args.report).write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8")

    icon = {"PASS": "✅", "WARN": "⚠️", "FAIL": "❌"}[result["verdict"]]
    print(f"{icon} lint {args.input}: {result['verdict']} "
          f"({len(linter.seen_ids)} IDs, {len(linter.errors)} errores, "
          f"{len(linter.warnings)} warnings)")
    for e in linter.errors:
        print(f"  ❌ [{e['code']}] {e['path']}: {e['msg']}")
    for w in linter.warnings:
        print(f"  ⚠️  [{w['code']}] {w['path']}: {w['msg']}")

    sys.exit(1 if linter.errors else (2 if linter.warnings else 0))


if __name__ == "__main__":
    main()
