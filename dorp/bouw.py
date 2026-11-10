"""Bouwt live.moza.nu: een pagina per dorp, per eilandgroep, een zoekpagina en een sitemap.

Gebruik:  python3 dorp/bouw.py [--uit _site] [--alleen slug,slug] [--zonder-live]
"""
import argparse, html, json, math, re, shutil, sys
from urllib.parse import quote
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data as D  # noqa: E402
import taal as T  # noqa: E402
from shapely.geometry import Polygon, MultiPolygon, Point, box  # noqa: E402
from shapely.strtree import STRtree  # noqa: E402
from shapely.ops import unary_union  # noqa: E402

SITE = 'https://live.moza.nu'
HIER = Path(__file__).resolve().parent
WIT, NL = T.WIT, ZoneInfo('Europe/Amsterdam')


def tijd_nl(t, nu, waar='in het dorp', hoofd=True):
    """Tijd in Nederland voorop, met de tijd in de Molukken tussen haakjes."""
    tn, nn = t.astimezone(NL), nu.astimezone(NL)
    w = T.wanneer(tn, nn)
    if hoofd:
        w = w[0].upper() + w[1:]
    return f'{w} om {tn:%H:%M} ({t.astimezone(WIT):%H:%M} {waar})'
e = html.escape

# ---------------------------------------------------------------- geometrie

KM_LAT = 110.57


def km_xy(la, lo, la0, lo0):
    return ((lo - lo0) * 111.32 * math.cos(math.radians(la0)), (la - la0) * KM_LAT)


def poly_km(rings, la0, lo0):
    ps = []
    for r in rings:
        if len(r) >= 3:
            p = Polygon([km_xy(a, b, la0, lo0) for a, b in r])
            if not p.is_valid:
                p = p.buffer(0)
            if not p.is_empty:
                ps.append(p)
    if not ps:
        return None
    return unary_union(ps)


def poly_deg(rings):
    ps = []
    for r in rings or []:
        if len(r) >= 3:
            p = Polygon([(b, a) for a, b in r])
            if not p.is_valid:
                p = p.buffer(0)
            if not p.is_empty:
                ps.append(p)
    return unary_union(ps) if ps else None


# ---------------------------------------------------------------- per dorp: brand

def branden_bij(d, geo, punten, nu):
    """Branden binnen de grens of tot 5 km erbuiten, afgelopen 7 dagen."""
    if not punten:
        return []
    la0, lo0 = d['la'], d['lo']
    gk = poly_km(d['grens'], la0, lo0) if d['grens'] else Point(0, 0).buffer(1.0)
    uit = []
    for p in punten:
        if (nu - p['t']).total_seconds() > 7 * 86400:
            continue
        x, y = km_xy(p['la'], p['lo'], la0, lo0)
        pt = Point(x, y)
        dist = gk.distance(pt)
        if dist > 5 or math.hypot(x, y) > 40:  # niet: losse stukjes grond heel ver weg
            continue
        uit.append(dict(p, binnen=dist == 0, rand=dist, km=math.hypot(x, y),
                        richting=T.richting(la0, lo0, p['la'], p['lo'])))
    # tel hoe vaak dezelfde plek binnen 12 uur gezien is (andere satelliet of overkomst)
    for p in uit:
        p['keer'] = sum(1 for q in uit if abs((q['t'] - p['t']).total_seconds()) < 12 * 3600
                        and T.km_tussen(p['la'], p['lo'], q['la'], q['lo']) < 1.0)
    # voeg punten samen die binnen 1 km en 12 uur van elkaar liggen (een brand, meerdere metingen)
    uit.sort(key=lambda p: p['t'], reverse=True)
    groepen = []
    for p in uit:
        for g in groepen:
            if T.km_tussen(p['la'], p['lo'], g['la'], g['lo']) < 1.0 and abs((g['t'] - p['t']).total_seconds()) < 12 * 3600:
                g['keer'] = max(g['keer'], p['keer'])
                if p['conf'] == 'h':
                    g['conf'] = 'h'
                g['binnen'] = g['binnen'] or p['binnen']
                break
        else:
            groepen.append(dict(p))
    groepen.sort(key=lambda p: (not p['binnen'], -p['t'].timestamp()))
    return groepen


# ---------------------------------------------------------------- per dorp: bevingen

def bevingen_bij(d, lijst, nu):
    if lijst is None:
        return None
    gevoeld, klein = [], 0
    for q in lijst:
        km = T.km_tussen(d['la'], d['lo'], q['la'], q['lo'])
        if km > 600:
            continue
        i = min(T.mmi(q['mag'], km, q['diepte']), q.get('mmimax') or 99)
        if i >= T.VOELBAAR:
            gevoeld.append(dict(q, km=km, mmi=i))
        elif km < 150:
            klein += 1
    gevoeld.sort(key=lambda q: q['t'], reverse=True)
    return {'gevoeld': gevoeld, 'klein': klein, 'perjaar': len(gevoeld)}


# ---------------------------------------------------------------- per dorp: weer, lucht, zee

def uren(r, veld):
    h = r.get('hourly') or {}
    tijden = h.get('time') or []
    waarden = h.get(veld) or []
    return [(datetime.fromisoformat(t).replace(tzinfo=WIT), v) for t, v in zip(tijden, waarden)]


def weer_bij(r, nu):
    if not r:
        return None
    cur = r.get('current') or {}
    dag = r.get('daily') or {}
    regen = uren(r, 'precipitation')
    nu_regen = (cur.get('precipitation') or 0) >= 0.2
    vooruit = [(t, v) for t, v in regen if nu <= t + timedelta(hours=1) <= nu + timedelta(hours=12)]
    if nu_regen:
        eind = next((t for t, v in vooruit if (v or 0) < 0.2 and t > nu), None)
        regenzin = f'Regen tot ongeveer {eind.hour}:00' if eind else 'Regen de komende uren'
    else:
        start = next((t for t, v in vooruit if (v or 0) >= 0.3), None)
        regenzin = f'Regen vanaf ongeveer {start.hour}:00' if start else 'Droog de komende uren'
    dagen = []
    op = dag.get('sunrise') or []
    onder = dag.get('sunset') or []
    for i, (t, tmax, code) in enumerate(zip(dag.get('time') or [], dag.get('temperature_2m_max') or [], dag.get('weather_code') or [])):
        x = {'t': datetime.fromisoformat(t).replace(tzinfo=WIT), 'tmax': tmax, 'code': code,
             'tmin': (dag.get('temperature_2m_min') or [None] * 9)[i],
             'kans': (dag.get('precipitation_probability_max') or [None] * 9)[i]}
        if i < len(op) and op[i] and i < len(onder) and onder[i]:
            x['op'] = datetime.fromisoformat(op[i]).replace(tzinfo=WIT)
            x['onder'] = datetime.fromisoformat(onder[i]).replace(tzinfo=WIT)
        dagen.append(x)
    wind = uren(r, 'wind_speed_10m')
    wrichting = cur.get('wind_direction_10m')
    return {'temp': cur.get('temperature_2m'), 'code': cur.get('weather_code'), 'regenzin': regenzin,
            'dagen': dagen, 'wind': wind, 'wrichting': wrichting, 'wsnel': cur.get('wind_speed_10m')}


def lucht_bij(r, nu):
    if not r:
        return None
    per = {}
    for t, v in uren(r, 'pm2_5'):
        if v is None:
            continue
        per.setdefault(t.date(), []).append(v)
    dagen = []
    for dt in sorted(per):
        vs = per[dt]
        if len(vs) < 6:
            continue
        dagen.append({'d': dt, 'pm': sum(vs) / len(vs)})
    if not dagen:
        return None
    vandaag = next((x for x in dagen if x['d'] == nu.date()), None)
    return {'dagen': dagen, 'vandaag': vandaag}


def zee_bij(rz, rw, nu):
    if not rz or not rw:
        return None
    golf = uren(rz, 'wave_height')
    if not any(v is not None for _, v in golf):
        return None
    wind = rw['wind'] if rw else []
    morgen = (nu + timedelta(days=1)).date()
    delen = []
    for naam, a, b in (('Ochtend', 6, 12), ('Middag', 12, 18), ('Avond', 18, 22)):
        g = [v for t, v in golf if t.date() == morgen and a <= t.hour < b and v is not None]
        w = [v for t, v in wind if t.date() == morgen and a <= t.hour < b and v is not None]
        if not g:
            return None
        delen.append({'naam': naam, 'golf': max(g), 'wind': max(w) if w else None})
    return {'delen': delen}


# ---------------------------------------------------------------- nieuws

def nieuws_bij(d, items):
    if not items:
        return []
    import re
    namen = {d['naam'], d['officieel']}
    pats = [re.compile(r'(?<![\w-])' + re.escape(n) + r'(?![\w-])', re.I) for n in namen if len(n) >= 3]
    uit = [it for it in items if any(p.search(it['tekst']) for p in pats)]
    uit.sort(key=lambda x: x['t'], reverse=True)
    return uit[:2]



# ---------------------------------------------------------------- ligt het dorp aan zee?

_LAND = {}


def land(kust_alle):
    """Alle eilanden als één geheel, zodat grenzen tussen kabupaten niet als kust tellen."""
    if 'eilanden' not in _LAND:
        ps = []
        for polys in kust_alle.values():
            for poly in polys:
                if poly and len(poly[0]) >= 3:
                    try:
                        p = Polygon([(b, a) for a, b in poly[0]])
                        p = p if p.is_valid else p.buffer(0)
                        if not p.is_empty:
                            ps.append(p)
                    except Exception:
                        pass
        u = unary_union(ps).buffer(0.003).buffer(-0.003)
        eil = list(u.geoms) if hasattr(u, 'geoms') else [u]
        _LAND['eilanden'] = (eil, STRtree(eil))
    return _LAND['eilanden']


def eiland_van(d, kust_alle):
    """Het eiland waar het dorp op ligt (of het dichtstbijzijnde binnen 2 km)."""
    eil, boom = land(kust_alle)
    pt = Point(d['lo'], d['la'])
    kand = [eil[i] for i in boom.query(pt.buffer(0.02))]
    if not kand:
        return None
    best = min(kand, key=lambda g: g.distance(pt))
    return best if best.distance(pt) < 0.02 else None


