/* MOZA – Kaart van alle negeri in de Midden-Molukken (Ambon, Lease, Seram, Banda).
   Gegevens: cahyadsn/wilayah_boundaries (MIT), commit 2c0d8c7, Kabupaten Maluku Tengah (81.01) en Kota Ambon (81.71).
   Grenzen vereenvoudigd en gecodeerd in negeri.json (polyline, 4 decimalen).
   Gebruik op een pagina: <script src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/kaarten/negeri/negeri.js" defer></script>
   De kaart komt in <div id="mzn-plek"></div> als die er is, anders bovenaan de pagina. */
(function(){
  if (window.__mzNegeri) return; window.__mzNegeri = 1;
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC.replace(/[^\/]*$/, '');

  /* Eigen schrijfwijze. Links de officiële naam uit de brondata, rechts hoe wij hem schrijven. */
  var NAMEN = {
    'Hutumury': 'Hutumuri',
    'Liliboy': 'Lilibooi'
  };

  var GROUPS = {
    ambon:{naam:'Ambon', sub:'Kota Ambon, Leihitu, Salahutu'},
    lease:{naam:'Lease-eilanden', sub:'Haruku, Saparua, Nusalaut'},
    seram:{naam:'Seram', sub:'Zuid- en Noord-Seram (Maluku Tengah)'},
    banda:{naam:'Banda-eilanden', sub:'Banda Neira en omliggende eilanden'}
  };
  var VIEWS = {
    ambon:[[-3.80,127.90],[-3.50,128.36]],
    lease:[[-3.70,128.38],[-3.47,128.86]],
    seram:[[-3.45,128.75],[-2.72,130.12]],
    banda:[[-4.62,129.65],[-4.48,130.08]],
    all:[[-4.65,127.9],[-2.72,130.12]],
    start:[[-3.80,127.92],[-3.42,128.88]]
  };

  var CSS = [
  '#mzn{--blauw:#1F3BD1;--geel:#E9F25A;--roze:#FF7AB6;--rood:#FF4D2E;--ink:#111;',
  '--bg:#F4F2EC;--fg:#111;--muted:#55534C;--panel:#fff;--line:#111;--shadow:#1F3BD1;',
  '--sea:#1F3BD1;--sea-grid:rgba(255,255,255,.16);--ctx:#7F8EE8;--ctx-ink:rgba(255,255,255,.8);',
  '--g-ambon:#E9F25A;--g-lease:#FF7AB6;--g-seram:#F4F2EC;--g-banda:#FF4D2E;--edge:#111;--label-bg:#fff;--label-fg:#111;--hl:#111;',
  '--f:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;--fa:"Fraunces",Georgia,serif;',
  'position:relative;width:100%;height:min(84vh,820px);min-height:560px;margin:0 0 32px;font-family:var(--f);color:var(--fg);font-size:15px;line-height:1.45;border:3px solid var(--line);box-sizing:border-box}',
  'html.moza-dark #mzn,html[data-mzdark] #mzn{--bg:#0E0E10;--fg:#F4F2EC;--muted:#B7B4AA;--panel:#17171B;--line:#F4F2EC;--shadow:#1F3BD1;',
  '--sea:#0A1240;--sea-grid:rgba(255,255,255,.08);--ctx:#26317A;--ctx-ink:rgba(244,242,236,.6);',
  '--g-ambon:#CBD446;--g-lease:#DE639B;--g-seram:#D8D4C8;--g-banda:#E0472A;--edge:#0A0A0A;--label-bg:#17171B;--label-fg:#F4F2EC;--hl:#E9F25A}',
  '#mzn *{box-sizing:border-box}',
  '#mzn .mzn-map{position:absolute;inset:0;background:var(--sea)}',
  '#mzn .leaflet-container{font-family:var(--f);background:var(--sea)}',
  '#mzn .mzn-panel{position:absolute;z-index:1000;top:16px;left:16px;bottom:16px;width:350px;display:flex;flex-direction:column;background:var(--panel);color:var(--fg);border:3px solid var(--line);box-shadow:7px 7px 0 var(--shadow);overflow:hidden}',
  '#mzn .mzn-scroll{overflow-y:auto;padding:18px 18px 16px;display:flex;flex-direction:column;gap:18px;min-height:0}',
  '#mzn .mzn-eb{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}',
  '#mzn h2.mzn-h{margin:4px 0 0;font-family:var(--f);font-size:30px;line-height:1.02;font-weight:900;letter-spacing:-.02em;text-wrap:balance;color:var(--fg);text-transform:none}',
  '#mzn h2.mzn-h em{font-family:var(--fa);font-style:italic;font-weight:600;letter-spacing:0}',
  '#mzn .mzn-lead{margin:8px 0 0;color:var(--muted);font-size:14px}',
  '#mzn .mzn-stats{display:grid;grid-template-columns:repeat(3,1fr);border:2px solid var(--line)}',
  '#mzn .mzn-stats div{padding:8px 10px;border-right:2px solid var(--line)}#mzn .mzn-stats div:last-child{border-right:0}',
  '#mzn .mzn-stats b{display:block;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.1}',
  '#mzn .mzn-stats span{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}',
  '#mzn .mzn-lbl,#mzn h3.mzn-t{display:block;margin:0 0 6px;font-family:var(--f);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--fg)}',
  '#mzn .mzn-q{width:100%;font:600 16px var(--f);padding:10px 12px;border:2px solid var(--line);background:var(--bg);color:var(--fg);border-radius:0;margin:0}',
  '#mzn .mzn-q:focus{outline:3px solid var(--geel);outline-offset:0}',
  '#mzn .mzn-res{list-style:none;margin:0;padding:0;border:2px solid var(--line);border-top:0;background:var(--panel)}',
  '#mzn .mzn-res li{margin:0;padding:0}#mzn .mzn-res li:before{display:none}',
  '#mzn .mzn-res button{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;padding:8px 12px;border:0;border-top:1px solid rgba(127,127,127,.3);background:none;color:var(--fg);font:600 14px var(--f);cursor:pointer;border-radius:0}',
  '#mzn .mzn-res li:first-child button{border-top:0}',
  '#mzn .mzn-res button:hover,#mzn .mzn-res button:focus-visible{background:var(--geel);color:#111;outline:none}',
  '#mzn .mzn-res small{font-weight:400;opacity:.7}',
  '#mzn .mzn-jump{display:flex;flex-wrap:wrap;gap:6px}',
  '#mzn .mzn-jump button{font:800 12px var(--f);text-transform:uppercase;letter-spacing:.06em;padding:7px 10px;border:2px solid var(--line);background:var(--panel);color:var(--fg);cursor:pointer;border-radius:0}',
  '#mzn .mzn-jump button:hover,#mzn .mzn-jump button:focus-visible{background:var(--fg);color:var(--panel);outline:none}',
  '#mzn .mzn-leg section+section{margin-top:14px}',
  '#mzn .mzn-groups{display:grid;gap:4px}',
  '#mzn .mzn-grp{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:10px;width:100%;padding:6px 8px;border:2px solid transparent;background:none;color:var(--fg);font:600 14px var(--f);text-align:left;cursor:pointer;border-radius:0}',
  '#mzn .mzn-grp:hover,#mzn .mzn-grp:focus-visible{border-color:var(--line);outline:none}',
  '#mzn .mzn-grp .sw{width:22px;height:16px;border:2px solid #111}',
  '#mzn .mzn-grp small{font-weight:400;color:var(--muted);display:block;font-size:12px}',
  '#mzn .mzn-grp .n{font-weight:800;font-variant-numeric:tabular-nums}',
  '#mzn .mzn-grp[aria-pressed="false"]{opacity:.38}#mzn .mzn-grp[aria-pressed="false"] .sw{background:transparent!important}',
  '#mzn .mzn-keys{display:grid;gap:7px;font-size:13.5px}',
  '#mzn .mzn-key{display:grid;grid-template-columns:30px 1fr;align-items:center;gap:10px}#mzn .mzn-key svg{display:block}',
  '#mzn .mzn-hint{font-size:12px;color:var(--muted);margin:2px 0 0}',
  '#mzn .mzn-card{border:2px solid var(--line);padding:12px 14px;background:var(--bg)}',
  '#mzn .mzn-card .nm{font-size:26px;font-weight:900;line-height:1.05;letter-spacing:-.01em;margin:2px 0 10px}',
  '#mzn .mzn-card dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0;font-size:13.5px}',
  '#mzn .mzn-card dt{color:var(--muted);margin:0}#mzn .mzn-card dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums;min-width:0}',
  '#mzn .mzn-card .warn{margin:10px 0 0;font-size:12.5px;padding:8px 10px;background:var(--geel);color:#111;border:2px solid #111}',
  '#mzn .mzn-card .x{float:right;border:2px solid var(--line);background:none;color:var(--fg);font:800 12px var(--f);padding:3px 8px;cursor:pointer;border-radius:0}',
  '#mzn .mzn-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border:2px solid #111;color:#111}',
  '#mzn .mzn-foot{font-size:11.5px;color:var(--muted);border-top:2px solid var(--line);padding:10px 18px 12px}#mzn .mzn-foot a{color:inherit}',
  '#mzn .mzn-ro{position:absolute;z-index:1000;left:398px;bottom:16px;background:var(--panel);color:var(--fg);border:2px solid var(--line);box-shadow:4px 4px 0 #111;padding:6px 10px;font:600 12px var(--f);font-variant-numeric:tabular-nums;pointer-events:none;max-width:50%}',
  '#mzn .mzn-cmp{position:absolute;z-index:999;right:16px;top:16px;width:46px;height:58px;pointer-events:none}',
  '#mzn .leaflet-top.leaflet-right{top:82px}',
  '#mzn .leaflet-control-zoom{border:2px solid #111!important;border-radius:0!important;box-shadow:4px 4px 0 #111!important}',
  '#mzn .leaflet-control-zoom a{border-radius:0!important;color:#111!important;background:#fff!important;font-weight:900;text-decoration:none}',
  '#mzn .leaflet-control-zoom a:hover{background:var(--geel)!important}',
  '#mzn .leaflet-control-scale-line{border:2px solid #111!important;border-top:0!important;background:#fff!important;color:#111!important;font:700 11px var(--f)!important}',
  '#mzn .leaflet-control-attribution{display:none}',
  '#mzn .vm{position:relative}',
  '#mzn .vm .dot{position:absolute;left:-3.5px;top:-3.5px;width:7px;height:7px;background:#111;border:1.5px solid #fff;border-radius:50%}',
  '#mzn .vm.kel .dot{border-radius:0}',
  '#mzn .vm .lb{position:absolute;left:7px;top:-9px;white-space:nowrap;font:800 11.5px/1 var(--f);color:var(--label-fg);background:var(--label-bg);padding:3px 5px;border:1.5px solid var(--edge);display:none;pointer-events:none}',
  '#mzn .vm.show .lb{display:block}',
  '#mzn .vm.sel .lb{display:block;background:var(--geel);color:#111;border-color:#111;font-size:13px;box-shadow:3px 3px 0 #111}',
  '#mzn .vm.sel .dot{width:11px;height:11px;left:-5.5px;top:-5.5px;background:var(--rood)}',
  '#mzn .ctxl{font:italic 600 14px var(--fa);color:var(--ctx-ink);white-space:nowrap;pointer-events:none;transform:translate(-50%,-50%)}',
  '#mzn .seal{font:italic 600 15px var(--fa);color:rgba(255,255,255,.55);white-space:nowrap;pointer-events:none;letter-spacing:.18em;transform:translate(-50%,-50%)}',
  '#mzn .mzn-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 14px var(--f);color:#fff;letter-spacing:.08em;text-transform:uppercase}',
  '@media (max-width:760px){#mzn{height:auto;min-height:0;display:flex;flex-direction:column;border-left:0;border-right:0}',
  '#mzn .mzn-map{position:relative;inset:auto;height:62vh;min-height:360px;border-bottom:3px solid var(--line)}',
  '#mzn .mzn-panel{position:relative;top:auto;left:auto;bottom:auto;width:auto;border:0;box-shadow:none}',
  '#mzn .mzn-scroll{overflow:visible;padding:18px 16px 16px}#mzn .mzn-foot{padding:10px 16px 14px}',
  '#mzn .mzn-ro{display:none}#mzn .mzn-cmp{top:12px;right:12px;width:38px;height:48px}#mzn .leaflet-top.leaflet-right{top:64px}#mzn h2.mzn-h{font-size:28px}}',
  '@media (prefers-reduced-motion:reduce){#mzn *{transition:none!important;animation:none!important}}'
  ].join('\n');

  var HTML = ''+
  '<div class="mzn-map" role="application" aria-label="Kaart van de negeri op Ambon, de Lease-eilanden, Seram en Banda"><div class="mzn-load">Kaart laden…</div></div>'+
  '<svg class="mzn-cmp" viewBox="0 0 46 58" aria-hidden="true"><rect x="1.5" y="1.5" width="43" height="55" fill="#fff" stroke="#111" stroke-width="3"/><text x="23" y="17" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" font-weight="900" font-size="13" fill="#111">N</text><path d="M23 22 L31 48 L23 42 L15 48 Z" fill="#111"/><path d="M23 22 L23 42 L15 48 Z" fill="#E9F25A" stroke="#111" stroke-width="1.5"/></svg>'+
  '<aside class="mzn-panel" aria-label="Kaartinformatie"><div class="mzn-scroll">'+
   '<div class="mzn-head"><div class="mzn-eb">MOZA · Kaart</div><h2 class="mzn-h">Alle negeri van de <em>Midden-Molukken</em></h2>'+
   '<p class="mzn-lead">Ambon, de Lease-eilanden, Seram en Banda. Elk vlak is een negeri of een stadswijk, met de echte grenzen.</p></div>'+
   '<div class="mzn-stats"><div><b data-s="tot">–</b><span>totaal</span></div><div><b data-s="desa">–</b><span>negeri</span></div><div><b data-s="kel">–</b><span>kelurahan</span></div></div>'+
   '<div class="mzn-search"><label class="mzn-lbl" for="mzn-q">Zoek een negeri</label><input id="mzn-q" class="mzn-q" type="search" autocomplete="off" placeholder="Bijv. Hila, Kailolo, Tulehu"><ul class="mzn-res" hidden></ul></div>'+
   '<article class="mzn-card" hidden aria-live="polite"></article>'+
   '<div class="mzn-jump" aria-label="Ga naar gebied"><button type="button" data-go="ambon">Ambon</button><button type="button" data-go="lease">Lease</button><button type="button" data-go="seram">Seram</button><button type="button" data-go="banda">Banda</button><button type="button" data-go="all">Alles</button></div>'+
   '<div class="mzn-leg">'+
    '<section><h3 class="mzn-t">Eilandgroep</h3><div class="mzn-groups"></div><p class="mzn-hint">Klik op een groep om die aan of uit te zetten.</p></section>'+
    '<section><h3 class="mzn-t">Soort gebied</h3><div class="mzn-keys">'+
     '<div class="mzn-key"><svg width="30" height="20"><rect x="1" y="1" width="28" height="18" fill="#E9F25A" stroke="#111" stroke-width="2"/><circle cx="15" cy="10" r="3.5" fill="#111" stroke="#fff" stroke-width="1.5"/></svg><span><b>Negeri</b>: dorp met een eigen bestuur. De overheid noemt dit een desa.</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><defs><pattern id="mzn-lgh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#E9F25A"/><rect width="2.4" height="6" fill="#111" fill-opacity=".55"/></pattern></defs><rect x="1" y="1" width="28" height="18" fill="url(#mzn-lgh)" stroke="#111" stroke-width="2"/><rect x="11.5" y="6.5" width="7" height="7" fill="#111" stroke="#fff" stroke-width="1.5"/></svg><span><b>Kelurahan</b>: wijk met een lurah (ambtenaar) als hoofd, vooral in de stad</span></div>'+
    '</div></section>'+
    '<section><h3 class="mzn-t">Lijnen en vlakken</h3><div class="mzn-keys">'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="3.5"/></svg><span>Kust</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="6 3"/></svg><span>Grens kecamatan (district)</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="1" stroke-opacity=".55"/></svg><span>Grens negeri of wijk</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><rect x="1" y="1" width="28" height="18" fill="#7F8EE8" stroke="#111" stroke-width="1"/></svg><span>Buiten deze kaart: buurregio\'s in Maluku</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><rect x="1" y="1" width="28" height="18" fill="#1F3BD1"/><line x1="1" y1="10" x2="29" y2="10" stroke="#fff" stroke-opacity=".4"/><line x1="15" y1="1" x2="15" y2="19" stroke="#fff" stroke-opacity=".4"/></svg><span>Zee, met lijnen per ¼ graad</span></div>'+
    '</div></section>'+
   '</div>'+
  '</div><div class="mzn-foot">Bron: grenzen en codes uit <a href="https://github.com/cahyadsn/wilayah_boundaries" target="_blank" rel="noopener">wilayah_boundaries</a> (open data, MIT-licentie), Kabupaten Maluku Tengah en Kota Ambon. Grenzen zijn vereenvoudigd en niet geschikt voor juridisch gebruik.</div></aside>'+
  '<div class="mzn-ro">Beweeg over de kaart</div>';

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function dec(str,f){var a=[],i=0,lat=0,lng=0;while(i<str.length){var b,s=0,r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lat+=(r&1)?~(r>>1):(r>>1);s=0;r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lng+=(r&1)?~(r>>1):(r>>1);a.push([lat/f,lng/f])}return a}
  function polys(enc,f){return enc.map(function(p){return p.map(function(r){return dec(r,f||1e4)})})}

  function loadLeaflet(cb){
    if (window.L && window.L.map) return cb();
    if (!document.getElementById('mzb-lcss')){var l=document.createElement('link');l.id='mzb-lcss';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=cb;document.head.appendChild(s);
  }

  function mount(){
    var host=document.getElementById('mzn-plek');
    var root=document.createElement('div');root.id='mzn';root.innerHTML=HTML;
    if(host){host.appendChild(root)}else{var m=document.querySelector('main#page')||document.querySelector('main')||document.body;m.insertBefore(root,m.firstChild)}
    var st=document.createElement('style');st.id='mzn-css';st.textContent=CSS;document.head.appendChild(st);
    var data=null,ready=0;
    function go(){if(++ready===2)build(root,data)}
    loadLeaflet(go);
    fetch(BASE+'negeri.json').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(j){data=j;go()})
      .catch(function(e){if(window.console)console.error('MOZA negeri-kaart',e);var el=root.querySelector('.mzn-load');if(el)el.textContent='De kaart kon niet laden. Probeer het later opnieuw.'});
  }

  function build(root,D){
    var $=function(s){return root.querySelector(s)};
    var css=function(n){return getComputedStyle(root).getPropertyValue(n).trim()};
    var isPhone=function(){return window.matchMedia('(max-width:760px)').matches};
    $('.mzn-load').remove();

    var feats=D.v.map(function(r){var off=r[1],eigen=NAMEN[off]||off;return {k:r[0],off:off,n:eigen,kec:r[2],kab:r[3],t:r[4],g:r[5],la:r[6],lo:r[7],geo:polys(r[8])}});

    var map=L.map($('.mzn-map'),{zoomControl:false,attributionControl:false,minZoom:7,maxZoom:16,zoomSnap:.25,scrollWheelZoom:!isPhone(),
      maxBounds:[[-7.5,125],[-1.5,132]],renderer:L.svg({padding:.5})});
    L.control.zoom({position:'topright',zoomInTitle:'Inzoomen',zoomOutTitle:'Uitzoomen'}).addTo(map);
    L.control.scale({position:'bottomright',imperial:false,maxWidth:120}).addTo(map);
    map.fitBounds(VIEWS.start,padFor());
    var renderer=map.options.renderer;

    var grid=L.featureGroup().addTo(map);
    function drawGrid(){grid.clearLayers();var c=css('--sea-grid'),la,lo;
      for(la=-7.5;la<=-1.5;la+=.25)L.polyline([[la,125],[la,132]],{color:c,weight:la%1===0?1.6:1,interactive:false}).addTo(grid);
      for(lo=125;lo<=132;lo+=.25)L.polyline([[-7.5,lo],[-1.5,lo]],{color:c,weight:lo%1===0?1.6:1,interactive:false}).addTo(grid);}

    var ctx=L.featureGroup().addTo(map);
    D.ctx.forEach(function(c){L.polygon(polys(c[1],1e3),{interactive:false}).addTo(ctx)});
    function styleCtx(){ctx.setStyle({fillColor:css('--ctx'),fillOpacity:1,color:css('--edge'),weight:1,opacity:.5})}
    [['Seram Bagian Barat',-3.05,128.35],['Seram Bagian Timur',-3.45,130.55],['Buru',-3.4,126.6]].forEach(function(a){
      L.marker([a[1],a[2]],{interactive:false,keyboard:false,icon:L.divIcon({className:'',html:'<div class="ctxl">'+a[0]+'</div>',iconSize:[0,0]})}).addTo(map)});
    [['LAUT BANDA',-4.15,128.9],['LAUT SERAM',-2.45,128.6]].forEach(function(a){
      L.marker([a[1],a[2]],{interactive:false,keyboard:false,icon:L.divIcon({className:'',html:'<div class="seal">'+a[0]+'</div>',iconSize:[0,0]})}).addTo(map)});

    var visible={ambon:true,lease:true,seram:true,banda:true},selected=null;
    function isSel(f){return selected&&selected.k===f.k}
    function styleFor(f,hover){var sel=isSel(f);
      return {fillColor:f.t==='kel'?'url(#mzn-h-'+f.g+')':css('--g-'+f.g),fillOpacity:1,
        color:sel||hover?css('--hl'):css('--edge'),weight:sel?3.5:(hover?2.5:.7),opacity:sel||hover?1:.55}}

    var vill=L.featureGroup().addTo(map);
    feats.forEach(function(f){
      var l=L.polygon(f.geo,styleFor(f,false));f._l=l;
      l.on('mouseover',function(){if(!isSel(f))l.setStyle(styleFor(f,true));readout(f)});
      l.on('mouseout',function(){l.setStyle(styleFor(f,false))});
      l.on('click',function(){select(f,false)});
      l.addTo(vill);
    });

    function ensureDefs(){var svg=renderer._container;if(!svg||svg.querySelector('#mzn-defs'))return;
      var ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');defs.id='mzn-defs';
      Object.keys(GROUPS).forEach(function(g){var p=document.createElementNS(ns,'pattern');
        p.setAttribute('id','mzn-h-'+g);p.setAttribute('width','7');p.setAttribute('height','7');p.setAttribute('patternUnits','userSpaceOnUse');p.setAttribute('patternTransform','rotate(45)');
        p.innerHTML='<rect width="7" height="7" class="mzn-hb-'+g+'"/><rect width="2.6" height="7" fill="#111" fill-opacity=".45"/>';defs.appendChild(p)});
      svg.insertBefore(defs,svg.firstChild);paintDefs()}
    function paintDefs(){Object.keys(GROUPS).forEach(function(g){[].forEach.call(root.querySelectorAll('.mzn-hb-'+g),function(r){r.setAttribute('fill',css('--g-'+g))})})}
    ensureDefs();

    var kec=L.featureGroup().addTo(map);D.kec.forEach(function(e){L.polyline(polys(e).map(function(p){return p[0]}),{interactive:false}).addTo(kec)});
    var kust=L.polygon(polys(D.kust),{interactive:false,fill:false}).addTo(map);
    function styleLines(){kec.setStyle({color:css('--edge'),weight:2,dashArray:'6 4',opacity:.9});kust.setStyle({color:css('--edge'),weight:3.2,opacity:1})}

    var marks=L.layerGroup().addTo(map);
    feats.forEach(function(f){
      var m=L.marker([f.la,f.lo],{keyboard:false,riseOnHover:true,title:f.n,icon:L.divIcon({className:'',iconSize:[0,0],
        html:'<div class="vm '+(f.t==='kel'?'kel':'desa')+'"><span class="dot"></span><span class="lb">'+esc(f.n)+'</span></div>'})});
      m.on('click',function(){select(f,false)});m.on('mouseover',function(){readout(f)});f._m=m;m.addTo(marks);
      var b=f._l.getBounds();f._a=(b.getNorth()-b.getSouth())*(b.getEast()-b.getWest());
    });
    var order=feats.slice().sort(function(a,b){return b._a-a._a});

    function placeLabels(){
      var z=map.getZoom(),size=map.getSize(),boxes=[],minZ=isPhone()?10.5:10,showDots=z>=(isPhone()?10:8.75);
      var list=selected?[selected].concat(order.filter(function(f){return f!==selected})):order;
      list.forEach(function(f){var el=f._m.getElement();if(!el)return;el.firstChild.classList.remove('show');el.style.display=(visible[f.g]&&showDots)?'':'none'});
      if(z<minZ)return;
      list.forEach(function(f){if(!visible[f.g])return;var el=f._m.getElement();if(!el)return;
        var pt=map.latLngToContainerPoint(f._m.getLatLng());if(pt.x<-50||pt.y<-20||pt.x>size.x+50||pt.y>size.y+20)return;
        var w=f.n.length*7+14,b=[pt.x+5,pt.y-10,pt.x+5+w,pt.y+8];
        if(!isSel(f)&&boxes.some(function(o){return !(b[2]<o[0]||b[0]>o[2]||b[3]<o[1]||b[1]>o[3])}))return;
        boxes.push([b[0]-3,b[1]-2,b[2]+3,b[3]+2]);el.firstChild.classList.add('show')});
    }
    map.on('zoomend moveend',placeLabels);

    function applyVisibility(){feats.forEach(function(f){var on=visible[f.g];
      if(on&&!vill.hasLayer(f._l))vill.addLayer(f._l);if(!on&&vill.hasLayer(f._l))vill.removeLayer(f._l)});placeLabels()}

    function dms(v,pos,neg){var a=Math.abs(v),d=Math.floor(a),mf=(a-d)*60,m=Math.floor(mf),s=Math.round((mf-m)*60);if(s===60)s=59;
      return d+'°'+(m<10?'0':'')+m+'′'+(s<10?'0':'')+s+'″ '+(v<0?neg:pos)}
    var ro=$('.mzn-ro');
    function readout(f){ro.innerHTML='<b>'+esc(f.n)+'</b> · '+esc(f.kec)}
    map.on('mousemove',function(e){var t=e.originalEvent.target;if(t.closest&&t.closest('path.leaflet-interactive,.vm'))return;
      ro.textContent=dms(e.latlng.lat,'NB','ZB')+'  '+dms(e.latlng.lng,'OL','WL')});

    function padFor(){return isPhone()?{paddingTopLeft:[20,60],paddingBottomRight:[20,50]}:{paddingTopLeft:[400,40],paddingBottomRight:[40,40]}}
    var card=$('.mzn-card');
    function select(f,fly){
      var prev=selected;selected=f;
      if(prev){prev._l.setStyle(styleFor(prev,false));var pe=prev._m.getElement();pe&&pe.firstChild.classList.remove('sel');prev._m.setZIndexOffset(0)}
      f._l.setStyle(styleFor(f,false));f._l.bringToFront();kec.bringToFront();kust.bringToFront();
      var e=f._m.getElement();e&&e.firstChild.classList.add('sel');f._m.setZIndexOffset(1000);
      if(!visible[f.g]){visible[f.g]=true;renderGroups();applyVisibility()}
      card.innerHTML='<button class="x" type="button">Sluit</button>'+
        '<span class="mzn-tag" style="background:'+css('--g-'+f.g)+'">'+GROUPS[f.g].naam+'</span>'+
        '<div class="nm">'+esc(f.n)+'</div><dl>'+
        '<dt>Soort</dt><dd>'+(f.t==='kel'?'Kelurahan (wijk)':'Negeri (officieel: desa)')+'</dd>'+
        (f.off!==f.n?'<dt>Officieel</dt><dd>'+esc(f.off)+'</dd>':'')+
        '<dt>Kecamatan</dt><dd>'+esc(f.kec)+'</dd>'+
        '<dt>Bestuur</dt><dd>'+(f.kab==='Kota Ambon'?'Kota Ambon':'Kabupaten Maluku Tengah')+'</dd>'+
        '<dt>Ligging</dt><dd>'+dms(f.la,'NB','ZB')+'<br>'+dms(f.lo,'OL','WL')+'</dd>'+
        '<dt>Code</dt><dd>'+f.k+'</dd></dl>'+
        (f.la<-5?'<p class="warn">Let op: de brondata zet dit gebied ver ten zuiden van Seram. Mogelijk klopt de ligging niet.</p>':'');
      card.hidden=false;card.querySelector('.x').onclick=clearSel;readout(f);
      if(fly)map.fitBounds(f._l.getBounds(),Object.assign({maxZoom:13,animate:true},padFor()));else placeLabels();
    }
    function clearSel(){if(!selected)return;var f=selected;selected=null;f._l.setStyle(styleFor(f,false));
      var e=f._m.getElement();e&&e.firstChild.classList.remove('sel');f._m.setZIndexOffset(0);card.hidden=true;placeLabels()}

    [].forEach.call(root.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(){
      map.fitBounds(L.latLngBounds(VIEWS[b.getAttribute('data-go')]),Object.assign({animate:true},padFor()))})});

    var gwrap=$('.mzn-groups');
    function renderGroups(){gwrap.innerHTML='';Object.keys(GROUPS).forEach(function(g){var o=GROUPS[g];
      var n=feats.filter(function(f){return f.g===g}).length,b=document.createElement('button');
      b.type='button';b.className='mzn-grp';b.setAttribute('aria-pressed',visible[g]);
      b.innerHTML='<span class="sw" style="background:'+css('--g-'+g)+'"></span><span>'+o.naam+'<small>'+o.sub+'</small></span><span class="n">'+n+'</span>';
      b.onclick=function(){visible[g]=!visible[g];renderGroups();applyVisibility()};gwrap.appendChild(b)})}
    renderGroups();
    $('[data-s="tot"]').textContent=feats.length;
    $('[data-s="desa"]').textContent=feats.filter(function(f){return f.t==='desa'}).length;
    $('[data-s="kel"]').textContent=feats.filter(function(f){return f.t==='kel'}).length;

    var q=$('.mzn-q'),res=$('.mzn-res');
    var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')};
    function search(){var v=norm(q.value);res.innerHTML='';if(!v){res.hidden=true;return []}
      var hits=feats.filter(function(f){return norm(f.n).indexOf(v)>-1||norm(f.off).indexOf(v)>-1})
        .sort(function(a,b){return (norm(a.n).indexOf(v)===0?0:1)-(norm(b.n).indexOf(v)===0?0:1)||a.n.localeCompare(b.n)}).slice(0,8);
      if(!hits.length){res.innerHTML='<li><button type="button" disabled>Geen negeri gevonden. Probeer een andere spelling.</button></li>';res.hidden=false;return []}
      hits.forEach(function(f){var li=document.createElement('li'),b=document.createElement('button');b.type='button';
        b.innerHTML=esc(f.n)+' <small>'+esc(f.kec)+'</small>';b.onclick=function(){select(f,true);res.hidden=true;q.value=f.n};li.appendChild(b);res.appendChild(li)});
      res.hidden=false;return hits}
    q.addEventListener('input',search);
    q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var h=search();if(h[0]){select(h[0],true);res.hidden=true;q.value=h[0].n}}if(e.key==='Escape')res.hidden=true});

    function restyle(){drawGrid();grid.bringToBack();styleCtx();feats.forEach(function(f){f._l.setStyle(styleFor(f,false))});styleLines();paintDefs();renderGroups()}
    restyle();
    var donker=null,isDark=function(){var h=document.documentElement;return h.classList.contains('moza-dark')||h.hasAttribute('data-mzdark')};
    donker=isDark();
    new MutationObserver(function(){var d=isDark();if(d!==donker){donker=d;restyle()}}).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-mzdark']});

    map.fitBounds(VIEWS.start,padFor());placeLabels();
    window.addEventListener('resize',function(){map.invalidateSize();placeLabels()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
