import json, sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'C:\Users\TEC\.gemini\antigravity\brain\346db11b-96e8-4209-8646-a3852cac3d40\.system_generated\steps\125\output.txt'
data = json.load(open(filepath, 'r', encoding='utf-8'))

for i, comp in enumerate(data.get('outputComponents', [])):
    print(f"Component {i}: keys = {list(comp.keys())}")
    if 'design' in comp:
        for screen in comp['design'].get('screens', []):
            print(f"  Screen ID: {screen.get('id')}")
            print(f"  Title: {screen.get('title')}")
            dl = screen.get('htmlCode', {}).get('downloadUrl', '')
            print(f"  Download URL: {dl[:120]}...")
    if 'text' in comp:
        print(f"  Text: {comp['text'][:200]}...")