def aan_kust(d, kust_alle, geo):
    """Dorp ligt aan zee als de huizen binnen 1,5 km van de kust staan
    (of, zonder plek van de huizen, als de grond van het dorp tot aan zee loopt)."""
    eil, boom = land(kust_alle)
    km = 1 / 111.0
    pt = Point(d['lo'], d['la'])
    h = d.get('hoogte')
    if h is not None and h > 60:  # dorp in de bergen
        return False
    if d.get('echt') or geo is None:
        bevat = [eil[i] for i in boom.query(pt) if eil[i].contains(pt)]
        if not bevat:
            return True
        return bevat[0].exterior.distance(pt) <= 1.5 * km
    rond = [eil[i] for i in boom.query(geo) if eil[i].intersects(geo)]
    if not rond:
        return True
    return any(geo.distance(p.exterior) <= 0.3 * km for p in rond)


# ---------------------------------------------------------------- kaart (svg)

def kaart_svg(d, geo, buren, kust, brandpunten, wrichting):
    la0, lo0 = d['la'], d['lo']
    g = poly_km(d['grens'], la0, lo0) if d['grens'] else Point(0, 0).buffer(0.8)
    minx, miny, maxx, maxy = g.buffer(2.5).bounds
    for p in brandpunten:
        x, y = km_xy(p['la'], p['lo'], la0, lo0)
        minx, miny, maxx, maxy = min(minx, x - 1), min(miny, y - 1), max(maxx, x + 1), max(maxy, y + 1)
    W, H = 360, 250
    w, h = maxx - minx, maxy - miny
    if w / h < W / H:
        extra = (h * W / H - w) / 2
        minx, maxx = minx - extra, maxx + extra
    else:
        extra = (w * H / W - h) / 2
        miny, maxy = miny - extra, maxy + extra
    s = W / (maxx - minx)
    vak = box(minx, miny, maxx, maxy)
    tol = 0.8 / s

    def pad(geom):
        geom = geom.intersection(vak).simplify(tol)
        if geom.is_empty:
            return ''
        polys = [geom] if isinstance(geom, Polygon) else [x for x in getattr(geom, 'geoms', []) if isinstance(x, Polygon)]
        out = []
        for p in polys:
            for ring in [p.exterior] + list(p.interiors):
                cs = list(ring.coords)
                if len(cs) < 3:
                    continue
                out.append('M' + 'L'.join(f'{(x - minx) * s:.1f} {(maxy - y) * s:.1f}' for x, y in cs) + 'Z')
        return ''.join(out)

    land = ''
    for poly in kust:
        if not poly or len(poly[0]) < 3:
            continue
        try:
            pk = Polygon([km_xy(a, b, la0, lo0) for a, b in poly[0]],
                         [[km_xy(a, b, la0, lo0) for a, b in r] for r in poly[1:] if len(r) >= 3])
            if not pk.is_valid:
                pk = pk.buffer(0)
        except Exception:
            continue
        if pk.intersects(vak):
            land += pad(pk)
    buurlijn = ''
    for b in buren:
        pk = poly_km(b['grens'], la0, lo0)
        if pk is not None and pk.intersects(vak):
            buurlijn += pad(pk)
    eigen = pad(g)
    stukken = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Kaart van de grond van {e(d["naam"])} met plekken waar brand is gezien">',
               f'<rect width="{W}" height="{H}" fill="var(--zee)"/>']
    if land:
        stukken.append(f'<path d="{land}" fill="var(--land)" fill-rule="evenodd"/>')
    if buurlijn:
        stukken.append(f'<path d="{buurlijn}" fill="none" stroke="var(--mut)" stroke-width="1" stroke-opacity=".6"/>')
    stukken.append(f'<path d="{eigen}" fill="#1F3BD1" fill-opacity=".16" stroke="#1F3BD1" stroke-width="3" fill-rule="evenodd"/>')
    x0, y0 = (0 - minx) * s, (maxy - 0) * s
    stukken.append(f'<rect x="{x0 - 6:.1f}" y="{y0 - 6:.1f}" width="12" height="12" fill="#111" stroke="#fff" stroke-width="1.5"/>')
    stukken.append(f'<text x="{x0 + 10:.1f}" y="{y0 + 4:.1f}" font-size="12" font-weight="800" fill="var(--inkt)" paint-order="stroke" stroke="var(--land)" stroke-width="3">{e(d["naam"])}</text>')
    for i, p in reversed(list(enumerate(brandpunten[:9], 1))):
        x, y = km_xy(p['la'], p['lo'], la0, lo0)
        px, py = (x - minx) * s, (maxy - y) * s
        kleur = '#FF4D2E' if i == 1 else '#FF7AB6'
        stukken.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{9 if i == 1 else 7}" fill="{kleur}" stroke="#111" stroke-width="2"/>')
        stukken.append(f'<text x="{px:.1f}" y="{py + 4:.1f}" font-size="10" font-weight="900" text-anchor="middle" fill="#111">{i}</text>')
    if wrichting is not None:
        naar = (wrichting + 180) % 360
        stukken.append(f'<g transform="translate({W - 30} {H - 34})"><circle r="20" fill="var(--papier)" stroke="var(--rand)" stroke-width="2"/>'
                       f'<g transform="rotate({naar:.0f})"><path d="M0 12V-11M-6 -4L0 -11L6 -4" fill="none" stroke="#1F3BD1" stroke-width="3"/></g></g>'
                       f'<text x="{W - 30}" y="{H - 4}" font-size="11" font-weight="800" text-anchor="middle" fill="var(--inkt)">Wind</text>')
    stukken.append('</svg>')
    return ''.join(stukken)


# ---------------------------------------------------------------- html-stukken

ICON_ZOEK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'

PLAUSIBLE = ('<script>(function(){if(!/(^|\\.)moza\\.nu$/.test(location.hostname))return;'
             'if(/(?:^|; )mz_noc=1/.test(document.cookie))return;try{if(localStorage.getItem("plausible_ignore")==="true")return}catch(e){}'
             'var s=document.createElement("script");s.defer=true;s.setAttribute("data-domain","moza.nu");'
             's.src="https://plausible.io/js/script.js";document.head.appendChild(s)})();</script>')


# ---------------------------------------------------------------- menubalk onderin, delen en Meer (zoals op moza.nu)

_IC = {
    'home': '<path d="M3 11l9-7 9 7v10h-6v-6H9v6H3z"/>',
    'agenda': '<rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    'kaart': '<path d="M9 4L3 7v13l6-3 6 3 6-3V4l-6 3zM9 4v13M15 7v13"/>',
    'meer': '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'deel': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    'wa': '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 19z"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
}


def ic(n, w='2.2'):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_IC[n]}</svg>'


MZ = 'https://www.moza.nu'
UTM = 'utm_source=kabar&utm_medium=balk'
MEER_LINKS = [('/lezen', 'Lezen', 'Nieuws en verhalen'), ('/weten', 'Kennisbank', 'Uitleg van MOZA'),
              ('/onderzoek', 'Onderzoek', 'Studies van anderen'), ('/organisaties', 'Organisaties', 'Zoek een organisatie'),
              ('/jaartallen', 'Jaartallen', 'Molukse geschiedenis tot nu'), ('/podium', 'Podium', 'Deel jouw verhaal'),
              ('/uploaden', 'Insturen', 'Tip de redactie'), ('/boekenplank', 'Boekenplank', 'Boekentips'),
              ('/store', 'Toko Buku', 'Boeken en prints')]


def onder_html(deel):
    t, x = deel
    balk = (f'<nav id="mz-onder" aria-label="Menu van MOZA">'
            f'<a href="{MZ}/?{UTM}">{ic("home")}Voorpagina</a>'
            f'<a href="{MZ}/evenementen?{UTM}"><span class="ag">{ic("agenda")}</span>Agenda</a>'
            f'<button type="button" class="deel" data-deel aria-label="Deel deze pagina"><span class="dl">{ic("deel")}</span>Deel</button>'
            f'<a href="{MZ}/kaarten?{UTM}">{ic("kaart")}<span class="ld" aria-hidden="true"></span>Kaarten</a>'
            f'<button type="button" data-meer aria-label="Meer: menu van MOZA" aria-expanded="false" aria-controls="mzk-meer">{ic("meer")}Meer</button></nav>')
    sluit = f'<button type="button" class="x" data-x aria-label="Sluiten">{ic("x", "2.4")}</button>'
    deelvel = (f'<div id="mzk-deel" class="vel"><div class="dk" data-x></div><section role="dialog" aria-modal="true" aria-labelledby="mzk-deel-h">'
               f'<div class="vkop"><h2 id="mzk-deel-h">Deel deze pagina</h2>{sluit}</div>'
               f'<span class="lbl">Dit bericht staat al klaar</span><div class="msg"></div>'
               f'<a class="wa" target="_blank" rel="noopener">{ic("wa")}Stuur via WhatsApp</a>'
               f'<div class="twee"><a class="fb" target="_blank" rel="noopener">Facebook</a><button type="button" class="kp">Kopieer link</button></div>'
               f'<button type="button" class="ander">Andere app kiezen</button></section></div>')
    def u(pad):
        return f'{MZ}{pad}?{UTM}'
    rijen = ''.join(f'<a href="{u(pad)}"><b>{n}</b><span>{o}</span></a>' for pad, n, o in MEER_LINKS)
    meervel = ('<div id="mzk-meer" aria-label="Menu" hidden><div class="mz-mm">'
               '<a class="mm-kabar" href="/"><span class="kb-mini" aria-hidden="true">KABAR<small><span>M</span><span>A</span><span>L</span><span>U</span><span>K</span><span>U</span></small></span><span class="kt"><b>Kabar Maluku</b><span>Check jouw dorp →</span></span></a>'
               f'<nav class="mm-main" aria-label="Menu">{rijen}</nav>'
               f'<a class="mm-acct" href="{u("/account")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg><b>Mijn MOZA</b><span>Inloggen en bestellingen</span></a>'
               f'<button type="button" class="mm-lees" onclick="mzGroot()">{_AA}<span><b>Leeshulp</b><small>Grotere letters aan of uit</small></span></button>'
               f'<div class="mm-don"><p>Onze verhalen zijn gratis te lezen. Dat kan dankzij donaties.</p><a class="mm-btn" href="{u("/doneer")}">Doneer</a></div>'
               f'<div class="mm-over"><span class="mm-l">Over MOZA</span><p>Informatie over Molukkers in Nederland, voor en door Molukkers.</p><div class="mm-links"><a href="{u("/over-moza")}">Over MOZA</a><a href="{u("/team")}">Team</a><a href="{u("/verantwoording")}">Verantwoording</a></div></div>'
               '<a class="mm-wa" href="https://whatsapp.com/channel/0029VaA4StPIt5rs5FadnH1d" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="#1f8f4e" stroke-width="1.9" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"></path></svg><span><b>Volg MOZA op WhatsApp.</b> Het laatste Molukse nieuws op je telefoon.</span></a>'
               f'<a class="mm-beeld" href="{u("/beeldbank")}"><b>Beeldbank</b><span>Foto’s van Molukkers in Nederland door de jaren heen</span></a>'
               '</div></div>')
    data = json.dumps({'t': t, 'e': x}, ensure_ascii=False).replace('</', '<\\/')
    return balk + deelvel + meervel + f'<script>window.MZK_DEEL={data}</script><script src="/onder.js?v={VERSIE}" defer></script><script src="/kop.js?v={VERSIE}" defer></script>'


