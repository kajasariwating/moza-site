"""Deelbeelden (og:image) voor live.moza.nu in de stijl van de Kabar-omslag.

Elke pagina krijgt een eigen beeld van 1200 bij 630:
- startpagina: "Bijvoorbeeld Ullath of Seram" grijs in het zoekveld
- eilandgroep: de naam van de groep in het zoekveld
- dorp: "Dorp of Eiland" in het zoekveld, bijvoorbeeld "Ema of Ambon"

De beelden hangen niet af van live gegevens. Ze worden bewaard in de cache
(dorp/.cache/og/<versie>/) en alleen opnieuw gemaakt als dit script of de
lettertypen veranderen.
"""
import hashlib
import shutil
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HIER = Path(__file__).resolve().parent
FONTS = HIER / 'static' / 'fonts'
W, H = 1200, 630
BLAUW, GEEL, ROZE, ZWART, WIT, GRIJS = '#1F3BD1', '#E9F25A', '#FF7AB6', '#111111', '#FFFFFF', '#8F8F8F'

# Eilandnamen per eilandgroep: trefwoord in de kecamatan van de meeste dorpen op dat eiland -> eiland.
# Geen treffer: het grote eiland van de groep, anders de naam van de groep.
REGELS = {
    'ambon': [],
    'lease': [('haruku', 'Haruku'), ('saparua', 'Saparua'), ('nusa laut', 'Nusalaut'), ('nusalaut', 'Nusalaut')],
    'seram': [('gorom', 'Gorom'), ('manipa', 'Manipa'), ('teor', 'Teor'), ('panjang', 'Panjang'), ('wakate', 'Gorom')],
    'buru': [('ambalau', 'Ambalau')],
    'banda': [],
    'zuidoost': [('kei besar', 'Kei Besar'), ('kei kecil', 'Kei Kecil'), ('hoat sorbay', 'Kei Kecil'), ('manyeuw', 'Kei Kecil'),
                 ('dullah', 'Dullah'), ('tayando', 'Tayando'), ('kur', 'Kur'), ('aru', 'Aru'), ('selaru', 'Selaru'),
                 ('fordata', 'Fordata'), ('molu maru', 'Molu Maru'), ('tanimbar', 'Tanimbar'), ('kormomolin', 'Tanimbar'),
                 ('wertamrian', 'Tanimbar'), ('wermaktian', 'Tanimbar'), ('nirunmas', 'Tanimbar'), ('wuar labobar', 'Tanimbar'),
                 ('yaru', 'Tanimbar')],
    'zuidwest': [('wetar', 'Wetar'), ('wetang', 'Wetang'), ('kisar', 'Kisar'), ('lakor', 'Lakor'), ('leti', 'Leti'), ('moa', 'Moa'),
                 ('babar', 'Babar'), ('dawelor', 'Babar'), ('damer', 'Damer'), ('masela', 'Masela'), ('luang', 'Luang'),
                 ('sermata', 'Sermata'), ('roma', 'Romang')],
    'noord': [('ternate', 'Ternate'), ('hiri', 'Hiri'), ('tidore', 'Tidore'), ('moti', 'Moti'), ('makian', 'Makian'),
              ('kayoa', 'Kayoa'), ('kasiruta', 'Kasiruta'), ('mandioli', 'Mandioli'), ('bacan', 'Bacan'), ('obi', 'Obi'),
              ('morotai', 'Morotai'), ('rao', 'Rao'), ('gebe', 'Gebe'), ('taliabu', 'Taliabu'), ('mangoli', 'Mangoli'),
              ('sanana', 'Sulabesi'), ('sulabesi', 'Sulabesi'), ('batang dua', 'Batang Dua'), ('joronga', 'Joronga'),
              ('botanglomang', 'Botanglomang'), ('loloda kepulauan', 'Loloda')],
}
GROOT = {'ambon': 'Ambon', 'seram': 'Seram', 'buru': 'Buru', 'banda': 'Banda', 'noord': 'Halmahera'}


def eilandnamen(rows, eiland_van, groepen):
    """{code: eilandnaam} voor alle dorpen. eiland_van(d) geeft het eiland (een vorm) of None."""
    per = defaultdict(list)
    van = {}
    for d in rows:
        g = eiland_van(d)
        if g is not None:
            per[id(g)].append(d)
            van[d['code']] = id(g)
    grootste = {}
    for k, ds in per.items():  # het grootste eiland van een groep krijgt de naam uit GROOT
        grp = Counter(x['groep'] for x in ds).most_common(1)[0][0]
        if grp not in grootste or len(ds) > len(per[grootste[grp]]):
            grootste[grp] = k
    naam_eiland = {}
    for k, ds in per.items():
        grp = Counter(x['groep'] for x in ds).most_common(1)[0][0]
        kec = Counter(x['kec'] for x in ds).most_common(1)[0][0].lower()
        n = next((nm for w, nm in REGELS.get(grp, []) if w in kec), None)
        if not n and grootste.get(grp) == k:
            n = GROOT.get(grp)
        naam_eiland[k] = n
    uit = {}
    for d in rows:
        n = naam_eiland.get(van.get(d['code']))
        if not n:
            n = GROOT.get(d['groep']) if d['groep'] in ('ambon', 'seram', 'buru', 'banda') else groepen.get(d['groep'], '')
        if n.lower() == d['naam'].lower():
            n = groepen.get(d['groep'], n)
            if n.lower() == d['naam'].lower():
                n = ''
        uit[d['code']] = n
    return uit


