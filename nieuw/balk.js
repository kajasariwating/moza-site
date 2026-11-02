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

  /* Kop bovenin op telefoon en tablet overal gelijk: logo, Leeshulp (Aa), nachtstand, winkelmandje, Doneer */
  var AA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 19 8 5l5 14M4.8 14h6.4"/><path d="M15 19l3.5-9 3.5 9M16 16.5h5"/></svg>';
  function aantal(){var q=document.querySelector('#header .icon-cart-quantity');var n=q?parseInt(q.textContent,10):0;return isNaN(n)?0:n}
  function kop(){
    if(window.matchMedia&&!matchMedia('(max-width:1024px)').matches)return true;
    if(P==='/'){
      var hdi=document.querySelector('#mzmob header.hd .hdi'),don=hdi&&hdi.querySelector('a.don');if(!don)return false;
      if(!hdi.querySelector('.mzk-cart')){var c=document.createElement('a');c.className='mzk-cart';c.href='/cart';c.setAttribute('aria-label','Winkelmandje');c.innerHTML=ic('toko')+'<b>'+aantal()+'</b>';hdi.insertBefore(c,don)}
      return true;
    }
    var th=document.querySelector('#header .header-display-mobile .moza-theme');if(!th)return false;
    var box=th.parentNode;if(box.querySelector('.mzk-aa'))return true;
    var aa=document.createElement('button');aa.type='button';aa.className='mzk-aa';aa.setAttribute('aria-label','Leeshulp');aa.innerHTML=AA;
    aa.addEventListener('click',function(){var b=document.querySelector('#header .mz-lbtn')||document.querySelector('.mm-lees');if(b)b.click()});
    box.insertBefore(aa,th);
    var d=document.createElement('a');d.className='mzk-don';d.href='/doneer';d.textContent='Doneer';box.appendChild(d);
    H.classList.add('mzk-kop');
    return true;
  }
  var kk=0;(function k(){if(kop()||++kk>40)return;setTimeout(k,250)})();
  /* Leeshulp opent altijd onder de kop (niet over het logo en Doneer heen) en boven de menubalk */
  function lpPlek(p){
    if(!matchMedia('(max-width:1024px)').matches)return;
    var k=document.querySelector('#mzmob header.hd');if(!k||!k.getClientRects().length)k=document.getElementById('header');if(!k)return;
    var t=Math.max(0,Math.round(k.getBoundingClientRect().bottom)),o=document.getElementById('mz-onder'),b=o?Math.round(o.getBoundingClientRect().height):0;
    if(p.style.getPropertyValue('top')!==t+'px'){p.style.setProperty('top',t+'px','important');p.style.setProperty('bottom',b+'px','important');p.style.setProperty('max-height','calc(100vh - '+(t+b)+'px)','important');p.style.setProperty('overflow-y','auto','important')}
  }
  function lpWacht(){var p=document.getElementById('mz-lp');if(!p)return false;
    new MutationObserver(function(){lpPlek(p)}).observe(p,{attributes:true,attributeFilter:['class','style']});lpPlek(p);
    window.addEventListener('scroll',function(){if(p.classList.contains('on'))lpPlek(p)},{passive:true});return true}
  if(!lpWacht()){var lpo=new MutationObserver(function(){if(lpWacht())lpo.disconnect()});lpo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){lpo.disconnect()},30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',balk);else balk();
})();
