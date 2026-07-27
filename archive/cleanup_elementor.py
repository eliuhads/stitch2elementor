import json
import os
import re

def process_elementor_json(file_path, output_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Dictionary of Material Symbols to Font Awesome equivalents
    ICON_MAP = {
        "solar_power": "fas fa-solar-panel",
        "bolt": "fas fa-bolt",
        "battery_full": "fas fa-battery-full",
        "lightbulb": "fas fa-lightbulb",
        "ev_station": "fas fa-charging-station",
        "phone_iphone": "fas fa-mobile-alt",
        "mail": "fas fa-envelope",
        "location_on": "fas fa-map-marker-alt",
        "shopping_cart": "fas fa-shopping-cart",
        "description": "fas fa-file-alt",
        "support_agent": "fas fa-headset",
        "verified": "fas fa-check-circle",
        "trending_up": "fas fa-chart-line",
        "manufacturing": "fas fa-industry",
        "groups": "fas fa-users",
        "home": "fas fa-home",
        "business": "fas fa-briefcase",
        "settings": "fas fa-cog",
        "info": "fas fa-info-circle",
        "help": "fas fa-question-circle"
    }

    def clean_elements(elements):
        cleaned = []
        for el in elements:
            # Skip redundant HTML widgets (fonts/styles)
            if el.get('widgetType') == 'html':
                content = el.get('settings', {}).get('html', '')
                if 'font-awesome' in content or 'Material Symbols' in content:
                    continue
            
            # Recursive cleanup
            if 'elements' in el:
                el['elements'] = clean_elements(el['elements'])
            
            # Process settings
            settings = el.get('settings', {})
            
            # 1. Fix Fonts based on widget type
            if el.get('widgetType') == 'heading':
                settings['typography_font_family'] = "Barlow Condensed"
                settings['typography_text_transform'] = "uppercase"
                settings['typography_typography'] = "custom"
            elif el.get('widgetType') in ['text-editor', 'button']:
                if 'typography_font_family' not in settings or settings['typography_font_family'] == '':
                    settings['typography_font_family'] = "Barlow"
                    settings['typography_typography'] = "custom"

            # 2. Replace Material Symbol Slugs (Simple heuristic)
            # Check title, editor, and specific icon settings if they exist
            if 'title' in settings and isinstance(settings['title'], str):
                for slug, fa in ICON_MAP.items():
                    if slug in settings['title'] and len(settings['title'].strip()) < 30:
                        # If the title is JUST the icon slug, replace it with Font Awesome logic
                        # Elementor doesn't allow HTML in Title usually, so we might need to change widget type
                        # But for now let's just note it or try to wrap it
                        pass
            
            if 'editor' in settings and isinstance(settings['editor'], str):
                for slug, fa in ICON_MAP.items():
                    # Replace things like <span class="material-symbols-outlined">solar_power</span>
                    pattern = rf'<span[^>]*material-symbols-outlined[^>]*>{slug}</span>'
                    replacement = f'<i class="{fa}"></i>'
                    settings['editor'] = re.sub(pattern, replacement, settings['editor'])
                    
                    # Also check for naked slugs in small tags
                    if settings['editor'].strip() == slug:
                         settings['editor'] = f'<i class="{fa}"></i>'

            # 3. Handle specific Icon Widgets
            if el.get('widgetType') == 'icon' or 'icon' in settings:
                # If Elementor has a slug we recognize, map it
                pass

            cleaned.append(el)
        return cleaned

    # Start cleanup
    cleaned_data = clean_elements(data)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

    return len(cleaned_data)

if __name__ == "__main__":
    import json
    
    manifest_path = r"c:\Users\TEC\Desktop\ANTIGRAVITY PROJECTS\EVERGREEN_2.0\page_manifest.json"
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    # We will process each page in the manifest
    # For now, we'll try to find the latest downloaded JSON for each ID or assume a naming convention
    # Since we can download them on the fly, let's just keep the single file logic for testing 
    # and use a loop in the bash/powershell to call it.
    
    # Actually, let's just make it a one-file tool for now to avoid complexity 
    # and manually run it for the pages we need.
    
    import sys
    if len(sys.argv) > 2:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        count = process_elementor_json(input_file, output_file)
        print(f"Processed {count} root elements for {os.path.basename(input_file)}")
    else:
        print("Usage: python cleanup_elementor.py <input_json> <output_json>")
