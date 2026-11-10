"""Veerhavens en steigers met een naam (OpenStreetMap) -> gegevens/veerhavens.json  [[naam, lat, lon], ...]"""
import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
Q = '[out:json][timeout:120];nwr["amenity"="ferry_terminal"]["name"](-9,124.5,3,135);out center tags;'
SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
           'https://overpass.private.coffee/api/interpreter']
WEG = re.compile(r'abandoned|pertamina|mall|halte|\?|tambatan|perikanan|pendaratan|kawasan|ruang tunggu|porto|cais|jetty', re.I)
VOOR = re.compile(r'^(terminal penumpang pelabuhan|pelabuhan (penyeberangan|ferry|fery|laut|speedboat|rakyat)|pelabuhan|dermaga)\s+', re.I)


def ophalen():
    for s in SERVERS * 2:
        try:
            req = urllib.request.Request(s, data=urllib.parse.urlencode({'data': Q}).encode(), headers={'User-Agent': 'live.moza.nu'})
            return json.load(urllib.request.urlopen(req, timeout=180))
        except Exception as e:  # noqa: BLE001
            print('opnieuw:', s, e)
            time.sleep(10)
    raise SystemExit('Overpass niet bereikbaar')


def schoon(n):
    n = VOOR.sub('', n.strip())
    n = re.sub(r'\s*\((ambon|obi|bacan|tidore|sorong|lembeh|munte)\)\s*$', '', n, flags=re.I)
    n = re.sub(r'\s+(ferry terminal|pier|pelabuhan speedboat)$', '', n, flags=re.I)
    return n.strip()


def main():
    j = ophalen()
    uit = []
    for e in j['elements']:
        naam = e['tags'].get('name', '')
        if not naam or WEG.search(naam):
            continue
        la, lo = e.get('lat') or e['center']['lat'], e.get('lon') or e['center']['lon']
        n = schoon(naam)
        if len(n) < 3:
            continue
        # dubbele (binnen 1 km, zelfde naam) overslaan
        if any(abs(la - a) < 0.01 and abs(lo - b) < 0.01 for _, a, b in uit):
            continue
        uit.append([n, round(la, 4), round(lo, 4)])
    uit.sort()
    (HIER / 'gegevens' / 'veerhavens.json').write_text(json.dumps(uit, ensure_ascii=False))
    print('veerhavens:', len(uit))


if __name__ == '__main__':
    main()
