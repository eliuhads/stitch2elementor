import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\INFO_BrandBook_Evegreen\EVERGREEN_BRANDBOOK_V9_STANDALONE.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find CSS custom properties (CSS variables)
print('=== CSS CUSTOM PROPERTIES ===')
css_vars = re.findall(r'--([a-zA-Z0-9-]+)\s*:\s*([^;}{]+)', content)
seen = set()
for name, value in css_vars:
    val = value.strip()
    key = f"--{name}: {val}"
    if key not in seen:
        seen.add(key)
        print(key)

# Find all text near color swatches - look for labeled sections
print('\n=== COLOR SECTION CONTENT ===')
# Find text blocks that mention specific color names or hex codes
color_sections = re.finditer(r'((?:Primary|Secondary|Accent|Energy|Dark|Paper|Flash|Green|Evergreen|Deep|Navy|Amber|Solar|Technology|CTA|Highlight|Background|Surface|Text)[^<]{0,300})', content, re.IGNORECASE)
seen2 = set()
for m in color_sections:
    text = m.group(1).strip().replace('\n', ' ')[:200]
    if text[:40] not in seen2 and len(text) > 15:
        seen2.add(text[:40])
        print(text)
        print()

# Find font specifications
print('\n=== FONT SPECS ===')
font_sections = re.finditer(r'((?:Barlow|JetBrains|Montserrat|Inter|Poppins|Roboto|Playfair|Condensed|Mono|font|tipograf|typograph)[^<]{0,300})', content, re.IGNORECASE)
seen3 = set()
for m in font_sections:
    text = m.group(1).strip().replace('\n', ' ')[:300]
    if text[:40] not in seen3 and len(text) > 10:
        seen3.add(text[:40])
        print(text)
        print()

# Find border-radius and shape info
print('\n=== SHAPES & RADII ===')
shape_sections = re.finditer(r'((?:border-radius|radius|rounded|corner|shape|pill|sharp)[^<]{0,200})', content, re.IGNORECASE)
seen4 = set()
for m in shape_sections:
    text = m.group(1).strip().replace('\n', ' ')[:200]
    if text[:30] not in seen4:
        seen4.add(text[:30])
        print(text)

# Find brand-related information
print('\n=== BRAND IDENTITY ===')
brand_sections = re.finditer(r'((?:misi[oó]n|visi[oó]n|valores|slogan|tagline|fabricant|manufacturer|LED|lumen|lux|watt|solar|fotovoltaic)[^<]{5,200})', content, re.IGNORECASE)
seen5 = set()
for m in brand_sections:
    text = m.group(1).strip().replace('\n', ' ')[:200]
    if text[:30] not in seen5 and len(text) > 15:
        seen5.add(text[:30])
        print(text)
        print()

# Extract named color values from brandbook structure
print('\n=== SPECIFIC COLOR MAPPINGS ===')
# Look for patterns like "color_name": "#hex" or similar
color_maps = re.findall(r'([\w\s-]{3,30})\s*(?::|→|=|—)\s*(#[0-9a-fA-F]{6})', content)
for name, hex_val in color_maps:
    print(f"  {name.strip()} = {hex_val}")

print('\n=== DONE ===')
