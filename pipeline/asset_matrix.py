#!/usr/bin/env python3
"""
asset_matrix.py — stitch2elementor v20 · Matriz de activos IA (V4 / Lección 23)

Auditoría semántica de imágenes: mapea cada <img> de los HTMLs a su heading
más cercano y su ratio objetivo, generando la matriz página→archivo→ratio que
alimenta el archivo único de prompts (DRIVE/PROMPTS/) y la verificación de
conteo post-generación (la 1ª pasada de WattSaver V8 omitió 5 assets
silenciosamente — este script lo detecta con exit != 0).

Uso:
    # 1) Generar matriz desde los HTMLs fuente:
    python3 asset_matrix.py scan <dir_html> -o asset_matrix.json

    # 2) Verificar que los assets generados cubren la matriz:
    python3 asset_matrix.py verify asset_matrix.json --images-dir src/assets/images/

    # 3) Verificar regeneración completa tras "generación IA completada":
    python3 asset_matrix.py verify asset_matrix.json --images-dir src/assets/images/ \
        --newer-than "2026-08-16 10:00"

Reglas de ratio: clase o contexto 'hero' → 16:9 (presupuesto <130KB);
'card' → 4:3 (<100KB); resto → 'auto'. Los nombres de archivo se normalizan
a slug (hero-home, card-extintor-pqs6, ...).

Stdlib-only. Exit codes: 0 OK/cobertura total · 1 faltantes · 3 mal uso
"""

import argparse
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

RATIO_BUDGETS = {"16:9": 130, "4:3": 100}  # KB (Lección 23)


class ImgAuditor(HTMLParser):
    """Recolecta <img> y el heading vigente (h1-h3) en cada punto."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current_heading = ""
        self.images = []
        self._capture = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("h1", "h2", "h3"):
            self._capture = tag
        elif tag in ("img", "source"):
            classes = a.get("class", "")
            src = a.get("src", "")
            if not src and a.get("srcset"):
                src = a.get("srcset", "").split(",")[0].strip().split()[0]
            if not src and tag == "source":
                return
            context = f"{src} {a.get('alt','')} {classes}".lower()
            if "hero" in context:
                ratio = "16:9"
            elif "card" in context or "tile" in context:
                ratio = "4:3"
            else:
                ratio = "auto"
            self.images.append({
                "src": src,
                "alt": a.get("alt", ""),
                "heading": self.current_heading,
                "ratio": ratio,
                "classes": classes.split(),
            })

    def handle_endtag(self, tag):
        if tag == self._capture:
            self._capture = None

    def handle_data(self, data):
        if self._capture:
            text = re.sub(r"\s+", " ", data).strip()
            if text:
                self.current_heading = text


def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_]+", "-", text).strip("-") or "asset"


def suggested_name(img, page_slug):
    base = Path(img["src"]).stem if img["src"] else ""
    if base and not re.fullmatch(r"image|img|photo|placeholder|\d+", base):
        return slugify(base)
    prefix = {"16:9": "hero", "4:3": "card"}.get(img["ratio"], "img")
    topic = slugify(img["heading"])[:40] if img["heading"] else page_slug
    return f"{prefix}-{topic}"


def cmd_scan(args):
    html_dir = Path(args.html_dir)
    if not html_dir.is_dir():
        print(f"ERROR: no es directorio: {html_dir}", file=sys.stderr)
        sys.exit(3)
    matrix = {}
    for html in sorted(html_dir.glob("*.html")):
        auditor = ImgAuditor()
        auditor.feed(html.read_text(encoding="utf-8", errors="replace"))
        page_slug = slugify(html.stem)
        entries = []
        for img in auditor.images:
            entries.append({
                "archivo": f"{suggested_name(img, page_slug)}.webp",
                "src_original": img["src"],
                "alt": img["alt"],
                "heading": img["heading"],
                "ratio": img["ratio"],
                "presupuesto_kb": RATIO_BUDGETS.get(img["ratio"]),
            })
        if entries:
            matrix[html.name] = entries

    payload = {"version": 1, "paginas": len(matrix), "total_assets": sum(
        len(v) for v in matrix.values()), "matrix": matrix}
    out = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(out + "\n", encoding="utf-8")
        print(f"OK scan: {payload['paginas']} páginas, "
              f"{payload['total_assets']} assets → {args.output}")
    else:
        print(out)


def cmd_verify(args):
    try:
        payload = json.loads(Path(args.matrix).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(3)

    images_dir = Path(args.images_dir)
    threshold = None
    if args.newer_than:
        threshold = datetime.strptime(args.newer_than, "%Y-%m-%d %H:%M")

    faltantes, viejos, pesados = [], [], []
    cubiertos = 0
    for page, entries in payload["matrix"].items():
        for e in entries:
            target = images_dir / e["archivo"]
            if not target.is_file():
                faltantes.append(f"{page}: {e['archivo']}")
                continue
            if threshold and datetime.fromtimestamp(
                    target.stat().st_mtime) < threshold:
                viejos.append(f"{page}: {e['archivo']} "
                              "(mtime anterior al corte)")
                continue
            budget = e.get("presupuesto_kb")
            if budget and target.stat().st_size > budget * 1024:
                pesados.append(f"{page}: {e['archivo']} "
                               f"({target.stat().st_size//1024}KB > {budget}KB)")
            cubiertos += 1

    total = payload["total_assets"]
    print(f"verificación: {cubiertos}/{total} assets presentes")
    for label, items in (("FALTANTE", faltantes), ("STALE", viejos),
                         ("SOBREPESO", pesados)):
        for it in items:
            print(f"  ❌ {label}: {it}")
    if faltantes or viejos:
        print("FAIL: la generación NO cubrió la matriz (posible omisión "
              "silenciosa — Lección 23)", file=sys.stderr)
        sys.exit(1)
    if pesados:
        print("⚠️ hay assets sobre presupuesto WebP", file=sys.stderr)
    print("✅ PASS: matriz cubierta al 100%")


def main():
    ap = argparse.ArgumentParser(description="Matriz página→asset→ratio (L23)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_scan = sub.add_parser("scan", help="Genera matriz desde HTMLs")
    p_scan.add_argument("html_dir")
    p_scan.add_argument("-o", "--output")
    p_scan.set_defaults(fn=cmd_scan)

    p_ver = sub.add_parser("verify", help="Verifica assets contra matriz")
    p_ver.add_argument("matrix")
    p_ver.add_argument("--images-dir", required=True)
    p_ver.add_argument("--newer-than",
                       help="Corte 'YYYY-MM-DD HH:MM' para detectar omisiones")
    p_ver.set_defaults(fn=cmd_verify)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
