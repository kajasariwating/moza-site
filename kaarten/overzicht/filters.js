/* MOZA – filters op de overzichtspagina /kaarten.
   Draait naast mzk-js (de pagina-injectie van Kaarten), die de tegels bouwt uit MZK.kaarten.
   Het thema per kaart staat in MZK.kaarten (veld th) in bron/header.html.
   Ook: een eigen plaatje voor de tegel van Talen van de Molukken.
   Gebruik in de pagina-injectie van /kaarten:
   <script id="mzk-filter-js" src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/kaarten/overzicht/filters.js" defer></script> */
(function(){
  if(window.__mzkFilter)return;window.__mzkFilter=1;
  if(location.pathname.replace(/\/+$/,'')!=='/kaarten')return;

  var TH=[
    {id:'natuur',n:'Natuur',c:'#E9F25A'},
    {id:'weer',n:'Weer en zee',c:'#1F3BD1'},
    {id:'aarde',n:'Aardbevingen en vulkanen',kort:'Beven en vulkanen',c:'#FF4D2E'},
    {id:'geschiedenis',n:'Geschiedenis',c:'#EDDCB8'},
    {id:'mensen',n:'Mensen en reizen',c:'#FF7AB6'}
  ];
  var SOORT=[{id:'alle',n:'Alle'},{id:'live',n:'Live'},{id:'vast',n:'Vast'}];

  var CSS=[
  '#mzk .k-fil{display:flex;flex-direction:column;gap:12px;margin:0 0 26px;padding:16px 18px;border:3px solid var(--line);background:var(--soft);box-shadow:6px 6px 0 #1F3BD1}',
  '#mzk .k-fr{display:flex;align-items:center;gap:14px;min-width:0}',
  '#mzk .k-fl{flex:none;width:64px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}',
  '#mzk .k-chips{display:flex;flex-wrap:wrap;gap:8px;min-width:0}',
  '#mzk .k-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:2px solid var(--line);background:var(--card);color:var(--fg);font:800 15px/1 "Hanken Grotesk",system-ui,sans-serif;cursor:pointer;border-radius:0;white-space:nowrap;-webkit-tap-highlight-color:transparent}',
  '#mzk .k-chip i{width:12px;height:12px;flex:none;border:2px solid #111;display:inline-block}',
  '#mzk .k-chip small{font-size:12px;font-weight:700;opacity:.65;font-variant-numeric:tabular-nums}',
  '#mzk .k-chip:hover{box-shadow:3px 3px 0 #FF7AB6}',
  '#mzk .k-chip[aria-pressed="true"]{background:#111;color:#E9F25A;border-color:#111;box-shadow:3px 3px 0 #FF7AB6}',
  'html.moza-dark #mzk .k-chip[aria-pressed="true"]{background:#E9F25A;color:#111;border-color:#E9F25A}',
  '#mzk .k-chip[aria-pressed="true"] small{opacity:1}',
  '#mzk .k-chip:focus-visible{outline:3px solid #1F3BD1;outline-offset:2px}',
  '#mzk .k-chip:disabled{opacity:.4;cursor:default;box-shadow:none}',
  '#mzk .k-seg{display:inline-flex;border:2px solid var(--line);background:var(--card)}',
  '#mzk .k-seg .k-chip{border:0;min-width:72px;justify-content:center}',
  '#mzk .k-seg .k-chip+.k-chip{border-left:2px solid var(--line)}',
  '#mzk .k-seg .k-chip[aria-pressed="true"]{box-shadow:none}',
  '#mzk .k-seg .k-lv{width:9px;height:9px;border:0;border-radius:50%;background:#FF4D2E}',
  '#mzk .k-none{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;padding:22px;border:3px dashed var(--line);font-size:17px;font-weight:700}',
  '#mzk .k-none[hidden],#mzk .k-card[hidden]{display:none!important}',
  '#mzk .k-reset{min-height:44px;padding:0 16px;border:3px solid #111;background:#111;color:#fff;font:800 15px "Hanken Grotesk",system-ui,sans-serif;cursor:pointer;border-radius:0}',
  '#mzk .k-reset:hover{background:#1F3BD1;border-color:#1F3BD1}',
  '@media (max-width:760px){',
  ' #mzk .k-fil{margin:0 -20px 22px;padding:14px 0 14px;border-left:0;border-right:0;box-shadow:none;gap:10px}',
  ' #mzk .k-fr{flex-direction:column;align-items:stretch;gap:6px}',
  ' #mzk .k-fl{width:auto;padding:0 20px}',
  ' #mzk .k-chips{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x proximity;scroll-padding-inline:20px;padding:2px 20px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}',
  ' #mzk .k-chips::-webkit-scrollbar{display:none}',
  ' #mzk .k-chips .k-chip{scroll-snap-align:start}',
  ' #mzk .k-seg{margin:0 20px;display:flex}',
  ' #mzk .k-seg .k-chip{flex:1 1 0;min-width:0}',
  '}'
  ].join('\n');

  var TALEN_ART='<svg viewBox="0 0 320 180" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><g fill="#EDDCB8" opacity=".95"><path d="M40 112c14-10 34-12 52-6 10 3 14 12 6 16-16 8-42 8-56 2-6-3-7-8-2-12z"/><path d="M128 84c20-6 44-4 60 4 8 4 6 12-4 14-18 3-40 2-56-4-8-3-8-11 0-14z"/><path d="M214 118c10-6 26-6 36 0 6 4 2 10-6 11-10 2-24 1-30-3-4-3-4-6 0-8z"/><path d="M236 58c8-4 18-3 24 2 3 3 0 7-5 7-7 1-15 0-19-3-3-2-3-4 0-6z"/></g>'+
    '<g stroke="#111" stroke-width="2.5" stroke-linejoin="round"><path d="M40 38h62v28H66l-12 11v-11H40z" fill="#E9F25A"/><path d="M196 30h78v28h-14v11l-12-11h-52z" fill="#FF7AB6"/><path d="M112 128h66v26h-38l-12 10v-10h-16z" fill="#fff"/></g>'+
    '<g fill="#111"><rect x="48" y="47" width="30" height="4"/><rect x="48" y="55" width="44" height="4"/><rect x="204" y="39" width="54" height="4"/><rect x="204" y="47" width="36" height="4"/><rect x="120" y="136" width="40" height="4"/><rect x="120" y="144" width="26" height="4"/></g>'+
    '<g stroke="#111" stroke-width="1.6"><circle cx="70" cy="110" r="6" fill="#E9F25A"/><path d="M150 82 L150 88 A6 6 0 0 1 144 88 Z" fill="#FFB547"/><circle cx="150" cy="88" r="6" fill="none"/><circle cx="232" cy="122" r="6" fill="#fff" stroke-dasharray="2.5 2"/><circle cx="246" cy="60" r="5" fill="#111"/></g></svg>';

  function gc(x){try{if(window.MZ&&MZ.gc)MZ.gc(x)}catch(e){}}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  function init(){
    var mzk=document.getElementById('mzk'),grid=mzk&&mzk.querySelector('.k-grid'),h2=mzk&&mzk.querySelector('#mzk-h');
    if(!grid||!h2||!window.MZK)return false;
    if(mzk.querySelector('.k-fil'))return true;
    var st=document.createElement('style');st.id='mzk-filter-css';st.textContent=CSS;document.head.appendChild(st);

    var byU={};MZK.kaarten.forEach(function(k){byU[k.u]=k});
    var cards=[].slice.call(grid.querySelectorAll('a.k-card')).map(function(a){var k=byU[a.getAttribute('href')]||{};
      if(k.u==='/kaarten/talen-molukken'){var m=a.querySelector('.k-map svg');if(m)m.outerHTML=TALEN_ART}
      return {el:a,th:k.th||'',live:!!k.live}});
    function count(th,so){return cards.filter(function(c){return (!th||c.th===th)&&(so==='alle'||(so==='live')===c.live)}).length}

    var state={th:'',so:'alle'};
    var m=(location.hash||'').replace('#','').split('-');
    TH.forEach(function(t){if(m.indexOf(t.id)>-1)state.th=t.id});
    if(m.indexOf('live')>-1)state.so='live';else if(m.indexOf('vast')>-1)state.so='vast';

    var fil=document.createElement('div');fil.className='k-fil';fil.setAttribute('role','group');fil.setAttribute('aria-label','Filter de kaarten');
    fil.innerHTML='<div class="k-fr"><span class="k-fl" id="mzk-fth">Thema</span><div class="k-chips" role="group" aria-labelledby="mzk-fth"></div></div>'+
      '<div class="k-fr"><span class="k-fl" id="mzk-fso">Soort</span><div class="k-seg" role="group" aria-labelledby="mzk-fso"></div></div>';
    var none=document.createElement('div');none.className='k-none';none.hidden=true;
    none.innerHTML='<span>Geen kaarten met deze filters.</span><button type="button" class="k-reset">Toon alle kaarten</button>';
    h2.after(fil);grid.after(none);
    var small=h2.querySelector('small');h2.setAttribute('aria-live','polite');
    var chips=fil.querySelector('.k-chips'),seg=fil.querySelector('.k-seg');

    function render(){
      chips.innerHTML='<button type="button" class="k-chip" data-th="" aria-pressed="'+(!state.th)+'">Alles <small>'+count('',state.so)+'</small></button>'+
        TH.map(function(t){var n=count(t.id,state.so);return '<button type="button" class="k-chip" data-th="'+t.id+'" aria-pressed="'+(state.th===t.id)+'"'+(n||state.th===t.id?'':' disabled')+'><i style="background:'+t.c+'"></i>'+esc(t.n)+' <small>'+n+'</small></button>'}).join('');
      seg.innerHTML=SOORT.map(function(s){return '<button type="button" class="k-chip" data-so="'+s.id+'" aria-pressed="'+(state.so===s.id)+'">'+(s.id==='live'?'<i class="k-lv"></i>':'')+s.n+'</button>'}).join('');
      var shown=0;cards.forEach(function(c){var on=(!state.th||c.th===state.th)&&(state.so==='alle'||(state.so==='live')===c.live);c.el.hidden=!on;if(on)shown++});
      none.hidden=shown>0;
      var t=state.th?TH.filter(function(x){return x.id===state.th})[0].n:'Alle kaarten';
      if(state.so==='live')t=state.th?t+', live':'Live kaarten';else if(state.so==='vast')t=state.th?t+', vast':'Vaste kaarten';
      h2.firstChild.nodeValue=t+' ';if(small)small.textContent=shown;
    }
    function setHash(){var h=[state.th,state.so==='alle'?'':state.so].filter(Boolean).join('-');
      try{history.replaceState(null,'',location.pathname+location.search+(h?'#'+h:''))}catch(e){}}
    chips.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;
      var th=b.getAttribute('data-th');state.th=(th&&state.th===th)?'':th;render();setHash();gc('kaarten-filter/thema/'+(state.th||'alles'))});
    seg.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;state.so=b.getAttribute('data-so');render();setHash();gc('kaarten-filter/soort/'+state.so)});
    none.querySelector('.k-reset').addEventListener('click',function(){state={th:'',so:'alle'};render();setHash()});
    render();
    var cur=chips.querySelector('[aria-pressed="true"]');setTimeout(function(){chips.scrollLeft=state.th&&cur?Math.max(0,cur.offsetLeft-chips.offsetLeft-20):0},60);
    return true;
  }
  var n=0;(function go(){if(init()||++n>100)return;setTimeout(go,120)})();
})();
