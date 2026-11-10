"""Leest de inwoners (en oppervlakte) per desa uit de ruwe BPS-pagina's en koppelt ze aan onze dorpen.

Invoer:  map met <domein>.json uit bps_ophalen.py
Uitvoer: gegevens/inwoners.json  {dorpscode: {n, l, p, jaar, km2, bron}}
         en een verslag op het scherm per kecamatan.

Gebruik: python3 dorp/bps_lezen.py <map-met-json> [--schrijf]
"""
import difflib
import glob
import json
import os
import re
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

GETAL = re.compile(r'^\d{1,3}(?:[.,]\d{3})*$|^\d+$')
KOMMA = re.compile(r'^\d+[.,]\d+$|^\d+$')
VOORVOEGSEL = re.compile(r'^(negeri|desa|kelurahan|kel\.|ohoi|dusun|negeri administratif|petuanan)\s+', re.I)


def norm(s):
    s = VOORVOEGSEL.sub('', s.strip())
    s = s.lower().replace('pp.', 'pulau-pulau').replace('p.', 'pulau ')
    return re.sub(r'[^a-z0-9]', '', s)


ALIAS = {'telukambonbaguala': 'baguala'}


def kaal(k):
    """Zonder Kepulauan/Pulau-Pulau/Pulau en dubbele letters, voor losser vergelijken."""
    k = ALIAS.get(k, k)
    k = re.sub(r'^(kepulauan|pulaupulau|pulau|pp)', '', k)
    return re.sub(r'(.)\1', r'\1', k)


def getal(s):
    return int(s.replace('.', '').replace(',', ''))


def rijen(woorden, y0, y1=10_000):
    """Groepeer woorden (tussen y0 en y1, normale letterhoogte) in rijen op hoogte."""
    ws = [w for w in woorden if y0 < w[1] < y1 and (w[3] - w[1]) < 14]
    ws.sort(key=lambda w: (w[1], w[0]))
    out = []
    for w in ws:
        if out and abs(out[-1][0] - w[1]) < 2.5:
            out[-1][1].append(w)
        else:
            out.append([w[1], [w]])
    return out


def kop(woorden, *zoek):
    for w in woorden:
        if all(re.search(z, w[4], re.I) for z in zoek):
            return w
    return None


def lees_penduduk(pagina):
    ws = pagina['woorden']
    L = P = T = None
    for kand in [w for w in ws if re.search('laki', w[4], re.I)]:
        rij = [w for w in ws if abs(w[1] - kand[1]) < 3]
        P = next((w for w in rij if re.search('perempuan|female', w[4], re.I)), None)
        T = next((w for w in rij if re.search(r'jumlah|total', w[4], re.I) and w[0] > kand[0]), None)
        if P and T and kand[0] < P[0] < T[0]:
            L = kand
            break
    if not L:
        return None
    kol = [(L[0] + L[2]) / 2, (P[0] + P[2]) / 2, (T[0] + T[2]) / 2]
    links = L[0] - 10
    y0 = max(L[3], P[3], T[3])
    eind = kop([w for w in ws if w[1] > y0], r'^(sumber|source|catatan|note)')
    uit = []
    for _, rij in rijen(ws, y0, eind[1] if eind else 10_000):
        naam = ' '.join(w[4] for w in rij if w[2] < links and not w[4].startswith('('))
        getallen = [None, None, None]
        # getallen die in stukjes zijn gesplitst ("1." en "144") weer samenvoegen
        nums = sorted([list(w) for w in rij if w[0] >= links and re.match(r'^[\d.,]+$', w[4])], key=lambda w: w[0])
        samen = []
        for w in nums:
            if samen and (w[0] - samen[-1][2]) < 2.5 and (samen[-1][4].endswith(('.', ',')) or w[4].startswith(('.', ','))):
                samen[-1][2] = w[2]
                samen[-1][4] += w[4]
            else:
                samen.append(w)
        for w in samen:
            if GETAL.match(w[4]):
                c = (w[0] + w[2]) / 2
                k = min(range(3), key=lambda i: abs(kol[i] - c))
                getallen[k] = getal(w[4])
        if naam and any(g is not None for g in getallen):
            uit.append((naam, getallen))
    return uit


def lees_enkel(pagina):
    """Tabel met alleen één kolom 'Penduduk/Population' (zonder mannen/vrouwen)."""
    ws = pagina['woorden']
    kopw = None
    for desa in [w for w in ws if re.search(r'^desa', w[4], re.I) and w[0] < 150]:
        kopw = next((w for w in ws if re.search(r'^(penduduk|population|jumlah)', w[4], re.I) and abs(w[1] - desa[1]) < 3 and w[0] > desa[2]), None)
        if kopw:
            break
    if not kopw:
        return None
    c = (kopw[0] + kopw[2]) / 2
    links = c - 45
    eind = kop([w for w in ws if w[1] > kopw[3]], r'^(sumber|source|catatan|note)')
    namen, getallen = [], []
    for y, rij in rijen(ws, kopw[3], eind[1] if eind else 10_000):
        naam = ' '.join(w[4] for w in rij if w[2] < links and not w[4].startswith('('))
        if naam and len(re.sub(r'[^A-Za-z]', '', naam)) >= 3 and not re.search(r'village|desa/', naam, re.I):
            namen.append(naam)
        getallen += [getal(w[4]) for w in rij if GETAL.match(w[4]) and abs((w[0] + w[2]) / 2 - c) < 45]
    if len(namen) != len(getallen):
        return None
    return [(n, [None, None, g]) for n, g in zip(namen, getallen)]


