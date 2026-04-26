import json
import re
with open('seo-report-evergreenvzla_com.html', encoding='utf-8') as f:
    html = f.read()
m = re.search(r'<script id="report-data" type="application/json">(.*?)</script>', html, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    print(json.dumps({
        'scores': data.get('scores', {}),
        'issues': [i for cat in data.get('categories', {}).values() for i in cat.get('issues', [])]
    }, indent=2))
