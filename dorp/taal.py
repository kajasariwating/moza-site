"""Vertaalregels: van ruwe data naar gewone taal.

Alle grenzen staan hier op één plek, zodat ze makkelijk na te lopen en aan te passen zijn.
Schrijfregels: B1, 'je', geen komma voor 'en', geen vakwoorden (geen hectare, microgram, km/u).
"""
from datetime import datetime, timedelta, timezone
import math

WIT = timezone(timedelta(hours=9))  # Maluku-tijd (Waktu Indonesia Timur)

DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
DAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus',
           'september', 'oktober', 'november', 'december']

RICHTING = ['het noorden', 'het noordoosten', 'het oosten', 'het zuidoosten',
            'het zuiden', 'het zuidwesten', 'het westen', 'het noordwesten']


# ---------- tijd ----------

def dagdeel(uur):
    if 5 <= uur < 12:
        return 'ochtend'
    if 12 <= uur < 18:
        return 'middag'
    if 18 <= uur < 24:
        return 'avond'
    return 'nacht'


def wanneer(ts, nu):
    """ts en nu als datetime in WIT. Geeft bv. 'gistermiddag', 'vanochtend', 'dinsdagavond', '2 november'."""
    d = (nu.date() - ts.date()).days
    deel = dagdeel(ts.hour)
    if d == 0:
        return {'ochtend': 'vanochtend', 'middag': 'vanmiddag', 'avond': 'vanavond', 'nacht': 'afgelopen nacht'}[deel]
    if d == 1:
        if deel == 'nacht':
            return 'afgelopen nacht' if ts.hour < 5 and nu.hour < 12 else 'de nacht van gisteren'
        return 'gister' + deel
    if d < 7:
        return DAGEN[ts.weekday()] + deel
    return f'{ts.day} {MAANDEN[ts.month - 1]}'


def wanneer_hoofdletter(ts, nu):
    s = wanneer(ts, nu)
    return s[0].upper() + s[1:]


# ---------- afstand ----------

