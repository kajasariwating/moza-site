/* MOZA – Talen van Maluku: kaart van de eigen talen van de Molukken.
   Gegevens: Glottolog 5.3 (CC BY 4.0), glottolog-cldf commit d4d7a2f. Kustlijn afgeleid van wilayah_boundaries (MIT).
   - talen.json: per taal [glottocode, naam, groep, status 0-4, lat, lon, iso, beschrijving, familie, dialecten, verwante talen]
   - land.json: vereenvoudigde kustlijn (polyline)
   Gebruik op een pagina: <script src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/kaarten/talen-maluku/talen-maluku.js" defer></script>
   De kaart komt in <div id="mzt-plek"></div> als die er is, anders bovenaan de pagina. */
(function(){
  if (window.__mzTalen) return; window.__mzTalen = 1;
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC.replace(/[^\/]*$/, '');

  var TG={midden:'Ambon, Lease en Seram',seramlaut:'Oost-Seram en Banda',buru:'Buru en Sula',zuidwest:'Zuidwest-Molukken',kei:'Kei en Tanimbar',aru:'Aru',halmahera:'Zuid-Halmahera',papoea:'Papoea-talen',maleis:'Maleis'};
  var TCOL={midden:'#E9F25A',seramlaut:'#FFB547',buru:'#EDDCB8',zuidwest:'#B9A8FF',kei:'#8FE3B0',aru:'#FF7AB6',halmahera:'#5ED3E0',papoea:'#111111',maleis:'#1F3BD1'};
  var TST=[['Veilig','Kinderen leren de taal nog thuis.'],['Kwetsbaar','Minder kinderen spreken de taal.'],['Bedreigd','Kinderen leren de taal niet meer als moedertaal.'],['Ernstig bedreigd','Vooral ouderen spreken de taal nog.'],['Verdwenen','Niemand spreekt de taal nog als moedertaal.']];
  var TFR=[1,.75,.5,.25,0];
  var START=[[-8.3,124.3],[2.7,135.2]];

  var CSS=[
  '#mzt{--geel:#E9F25A;--bg:#F4F2EC;--fg:#111;--muted:#55534C;--panel:#fff;--line:#111;--shadow:#1F3BD1;--sea:#1F3BD1;--sea-grid:rgba(255,255,255,.16);--land:#F4F2EC;--edge:#111;--lab:#111;--halo:#fff;',
  '--f:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;--fa:"Fraunces",Georgia,serif;',
  'position:relative;width:100%;height:min(86vh,860px);min-height:600px;margin:0 0 32px;font-family:var(--f);color:var(--fg);font-size:15px;line-height:1.45;border:3px solid var(--line);box-sizing:border-box}',
  'html.moza-dark #mzt,html[data-mzdark] #mzt{--bg:#0E0E10;--fg:#F4F2EC;--muted:#B7B4AA;--panel:#17171B;--line:#F4F2EC;--sea:#0A1240;--sea-grid:rgba(255,255,255,.08);--land:#D9D5C9;--edge:#0A0A0A;--lab:#111;--halo:#ECE9DF}',
  '#mzt *{box-sizing:border-box}',
  '#mzt .mzt-map{position:absolute;inset:0;background:var(--sea)}',
  '#mzt .leaflet-container{font-family:var(--f);background:var(--sea)}',
  '#mzt .mzt-panel{position:absolute;z-index:1000;top:16px;left:16px;bottom:16px;width:360px;display:flex;flex-direction:column;background:var(--panel);color:var(--fg);border:3px solid var(--line);box-shadow:7px 7px 0 var(--shadow);overflow:hidden}',
  '#mzt .mzt-scroll{overflow-y:auto;padding:18px 18px 16px;display:flex;flex-direction:column;gap:18px;min-height:0}',
  '#mzt .mzt-eb{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}',
  '#mzt h2.mzt-h{margin:4px 0 0;font-family:var(--f);font-size:30px;line-height:1.02;font-weight:900;letter-spacing:-.02em;color:var(--fg);text-transform:none;text-wrap:balance}',
  '#mzt h2.mzt-h em{font-family:var(--fa);font-style:italic;font-weight:600;letter-spacing:0}',
  '#mzt .mzt-lead{margin:8px 0 0;color:var(--muted);font-size:14px}',
  '#mzt .mzt-stats{display:grid;grid-template-columns:repeat(3,1fr);border:2px solid var(--line)}',
  '#mzt .mzt-stats div{padding:8px 10px;border-right:2px solid var(--line)}#mzt .mzt-stats div:last-child{border-right:0}',
  '#mzt .mzt-stats b{display:block;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.1}',
  '#mzt .mzt-stats span{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}',
  '#mzt .mzt-lbl,#mzt h3.mzt-t{display:block;margin:0 0 6px;font-family:var(--f);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--fg)}',
  '#mzt .mzt-q{width:100%;font:600 16px var(--f);padding:10px 12px;border:2px solid var(--line);background:var(--bg);color:var(--fg);border-radius:0;margin:0}',
  '#mzt .mzt-q:focus{outline:3px solid var(--geel);outline-offset:0}',
  '#mzt .mzt-res{list-style:none;margin:0;padding:0;border:2px solid var(--line);border-top:0;background:var(--panel)}',
  '#mzt .mzt-res[hidden]{display:none}#mzt .mzt-res li{margin:0;padding:0}#mzt .mzt-res li:before{display:none}',
  '#mzt .mzt-res button{display:block;width:100%;text-align:left;padding:8px 12px;border:0;border-top:1px solid rgba(127,127,127,.3);background:none;color:var(--fg);font:600 14px var(--f);cursor:pointer;border-radius:0}',
  '#mzt .mzt-res li:first-child button{border-top:0}',
  '#mzt .mzt-res button:hover,#mzt .mzt-res button:focus-visible{background:var(--geel);color:#111;outline:none}',
  '#mzt .mzt-res .k{display:block;font-size:11.5px;font-weight:400;opacity:.75}',
  '#mzt .mzt-card{border:2px solid var(--line);padding:12px 14px;background:var(--bg)}#mzt .mzt-card[hidden]{display:none}',
  '#mzt .mzt-card .nm{font-size:28px;font-weight:900;line-height:1.05;letter-spacing:-.01em;margin:6px 0 10px}',
  '#mzt .mzt-card dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:5px 12px;margin:0;font-size:13.5px}',
  '#mzt .mzt-card dt{color:var(--muted);margin:0}#mzt .mzt-card dd{margin:0;font-weight:600;min-width:0}',
  '#mzt .mzt-card .x{float:right;border:2px solid var(--line);background:none;color:var(--fg);font:800 12px var(--f);padding:3px 8px;cursor:pointer;border-radius:0}',
  '#mzt .mzt-card .warn{margin:0;font-size:13px}',
  '#mzt .mzt-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border:2px solid #111}',
  '#mzt .mzt-st{display:flex;gap:10px;align-items:center;font-size:14.5px;margin:0 0 10px}',
  '#mzt .tp{line-height:0;display:inline-block}',
  '#mzt .mzt-rels{display:flex;flex-wrap:wrap;gap:4px}',
  '#mzt .mzt-rels button{font:700 12.5px var(--f);padding:2px 7px;border:2px solid var(--line);background:var(--panel);color:var(--fg);cursor:pointer;border-radius:0}',
  '#mzt .mzt-rels button:hover,#mzt .mzt-rels button:focus-visible{background:var(--geel);color:#111;border-color:#111;outline:none}',
  '#mzt .mzt-trow{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:13px}',
  '#mzt .mzt-tstat{display:grid;gap:6px}',
  '#mzt .mzt-groups{display:grid;gap:3px}',
  '#mzt .mzt-grp{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:5px 8px;border:2px solid transparent;background:none;color:var(--fg);font:600 13.5px var(--f);text-align:left;cursor:pointer;border-radius:0}',
  '#mzt .mzt-grp:hover,#mzt .mzt-grp:focus-visible{border-color:var(--line);outline:none}',
  '#mzt .mzt-grp b{font-variant-numeric:tabular-nums}',
  '#mzt .mzt-grp[aria-pressed="false"]{opacity:.38}',
  '#mzt .mzt-hint{font-size:12px;color:var(--muted);margin:4px 0 0}',
  '#mzt .mzt-uitleg{border-top:2px solid var(--line);padding-top:14px;font-size:13.5px}',
  '#mzt .mzt-uitleg p{margin:0 0 8px}#mzt .mzt-uitleg p:last-child{margin:0}',
  '#mzt .mzt-uitleg ul{margin:0;padding:0 0 0 18px;display:grid;gap:8px}#mzt .mzt-uitleg li{margin:0}',
  '#mzt .mzt-uitleg a{color:var(--fg);font-weight:700;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:2px}',
  '#mzt .mzt-foot{font-size:11.5px;color:var(--muted);border-top:2px solid var(--line);padding:10px 18px 12px}#mzt .mzt-foot a{color:inherit}',
  '#mzt .mzt-ro{position:absolute;z-index:1000;left:398px;bottom:16px;background:var(--panel);color:var(--fg);border:2px solid var(--line);box-shadow:4px 4px 0 #111;padding:6px 10px;font:600 12px var(--f);font-variant-numeric:tabular-nums;pointer-events:none;max-width:50%}',
  '#mzt .mzt-cmp{position:absolute;z-index:999;right:16px;top:16px;width:46px;height:58px;pointer-events:none}',
  '#mzt .leaflet-top.leaflet-right{top:82px}',
  '#mzt .leaflet-control-zoom{border:2px solid #111!important;border-radius:0!important;box-shadow:4px 4px 0 #111!important}',
  '#mzt .leaflet-control-zoom a{border-radius:0!important;color:#111!important;background:#fff!important;font-weight:900;text-decoration:none}',
  '#mzt .leaflet-control-zoom a:hover{background:var(--geel)!important}',
  '#mzt .leaflet-control-scale-line{border:2px solid #111!important;border-top:0!important;background:#fff!important;color:#111!important;font:700 11px var(--f)!important}',
  '#mzt .leaflet-control-attribution{display:none}',
  '#mzt .seal{font:italic 600 15px var(--fa);color:rgba(255,255,255,.55);white-space:nowrap;pointer-events:none;letter-spacing:.18em;transform:translate(-50%,-50%)}',
  '#mzt .tm{position:relative}',
  '#mzt .tm .tp{position:absolute;left:-9px;top:-9px;display:block;cursor:pointer}',
  '#mzt .tm.sel .tp{left:-12px;top:-12px;padding:3px;border:3px solid #111;border-radius:50%;background:#fff}',
  '#mzt .tm .tl{position:absolute;left:10px;top:-7px;white-space:nowrap;font:800 12px/14px var(--f);color:var(--lab);display:none;pointer-events:none;text-shadow:0 0 2px var(--halo),0 0 2px var(--halo),0 0 3px var(--halo),0 0 4px var(--halo),1px 1px 0 var(--halo),-1px -1px 0 var(--halo),1px -1px 0 var(--halo),-1px 1px 0 var(--halo)}',
  '#mzt .tm.show .tl{display:block}',
  '#mzt .tm.l .tl{left:auto;right:10px}',
  '#mzt .tm.t .tl{left:0;top:-24px;transform:translateX(-50%)}',
  '#mzt .tm.b .tl{left:0;top:10px;transform:translateX(-50%)}',
  '#mzt .tm.rel .tl{background:#fff;color:#111;border:2px solid #111;padding:1px 5px;text-shadow:none;top:-9px}',
  '#mzt .tm.sel .tl{background:#E9F25A;color:#111;border:2px solid #111;padding:3px 6px;line-height:1;font-size:13px;box-shadow:3px 3px 0 #111;text-shadow:none;top:-11px}',
  '#mzt .tm.sel.l .tl{right:14px}#mzt .tm.sel.t .tl{top:-34px}',
  '#mzt .mzt-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 14px var(--f);color:#fff;letter-spacing:.08em;text-transform:uppercase}',
  '@media (max-width:760px){#mzt{height:auto;min-height:0;display:flex;flex-direction:column;border-left:0;border-right:0}',
  '#mzt .mzt-map{position:relative;inset:auto;height:62vh;min-height:360px;border-bottom:3px solid var(--line)}',
  '#mzt .mzt-panel{position:relative;top:auto;left:auto;bottom:auto;width:auto;border:0;box-shadow:none}',
  '#mzt .mzt-scroll{overflow:visible;padding:18px 16px 16px}#mzt .mzt-foot{padding:10px 16px 14px}',
  '#mzt .mzt-ro{display:none}#mzt .mzt-cmp{top:12px;right:12px;width:38px;height:48px}#mzt .leaflet-top.leaflet-right{top:64px}#mzt h2.mzt-h{font-size:28px}}',
  '@media (prefers-reduced-motion:reduce){#mzt *{transition:none!important;animation:none!important}}'
  ].join('\n');

  var HTML=''+
  '<div class="mzt-map" role="application" aria-label="Kaart van de talen van de Molukken"><div class="mzt-load">Kaart laden…</div></div>'+
  '<svg class="mzt-cmp" viewBox="0 0 46 58" aria-hidden="true"><rect x="1.5" y="1.5" width="43" height="55" fill="#fff" stroke="#111" stroke-width="3"/><text x="23" y="17" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" font-weight="900" font-size="13" fill="#111">N</text><path d="M23 22 L31 48 L23 42 L15 48 Z" fill="#111"/><path d="M23 22 L23 42 L15 48 Z" fill="#E9F25A" stroke="#111" stroke-width="1.5"/></svg>'+
  '<aside class="mzt-panel" aria-label="Kaartinformatie"><div class="mzt-scroll">'+
   '<div><div class="mzt-eb">MOZA · Kaart</div><h2 class="mzt-h">De talen van <em>Maluku</em></h2>'+
   '<p class="mzt-lead">Op de Molukken spreken mensen meer dan honderd eigen talen, met nog veel meer dialecten. Veel daarvan worden steeds minder doorgegeven.</p></div>'+
   '<div class="mzt-stats"><div><b data-t="tot">–</b><span>talen</span></div><div><b data-t="gevaar">–</b><span>in gevaar</span></div><div><b data-t="weg">–</b><span>verdwenen</span></div></div>'+
   '<div><label class="mzt-lbl" for="mzt-q">Zoek een taal of dialect</label><input id="mzt-q" class="mzt-q" type="search" autocomplete="off" placeholder="Bijv. Haruku, Tobelo, Kei"><ul class="mzt-res" hidden></ul></div>'+
   '<article class="mzt-card" hidden aria-live="polite"></article>'+
   '<section><h3 class="mzt-t">Hoe levend is de taal?</h3><div class="mzt-tstat"></div><p class="mzt-hint">Hoe meer de stip gevuld is, hoe meer mensen de taal nog spreken.</p></section>'+
   '<section><h3 class="mzt-t">Taalgroep</h3><div class="mzt-groups"></div><p class="mzt-hint">Klik op een groep om die aan of uit te zetten. Maleis is een omgangstaal en heeft een vierkantje.</p></section>'+
   '<section class="mzt-uitleg"><h3 class="mzt-t">Wat is bahasa tanah?</h3>'+
    '<p>Bahasa tanah betekent letterlijk taal van het land of oertaal. Zo noemen Molukkers hun eigen talen, naast het Maleis dat iedereen spreekt.</p>'+
    '<p>Toch is er niet één bahasa tanah. Het is geen taal die vroeger overal op de Molukken werd gesproken. Het is een verzamelnaam voor al die verschillende talen en dialecten op deze kaart. Soms spreekt het ene dorp een andere taal dan het dorp ernaast.</p>'+
    '<p>De meeste van deze talen zijn wel familie van elkaar, net zoals Nederlands en Duits familie zijn. Ze horen bij de Austronesische taalfamilie, net als het Maleis. De talen van Noord-Halmahera horen bij een andere familie.</p>'+
   '</section>'+
   '<section class="mzt-uitleg"><h3 class="mzt-t">Wist je dat</h3><ul>'+
    '<li>Ternate, Tidore, Tobelo en Galela zijn geen Austronesische talen. Ze horen bij een Papoea-taalfamilie, net als Oirata op Kisar.</li>'+
    '<li>De taal Banda leeft verder op Kei Besar. Bandanezen vluchtten daarheen na de genocide door de VOC in 1621.</li>'+
    '<li>Op Ambon en Lease spreken de meeste mensen nu Ambonees Maleis. Bijna alle eigen talen daar zijn bedreigd of al verdwenen.</li>'+
   '</ul></section>'+
  '</div><div class="mzt-foot">Elke taal is één stip. Dialecten van dezelfde taal vallen eronder. Een stip is het midden van het taalgebied, geen grens. Bron: <a href="https://glottolog.org" target="_blank" rel="noopener">Glottolog 5.3</a> (CC BY 4.0). Kustlijn: <a href="https://github.com/cahyadsn/wilayah_boundaries" target="_blank" rel="noopener">wilayah_boundaries</a> (MIT).</div></aside>'+
  '<div class="mzt-ro">Beweeg over de kaart</div>';

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function dec(str,f){var a=[],i=0,lat=0,lng=0;while(i<str.length){var b,s=0,r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lat+=(r&1)?~(r>>1):(r>>1);s=0;r=0;do{b=str.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5}while(b>=32);lng+=(r&1)?~(r>>1):(r>>1);a.push([lat/f,lng/f])}return a}
  function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')}
  function pie(g,s,r){var c=TCOL[g],f=TFR[s],d=r*2+4,o=r+2,st='stroke:#111;stroke-width:1.6;fill:none',out='<svg width="'+d+'" height="'+d+'" viewBox="0 0 '+d+' '+d+'" aria-hidden="true">';
    if(g==='maleis'){var w=r*1.8,x0=o-w/2,h=w*f;out+='<rect x="'+x0+'" y="'+x0+'" width="'+w+'" height="'+w+'" style="fill:#fff"/>';
      if(f>0)out+='<rect x="'+x0+'" y="'+(x0+w-h)+'" width="'+w+'" height="'+h+'" style="fill:'+c+'"/>';
      return out+'<rect x="'+x0+'" y="'+x0+'" width="'+w+'" height="'+w+'" style="'+st+'"/></svg>'}
    out+='<circle cx="'+o+'" cy="'+o+'" r="'+r+'" style="fill:#fff"/>';
    if(f>=1)out+='<circle cx="'+o+'" cy="'+o+'" r="'+r+'" style="fill:'+c+'"/>';
    else if(f>0){var a=2*Math.PI*f,ex=o+r*Math.sin(a),ey=o-r*Math.cos(a);out+='<path d="M'+o+' '+o+' L'+o+' '+(o-r)+' A'+r+' '+r+' 0 '+(f>.5?1:0)+' 1 '+ex.toFixed(2)+' '+ey.toFixed(2)+' Z" style="fill:'+c+'"/>'}
    return out+'<circle cx="'+o+'" cy="'+o+'" r="'+r+'" style="'+st+(f===0?';stroke-dasharray:2.5 2':'')+'"/></svg>'}
  function inl(el){['fill','stroke'].forEach(function(a){var v=el.getAttribute(a);if(v)el.style.setProperty(a,v,'important')})}
  function inlAll(n){if(!n||n.nodeType!==1)return;if(n.hasAttribute('fill')||n.hasAttribute('stroke'))inl(n);if(n.querySelectorAll)[].forEach.call(n.querySelectorAll('[fill],[stroke]'),inl)}

  function loadLeaflet(cb){
    if(window.L&&window.L.map)return cb();
    if(!document.getElementById('mzb-lcss')){var l=document.createElement('link');l.id='mzb-lcss';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=cb;document.head.appendChild(s)}

  function mount(){
    var host=document.getElementById('mzt-plek');
    var root=document.createElement('div');root.id='mzt';root.innerHTML=HTML;
    /* #moza-kaart: de nachtmodus-hulp van de site (moza-dark-js) laat alles hierbinnen met rust. */
    var wrap=document.createElement('div');wrap.id='moza-kaart';wrap.appendChild(root);
    if(host){host.appendChild(wrap)}else{var m=document.querySelector('main#page')||document.querySelector('main')||document.body;m.insertBefore(wrap,m.firstChild)}
    var st=document.createElement('style');st.id='mzt-css';st.textContent=CSS;document.head.appendChild(st);
    inlAll(root);new MutationObserver(function(ms){ms.forEach(function(m){[].forEach.call(m.addedNodes,inlAll)})}).observe(root,{childList:true,subtree:true});
    var T=null,LAND=null,ready=0;function go(){if(++ready===3)build(root,T,LAND)}
    function fail(e){if(window.console)console.error('MOZA Talen van Maluku',e);var el=root.querySelector('.mzt-load');if(el)el.textContent='De kaart kon niet laden. Probeer het later opnieuw.'}
    loadLeaflet(go);
    fetch(BASE+'talen.json').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(j){T=j;go()}).catch(fail);
    fetch(BASE+'land.json').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(j){LAND=j;go()}).catch(fail);
  }

  function build(root,T,LAND){
    var $=function(s){return root.querySelector(s)};
    var css=function(n){return getComputedStyle(root).getPropertyValue(n).trim()};
    var isPhone=function(){return window.matchMedia('(max-width:760px)').matches};
    $('.mzt-load').remove();
    function padFor(){return isPhone()?{paddingTopLeft:[16,60],paddingBottomRight:[16,40]}:{paddingTopLeft:[420,30],paddingBottomRight:[30,30]}}

    var map=L.map($('.mzt-map'),{zoomControl:false,attributionControl:false,minZoom:5,maxZoom:13,zoomSnap:.25,scrollWheelZoom:!isPhone(),maxBounds:[[-10,122],[4,138]],renderer:L.svg({padding:.5})});
    L.control.zoom({position:'topright',zoomInTitle:'Inzoomen',zoomOutTitle:'Uitzoomen'}).addTo(map);
    L.control.scale({position:'bottomright',imperial:false,maxWidth:120}).addTo(map);
    map.fitBounds(START,padFor());
    var renderer=map.options.renderer,_us=renderer._updateStyle;
    renderer._updateStyle=function(layer){_us.call(this,layer);var p=layer._path,o=layer.options;if(!p)return;
      p.style.setProperty('stroke',o.stroke?o.color:'none','important');p.style.setProperty('fill',o.fill?(o.fillColor||o.color):'none','important')};

    var grid=L.featureGroup().addTo(map);
    function drawGrid(){grid.clearLayers();var c=css('--sea-grid'),v;
      for(v=-10;v<=4;v++)L.polyline([[v,122],[v,138]],{color:c,weight:1.2,interactive:false}).addTo(grid);
      for(v=122;v<=138;v++)L.polyline([[-10,v],[4,v]],{color:c,weight:1.2,interactive:false}).addTo(grid)}
    var land=L.featureGroup().addTo(map);
    LAND.l.forEach(function(s){L.polygon(dec(s,1e4),{interactive:false}).addTo(land)});
    function styleLand(){land.setStyle({fillColor:css('--land'),fillOpacity:1,color:css('--edge'),weight:1.4,opacity:1})}
    [['LAUT BANDA',-5.6,127.6],['LAUT SERAM',-1.95,129.9],['LAUT MALUKU',2.1,125.6],['LAUT HALMAHERA',-0.35,129.4],['LAUT ARAFURA',-7.9,134.2],['SAMUDRA PASIFIK',2.9,130.2]].forEach(function(a){
      L.marker([a[1],a[2]],{interactive:false,keyboard:false,icon:L.divIcon({className:'',html:'<div class="seal">'+a[0]+'</div>',iconSize:[0,0]})}).addTo(map)});

    var talen=T.t.map(function(r){return {id:r[0],n:r[1],g:r[2],s:r[3],la:r[4],lo:r[5],iso:r[6],med:r[7],fam:r[8],dia:r[9],rel:r[10]}});
    var byId={},visible={};Object.keys(TG).forEach(function(g){visible[g]=true});
    var tLayer=L.layerGroup().addTo(map),relLayer=L.layerGroup().addTo(map),sel=null,ro=$('.mzt-ro');
    talen.forEach(function(t){byId[t.id]=t;t._s=norm(t.n);t._d=t.dia.map(norm);
      t._m=L.marker([t.la,t.lo],{keyboard:false,riseOnHover:true,title:t.n,icon:L.divIcon({className:'',iconSize:[0,0],
        html:'<div class="tm"><span class="tp">'+pie(t.g,t.s,7)+'</span><span class="tl">'+esc(t.n)+'</span></div>'})});
      t._m.on('click',function(){select(t,false)});
      t._m.on('mouseover',function(){ro.innerHTML='<b>'+esc(t.n)+'</b> · '+TST[t.s][0].toLowerCase()});
      t._m.addTo(tLayer)});

    var cs=[0,0,0,0,0],cg={};talen.forEach(function(t){cs[t.s]++;cg[t.g]=(cg[t.g]||0)+1});
    $('[data-t="tot"]').textContent=talen.length;$('[data-t="gevaar"]').textContent=cs[1]+cs[2]+cs[3];$('[data-t="weg"]').textContent=cs[4];
    $('.mzt-tstat').innerHTML=TST.map(function(s,i){return '<div class="mzt-trow"><span class="tp">'+pie('midden',i,8)+'</span><span><b>'+s[0]+'</b> · '+s[1].replace(/\.$/,'').toLowerCase()+'</span><b>'+cs[i]+'</b></div>'}).join('');
    var gwrap=$('.mzt-groups');
    function renderGroups(){gwrap.innerHTML='';Object.keys(TG).forEach(function(g){var b=document.createElement('button');b.type='button';b.className='mzt-grp';b.setAttribute('aria-pressed',visible[g]);
      b.innerHTML='<span class="tp">'+pie(g,0,7)+'</span><span>'+TG[g]+'</span><b>'+(cg[g]||0)+'</b>';
      b.onclick=function(){visible[g]=!visible[g];renderGroups();applyVisibility()};gwrap.appendChild(b)})}
    function applyVisibility(){talen.forEach(function(t){var on=visible[t.g]||sel===t;if(on&&!tLayer.hasLayer(t._m))tLayer.addLayer(t._m);if(!on&&tLayer.hasLayer(t._m))tLayer.removeLayer(t._m)});place()}
    renderGroups();

    var _cv=document.createElement('canvas').getContext('2d'),_tw={};
    function textW(s,big){var k=(big?'B':'')+s;if(_tw[k])return _tw[k];_cv.font=(big?'800 13px ':'800 12px ')+'"Hanken Grotesk",system-ui,sans-serif';return _tw[k]=Math.ceil(_cv.measureText(s).width)}
    function place(){
      var z=map.getZoom(),boxes=[],POS=['r','l','t','b'],ov=function(a,o){return !(a[2]<o[0]||a[0]>o[2]||a[3]<o[1]||a[1]>o[3])};
      var vb=map.getBounds().pad(.1),inV=talen.filter(function(t){return tLayer.hasLayer(t._m)&&vb.contains([t.la,t.lo])});
      var relSet={};if(sel)sel.rel.forEach(function(id){relSet[id]=1});
      inV.forEach(function(t){t._pt=map.latLngToContainerPoint([t.la,t.lo]);boxes.push([t._pt.x-7,t._pt.y-7,t._pt.x+7,t._pt.y+7]);
        var el=t._m.getElement();if(el){el.firstChild.classList.remove('show','r','l','t','b','sel','rel');t._m.setZIndexOffset(0)}});
      var minZ=isPhone()?6.75:6.25;
      inV.sort(function(a,b){var pa=(sel===a?0:relSet[a.id]?1:2),pb=(sel===b?0:relSet[b.id]?1:2);return pa-pb||a.s-b.s});
      inV.forEach(function(t){var el=t._m.getElement();if(!el)return;var isS=sel===t,isR=!!relSet[t.id];
        if(isS){el.firstChild.classList.add('sel');t._m.setZIndexOffset(1000)}else if(isR){el.firstChild.classList.add('rel');t._m.setZIndexOffset(800)}
        if(z<minZ&&!isS&&!isR)return;
        var pt=t._pt,w=textW(t.n,isS)+(isS||isR?16:4),h=isS?22:(isR?18:14),cand={r:[pt.x+10,pt.y-h/2,pt.x+10+w,pt.y+h/2],l:[pt.x-10-w,pt.y-h/2,pt.x-10,pt.y+h/2],t:[pt.x-w/2,pt.y-10-h,pt.x+w/2,pt.y-10],b:[pt.x-w/2,pt.y+10,pt.x+w/2,pt.y+10+h]};
        var pick=null;for(var i=0;i<4;i++){var c=cand[POS[i]],pad=[c[0]-2,c[1]-1,c[2]+2,c[3]+1];
          if(isS||!boxes.some(function(o){return ov(pad,o)})){pick=POS[i];break}}
        if(!pick)return;boxes.push(cand[pick]);el.firstChild.classList.add('show',pick);if(!isS&&!isR)t._m.setZIndexOffset(500)})}
    map.on('moveend',place);

    function dms(v,pos,neg){var a=Math.abs(v),d=Math.floor(a),mf=(a-d)*60,m=Math.floor(mf),s=Math.round((mf-m)*60);if(s===60)s=59;return d+'°'+(m<10?'0':'')+m+'′'+(s<10?'0':'')+s+'″ '+(v<0?neg:pos)}
    map.on('mousemove',function(e){var t=e.originalEvent.target;if(t.closest&&t.closest('.tm'))return;ro.textContent=dms(e.latlng.lat,'NB','ZB')+'  '+dms(e.latlng.lng,'OL','WL')});

    var card=$('.mzt-card');
    function clear(){var was=sel;sel=null;relLayer.clearLayers();card.hidden=true;card.innerHTML='';if(was&&!visible[was.g])applyVisibility();else place()}
    function select(t,fly){var was=sel;sel=t;relLayer.clearLayers();
      var rels=t.rel.map(function(id){return byId[id]}).filter(Boolean);
      rels.forEach(function(r){L.polyline([[t.la,t.lo],[r.la,r.lo]],{interactive:false,color:css('--edge'),weight:2.5,dashArray:'6 5',opacity:1}).addTo(relLayer)});
      card.innerHTML='<button class="x" type="button">Sluit</button>'+
        '<span class="mzt-tag" style="background:'+TCOL[t.g]+';color:'+(t.g==='papoea'||t.g==='maleis'?'#fff':'#111')+'">'+TG[t.g]+'</span>'+
        '<div class="nm">'+esc(t.n)+'</div>'+
        '<div class="mzt-st"><span class="tp">'+pie(t.g,t.s,11)+'</span><span><b>'+TST[t.s][0]+'.</b> '+TST[t.s][1]+'</span></div>'+
        '<dl><dt>Familie</dt><dd>'+esc(t.fam)+'</dd>'+
        (t.dia.length?'<dt>Dialecten</dt><dd>'+t.dia.map(esc).join(', ')+'</dd>':'')+
        (rels.length?'<dt>Verwant</dt><dd class="mzt-rels">'+rels.map(function(r){return '<button type="button" data-id="'+r.id+'">'+esc(r.n)+'</button>'}).join('')+'</dd>':'')+
        (t.med?'<dt>Vastgelegd</dt><dd>'+esc(t.med)+'</dd>':'')+
        '<dt>Taalcode</dt><dd>'+(t.iso?esc(t.iso)+' · ':'')+esc(t.id)+'</dd></dl>';
      card.hidden=false;card.querySelector('.x').onclick=clear;
      [].forEach.call(card.querySelectorAll('.mzt-rels button'),function(b){b.onclick=function(){select(byId[b.getAttribute('data-id')],true)}});
      if((was&&!visible[was.g])||!visible[t.g])applyVisibility();
      if(fly){var bb=L.latLngBounds([[t.la,t.lo],[t.la,t.lo]]);rels.forEach(function(r){bb.extend([r.la,r.lo])});
        map.fitBounds(bb.pad(.3),Object.assign({maxZoom:9.5,animate:true},padFor()))}
      else place()}

    var q=$('#mzt-q'),res=$('.mzt-res');
    function search(){var v=norm(q.value);res.innerHTML='';if(!v){res.hidden=true;return []}
      var hits=[];talen.forEach(function(t){if(t._s.indexOf(v)>-1)hits.push({t:t,d:null,p:t._s.indexOf(v)===0?0:1});
        else{var i=-1;t._d.forEach(function(d,k){if(i<0&&d.indexOf(v)>-1)i=k});if(i>-1)hits.push({t:t,d:t.dia[i],p:2})}});
      hits.sort(function(a,b){return a.p-b.p||a.t.n.localeCompare(b.t.n)});hits=hits.slice(0,10);
      if(!hits.length){res.innerHTML='<li><button type="button" disabled>Geen taal of dialect gevonden. Probeer een andere spelling.</button></li>';res.hidden=false;return []}
      hits.forEach(function(h){var li=document.createElement('li'),b=document.createElement('button');b.type='button';
        b.innerHTML=esc(h.t.n)+'<span class="k">'+(h.d?'Dialect '+esc(h.d)+' · ':'')+TG[h.t.g]+'</span>';
        b.onclick=function(){select(h.t,true);res.hidden=true;q.value=h.t.n};li.appendChild(b);res.appendChild(li)});
      res.hidden=false;return hits.map(function(h){return h.t})}
    q.addEventListener('input',search);
    q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var h=search();if(h[0]){select(h[0],true);res.hidden=true;q.value=h[0].n}}if(e.key==='Escape')res.hidden=true});

    function restyle(){drawGrid();grid.bringToBack();styleLand();relLayer.eachLayer(function(l){l.setStyle({color:css('--edge')})})}
    restyle();
    var isDark=function(){var h=document.documentElement;return h.classList.contains('moza-dark')||h.hasAttribute('data-mzdark')},donker=isDark();
    new MutationObserver(function(){var d=isDark();if(d!==donker){donker=d;restyle()}}).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-mzdark']});
    place();
    window.addEventListener('resize',function(){map.invalidateSize();place()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
