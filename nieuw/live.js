/* MOZA live onderdelen (voor iedereen). Draait niet in de testversie. */
(function(){
  var H=document.documentElement;
  function esc(t){return String(t||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  /* Rubriekstukken: kop zoals een nieuwsartikel */
  var VASTE=/\/cover-(kaart-van-de-week|achter-de-foto|leeswijzer|woord-van-de-week|dit-weekend|deze-week-toen|jullie-zeiden|moza-deze-maand)\.png/i;
  var NM={dwt:'Deze week toen',dw:'Dit weekend',kvdw:'Kaart van de week',adf:'Achter de foto',lw:'Leeswijzer',wvdw:'Woord van de week',jz:'Jullie zeiden',mdm:'MOZA deze maand'};
  function rubriekKop(){
    if(H.classList.contains('mz-nieuw'))return true;
    if(!H.classList.contains('mzr'))return document.readyState==='complete';
    var hero=document.querySelector('.moza-hero');if(!hero)return false;
    if(hero.getAttribute('data-mzrk'))return true;hero.setAttribute('data-mzrk','1');
    var naam='';for(var k in NM)if(H.classList.contains('mzr-'+k))naam=NM[k];
    var rij=hero.querySelector('.moza-chiprow .blog-item-meta-wrapper')||hero.querySelector('.moza-chiprow');
    if(naam&&rij){var c=document.createElement('span');c.className='mzrk-tag'+(/^dit weekend/i.test(naam)?' roze':'');c.textContent=naam;rij.insertBefore(c,rij.firstChild)}
    var img=hero.querySelector('img');
    if(img&&VASTE.test(img.getAttribute('src')||img.src||'')){
      var fig=document.querySelector('.blog-item-content .sqs-html-content figure img');
      if(fig){var f=fig.closest('figure'),cap=f&&f.nextElementSibling,cr=hero.querySelector('.moza-credit');
        img.removeAttribute('srcset');img.src=(fig.getAttribute('src')||fig.src).split('?')[0]+'?format=1500w';
        var m=cap&&/Beeld:\s*([^.<]+)/.exec(cap.textContent||'');if(cr)cr.innerHTML=m?'<b>Beeld:</b> '+esc(m[1].trim()):'';
        if(f)f.classList.add('mzr-hide');if(cap&&cap.tagName==='P'&&/Beeld:/.test(cap.textContent))cap.classList.add('mzr-hide')}
      else{hero.classList.add('mzrk-vlak');var cr2=hero.querySelector('.moza-credit');if(cr2)cr2.remove()}}
    return true;
  }
  var n=0;(function k(){if(rubriekKop()||++n>60)return;setTimeout(k,250)})();
  /* Voorpagina (oude opmaak): lijst onder de hero = de 5 nieuwste stukken uit Lezen, zonder de hero en zonder de 3 in Net binnen */
  var P=location.pathname.replace(/\/+$/,'')||'/';
  var MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var RUBS=['Kaart van de week','Achter de foto','Leeswijzer','Woord van de week','Dit weekend','Deze week toen','Jullie zeiden','MOZA deze maand'];
  function dec(t){var d=document.createElement('textarea');d.innerHTML=t||'';return d.value}
  function lijst(){
    if(P!=='/'||H.classList.contains('mz-nieuw'))return true;
    var ul=document.querySelector('#mzmob ul.mzx-list'),nb=document.querySelector('#mzmob .col.r .sec.o5'),hero=document.querySelector('#mzmob a.hero.o1');
    if(!ul||!hero)return false;
    if(!nb&&++lijst.w<12)return false; /* op de telefoon staat Net binnen er niet */
    var heroU=(hero.getAttribute('href')||'').replace(/\/+$/,'');
    fetch('/lezen?format=json&v='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).then(function(j){
      var U=function(i){return (i.fullUrl||'').replace(/\/+$/,'')};
      var rubVan=function(i){var tags=i.tags||[],rub=null;if(tags.some(function(t){return /^rubriek$/i.test(t)}))RUBS.forEach(function(r){if(!rub&&tags.some(function(t){return t.toLowerCase()===r.toLowerCase()}))rub=r});return rub};
      var A=(j.items||[]).filter(function(i){return U(i)!==heroU});
      /* Net binnen: de 3 nieuwste, met Kaart van de week en MOZA deze maand, zonder de andere rubrieken */
      var NB=[];
      if(nb){NB=A.filter(function(i){var r=rubVan(i);return !r||r==='Kaart van de week'||r==='MOZA deze maand'}).slice(0,3);
        var tl=nb.querySelector('.tl');
        if(tl&&NB.length){var nh=NB.map(function(i){var d=new Date(i.publishOn);return '<a class="" href="'+esc(i.fullUrl)+'"><span class="d">'+d.getDate()+' '+MND[d.getMonth()]+'</span><span class="t">'+esc(dec(i.title))+'</span></a>'}).join('');
          var zetNb=function(){if(tl.innerHTML!==nh)tl.innerHTML=nh};zetNb();
          var t1=Date.now();new MutationObserver(function(m,o){if(Date.now()-t1>20000){o.disconnect();return}zetNb()}).observe(tl,{childList:true})}}
      /* onder de hero: de 5 nieuwste die niet al in de hero of in Net binnen staan */
      var L=A.filter(function(i){return NB.indexOf(i)<0}).slice(0,5);if(L.length<3)return;
      var html=L.map(function(i){
        var rub=rubVan(i);
        var d=new Date(i.publishOn),dag=d.getDate()+' '+MND[d.getMonth()];
        var k=rub?'<b class="rb" style="background:'+(rub==='Dit weekend'?'#FF7AB6':'#C9D3FF')+';color:#111">'+esc(rub)+'</b>':(((i.categories||[])[0])?'<b class="rb" style="background:#1F3BD1;color:#fff">'+esc((i.categories||[])[0])+'</b>':'');
        return '<li><a href="'+esc(i.fullUrl)+'"><span class="k">'+k+'</span><span class="t">'+esc(dec(i.title))+'<small class="w">'+dag+'</small></span></a></li>'}).join('');
      var zet=function(){if(ul.innerHTML!==html)ul.innerHTML=html};
      zet();
      var t0=Date.now();new MutationObserver(function(m,o){if(Date.now()-t0>20000){o.disconnect();return}zet()}).observe(ul,{childList:true});
    }).catch(function(){});
    return true;
  }
  lijst.w=0;
  var n2=0;(function k2(){if(lijst()||++n2>60)return;setTimeout(k2,250)})();

})();
