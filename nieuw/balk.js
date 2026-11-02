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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',balk);else balk();
})();
