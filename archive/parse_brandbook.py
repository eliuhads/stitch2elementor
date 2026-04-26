import re
import sys

filepath = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\INFO_BrandBook_Evegreen\EVERGREEN_BRANDBOOK_V9_STANDALONE.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all hex colors
hex_colors = sorted(set(re.findall(r'#[0-9a-fA-F]{6}', content)))
print('=== ALL HEX COLORS FOUND ===')
for c in hex_colors:
    print(c)

# Extract text content between tags to find color labels
print('\n=== TEXT CONTENT WITH COLORS ===')
# Find spans/divs that contain color codes
for match in re.finditer(r'>([^<]{0,100}#[0-9a-fA-F]{6}[^<]{0,100})<', content):
    text = match.group(1).strip()
    if text:
        print(text)

# Look for color-swatch patterns (common in brandbooks)
print('\n=== COLOR SWATCHES (background-color) ===')
bg_colors = re.findall(r'background(?:-color)?:\s*(#[0-9a-fA-F]{6})', content)
for bc in sorted(set(bg_colors)):
    print(bc)

# Extract font families
print('\n=== FONT FAMILIES ===')
fonts = re.findall(r"font-family:\s*'([^']+)'", content)
fonts += re.findall(r'font-family:\s*"([^"]+)"', content)
fonts += re.findall(r"font-family:\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", content)
for f in sorted(set(fonts)):
    print(f)

# Google Fonts links
print('\n=== GOOGLE FONTS ===')
gfonts = re.findall(r'fonts\.googleapis\.com/css2\?family=([^&"]+)', content)
for g in set(gfonts):
    print('Google Font:', g.replace('+', ' '))

# Border radius values
print('\n=== BORDER RADIUS VALUES ===')
radii = re.findall(r'border-radius:\s*([^;}{]+)', content)
for r2 in sorted(set(radii)):
    print(r2.strip())

# Extract all visible text to find brand info
print('\n=== KEY BRAND TEXT (searching for relevant terms) ===')
# Find sections about typography, colors, brand values etc.
sections = re.findall(r'>([^<]{10,300})<', content)
keywords = ['Playfair', 'Montserrat', 'Inter', 'Raleway', 'Poppins', 'Roboto', 'Outfit',
            'primary', 'secondary', 'accent', 'brand', 'slogan', 'tagline', 'mission',
            'tipograf', 'typograph', 'color', 'palette', 'paleta',
            'evergreen', 'iluminaci', 'energ', 'solar',
            'radius', 'border', 'sombra', 'shadow',
            'premium', 'industrial', 'elegante',
            'CTA', 'button', 'bot']
seen = set()
for section in sections:
    text = section.strip()
    if text and len(text) > 10:
        lower = text.lower()
        if any(k.lower() in lower for k in keywords):
            if text[:50] not in seen:
                seen.add(text[:50])
                print(text[:200])

print('\n=== DONE ===')
