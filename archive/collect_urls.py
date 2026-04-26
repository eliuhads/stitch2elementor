import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

base = r'C:\Users\TEC\.gemini\antigravity\brain\3ec485f2-b3d2-4832-a08a-f18eb6f9f65a\.system_generated\steps'
screens = {}

# From list_screens (step 224)
with open(os.path.join(base, '224', 'output.txt'), 'r', encoding='utf-8') as f:
    data = json.load(f)
for s in data.get('screens', []):
    sid = s['name'].split('/')[-1]
    title = s.get('title', '?')
    html_url = s.get('htmlCode', {}).get('downloadUrl', '')
    screens[sid] = {'title': title, 'url': html_url}

# From generation outputs
gen_steps = [128, 131, 134, 137, 140, 143, 146, 200, 203, 206, 209, 212, 215, 218, 221]
for step in gen_steps:
    path = os.path.join(base, str(step), 'output.txt')
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for comp in data.get('outputComponents', []):
        if 'design' in comp:
            for s in comp['design'].get('screens', []):
                sid = s.get('id', '')
                title = s.get('title', '?')
                html_url = s.get('htmlCode', {}).get('downloadUrl', '')
                if sid and sid not in screens:
                    screens[sid] = {'title': title, 'url': html_url}

print(f'Total unique screens: {len(screens)}')
for sid, info in screens.items():
    has_url = 'YES' if info['url'] else 'NO'
    print(f'  [{sid[:8]}] {info["title"]} | URL: {has_url}')

# Save
out_dir = r'c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\stitch_html'
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, 'screen_urls.json'), 'w', encoding='utf-8') as f:
    json.dump(screens, f, indent=2, ensure_ascii=False)
print(f'\nSaved screen_urls.json with {len(screens)} entries')
