#!/usr/bin/env python3
"""
extract_ir.py — stitch2elementor v20 · Etapa E1 (EXTRACT)

Convierte un HTML (salida de Google Stitch o HTML editado del cliente) en una
Representación Intermedia (IR) JSON, determinista y legible por máquina.

El LLM NUNCA interpreta el HTML directamente: consume este IR.

Uso:
    python3 extract_ir.py <input.html> [-o ir.json] [--pretty]

Salida (ir.json):
    {
      "source": "homepage.html",
      "title": "...",
      "meta_description": "...",
      "sections": [ {"kind": "header|section|footer", "classes": [...],
                     "children": [ {"type": "heading", ...}, ... ] } ],
      "warnings": [...]
    }

Stdlib-only (html.parser). Sin dependencias externas.
Exit codes: 0 OK · 1 error de entrada · 2 HTML sin contenido útil
"""

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# Subárboles cuyo contenido se ignora por completo (no aportan al layout)
SKIP_SUBTREE = {"script", "style", "noscript", "template"}
HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
SECTION_TAGS = {"header", "footer", "section", "main", "nav"}
LIST_TAGS = {"ul", "ol"}
VOID_TAGS = {"img", "br", "hr", "input", "source", "meta", "link", "area",
             "base", "col", "embed", "track", "wbr"}
# Contenedores transparentes: se atraviesan para cosechar hijos tipificados
TRANSPARENT = {"div", "span", "article", "figure", "picture", "body", "html",
               "strong", "em", "b", "i", "u", "small"}


class IRNode:
    """Nodo del árbol intermedio."""
    __slots__ = ("tag", "classes", "attrs", "children", "text_parts")

    def __init__(self, tag, attrs):
        self.tag = tag
        self.attrs = dict(attrs)
        self.classes = self.attrs.get("class", "").split()
        self.children = []
        self.text_parts = []

    def text(self):
        return re.sub(r"\s+", " ", " ".join(self.text_parts)).strip()


class IRParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = IRNode("document", [])
        self.stack = [self.root]
        self.skip_depth = 0
        self.title = ""
        self.meta_description = ""
        self._in_title = False
        self.warnings = []

    @property
    def current(self):
        return self.stack[-1]

    def handle_starttag(self, tag, attrs):
        attrs_d = dict(attrs)
        if self.skip_depth:
            if tag in SKIP_SUBTREE:
                self.skip_depth += 1
            return
        if tag in SKIP_SUBTREE:
            self.skip_depth = 1
            return
        if tag == "title":
            self._in_title = True
            return
        if tag == "meta":
            if attrs_d.get("name", "").lower() == "description":
                self.meta_description = attrs_d.get("content", "").strip()
            return
        # SVG: capturar <title> interno como texto y omitir el resto
        if tag == "svg":
            self.skip_depth = 1
            node = IRNode(tag, attrs)
            self.current.children.append(node)
            return

        node = IRNode(tag, attrs)
        self.current.children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        if self.skip_depth or tag in SKIP_SUBTREE:
            return
        if tag == "meta":
            a = dict(attrs)
            if a.get("name", "").lower() == "description":
                self.meta_description = a.get("content", "").strip()
            return
        self.current.children.append(IRNode(tag, attrs))

    def handle_endtag(self, tag):
        if tag in SKIP_SUBTREE or tag == "svg":
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if tag == "title":
            self._in_title = False
            return
        if self.skip_depth:
            return
        # desapilar hasta el tag coincidente (tolerante a HTML mal cerrado)
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self._in_title:
            self.title += data.strip()
            return
        if self.skip_depth:
            return
        text = data.strip()
        if text:
            self.current.text_parts.append(text)


