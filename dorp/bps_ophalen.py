"""Haalt per BPS-domein (kabupaten/kota) de nieuwste 'Kecamatan ... Dalam Angka' op
en bewaart alleen de pagina's over inwoners en oppervlakte per desa.

Gebruik:  BPS_KEY=... python3 dorp/bps_ophalen.py lijst            -> domeinen van Maluku (81) en Maluku Utara (82) als JSON
          BPS_KEY=... python3 dorp/bps_ophalen.py domein 8103 uitmap  -> uitmap/8103.json
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

KEY = os.environ['BPS_KEY']
API = 'https://webapi.bps.go.id/v1/api'


def get(url, tries=7):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (live.moza.nu)'})
            return urllib.request.urlopen(req, timeout=180).read()
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            print('  opnieuw:', e)
            time.sleep(30 * (i + 1) if '429' in str(e) else 5 * (i + 1))


def api(pad):
    return json.loads(get(f'{API}/{pad}/key/{KEY}/'))


def domeinen(provs=('8100', '8200')):
    uit = {}
    for prov in provs:
        j = api(f'domain/type/kabbyprov/prov/{prov}')
        for d in j['data'][1]:
            if d['domain_id'][:2] == prov[:2]:
                uit[d['domain_id']] = {'id': d['domain_id'], 'naam': d['domain_name']}
    return list(uit.values())


def publicaties(dom):
    alles, pagina = [], 1
    while True:
        j = api(f'list/model/publication/lang/ind/domain/{dom}/keyword/{urllib.parse.quote("Dalam Angka")}/page/{pagina}')
        if j.get('data-availability') != 'available':
            break
        info, lijst = j['data'][0], j['data'][1]
        alles += lijst
        if pagina >= info['pages']:
            break
        pagina += 1
    return alles


PAG = re.compile(r'(penduduk|luas|jarak|distance|sekolah|school|puskesmas|posyandu|kesehatan|health)', re.I)
DESA = re.compile(r'(desa|negeri|kelurahan|village)', re.I)
WOORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')


def verwerk(dom, map_uit):
    pubs = publicaties(dom)
    beste = {}
    for p in pubs:
        t = p['title'].strip()
        m = re.match(r'(?i)kecamatan\s+(.+?)\s+dalam\s+angka\s+(20\d\d)', t)
        if not m:
            continue
        naam, jaar = m.group(1).strip(), int(m.group(2))
        if naam not in beste or jaar > beste[naam]['jaar']:
            beste[naam] = {'jaar': jaar, 'titel': t, 'pdf': p['pdf']}
    print(dom, 'kecamatan met boekje:', len(beste))
    uit = {}
    for naam, b in sorted(beste.items()):
        try:
            data = get(b['pdf'])
            with tempfile.TemporaryDirectory() as tmp:
                pdf, txt = os.path.join(tmp, 'b.pdf'), os.path.join(tmp, 'b.txt')
                open(pdf, 'wb').write(data)
                subprocess.run(['pdftotext', '-layout', pdf, txt], check=True)
                tekst = open(txt, encoding='utf-8', errors='replace').read()
                alle = tekst.split('\f')
                nrs = [i + 1 for i, pg in enumerate(alle) if PAG.search(pg) and DESA.search(pg)]
                paginas = []
                for nr in nrs:
                    box = os.path.join(tmp, f'p{nr}.html')
                    subprocess.run(['pdftotext', '-bbox', '-f', str(nr), '-l', str(nr), pdf, box], check=True)
                    woorden = [[round(float(a), 1), round(float(b), 1), round(float(c), 1), round(float(d), 1), html.unescape(w)]
                               for a, b, c, d, w in WOORD.findall(open(box, encoding='utf-8', errors='replace').read())]
                    paginas.append({'nr': nr, 'tekst': alle[nr - 1], 'woorden': woorden})
            uit[naam] = {'jaar': b['jaar'], 'titel': b['titel'], 'paginas': paginas}
            print(f'  {naam} {b["jaar"]}: {len(paginas)} pagina\'s')
        except Exception as e:  # noqa: BLE001
            uit[naam] = {'jaar': b['jaar'], 'titel': b['titel'], 'fout': str(e)}
            print(f'  {naam}: FOUT {e}')
    os.makedirs(map_uit, exist_ok=True)
    json.dump(uit, open(os.path.join(map_uit, f'{dom}.json'), 'w'), ensure_ascii=False)


if __name__ == '__main__':
    if sys.argv[1] == 'lijst':
        provs = tuple(sys.argv[2].split(',')) if len(sys.argv) > 2 else ('8100', '8200')
        print(json.dumps([d['id'] for d in domeinen(provs) if not d['id'].endswith('00')]))
    else:
        verwerk(sys.argv[2], sys.argv[3])
