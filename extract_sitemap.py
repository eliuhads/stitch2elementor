import re, sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\INFO_BrandBook_Evegreen\EVERGREEN_BRANDBOOK_V9_STANDALONE.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the sitemap section specifically
# Look for sitemap-item divs
print("=== SITEMAP ITEMS (from HTML structure) ===\n")

# Match sitemap items with number, name, slug, and badge
items = re.findall(r'sitemap-num[^>]*>([^<]*)</.*?sitemap-name[^>]*>([^<]*)</.*?sitemap-slug[^>]*>([^<]*)</.*?badge[^>]*>([^<]*)<', content, re.DOTALL)
for num, name, slug, badge in items:
    print(f"  {num.strip():>4}  {name.strip():<50} {slug.strip():<45} [{badge.strip()}]")

if not items:
    # Alternative: find all sitemap-related content
    print("(No formatted sitemap items found, trying raw extraction)\n")
    
    # Get all text between sitemap section markers
    sitemap_section = re.search(r'Arquitectura del Sitio(.*?)WooCommerce', content, re.DOTALL)
    if sitemap_section:
        text = sitemap_section.group(1)
        # Extract visible text
        visible = re.findall(r'>([^<]{2,})<', text)
        for v in visible:
            t = v.strip()
            if t and len(t) > 1:
                print(f"  {t}")

print("\n\n=== FULL SITEMAP - ALL ENTRIES ===\n")

# More robust: find sitemap-num + sitemap-name pairs
nums = re.findall(r'class="sitemap-num"[^>]*>([^<]+)<', content)
names = re.findall(r'class="sitemap-name"[^>]*>([^<]+)<', content)
slugs = re.findall(r'class="sitemap-slug"[^>]*>([^<]+)<', content)
badges = re.findall(r'class="badge[^"]*"[^>]*>([^<]+)<', content)

print(f"Found: {len(nums)} nums, {len(names)} names, {len(slugs)} slugs, {len(badges)} badges\n")

max_len = max(len(nums), len(names), len(slugs))
for i in range(max_len):
    num = nums[i].strip() if i < len(nums) else "?"
    name = names[i].strip() if i < len(names) else "?"
    slug = slugs[i].strip() if i < len(slugs) else "?"
    print(f"  {num:>4}  {name:<55} {slug}")

# Also extract WooCommerce category structure
print("\n\n=== WOOCOMMERCE CATEGORIES ===\n")
woo_section = re.search(r'Categorías de Productos(.*?)Páginas de Sistema', content, re.DOTALL)
if woo_section:
    text = woo_section.group(1)
    visible = re.findall(r'>([^<]{3,})<', text)
    for v in visible:
        t = v.strip()
        if t and len(t) > 2:
            print(f"  {t}")