DEEL_STANDAARD = ('Kabar Maluku Live', 'Check wat er speelt in jouw dorp in de Molukken: brand, weer, zee en aardbevingen. Ieder uur bijgewerkt.')


_AA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19 8 5l5 14M4.8 14h6.4"/><path d="M15 19l3.5-9 3.5 9M16 16.5h5"/></svg>'
_MAAN = '<svg class="maan-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
_ZON = '<svg class="zon-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>'
_TAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
_U = 'utm_source=kabar&utm_medium=kop'
MOZAKOP = ('<div class="mzkop"><a class="mzkb" href="/" aria-label="Kabar Maluku Live, naar de startpagina"><span class="kb">KABAR<small aria-hidden="true"><span>M</span><span>A</span><span>L</span><span>U</span><span>K</span><span>U</span></small><i></i></span></a>'
           '<a class="mzlogo" href="https://www.moza.nu/?' + _U + '" aria-label="MOZA, naar de voorpagina">MOZA</a>'
           '<nav class="mznav" aria-label="Menu van MOZA">' + ''.join(
               f'<a href="https://www.moza.nu{u}?{_U}">{n}</a>' for u, n in
               [('/lezen', 'Lezen'), ('/weten', 'Kennis'), ('/podium', 'Podium'), ('/evenementen', 'Agenda'), ('/boekenplank', 'Boekenplank'), ('/store', 'Toko Buku')]) + '</nav>'
           '<span class="mzik"><button type="button" class="mzib" aria-label="Grotere letters aan of uit" onclick="mzGroot()">' + _AA + '</button>'
           '<button type="button" class="mzib" aria-label="Nachtmodus aan of uit" onclick="mzThema()">' + _MAAN + _ZON + '</button>'
           '<a class="mztas" href="https://www.moza.nu/cart?' + _U + '" aria-label="Winkelmandje op moza.nu">' + _TAS + '</a></span>'
           '<a class="mzdon" href="https://www.moza.nu/doneer?' + _U + '">Doneer</a></div>')

# ---------- Kop op de computer: Kabar-logo met de tegels Delen, Ander dorp en Homepage MOZA ----------
_ZU = 'utm_source=kabar&utm_medium=kop'
MZD = ''


def _mz(pad):
    return f'{MZ}{pad}?{_ZU}'


def _sv(d, extra=''):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true"{extra}>{d}</svg>'


_IC_KAL = '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>'
_IC_KAART = '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'
_IC_KRANT = '<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 9h7M7 13h7"/>'
_IC_BOEK = '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>'
_IC_TAS = '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'
_IC_INFO = '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
_IC_AA = '<path d="M3 19 8 5l5 14M4.8 14h6.4"/><path d="M15 19l3.5-9 3.5 9M16 16.5h5"/>'
# Meer-menu zoals op moza.nu. Bij Kaarten staat geen Kabar-link, want je bent er al.
MEER_G = [
    ('Lezen', '/lezen', '#1F3BD1', '#1F3BD1', _IC_KRANT, [('Net binnen', '/lezen'), ('Nieuws uit Maluku', '/nieuws/maluku'), ('Van de redactie', '/lezen#categorie-van-de-redactie'), ('Erkenning', '/lezen#categorie-erkenning'), ('Molukse wijk', '/lezen#categorie-molukse-wijk'), ('Erfgoed', '/lezen#categorie-erfgoed'), ('Cultuur', '/lezen#categorie-cultuur')]),
    ('Rubrieken', '/lezen/tag/rubriek', '#111', '#E9F25A', _IC_KAL, [('Alle rubrieken', '/lezen/tag/rubriek'), ('Kabar Maluku Live', '/lezen/tag/Kabar+Maluku+Live'), ('Achter de foto', '/lezen/tag/Achter+de+foto'), ('Leeswijzer', '/lezen/tag/Leeswijzer'), ('Woord van de week', '/lezen/tag/Woord+van+de+week'), ('Dit weekend', '/lezen/tag/Dit+weekend'), ('Deze week toen', '/lezen/tag/Deze+week+toen'), ('Jullie zeiden', '/lezen/tag/Jullie+zeiden'), ('MOZA deze maand', '/lezen/tag/MOZA+deze+maand')]),
    ('Kennis', '/weten', '#D9468A', '#FF7AB6', _IC_BOEK, [('Kennisbank', '/weten'), ('Begrippenlijst', '/begrippen'), ('Sejarah Maluku', '/sejarah-maluku'), ('Jaartallen', '/jaartallen'), ('Onderzoek', '/onderzoek'), ('Organisaties', '/organisaties')]),
    ('Kaarten', '/kaarten', '#D7381A', '#FF4D2E', _IC_KAART, [('Bosbranden', '/kaarten/bosbranden'), ('Weer en zee', '/kaarten/weer-en-zee'), ('Aardbevingen', '/kaarten/aardbevingen'), ('Luchtkwaliteit', '/kaarten/luchtkwaliteit'), ('Bos en ontbossing', '/kaarten/bos-en-ontbossing'), ('Rampen', '/kaarten/rampen'), ('Zeewater', '/kaarten/zeewater'), ('Satellietbeeld', '/kaarten/satelliet'), ('Vulkanen', '/kaarten/vulkanen'), ('Regen', '/kaarten/regen'), ('Eb en vloed', '/kaarten/getij'), ('Koraalriffen', '/kaarten/koraal'), ('Forten en specerijen', '/kaarten/forten'), ('Talen van de Molukken', '/kaarten/talen'), ('Overtochten 1951', '/kaarten/overtochten-1951'), ('Vluchten', '/kaarten/vluchten'), ('Molukse wijken', '/kaarten/molukse-wijken'), ('Grafstatus', '/kaarten/grafstatus')]),
    ('Agenda', '/evenementen', '#D7381A', '#FF4D2E', _IC_KAL, [('Alle evenementen', '/evenementen'), ('Evenement aanmelden', '/uploaden')]),
    ('Doe mee', '/podium', '#111', '#E9F25A', _IC_KAL, [('Agenda', '/evenementen'), ('Podium', '/podium'), ('Insturen', '/uploaden'), ('Beeldbank', '/beeldbank')]),
    ('Winkel en steun', '/store', '#111', '#111', _IC_TAS, [('Toko Buku', '/store'), ('Boekenplank', '/boekenplank'), ('Doneer', '/doneer'), ('Maandelijks doneren', '/maandelijks-doneren')]),
    ('Over MOZA', '/over-moza', '#111', '#EDDCB8', _IC_INFO, [('Over MOZA', '/over-moza'), ('Team', '/team'), ('Verantwoording', '/verantwoording')]),
]


def mozakop_desktop():
    logo = ('<a class="dlogo" href="/" aria-label="Kabar Maluku Live, naar de startpagina"><span class="kb">KABAR<small aria-hidden="true">'
            '<span>M</span><span>A</span><span>L</span><span>U</span><span>K</span><span>U</span></small><span class="sr">Maluku</span><i></i></span><span class="lv">LIVE</span></a>')
    # Naast het logo: de tabs van moza.nu met Meer en de tegels Delen en Ander dorp. Rechts leesbaarheid en nachtmodus.
    tabs = (f'<nav class="tb" aria-label="Menu van MOZA"><a href="{_mz("/")}">Voorpagina MOZA</a><a href="{_mz("/lezen")}">Net binnen</a><a href="{_mz("/nieuws/maluku")}">Maluku</a>'
            '<button type="button" class="meer" aria-expanded="false" aria-controls="mzd-mp"><span>Meer</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></nav>')
    tegels = ('<span class="dtgs">'
              f'<button type="button" class="dtg deel" data-deel aria-label="Deel deze pagina">{ic("deel")}<span>Delen</span></button>'
              f'<a class="dtg ander" href="/" aria-label="Ander dorp zoeken">{ICON_ZOEK}<span>Ander dorp</span></a></span>')
    rechts = ('<span class="dr">'
              '<button type="button" class="dlh" onclick="mzGroot()" aria-label="Grotere letters aan of uit" title="Leeshulp: grotere letters"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + _IC_AA + '</svg></button>'
              '<button type="button" class="dth" onclick="mzThema()" aria-label="Nachtmodus aan of uit" title="Nachtmodus"><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>'
              f'<a class="mzlogo dmoza" href="{_mz("/")}" aria-label="MOZA, naar de voorpagina van moza.nu" title="Naar moza.nu">MOZA</a>'
              '</span>')
    def groep(naam, pad, kl, bg, ico, items):
        donker = bg in ('#E9F25A', '#EDDCB8')
        lijst = ''.join(f'<li><a href="{_mz(u)}">{n}</a></li>' for n, u in items)
        return (f'<div class="mg"><span class="ico" style="background:{bg};color:{"#111" if donker else "#fff"}">{_sv(ico)}</span>'
                f'<h3><a href="{_mz(pad)}" style="color:{kl}">{naam}</a></h3><ul>{lijst}</ul></div>')
    # Zes kolommen; Winkel en steun onder Agenda en Over MOZA onder Doe mee, zodat ze niet ver naar beneden staan
    groepen = ''.join('<div class="mk">' + ''.join(groep(*MEER_G[k]) for k in kol) + '</div>' for kol in [[0], [1], [2], [3], [4, 6], [5, 7]])
    mp = f'<div class="mp" id="mzd-mp" hidden>{groepen}</div>'
    r1 = f'<div class="d1">{logo}{tabs}{tegels}{rechts}</div>{mp}'
    return f'<div id="mzd" data-nosnippet>{r1}</div>'


