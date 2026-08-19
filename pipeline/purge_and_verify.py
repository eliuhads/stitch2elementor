#!/usr/bin/env python3
"""
purge_and_verify.py — stitch2elementor v25 · Etapa E4.5 (PURGA MULTINIVEL VERIFICADA)

Verificación post-purga del despliegue (Lecciones 21/24). La purga en sí la
ejecuta el LLM vía Novamira MCP en este orden exacto:

  1. novamira/run-wp-cli  → wp elementor flush-css
  2. novamira/run-wp-cli  → wp cache flush
  3. novamira/execute-php →
       if (class_exists('\\Endurance_Page_Cache')) {
           \\Endurance_Page_Cache::purge_all();
       }
       return 'purged';

Este script es la MÁQUINA que decide si la purga surtió efecto: hace GET de
la página publicada y comprueba:
  - HTTP 200
  - el marcador ALT único de despliegue está presente (exactamente N veces)
  - opcionalmente un marcador de versión CSS (?v=hash) enlazado

El marcador ALT lo inyecta el compilador/deploy (ej. alt="s2e-v7-<slug>"),
de modo que una copia cacheada SIN el marcador ⇒ FAIL ⇒ la purga no surtió
efecto y hay que repetir E4.5 (máx. 3 intentos, luego bloqueo documentado).

Uso:
    python3 purge_and_verify.py https://sitio.com/pagina/ \
        --marker 'alt="s2e-v7-home"' [--css-hash abc1234] \
        [--retries 3] [--delay 2] [--report purge_report.json]

Exit codes: 0 PASS · 1 FAIL · 2 mal uso / error de red persistente.
Stdlib-only.
"""

import argparse
import json
import re
import sys
import time
import urllib.request

UA = "s2e-purge-verify/1.0 (stitch2elementor E4.5)"


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        charset = r.headers.get_content_charset() or "utf-8"
        return r.status, r.read().decode(charset, errors="replace")


def evaluate(html, marker, css_hash):
    marker_count = html.count(marker)
    findings = {"marker_count": marker_count}
    if css_hash:
        m = re.search(r'href=["\'][^"\']*\?v=([0-9a-f]+)["\']', html)
        findings["css_version"] = m.group(1) if m else None
        findings["css_hash_ok"] = findings["css_version"] == css_hash
    return findings


def main():
    ap = argparse.ArgumentParser(description="E4.5 — verificación post-purga")
    ap.add_argument("url", help="URL pública de la página desplegada")
    ap.add_argument("--marker", required=True,
                    help='Marcador ALT único inyectado (ej. \'alt="s2e-v7-home"\')')
    ap.add_argument("--css-hash", default="",
                    help="Hash esperado del CSS maestro enlazado (?v=hash)")
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--delay", type=float, default=2.0)
    ap.add_argument("--report", help="Escribe reporte JSON de intentos")
    args = ap.parse_args()

    attempts = []
    for i in range(1, max(args.retries, 1) + 1):
        try:
            status, html = fetch(args.url)
        except Exception as e:
            attempts.append({"attempt": i, "ok": False, "error": str(e)})
            print(f"❌ intento {i}: error de red: {e}", file=sys.stderr)
            time.sleep(args.delay)
            continue

        if status != 200:
            attempts.append({"attempt": i, "ok": False, "http": status})
            print(f"❌ intento {i}: HTTP {status}", file=sys.stderr)
            time.sleep(args.delay)
            continue

        findings = evaluate(html, args.marker, args.css_hash)
        ok = findings["marker_count"] >= 1
        if args.css_hash:
            ok = ok and findings.get("css_hash_ok", False)
        attempts.append({"attempt": i, "ok": ok, "http": status, **findings})

        if ok:
            print(f"✅ E4.5 PASS: marcador presente x{findings['marker_count']} · HTTP 200"
                  + (f" · CSS ?v={findings.get('css_version')}" if args.css_hash else ""))
            break
        print(f"❌ intento {i}: marcador ausente o CSS desactualizado "
              f"(cache fantasma — repetir purga multinivel Novamira R14)", file=sys.stderr)
        time.sleep(args.delay)

    passed = bool(attempts) and attempts[-1]["ok"]
    if args.report:
        with open(args.report, "w", encoding="utf-8") as f:
            json.dump({"url": args.url, "marker": args.marker,
                       "passed": passed, "attempts": attempts},
                      f, ensure_ascii=False, indent=2)
            f.write("\n")

    if not passed:
        print("❌ E4.5 FAIL: la purga no surtió efecto tras todos los intentos "
              "(Lección 21/24 — caché de hosting persistente)", file=sys.stderr)
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
