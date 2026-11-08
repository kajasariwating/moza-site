# live.moza.nu

Een pagina per dorp op de Molukken (2.420 dorpen): brand, weer, lucht, zee, aardbevingen, bos en nieuws, in gewone taal.

## Hoe het werkt
- `bouw.py` maakt de hele site in `_site/`: een pagina per dorp, per eilandgroep, een zoekpagina, `zoek.json` en `sitemap.xml`.
- `data.py` haalt de gegevens op. Faalt een bron, dan valt dat blok weg en blijft de rest staan.
- `taal.py` bevat alle vertaalregels van data naar gewone taal. Grenzen aanpassen? Alleen hier.
- `static/dorp.css` is de vormgeving (MOZA-huisstijl, licht en nacht).
- De workflow `.github/workflows/dorp.yml` bouwt elk uur en zet de site op GitHub Pages.
  Brand en bevingen worden elk uur opgehaald, weer, lucht en zee elke 3 uur, nieuws elke 6 uur.

## Vaste gegevens (`gegevens/`)
- `plaatsen.json`: waar de huizen van elk dorp staan (OpenStreetMap). Zonder dit meten we vanaf het midden van de dorpsgrond.
- `bos.json`: bos in 2000 en verlies per jaar per dorp (Global Forest Change, Universiteit van Maryland).
- Beide maak je met de workflow "live.moza.nu vaste gegevens" (handmatig starten in GitHub → Actions).

## Bronnen
- Grenzen en namen: `kaarten/atlas-maluku` (wilayah_boundaries, MIT).
- Brand: NASA FIRMS (VIIRS) via NASA GIBS.
- Weer, lucht (fijnstof) en zee: Open-Meteo.
- Aardbevingen: USGS. De gevoelde kracht is een schatting (zie `taal.py`).
- Bos: Hansen et al., Global Forest Change.
- Nieuws: moza.nu/lezen.

## Lokaal testen
```
pip install shapely mapbox-vector-tile
python3 dorp/bouw.py --uit _site --alleen ullath,aboru
```
