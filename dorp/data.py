"""Gegevens laden: dorpen en grenzen uit de atlas, en live data van open bronnen.

Elke bron mag mislukken. Dan geeft de functie None terug en laat de pagina dat blok weg.
"""
import json, math, os, re, time, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS = ROOT / 'kaarten' / 'atlas-maluku'
CACHE = Path(os.environ.get('DORP_CACHE', ROOT / 'dorp' / '.cache'))
UA = {'User-Agent': 'moza-dorp/1.0 (+https://live.moza.nu)'}

GROEPEN = {
    'ambon': 'Ambon', 'lease': 'Lease-eilanden', 'seram': 'Seram', 'buru': 'Buru',
    'banda': 'Banda-eilanden', 'zuidoost': 'Kei, Aru en Tanimbar', 'zuidwest': 'Zuidwest-Molukken',
    'noord': 'Noord-Molukken',
}
GROEP_SUB = {
    'ambon': 'Kota Ambon, Leihitu en Salahutu', 'lease': 'Haruku, Saparua en Nusalaut',
    'seram': 'Met Manipa, Geser en Gorom', 'buru': 'Buru en Buru Selatan',
    'banda': 'Banda Neira en omliggende eilanden', 'zuidoost': 'Zuidoost-Molukken',
    'zuidwest': 'Wetar, Kisar, Leti, Babar en meer', 'noord': 'Halmahera, Ternate, Tidore, Bacan en Sula',
}
# Eigen schrijfwijze (zoals in de atlas)
NAMEN = {'Hutumury': 'Hutumuri', 'Liliboy': 'Lilibooi'}


# ---------------- hulp ----------------