def node_to_child(node):
    """Convierte un IRNode en un hijo tipificado del IR, o None."""
    t = node.tag
    if t in HEADING_TAGS:
        text = node.text()
        return {"type": "heading", "level": int(t[1]), "text": text} if text else None
    if t == "p":
        text = node.text()
        return {"type": "paragraph", "text": text} if text else None
    if t == "hr":
        return {"type": "divider", "classes": node.classes}
    if t == "blockquote":
        text = node.text()
        return {"type": "quote", "text": text, "classes": node.classes} if text else None
    if t == "img":
        return {"type": "image",
                "src": node.attrs.get("src", ""),
                "alt": node.attrs.get("alt", ""),
                "classes": node.classes}
    if t == "a":
        text = node.text()
        href = node.attrs.get("href", "")
        is_button = any(re.search(r"btn|button|cta", c, re.IGNORECASE)
                        for c in node.classes)
        if not (text or is_button):
            return None
        is_external = bool(re.match(r"^(https?://|//|wa\.me/|mailto:|tel:)", href, re.IGNORECASE))
        return {"type": "button" if is_button else "link",
                "href": href,
                "text": text,
                "is_external": is_external,
                "classes": node.classes}
    if t in LIST_TAGS:
        items = [c.text() for c in node.children if c.tag == "li" and c.text()]
        return {"type": "list", "ordered": t == "ol", "items": items} if items else None
    if t == "button":
        text = node.text()
        return {"type": "button", "href": "", "text": text,
                "is_external": False,
                "classes": node.classes} if text else None
    return None


def flatten_children(node, out):
    """Atraviesa contenedores transparentes y extrae hijos tipificados."""
    for child in node.children:
        typed = node_to_child(child)
        if typed:
            out.append(typed)
        elif child.tag in TRANSPARENT:
            flatten_children(child, out)


def build_sections(parser):
    """Agrupa el árbol en secciones semánticas header/section/footer."""
    sections = []

    def section_kind(node):
        if node.tag == "header":
            return "header"
        if node.tag == "footer":
            return "footer"
        return "section"

    def harvest(node):
        if node.tag in SECTION_TAGS:
            children = []
            flatten_children(node, children)
            # sub-landmarks anidados se cosechan como secciones propias
            for sub in node.children:
                if sub.tag in SECTION_TAGS:
                    harvest(sub)
            if children:
                sections.append({"kind": section_kind(node),
                                 "classes": node.classes,
                                 "children": children})
            return
        for child in node.children:
            harvest(child)

    harvest(parser.root)

    # Fallback: HTML plano sin landmarks → sección sintética
    if not sections:
        children = []
        flatten_children(parser.root, children)
        if children:
            sections.append({"kind": "section", "classes": ["auto-body"],
                             "children": children})
            parser.warnings.append(
                "HTML sin landmarks semánticos; se generó sección sintética")
    return sections


def extract(html_path):
    path = Path(html_path)
    if not path.is_file():
        print(f"ERROR: no existe {html_path}", file=sys.stderr)
        sys.exit(1)
    raw = path.read_text(encoding="utf-8", errors="replace")

    parser = IRParser()
    parser.feed(raw)
    parser.close()

    ir = {
        "source": path.name,
        "title": parser.title.strip(),
        "meta_description": parser.meta_description,
        "sections": build_sections(parser),
        "warnings": parser.warnings,
    }
    if not ir["sections"]:
        print("ERROR: HTML sin contenido útil tras el parseo", file=sys.stderr)
        sys.exit(2)
    return ir


def main():
    ap = argparse.ArgumentParser(description="HTML Stitch → IR JSON (E1)")
    ap.add_argument("input", help="HTML de entrada")
    ap.add_argument("-o", "--output", help="Archivo IR de salida (default stdout)")
    ap.add_argument("--pretty", action="store_true", help="JSON indentado")
    args = ap.parse_args()

    ir = extract(args.input)
    payload = json.dumps(ir, ensure_ascii=False,
                         indent=2 if args.pretty else None)
    if args.output:
        Path(args.output).write_text(payload + "\n", encoding="utf-8")
        n = sum(len(s["children"]) for s in ir["sections"])
        print(f"OK extract_ir: {len(ir['sections'])} secciones, "
              f"{n} elementos → {args.output}")
        for w in ir["warnings"]:
            print(f"  ⚠ {w}")
    else:
        print(payload)


if __name__ == "__main__":
    main()
