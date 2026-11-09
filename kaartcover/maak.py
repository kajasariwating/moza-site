"""Maakt de cover voor Kaart van de week: een eiland of gebied met de branden van de afgelopen 7 dagen.

Gebruik: python3 maak.py punten.json Tanimbar cover.png [licht]
punten.json = [[lat, lng, klasse, aantal], ...] met klasse 0 = laatste 24 uur, 1 = 1 tot 3 dagen, 2 = 3 tot 7 dagen
(zo haal je ze op: zie README.md in deze map). Uitvoer: PNG van 1500 bij 1000, zonder tekst.
"""
import json, math, sys, pathlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from matplotlib.collections import PatchCollection

# midden (lng, lat) en hoogte in graden
GEBIEDEN = {
    'Tanimbar': (131.33, -7.55, 1.75), 'Aru': (134.45, -6.2, 1.9), 'Kei': (132.75, -5.75, 1.3),
    'Seram': (129.6, -3.15, 1.7), 'Buru': (126.6, -3.4, 1.3), 'Ambon': (128.2, -3.65, 0.6),
    'Halmahera': (128.0, 1.0, 2.6), 'Molukken': (129.5, -4.0, 9.0), 'Zuid-Molukken': (130.3, -5.3, 6.6),
}
KLEUR = {0: '#FF4D2E', 1: '#FF7AB6', 2: '#E9F25A'}
STIJL = {'donker': ('#111111', '#2A2A2E', '#55555C'), 'licht': ('#DCDDE3', '#FFFFFF', '#111111')}

punten, gebied, uit = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
stijl = sys.argv[4] if len(sys.argv) > 4 else 'donker'
cx, cy, h = GEBIEDEN[gebied]
k = math.cos(math.radians(cy)); w = h * 1.5 / k
x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2
zee, land, rand = STIJL[stijl]
schaal = 1.75 / h  # stippen kleiner bij een groot gebied

ringen = json.load(open(pathlib.Path(__file__).with_name('land-molukken.json')))
fig = plt.figure(figsize=(15, 10), dpi=100); ax = fig.add_axes([0, 0, 1, 1]); ax.set_facecolor(zee)
ax.add_collection(PatchCollection([Polygon(r, closed=True) for r in ringen], facecolor=land, edgecolor=rand, linewidth=1.6))
for c in (2, 1, 0):
    P = [p for p in punten if p[2] == c and x0 <= p[1] <= x1 and y0 <= p[0] <= y1]
    if P:
        ax.scatter([p[1] for p in P], [p[0] for p in P], s=[(90 + 55 * min(p[3], 20) ** 0.9) * min(1, schaal) for p in P],
                   c=KLEUR[c], edgecolors='#111111', linewidths=1.8, zorder=5 - c)
ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect(1 / k); ax.axis('off')
fig.savefig(uit, facecolor=zee); plt.close(fig)
print('klaar', uit)