def lees_luas(pagina):
    ws = pagina['woorden']
    if not re.search(r'luas', pagina['tekst'][:600], re.I):
        return None
    k = kop(ws, r'km')
    if not k:
        return None
    links = k[0] - 40
    uit = []
    for _, rij in rijen(ws, k[3]):
        naam = ' '.join(w[4] for w in rij if w[2] < links)
        nums = [w for w in rij if w[0] >= links and KOMMA.match(w[4])]
        if naam and nums:
            uit.append((naam, float(nums[0][4].replace('.', '').replace(',', '.')) if ',' in nums[0][4] else float(nums[0][4])))
    return uit


def luas_van(kec):
    """Oppervlakte per desa (km2), alleen als de desa samen optellen tot het totaal van de kecamatan."""
    for p in kec.get('paginas', []):
        t = p['tekst']
        if not re.search(r'luas daerah|total area', t, re.I) or re.search(r'DAFTAR TABEL|LIST OF TABLES', t):
            continue
        r = lees_luas(p)
        if not r or len(r) < 3:
            continue
        r = [(n, v) for n, v in r if not re.search(r'district|kecamatan dalam|\d', n, re.I) and v < 5000]
        if len(r) < 3:
            continue
        tot = max(r, key=lambda x: x[1])
        rest = [x for x in r if x is not tot]
        som = sum(v for _, v in rest)
        if tot[1] and abs(som - tot[1]) <= max(1.0, 0.03 * tot[1]):
            return {norm(n): v for n, v in rest}
    return {}


def boekje(kec):
    """Zoek de tabel met inwoners per desa. Geeft (rijen, totaal, verslag)."""
    for p in kec.get('paginas', []):
        if not re.search(r'penduduk', p['tekst'], re.I):
            continue
        r = lees_penduduk(p)
        if not r or len(r) < 2:
            r = lees_enkel(p)
        if not r or len(r) < 2:
            continue
        # laatste rij met de grootste totaal = kecamatan
        tot = max(r, key=lambda x: x[1][2] or 0)
        desa = [x for x in r if x is not tot]
        som = sum((x[1][2] or 0) for x in desa)
        if tot[1][2] and som == tot[1][2]:
            return desa, tot[1][2], 'ok'
        # anders: alleen rijen waarin mannen + vrouwen = totaal
        goed = [x for x in desa if None not in x[1] and x[1][0] + x[1][1] == x[1][2]]
        if len(goed) >= 2 and len(goed) >= 0.6 * len(desa):
            return goed, tot[1][2], f'per rij ({len(goed)} van {len(desa)} rijen kloppen)'
    return None, None, 'geen kloppende tabel'


def main(map_in, schrijven=False):
    import data as D
    rows, _ = D.dorpen()
    perkec = {}
    for d in rows:
        perkec.setdefault(norm(d['kec']), []).append(d)
    resultaat, verslag = {}, []
    for f in sorted(glob.glob(os.path.join(map_in, '*.json'))):
        dom = Path(f).stem
        boek = json.load(open(f))
        # per kecamatan alleen het nieuwste boekje (namen komen soms in hoofdletters dubbel voor)
        beste = {}
        for naam, kec in boek.items():
            k = norm(naam)
            if k not in beste or kec['jaar'] > beste[k][1]['jaar']:
                beste[k] = (naam, kec)
        perons = {}
        for k, (naam, kec) in beste.items():
            kale = {kaal(x): x for x in perkec}
            sleutel = (k if k in perkec else kale.get(kaal(k))
                       or (difflib.get_close_matches(k, perkec.keys(), 1, 0.85) or [None])[0]
                       or kale.get((difflib.get_close_matches(kaal(k), kale.keys(), 1, 0.8) or [None])[0]))
            if not sleutel:
                verslag.append((dom, naam, kec['jaar'], 0, 0, 'kecamatan niet gevonden in onze lijst'))
                continue
            if sleutel not in perons or kec['jaar'] > perons[sleutel][1]['jaar']:
                perons[sleutel] = (naam, kec)
        for sleutel, (naam, kec) in sorted(perons.items()):
            onze = perkec[sleutel]
            desa, totaal, st = boekje(kec)
            if not desa:
                verslag.append((dom, naam, kec['jaar'], len(onze), 0, st))
                continue
            luas = luas_van(kec)
            namen = {norm(d['naam']): d for d in onze}
            gekoppeld = 0
            for bnaam, (l, pr, t) in desa:
                b = norm(bnaam)
                d = namen.get(b)
                if not d:
                    m = difflib.get_close_matches(b, namen.keys(), 1, 0.82)
                    d = namen.get(m[0]) if m else None
                if not d or not t:
                    continue
                gekoppeld += 1
                km2 = luas.get(b)
                resultaat[d['code']] = {'n': t, 'l': l, 'p': pr, 'jaar': kec['jaar'] - 1, 'km2': km2,
                                        'bron': kec['titel']}
            verslag.append((dom, naam, kec['jaar'], len(onze), gekoppeld, st))
    tot_dorpen = len(rows)
    print(f'Dorpen met inwoners: {len(resultaat)} van {tot_dorpen}')
    for r in verslag:
        print('{:5} {:28} {:5} onze {:3} gekoppeld {:3}  {}'.format(*r))
    if schrijven:
        (HIER / 'gegevens' / 'inwoners.json').write_text(json.dumps(resultaat, ensure_ascii=False, indent=0))
    return resultaat, verslag


if __name__ == '__main__':
    main(sys.argv[1], '--schrijf' in sys.argv)