def pagina(titel, omschrijving, pad, body, extra_head='', robots='index,follow', deel=DEEL_STANDAARD):
    return f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>(function(){{var d=document.documentElement,t=null;try{{t=localStorage.getItem('moza-theme')}}catch(e){{}}if(t==='dark'||(!t&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches))d.classList.add('moza-dark');
try{{if(localStorage.getItem('mzk-groot')==='1')d.classList.add('mzk-groot')}}catch(e){{}}
window.mzGroot=function(){{var g=d.classList.toggle('mzk-groot');try{{localStorage.setItem('mzk-groot',g?'1':'0')}}catch(e){{}}}};
window.mzThema=function(){{var dk=!d.classList.contains('moza-dark');d.classList.toggle('moza-dark',dk);try{{localStorage.setItem('moza-theme',dk?'dark':'light')}}catch(e){{}};var m=document.querySelector('meta[name=theme-color]');if(m)m.content=dk?'#17181D':'#1F3BD1'}}}})();</script>
<title>{e(titel)}</title>
<meta name="description" content="{e(omschrijving)}">
<link rel="canonical" href="{SITE}{pad}">
<meta name="robots" content="{robots}">
<meta property="og:title" content="{e(titel)}">
<meta property="og:description" content="{e(omschrijving)}">
<meta property="og:url" content="{SITE}{pad}">
<meta property="og:site_name" content="Kabar Maluku Live">
<meta property="og:type" content="website">
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Kabar Maluku Live, powered by MOZA. Wat speelt er bij jouw dorp?">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1F3BD1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;700;800;900&family=Fraunces:ital,wght@1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/dorp.css?v={VERSIE}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
{extra_head}{PLAUSIBLE}
</head>
<body>
{MOZAKOP}
{MZD}
<header class="kop"><a class="merk" href="/" aria-label="Kabar Maluku Live, naar de startpagina"><span class="kb">KABAR<small aria-hidden="true"><span>M</span><span>A</span><span>L</span><span>U</span><span>K</span><span>U</span></small><span class="sr">Maluku</span><i></i></span><span class="lv">LIVE</span></a><span class="rechts"><button class="knop deelk" type="button" data-deel aria-label="Deel deze pagina">{ic("deel")}<span class="kt">Delen</span></button><a class="knop ander" href="/" aria-label="Ander dorp zoeken">{ICON_ZOEK}<span class="kt">Ander dorp</span></a></span></header>
{body}
<footer class="voet"><div class="w"><p class="pw">Kabar Maluku Live, powered by <a class="mz" href="https://www.moza.nu" aria-label="MOZA">MOZA</a></p><p>Voor, door en met Molukkers. Bekijk ook <a href="https://www.moza.nu/kaarten">alle kaarten</a> en <a href="https://www.moza.nu/lezen">het laatste nieuws</a> op moza.nu.</p>
<p>Klopt er iets niet? <a href="https://www.moza.nu/contact">Laat het ons weten</a>.</p></div></footer>
{onder_html(deel)}
</body>
</html>'''


def klok_js(nu_nl_verschil):
    return ('<script>(function(){var el=document.getElementById("tijd");if(!el)return;function z(){try{el.textContent='
            'new Intl.DateTimeFormat("nl-NL",{timeZone:"Asia/Jayapura",hour:"2-digit",minute:"2-digit"}).format(new Date())}catch(e){}}'
            'z();setInterval(z,30000)})();</script>')


def uurtekst(t):
    return f'{t.hour} uur' if t.minute < 30 else f'half {(t.hour % 12) + 1}'


# ---------------------------------------------------------------- dorpspagina

def samenvatting(d, br, bv, wr, lu, nu):
    """Eén of twee zinnen bovenaan: het belangrijkste eerst."""
    naam = e(d['naam'])
    # zware beving in de afgelopen 3 dagen
    if bv and bv['gevoeld']:
        q = bv['gevoeld'][0]
        if q['mmi'] >= 4.5 and (nu - q['t'].astimezone(WIT)) < timedelta(days=3):
            return (f'{tijd_nl(q["t"], nu)} was er een aardbeving die je in {naam} '
                    f'<b>goed kon voelen</b>. Kijk hieronder hoe sterk.')
    vers = [p for p in br if (nu - p['t'].astimezone(WIT)) < timedelta(hours=48)]
    if vers:
        p = vers[0]
        waar = 'op de grond van het dorp' if p['binnen'] else 'vlak bij de grond van het dorp'
        zin = (f'{tijd_nl(p["t"], nu)} zag de satelliet een brand {waar}, '
               f'<b>{T.afstand(p["km"])}</b> naar {p["richting"]}.')
        if wr and wr.get('wrichting') is not None and (wr.get('wsnel') or 0) >= 5:
            naar = (wr['wrichting'] + 180) % 360
            x, y = km_xy(d['la'], d['lo'], p['la'], p['lo'])
            hoek = (math.degrees(math.atan2(x, y)) + 360) % 360
            verschil = abs((naar - hoek + 180) % 360 - 180)
            if verschil < 50:
                zin += ' De wind blaast de rook vandaag <b>richting het dorp</b>.'
            elif verschil > 130:
                zin += ' De wind blaast de rook vandaag <b>weg van het dorp</b>.'
        return zin
    if lu and lu['vandaag']:
        l = T.lucht(lu['vandaag']['pm'])
        if l and l['code'] in ('ongezond', 'zeerongezond'):
            return f'De lucht in {naam} is vandaag <b>ongezond</b> door rook. {l["advies"]}'
    if wr:
        heet = [x for x in wr['dagen'][:3] if T.hitte(x['tmax']) and T.hitte(x['tmax'])[0] == 'snikheet']
        if heet:
            dagnaam = 'Vandaag' if heet[0]['t'].date() == nu.date() else ('Morgen' if heet[0]['t'].date() == (nu + timedelta(days=1)).date() else T.DAGEN[heet[0]['t'].weekday()].capitalize())
            return f'{dagnaam} wordt het <b>snikheet</b> in {naam}. {T.HITTE_ADVIES}'
    if br:
        return f'Deze week zag de satelliet {"één keer" if len(br) == 1 else str(len(br)) + " keer"} brand in of rond {naam}. Niet in de afgelopen twee dagen.'
    return f'Het is rustig rond {naam}. De satelliet zag de afgelopen week <b>geen brand</b> in of rond het dorp.'



VEERHAVENS = []


def rond(x):
    x = float(x)
    if x >= 1000:
        return f'{int(round(x, -2)):,}'.replace(',', '.')
    if x >= 100:
        return str(int(round(x, -1)))
    return str(max(1, int(round(x))))


def norm_naam(x):
    return re.sub(r'[^a-z]', '', x.lower())


def kort_blok(d, kust_dorp, eiland=None):
    """Blok 'In het kort': inwoners (BPS), grond (BPS), hoogte, veerhaven of grote plaats."""
    tegels = []
    inw = d.get('inw')
    if inw and inw.get('n'):
        tegels.append(('Mensen', f'{inw["n"]:,}'.replace(',', '.'), f'BPS, {inw["jaar"]}'))
    if inw and inw.get('km2'):
        tegels.append(('Grond', rond(inw['km2'] / 0.00714), 'voetbalvelden groot'))
    h = d.get('hoogte')
    if h is not None:
        waar = ('vlak aan zee' if kust_dorp and h <= 15 else 'aan zee' if kust_dorp else 'laag gelegen' if h < 60
                else 'in de heuvels' if h < 300 else 'in de bergen')
        tegels.append(('Hoogte', f'{rond(max(h, 1)) if h >= 50 else max(int(h), 1)} meter', waar))
    if inw and inw.get('naar_hoofd') is not None:
        km = inw['naar_hoofd']
        kmt = rond(km) if km >= 10 else f'{km:g}'.replace('.', ',')
        tegels.append(('District', d['kec'], f'{kmt} km naar de hoofdplaats'))
    # alleen veerhavens op hetzelfde eiland (met wat ruimte voor steigers in zee)
    zelfde = eiland.buffer(0.015) if eiland is not None else None
    havens = sorted(((T.km_tussen(d['la'], d['lo'], a, b), n) for n, a, b in VEERHAVENS
                     if zelfde is None or zelfde.contains(Point(b, a))), key=lambda x: x[0])[:1]
    if False and kust_dorp and havens and havens[0][0] <= 30:  # veerhavens voorlopig uit: overal zijn steigers
        km, n = havens[0]
        tegels.append(('Veerhaven', n, T.afstand(km) if km >= 0.4 else 'in het dorp'))
    else:
        stad, km = dichtste_stad(d['la'], d['lo'])
        if not (d.get('kabnaam', '').startswith('Kota ') or km <= 10):  # dorp ligt al in of bij de stad
            tegels.append(('Afstand tot stad', stad, 'je bent er al' if km < 2 else T.afstand(km) if km <= 3 else f'{round(km)} km hemelsbreed'))
    if len(tegels) < 2:
        return ''
    t = ''.join(f'<div class="tg"><span class="label">{e(l)}</span><b>{e(w)}</b><small>{e(sm)}</small></div>' for l, w, sm in tegels)
    bron = (f'<p class="nb">Bron {"inwoners en grond" if inw.get("km2") else "inwoners"}: BPS, {e(inw["bron"])}.</p>' if inw else '')
    return (f'<section class="overdorp" aria-labelledby="h-over"><p class="label">Over het dorp</p>'
            f'<h2 id="h-over">{e(d["naam"])} in het kort</h2><div class="tegels">{t}</div>{bron}</section>')

def dorp_html(d, ctx, nu):
    naam = d['naam']
    br, bv, wr, lu, zz, nw = (ctx[k] for k in ('br', 'bv', 'wr', 'lu', 'zz', 'nw'))
    groep = D.GROEPEN.get(d['groep'], '')
    delen = []

    # ---- hero
    verschil = int((nu.utcoffset() - nu.astimezone(NL).utcoffset()).total_seconds() // 3600)
    chips = [f'<div class="chip"><span class="label">In het dorp</span><b id="tijd">{nu:%H:%M}</b>'
             f'<small>{verschil} uur later dan in Nederland</small></div>']
    if wr and wr.get('temp') is not None:
        regent = wr['regenzin'].startswith('Regen tot') or wr['regenzin'].startswith('Regen de')
        klein = wr['regenzin'] if regent else f'{T.weer_woord(wr["code"])}. {wr["regenzin"]}'
        chips.append(f'<div class="chip"><span class="label">Weer nu</span><b>{round(wr["temp"])}°</b>'
                     f'<small>{e(klein)}</small></div>')
    sub = f'{e(d["kec"])} · {e(groep)}'
    zon = ''
    if wr and wr['dagen'] and wr['dagen'][0].get('op'):
        z0 = wr['dagen'][0]
        nl = lambda t: t.astimezone(NL).strftime('%H:%M')
        zon = (f'<div class="zon"><span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 18h18M7 18a5 5 0 0110 0M12 4v4M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8M9 6l3-3 3 3"/></svg>'
               f'<b>Zon op {z0["op"]:%H:%M}</b><small>in Nederland {nl(z0["op"])}</small></span>'
               f'<span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 18h18M7 18a5 5 0 0110 0M12 3v5M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8M9 5l3 3 3-3"/></svg>'
               f'<b>Zon onder {z0["onder"]:%H:%M}</b><small>in Nederland {nl(z0["onder"])}</small></span></div>')
    samen = samenvatting(d, br, bv, wr, lu, nu)
    delen.append(f'''<section class="hero" aria-labelledby="h1"><div class="w">
