# moza-site

Alle eigen code van moza.nu. Sinds 2 november 2026 staat die niet meer in de code-injectie van Squarespace, maar hier.

## Hoe het werkt
- `bron/header.html` en `bron/footer.html`: de code zoals die eerst in de injectie stond. Hier bewerk je.
- `python3 bouw.py` maakt daaruit `dist/header.js` en `dist/footer.js`.
- In Squarespace (Instellingen → Geavanceerd → Code-injectie) staan alleen nog:
  - header: Google-verificatie, de organisatiegegevens (ld+json), de lettertypes en `<script id="mz-bundel-header" src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/dist/header.js">`
  - footer: `<script id="mz-bundel-footer" src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/dist/footer.js">`

## Een wijziging live zetten
1. Bewerk `bron/…`, draai `python3 bouw.py`, commit en push.
2. Vervang in de code-injectie `COMMIT` door de nieuwe commit-hash. Zo krijgt iedereen meteen de nieuwe versie.

## Terug naar de oude situatie
Plak `bron/header.html` en `bron/footer.html` terug in de code-injectie.
