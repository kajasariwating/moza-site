/* MOZA live onderdelen (voor iedereen). Draait niet in de testversie. */
(function(){
  var H=document.documentElement;
  function esc(t){return String(t||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  /* Rubriekstukken: kop zoals een nieuwsartikel */
  var VASTE=/\/cover-(kaart-van-de-week|achter-de-foto|leeswijzer|woord-van-de-week|dit-weekend|deze-week-toen|jullie-zeiden|moza-deze-maand)(-simpel)?\.png/i;
  var NM={dwt:'Deze week toen',dw:'Dit weekend',kvdw:'Kaart van de week',adf:'Achter de foto',lw:'Leeswijzer',wvdw:'Woord van de week',jz:'Jullie zeiden',mdm:'MOZA deze maand'};
  function rubriekKop(){
    if(H.classList.contains('mz-nieuw'))return true;
    if(!H.classList.contains('mzr'))return document.readyState==='complete';
    var hero=document.querySelector('.moza-hero');if(!hero)return false;
    if(hero.getAttribute('data-mzrk'))return true;hero.setAttribute('data-mzrk','1');
    var naam='';for(var k in NM)if(H.classList.contains('mzr-'+k))naam=NM[k];
    var rij=hero.querySelector('.moza-chiprow .blog-item-meta-wrapper')||hero.querySelector('.moza-chiprow');
    function zetTag(){var h=document.querySelector('.moza-hero');if(!h||h.querySelector('.mzrk-tag'))return;var r=h.querySelector('.moza-chiprow .blog-item-meta-wrapper')||h.querySelector('.moza-chiprow');if(!naam||!r)return;var c=document.createElement('span');c.className='mzrk-tag'+(/^dit weekend/i.test(naam)?' roze':'');c.textContent=naam;r.insertBefore(c,r.firstChild)}
    /* Het rubrieklabel vervangt "Geplaatst in van de redactie"; andere scripts bouwen de chips soms opnieuw op, dus een paar seconden blijven controleren */
    zetTag();var tt=0,ti=setInterval(function(){zetTag();if(++tt>40)clearInterval(ti)},250);
    /* Vaste uitleg bovenaan: laat zien dat je een rubriek leest (en bij Deze week toen welke datum en hoe lang geleden) */
    var UIT={dwt:'Elke zaterdag kijkt MOZA.nu terug op iets wat deze week jaren geleden gebeurde.',dw:'Elke vrijdag zet MOZA.nu de Molukse activiteiten van het weekend op een rij.',kvdw:'Elke maandag legt MOZA.nu uit wat een van de live kaarten deze week laat zien.',lw:'Elke woensdag: een vraag uit het leven, met uitleg en boeken die helpen.',wvdw:'Elke donderdag legt MOZA.nu één Moluks woord uit.',adf:'Op themadagen vertelt MOZA.nu het verhaal achter een foto.',jz:'Na elke peiling deelt MOZA.nu wat lezers antwoordden.',mdm:'Elke eerste van de maand: wat er de afgelopen maand op MOZA.nu gebeurde.'};
    function zetUitleg(){if(document.querySelector('.mzrk-uitleg'))return;var key='';for(var k2 in UIT)if(H.classList.contains('mzr-'+k2))key=k2;if(!key)return;var c=document.querySelector('.blog-item-content .sqs-html-content');if(!c)return;var d=document.createElement('div');d.className='mzrk-uitleg'+(key==='dw'?' roze':'');var t='<b>'+esc(NM[key])+'</b>'+esc(UIT[key]);if(key==='dwt'){var big=document.querySelector('.mzr-hero .mzr-big'),sub=document.querySelector('.mzr-hero .mzr-sub');if(big)t+=' Vandaag: <strong>'+esc(big.textContent.trim())+'</strong>'+(sub?', '+esc(sub.textContent.trim()):'')+'.'}d.innerHTML=t;var intro=document.querySelector('.moza-intro');if(intro&&intro.parentNode)intro.parentNode.insertBefore(d,intro);else c.insertBefore(d,c.firstChild)}
    zetUitleg();var tu=0,tiu=setInterval(function(){var u=document.querySelector('.mzrk-uitleg'),i=document.querySelector('.moza-intro');if(u&&i&&u.nextElementSibling!==i&&i.parentNode){i.parentNode.insertBefore(u,i)}zetUitleg();if(++tu>40)clearInterval(tiu)},250);
    var img=hero.querySelector('img');
    /* Tag "foto in tekst": de foto blijft in de tekst staan en de kop houdt de vaste cover */
    if(img&&VASTE.test(img.getAttribute('src')||img.src||'')&&!document.querySelector('article.tag-foto-in-tekst')){
      var fig=document.querySelector('.blog-item-content .sqs-html-content figure img');
      if(fig){var f=fig.closest('figure'),cap=f&&f.nextElementSibling,cr=hero.querySelector('.moza-credit');
        img.removeAttribute('srcset');img.src=(fig.getAttribute('src')||fig.src).split('?')[0]+'?format=1500w';
        var m=cap&&/Beeld:\s*([^.<]+)/.exec(cap.textContent||'');if(cr)cr.innerHTML=m?'<b>Beeld:</b> '+esc(m[1].trim()):'';
        if(f)f.classList.add('mzr-hide');if(cap&&cap.tagName==='P'&&/Beeld:/.test(cap.textContent))cap.classList.add('mzr-hide')}
      else{if(!/-simpel\.png/i.test(img.getAttribute('src')||img.src||''))hero.classList.add('mzrk-vlak');var cr2=hero.querySelector('.moza-credit');if(cr2)cr2.remove()}}
    return true;
  }
  var n=0;(function k(){if(rubriekKop()||++n>60)return;setTimeout(k,250)})();
  /* Voorpagina (oude opmaak): lijst onder de hero = de 5 nieuwste stukken uit Lezen, zonder de hero en zonder de 3 in Net binnen */
  var P=location.pathname.replace(/\/+$/,'')||'/';
  var MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var RUBS=['Kaart van de week','Achter de foto','Leeswijzer','Woord van de week','Dit weekend','Deze week toen','Jullie zeiden','MOZA deze maand'];
  function dec(t){var d=document.createElement('textarea');d.innerHTML=t||'';return d.value}
  /* Voorpagina: hero, Net binnen en de lijst eronder komen uit drie scripts die elkaar overschrijven.
     Hero = meest gelezen stuk van de laatste 3 dagen (max 14 dagen oud), 3 uur onthouden, zodat een
     trage teller niet terugvalt op het nieuwste stuk. Net binnen en de lijst slaan de hero over,
     staan op publicatiedatum (nieuwste eerst) en worden 30 s vastgehouden. (4-11-2026) */
  var GC='https://moza.goatcounter.com',HK='mz-hero-best';
  function nrm(u){try{return new URL(u,location.href).pathname.replace(/\/+$/,'')}catch(e){return String(u||'').replace(/\/+$/,'')}}
  function ymdA(t){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam'}).format(new Date(t))}catch(e){return new Date(t).toISOString().slice(0,10)}}
  function isRubI(i){return (i.tags||[]).some(function(t){return /^rubriek$/i.test(t)})}
  function besteHero(items){
    try{var c=JSON.parse(localStorage.getItem(HK)||'null');if(c&&Date.now()-c.t<108e5&&c.u&&items.some(function(i){return nrm(i.fullUrl)===c.u}))return Promise.resolve(c.u)}catch(e){}
    var now=Date.now(),start=ymdA(now-3*864e5);
    var cand=items.filter(function(i){return !isRubI(i)&&now-(i.publishOn||0)<14*864e5&&!(i.tags||[]).some(function(t){return /^geen[\s-]*hero$/i.test(t)})&&!/boekenplank/i.test((i.title||'')+' '+(i.urlId||''))}).slice(0,12);
    if(!cand.length)return Promise.resolve(null);
    var to=new Promise(function(r){setTimeout(function(){r(null)},6000)});
    var tel=Promise.all(cand.map(function(i){return fetch(GC+'/counter/'+encodeURIComponent(nrm(i.fullUrl))+'.json?start='+start).then(function(r){return r.ok?r.json():{count:0}}).then(function(j){return {u:nrm(i.fullUrl),n:parseInt(String(j.count||0).replace(/\D/g,''),10)||0}}).catch(function(){return {u:nrm(i.fullUrl),n:0}})}));
    return Promise.race([tel,to]).then(function(l){if(!l)return null;var b=l.slice().sort(function(x,y){return y.n-x.n})[0];if(!b||b.n<1)return null;
      try{localStorage.setItem(HK,JSON.stringify({t:Date.now(),u:b.u}))}catch(e){}return b.u});
  }
  function zetHero(hero,i){
    if(nrm(hero.getAttribute('href'))===nrm(i.fullUrl))return;
    hero.setAttribute('href',i.fullUrl);if(i.assetUrl)hero.style.backgroundImage='url("'+i.assetUrl+'?format=1500w")';
    var l=hero.querySelector('.lab');if(l)l.textContent=String((i.categories||[])[0]||'nieuws').toLowerCase();
    var h=hero.querySelector('h1');if(h)h.textContent=dec(i.title);
    var u=nrm(i.fullUrl);window.MZX_HERO=u;
    try{sessionStorage.setItem('mzx-hero2:'+ymdA(Date.now()),JSON.stringify({t:Date.now(),u:u}))}catch(e){}
    try{document.dispatchEvent(new CustomEvent('mzx:hero',{detail:u}))}catch(e){}
  }
  function lijst(){
    if(P!=='/'||H.classList.contains('mz-nieuw'))return true;
    var ul=document.querySelector('#mzmob ul.mzx-list'),hero=document.querySelector('#mzmob a.hero.o1');
    if(!ul||!hero)return false;
    if(typeof window.MZX_HERO==='undefined'&&++lijst.h<24)return false; /* max 6 s op mzx-js wachten */
    if(!document.querySelector('#mzmob section.sec.o5')&&++lijst.w<12)return false; /* op de telefoon staat Net binnen er niet */
    fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).then(function(j){
      var rubVan=function(i){var tags=i.tags||[],rub=null;if(tags.some(function(t){return /^rubriek$/i.test(t)}))RUBS.forEach(function(r){if(!rub&&tags.some(function(t){return t.toLowerCase()===r.toLowerCase()}))rub=r});return rub};
      var now=Date.now();
      var ALL=(j.items||[]).filter(function(i){return i.fullUrl&&(i.publishOn||0)<=now}).sort(function(a,b){return (b.publishOn||0)-(a.publishOn||0)});
      var zet=function(){
        var hr=document.querySelector('#mzmob a.hero.o1');if(!hr)return;var heroU=nrm(hr.getAttribute('href'));
        var A=ALL.filter(function(i){return nrm(i.fullUrl)!==heroU});
        var s=document.querySelector('#mzmob section.sec.o5'),tl=s&&s.querySelector('.tl');
        /* Net binnen: de 3 nieuwste, met Kaart van de week en MOZA deze maand, zonder de andere rubrieken */
        var NB=s?A.filter(function(i){var r=rubVan(i);return !r||r==='Kaart van de week'||r==='MOZA deze maand'}).slice(0,3):[];
        var nh=NB.map(function(i){var d=new Date(i.publishOn);return '<a class="" href="'+esc(i.fullUrl)+'"><span class="d">'+d.getDate()+' '+MND[d.getMonth()]+'</span><span class="t">'+esc(dec(i.title))+'</span></a>'}).join('');
        /* onder de hero: de 5 nieuwste die niet al in de hero of in Net binnen staan */
        var L=A.filter(function(i){return NB.indexOf(i)<0}).slice(0,5);if(L.length<3)return;
        var html=L.map(function(i){
          var rub=rubVan(i),d=new Date(i.publishOn),dag=d.getDate()+' '+MND[d.getMonth()];
          var k=rub?'<b class="rb" style="background:'+(rub==='Dit weekend'?'#FF7AB6':'#C9D3FF')+';color:#111">'+esc(rub)+'</b>':(((i.categories||[])[0])?'<b class="rb" style="background:#1F3BD1;color:#fff">'+esc((i.categories||[])[0])+'</b>':'');
          return '<li><a href="'+esc(i.fullUrl)+'"><span class="k">'+k+'</span><span class="t">'+esc(dec(i.title))+'<small class="w">'+dag+'</small></span></a></li>'}).join('');
        var u=document.querySelector('#mzmob ul.mzx-list');if(u&&u.innerHTML!==html)u.innerHTML=html;
        if(tl&&nh&&tl.innerHTML!==nh)tl.innerHTML=nh;
      };
      zet();H.classList.remove('mz-lw');
      var t0=Date.now(),mo=new MutationObserver(function(){if(Date.now()-t0>30000){mo.disconnect();return}zet()});
      mo.observe(document.getElementById('mzmob')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
      /* hero rechtzetten als mzx-js op het nieuwste stuk is teruggevallen */
      besteHero(ALL).then(function(u){if(!u)return;var it=ALL.filter(function(i){return nrm(i.fullUrl)===u})[0];var hr=document.querySelector('#mzmob a.hero.o1');if(it&&hr){zetHero(hr,it);zet()}});
    }).catch(function(){H.classList.remove('mz-lw')});
    return true;
  }
  lijst.w=0;lijst.h=0;
  var n2=0;(function k2(){if(lijst()||++n2>60)return;setTimeout(k2,250)})();

})();
