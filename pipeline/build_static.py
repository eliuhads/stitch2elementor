#!/usr/bin/env python3
"""
build_static.py — stitch2elementor v27 · Etapa S1 (BUILD estático, Modo S)

Copia src/ → site/, inyecta un marcador de versión en cada HTML y audita
referencias locales rotas (src/href a archivos inexistentes).

Uso:
  python3 build_static.py --src src/ --site site/ --version 7 [--report build_report.json]

Exit codes: 0 PASS · 1 referencias rotas · 3 mal uso / entrada inválida.
Stdlib-only.
"""

import argparse
import json
import shutil
import sys
import time
from html.parser import HTMLParser
from pathlib import Path

SKIP_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "#", "data:", "javascript:")


class LinkAuditor(HTMLParser):
    """Recolecta referencias locales de src/href."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href") and value:
                v = value.strip()
                if v and not v.startswith(SKIP_PREFIXES):
                    self.refs.append(v.split("#")[0].split("?")[0])


def ref_exists(site_root, html_file, ref):
    if not ref:
        return True
    if ref.startswith("/"):
        return (site_root / ref.lstrip("/")).exists()
    return (html_file.parent / ref).exists() or (site_root / ref).exists()


def main():
    ap = argparse.ArgumentParser(description="S1 — build estático src/ → site/ (Modo S)")
    ap.add_argument("--src", required=True, help="Directorio fuente con los HTML")
    ap.add_argument("--site", required=True, help="Directorio de salida (se recrea)")
    ap.add_argument("--version", required=True, help="Número de versión del despliegue (N)")
    ap.add_argument("--report", help="Escribe reporte JSON del build")
    args = ap.parse_args()

    src, site = Path(args.src), Path(args.site)
    if not src.is_dir():
        print(f"ERROR: no es directorio: {src}", file=sys.stderr)
        sys.exit(3)

    if site.exists():
        shutil.rmtree(site)
    shutil.copytree(src, site)

    marker = f"<!-- s2e-static:v{args.version} build:{time.strftime('%Y-%m-%dT%H:%M:%S')} -->"
    broken, pages = [], 0

    for html_file in sorted(site.rglob("*.html")):
        text = html_file.read_text(encoding="utf-8", errors="replace")
        auditor = LinkAuditor()
        auditor.feed(text)
        for ref in auditor.refs:
            if not ref_exists(site, html_file, ref):
                broken.append(f"{html_file.relative_to(site)}: {ref}")
        if "</body>" in text:
            text = text.replace("</body>", f"  {marker}\n</body>", 1)
        else:
            text += f"\n{marker}\n"
        html_file.write_text(text, encoding="utf-8")
        pages += 1

    if pages == 0:
        print("ERROR: src/ no contiene ningún .html", file=sys.stderr)
        sys.exit(3)

    report = {"pages": pages, "marker": marker, "broken_refs": broken}
    if args.report:
        Path(args.report).write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if broken:
        print(f"❌ S1 FAIL: {len(broken)} referencias locales rotas:", file=sys.stderr)
        for b in broken:
            print(f"  ❌ {b}", file=sys.stderr)
        sys.exit(1)

    print(f"✅ S1 PASS: {pages} páginas → {site}/ · marcador {marker}")
    sys.exit(0)


if __name__ == "__main__":
    main()