def get(url, timeout=60, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa
            last = e
            if getattr(e, 'code', None) == 404:
                break
            time.sleep(2 + 3 * i)
    print('  mislukt:', url[:120], last)
    return None


def get_json(url, **kw):
    b = get(url, **kw)
    if b is None:
        return None
    try:
        return json.loads(b)
    except Exception as e:
        print('  geen json:', url[:120], e)
        return None


def decode(s, f=1e4):
    """Polyline (Google-formaat) naar [(lat, lon), ...]."""
    out, i, lat, lng = [], 0, 0, 0
    while i < len(s):
        for k in range(2):
            shift = res = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                res |= (b & 31) << shift
                shift += 5
                if b < 32:
                    break
            d = ~(res >> 1) if res & 1 else (res >> 1)
            if k == 0:
                lat += d
            else:
                lng += d
        out.append((lat / f, lng / f))
    return out


def slugify(s):
    s = s.lower()
    s = re.sub(r"['’`]", '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s


# ---------------- dorpen ----------------

def dorpen():
    """Alle dorpen met naam, kecamatan, eilandgroep, punt, grens (lijst van ringen) en slug."""
    idx = json.loads((ATLAS / 'index.json').read_text())
    kec = idx['kec']
    rows = []
    for r in idx['p']:
        code, off, ki, kel, g, la, lo = r[:7]
        rows.append({
            'code': code, 'officieel': off, 'naam': NAMEN.get(off, off), 'kec': kec[ki],
            'kel': bool(kel), 'groep': g, 'la': la, 'lo': lo, 'kab': code[:5],
            'prov': 'Maluku' if code.startswith('81') else 'Maluku Utara', 'grens': None,
        })
    by = {r['code']: r for r in rows}
    kust = {}
    for f in sorted((ATLAS / 'kab').glob('*.json')):
        k = json.loads(f.read_text())
        for code, rings in k['v']:
            if code in by:
                by[code]['grens'] = [decode(x[0]) for x in rings if x and x[0]]
        kust[f.stem] = [[decode(x) for x in poly] for poly in k.get('kust', [])]
    # slugs: naam, bij dubbele namen naam-kecamatan, daarna eventueel code
    tel = {}
    for r in rows:
        tel[slugify(r['naam'])] = tel.get(slugify(r['naam']), 0) + 1
    used = set()
    for r in rows:
        s = slugify(r['naam'])
        if tel[s] > 1:
            s = f"{s}-{slugify(r['kec'])}"
        if s in used:
            s = f"{s}-{r['code'].replace('.', '')}"
        used.add(s)
        r['slug'] = s
    return rows, kust


# ---------------- brand (NASA FIRMS via GIBS) ----------------

# Suomi NPP staat niet (meer) in GIBS; NOAA-20 en NOAA-21 wel.
SATS = [('VIIRS_NOAA20', 'NOAA-20'), ('VIIRS_NOAA21', 'NOAA-21')]
TILES = [(9, 33), (9, 34), (10, 33), (10, 34)]


def branden(dagen=8):
    import mapbox_vector_tile
    nu = datetime.now(timezone.utc)
    pts, ok = [], 0
    for d in range(dagen):
        dag = (nu - timedelta(days=d)).strftime('%Y-%m-%d')
        for sat, satnaam in SATS:
            for row, col in TILES:
                url = (f'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{sat}_Thermal_Anomalies_375m_All'
                       f'/default/{dag}/500m/5/{row}/{col}.mvt')
                b = get(url, timeout=40, tries=2)
                if not b:
                    continue
                ok += 1
                if b[:2] == b'\x1f\x8b':
                    import gzip
                    b = gzip.decompress(b)
                try:
                    t = mapbox_vector_tile.decode(b)
                except Exception as ex:
                    print('  mvt fout', sat, dag, ex)
                    continue
                for lnaam, layer in t.items():
                    for f in layer.get('features', []):
                        p = f.get('properties', {})
                        try:
                            la, lo = float(p['LATITUDE']), float(p['LONGITUDE'])
                        except Exception:
                            continue
                        tm = str(p.get('ACQ_TIME', '0000')).replace(':', '').zfill(4)
                        try:
                            ts = datetime.strptime(f"{p['ACQ_DATE']} {tm}", '%Y-%m-%d %H%M').replace(tzinfo=timezone.utc)
                        except Exception:
                            continue
                        c = str(p.get('CONFIDENCE', 'n')).lower()[:1]
                        pts.append({'la': la, 'lo': lo, 't': ts, 'sat': satnaam, 'conf': c if c in 'hnl' else 'n',
                                    'frp': float(p.get('FRP') or 0)})
    if ok == 0:
        return None
    # dubbele metingen (zelfde punt, zelfde tijd) weg
    seen, uniek = set(), []
    for p in pts:
        k = (round(p['la'], 4), round(p['lo'], 4), p['t'], p['sat'])
        if k not in seen:
            seen.add(k)
            uniek.append(p)
    return uniek


# ---------------- aardbevingen (USGS) ----------------

def bevingen(dagen=365):
    st = (datetime.now(timezone.utc) - timedelta(days=dagen)).strftime('%Y-%m-%d')
    url = ('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-10.5&maxlatitude=4.5'
           f'&minlongitude=122.5&maxlongitude=137.5&minmagnitude=2.5&orderby=time&starttime={st}')
    j = get_json(url, timeout=120)
    if not j:
        return None
    out = []
    for f in j.get('features', []):
        p, g = f['properties'], f['geometry']['coordinates']
        if p.get('mag') is None:
            continue
        out.append({'mag': float(p['mag']), 'lo': g[0], 'la': g[1], 'diepte': max(0.0, float(g[2] or 0)),
                    't': datetime.fromtimestamp(p['time'] / 1000, timezone.utc), 'plaats': p.get('place') or ''})
    return out


# ---------------- Open-Meteo (weer, lucht, zee) ----------------

def raster(dorpen, stap):
    """Groepeer dorpen op een raster. Geeft {cel: (lat, lon)} en {code: cel}."""
    cellen, per = {}, {}
    for d in dorpen:
        c = (round(d['la'] / stap) * stap, round(d['lo'] / stap) * stap)
        c = (round(c[0], 3), round(c[1], 3))
        cellen[c] = c
        per[d['code']] = c
    return cellen, per


def meteo(basis, cellen, params, batch=80):
    """Vraag Open-Meteo voor veel punten tegelijk. Geeft {cel: antwoord}."""
    keys = list(cellen)
    out = {}
    for i in range(0, len(keys), batch):
        part = keys[i:i + batch]
        q = dict(params)
        q['latitude'] = ','.join(str(k[0]) for k in part)
        q['longitude'] = ','.join(str(k[1]) for k in part)
        url = basis + '?' + urllib.parse.urlencode(q, safe=',')
        j = get_json(url, timeout=90)
        if j is None:
            continue
        if isinstance(j, dict):
            j = [j]
        for k, r in zip(part, j):
            if isinstance(r, dict) and not r.get('error'):
                out[k] = r
        time.sleep(1.0)
    return out or None


def weer(cellen):
    return meteo('https://api.open-meteo.com/v1/forecast', cellen, {
        'current': 'temperature_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m',
        'hourly': 'precipitation,weather_code,wind_speed_10m,wind_direction_10m',
        'daily': 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,sunrise,sunset',
        'timezone': 'Asia/Jayapura', 'forecast_days': 7,
    })


def lucht(cellen):
    return meteo('https://air-quality-api.open-meteo.com/v1/air-quality', cellen, {
        'hourly': 'pm2_5', 'timezone': 'Asia/Jayapura', 'past_days': 6, 'forecast_days': 2,
    })


def zee(cellen):
    return meteo('https://marine-api.open-meteo.com/v1/marine', cellen, {
        'hourly': 'wave_height', 'timezone': 'Asia/Jayapura', 'forecast_days': 2,
    })


# ---------------- nieuws van moza.nu ----------------

def nieuws(paginas=10):
    items, url = [], 'https://www.moza.nu/lezen?format=json'
    for _ in range(paginas):
        j = get_json(url, timeout=60)
        if not j:
            break
        for it in j.get('items', []):
            tekst = re.sub(r'<[^>]+>', ' ', (it.get('title') or '') + ' ' + (it.get('excerpt') or '') + ' ' + (it.get('body') or ''))
            items.append({'titel': it.get('title') or '', 'url': 'https://www.moza.nu' + (it.get('fullUrl') or ''),
                          't': datetime.fromtimestamp((it.get('publishOn') or 0) / 1000, timezone.utc),
                          'tekst': re.sub(r'\s+', ' ', tekst)})
        pg = j.get('pagination') or {}
        if not pg.get('nextPage'):
            break
        url = 'https://www.moza.nu' + pg['nextPageUrl'] + '&format=json'
    return items or None


# ---------------- cache (voor bronnen die niet elk uur hoeven) ----------------

def cached(naam, maxuur, fn):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f'{naam}.json'
    if f.exists() and (time.time() - f.stat().st_mtime) < maxuur * 3600:
        try:
            return _load(json.loads(f.read_text()))
        except Exception:
            pass
    v = fn()
    if v is not None:
        f.write_text(json.dumps(_dump(v)))
    elif f.exists():  # bron faalt: gebruik de oude gegevens als die er zijn
        try:
            return _load(json.loads(f.read_text()))
        except Exception:
            return None
    return v


def _dump(v):
    if isinstance(v, datetime):
        return {'__dt': v.isoformat()}
    if isinstance(v, dict):
        return {'__k' + json.dumps(list(k)) if isinstance(k, tuple) else k: _dump(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_dump(x) for x in v]
    return v


def _load(v):
    if isinstance(v, dict):
        if '__dt' in v:
            return datetime.fromisoformat(v['__dt'])
        return {tuple(json.loads(k[3:])) if k.startswith('__k') else k: _load(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_load(x) for x in v]
    return v
