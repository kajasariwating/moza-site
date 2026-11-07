# Kaartpagina's

Elke kaart onder /kaarten/... is een eigen Squarespace-pagina. De instellingen van de kaart staan in de code-injectie van die pagina (Pagina-instellingen → Geavanceerd → Header), in `<script id="mzm-cfg">`. Die roept `mzKaart({...})` aan uit de bundel (blok `mzm-js` in bron/header.html).

Hier staat een kopie van die pagina-code. Pas je een kaart aan, zet de nieuwe code dan ook in de pagina zelf.

Een nieuwe kaart:
1. Dupliceer een bestaande kaartpagina in Squarespace en geef hem een nieuwe titel, navigatietitel, URL en SEO-tekst.
2. Zet de nieuwe `mzm-cfg` in de header-injectie van die pagina.
3. Voeg een regel toe aan `MZK.kaarten` (blok `mz-ks-js`), een kleur aan `COL` (blok `mz-kmore-js`), een regel aan `KA` (zoeken) en aan het menu (blok `mztabs-js`).
4. Optioneel: een eigen plaatje voor het overzicht op /kaarten (functie `art` in de header-injectie van de pagina Kaarten).

## Talen van de Molukken (/kaarten/talen-molukken)
Deze kaart gebruikt niet `mzKaart`, maar een eigen script in `kaarten/talen-maluku/`. In `MZK.kaarten` staat `na:'#mzt-kop'`: daarachter zet de site de kennisbalk en de rij Meer kaarten.

## Filters op /kaarten
`kaarten/overzicht/filters.js` voegt filters toe aan het overzicht. Het thema per kaart staat in `MZK.kaarten` (veld `th`: natuur, weer, aarde, geschiedenis, mensen). Een nieuwe kaart heeft dus ook een `th` nodig. Het script staat als `<script id="mzk-filter-js">` in de pagina-injectie van de pagina Kaarten.