<nav class="label kruim" aria-label="Kruimelpad"><i></i><a href="/">Kabar Maluku Live</a> › <a href="/eiland/{d["groep"]}/">{e(groep)}</a></nav>
<h1 id="h1">{e(naam)}</h1>
<p class="sub">{sub}</p>
<p class="intro">Brand, weer, zee en aardbevingen bij {e(naam)}{" (officieel " + e(d["officieel"]) + ")" if d["officieel"] != naam else ""} in {e(d["kec"])}, {e(d["kabnaam"])}. Elk uur bijgewerkt.</p>
<div class="chips">{''.join(chips)}</div>{zon}
<p class="samen">{samen}</p>
<p class="accent">zo staat het er nu voor</p>
</div></section>
<div class="streep"><span></span><span></span><span></span></div>''')

    m = [kort_blok(d, ctx.get('kust_dorp'), ctx.get('eiland'))]
    # ---- brand
    lijst = ''
    for i, p in enumerate(br[:9], 1):
        t = p['t'].astimezone(WIT)
        kop = f'{tijd_nl(t, nu)} · {T.afstand(p["km"])} naar {p["richting"]}'
        lijst += (f'<li class="{"eerste" if i == 1 else ""}"><span class="nr" style="background:{"#FF4D2E" if i == 1 else "#FF7AB6"}">{i}</span>'
                  f'<span><b>{e(kop)}</b><span class="t">{e(T.brand_plek(p))} {e(T.brand_zekerheid(p))}</span></span></li>')
    if br:
        brandkop = 'Waar brandt het?'
        intro = ''
    else:
        brandkop = 'Is er brand?'
        intro = f'<div class="blok"><p class="groot">De satelliet zag de afgelopen week geen brand in of rond {e(naam)}.</p></div>'
    svg = kaart_svg(d, None, ctx['buren'], ctx['kust'], br, wr.get('wrichting') if wr else None)
    m.append(f'''<section aria-labelledby="h-brand">
<p class="label"><span class="tag" style="background:var(--rood)">Brand</span></p>
<h2 id="h-brand">{brandkop}</h2>{intro}
<figure class="kaart">{svg}<figcaption>Het blauwe vlak is de grond van {e(naam)}. {'Het zwarte blokje is het dorp.' if d['echt'] else 'Het zwarte blokje is het midden van de grond van het dorp. Afstanden zijn vanaf dat punt.'} Je ziet alles tot ongeveer 5 kilometer rondom.</figcaption></figure>
{f'<ol class="lijst">{lijst}</ol>' if lijst else ''}
</section>''')

    # ---- weer
    if wr and wr['dagen']:
        cellen, kopzin = '', None
        for x in wr['dagen'][:3]:
            h = T.hitte(x['tmax'])
            heet = h and h[0] == 'snikheet'
            dn = 'Vandaag' if x['t'].date() == nu.date() else ('Morgen' if x['t'].date() == (nu + timedelta(days=1)).date() else T.DAGEN[x['t'].weekday()].capitalize())
            woord = h[1] if h and h[1] else T.weer_woord(x['code'])
            cellen += f'<span class="{"heet" if heet else ""}">{dn}<b class="g">{round(x["tmax"])}°</b>{e(woord)}</span>'
            if heet and not kopzin:
                kopzin = f'{dn} wordt het snikheet.'
        rijen = ''
        for x in wr['dagen'][3:7]:
            h = T.hitte(x['tmax'])
            woord = T.weer_woord(x['code'])
            laag = f' / {round(x["tmin"])}°' if x.get('tmin') is not None else ''
            kans = f'{int(round(x["kans"], -1))}% kans op regen' if x.get('kans') is not None and x['kans'] >= 20 else 'Droog'
            rijen += (f'<li><span class="dg">{T.DAGEN[x["t"].weekday()].capitalize()} {x["t"].day} {T.MAANDEN[x["t"].month - 1][:3]}</span>'
                      f'<span class="tp"><b>{round(x["tmax"])}°</b>{laag}</span>'
                      f'<span class="ww">{e(woord)}{" · " + e(h[1].lower()) if h and h[1] else ""} · {kans.lower() if kans != "Droog" else "droog"}</span></li>')
        week = f'<p class="wk">De dagen daarna</p><ul class="week">{rijen}</ul>' if rijen else ''
        if kopzin:
            tekst = f'<p class="groot">{kopzin}</p><p>{e(T.HITTE_ADVIES)}</p>'
            cls = 'blok schaduw-rood'
        else:
            tekst = f'<p class="groot">{e(T.weer_woord(wr["dagen"][0]["code"]))} vandaag, {round(wr["dagen"][0]["tmax"])} graden.</p>'
            cls = 'blok'
        m.append(f'''<section aria-labelledby="h-weer">
<p class="label"><span class="tag" style="background:var(--geel)">Weer</span></p>
<h2 id="h-weer">Wat voor weer wordt het?</h2>
<div class="{cls}">{tekst}<div class="drie">{cellen}</div>{week}</div></section>''')

    # ---- lucht
    if lu:
        l = T.lucht(lu['vandaag']['pm']) if lu['vandaag'] else None
        vakjes = ''
        toon = [x for x in lu['dagen'] if x['d'] <= (nu + timedelta(days=1)).date()][-6:]
        for x in toon:
            ll = T.lucht(x['pm'])
            if x['d'] == nu.date():
                lab, cls = 'nu', 'nu'
            elif x['d'] > nu.date():
                lab, cls = 'morgen', 'later'
            else:
                lab, cls = T.DAG_KORT[x['d'].weekday()], ''
            vakjes += f'<span class="{cls}"><i class="c-{ll["code"]}" title="{ll["label"]}"></i>{lab}</span>'
        if l:
            m.append(f'''<section aria-labelledby="h-lucht">
<p class="label"><span class="tag" style="background:var(--roze)">Lucht</span></p>
<h2 id="h-lucht">Is de lucht gezond?</h2>
<div class="blok"><p class="groot">{e(l["zin"])}</p>{f'<p>{e(l["advies"])}</p>' if l['advies'] else ''}
<div class="dagen" role="img" aria-label="Hoe gezond de lucht was, per dag">{vakjes}</div>
<div class="leg"><span><i class="c-gezond"></i>Helder</span><span><i class="c-rook"></i>Lichte waas</span><span><i class="c-ongezond"></i>Rook</span><span><i class="c-zeerongezond"></i>Dikke rook</span></div>
</div></section>''')

    # ---- zee (alleen voor dorpen aan de kust)
    if zz and ctx.get('kust_dorp'):
        z = zz['delen']
        niv = [T.zee_niveau(x['golf'], x['wind']) for x in z]
        cellen = ''
        for x, n in zip(z, niv):
            ww = T.wind(x['wind'])
            cellen += (f'<span class="{"hoog" if n >= 2 else ""}">{x["naam"]}<b>{T.golven(x["golf"])}</b>'
                       f'{T.golf_lichaam(x["golf"])}<br>{ww or ""}</span>')
        slechtst, best = max(niv), min(niv)
        deel = lambda n: [x['naam'].lower() for x, v in zip(z, niv) if v == n]
        if slechtst == best:
            kop = {0: 'Morgen is het de hele dag rustig op zee.', 1: 'Morgen staan er de hele dag wat golven.',
                   2: 'Morgen is het de hele dag onrustig op zee.', 3: 'Morgen is het de hele dag zwaar weer op zee.'}[best]
        else:
            rustig, woelig = deel(best)[0], deel(slechtst)[0]
            kop = f"Morgen is de zee ’s {rustig}s het rustigst. ’s {woelig.capitalize()}s wordt het {'onrustig' if slechtst >= 2 else 'wat woeliger'}."
        vb = T.oversteek_voorbeeld(d)
        if slechtst == best:
            vis, over = e(T.VISSER[best]), e(T.OVERSTEEK[best])
        else:
            r, w = deel(best)[0], deel(slechtst)[0]
            vis = f"<br>’s {r.capitalize()}s: {e(T.VISSER[best])}<br>’s {w.capitalize()}s: {e(T.VISSER[slechtst])}"
            over = f"<br>’s {r.capitalize()}s: {e(T.OVERSTEEK[best])}<br>’s {w.capitalize()}s: {e(T.OVERSTEEK[slechtst])}"
        m.append(f'''<section aria-labelledby="h-zee">
<p class="label"><span class="tag" style="background:var(--blauw);color:#fff">Zee</span></p>
<h2 id="h-zee">Hoe is de zee morgen?</h2>
<div class="blok"><p class="groot">{e(kop)}</p>
<div class="drie">{cellen}</div>
<p><b>Voor vissers met een kleine boot:</b> {vis}</p>
<p><b>Op bezoek en wil je oversteken of eiland-hoppen met de speedboot of ferry{', ' + e(vb) if vb else ''}?</b> {over}</p>
</div></section>''')

    # ---- bevingen
    if bv is not None:
        if bv['gevoeld']:
            q = bv['gevoeld'][0]
            t = q['t'].astimezone(WIT)
            g = T.beving_gevoel(q['mmi'])
            kop = f'De laatste beving die je in het dorp kon voelen, was {tijd_nl(t, nu, hoofd=False)}.'
            n = bv['perjaar']
            normaal = (f'<p class="let"><b>Dat is normaal.</b> Rond {e(naam)} voel je zo\'n beving {T.hoe_vaak(n)}.'
                       if n >= 4 else f'<p class="let">Bevingen die je voelt, zijn hier niet zo vaak: {T.hoe_vaak(n)}.')
            if bv['klein'] >= 20:
                normaal += ' Kleine bevingen die je niet voelt, zijn er veel vaker.'
            normaal += '</p>'
            inhoud = f'<p class="groot">{e(kop)}</p><p>{e(g[1])}</p>{normaal}'
        else:
            inhoud = f'<p class="groot">Het afgelopen jaar was er geen beving die je in {e(naam)} kon voelen.</p>'
        m.append(f'''<section aria-labelledby="h-beving">
