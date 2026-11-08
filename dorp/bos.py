"""Berekent per dorp hoeveel bos er in 2000 was en hoeveel er per jaar verdween.

Bron: Hansen et al., Global Forest Change (Universiteit van Maryland), dezelfde data als Global Forest Watch.
Bos = boomkroon van minstens 30 procent in 2000 (de standaard van Global Forest Watch).
Schrijft dorp/gegevens/bos.json: {code: {bos2000: ha, verlies: ha, perjaar: {jaar: ha}}}.
Draait één keer per jaar (de data komt jaarlijks uit). Downloadt een paar honderd MB.
"""
import json, math, sys, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data as D  # noqa: E402

HIER = Path(__file__).resolve().parent
UIT = HIER / 'gegevens' / 'bos.json'
TMP = Path('/tmp/hansen')
VERSIES = ['GFC-2025-v1.13', 'GFC-2024-v1.12', 'GFC-2023-v1.11']
TEGELS = ['10N_120E', '10N_130E', '00N_120E', '00N_130E']
DREMPEL = 30


def url(v, laag, t):
    return f'https://storage.googleapis.com/earthenginepartners-hansen/{v}/Hansen_{v}_{laag}_{t}.tif'


def bestaat(u):
    try:
        req = urllib.request.Request(u, method='HEAD')
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200
    except Exception:
        return False


def download(u, f):
    if f.exists() and f.stat().st_size > 1000:
        return
    print('download', u)
    with urllib.request.urlopen(u, timeout=600) as r, open(f, 'wb') as o:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            o.write(b)


def main():
    import numpy as np
    import rasterio
    from rasterio.features import geometry_mask
    from rasterio.windows import from_bounds
    import bouw as B

    versie = next((v for v in VERSIES if bestaat(url(v, 'lossyear', TEGELS[0]))), None)
    if not versie:
        print('geen Hansen-versie gevonden')
        return 1
    print('versie', versie)
    TMP.mkdir(exist_ok=True)
    bestanden = {}
    for t in TEGELS:
        for laag in ('treecover2000', 'lossyear'):
            f = TMP / f'{laag}_{t}.tif'
            download(url(versie, laag, t), f)
            bestanden[(laag, t)] = f

    rows, _ = D.dorpen()
    uit = {}
    open_ = {k: rasterio.open(v) for k, v in bestanden.items()}
    for n, d in enumerate(rows):
        g = B.poly_deg(d['grens'])
        if g is None:
            continue
        minx, miny, maxx, maxy = g.bounds
        bos_px = 0.0
        per = {}
        for t in TEGELS:
            tc, ly = open_[('treecover2000', t)], open_[('lossyear', t)]
            b = tc.bounds
            if maxx < b.left or minx > b.right or maxy < b.bottom or miny > b.top:
                continue
            w = from_bounds(max(minx, b.left), max(miny, b.bottom), min(maxx, b.right), min(maxy, b.top), tc.transform)
            w = w.round_offsets().round_lengths()
            if w.width <= 0 or w.height <= 0:
                continue
            a = tc.read(1, window=w)
            l = ly.read(1, window=w)
            tr = tc.window_transform(w)
            m = geometry_mask([g.__geo_interface__], out_shape=a.shape, transform=tr, invert=True)
            bos = m & (a >= DREMPEL)
            # oppervlakte per pixel in ha, afhankelijk van de breedtegraad
            rij_lat = np.array([tr[5] + tr[4] * (i + 0.5) for i in range(a.shape[0])])
            px_ha = (abs(tr[0]) * 111320 * np.cos(np.radians(rij_lat))) * (abs(tr[4]) * 110574) / 10000
            opp = np.repeat(px_ha[:, None], a.shape[1], axis=1)
            bos_px += float((opp * bos).sum())
            for j in range(1, 30):
                s = float((opp * (bos & (l == j))).sum())
                if s > 0:
                    per[str(2000 + j)] = per.get(str(2000 + j), 0) + s
        if bos_px > 0:
            uit[d['code']] = {'bos2000': round(bos_px, 1), 'verlies': round(sum(per.values()), 1),
                              'perjaar': {k: round(v, 1) for k, v in sorted(per.items())}}
        if n % 200 == 0:
            print(n, d['naam'], uit.get(d['code']))
    UIT.parent.mkdir(parents=True, exist_ok=True)
    UIT.write_text(json.dumps({'_versie': versie, **uit}, separators=(',', ':')))
    print('klaar:', len(uit), 'dorpen met bos')
    return 0


if __name__ == '__main__':
    sys.exit(main())
