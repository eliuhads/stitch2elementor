import urllib.request, json, os

base_url = os.environ.get("WP_BASE_URL", "").rstrip("/")
if not base_url:
    print("ERROR: WP_BASE_URL environment variable not set.")
    exit(1)

url = f"{base_url}/wp-json/wp/v2/pages?per_page=50"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
data = json.loads(urllib.request.urlopen(req).read())
for p in sorted(data, key=lambda x: x['id']):
    print(f"{p['id']:3d} | {p['slug']:40s} | {p['title']['rendered']:40s} | {p['template']}")