<p class="label"><span class="tag" style="background:#111;color:#fff">Aardbevingen</span></p>
<h2 id="h-beving">Heeft de aarde gebeefd?</h2>
<div class="blok">{inhoud}</div></section>''')

    # ---- bos
    bos = ctx.get('bos')
    if bos and bos.get('bos2000', 0) > 5:
        frac = bos['verlies'] / bos['bos2000'] if bos['bos2000'] else 0
        deel = T.deel_van(frac)
        jaren = bos.get('perjaar') or {}
        mx = max(jaren.values()) if jaren else 0
        staaf = ''
        reeks = list(range(2001, max([int(y) for y in jaren] + [ctx.get('bosjaar', 2001)]) + 1))
        for y in reeks:
            v = jaren.get(str(y), 0)
            hgt = 4 + 96 * v / mx if mx else 4
            staaf += f'<i class="{"max" if mx and v == mx else ""}" style="height:{hgt:.0f}%" title="{y}"></i>'
        topjaar = max(jaren, key=jaren.get) if jaren else None
        if deel and bos['verlies'] >= 1:
            kop = f'Sinds 2001 is ongeveer {deel} stukken bos rond {e(naam)} verdwenen.' if not deel.startswith('de helft') else f'Sinds 2001 is ongeveer de helft van het bos rond {e(naam)} verdwenen.'
            tekst = f'Dat is zo groot als {T.voetbalvelden(bos["verlies"])}.' + (f' Het meeste verdween in {topjaar}.' if topjaar else '')
        else:
            kop, tekst = f'Het bos rond {e(naam)} is sinds 2001 bijna niet kleiner geworden.', ''
        m.append(f'''<section aria-labelledby="h-bos">
<p class="label"><span class="tag" style="background:var(--geel)">Bos</span></p>
<h2 id="h-bos">Hoeveel bos is er nog?</h2>
<div class="blok warm"><p class="groot">{kop}</p>{f'<p>{e(tekst)}</p>' if tekst else ''}
{f'<div class="staaf" role="img" aria-label="Hoeveel bos er per jaar verdween">{staaf}</div><div class="as"><span>{reeks[0]}</span><span>Hoe hoger, hoe meer bos weg</span><span>{reeks[-1]}</span></div>' if jaren and mx else ''}
</div></section>''')

    # ---- nieuws
    if nw:
        kaartjes = ''.join(f'<a class="nieuws" href="{e(x["url"])}"><span>{x["t"].astimezone(WIT).day} {T.MAANDEN[x["t"].astimezone(WIT).month - 1]} {x["t"].astimezone(WIT).year}</span><b>{e(html.unescape(x["titel"]))}</b></a>' for x in nw)
        m.append(f'<section aria-labelledby="h-nieuws"><h2 id="h-nieuws">Nieuws over {e(naam)}</h2>{kaartjes}</section>')

    # ---- buurdorpen
    if ctx['buurlinks']:
        rijen = ''.join(f'<a class="rij" href="/{b["slug"]}/"><b>{e(b["naam"])}<small>{e(b["kec"])}</small></b>{"<span class=badge>BRAND</span>" if b.get("brand") else "<span aria-hidden=true>→</span>"}</a>' for b in ctx['buurlinks'])
        m.append(f'<section aria-labelledby="h-buren"><h2 id="h-buren">Dorpen in de buurt</h2><div class="verder">{rijen}</div>'
                 f'<a href="/eiland/{d["groep"]}/">Alle dorpen in {e(groep)} →</a></section>')

    wa_tekst = f'Hoe is het nu in {d["naam"]}? Brand, weer, zee en aardbevingen, ieder uur bijgewerkt.\n{SITE}/{d["slug"]}/?utm_source=whatsapp&utm_medium=deel'
    m.append(f'<section class="deelblok"><h2>Familie in {e(naam)}?</h2><p>Stuur deze pagina door. Dan weet iedereen waar je kunt kijken als er iets gebeurt.</p>'
             f'<div class="dknop"><a class="wa" href="https://wa.me/?text={quote(wa_tekst)}" target="_blank" rel="noopener">{ic("wa")}Deel via WhatsApp</a>'
             f'<button type="button" class="nog" data-deel>{ic("deel")}Andere manier</button></div></section>')
    # ---- meer op MOZA
    laatst = [x for x in (ctx.get('laatst') or []) if x['url'] not in {y['url'] for y in (nw or [])}][:3]
    if laatst:
        kaartjes = ''.join(f'<a class="nieuws" href="{e(x["url"])}?utm_source=kabar"><span>{x["t"].astimezone(WIT).day} {T.MAANDEN[x["t"].astimezone(WIT).month - 1]}</span><b>{e(html.unescape(x["titel"]))}</b></a>' for x in laatst)
        m.append(f'<section aria-labelledby="h-moza"><p class="label"><span class="tag" style="background:#111;color:#fff">MOZA</span></p><h2 id="h-moza">Nieuw op MOZA</h2>{kaartjes}'
                 f'<a href="https://www.moza.nu/lezen?utm_source=kabar">Meer verhalen op moza.nu →</a></section>')

    m.append(f'''<section class="weten" aria-labelledby="h-weten">
<p class="label" id="h-weten">Goed om te weten</p>
<p>De satelliet ziet van bovenaf waar het heet is. Meestal is dat brand, maar niet altijd. Twijfel je? Bel of app je familie.</p>
<p>De grens van het dorp op de kaart is ongeveer. Hij zegt niets over van wie de grond is.</p>
<p>Bijgewerkt op {nu.day} {T.MAANDEN[nu.month - 1]} om {nu:%H:%M} (tijd in het dorp). Bronnen: NASA FIRMS (brand), Open-Meteo (weer, lucht en zee), USGS (aardbevingen){', Global Forest Watch (bos)' if bos else ''}, grenzen: wilayah_boundaries.</p>
</section>''')
    delen.append('<main class="w">' + ''.join(m) + '</main>')

    plek = T.plek_kort(d)
    titel = f'{naam} ({plek}): brand, weer en aardbevingen | Kabar Maluku Live'
    omschrijving = (f'Is er brand bij {naam} op {plek}? Zie elk uur wat er speelt: brand, weer voor 7 dagen, '
                    f'zee, lucht en aardbevingen. {d["kec"]}, {d["kabnaam"]}.')
    url = f'{SITE}/{d["slug"]}/'
    graaf = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebPage', '@id': url, 'url': url, 'name': titel, 'description': omschrijving, 'inLanguage': 'nl',
         'dateModified': nu.isoformat(), 'isPartOf': {'@id': SITE + '/#site'}, 'about': {'@id': url + '#plaats'},
         'breadcrumb': {'@id': url + '#kruim'}},
        {'@type': 'Place', '@id': url + '#plaats', 'name': naam,
         **({'alternateName': d['officieel']} if d['officieel'] != naam else {}),
         'geo': {'@type': 'GeoCoordinates', 'latitude': d['la'], 'longitude': d['lo']},
         'address': {'@type': 'PostalAddress', 'addressLocality': d['kec'], 'addressRegion': d['prov'], 'addressCountry': 'ID'},
         'containedInPlace': {'@type': 'AdministrativeArea', 'name': f'{d["kabnaam"]}, {d["prov"]}'}},
        {'@type': 'BreadcrumbList', '@id': url + '#kruim', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Kabar Maluku Live', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': groep, 'item': f'{SITE}/eiland/{d["groep"]}/'},
            {'@type': 'ListItem', 'position': 3, 'name': naam, 'item': url}]},
    ]}
    ld = json.dumps(graaf, ensure_ascii=False)
    return pagina(titel, omschrijving, f'/{d["slug"]}/', ''.join(delen) + klok_js(verschil),
                  f'<script type="application/ld+json">{ld}</script>\n',
                  deel=(f'Hoe is het nu in {d["naam"]}?', f'Brand, weer, zee en aardbevingen in {d["naam"]} op {plek}. Ieder uur bijgewerkt.'))


# ---------------------------------------------------------------- eiland en start

def eiland_html(g, lijst, nu, brandset):
    per = {}
    for d in sorted(lijst, key=lambda x: (x['kec'], x['naam'])):
        per.setdefault(d['kec'], []).append(d)
    nbrand = sum(1 for d in lijst if d['code'] in brandset)
    blokken = ''.join(
        f'<div class="kec"><h3>{e(k)}</h3><ul>' + ''.join(
            f'<li><a href="/{d["slug"]}/">{"<i aria-label=brand></i>" if d["code"] in brandset else ""}{e(d["naam"])}</a></li>' for d in ds) + '</ul></div>'
        for k, ds in per.items())
    body = f'''<section class="hero"><div class="w"><nav class="label kruim" aria-label="Kruimelpad"><a href="/">Kabar Maluku Live</a> › Eilandgroep</nav><h1>{e(D.GROEPEN[g])}</h1>
