# Spellen (/spellen)

Twee spellen voor moza.nu, elk als los HTML-bestand:
- `woord.html`: Raad het woord. Eén keer per dag, nieuw woord om 06:00. Met `?test=1` achter het adres verschijnt in Statistieken de knop Begin opnieuw.
   Raad in zes pogingen het woord van de dag. Pogingen worden gecontroleerd met de OpenTaal-woordenlijst (CC BY) plus Molukse en Maleise woorden.
- `puzzel.html`: Kruiswoordpuzzel. Elke dag één makkelijke en één moeilijke puzzel over de Molukken en Molukkers in Nederland. Nieuwe puzzels om 06:00.
- `cover/`: coverafbeeldingen (1500 x 1000) voor de blogberichten.

`spel.js` laadt een spel in een Squarespace-codeblok:

```html
<div class="mz-spel" data-spel="woord"></div>
<script src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/spellen/spel.js"></script>
```

Het spel draait in een iframe (de opmaak van site en spel raken elkaar niet). `spel.js` laat de iframe meegroeien, volgt de nachtmodus (`html.moza-dark`), houdt vensters in beeld en geeft toetsaanslagen door.

## Een wijziging live zetten
1. Pas `woord.html` of `puzzel.html` aan, commit en push.
2. Vervang in het codeblok `COMMIT` door de nieuwe commit-hash.

## Let op
- De volgorde van het woord van de dag hangt af van de woordenlijst in `woord.html`. Voeg je woorden toe, dan verschuift die volgorde. Zet de lijst vast voor de lancering.
- Feiten komen uit moza.nu/jaartallen en de bronnen in de uitleg. Gebruik geen Indonesisch, Indonesië of Indisch in de spellen.
