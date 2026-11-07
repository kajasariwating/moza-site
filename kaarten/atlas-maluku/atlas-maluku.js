/* MOZA – Atlas Maluku: kaart van alle dorpen van de Molukken (provincies Maluku en Maluku Utara).
   We schrijven 'dorp' (officieel desa), niet negeri: negeri hoort vooral bij Ambon, Lease en Seram. Zie de toelichting in het paneel.
   Gegevens: cahyadsn/wilayah_boundaries (MIT), commit 2c0d8c7. Grenzen vereenvoudigd en gecodeerd (polyline).
   - index.json: alle dorpen als punt (voor zoeken en labels) en per kabupaten een grove omtrek.
   - kab/<code>.json: de echte grenzen per kabupaten. Die laden pas als je inzoomt.
   Gebruik op een pagina: <script src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/kaarten/atlas-maluku/atlas-maluku.js" defer></script>
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

  /* Eilandgroepen. De volgorde is ook de volgorde in de legenda. */
  var GROUPS = {
    ambon:{naam:'Ambon', sub:'Kota Ambon, Leihitu, Salahutu'},
    lease:{naam:'Lease-eilanden', sub:'Haruku, Saparua, Nusalaut'},
    seram:{naam:'Seram', sub:'Met Manipa, Geser en Gorom'},
    buru:{naam:'Buru', sub:'Buru en Buru Selatan'},
    banda:{naam:'Banda-eilanden', sub:'Banda Neira en omliggende eilanden'},
    zuidoost:{naam:'Kei, Aru en Tanimbar', sub:'Zuidoost-Molukken'},
    zuidwest:{naam:'Zuidwest-Molukken', sub:'Wetar, Kisar, Leti, Babar en meer'},
    noord:{naam:'Noord-Molukken', sub:'Halmahera, Ternate, Tidore, Bacan, Sula'}
  };
  var KNOP = {ambon:'Ambon',lease:'Lease',seram:'Seram',buru:'Buru',banda:'Banda',zuidoost:'Kei · Aru · Tanimbar',zuidwest:'Zuidwest',noord:'Noord'};
  var START = [[-3.80,127.92],[-3.42,128.88]];
  var DETAIL_ZOOM = 8.5;
  var PROV = {'81':'Maluku','82':'Maluku Utara'};
  var CSS = [
  '#mzn{--blauw:#1F3BD1;--geel:#E9F25A;--roze:#FF7AB6;--rood:#FF4D2E;--ink:#111;',
  '--bg:#F4F2EC;--fg:#111;--muted:#55534C;--panel:#fff;--line:#111;--shadow:#1F3BD1;',
  '--sea:#1F3BD1;--sea-grid:rgba(255,255,255,.16);--ctx:#7F8EE8;--ctx-ink:rgba(255,255,255,.8);',
  '--g-ambon:#E9F25A;--g-lease:#FF7AB6;--g-seram:#F4F2EC;--g-banda:#FF4D2E;--g-buru:#EDDCB8;--g-zuidoost:#FFB547;--g-zuidwest:#B9A8FF;--g-noord:#8FE3B0;--edge:#111;--label-bg:#fff;--label-fg:#111;--mlab-fg:#111;--mlab-halo:#fff;--hl:#111;',
  '--f:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;--fa:"Fraunces",Georgia,serif;',
  'position:relative;width:100%;height:min(84vh,820px);min-height:560px;margin:0 0 32px;font-family:var(--f);color:var(--fg);font-size:15px;line-height:1.45;border:3px solid var(--line);box-sizing:border-box}',
  'html.moza-dark #mzn,html[data-mzdark] #mzn{--bg:#0E0E10;--fg:#F4F2EC;--muted:#B7B4AA;--panel:#17171B;--line:#F4F2EC;--shadow:#1F3BD1;',
  '--sea:#0A1240;--sea-grid:rgba(255,255,255,.08);--ctx:#26317A;--ctx-ink:rgba(244,242,236,.6);',
  '--g-ambon:#CBD446;--g-lease:#DE639B;--g-seram:#D8D4C8;--g-banda:#E0472A;--g-buru:#C9B994;--g-zuidoost:#D9963A;--g-zuidwest:#9585DB;--g-noord:#6CC08D;--edge:#0A0A0A;--label-bg:#17171B;--label-fg:#F4F2EC;--mlab-fg:#111;--mlab-halo:#ECE9DF;--hl:#E9F25A}',
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
  '#mzn .mzn-why{border-top:2px solid var(--line);padding-top:14px;font-size:13.5px}',
  '#mzn .mzn-why p{margin:0 0 8px}',
  '#mzn .mzn-why a{color:var(--fg);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:2px;font-weight:700}',
  '#mzn .mzn-why .mzn-more{margin:0;color:var(--muted)}',
  '#mzn .pk{position:relative}',
  '#mzn .pk svg{position:absolute;left:-7px;top:-8px;display:block;overflow:visible}',
  'html body #mzn .pk path{fill:#111!important;stroke:#fff!important;stroke-width:1.5}',
  'html body #mzn .pk.v path{fill:#FF4D2E!important;stroke:#111!important}',
  '#mzn .pk .pl{position:absolute;left:9px;top:-9px;white-space:nowrap;font:italic 600 13px/1 var(--fa);color:var(--label-fg);background:var(--label-bg);padding:2px 5px 3px;border:1.5px dashed var(--edge);pointer-events:none}',
  '#mzn .pk .pl b{font:800 11px/1 var(--f);font-style:normal;margin-left:2px;font-variant-numeric:tabular-nums}',
  '#mzn .pk.nolb .pl{display:none}',
  '#mzn .mzn-chk{display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;margin-top:2px}',
  '#mzn .mzn-chk input{width:18px;height:18px;accent-color:#111;margin:0}',
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
  '#mzn .vm .lb{position:absolute;left:6px;top:-7px;white-space:nowrap;font:800 12px/14px var(--f);color:var(--mlab-fg);display:none;pointer-events:none;text-shadow:0 0 2px var(--mlab-halo),0 0 2px var(--mlab-halo),0 0 3px var(--mlab-halo),0 0 3px var(--mlab-halo),0 0 4px var(--mlab-halo),1px 1px 0 var(--mlab-halo),-1px -1px 0 var(--mlab-halo),1px -1px 0 var(--mlab-halo),-1px 1px 0 var(--mlab-halo)}',
  '#mzn .vm.l .lb{left:auto;right:6px}',
  '#mzn .vm.t .lb{left:0;top:-20px;transform:translateX(-50%)}',
  '#mzn .vm.b .lb{left:0;top:6px;transform:translateX(-50%)}',
  '#mzn .vm.show .lb{display:block}',
  '#mzn .vm.sel .lb{display:block;background:var(--geel);color:#111;border:2px solid #111;font-size:13px;line-height:1;padding:3px 6px;box-shadow:3px 3px 0 #111;text-shadow:none}',
  '#mzn .vm.sel.r .lb,#mzn .vm.sel:not(.l):not(.t):not(.b) .lb{top:-11px}',
  '#mzn .vm.sel.t .lb{top:-28px}',
  '#mzn .vm.sel .dot{width:11px;height:11px;left:-5.5px;top:-5.5px;background:var(--rood)}',
  '#mzn .ctxl{font:italic 600 14px var(--fa);color:var(--ctx-ink);white-space:nowrap;pointer-events:none;transform:translate(-50%,-50%)}',
  '#mzn .seal{font:italic 600 15px var(--fa);color:rgba(255,255,255,.55);white-space:nowrap;pointer-events:none;letter-spacing:.18em;transform:translate(-50%,-50%)}',
  '#mzn .mzn-busy{position:absolute;z-index:1000;left:50%;top:16px;transform:translateX(-50%);background:#111;color:#E9F25A;font:800 12px var(--f);letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border:2px solid #E9F25A;pointer-events:none}',
  '#mzn .mzn-busy[hidden]{display:none}',
  '#mzn .mzn-res .k{display:block;font-size:11.5px;font-weight:400;opacity:.7}',
  '#mzn .mzn-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 14px var(--f);color:#fff;letter-spacing:.08em;text-transform:uppercase}',
  '@media (max-width:760px){#mzn{height:auto;min-height:0;display:flex;flex-direction:column;border-left:0;border-right:0}',
  '#mzn .mzn-map{position:relative;inset:auto;height:62vh;min-height:360px;border-bottom:3px solid var(--line)}',
  '#mzn .mzn-panel{position:relative;top:auto;left:auto;bottom:auto;width:auto;border:0;box-shadow:none}',
  '#mzn .mzn-scroll{overflow:visible;padding:18px 16px 16px}#mzn .mzn-foot{padding:10px 16px 14px}',
  '#mzn .mzn-ro{display:none}#mzn .mzn-cmp{top:12px;right:12px;width:38px;height:48px}#mzn .leaflet-top.leaflet-right{top:64px}#mzn h2.mzn-h{font-size:28px}}',
  '@media (prefers-reduced-motion:reduce){#mzn *{transition:none!important;animation:none!important}}'
  ].join('\n');
  var HTML = ''+
  '<div class="mzn-map" role="application" aria-label="Atlas Maluku: kaart van alle dorpen van de Molukken"><div class="mzn-load">Kaart laden…</div></div>'+
  '<div class="mzn-busy" hidden>Grenzen laden…</div>'+
  '<svg class="mzn-cmp" viewBox="0 0 46 58" aria-hidden="true"><rect x="1.5" y="1.5" width="43" height="55" fill="#fff" stroke="#111" stroke-width="3"/><text x="23" y="17" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" font-weight="900" font-size="13" fill="#111">N</text><path d="M23 22 L31 48 L23 42 L15 48 Z" fill="#111"/><path d="M23 22 L23 42 L15 48 Z" fill="#E9F25A" stroke="#111" stroke-width="1.5"/></svg>'+
  '<aside class="mzn-panel" aria-label="Kaartinformatie"><div class="mzn-scroll">'+
   '<div class="mzn-head"><div class="mzn-eb">MOZA · Kaart</div><h2 class="mzn-h">Atlas <em>Maluku</em></h2>'+
   '<p class="mzn-lead">Alle dorpen van de Molukken, van Morotai tot Wetar en van Sula tot Aru. Elk vlak is een dorp of een stadswijk, met de echte grenzen.</p></div>'+
   '<div class="mzn-stats"><div><b data-s="tot">–</b><span>totaal</span></div><div><b data-s="desa">–</b><span>dorpen</span></div><div><b data-s="kel">–</b><span>kelurahan</span></div></div>'+
   '<div class="mzn-search"><label class="mzn-lbl" for="mzn-q">Zoek een dorp</label><input id="mzn-q" class="mzn-q" type="search" autocomplete="off" placeholder="Bijv. Hila, Tulehu, Soahuku"><ul class="mzn-res" hidden></ul></div>'+
   '<article class="mzn-card" hidden aria-live="polite"></article>'+
   '<div><h3 class="mzn-t">Ga naar</h3><div class="mzn-jump" aria-label="Ga naar gebied"></div></div>'+
   '<div class="mzn-leg">'+
    '<section><h3 class="mzn-t">Eilandgroep</h3><div class="mzn-groups"></div><p class="mzn-hint">Klik op een groep om die aan of uit te zetten.</p></section>'+
    '<section><h3 class="mzn-t">Soort gebied</h3><div class="mzn-keys">'+
     '<div class="mzn-key"><svg width="30" height="20"><rect x="1" y="1" width="28" height="18" fill="#E9F25A" stroke="#111" stroke-width="2"/><circle cx="15" cy="10" r="3.5" fill="#111" stroke="#fff" stroke-width="1.5"/></svg><span><b>Dorp</b>: officieel een desa, met een eigen dorpsbestuur</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><defs><pattern id="mzn-lgh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#E9F25A"/><rect width="2.4" height="6" fill="#111" fill-opacity=".55"/></pattern></defs><rect x="1" y="1" width="28" height="18" fill="url(#mzn-lgh)" stroke="#111" stroke-width="2"/><rect x="11.5" y="6.5" width="7" height="7" fill="#111" stroke="#fff" stroke-width="1.5"/></svg><span><b>Kelurahan</b>: wijk met een lurah (ambtenaar) als hoofd, vooral in de stad</span></div>'+
    '</div></section>'+
    '<section><h3 class="mzn-t">Bergen</h3><div class="mzn-keys">'+
     '<div class="mzn-key"><svg width="30" height="20"><path d="M15 3 L24 17 H6 Z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg><span>Bergtop met hoogte in meters</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><path d="M15 3 L24 17 H6 Z" fill="#FF4D2E" stroke="#111" stroke-width="1.5"/></svg><span>Vulkaan met hoogte in meters</span></div>'+
     '<label class="mzn-chk"><input type="checkbox" id="mzn-bergen" checked> Toon bergen</label>'+
    '</div><p class="mzn-hint">Uitgezoomd zie je alleen de hoogste toppen. Hoogtes uit OpenStreetMap, alleen toppen waarvan de hoogte bekend is.</p></section>'+
    '<section><h3 class="mzn-t">Lijnen en vlakken</h3><div class="mzn-keys">'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="3.5"/></svg><span>Kust</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="6 3"/></svg><span>Grens kecamatan (district)</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><line x1="1" y1="10" x2="29" y2="10" stroke="currentColor" stroke-width="1" stroke-opacity=".55"/></svg><span>Grens dorp of wijk</span></div>'+
     '<div class="mzn-key"><svg width="30" height="20"><rect x="1" y="1" width="28" height="18" fill="#1F3BD1"/><line x1="1" y1="10" x2="29" y2="10" stroke="#fff" stroke-opacity=".4"/><line x1="15" y1="1" x2="15" y2="19" stroke="#fff" stroke-opacity=".4"/></svg><span>Zee, met lijnen per graad (ingezoomd per ¼ graad)</span></div>'+
    '</div><p class="mzn-hint">Ver uitgezoomd zie je alleen de eilanden. Zoom in om de grenzen van elk dorp te zien.</p></section>'+
   '</div>'+
   '<section class="mzn-why"><h3 class="mzn-t">Waarom dorp en niet negeri?</h3>'+
    '<p>Op de Molukken heeft een dorp niet overal dezelfde naam. Op Ambon, de Lease-eilanden en Seram zeg je vooral negeri. Op de Kei-eilanden heet een dorp ohoi. In delen van Seram en op de Zuidwestereilanden hoor je ook aman of hena. Elders hebben dorpen een eigen naam in de lokale taal.</p>'+
    '<p>Deze kaart laat alle Molukken zien. Daarom gebruiken we het gewone woord dorp. Zo doen we geen enkele streek tekort. De overheid noemt een dorp desa. Een kelurahan is een wijk met een ambtenaar als hoofd.</p>'+
    '<p class="mzn-more">Lees meer: <a href="/kennisbank/wat-is-een-negeri-en-wat-doet-een-raja-in-de-molukken">Wat is een negeri?</a> en <a href="/kennisbank/waar-ligt-de-eilandengroep-molukken-precies">Waar liggen de Molukken?</a></p></section>'+
  '</div><div class="mzn-foot">Bron: grenzen en codes uit <a href="https://github.com/cahyadsn/wilayah_boundaries" target="_blank" rel="noopener">wilayah_boundaries</a> (open data, MIT-licentie), provincies Maluku en Maluku Utara. Grenzen zijn vereenvoudigd en niet geschikt voor juridisch gebruik. Bergen: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-bijdragers</a> (ODbL).</div></aside>'+
  '<div class="mzn-ro">Beweeg over de kaart</div>';

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function dec(str,f){var a=[],i=0,lat=0,lng=0;while(i<str.length){var b,s=0,r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lat+=(r&1)?~(r>>1):(r>>1);s=0;r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lng+=(r&1)?~(r>>1):(r>>1);a.push([lat/f,lng/f])}return a}
  function polys(enc,f){return enc.map(function(p){return p.map(function(r){return dec(r,f||1e4)})})}

  function inl(el){['fill','stroke'].forEach(function(a){var v=el.getAttribute(a);if(v)el.style.setProperty(a,v,'important')})}
  function inlAll(n){if(!n||n.nodeType!==1)return;if(n.hasAttribute('fill')||n.hasAttribute('stroke'))inl(n);
    if(n.querySelectorAll)[].forEach.call(n.querySelectorAll('[fill],[stroke]'),inl)}
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
    /* De nachtmodus van de site kleurt zwarte SVG-lijnen wit. Inline stijl gaat daar boven. */
    inlAll(root);
    new MutationObserver(function(ms){ms.forEach(function(m){[].forEach.call(m.addedNodes,inlAll)})}).observe(root,{childList:true,subtree:true});
    var data=null,ready=0;
    function go(){if(++ready===2)build(root,data)}
    var bergen=fetch(BASE+'bergen.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null});
    root._bergen=bergen;
    loadLeaflet(go);
    fetch(BASE+'index.json').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(j){data=j;go()})
      .catch(function(e){if(window.console)console.error('MOZA Atlas Maluku',e);var el=root.querySelector('.mzn-load');if(el)el.textContent='De kaart kon niet laden. Probeer het later opnieuw.'});
  }

  function build(root,D){
    var $=function(s){return root.querySelector(s)};
    var css=function(n){return getComputedStyle(root).getPropertyValue(n).trim()};
    var isPhone=function(){return window.matchMedia('(max-width:760px)').matches};
    $('.mzn-load').remove();
    var G=Object.keys(GROUPS);

    /* Kabupaten en dorpen uit de index */
    var KABS={};D.kab.forEach(function(k){KABS[k.k]={k:k.k,n:k.n,b:L.latLngBounds([k.b[0],k.b[1]],[k.b[2],k.b[3]]),o:k.o,state:0,feats:[]}});
    var feats=D.p.map(function(r){var off=r[1];return {k:r[0],off:off,n:NAMEN[off]||off,kec:D.kec[r[2]],t:r[3]?'kel':'desa',g:r[4],la:r[5],lo:r[6],nog:!!r[7],kb:r[0].slice(0,5),_a:0}});
    var byK={};feats.forEach(function(f){byK[f.k]=f;KABS[f.kb].feats.push(f)});

    var map=L.map($('.mzn-map'),{zoomControl:false,attributionControl:false,minZoom:5,maxZoom:16,zoomSnap:.25,scrollWheelZoom:!isPhone(),
      maxBounds:[[-10,123],[4,137]],renderer:L.svg({padding:.5})});
    L.control.zoom({position:'topright',zoomInTitle:'Inzoomen',zoomOutTitle:'Uitzoomen'}).addTo(map);
    L.control.scale({position:'bottomright',imperial:false,maxWidth:120}).addTo(map);
    map.fitBounds(START,padFor());
    var renderer=map.options.renderer;
    var _us=renderer._updateStyle;
    renderer._updateStyle=function(layer){_us.call(this,layer);var p=layer._path,o=layer.options;if(!p)return;
      p.style.setProperty('stroke',o.stroke?o.color:'none','important');
      p.style.setProperty('fill',o.fill?(o.fillColor||o.color):'none','important')};

    /* Lengte- en breedtelijnen */
    var gridMajor=L.featureGroup().addTo(map),gridMinor=L.featureGroup();
    function drawGrid(){gridMajor.clearLayers();gridMinor.clearLayers();var c=css('--sea-grid'),la,lo;
      for(la=-10;la<=4;la+=.25)L.polyline([[la,123],[la,137]],{color:c,weight:la%1===0?1.6:1,interactive:false}).addTo(la%1===0?gridMajor:gridMinor);
      for(lo=123;lo<=137;lo+=.25)L.polyline([[-10,lo],[4,lo]],{color:c,weight:lo%1===0?1.6:1,interactive:false}).addTo(lo%1===0?gridMajor:gridMinor);}
    function gridZoom(){var on=map.getZoom()>=8;if(on&&!map.hasLayer(gridMinor)){gridMinor.addTo(map);gridMinor.bringToBack()}if(!on&&map.hasLayer(gridMinor))map.removeLayer(gridMinor)}

    [['LAUT BANDA',-5.6,127.6],['LAUT SERAM',-2.35,128.9],['LAUT MALUKU',0.9,125.7],['LAUT HALMAHERA',-0.35,129.4],['LAUT ARAFURA',-7.9,134.2],['SAMUDRA PASIFIK',2.9,130.2]].forEach(function(a){
      L.marker([a[1],a[2]],{interactive:false,keyboard:false,icon:L.divIcon({className:'',html:'<div class="seal">'+a[0]+'</div>',iconSize:[0,0]})}).addTo(map)});

    var visible={};G.forEach(function(g){visible[g]=true});
    var selected=null;
    function isSel(f){return selected&&selected.k===f.k}
    function styleFor(f,hover){var sel=isSel(f);
      return {fillColor:f.t==='kel'?'url(#mzn-h-'+f.g+')':css('--g-'+f.g),fillOpacity:1,
        color:sel||hover?css('--hl'):css('--edge'),weight:sel?3.5:(hover?2.5:.7),opacity:sel||hover?1:.55}}

    /* Grove omtrek per kabupaten en eilandgroep (voor uitgezoomd en zolang de grenzen nog laden) */
    var outl=L.featureGroup().addTo(map);
    Object.keys(KABS).forEach(function(kb){var K=KABS[kb];K.out=[];
      Object.keys(K.o).forEach(function(g){var l=L.polygon(polys(K.o[g],1e3),{interactive:false});l._g=g;K.out.push(l);l.addTo(outl)})});
    function styleOut(){outl.eachLayer(function(l){l.setStyle({fillColor:css('--g-'+l._g),fillOpacity:1,color:css('--edge'),weight:1.6,opacity:1})})}

    var vill=L.featureGroup().addTo(map),kec=L.featureGroup().addTo(map),kust=L.featureGroup().addTo(map),marks=L.layerGroup().addTo(map);

    function ensureDefs(){var svg=renderer._container;if(!svg||svg.querySelector('#mzn-defs'))return;
      var ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');defs.id='mzn-defs';
      G.forEach(function(g){var p=document.createElementNS(ns,'pattern');
        p.setAttribute('id','mzn-h-'+g);p.setAttribute('width','7');p.setAttribute('height','7');p.setAttribute('patternUnits','userSpaceOnUse');p.setAttribute('patternTransform','rotate(45)');
        p.innerHTML='<rect width="7" height="7" class="mzn-hb-'+g+'"/><rect width="2.6" height="7" fill="#111" fill-opacity=".45"/>';defs.appendChild(p)});
      svg.insertBefore(defs,svg.firstChild);paintDefs()}
    function paintDefs(){G.forEach(function(g){[].forEach.call(root.querySelectorAll('.mzn-hb-'+g),function(r){var c=css('--g-'+g);r.setAttribute('fill',c);r.style.setProperty('fill',c,'important')})})}
    ensureDefs();

    /* Grenzen per kabupaten laden */
    var busy=$('.mzn-busy'),loading=0;
    function loadKab(kb){var K=KABS[kb];
      if(K.state===2)return Promise.resolve();
      if(K.p)return K.p;
      K.state=1;loading++;busy.hidden=false;
      K.p=fetch(BASE+'kab/'+kb+'.json').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(d){
        d.v.forEach(function(v){var f=byK[v[0]];if(!f)return;
          var l=L.polygon(polys(v[1]),styleFor(f,false));f._l=l;
          var b=l.getBounds();f._a=(b.getNorth()-b.getSouth())*(b.getEast()-b.getWest());
          l.on('mouseover',function(){if(!isSel(f))l.setStyle(styleFor(f,true));readout(f)});
          l.on('mouseout',function(){l.setStyle(styleFor(f,false))});
          l.on('click',function(){select(f,false)});
          if(visible[f.g])l.addTo(vill)});
        d.kec.forEach(function(e){if(e.length)L.polyline(polys(e).map(function(p){return p[0]}),{interactive:false,color:css('--edge'),weight:1.6,dashArray:'5 4',opacity:.85}).addTo(kec)});
        if(d.kust.length)L.polygon(polys(d.kust),{interactive:false,fill:false,color:css('--edge'),weight:2.6,opacity:1}).addTo(kust);
        K.state=2;applyVisibility();ensureDefs();kec.bringToFront();kust.bringToFront();
        if(selected&&selected.kb===kb&&selected._l){selected._l.setStyle(styleFor(selected,false));selected._l.bringToFront()}
      }).catch(function(e){K.state=0;K.p=null;if(window.console)console.error('MOZA Atlas Maluku',kb,e)})
        .then(function(){if(--loading<=0){loading=0;busy.hidden=true}placeLabels()});
      return K.p}
    function loadVisible(){if(map.getZoom()<DETAIL_ZOOM)return;var vb=map.getBounds().pad(.1);
      Object.keys(KABS).forEach(function(kb){if(KABS[kb].b.intersects(vb))loadKab(kb)})}

    /* Punten met naam, alleen voor kabupaten in beeld */
    function markerFor(f){if(f._m)return f._m;
      var m=L.marker([f.la,f.lo],{keyboard:false,riseOnHover:true,title:f.n,icon:L.divIcon({className:'',iconSize:[0,0],
        html:'<div class="vm '+(f.t==='kel'?'kel':'desa')+(isSel(f)?' sel':'')+'"><span class="dot"></span><span class="lb">'+esc(f.n)+'</span></div>'})});
      m.on('click',function(){select(f,false)});m.on('mouseover',function(){readout(f)});f._m=m;return m}

    /* Bergen */
    var peaks=[],peakLayer=L.layerGroup().addTo(map),showPeaks=true;
    function fmtM(e){return e.toLocaleString('nl-NL')+' m'}
    (root._bergen||Promise.resolve(null)).then(function(B){if(!B)return;
      peaks=B.p.map(function(r){return {n:r[0],e:r[1],v:!!r[2],la:r[3],lo:r[4]}});
      peaks.forEach(function(p){
        p._m=L.marker([p.la,p.lo],{keyboard:false,zIndexOffset:500,title:p.n+' ('+fmtM(p.e)+')',icon:L.divIcon({className:'',iconSize:[0,0],
          html:'<div class="pk'+(p.v?' v':'')+'"><svg width="14" height="12" viewBox="0 0 14 12"><path d="M7 1 L13 11 H1 Z"/></svg><span class="pl">'+esc(p.n)+' <b>'+fmtM(p.e)+'</b></span></div>'})});
        p._m.on('click',function(){peakCard(p)});
      });
      placeLabels()});
    function peakMin(z){return z<6.5?2000:z<7.5?1400:z<8.75?800:0}
    function peakCard(p){
      if(selected)clearSel();
      card.innerHTML='<button class="x" type="button">Sluit</button>'+
        '<span class="mzn-tag" style="background:'+(p.v?'#FF4D2E':'#fff')+'">'+(p.v?'Vulkaan':'Berg')+'</span>'+
        '<div class="nm">'+esc(p.n)+'</div><dl>'+
        '<dt>Hoogte</dt><dd>'+fmtM(p.e)+'</dd>'+
        '<dt>Ligging</dt><dd>'+dms(p.la,'NB','ZB')+'<br>'+dms(p.lo,'OL','WL')+'</dd>'+
        '<dt>Bron</dt><dd>OpenStreetMap</dd></dl>';
      card.hidden=false;card.querySelector('.x').onclick=function(){card.hidden=true};
      ro.innerHTML='<b>'+esc(p.n)+'</b> · '+fmtM(p.e)}

    var _cv=document.createElement('canvas').getContext('2d'),_tw={};
    function textW(s,big){var k=(big?'B':'')+s;if(_tw[k])return _tw[k];_cv.font=(big?'800 13px ':'800 12px ')+'"Hanken Grotesk",system-ui,sans-serif';return _tw[k]=Math.ceil(_cv.measureText(s).width)}
    function placeLabels(){
      var z=map.getZoom(),size=map.getSize(),boxes=[],minZ=isPhone()?10.5:10,showDots=z>=(isPhone()?10:8.75);
      var vb=map.getBounds().pad(.15),inView=[];
      if(showDots){Object.keys(KABS).forEach(function(kb){if(KABS[kb].b.intersects(vb))KABS[kb].feats.forEach(function(f){if(visible[f.g]&&vb.contains([f.la,f.lo]))inView.push(f)})})}
      if(selected&&inView.indexOf(selected)<0&&visible[selected.g])inView.push(selected);
      var keep={};inView.forEach(function(f){keep[f.k]=1});
      marks.eachLayer(function(m){if(!keep[m._fk])marks.removeLayer(m)});
      inView.forEach(function(f){var m=markerFor(f);m._fk=f.k;if(!marks.hasLayer(m))marks.addLayer(m)});
      inView.sort(function(a,b){return (isSel(b)?1:0)-(isSel(a)?1:0)||b._a-a._a});
      var POS=['r','l','t','b'];
      inView.forEach(function(f){var el=f._m.getElement();if(el){var c=el.firstChild.classList;c.remove('show','r','l','t','b');if(!isSel(f))f._m.setZIndexOffset(0)}});
      var ov=function(a,o){return !(a[2]<o[0]||a[0]>o[2]||a[3]<o[1]||a[1]>o[3])};
      /* stippen zijn obstakels: een naam mag niet over een andere stip vallen */
      var dots=[];inView.forEach(function(f){var pt=map.latLngToContainerPoint([f.la,f.lo]);f._pt=pt;dots.push({f:f,b:[pt.x-5,pt.y-5,pt.x+5,pt.y+5]})});
      /* bergen gaan voor: hoogste eerst */
      var pmin=peakMin(z),vbp=map.getBounds();
      peaks.slice().sort(function(a,b){return b.e-a.e}).forEach(function(p){
        var want=showPeaks&&p.e>=pmin&&vbp.contains([p.la,p.lo]);
        if(!want){if(peakLayer.hasLayer(p._m))peakLayer.removeLayer(p._m);return}
        var pt=map.latLngToContainerPoint([p.la,p.lo]),w=textW(p.n+' '+p.e+' m.',true)+12,bx=[pt.x-7,pt.y-9,pt.x+10+w,pt.y+9];
        var hit=boxes.some(function(o){return ov(bx,o)})||(z>=minZ&&dots.some(function(d){return ov(bx,d.b)}));
        if(!peakLayer.hasLayer(p._m))peakLayer.addLayer(p._m);
        var el=p._m.getElement();if(el)el.firstChild.classList.toggle('nolb',hit);
        boxes.push(hit?[pt.x-7,pt.y-8,pt.x+7,pt.y+5]:bx)});
      if(z<minZ)return;
      inView.forEach(function(f){var el=f._m.getElement();if(!el)return;
        var pt=f._pt;if(pt.x<-50||pt.y<-20||pt.x>size.x+50||pt.y>size.y+20)return;
        var w=textW(f.n,isSel(f))+(isSel(f)?16:4),h=isSel(f)?22:14,cand={
          r:[pt.x+6,pt.y-h/2,pt.x+6+w,pt.y+h/2],l:[pt.x-6-w,pt.y-h/2,pt.x-6,pt.y+h/2],
          t:[pt.x-w/2,pt.y-6-h,pt.x+w/2,pt.y-6],b:[pt.x-w/2,pt.y+6,pt.x+w/2,pt.y+6+h]};
        var pick=null;
        for(var i=0;i<POS.length;i++){var c=cand[POS[i]],pad=[c[0]-2,c[1]-1,c[2]+2,c[3]+1];
          if(isSel(f)||(!boxes.some(function(o){return ov(pad,o)})&&!dots.some(function(d){return d.f!==f&&ov(pad,d.b)}))){pick=POS[i];break}}
        if(!pick)return;
        boxes.push(cand[pick]);el.firstChild.classList.add('show',pick);
        if(!isSel(f))f._m.setZIndexOffset(600)});
    }
    function detailOn(){return map.getZoom()>=DETAIL_ZOOM}
    var detShown=true;
    function detailZoom(){var on=detailOn();if(on===detShown)return;detShown=on;
      [vill,kec,kust].forEach(function(l){if(on&&!map.hasLayer(l))l.addTo(map);if(!on&&map.hasLayer(l))map.removeLayer(l)});
      if(on){kec.bringToFront();kust.bringToFront()}applyVisibility()}
    map.on('moveend',function(){gridZoom();detailZoom();loadVisible();placeLabels()});

    function applyVisibility(){
      feats.forEach(function(f){if(!f._l)return;var on=visible[f.g];
        if(on&&!vill.hasLayer(f._l))vill.addLayer(f._l);if(!on&&vill.hasLayer(f._l))vill.removeLayer(f._l)});
      var det=detailOn();
      Object.keys(KABS).forEach(function(kb){var K=KABS[kb];K.out.forEach(function(l){var on=visible[l._g]&&!(det&&K.state===2);
        if(on&&!outl.hasLayer(l))outl.addLayer(l);if(!on&&outl.hasLayer(l))outl.removeLayer(l)})});
      placeLabels()}

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
      if(prev&&prev!==f){if(prev._l)prev._l.setStyle(styleFor(prev,false));var pe=prev._m&&prev._m.getElement();pe&&pe.firstChild.classList.remove('sel');prev._m&&prev._m.setZIndexOffset(0)}
      if(f._l){f._l.setStyle(styleFor(f,false));f._l.bringToFront();kec.bringToFront();kust.bringToFront()}
      var m=markerFor(f);m._fk=f.k;if(!marks.hasLayer(m))marks.addLayer(m);
      var e=m.getElement();e&&e.firstChild.classList.add('sel');m.setZIndexOffset(1000);
      if(!visible[f.g]){visible[f.g]=true;renderGroups();applyVisibility()}
      var K=KABS[f.kb];
      card.innerHTML='<button class="x" type="button">Sluit</button>'+
        '<span class="mzn-tag" style="background:'+css('--g-'+f.g)+'">'+GROUPS[f.g].naam+'</span>'+
        '<div class="nm">'+esc(f.n)+'</div><dl>'+
        '<dt>Soort</dt><dd>'+(f.t==='kel'?'Kelurahan (wijk)':'Dorp (desa)')+'</dd>'+
        (f.off!==f.n?'<dt>Officieel</dt><dd>'+esc(f.off)+'</dd>':'')+
        '<dt>Kecamatan</dt><dd>'+esc(f.kec)+'</dd>'+
        '<dt>Bestuur</dt><dd>'+esc(K.n)+'</dd>'+
        '<dt>Provincie</dt><dd>'+PROV[f.k.slice(0,2)]+'</dd>'+
        '<dt>Ligging</dt><dd>'+dms(f.la,'NB','ZB')+'<br>'+dms(f.lo,'OL','WL')+'</dd>'+
        '<dt>Code</dt><dd>'+f.k+'</dd></dl>'+
        (f.nog?'<p class="warn">De brondata heeft voor dit dorp geen grens. De stip geeft de ligging bij benadering.</p>':'')+
        (f.kb==='81.01'&&f.la<-5?'<p class="warn">Let op: de brondata zet dit gebied ver ten zuiden van Seram. Mogelijk klopt de ligging niet.</p>':'');
      card.hidden=false;card.querySelector('.x').onclick=clearSel;readout(f);
      if(fly){
        loadKab(f.kb).then(function(){
          if(f._l){f._l.setStyle(styleFor(f,false));f._l.bringToFront();kec.bringToFront();kust.bringToFront();map.fitBounds(f._l.getBounds(),Object.assign({maxZoom:13,animate:true},padFor()))}
          else map.setView([f.la,f.lo],12);
        });
      } else placeLabels();
    }
    function clearSel(){if(!selected)return;var f=selected;selected=null;if(f._l)f._l.setStyle(styleFor(f,false));
      var e=f._m&&f._m.getElement();e&&e.firstChild.classList.remove('sel');f._m&&f._m.setZIndexOffset(0);card.hidden=true;placeLabels()}

    /* Ga naar: per eilandgroep */
    var GB={};feats.forEach(function(f){if(f.kb==='81.01'&&f.la<-5)return;(GB[f.g]=GB[f.g]||L.latLngBounds([f.la,f.lo],[f.la,f.lo])).extend([f.la,f.lo])});
    var jump=$('.mzn-jump');
    G.concat(['all']).forEach(function(g){var b=document.createElement('button');b.type='button';b.textContent=g==='all'?'Alles':KNOP[g];
      b.onclick=function(){var bb=g==='all'?L.latLngBounds(feats.map(function(f){return [f.la,f.lo]})):GB[g];
        if(g!=='all'&&!visible[g]){visible[g]=true;renderGroups();applyVisibility()}
        map.fitBounds(bb.pad(.05),Object.assign({animate:true},padFor()))};jump.appendChild(b)});

    var gwrap=$('.mzn-groups');
    function renderGroups(){gwrap.innerHTML='';G.forEach(function(g){var o=GROUPS[g];
      var n=feats.filter(function(f){return f.g===g}).length,b=document.createElement('button');
      b.type='button';b.className='mzn-grp';b.setAttribute('aria-pressed',visible[g]);
      b.innerHTML='<span class="sw" style="background:'+css('--g-'+g)+'"></span><span>'+o.naam+'<small>'+o.sub+'</small></span><span class="n">'+n.toLocaleString('nl-NL')+'</span>';
      b.onclick=function(){visible[g]=!visible[g];renderGroups();applyVisibility()};gwrap.appendChild(b)})}
    renderGroups();
    $('#mzn-bergen').addEventListener('change',function(e){showPeaks=e.target.checked;placeLabels()});
    $('[data-s="tot"]').textContent=feats.length.toLocaleString('nl-NL');
    $('[data-s="desa"]').textContent=feats.filter(function(f){return f.t==='desa'}).length.toLocaleString('nl-NL');
    $('[data-s="kel"]').textContent=feats.filter(function(f){return f.t==='kel'}).length.toLocaleString('nl-NL');

    var q=$('.mzn-q'),res=$('.mzn-res');
    var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')};
    feats.forEach(function(f){f._s=norm(f.n);f._o=norm(f.off)});
    function search(){var v=norm(q.value);res.innerHTML='';if(!v){res.hidden=true;return []}
      var hits=feats.filter(function(f){return f._s.indexOf(v)>-1||f._o.indexOf(v)>-1})
        .sort(function(a,b){return (a._s.indexOf(v)===0?0:1)-(b._s.indexOf(v)===0?0:1)||a.n.localeCompare(b.n)}).slice(0,10);
      if(!hits.length){res.innerHTML='<li><button type="button" disabled>Geen dorp gevonden. Probeer een andere spelling.</button></li>';res.hidden=false;return []}
      hits.forEach(function(f){var li=document.createElement('li'),b=document.createElement('button');b.type='button';
        b.innerHTML='<span>'+esc(f.n)+'<span class="k">'+esc(f.kec)+' · '+esc(KABS[f.kb].n.replace(/^Kabupaten /,''))+'</span></span>';
        b.onclick=function(){select(f,true);res.hidden=true;q.value=f.n};li.appendChild(b);res.appendChild(li)});
      res.hidden=false;return hits}
    q.addEventListener('input',search);
    q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var h=search();if(h[0]){select(h[0],true);res.hidden=true;q.value=h[0].n}}if(e.key==='Escape')res.hidden=true});

    function restyle(){drawGrid();gridMajor.bringToBack();styleOut();
      feats.forEach(function(f){if(f._l)f._l.setStyle(styleFor(f,false))});
      kec.setStyle({color:css('--edge')});kust.setStyle({color:css('--edge')});paintDefs();renderGroups()}
    restyle();gridZoom();
    var donker=null,isDark=function(){var h=document.documentElement;return h.classList.contains('moza-dark')||h.hasAttribute('data-mzdark')};
    donker=isDark();
    new MutationObserver(function(){var d=isDark();if(d!==donker){donker=d;restyle()}}).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-mzdark']});

    detailZoom();loadVisible();placeLabels();
    window.addEventListener('resize',function(){map.invalidateSize();placeLabels()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