<p class="sub">{e(D.GROEP_SUB[g])} · {len(lijst)} dorpen</p>
<p class="samen">{f'Deze week zag de satelliet brand bij <b>{nbrand} {"dorp" if nbrand == 1 else "dorpen"}</b>. Die zijn gemarkeerd met een rode stip.' if nbrand else 'Deze week zag de satelliet <b>geen brand</b> bij de dorpen hier.'}</p></div></section>
<div class="streep"><span></span><span></span><span></span></div>
<main class="w"><section><h2>Kies je dorp</h2>{blokken}</section></main>'''
    url = f'{SITE}/eiland/{g}/'
    ld = json.dumps({'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', '@id': url, 'url': url, 'name': f'Dorpen in {D.GROEPEN[g]}', 'inLanguage': 'nl', 'isPartOf': {'@id': SITE + '/#site'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Kabar Maluku Live', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': D.GROEPEN[g], 'item': url}]}]}, ensure_ascii=False)
    return pagina(f'Dorpen in {D.GROEPEN[g]}: brand, weer en aardbevingen | Kabar Maluku Live',
                  f'Alle {len(lijst)} dorpen in {D.GROEPEN[g]} ({D.GROEP_SUB[g]}). Zie per dorp of er brand is, wat voor weer het wordt en of de aarde beefde.',
                  f'/eiland/{g}/', body, f'<script type="application/ld+json">{ld}</script>\n')


def recente_bevingen(rows, lijst, nu, op_land=None, dagen=7, max_n=5):
    """Bevingen van de afgelopen dagen die het vermelden waard zijn: kracht 4 of meer, of ergens goed voelbaar."""
    if lijst is None:
        return None
    grens = nu - timedelta(days=dagen)
    import numpy as np
    dla = np.radians(np.array([d['la'] for d in rows])); dlo = np.radians(np.array([d['lo'] for d in rows]))
    def dichtbij(q, km=100):
        p1, l1 = math.radians(q['la']), math.radians(q['lo'])
        h = np.sin((dla - p1) / 2) ** 2 + np.cos(p1) * np.cos(dla) * np.sin((dlo - l1) / 2) ** 2
        return 2 * 6371 * np.arcsin(np.sqrt(h.min())) <= km
    jaar = sum(1 for q in lijst if q['mag'] >= 4.0 and dichtbij(q))
    uit, stil = [], 0
    for q in lijst:
        if q['t'].astimezone(WIT) < grens:
            continue
        best_i, dicht, dicht_km = -9.0, None, 1e9
        for d in rows:
            km = T.km_tussen(d['la'], d['lo'], q['la'], q['lo'])
            if km < dicht_km:
                dicht, dicht_km = d, km
            if km < 400:
                best_i = max(best_i, min(T.mmi(q['mag'], km, q['diepte']), q.get('mmimax') or 99))
        if dicht_km > 250:
            continue  # buiten de Molukken
        if best_i < T.VOELBAAR:
            stil += 1 if q['mag'] >= 4.0 else 0
            continue
        if True:
            uit.append(dict(q, mmi=best_i, dorp=dicht, km=dicht_km,
                            land=bool(op_land and op_land(q['la'], q['lo']))))
    uit.sort(key=lambda q: q['t'], reverse=True)
    return {'lijst': uit[:max_n], 'jaar': jaar, 'stil': stil}


AMBON = (-3.6954, 128.1814)
# Grote plaatsen in de Molukken (OpenStreetMap; Labuha en Banda Neira aangevuld)
STEDEN = [('Ambon', -3.6959, 128.1788), ('Masohi', -3.3063, 128.953), ('Piru', -3.0618, 128.195), ('Bula', -3.1053, 130.4886),
          ('Namlea', -3.2695, 127.0992), ('Namrole', -3.8442, 126.7274), ('Banda Neira', -4.5246, 129.8965), ('Tual', -5.639, 132.7429),
          ('Dobo', -5.7608, 134.2335), ('Saumlaki', -7.9742, 131.3049), ('Tiakur', -8.1497, 127.8051), ('Ternate', 0.7852, 127.3832),
          ('Sofifi', 0.7348, 127.5761), ('Tidore', 0.6787, 127.4483), ('Jailolo', 1.0766, 127.4748), ('Tobelo', 1.7263, 127.9999),
          ('Daruba', 2.0515, 128.2925), ('Weda', 0.3305, 127.869), ('Maba', 0.6759, 128.2875), ('Labuha', -0.6333, 127.4833),
          ('Laiwui', -1.3367, 127.6364), ('Sanana', -2.0573, 125.9796), ('Bobong', -1.9463, 124.3839)]


def dichtste_stad(la, lo):
    return min(((n, T.km_tussen(la, lo, a, b)) for n, a, b in STEDEN), key=lambda x: x[1])


def diepte_tekst(km):
    km = round(km)
    if km < 30:
        return f'De beving lag ondiep, ongeveer {km} km onder de grond. Dan voel je hem dichtbij goed.'
    if km < 70:
        return f'De beving lag ongeveer {km} km onder de grond.'
    if km < 300:
        return f'De beving lag diep: ongeveer {km} km onder de grond. Daardoor komt er boven veel minder kracht aan.'
    return f'De beving lag heel diep: ongeveer {km} km onder de grond. Daardoor merk je er boven weinig van.'


GERUST = {
    None: 'Schade is niet te verwachten.',
    'licht': 'Schade is bij zo\'n lichte beving niet te verwachten.',
    'stevig': 'Er kunnen spullen zijn omgevallen. Grote schade is niet te verwachten.',
    'sterk': 'Bel of app je familie als je je zorgen maakt.',
    'zwaar': 'Volg ook wat de instanties ter plekke zeggen.',
}


def bevingen_blok(bev, nu):
    if not bev:
        return ''
    lijst, jaar, stil = bev['lijst'], bev['jaar'], bev.get('stil', 0)
    per_week = round(jaar / 52)
    normaal = (f'Aardbevingen zijn in de Molukken heel gewoon. Het afgelopen jaar waren er {jaar} met kracht 4 of meer, '
               f'{"ongeveer " + str(per_week) + " per week" if per_week >= 2 else "een paar per maand"}. De meeste merk je nauwelijks.')
    kop = '<section aria-labelledby="h-bev" class="bevblok"><h2 id="h-bev">Aardbevingen deze week</h2>'
    if not lijst:
        return kop + f'<p class="let"><b>Rustig.</b> De afgelopen 7 dagen was er geen beving die mensen merkten. {normaal}</p></section>'
    kaarten = []
    for q in lijst:
        t = q['t'].astimezone(WIT)
        g = T.beving_gevoel(q['mmi'])
        niveau = g[0] if g else None
        voel = g[1] if g else 'Bijna niemand heeft hem gevoeld.'
        woord = g[1].split('.')[0].upper() if g else 'NIET GEVOELD'
        plek = T.plek_kort(q['dorp'])
        waar = (f'op {plek}' if q['land'] else f'in zee bij {plek}')
        stad, ka = dichtste_stad(q['la'], q['lo'])
        extra = (f', vlak bij {stad}' if ka <= 10 else f', ongeveer {round(ka)} km van {stad}' if ka < 300 else '')
        kracht = f'{q["mag"]:.1f}'.replace('.', ',')
        kaarten.append(
            f'<a class="bevkaart bk-{niveau or "geen"}" href="/{q["dorp"]["slug"]}/"><p class="bk-tijd"><b>{e(tijd_nl(t, nu, "in de Molukken"))}</b>'
            f'<span class="badge bv-{niveau or "geen"}">{e(woord)}</span></p>'
            f'<h3>Kracht {kracht}, {e(waar)}{e(extra)}</h3>'
            f'<p>{diepte_tekst(q["diepte"])}</p>'
            f'<p><b>Wat merkten mensen ervan?</b> {e(voel)} {GERUST.get(niveau, GERUST[None])}</p>'
            f'<p class="bk-meer">Bekijk het dichtstbijzijnde dorp, {e(q["dorp"]["naam"])} →</p></a>')
    return (kop + '<p>Afgelopen 7 dagen. Tijden in Nederlandse tijd, met de tijd in de Molukken tussen haakjes.</p>' + ''.join(kaarten)
            + (f'<p>Daarnaast waren er deze week {stil} bevingen van kracht 4 of meer die zo diep of zo ver weg lagen dat niemand ze merkte.</p>' if stil > 1 else '')
            + f'<p class="let">{normaal} Wil je weten hoe het in jouw dorp voelde? Zoek je dorp hierboven.</p></section>')


def start_html(groepen, brandlijst, nu, bevlijst=None):
    knoppen = ''.join(f'<a href="/eiland/{g}/">{e(n)}</a>' for g, n in D.GROEPEN.items())
    brand = ''
    if brandlijst:
        brand = ('<section><h2>Brand gezien bij</h2><p>Afgelopen 48 uur, op de grond van het dorp.</p><div class="verder">'
                 + ''.join(f'<a class="rij" href="/{d["slug"]}/"><b>{e(d["naam"])}<small>{e(d["kec"])} · {e(D.GROEPEN[d["groep"]])}</small></b><span class="badge">BRAND</span></a>' for d in brandlijst[:12])
                 + '</div></section>')
    body = f'''<section class="hero"><div class="w">
