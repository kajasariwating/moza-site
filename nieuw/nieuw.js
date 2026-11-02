/* MOZA nieuwe vormgeving (test). Draait alleen als html.mz-nieuw aan staat. */
(function(){
  var H=document.documentElement;
  if(!H.classList.contains('mz-nieuw'))return;
  var P=location.pathname.replace(/\/+$/,'')||'/';
  var SVG={
    home:'<path d="M3 11l9-7 9 7v10h-6v-6H9v6H3z"/>',
    lijst:'<path d="M4 5h16M4 10h16M4 15h11M4 20h7"/>',
    agenda:'<rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    kaart:'<path d="M9 4L3 7v13l6-3 6 3 6-3V4l-6 3zM9 4v13M15 7v13"/>',
    meer:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    toko:'<path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    deel:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'
  };
  function ic(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">'+SVG[n]+'</svg>'}

  /* ---------- Menubalk onderin ---------- */
  function actief(){
    if(P==='/')return 'home';
    if(/^\/(events|agenda|evenementen)(\/|$)/.test(P))return 'agenda';
    if(/^\/kaarten(\/|$)/.test(P))return 'kaart';
    if(/^\/(store|cart|toko-buku|boekenplank)(\/|$)/.test(P))return 'toko';
    return '';
  }
  function meer(){
    var d=document.querySelector('#mzmob header.hd button.mbtn');
    if(d){d.click();return}
    var b=document.querySelector('#header .header-display-mobile .header-burger-btn')||document.querySelector('#header .header-burger-btn');
    if(b){b.click();return}
    location.href='/lezen';
  }
  function balk(){
    if(document.getElementById('mz-onder')||!document.body)return;
    var a=actief(),n=document.createElement('nav');
    n.id='mz-onder';n.setAttribute('aria-label','Hoofdmenu');
    function item(k,href,lbl,inner){return '<a href="'+href+'"'+(a===k?' aria-current="page"':'')+'>'+inner+lbl+'</a>'}
    n.innerHTML=item('home','/','Voorpagina',ic('home'))+
      item('agenda','/events','Agenda','<span class="ag">'+ic('agenda')+'</span>')+
      item('toko','/store','Toko Buku',ic('toko'))+
      item('kaart','/kaarten','Kaarten',ic('kaart')+'<span class="live" aria-hidden="true"></span>')+
      '<button type="button" aria-label="Meer: menu en zoeken">'+ic('meer')+'Meer</button>';
    n.querySelector('button').addEventListener('click',meer);
    document.body.appendChild(n);
  }

  /* ---------- Delen bovenin (artikelen, kennis, evenementen) ---------- */
  var DEEL=/^\/(lezen|kennisbank|evenementen|events)\/[^\/]+/.test(P);
  function toast(t){var e=document.getElementById('mz-toast');if(!e){e=document.createElement('div');e.id='mz-toast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('on')},2200)}
  function deel(){
    var d={title:document.title.replace(/ — MOZA\.nu$/,''),url:location.href.split('#')[0].replace(/[?&]nieuw=1/,'')};
    if(navigator.share){navigator.share(d).catch(function(){});return}
    var ok=function(){toast('Link gekopieerd')};
    if(navigator.clipboard)navigator.clipboard.writeText(d.url).then(ok,function(){prompt('Kopieer de link',d.url)});else prompt('Kopieer de link',d.url);
  }
  function deelknop(){
    if(!DEEL||document.getElementById('mz-deel'))return true;
    var plek=document.querySelector('#header .header-display-mobile .moza-theme')||document.querySelector('#header .moza-theme');
    if(!plek)return false;
    var b=document.createElement('button');b.type='button';b.id='mz-deel';b.setAttribute('aria-label','Deel dit bericht');
    b.innerHTML=ic('deel')+'Delen';b.addEventListener('click',deel);
    plek.parentNode.insertBefore(b,plek);
    return true;
  }


  /* ---------- Voorpagina (mobiel): groot stuk bovenaan + Net binnen mét rubrieken ---------- */
  var RUB=['Kaart van de week','Achter de foto','Leeswijzer','Woord van de week','Dit weekend','Deze week toen','Jullie zeiden','MOZA deze maand'];
  var MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  function esc(t){return String(t||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function dec(t){var d=document.createElement('textarea');d.innerHTML=t||'';return d.value}
  function info(it){
    var tags=it.tags||[],rub=null;
    if(tags.some(function(t){return /^rubriek$/i.test(t)}))RUB.forEach(function(r){if(!rub&&tags.some(function(t){return t.toLowerCase()===r.toLowerCase()}))rub=r});
    var t=dec(it.title);
    if(rub&&t.toLowerCase().indexOf(rub.toLowerCase())===0&&t.indexOf(':')>-1&&t.indexOf(':')<rub.length+15){t=t.slice(t.indexOf(':')+1).trim();t=t.charAt(0).toUpperCase()+t.slice(1)}
    var c=(it.categories||[])[0]||'';
    var d=new Date(it.publishOn||it.addedOn);
    return {rub:rub,titel:t,cat:c,url:it.fullUrl,img:it.assetUrl,dag:d.getDate()+' '+MND[d.getMonth()]};
  }
  function label(i){
    if(i.rub)return '<span class="mzs-tag'+(i.rub==='Dit weekend'?' roze':'')+'">'+esc(i.rub)+'</span>';
    return i.cat?'<span class="mzs-cat">'+esc(i.cat)+'</span>':'';
  }
  function voorpagina(){
    if(P!=='/')return true;
    var col=document.querySelector('#mzmob .cols .col.l');
    if(!col)return false;
    if(document.getElementById('mz-start'))return true;
    var box=document.createElement('section');box.id='mz-start';box.setAttribute('aria-label','Net binnen');
    col.insertBefore(box,col.firstChild);
    fetch('/lezen?format=json').then(function(r){return r.json()}).then(function(j){
      var L=(j.items||[]).map(info);if(!L.length)return;
      var a=L[0],h='';
      h+='<a class="mzs-lead" href="'+esc(a.url)+'">'+(a.img?'<img src="'+esc(a.img)+'?format=750w" alt="" loading="eager">':'')+
         '<span class="mzs-lt">'+label(a)+'<span class="mzs-h">'+esc(a.titel)+'</span></span></a>';
      h+='<div class="mzs-kop"><h2>Net binnen</h2><a href="/lezen">Alles →</a></div><div class="mzs-streep" aria-hidden="true"><i></i><i></i><i></i></div><ul class="mzs-list">';
      L.slice(1,8).forEach(function(i){
        h+='<li><a href="'+esc(i.url)+'">'+(i.img?'<img src="'+esc(i.img)+'?format=300w" alt="" loading="lazy">':'<span class="mzs-noimg"></span>')+
           '<span class="mzs-tx">'+label(i)+'<span class="mzs-t">'+esc(i.titel)+'</span><span class="mzs-d">'+i.dag+'</span></span></a></li>';
      });
      box.innerHTML=h+'</ul>';
    }).catch(function(){box.remove()});
    return true;
  }

  /* ---------- Bronnen ingeklapt ---------- */
  function bronnen(){
    var L=document.querySelectorAll('aside.moza-bronnen:not([data-mzb])');
    [].forEach.call(L,function(a){var h=a.querySelector('.mb-head');if(!h)return;a.setAttribute('data-mzb','1');a.classList.add('mzb-dicht');
      h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-expanded','false');
      var t=function(){var o=a.classList.toggle('mzb-dicht');h.setAttribute('aria-expanded',o?'false':'true')};
      h.addEventListener('click',t);h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t()}})});
  }

  function start(){balk();var b=0;(function q(){bronnen();if(++b<20)setTimeout(q,500)})();var m=0;(function v(){if(voorpagina()||++m>40)return;setTimeout(v,250)})();var n=0;(function g(){if(deelknop()||++n>40)return;setTimeout(g,250)})()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
