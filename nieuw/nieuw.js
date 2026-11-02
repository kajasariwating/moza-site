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
    deel:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'
  };
  function ic(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">'+SVG[n]+'</svg>'}

  /* ---------- Menubalk onderin ---------- */
  function actief(){
    if(P==='/')return 'home';
    if(/^\/(events|agenda|evenementen)(\/|$)/.test(P))return 'agenda';
    if(/^\/kaarten(\/|$)/.test(P))return 'kaart';
    if(P==='/lezen')return 'lijst';
    return '';
  }
  function meer(){
    var d=document.querySelector('#mzmob nav.dnav button, #mzmob nav.dnav a');
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
      item('lijst','/lezen','Net binnen',ic('lijst'))+
      item('agenda','/events','Agenda','<span class="ag">'+ic('agenda')+'</span>')+
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

  function start(){balk();var n=0;(function g(){if(deelknop()||++n>40)return;setTimeout(g,250)})()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
