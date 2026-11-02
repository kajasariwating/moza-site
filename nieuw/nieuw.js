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
    var c=(i.cat||'').toLowerCase();
    if(c==='nieuws'||c==='maluku')return '<span class="mzs-tag blauw">'+esc(i.cat)+'</span>';
    if(c==='van de redactie')return '<span class="mzs-tag">'+esc(i.cat)+'</span>';
    return i.cat?'<span class="mzs-cat">'+esc(i.cat)+'</span>':'';
  }
  /* GoatCounter: meest bekeken /lezen- en /kennisbank-pagina's vanaf een datum (zelfde bron als de site, 10 min onthouden) */
  function ymdNL(d){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}catch(e){return d.toISOString().slice(0,10)}}
  function gcTop(start,ck){
    var GC='https://moza.goatcounter.com',KEY=window.MOZA_GC_KEY||'',cv=null;try{cv=JSON.parse(localStorage.getItem(ck))}catch(e){}
    if(cv&&Date.now()-cv.t<600e3)return Promise.resolve(cv.v);
    if(!KEY)return Promise.reject();
    return fetch(GC+'/api/v0/stats/hits?start='+start+'&limit=40',{headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
      var l=(j.hits||[]).filter(function(x){return !x.event&&/^\/(lezen|kennisbank)\/./.test(x.path||'')}).map(function(x){return {t:String(x.title||'').replace(/\s+[—|-]\s+MOZA.*$/,''),u:String(x.path).replace(/\/+$/,''),n:+(x.count!=null?x.count:x.count_unique)||0}}).filter(function(x){return x.n>=2}).sort(function(a,b){return b.n-a.n}).slice(0,10);
      try{localStorage.setItem(ck,JSON.stringify({t:Date.now(),v:l}))}catch(e){}return l});
  }
  var heroP=null;
  function voorpagina(){
    if(P!=='/')return true;
    var col=document.querySelector('#mzmob .cols .col.l');
    if(!col)return false;
    if(document.getElementById('mz-start'))return true;
    var box=document.createElement('section');box.id='mz-start';box.setAttribute('aria-label','Net binnen');
    col.insertBefore(box,col.firstChild);
    var gist=ymdNL(new Date(Date.now()-864e5));
    var feed=fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()});
    /* Hero: het meest gelezen artikel van de laatste 2 dagen (gisteren en vandaag); anders het nieuwste */
    heroP=Promise.all([feed,gcTop(gist,'mgc:hero2:'+gist).catch(function(){return []})]).then(function(r){
      var items=r[0].items||[],top=(r[1]||[]).filter(function(x){return /^\/lezen\/./.test(x.u)})[0];
      if(!top)return items[0]||null;
      var inFeed=items.filter(function(i){return i.fullUrl===top.u})[0];
      if(inFeed)return inFeed;
      return fetch(top.u+'?format=json').then(function(x){return x.json()}).then(function(x){return x.item||items[0]}).catch(function(){return items[0]});
    });
    Promise.all([feed,heroP]).then(function(r){
      var H=r[1];if(!H)throw 0;
      var L=(r[0].items||[]).filter(function(i){return i.fullUrl!==H.fullUrl}).map(info),a=info(H),h='';
      h+='<a class="mzs-lead" href="'+esc(a.url)+'">'+(a.img?'<img src="'+esc(a.img)+'?format=1000w" alt="" loading="eager">':'')+
         '<span class="mzs-lt">'+label(a)+'<span class="mzs-h">'+esc(a.titel)+'</span></span></a>';
      var nbl=function(i){return '<li><a href="'+esc(i.url)+'"><span class="mzs-tx"><span class="mzs-r">'+label(i)+'<span class="mzs-d">'+i.dag+'</span></span><span class="mzs-t">'+esc(i.titel)+'</span></span></a></li>'};
      var nbkop='<div class="mzs-kop"><h2>Net binnen</h2><a href="/lezen">Alles →</a></div><div class="mzs-streep" aria-hidden="true"><i></i><i></i><i></i></div>';
      /* Net binnen: de 3 nieuwste (zonder de hero) */
      box.innerHTML=h+nbkop+'<ul class="mzs-list">'+L.slice(0,3).map(nbl).join('')+'</ul>';
      var r2=document.querySelector('#mzmob .cols .col.r'),o5=r2&&r2.querySelector('.sec.o5');
      if(r2&&!document.getElementById('mz-nb')){var nb=document.createElement('section');nb.id='mz-nb';nb.setAttribute('aria-label','Net binnen');
        nb.innerHTML=nbkop+'<ul>'+L.slice(0,3).map(function(i){return '<li><a href="'+esc(i.url)+'"><span class="mzs-r">'+label(i)+'<span class="mzs-d">'+i.dag+'</span></span><span class="mzs-t">'+esc(i.titel)+'</span></a></li>'}).join('')+'</ul>';
        r2.insertBefore(nb,o5||r2.firstChild);
        /* Peiling direct onder Net binnen (computer) */
        var pd=peilBlok('mz-peil-d');if(pd)nb.parentNode.insertBefore(pd,nb.nextSibling);}
      /* Peiling direct onder Net binnen (telefoon), daarna de overige 10 stukken heel compact */
      var pm=peilBlok('mz-peil-m');if(pm)col.insertBefore(pm,box.nextSibling);
      var K=L.slice(3,13);
      if(K.length){var kort=document.createElement('section');kort.id='mz-kort';kort.setAttribute('aria-label','Meer berichten');
        kort.innerHTML='<ul>'+K.map(function(i){return '<li><a href="'+esc(i.url)+'">'+esc(i.titel)+'</a></li>'}).join('')+'</ul><a class="mzk-all" href="/lezen">Alle berichten →</a>';
        col.insertBefore(kort,(pm||box).nextSibling);}
    }).catch(function(){box.remove()});
    return true;
  }
  function peilBlok(id){
    var pl=window.MOZA_POLL;if(!pl||!pl.q||!pl.url||document.getElementById(id))return null;
    var e=document.createElement('section');e.id=id;e.className='mzh-peil mz-peil';
    e.innerHTML='<a href="'+esc(pl.url)+'"><span class="mzh-lab">Peiling van de maand</span><h3>'+esc(pl.q)+'</h3><span class="mzh-go">Doe mee →</span></a>';return e;
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
    /* Computer: Op de kaart en Nieuw in de Kennisbank rechts, onder de peiling */
    var mq=window.matchMedia('(min-width:1025px)');
    function plaats(){var r=document.querySelector('#mzmob .cols .col.r');if(!r)return;
      var re=document.getElementById('mz-rechts');
      if(mq.matches){if(!re){re=document.createElement('div');re.id='mz-rechts';var na=document.getElementById('mz-peil-d')||document.getElementById('mz-nb');if(na)na.parentNode.insertBefore(re,na.nextSibling);else r.insertBefore(re,r.firstChild)}
        if(vak.opk.parentNode)re.appendChild(vak.opk);if(vak.kb.parentNode)re.appendChild(vak.kb)}
      else if(re){if(vak.opk.parentNode)box.insertBefore(vak.opk,box.firstChild);if(vak.kb.parentNode)box.insertBefore(vak.kb,vak.boek.parentNode===box?vak.boek:null)}}
    var pt2=0;(function w(){if(document.getElementById('mz-peil-d')||document.getElementById('mz-nb')||++pt2>40){plaats();return}setTimeout(w,250)})();
    if(mq.addEventListener)mq.addEventListener('change',function(){var re=document.getElementById('mz-rechts');if(re&&!mq.matches){plaats();re.remove()}else plaats()});
    /* Meest gelezen vandaag: de lijst die de site al bijhoudt */
    /* Meest gelezen vandaag: zelfde bron als de site, zonder de hero */
    vak.peil.remove();
    Promise.all([gcTop(ymdNL(new Date()),'mgc:top:'+ymdNL(new Date())),heroP||Promise.resolve(null),fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).catch(function(){return {}})]).then(function(r){
      var hero=r[1]&&r[1].fullUrl,T={};(r[2].items||[]).forEach(function(i){T[i.fullUrl]=dec(i.title)});
      var L=(r[0]||[]).filter(function(x){return x.u!==hero}).slice(0,5);
      if(L.length<3)throw 0;
      vak.pop.innerHTML=kop('Meest gelezen vandaag')+'<ol>'+L.map(function(x,i){return '<li><a href="'+esc(x.u)+'"><b>'+(i+1)+'</b><span>'+esc(T[x.u]||x.t)+'</span></a></li>'}).join('')+'</ol>';
    }).catch(function(){vak.pop.remove()});
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
        return '<li><a href="'+esc(e.fullUrl)+'"><span class="mzh-dt"><i>'+d.d+'</i><b>'+d.n+'</b><i>'+d.m+'</i></span><span class="mzh-ev"><b>'+esc(dec(e.title))+'</b><small>'+d.u+(l.addressTitle?' · '+esc(dec(l.addressTitle)):'')+(st&&st!==l.addressTitle?', '+esc(dec(st)):'')+'</small></span></a></li>'}).join('')+'</ul>';
    }).catch(function(){vak.week.remove()});
    /* Nieuw in de Kennisbank */
    fetch('/kennisbank?format=json').then(function(r){return r.json()}).then(function(j){
      var ETEN=/^(recept|koken|moluks eten|eten|keuken|sambal|sago|sagomeel|sagopalm|sagokoekjes|sagu lempeng|ikan bakar|ikan asar|gerookte vis|vis|kokos|hapjes|kue|kenari|colo-colo|koho-koho|bagea|papeda)$/i;
      var eten=function(i){return /hoe maak je|\b(eten|recepten?|keuken|sambals?|sago|sagu|ikan|hapjes|koken|ingrediënten|papeda)\b/i.test(i.title||'')||(i.tags||[]).some(function(t){return ETEN.test(String(t).trim())})};
      /* Nieuw in de Kennisbank: niets over eten */
      var K=(j.items||[]).filter(function(i){return !eten(i)}).sort(function(a,b){return b.publishOn-a.publishOn}).slice(0,3);if(!K.length){vak.kb.remove();return}
      vak.kb.innerHTML=kop('Nieuw in de Kennisbank','/weten','Alles')+'<ul>'+K.map(function(i){return '<li><a href="'+esc(i.fullUrl)+'">'+esc(dec(i.title))+'</a></li>'}).join('')+'</ul>';
    }).catch(function(){vak.kb.remove()});
    /* De boekenplank: dezelfde boeken als het oude Toko Buku-blok, anders de nieuwste op voorraad */
    fetch('/store?format=json').then(function(r){return r.json()}).then(function(j){
      var I=j.items||[],keus=[].slice.call(document.querySelectorAll('#mzmob section.mzv-band .bks a[href*="/store/p/"]')).map(function(a){return a.getAttribute('href').split('?')[0]});
      var B=keus.length?keus.map(function(u){return I.filter(function(i){return i.fullUrl===u})[0]}).filter(Boolean):[];
      I.forEach(function(i){var v=(i.variants||[])[0]||{};if(B.length<5&&B.indexOf(i)<0&&(v.unlimited||v.qtyInStock>0))B.push(i)});
      B=B.slice(0,5);if(!B.length){vak.boek.remove();return}
      vak.boek.innerHTML=kop('Toko Buku','/store','Bekijk alle boeken')+'<p class="mzh-sub">Elke aankoop steunt MOZA.nu.</p><div class="mzh-bks">'+B.map(function(i){var v=(i.variants||[])[0]||{},p=v.onSale&&v.salePriceMoney?v.salePriceMoney.value:(v.priceMoney||{}).value,lab=((i.tags||[]).filter(function(t){return /^label:/i.test(t)})[0]||'').replace(/^label:\s*/i,'');
        var im=((i.items||[])[0]||{}).assetUrl||i.assetUrl;return '<a href="'+esc(i.fullUrl)+'">'+(im?'<img src="'+esc(im)+'?format=300w" alt="" loading="lazy">':'')+(lab?'<span class="mzh-lab">'+esc(lab)+'</span>':'')+'<b>'+esc(dec(i.title))+'</b>'+(p?'<span class="mzh-pr">€ '+String(Number(p).toFixed(2)).replace('.',',')+'</span>':'')+'</a>'}).join('')+'</div>';
    }).catch(function(){vak.boek.remove()});
    return true;
  }


  /* ---------- Artikelen in Lezen (ook rubrieken): kop zoals de mockup ----------
     label(s) + kop + datum en knoppen, daaronder pas de foto met de maker eronder */
  var VASTE=/\/cover-(kaart-van-de-week|achter-de-foto|leeswijzer|woord-van-de-week|dit-weekend|deze-week-toen|jullie-zeiden|moza-deze-maand)\.png/i;
  var NM={dwt:'Deze week toen',dw:'Dit weekend',kvdw:'Kaart van de week',adf:'Achter de foto',lw:'Leeswijzer',wvdw:'Woord van de week',jz:'Jullie zeiden',mdm:'MOZA deze maand'};
  function artikelKop(){
    if(!/^\/lezen\/[^\/]+/.test(P)||/^\/lezen\/(category|tag)\//.test(P))return true;
    var hero=document.querySelector('.moza-hero'),ht=hero&&hero.querySelector('.moza-hero-t'),dl=document.querySelector('.moza-dateline');
    if(!hero||!ht||!dl)return false;
    var rub=H.classList.contains('mzr');
    if(rub&&!document.querySelector('.mzr-hero'))return false; /* wacht op de rubriekopmaak */
    if(document.getElementById('mz-akop'))return true;
    var kop=document.createElement('header');kop.id='mz-akop';
    hero.parentNode.insertBefore(kop,hero);
    /* labels: rubriek (lichtblauw, Dit weekend roze) en de categorieën in blauwe kapitalen */
    var lab=document.createElement('div');lab.className='mzak-lab';
    var naam='';for(var k in NM)if(H.classList.contains('mzr-'+k))naam=NM[k];
    var cats=[].map.call(ht.querySelectorAll('.blog-item-category'),function(a){return a.textContent.trim()}).filter(Boolean);
    lab.innerHTML=(naam?'<span class="mzs-tag'+(/^dit weekend/i.test(naam)?' roze':'')+'">'+esc(naam)+'</span>':'')+(cats.length?'<span class="mzak-cat">'+cats.map(esc).join(' · ')+'</span>':'');
    kop.appendChild(lab);
    var h1=ht.querySelector('h1');if(h1)kop.appendChild(h1);
    kop.appendChild(dl);
    ht.style.display='none';
    /* Deze week toen en Dit weekend: de grote datum of de dagen uit de rubriekopmaak onder de kop */
    var big=document.querySelector('.mzr-hero .mzr-big'),sub=document.querySelector('.mzr-hero .mzr-sub');
    if(big||sub){var g=document.createElement('div');g.className='mzak-groot';if(big)g.appendChild(big);if(sub)g.appendChild(sub);kop.appendChild(g)}
    /* vaste rubriekafbeelding met tekst: geen foto bovenaan */
    var img=hero.querySelector('img');
    if(!img||VASTE.test(img.getAttribute('src')||img.src||''))hero.classList.add('mzak-geen');
    return true;
  }

  /* ---------- Rechterkolom bij artikelen: peiling, Meest gelezen vandaag, Steun MOZA (zoals de mockup) ---------- */
  function artikelRechts(){
    if(!/^\/lezen\/[^\/]+/.test(P)||/^\/lezen\/(category|tag)\//.test(P))return true;
    var R=document.querySelector('.moza-right');if(!R)return false;
    if(document.getElementById('mz-arechts'))return true;
    var box=document.createElement('div');box.id='mz-arechts';R.insertBefore(box,R.firstChild);R.classList.add('mz-ar-aan');
    var pl=window.MOZA_POLL,h='';
    if(pl&&pl.q&&pl.url)h+='<a class="mzar-peil" href="'+esc(pl.url)+'"><span class="mzar-k">Peiling</span><b>'+esc(pl.q)+'</b><span class="mzar-bt">Doe mee →</span></a>';
    h+='<section class="mzar-pop" hidden><h3>Meest gelezen vandaag</h3><ol></ol></section>';
    h+='<a class="mzar-steun" href="/doneer"><span class="mzar-k">Steun MOZA</span><b>Met een donatie houd je MOZA.nu gratis en onafhankelijk.</b><span class="mzar-bt">Doneer aan MOZA →</span></a>';
    box.innerHTML=h;
    var hier=location.pathname.replace(/\/+$/,''),d=ymdNL(new Date());
    Promise.all([gcTop(d,'mgc:top:'+d),fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).catch(function(){return {}})]).then(function(r){
      var T={};(r[1].items||[]).forEach(function(i){T[i.fullUrl]=dec(i.title)});
      var L=(r[0]||[]).filter(function(x){return x.u!==hier}).slice(0,3);if(L.length<3)return;
      var sec=box.querySelector('.mzar-pop');sec.querySelector('ol').innerHTML=L.map(function(x,i){return '<li><a href="'+esc(x.u)+'"><b>'+(i+1)+'</b><span>'+esc(T[x.u]||x.t)+'</span></a></li>'}).join('');sec.hidden=false;
    }).catch(function(){});
    return true;
  }

  /* ---------- Hero's van de overige pagina's: compact en in de kleur uit de mockup ---------- */
  var KLEUR=[[/^\/(events|agenda|evenementen)$/,'lb'],[/^\/weten$/,'bl'],[/^\/podium$/,'rz'],[/^\/store$/,'rz'],[/^\/nieuws\/maluku$/,'bl'],[/^\/sejarah-maluku$/,'lb'],[/^\/begrippen$/,'lb'],[/^\/organisaties$/,'bl'],[/^\/beeldbank$/,'zw'],[/^\/onderzoek$/,'lb'],[/^\/(doneer|maandelijks-doneren)$/,'rz'],[/^\/over-moza$/,'rz']];
  function paginaHero(){
    var kl=null;KLEUR.forEach(function(k){if(!kl&&k[0].test(P))kl=k[1]});if(!kl)return true;
    var h1=[].filter.call(document.querySelectorAll('#page h1, main h1, #siteWrapper h1'),function(h){return !h.closest('#header')&&h.getClientRects().length&&!/Marquee/.test(h.className)})[0];
    if(!h1)return false;
    var hero=h1.closest('#mzkop');
    var e=h1;for(var i=0;!hero&&i<4&&e&&e!==document.body;i++){if(/(^|[\s-])hero(\s|$)/.test(String(e.className))){hero=e;break}e=e.parentElement}
    if(!hero){e=h1.parentElement;for(var j=0;j<5&&e&&e.id!=='siteWrapper';j++){var b=e.getBoundingClientRect(),bg=getComputedStyle(e).backgroundColor;if(b.width>innerWidth*.85&&b.height<700&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='rgb(255, 255, 255)'){hero=e;break}e=e.parentElement}}
    if(!hero){var p=h1.parentElement;hero=/^(in|wrap|mdn-in|inner)$/.test(String(p.className).trim())?p.parentElement:p}
    if(!hero||hero.classList.contains('mz-ph'))return true;
    hero.classList.add('mz-ph','mz-ph-'+kl);H.classList.add('mz-ph-pagina');
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
    var ser=document.querySelector('.mzf .mzf-brand .mzf-ser');
    if(ser&&!document.querySelector('.mzf .mz-fslog')){var g=document.createElement('span');g.className='mz-fslog';g.textContent='Molukse Zaken lees je op';ser.parentNode.insertBefore(g,ser);ser.textContent='MOZA.nu';ser.classList.add('mz-fmoza')}
    if(c.querySelector('.mz-misniets'))return true;
    var h=document.createElement('h2');h.className='mz-misniets';h.textContent='Mis niets';
    var l=c.querySelector('.mzf-h');c.insertBefore(h,l?l.nextSibling:c.firstChild);
    return true;
  }

  function start(){balk();var f=0;(function w(){if(footer()||++f>40)return;setTimeout(w,250)})();var b=0;(function q(){bronnen();if(++b<20)setTimeout(q,500)})();var m=0;(function v(){if(voorpagina()||++m>40)return;setTimeout(v,250)})();var h2=0;(function w2(){if(meer2()||++h2>60)return;setTimeout(w2,250)})();var n=0;(function g(){if(deelknop()||++n>40)return;setTimeout(g,250)})();var rk=0;(function k(){if(artikelKop()||++rk>60)return;setTimeout(k,250)})();var ar=0;(function k2(){if(artikelRechts()||++ar>60)return;setTimeout(k2,250)})();var ph=0;(function k3(){if(paginaHero()||++ph>40)return;setTimeout(k3,250)})()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