def km_tussen(la1, lo1, la2, lo2):
    r = 6371.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp, dl = p2 - p1, math.radians(lo2 - lo1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def richting(la1, lo1, la2, lo2):
    """Windrichting van punt 1 naar punt 2."""
    y = math.sin(math.radians(lo2 - lo1)) * math.cos(math.radians(la2))
    x = (math.cos(math.radians(la1)) * math.sin(math.radians(la2))
         - math.sin(math.radians(la1)) * math.cos(math.radians(la2)) * math.cos(math.radians(lo2 - lo1)))
    b = (math.degrees(math.atan2(y, x)) + 360) % 360
    return RICHTING[int((b + 22.5) // 45) % 8]


def afstand(km):
    """Afstand in gewone taal. Tot 3 km in looptijd (5 km per uur), daarna in hele kilometers."""
    if km < 0.4:
        return 'vlakbij'
    minuten = km * 12
    if minuten < 10:
        return 'een paar minuten lopen'
    if minuten < 20:
        return 'een kwartier lopen'
    if minuten < 25:
        return 'twintig minuten lopen'
    if minuten < 38:
        return 'een half uur lopen'
    if km <= 3.2:
        return 'drie kwartier lopen'
    return f'ongeveer {round(km)} kilometer'


# ---------- brand ----------

def brand_zekerheid(p):
    """p: dict met 'conf' ('h','n','l') en 'keer' (aantal satellietmetingen binnen 12 uur en 1 km)."""
    if p['conf'] == 'h' or p['keer'] >= 2:
        if p['keer'] >= 2:
            return 'Bijna zeker een brand: meerdere satellieten zagen het.'
        return 'Bijna zeker een brand.'
    if p['conf'] == 'l':
        return 'Niet zeker. Het kan ook een veld zijn dat werd schoongebrand, of iets anders dat heet is.'
    return 'Waarschijnlijk een brand.'


def brand_plek(p):
    if p['binnen']:
        return 'Op de grond van het dorp.'
    return 'Net buiten de grond van het dorp.'


# ---------- lucht (fijnstof PM2.5, gemiddelde per dag) ----------
# Grenzen: WHO-advieswaarde voor een dag is 15. Daarboven merken gevoelige mensen het.

LUCHT = [
    (15, 'gezond', 'Gezond',
     'De lucht is schoon.', ''),
    (35, 'rook', 'Wat rook',
     'Er hangt wat rook of stof. Voor de meeste mensen is dat geen probleem.',
     'Ouderen, mensen met gezondheidsklachten en kinderen blijven beter wat meer binnen.'),
    (75, 'ongezond', 'Ongezond',
     'De lucht is ongezond door rook.',
     'Ouderen, mensen met gezondheidsklachten en kinderen blijven het beste binnen. Iedereen doet het buiten rustig aan.'),
    (1e9, 'zeerongezond', 'Zeer ongezond',
     'De lucht is erg ongezond door rook.',
     'Iedereen blijft zo veel mogelijk binnen, met ramen en deuren dicht. Een mondkapje helpt buiten.'),
]


def lucht(pm):
    for grens, code, label, zin, advies in LUCHT:
        if pm is not None and pm <= grens:
            return {'code': code, 'label': label, 'zin': zin, 'advies': advies}
    return None


# ---------- weer ----------

def weer_woord(code):
    """WMO-weercode naar een woord."""
    if code is None:
        return ''
    if code == 0:
        return 'Zon'
    if code in (1, 2):
        return 'Zon en wolken'
    if code == 3:
        return 'Bewolkt'
    if code in (45, 48):
        return 'Mist'
    if code in (51, 53, 55, 56, 57):
        return 'Motregen'
    if code in (61, 63, 80, 81):
        return 'Regen'
    if code in (65, 82):
        return 'Zware regen'
    if code in (95, 96, 99):
        return 'Onweer'
    return 'Regen'


def hitte(tmax):
    """Maximale temperatuur van een dag. In de tropen is 31 graden gewoon."""
    if tmax is None:
        return None
    if tmax >= 35:
        return ('snikheet', 'Snikheet')
    if tmax >= 33:
        return ('heet', 'Heet')
    return ('normaal', '')


HITTE_ADVIES = 'Drink genoeg en blijf tussen 12 en 3 uur \'s middags in de schaduw.'


# ---------- zee ----------

def golven(m):
    if m is None:
        return None
    if m < 0.5:
        return 'Kleine golven'
    if m < 1.25:
        return 'Wat golven'
    if m < 2.5:
        return 'Hoge golven'
    return 'Zeer hoge golven'


def wind(kmh):
    if kmh is None:
        return None
    if kmh < 12:
        return 'weinig wind'
    if kmh < 29:
        return 'matige wind'
    if kmh < 50:
        return 'harde wind'
    return 'storm'


def zee_onrustig(m, kmh):
    return (m is not None and m >= 1.25) or (kmh is not None and kmh >= 29)


# ---------- aardbevingen ----------
# Geschatte kracht op de plek zelf (Mercalli-schaal), met een eenvoudige vuistregel:
# I = 1,5 x magnitude - 3,5 x log10(afstand tot de haard in km) + 3.
# Dit is een grove schatting. Bodem en bouw maken veel verschil. De pagina zegt daarom 'waarschijnlijk'.
# Vergelijkingen volgen de beschrijvingen van de Mercalli-schaal.

def mmi(mag, km_afstand, diepte_km):
    r = max(5.0, math.sqrt(km_afstand ** 2 + diepte_km ** 2))
    return 1.5 * mag - 3.5 * math.log10(r) + 3.0


VOELBAAR = 2.5  # vanaf hier merken sommige mensen binnen iets


def beving_gevoel(i):
    if i < VOELBAAR:
        return None
    if i < 3.5:
        return ('licht', 'Heel licht. Alleen mensen die stil zitten of liggen merkten het. Alsof er een kleine vrachtwagen langsrijdt.')
    if i < 4.5:
        return ('licht', 'Licht. Te vergelijken met een zware vrachtwagen die vlak langs het huis rijdt: ramen en deuren trillen even.')
    if i < 5.5:
        return ('stevig', 'Stevig. Bijna iedereen voelde het. Spullen kunnen omvallen en slapende mensen worden wakker.')
    if i < 6.5:
        return ('sterk', 'Sterk. Mensen schrikken en gaan naar buiten. Kleine schade aan huizen is mogelijk.')
    return ('zwaar', 'Zwaar. Kans op schade aan huizen. Neem contact op met je familie.')


def hoe_vaak(per_jaar):
    if per_jaar >= 24:
        return 'een paar keer per maand'
    if per_jaar >= 10:
        return 'ongeveer één keer per maand'
    if per_jaar >= 4:
        return 'een paar keer per jaar'
    if per_jaar >= 1:
        return 'ongeveer één keer per jaar'
    return 'minder dan één keer per jaar'


# ---------- bos ----------

def deel_van(fractie):
    """0.125 -> '1 op de 8'."""
    if not fractie or fractie <= 0:
        return None
    n = round(1 / fractie)
    if n <= 1:
        return 'bijna alles'
    if n == 2:
        return 'de helft'
    return f'1 op de {n}'


def voetbalvelden(ha):
    """Een voetbalveld is ongeveer 0,7 hectare."""
    n = ha / 0.714
    if n < 1:
        return 'minder dan een voetbalveld'
    if n < 15:
        return f'{round(n)} voetbalvelden'
    if n < 100:
        return f'{int(round(n, -1))} voetbalvelden'
    return f'{int(round(n, -2))} voetbalvelden'


# ---------- zee: wat het betekent ----------
# Niveau 0 rustig, 1 wat golven, 2 hoge golven, 3 zeer hoog of storm. Golven en wind tellen allebei mee.

def zee_niveau(m, kmh):
    g = 0 if m is None or m < 0.5 else 1 if m < 1.25 else 2 if m < 2.5 else 3
    w = 0 if kmh is None or kmh < 12 else 1 if kmh < 29 else 2 if kmh < 50 else 3
    return max(g, w)


def golf_lichaam(m):
    """Golfhoogte vergeleken met een mens die in het water staat."""
    if m is None:
        return ''
    if m < 0.3:
        return 'bijna vlak'
    if m < 0.6:
        return 'tot je knieën'
    if m < 1.1:
        return 'tot je heupen'
    if m < 1.6:
        return 'tot je schouders'
    if m < 2.1:
        return 'zo hoog als een mens'
    return 'hoger dan een mens'


VISSER = [
    'Goed weer om met een kleine boot de zee op te gaan.',
    'Te doen met een kleine boot, maar het schommelt. Blijf dicht bij de kust.',
    'Niet verstandig met een kleine boot. Blijf aan wal of vaar alleen als het rustig is.',
    'Gevaarlijk voor kleine boten. Blijf aan wal.',
]

OVERSTEEK = [
    'Een rustige overtocht. Ook prima met kinderen en ouderen.',
    'De boot vaart, maar het kan hobbelig zijn. Word je snel zeeziek? Neem iets mee of kies de ferry.',
    'Een flinke schommeltocht. Speedboten varen soms later of niet. Met kinderen of ouderen kies je beter een rustiger moment of de ferry. Vraag bij de haven of er gevaren wordt.',
    'Grote kans dat speedboten niet varen. Ook de ferry kan uitvallen. Vraag bij de haven en stel je reis zo nodig uit.',
]

OVERSTEEK_VOORBEELD = {
    'lease': 'bijvoorbeeld van Tulehu naar Haruku, Saparua of Nusalaut',
}
