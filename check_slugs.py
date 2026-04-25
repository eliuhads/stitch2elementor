import urllib.request, json

url = "https://evergreenvzla.com/wp-json/wp/v2/pages?per_page=50"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
data = json.loads(urllib.request.urlopen(req).read())
for p in sorted(data, key=lambda x: x['id']):
    print(f"{p['id']:3d} | {p['slug']:40s} | {p['title']['rendered']:40s} | {p['template']}")
