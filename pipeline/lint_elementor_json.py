#!/usr/bin/env python3
"""
lint_elementor_json.py — stitch2elementor v20 · Etapa E3 (LINT pre-flight)

Puerta de calidad OBLIGATORIA antes de cualquier deploy. Si exit != 0, el
payload NO se inyecta en WordPress. Diseñado para que modelos no-frontier
no puedan "declarar" que un JSON es válido: la máquina decide.

Validaciones (SSOT de enumeraciones: elementor_schema.json, mismo directorio):
  E1  JSON parseable y raíz = array de elementos
  E2  IDs: patrón ^[a-f0-9]{7}$, únicos de forma RECURSIVA
  E3  elType ∈ {container, section, column, widget}; widget ⇒ widgetType ∈ lista
  E4  Contenedores raíz: content_width=boxed y boxed_width ∈ [1140, 1440] (R6)
  E5  Responsive: todo container con elementos lleva flex_direction_mobile=column
      y width_mobile=100% (R10 / Lección 21)
  E6  R4: widgets image cuyo src/alt sugiere logo → height en [36, 56] si está fijado
  E7  Sin claves 'elements' no-array ni arrays vacíos colgando

Uso:
    python3 lint_elementor_json.py page_elementor.json [--report lint.json]

Exit codes: 0 PASS · 1 FAIL (errores) · 2 warnings solamente · 3 mal uso
"""

import argparse
import json
import re
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent / "elementor_schema.json"


def load_schema():
    try:
        return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except OSError:
        # fallback embebido mínimo (el schema externo es el SSOT)
        return {
            "id_pattern": "^[a-f0-9]{7}$",
            "allowed_elTypes": ["container", "section", "column", "widget"],
            "allowed_widgetTypes": ["heading", "text-editor", "image", "button",
                                    "icon-list", "divider", "spacer", "html",
                                    "image-box", "icon-box"],
            "root_container_rules": {"boxed_width_min_px": 1140,
                                     "boxed_width_max_px": 1440},
        }


class Linter:
    def __init__(self, schema):
        self.schema = schema
        self.errors = []
        self.warnings = []
        self.seen_ids = {}
        self.id_re = re.compile(schema["id_pattern"])
        self.root_rules = schema.get("root_container_rules", {})
        self.dims = schema.get("dimension_rules_R4", {})

    # -- utilidades ---------------------------------------------------------
    def err(self, code, path, msg):
        self.errors.append({"code": code, "path": path, "msg": msg})

    def warn(self, code, path, msg):
        self.warnings.append({"code": code, "path": path, "msg": msg})

    # -- E2: IDs -------------------------------------------------------------
    def check_id(self, el, path):
        eid = el.get("id")
        if not isinstance(eid, str) or not self.id_re.match(eid):
            self.err("E2", path, f"id inválido: {eid!r} (patrón "
                                 f"{self.schema['id_pattern']})")
            return
        if eid in self.seen_ids:
            self.err("E2", path, f"id DUPLICADO '{eid}' (ya visto en "
                                 f"{self.seen_ids[eid]})")
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
                self.warn("E3", path, f"widgetType no estándar: {wt!r} "
                                      "(verificar que exista en Elementor)")

    # -- E4/E5: reglas de contenedor ------------------------------------------
    def check_container(self, el, path, is_root):
        s = el.get("settings", {})
        if not isinstance(s, dict):
            self.err("E4", path, "settings no es objeto")
            return
        if is_root:
            if s.get("content_width") != "boxed":
                self.err("E4", path,
                         "contenedor raíz sin content_width=boxed (R6)")
            bw = s.get("boxed_width", {})
            size = bw.get("size") if isinstance(bw, dict) else None
            lo = self.root_rules.get("boxed_width_min_px", 1140)
            hi = self.root_rules.get("boxed_width_max_px", 1440)
            if not isinstance(size, (int, float)) or not (lo <= size <= hi):
                self.err("E4", path,
                         f"boxed_width.size={size!r} fuera de [{lo},{hi}] (R6)")
        if el.get("elements"):  # E5 responsive mecánico
            if s.get("flex_direction_mobile") != "column":
                self.err("E5", path, "falta flex_direction_mobile=column "
                                     "(R10/L21)")
            wm = s.get("width_mobile", {})
            if not (isinstance(wm, dict) and wm.get("size") == 100):
                self.err("E5", path, "falta width_mobile=100% (R10/L21)")

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
            self.err("E6", path,
                     f"logo height={size}px fuera de [{rule['min']},"
                     f"{rule['max']}] (R4)")

    # -- E7: integridad de 'elements' ------------------------------------------
    def check_elements_key(self, el, path):
        if "elements" not in el:
            return
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
        if el.get("elType") in ("container", "section"):
            self.check_container(el, path, is_root)
        self.check_widget_dims(el, path)
        if self.check_elements_key(el, path):
            for i, child in enumerate(el.get("elements", [])):
                self.walk(child, f"{path}/{el.get('elType','?')}[{i}]")

    def run(self, data):
        if not isinstance(data, list):
            self.err("E1", "$", "_elementor_data raíz no es array")
            return
        if not data:
            self.err("E1", "$", "_elementor_data vacío")
            return
        for i, el in enumerate(data):
            self.walk(el, f"$[{i}]", is_root=True)


def main():
    ap = argparse.ArgumentParser(description="Linter pre-flight _elementor_data")
    ap.add_argument("input", help="JSON _elementor_data a validar")
    ap.add_argument("--report", help="Escribe reporte JSON de hallazgos")
    args = ap.parse_args()

    try:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    except OSError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(3)
    except json.JSONDecodeError as e:
        print(f"FAIL E1: JSON no parseable: {e}", file=sys.stderr)
        sys.exit(1)

    linter = Linter(load_schema())
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
