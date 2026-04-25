import json, sys, os, re, urllib.request, time
sys.stdout.reconfigure(encoding='utf-8')

# Title to filename mapping based on BrandBook V9 architecture
TITLE_TO_FILENAME = {
    'Homepage': 'homepage.html',
    'Inicio': 'homepage.html',
    'Soluciones': 'soluciones-energia.html',
    'Estaciones': 'estaciones-energia.html',
    'Respaldo Energético Residencial': 'respaldo-residencial.html',
    'Respaldo Energético Comercial': 'respaldo-comercial.html',
    'Baterías': 'baterias-solar.html',
    'Paneles Solares': 'paneles-solares.html',
    'Iluminación - ': 'iluminacion.html',
    'Iluminación LED Solar': 'iluminacion-solar.html',
    'Iluminación Convencional': 'iluminacion-convencional.html',
    'Jump Starters': 'jump-starters.html',
    'Calculadora': 'calculadora.html',
    'Catálogos': 'catalogos.html',
    'Sobre Nosotros': 'sobre-nosotros.html',
    'Blog': 'blog.html',
    'Financiamiento': 'financiamiento.html',
    'Contacto': 'contacto.html',
    'Soporte': 'soporte.html',
    'Política de Privacidad': 'privacidad.html',
    'Política de Cookies': 'cookies.html',
}

def title_to_filename(title):
    """Map screen title to a clean filename."""
    for key, filename in TITLE_TO_FILENAME.items():
        if key in title:
            return filename
    # Fallback: slugify the title
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')
    return f'{slug}.html'

# Load URLs
urls_path = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\stitch_html\screen_urls.json'
with open(urls_path, 'r', encoding='utf-8') as f:
    screens = json.load(f)

out_dir = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\stitch_html'
os.makedirs(out_dir, exist_ok=True)

results = []
for i, (sid, info) in enumerate(screens.items(), 1):
    title = info['title']
    url = info['url']
    filename = title_to_filename(title)
    filepath = os.path.join(out_dir, filename)
    
    print(f'[{i:2d}/20] Downloading: {title}')
    print(f'         -> {filename}')
    
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=30) as response:
            html_content = response.read()
        
        with open(filepath, 'wb') as f:
            f.write(html_content)
        
        size_kb = len(html_content) / 1024
        status = 'OK' if size_kb > 15 else 'WARN_SMALL'
        print(f'         Size: {size_kb:.1f} KB [{status}]')
        results.append({
            'screen_id': sid,
            'title': title,
            'filename': filename,
            'size_kb': round(size_kb, 1),
            'status': status
        })
    except Exception as e:
        print(f'         ERROR: {e}')
        results.append({
            'screen_id': sid,
            'title': title,
            'filename': filename,
            'size_kb': 0,
            'status': f'ERROR: {str(e)[:80]}'
        })
    
    time.sleep(0.5)  # Small delay between requests

# Summary
print('\n' + '='*60)
print('DOWNLOAD SUMMARY')
print('='*60)
ok = sum(1 for r in results if r['status'] == 'OK')
warn = sum(1 for r in results if r['status'] == 'WARN_SMALL')
err = sum(1 for r in results if r['status'].startswith('ERROR'))
print(f'OK (>15KB): {ok}')
print(f'Small (<15KB): {warn}')
print(f'Errors: {err}')

for r in results:
    icon = '✅' if r['status'] == 'OK' else ('⚠️' if r['status'] == 'WARN_SMALL' else '❌')
    print(f"  {icon} {r['filename']:40s} {r['size_kb']:8.1f} KB")

# Save results manifest
with open(os.path.join(out_dir, 'download_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f'\nManifest saved to download_manifest.json')