def _font(naam, px):
    return ImageFont.truetype(str(FONTS / naam), px)


def _spaced(dr, xy, tekst, font, fill, ruimte):
    x, y = xy
    for c in tekst:
        dr.text((x, y), c, font=font, fill=fill)
        x += dr.textlength(c, font=font) + ruimte


def beeld(zoektekst, grijs=False):
    """Een deelbeeld als PIL-image."""
    im = Image.new('RGB', (W, H), BLAUW)
    dr = ImageDraw.Draw(im)
    L = 90
    _spaced(dr, (L, 92), 'KABAR MALUKU LIVE · POWERED BY MOZA', _font('HankenGrotesk-ExtraBold.ttf', 21), WIT, 3.2)
    kop = _font('HankenGrotesk-Black.ttf', 80)
    dr.text((L - 3, 128), 'Wat speelt er bij jouw', font=kop, fill=GEEL)
    dr.text((L - 3, 206), 'dorp?', font=kop, fill=GEEL)
    dr.text((L, 300), 'brand, beving, lucht en weer', font=_font('Fraunces-SemiBoldItalic.ttf', 36), fill=ROZE)
    bx, by, bw, bh = L, 368, 980, 74
    dr.rectangle([bx + 10, by + 10, bx + bw + 10, by + bh + 10], fill=GEEL)
    dr.rectangle([bx, by, bx + bw, by + bh], fill=ZWART)
    dr.rectangle([bx + 5, by + 5, bx + bw - 5, by + bh - 5], fill=WIT)
    # vergrootglas
    cx, cy, r = bx + 44, by + 33, 12
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ZWART, width=5)
    dr.line([cx + 8, cy + 8, cx + 20, cy + 20], fill=ZWART, width=6)
    # tekst in het zoekveld, kleiner als hij te lang is
    tx, maxw = bx + 84, bw - 84 - 30
    px = 32
    while px > 18:
        f = _font('HankenGrotesk-Medium.ttf' if grijs else 'HankenGrotesk-ExtraBold.ttf', px)
        if dr.textlength(zoektekst, font=f) <= maxw:
            break
        px -= 1
    dr.text((tx, by + bh / 2), zoektekst, font=f, fill=GRIJS if grijs else ZWART, anchor='lm')
    if not grijs:  # cursor achter de tekst
        cxp = tx + dr.textlength(zoektekst, font=f) + 6
        dr.rectangle([cxp, by + 18, cxp + 3, by + bh - 18], fill=BLAUW)
    sy = 500
    dr.rectangle([120, sy, 1040, sy + 12], fill=GEEL)
    dr.rectangle([1040, sy, W, sy + 12], fill=ROZE)
    _spaced(dr, (L, 552), 'live.moza.nu', _font('HankenGrotesk-ExtraBold.ttf', 26), WIT, 0.5)
    return im


def versie():
    h = hashlib.md5(Path(__file__).read_bytes())
    for f in sorted(FONTS.glob('*.ttf')):
        h.update(f.read_bytes())
    return h.hexdigest()[:10]


def opslaan(im, pad):
    pad.parent.mkdir(parents=True, exist_ok=True)
    im.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(pad, optimize=True)


def maak(uit, cache, rows, eilanden, groepen, alleen=None):
    """Zet /og.png, /og/eiland-<groep>.png en /og/<slug>.png in uit. Geeft {pad-op-site: alt-tekst}."""
    v = versie()
    c = Path(cache) / 'og' / v
    if c.parent.exists():  # oude versies opruimen
        for oud in c.parent.iterdir():
            if oud.name != v:
                shutil.rmtree(oud, ignore_errors=True)
    klus = [('og.png', 'Bijvoorbeeld Ullath of Seram', True)]
    klus += [(f'og/eiland-{g}.png', n, False) for g, n in groepen.items()]
    for d in rows:
        if alleen and d['slug'] not in alleen:
            continue
        e = eilanden.get(d['code']) or ''
        klus.append((f'og/{d["slug"]}.png', f'{d["naam"]} of {e}' if e else d['naam'], False))
    nieuw = 0
    for rel, tekst, grijs in klus:
        bron = c / rel
        if not bron.exists():
            opslaan(beeld(tekst, grijs), bron)
            nieuw += 1
        doel = Path(uit) / rel
        doel.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(bron, doel)
    print(f'deelbeelden: {len(klus)} ({nieuw} nieuw gemaakt)')


if __name__ == '__main__':  # proef: python3 dorp/og.py "Ema of Ambon" /tmp/ema.png
    import sys
    t = sys.argv[1] if len(sys.argv) > 1 else 'Ema of Ambon'
    opslaan(beeld(t, grijs=t.startswith('Bijvoorbeeld')), Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/og-proef.png'))
