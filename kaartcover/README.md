# Cover voor Kaart van de week

Elke Kaart van de week krijgt als cover een uitsnede van de brandkaart van die week (donker, zonder tekst, 1500 x 1000).

1. Open https://www.moza.nu/kaarten/bosbranden in de browser, klik op "7 dagen" en wacht 3 seconden.
2. Haal de punten op met javascript_tool (vakje rond het gebied: zie GEBIEDEN in maak.py; dit voorbeeld is Tanimbar):

```js
const map=window.__mzktMaps[0],P=[];map.eachLayer(l=>{if(l.getLatLng&&l.getRadius)P.push([l.getLatLng().lat,l.getLatLng().lng,l.options.fillColor])});
const B={s:-8.6,n:-6.4,w:130.4,e:132.4},g={};
P.filter(p=>p[0]>B.s&&p[0]<B.n&&p[1]>B.w&&p[1]<B.e).forEach(p=>{const k=Math.round(p[0]/0.012)+','+Math.round(p[1]/0.012);const c=p[2]==='#FF4D2E'?0:p[2]==='#FF7AB6'?1:2;const o=g[k]||(g[k]={a:0,b:0,n:0,c:9});o.a+=p[0];o.b+=p[1];o.n++;o.c=Math.min(o.c,c)});
JSON.stringify(Object.values(g).map(o=>[+(o.a/o.n).toFixed(3),+(o.b/o.n).toFixed(3),o.c,o.n]))
```

3. Zet de uitvoer in punten.json en maak de cover: `python3 kaartcover/maak.py punten.json Tanimbar cover-kaart-van-de-week-JJJJ-MM-DD.png`
4. Zet de PNG in covers/ in deze repo, commit en push. Dan staat hij op https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@<commit>/kaartcover/covers/<bestand>.png en kun je hem in de browser ophalen om te uploaden.

De kustlijn komt uit Natural Earth (1:10 miljoen, vrij te gebruiken).
