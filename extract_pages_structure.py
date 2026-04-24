import re, sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\INFO_BrandBook_Evegreen\EVERGREEN_BRANDBOOK_V9_STANDALONE.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract ALL visible text content to find the page structure
sections = re.findall(r'>([^<]{5,500})<', content)

# Find the page structure section - look for patterns with URLs and page names
print("=== BUSCANDO ESTRUCTURA DE PÁGINAS ===\n")

in_structure = False
for i, section in enumerate(sections):
    text = section.strip()
    if not text or len(text) < 5:
        continue
    
    # Look for page structure markers
    lower = text.lower()
    if any(k in lower for k in ['estructura', 'páginas', 'paginas', '/shop/', '/soluciones', '/iluminacion', 
                                  '/contacto', '/sobre', '/blog', '/calculadora', '/catalogo',
                                  'homepage', 'inicio', 'woocommerce', 'categoría', 'categoria',
                                  'slug', 'url sugerida', 'tipo de página',
                                  'respaldo', 'estaciones', 'paneles', 'baterías', 'baterias',
                                  'financiamiento', 'garantía', 'garantia', 'faq',
                                  'distribuidores', 'nosotros']):
        print(f"[{i}] {text[:300]}")
        in_structure = True
    elif in_structure and len(text) > 10:
        # Print nearby context
        if any(c in text for c in ['/', '|', '→', 'Página', 'página']):
            print(f"[{i}] {text[:300]}")

print("\n\n=== BUSCANDO SECCIÓN COMPLETA DE ARQUITECTURA ===\n")

# Find the complete sitemap/architecture section
for match in re.finditer(r'((?:Estructura|Arquitectura|Sitemap|Mapa del sitio|20 páginas|22 páginas)[^<]{0,2000})', content, re.IGNORECASE):
    print(match.group(1)[:2000])
    print("---")

# Also search for numbered page listings
print("\n=== LISTADO NUMERADO DE PÁGINAS ===\n")
page_patterns = re.findall(r'>(\d+\.?\s*(?:Página|Page)?[^<]{5,200})<', content, re.IGNORECASE)
for p in page_patterns:
    print(p.strip())

# Search for table rows with page data
print("\n=== FILAS DE TABLA CON DATOS DE PÁGINAS ===\n")
# Look for td elements with page info
td_content = re.findall(r'<td[^>]*>([^<]{3,200})</td>', content)
prev = ""
for td in td_content:
    text = td.strip()
    if text and len(text) > 3:
        if any(k in text.lower() for k in ['/', 'página', 'inicio', 'energía', 'energia', 'iluminación', 'iluminacion',
                                             'solar', 'panel', 'batería', 'bateria', 'estación', 'estacion',
                                             'calculadora', 'catálogo', 'catalogo', 'blog', 'contacto',
                                             'nosotros', 'garantía', 'garantia', 'faq', 'distribuidor',
                                             'financiamiento', 'respaldo', 'shop', 'tienda', 'woocommerce']):
            print(f"  {text}")

print("\n=== DONE ===")