<p class="label">Kabar Maluku Live · powered by MOZA</p><h1>Wat speelt er bij jouw dorp?</h1>
<p class="accent">brand, beving, lucht en weer</p>
<label for="q" style="margin-top:8px;font-size:14px;font-weight:800">Zoek je dorp of eiland</label>
<div class="zoek">{ICON_ZOEK}<input id="q" type="search" autocomplete="off" placeholder="Bijvoorbeeld Ullath of Seram" aria-controls="res"></div>
<div id="res" class="verder" aria-live="polite"></div>
</div></section>
<div class="streep"><span></span><span></span><span></span></div>
<main class="w">
<section><h2>Of kies een eilandgroep</h2><div class="knoppen">{knoppen}</div></section>
{bevingen_blok(bevlijst, nu)}
{brand}
<section aria-labelledby="h-kaart"><h2 id="h-kaart">Of kies op de kaart</h2><p>Zoom in, tik op een dorp en kies <b>Wat speelt er nu</b>.</p></section>
</main>
<div id="mzn-plek"></div>
<script>window.MZN_SLUG={{}};fetch('/slugs.json').then(function(r){{return r.json()}}).then(function(j){{Object.assign(window.MZN_SLUG,j)}}).catch(function(){{}});</script>
<script src="/atlas/atlas-maluku.js?v={VERSIE}" defer></script>
<script>(function(){{var q=document.getElementById('q'),res=document.getElementById('res'),L=null;
function n(s){{return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').trim()}}
function load(){{if(L)return Promise.resolve(L);return fetch('/zoek.json').then(function(r){{return r.json()}}).then(function(j){{L=j.map(function(x){{x.k=n(x.n+' '+(x.o||''));return x}});return L}})}}
function esc(s){{return String(s).replace(/[&<>"]/g,function(c){{return{{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]}})}}
function show(){{var v=n(q.value);if(v.length<2){{res.innerHTML='';return}}load().then(function(L){{
var gs={json.dumps({g: n for g, n in D.GROEPEN.items()}, ensure_ascii=False)},kw={json.dumps(EILAND_WOORDEN, ensure_ascii=False)},gh='';Object.keys(gs).forEach(function(g){{if(kw[g].some(function(w){{return w.indexOf(v)===0||v.indexOf(w)===0}}))gh+='<a class="rij" style="background:#1F3BD1;color:#fff" href="/eiland/'+g+'/"><b>'+esc(gs[g])+'<small style="color:#fff">Alle dorpen in deze eilandgroep</small></b><span aria-hidden="true">→</span></a>'}});
var a=L.filter(function(x){{return x.k.indexOf(v)===0}}),b=L.filter(function(x){{return x.k.indexOf(v)>0}});var r=a.concat(b).slice(0,12);
res.innerHTML=gh+r.map(function(x){{return '<a class="rij" href="/'+x.s+'/"><b>'+esc(x.n)+'<small>'+esc(x.c)+' · '+esc(x.g)+'</small></b>'+(x.b?'<span class="badge">BRAND</span>':'<span aria-hidden="true">→</span>')+'</a>'}}).join('')||'<p>Geen dorp gevonden. Probeer een andere schrijfwijze.</p>'}})}}
q.addEventListener('input',show);try{{var u=new URLSearchParams(location.search).get('q');if(u)q.value=u}}catch(e){{}}if(q.value)show()}})();</script>'''
    ld = json.dumps({'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebSite', '@id': SITE + '/#site', 'url': SITE + '/', 'name': 'Kabar Maluku Live', 'inLanguage': 'nl',
         'publisher': {'@type': 'Organization', 'name': 'MOZA', 'url': 'https://www.moza.nu'},
         'potentialAction': {'@type': 'SearchAction', 'target': SITE + '/?q={search_term_string}', 'query-input': 'required name=search_term_string'}}]}, ensure_ascii=False)
    return pagina('Kabar Maluku Live: brand, weer en aardbevingen bij jouw dorp op de Molukken',
                  'Zoek je dorp op de Molukken en zie of er brand is, of de lucht gezond is, wat voor weer het wordt en of de aarde beefde. Voor alle 2.420 dorpen, elk uur bijgewerkt.',
                  '/', body, f'<script type="application/ld+json">{ld}</script>\n')


# ---------------------------------------------------------------- hoofdprogramma

VERSIE = '1'
EILAND_WOORDEN = {
    'ambon': ['ambon', 'leihitu', 'salahutu', 'pulau ambon'],
    'lease': ['lease', 'haruku', 'saparua', 'nusalaut', 'nusa laut'],
    'seram': ['seram', 'ceram', 'manipa', 'geser', 'gorom', 'kelang', 'boano'],
    'buru': ['buru'],
    'banda': ['banda', 'neira'],
    'zuidoost': ['kei', 'aru', 'tanimbar', 'tual', 'yamdena', 'dobo'],
    'zuidwest': ['zuidwest', 'wetar', 'kisar', 'leti', 'babar', 'damer', 'romang', 'moa', 'lakor', 'luang', 'sermata'],
    'noord': ['noord', 'halmahera', 'ternate', 'tidore', 'bacan', 'sula', 'morotai', 'obi', 'makian', 'taliabu'],
}


def main():
    global VERSIE, MZD
    ap = argparse.ArgumentParser()
    ap.add_argument('--uit', default=str(Path.cwd() / '_site'))
    ap.add_argument('--alleen', default='')
    ap.add_argument('--zonder-live', action='store_true')
    a = ap.parse_args()
    uit = Path(a.uit)
    if uit.exists():
        shutil.rmtree(uit)
    uit.mkdir(parents=True)
    nu = datetime.now(WIT).replace(second=0, microsecond=0)
    import hashlib
    VERSIE = hashlib.md5((HIER / 'static' / 'kop.js').read_bytes() + (HIER / 'static' / 'dorp.css').read_bytes() + (HIER / 'static' / 'onder.js').read_bytes() + (D.ATLAS / 'atlas-maluku.js').read_bytes()).hexdigest()[:10]

    MZD = mozakop_desktop()
    rows, kust = D.dorpen()
    pf = HIER / 'gegevens' / 'plaatsen.json'
    plaatsen = json.loads(pf.read_text()) if pf.exists() else {}
    hf = HIER / 'gegevens' / 'hoogte.json'
    hoogtes = json.loads(hf.read_text()) if hf.exists() else {}
    inf = HIER / 'gegevens' / 'inwoners.json'
    inwoners = json.loads(inf.read_text()) if inf.exists() else {}
    vf = HIER / 'gegevens' / 'veerhavens.json'
    global VEERHAVENS
    VEERHAVENS = json.loads(vf.read_text()) if vf.exists() else []
    for d in rows:
        d['inw'] = inwoners.get(d['code'])
        d['hoogte'] = hoogtes.get(d['code'])
        d['echt'] = d['code'] in plaatsen
        if d['echt']:
            d['la'], d['lo'] = plaatsen[d['code']]
    print('dorpen:', len(rows), '· met plek van de huizen:', len(plaatsen))
    # Dorp met grond ver weg (bv. Nua Nea: eilandjes in de Bandazee, dorp op Seram):
    # ligt het punt heel ver van de rest van de kecamatan, neem dan het stuk grond dat erbij ligt.
    import statistics
    perkec = {}
    for d in rows:
        perkec.setdefault((d['kab'], d['kec']), []).append(d)
    for ds in perkec.values():
        if len(ds) < 3:
            continue
        mla, mlo = statistics.median(x['la'] for x in ds), statistics.median(x['lo'] for x in ds)
        for d in ds:
            if d['echt'] or not d['grens'] or T.km_tussen(d['la'], d['lo'], mla, mlo) < 150:
                continue
            delen = [Polygon([(b, a) for a, b in r]).buffer(0).representative_point() for r in d['grens'] if len(r) >= 3]
            if delen:
                c = min(delen, key=lambda c: T.km_tussen(c.y, c.x, mla, mlo))
                print('  punt verplaatst:', d['naam'], d['kec'])
                d['la'], d['lo'] = c.y, c.x
    geos = [poly_deg(d['grens']) or Point(d['lo'], d['la']).buffer(0.008) for d in rows]
    boom = STRtree(geos)

    if a.zonder_live:
        punten = bev = None
        wcel = lcel = zcel = None
        items = None
    else:
        print('brand…'); punten = D.cached('branden-v2', 0.9, D.branden)
        print('  punten:', None if punten is None else len(punten))
        print('bevingen…'); bev = D.cached('bevingen', 0.9, D.bevingen)
        print('  bevingen:', None if bev is None else len(bev))
        cw, _ = D.raster(rows, 0.25)
        cl, _ = D.raster(rows, 0.5)
        print('weer…', len(cw)); wcel = D.cached('weer-v3', 2.9, lambda: D.weer(cw))
        print('lucht…', len(cl)); lcel = D.cached('lucht', 2.9, lambda: D.lucht(cl))
        print('zee…'); zcel = D.cached('zee', 2.9, lambda: D.zee(cw))
        print('nieuws…'); items = D.cached('nieuws', 5.9, D.nieuws)
    bosdata = {}
    bf = HIER / 'gegevens' / 'bos.json'
    if bf.exists():
        bosdata = json.loads(bf.read_text())

    _, per_w = D.raster(rows, 0.25)
    _, per_l = D.raster(rows, 0.5)

    alleen = set(x for x in a.alleen.split(',') if x)
    zoek, brandset, brandlijst = [], set(), []
    # eerst brand per dorp (ook nodig voor badges bij buren)
    brand_per = {}
    for d in rows:
        brand_per[d['code']] = branden_bij(d, None, punten, nu) if punten else []
        if any(p['binnen'] for p in brand_per[d['code']]):
            brandset.add(d['code'])
            if any(p['binnen'] and (nu - p['t'].astimezone(WIT)) < timedelta(hours=48) for p in brand_per[d['code']]):
                brandlijst.append(d)

    def op_land(la, lo):
        pt = Point(lo, la)
        return any(geos[j].contains(pt) for j in boom.query(pt))
    bevlijst = recente_bevingen(rows, bev, nu, op_land)

    for i, d in enumerate(rows):
        zoek.append({'n': d['naam'], 'o': d['officieel'] if d['officieel'] != d['naam'] else '', 's': d['slug'],
                     'c': d['kec'], 'g': D.GROEPEN.get(d['groep'], ''), 'b': 1 if d['code'] in brandset else 0})
        if alleen and d['slug'] not in alleen:
            continue
        g = geos[i]
        vak = g.buffer(0.06)
        buren_idx = [j for j in boom.query(vak) if j != i]
        buren = [rows[j] for j in buren_idx if rows[j]['grens']]
        dichtst = sorted((rows[j] for j in buren_idx), key=lambda b: T.km_tussen(d['la'], d['lo'], b['la'], b['lo']))[:4]
        buurlinks = [dict(b, brand=b['code'] in brandset) for b in dichtst]
        wr_raw = wcel.get(per_w[d['code']]) if wcel else None
        nu_d = nu
        wr = weer_bij(wr_raw, nu_d)
        ctx = {
            'br': brand_per[d['code']],
            'bv': bevingen_bij(d, bev, nu),
            'wr': wr,
            'lu': lucht_bij(lcel.get(per_l[d['code']]) if lcel else None, nu),
            'zz': zee_bij(zcel.get(per_w[d['code']]) if zcel else None, wr, nu),
            'nw': nieuws_bij(d, items),
            'laatst': sorted(items or [], key=lambda x: x['t'], reverse=True)[:5],
            'bos': bosdata.get(d['code']), 'bosjaar': int(str(bosdata.get('_versie', 'GFC-2001')).split('-')[1]),
            'buren': buren, 'kust': kust.get(d['kab'], []), 'buurlinks': buurlinks,
            'kust_dorp': aan_kust(d, kust, g), 'eiland': eiland_van(d, kust),
        }
        f = uit / d['slug'] / 'index.html'
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(dorp_html(d, ctx, nu))
        if i % 200 == 0:
            print(' ', i, d['slug'])

    for g in D.GROEPEN:
        f = uit / 'eiland' / g / 'index.html'
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(eiland_html(g, [d for d in rows if d['groep'] == g], nu, brandset))
    (uit / 'index.html').write_text(start_html(D.GROEPEN, brandlijst, nu, bevlijst))
    (uit / 'zoek.json').write_text(json.dumps(zoek, ensure_ascii=False, separators=(',', ':')))
    (uit / 'slugs.json').write_text(json.dumps({d['code']: d['slug'] for d in rows}, separators=(',', ':')))
    shutil.copytree(D.ATLAS, uit / 'atlas')
    shutil.copy(HIER / 'static' / 'dorp.css', uit / 'dorp.css')
    shutil.copy(HIER / 'static' / 'onder.js', uit / 'onder.js')
    shutil.copy(HIER / 'static' / 'kop.js', uit / 'kop.js')
    shutil.copy(HIER / 'static' / 'og.png', uit / 'og.png')
    shutil.copy(HIER / 'static' / 'favicon.svg', uit / 'favicon.svg')
    for f in (HIER / 'static').glob('google*.html'):  # verificatie Google Search Console
        shutil.copy(f, uit / f.name)
    (uit / 'CNAME').write_text('live.moza.nu\n')
    (uit / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
    (uit / '404.html').write_text(pagina('Niet gevonden | Kabar Maluku Live', 'Deze pagina bestaat niet.', '/404.html',
                                         '<main class="w"><section><h2>Dit dorp vinden we niet</h2><p><a href="/">Zoek je dorp →</a></p></section></main>', robots='noindex'))
    dag = nu.strftime('%Y-%m-%d')
    urls = [f'{SITE}/'] + [f'{SITE}/eiland/{g}/' for g in D.GROEPEN] + [f'{SITE}/{d["slug"]}/' for d in rows]
    (uit / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + ''.join(f'<url><loc>{u}</loc><lastmod>{dag}</lastmod></url>\n' for u in urls) + '</urlset>\n')
    print('klaar:', uit)


if __name__ == '__main__':
    main()
