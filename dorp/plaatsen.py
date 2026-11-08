"""Zoekt per dorp waar de huizen staan (het dorp zelf), in plaats van het midden van de dorpsgrond.

Bron: OpenStreetMap (via Overpass). We nemen een plaats-punt (place=village, town, hamlet, ...)
dat binnen de grens van het dorp ligt en dezelfde naam heeft. Lukt dat niet, dan blijft het midden staan.
Schrijft dorp/gegevens/plaatsen.json: {code: [lat, lon]}. Draait af en toe, niet elk uur.
"""
import difflib, json, re, sys, urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data as D  # noqa: E402
from shapely.geometry import Point  # noqa: E402
from shapely.strtree import STRtree  # noqa: E402

UIT = Path(__file__).resolve().parent / 'gegevens' / 'plaatsen.json'
Q = """[out:json][timeout:180];
node["place"~"^(city|town|village|hamlet|suburb|neighbourhood|quarter|isolated_dwelling)$"](-9.8,123.0,3.5,136.5);
out body;"""


def norm(s):
    s = s.lower()
    s = re.sub(r'\b(negeri|desa|kampung|dusun|ohoi|kelurahan|kel\.?|ds\.?)\b', ' ', s)
    return re.sub(r'[^a-z0-9]', '', s)


def main():
    url = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(Q)
    j = D.get_json(url, timeout=300)
    if not j:
        print('Overpass gaf niets terug')
        return 1
    nodes = [n for n in j.get('elements', []) if n.get('tags', {}).get('name')]
    print('plaatsen in OSM:', len(nodes))
    rows, _ = D.dorpen()
    import bouw as B
    geos, idx = [], []
    for i, d in enumerate(rows):
        g = B.poly_deg(d['grens'])
        if g is not None:
            geos.append(g)
            idx.append(i)
    boom = STRtree(geos)
    gevonden = {}
    rang = {'village': 0, 'town': 0, 'city': 0, 'suburb': 1, 'hamlet': 2, 'neighbourhood': 3, 'quarter': 3, 'isolated_dwelling': 4}
    kandidaten = {}
    for n in nodes:
        pt = Point(n['lon'], n['lat'])
        for k in boom.query(pt):
            if geos[k].contains(pt):
                kandidaten.setdefault(idx[k], []).append(n)
    for i, ns in kandidaten.items():
        d = rows[i]
        namen = {norm(d['naam']), norm(d['officieel'])}
        beste = None
        for n in ns:
            tags = n['tags']
            nm = {norm(tags.get(t, '')) for t in ('name', 'name:id', 'alt_name', 'official_name', 'old_name')} - {''}
            if nm & namen or any(a and (a in b or b in a) for a in namen for b in nm if len(a) >= 4 and len(b) >= 4):
                r = rang.get(tags.get('place'), 5)
                if beste is None or r < beste[0]:
                    beste = (r, n)
        if not beste:
            # bijna dezelfde naam (andere schrijfwijze, zoals Ulath en Ullath)
            for n in ns:
                nm = norm(n['tags'].get('name', ''))
                if nm and max(difflib.SequenceMatcher(None, nm, a).ratio() for a in namen) >= 0.8:
                    r = rang.get(n['tags'].get('place'), 5)
                    if beste is None or r < beste[0]:
                        beste = (r, n)
        if not beste:
            # precies één dorp of stad binnen de grens: dat is vrijwel zeker het dorp zelf
            dorpen_in = [n for n in ns if n['tags'].get('place') in ('village', 'town', 'city')]
            if len(dorpen_in) == 1:
                beste = (9, dorpen_in[0])
        if beste:
            gevonden[d['code']] = [round(beste[1]['lat'], 5), round(beste[1]['lon'], 5)]
    UIT.parent.mkdir(parents=True, exist_ok=True)
    UIT.write_text(json.dumps(gevonden, separators=(',', ':')))
    print(f'dorp gevonden voor {len(gevonden)} van {len(rows)} dorpen')
    return 0


if __name__ == '__main__':
    sys.exit(main())
