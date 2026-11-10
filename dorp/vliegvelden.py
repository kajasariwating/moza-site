"""Vliegvelden in de Molukken (OpenStreetMap) -> gegevens/vliegvelden.json  [[naam, lat, lon, iata], ...]"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
Q = '[out:json][timeout:120];nwr["aeroway"="aerodrome"](-9,124.5,3,135);out center tags;'
SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
           'https://overpass.private.coffee/api/interpreter']


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
    n = re.sub(r'^(bandar udara|bandara)\s+', '', n.strip(), flags=re.I)
    n = re.sub(r'\s+(airport|airstrip|bandara)$', '', n, flags=re.I)
    return n.strip()


def main():
    uit = []
    for e in ophalen()['elements']:
        t = e.get('tags', {})
        naam = t.get('name') or t.get('name:en') or ''
        iata = t.get('iata', '')
        # alleen echte vliegvelden: met een IATA- of ICAO-code, niet gesloten of militair-only
        if not naam or not (iata or t.get('icao')) or t.get('disused') or t.get('abandoned:aeroway'):
            continue
        if t.get('military') and not iata:
            continue
        la, lo = e.get('lat') or e['center']['lat'], e.get('lon') or e['center']['lon']
        uit.append([schoon(naam), round(la, 4), round(lo, 4), iata])
    uit.sort()
    (HIER / 'gegevens' / 'vliegvelden.json').write_text(json.dumps(uit, ensure_ascii=False))
    print('vliegvelden:', len(uit))
    for v in uit:
        print(' ', v)


if __name__ == '__main__':
    main()
