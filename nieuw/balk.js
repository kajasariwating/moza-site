/* MOZA menubalk onderin (live voor iedereen). Draait niet dubbel naast de testversie. */
(function(){
  var H=document.documentElement;H.classList.add('mz-balk');
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

  /* Vaste kop bovenin op telefoon en tablet: op elke pagina precies gelijk aan de voorpagina en hij verspringt nooit (ook niet als Meer open is).
     Het is een eigen kop over de oorspronkelijke heen; die blijft onzichtbaar op zijn plek, zodat de pagina niet verschuift. De knoppen doen wat de oude knoppen deden. */
  var I={
    aa:'<path d="M3 19 8 5l5 14M4.8 14h6.4"/><path d="M15 19l3.5-9 3.5 9M16 16.5h5"/>',
    maan:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    zoek:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>'
  };
  function si(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[n]+'</svg>'}
  function aantal(){var q=document.querySelector('#header .icon-cart-quantity')||document.querySelector('.sqs-cart-quantity');var n=q?parseInt(q.textContent,10):0;return isNaN(n)?0:n}
  function klik(sel){for(var i=0;i<sel.length;i++){var e=document.querySelector(sel[i]);if(e){e.click();return true}}return false}
  function wxBron(){return document.querySelector('#mzmob .mzv-ywx')||document.querySelector('#header .mzv-wx')}
  function wxZet(k){var w=k.querySelector('.wx'),b=wxBron();if(!b)return false;var c=b.querySelector('.wxc');var h=c?c.innerHTML:'';
    if(!c&&b.textContent.trim())h=(window.MZWXC&&MZWXC(b))||'';
    if(h&&w.getAttribute('data-h')!==h){w.innerHTML='<span class="wxc">'+h+'</span>';w.setAttribute('data-h',h)}return !!h}
  var wxObs=null;
  function wxVolg(k){var b=wxBron();if(!b||wxObs)return;wxZet(k);wxObs=new MutationObserver(function(){wxZet(k)});wxObs.observe(b,{childList:true,subtree:true,characterData:true})}
  function kop(){
    if(document.getElementById('mz-kop'))return true;if(!document.body)return false;
    var k=document.createElement('div');k.id='mz-kop';
    k.innerHTML='<div class="r1"><a class="logo" href="/" aria-label="MOZA voorpagina"><span class="moza-logo" role="img" aria-label="MOZA"></span></a><span class="sp"></span>'+
      '<button type="button" class="ib" data-k="aa" aria-label="Leeshulp">'+si('aa')+'</button>'+
      '<button type="button" class="ib" data-k="nacht" aria-label="Nachtstand">'+si('maan')+'</button>'+
      '<a class="cart" href="/cart" aria-label="Winkelmandje">'+ic('toko')+'<b>0</b></a>'+
      '<a class="don" href="/doneer">Doneer</a></div>'+
      '<div class="r2"><span class="wx" aria-live="polite"></span><button type="button" class="zk" aria-label="Zoeken op MOZA">'+si('zoek')+'</button></div>';
    k.querySelector('[data-k="aa"]').addEventListener('click',function(){klik(['#header .mz-lbtn','.mm-lees','#mzmob header.hd [data-lees]'])});
    k.querySelector('[data-k="nacht"]').addEventListener('click',function(){klik(['#header .moza-theme','#mzmob header.hd [data-nacht]'])});
    k.querySelector('.zk').addEventListener('click',function(){if(!klik(['#mzmob header.hd [data-zoek]','#header .moza-toko .mt-btn']))location.href='/search'});
    document.body.appendChild(k);H.classList.add('mzk-vast');
    var nb=k.querySelector('.cart b');function tel(){var n=aantal();if(nb.textContent!==String(n))nb.textContent=n}tel();
    var q=document.querySelector('#header .header-actions');if(q)new MutationObserver(tel).observe(q,{childList:true,subtree:true,characterData:true});setTimeout(tel,2000);
    return true;
  }
  var kk=0;(function k(){var ok=kop();var m=document.getElementById('mz-kop');if(m){wxVolg(m);if(wxObs&&wxZet(m)&&ok)return}if(++kk>80)return;setTimeout(k,250)})();
  /* Leeshulp opent altijd onder de kop (niet over het logo en Doneer heen) en boven de menubalk */
  function lpPlek(p){
    if(!matchMedia('(max-width:1024px)').matches)return;
    var k=document.getElementById('mz-kop');if(!k||!k.getClientRects().length)k=document.querySelector('#mzmob header.hd');if(!k||!k.getClientRects().length)k=document.getElementById('header');if(!k)return;
    var t=Math.max(0,Math.round(k.getBoundingClientRect().bottom)),o=document.getElementById('mz-onder'),b=o?Math.round(o.getBoundingClientRect().height):0;
    if(p.style.getPropertyValue('top')!==t+'px'){p.style.setProperty('top',t+'px','important');p.style.setProperty('bottom',b+'px','important');p.style.setProperty('max-height','calc(100vh - '+(t+b)+'px)','important');p.style.setProperty('overflow-y','auto','important')}
  }
  function lpWacht(){var p=document.getElementById('mz-lp');if(!p)return false;
    new MutationObserver(function(){lpPlek(p)}).observe(p,{attributes:true,attributeFilter:['class','style']});lpPlek(p);
    window.addEventListener('scroll',function(){if(p.classList.contains('on'))lpPlek(p)},{passive:true});return true}
  if(!lpWacht()){var lpo=new MutationObserver(function(){if(lpWacht())lpo.disconnect()});lpo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){lpo.disconnect()},30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){balk();kop()});else{balk();kop()}
})();
