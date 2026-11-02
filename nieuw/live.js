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
})();
