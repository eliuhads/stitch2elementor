import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

base = r'C:\Users\TEC\.gemini\antigravity\brain\346db11b-96e8-4209-8646-a3852cac3d40\.system_generated\steps'

for step_num in [141, 145]:
    filepath = os.path.join(base, str(step_num), 'output.txt')
    if not os.path.exists(filepath):
        print(f"Step {step_num}: FILE NOT FOUND")
        continue
    try:
        data = json.load(open(filepath, 'r', encoding='utf-8'))
        for comp in data.get('outputComponents', []):
            if 'design' in comp:
                for screen in comp['design'].get('screens', []):
                    print(f"Step {step_num}:")
                    print(f"  Screen ID: {screen.get('id')}")
                    print(f"  Title: {screen.get('title')}")
                    print(f"  HTML URL: {screen.get('htmlCode', {}).get('downloadUrl', 'N/A')}")
                    print()
    except Exception as e:
        print(f"Step {step_num}: ERROR - {e}")
