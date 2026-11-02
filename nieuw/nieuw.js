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
    var plek=[].filter.call(document.querySelectorAll('#header .moza-theme'),function(e){return e.getClientRects().length&&e.getBoundingClientRect().width>0})[0];
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
    fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).then(function(j){
      var L=(j.items||[]).map(info);if(!L.length)return;
      var a=L[0],h='';
      h+='<a class="mzs-lead" href="'+esc(a.url)+'">'+(a.img?'<img src="'+esc(a.img)+'?format=750w" alt="" loading="eager">':'')+
         '<span class="mzs-lt">'+label(a)+'<span class="mzs-h">'+esc(a.titel)+'</span></span></a>';
      h+='<div class="mzs-kop"><h2>Net binnen</h2><a href="/lezen">Alles →</a></div><div class="mzs-streep" aria-hidden="true"><i></i><i></i><i></i></div><ul class="mzs-list">';
      L.slice(1,5).forEach(function(i){
        /* Geen fotootjes onder de hero, net als op desktop: label en datum, dan de kop */
        h+='<li><a href="'+esc(i.url)+'"><span class="mzs-tx"><span class="mzs-r">'+label(i)+'<span class="mzs-d">'+i.dag+'</span></span><span class="mzs-t">'+esc(i.titel)+'</span></span></a></li>';
      });
      box.innerHTML=h+'</ul>';
      /* Desktop: rechts een lijst zonder foto's */
      var r=document.querySelector('#mzmob .cols .col.r'),o5=r&&r.querySelector('.sec.o5');
      if(r&&!document.getElementById('mz-nb')){var nb=document.createElement('section');nb.id='mz-nb';nb.setAttribute('aria-label','Net binnen');
        var k='<div class="mzs-kop"><h2>Net binnen</h2><a href="/lezen">Alles →</a></div><div class="mzs-streep" aria-hidden="true"><i></i><i></i><i></i></div><ul>';
        L.slice(1,6).forEach(function(i){k+='<li><a href="'+esc(i.url)+'"><span class="mzs-r">'+label(i)+'<span class="mzs-d">'+i.dag+'</span></span><span class="mzs-t">'+esc(i.titel)+'</span></a></li>'});
        nb.innerHTML=k+'</ul>';r.insertBefore(nb,o5||r.firstChild);}
    }).catch(function(){box.remove()});
    return true;
  }


  /* ---------- Voorpagina: de rest zoals in de mockup (alle schermen) ---------- */
  var DAG=['zo','ma','di','wo','do','vr','za'];
  function dagnr(t){var d=new Date(t);return {d:DAG[d.getDay()],n:d.getDate(),m:MND[d.getMonth()],u:('0'+d.getHours()).slice(-2)+'.'+('0'+d.getMinutes()).slice(-2)}}
  function kop(h,href,lbl){return '<div class="mzh-kop"><h2>'+h+'</h2>'+(href?'<a href="'+href+'">'+lbl+' →</a>':'')+'</div>'}
  function meer2(){
    if(P!=='/')return true;
    var cols=document.querySelector('#mzmob .cols');if(!cols)return false;
    if(document.getElementById('mz-meer'))return true;
    var box=document.createElement('div');box.id='mz-meer';cols.parentNode.insertBefore(box,cols.nextSibling);
    var vak={};['opk','week','pop','peil','kb','boek'].forEach(function(k){var e=document.createElement('section');e.className='mzh-'+k;box.appendChild(e);vak[k]=e});
    /* Meest gelezen vandaag: de lijst die de site al bijhoudt */
    /* De lijst wordt door de site later gevuld: blijf kijken tot er links in staan (max. 20 s) */
    var pt=0;(function vul(){var pop=document.querySelector('#mzmob section.mzpop');
      var L=pop?[].slice.call(pop.querySelectorAll('a[href]')).filter(function(a){return (a.textContent||'').trim().length>3}).slice(0,4):[];
      if(L.length<3){if(++pt<80){setTimeout(vul,250);return}vak.pop.remove();return}
      vak.pop.innerHTML=kop('Meest gelezen vandaag')+'<ol>'+L.map(function(a,i){var t=(a.textContent||'').replace(/\s+/g,' ').replace(/^\s*\d+\s*/,'').trim();return '<li><a href="'+esc(a.getAttribute('href'))+'"><b>'+(i+1)+'</b><span>'+esc(t)+'</span></a></li>'}).join('')+'</ol>'})();
    /* Peiling */
    var pl=window.MOZA_POLL;
    if(pl&&pl.q&&pl.url)vak.peil.innerHTML='<a href="'+esc(pl.url)+'"><span class="mzh-lab">Peiling van de maand</span><h3>'+esc(pl.q)+'</h3><span class="mzh-go">Doe mee →</span></a>';else vak.peil.remove();
    /* Op de kaart: het cijfer uit de laatste Kaart van de week */
    fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).then(function(j){
      var k=(j.items||[]).filter(function(i){return (i.tags||[]).some(function(t){return /^kaart van de week$/i.test(t)})})[0];
      var ex=k&&dec((k.excerpt||'').replace(/<[^>]+>/g,'')).trim();var zin=ex&&(ex.split(/\.\s/)[0].replace(/\.$/,'')+'.');var m=zin&&/\d{1,3}(?:\.\d{3})+|\d{2,}/.exec(zin);
      if(!m){vak.opk.remove();return}
      vak.opk.innerHTML='<a href="/kaarten"><span class="mzh-live">Live</span> <span class="mzh-kick">Op de kaart</span><strong>'+esc(m[0])+'</strong><p>'+esc(zin)+'</p><span class="mzh-go">Bekijk de kaarten →</span></a>';
    }).catch(function(){vak.opk.remove()});
    /* Deze week te doen */
    fetch('/evenementen?format=json').then(function(r){return r.json()}).then(function(j){
      var nu=Date.now(),U=(j.upcoming||[]).filter(function(e){return e.startDate>=nu-6*3600e3}).sort(function(a,b){return a.startDate-b.startDate});
      var W=U.filter(function(e){return e.startDate<nu+7*864e5});if(W.length<3)W=U;W=W.slice(0,3);
      if(!W.length){vak.week.remove();return}
      vak.week.innerHTML=kop('Deze week te doen','/events','Agenda')+'<ul>'+W.map(function(e){var d=dagnr(e.startDate),l=e.location||{},st=((l.addressLine2||'').split(',')[0]||'').trim();
        return '<li><a href="'+esc(e.fullUrl)+'"><span class="mzh-dt"><i>'+d.d+'</i><b>'+d.n+'</b><i>'+d.m+'</i></span><span class="mzh-ev"><b>'+esc(dec(e.title))+'</b><small>'+d.u+(l.addressTitle?' · '+esc(l.addressTitle):'')+(st&&st!==l.addressTitle?', '+esc(st):'')+'</small></span></a></li>'}).join('')+'</ul>';
    }).catch(function(){vak.week.remove()});
    /* Nieuw in de Kennisbank */
    fetch('/kennisbank?format=json').then(function(r){return r.json()}).then(function(j){
      var K=(j.items||[]).slice().sort(function(a,b){return b.publishOn-a.publishOn}).slice(0,3);if(!K.length){vak.kb.remove();return}
      vak.kb.innerHTML=kop('Nieuw in de Kennisbank','/weten','Alles')+'<ul>'+K.map(function(i){return '<li><a href="'+esc(i.fullUrl)+'">'+esc(dec(i.title))+'</a></li>'}).join('')+'</ul>';
    }).catch(function(){vak.kb.remove()});
    /* De boekenplank: dezelfde boeken als het oude Toko Buku-blok, anders de nieuwste op voorraad */
    fetch('/store?format=json').then(function(r){return r.json()}).then(function(j){
      var I=j.items||[],keus=[].slice.call(document.querySelectorAll('#mzmob section.mzv-band .bks a[href*="/store/p/"]')).map(function(a){return a.getAttribute('href').split('?')[0]});
      var B=keus.length?keus.map(function(u){return I.filter(function(i){return i.fullUrl===u})[0]}).filter(Boolean):[];
      I.forEach(function(i){var v=(i.variants||[])[0]||{};if(B.length<5&&B.indexOf(i)<0&&(v.unlimited||v.qtyInStock>0))B.push(i)});
      B=B.slice(0,5);if(!B.length){vak.boek.remove();return}
      vak.boek.innerHTML=kop('De boekenplank','/store','Toko Buku')+'<p class="mzh-sub">Elke aankoop steunt MOZA.nu.</p><div class="mzh-bks">'+B.map(function(i){var v=(i.variants||[])[0]||{},p=v.onSale&&v.salePriceMoney?v.salePriceMoney.value:(v.priceMoney||{}).value,lab=((i.tags||[]).filter(function(t){return /^label:/i.test(t)})[0]||'').replace(/^label:\s*/i,'');
        var im=((i.items||[])[0]||{}).assetUrl||i.assetUrl;return '<a href="'+esc(i.fullUrl)+'">'+(im?'<img src="'+esc(im)+'?format=300w" alt="" loading="lazy">':'')+(lab?'<span class="mzh-lab">'+esc(lab)+'</span>':'')+'<b>'+esc(dec(i.title))+'</b>'+(p?'<span class="mzh-pr">€ '+String(Number(p).toFixed(2)).replace('.',',')+'</span>':'')+'</a>'}).join('')+'</div>';
    }).catch(function(){vak.boek.remove()});
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

  /* ---------- Footer: oude opbouw, zonder logo, met kop Mis niets ---------- */
  function footer(){
    var c=document.querySelector('.mzf .mzf-nb');if(!c)return false;
    if(c.querySelector('.mz-misniets'))return true;
    var h=document.createElement('h2');h.className='mz-misniets';h.textContent='Mis niets';
    var l=c.querySelector('.mzf-h');c.insertBefore(h,l?l.nextSibling:c.firstChild);
    return true;
  }

  function start(){balk();var f=0;(function w(){if(footer()||++f>40)return;setTimeout(w,250)})();var b=0;(function q(){bronnen();if(++b<20)setTimeout(q,500)})();var m=0;(function v(){if(voorpagina()||++m>40)return;setTimeout(v,250)})();var h2=0;(function w2(){if(meer2()||++h2>60)return;setTimeout(w2,250)})();var n=0;(function g(){if(deelknop()||++n>40)return;setTimeout(g,250)})()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
