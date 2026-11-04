/* MOZA covers-paneel. Starten met de bladwijzer "MOZA covers" op de productpagina van Squarespace
   (Commerce → Products). Laat alle boeken met maar één foto zien. Sleep een foto op een boek:
   het paneel opent dat boek in de editor van Squarespace, zet de foto erbij en slaat op. */
(function(){
  if(window.__mzCovers){window.__mzCovers.toon();return;}
  var LIJST='/config/commerce/products/physical';
  if(location.pathname.indexOf('/config/commerce/products')!==0){
    alert('Open eerst Products in Squarespace (Commerce → Products) en klik dan nog een keer op de bladwijzer.');
    location.href=LIJST; return;
  }
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
  var esc=function(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  function leaf(re){return [].filter.call(document.querySelectorAll('body *'),function(e){return e.children.length===0&&re.test(e.textContent.trim());});}
  function zichtbaar(e){return e&&e.offsetParent!==null;}

  /* ---------- paneel ---------- */
  var css=document.createElement('style');
  css.textContent='#mzc{position:fixed;top:12px;right:12px;bottom:12px;width:380px;z-index:2147483000;background:#F4F2EC;color:#111;border:3px solid #111;box-shadow:8px 8px 0 #1F3BD1;font:14px/1.4 "Hanken Grotesk",system-ui,sans-serif;display:flex;flex-direction:column}'+
    '#mzc header{background:#111;color:#E9F25A;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px}'+
    '#mzc header b{font-size:16px;font-weight:900}#mzc header button{background:#E9F25A;border:2px solid #E9F25A;font-weight:900;cursor:pointer;padding:2px 8px}'+
    '#mzc .mzc-uitleg{padding:10px 14px;border-bottom:2px solid #111;font-size:13px}'+
    '#mzc .mzc-zoek{margin:10px 14px;padding:8px;border:2px solid #111;font:inherit}'+
    '#mzc .mzc-lijst{overflow:auto;flex:1;padding:0 14px 14px}'+
    '#mzc .mzc-boek{display:grid;grid-template-columns:48px 1fr;gap:10px;border:2px solid #111;background:#fff;padding:8px;margin-top:10px}'+
    '#mzc .mzc-boek img{width:48px;height:72px;object-fit:cover;border:1px solid #111;background:#ddd}'+
    '#mzc .mzc-t{font-weight:900;line-height:1.2}#mzc .mzc-isbn{font-size:12px;cursor:pointer;text-decoration:underline dotted}'+
    '#mzc .mzc-drop{grid-column:1/-1;border:2px dashed #111;padding:10px;text-align:center;font-weight:800;font-size:13px}'+
    '#mzc .mzc-drop.over{background:#E9F25A}#mzc .mzc-boek.bezig .mzc-drop{background:#1F3BD1;color:#fff;border-style:solid}'+
    '#mzc .mzc-boek.klaar{box-shadow:4px 4px 0 #1F3BD1}#mzc .mzc-boek.klaar .mzc-drop{background:#111;color:#E9F25A;border-style:solid}'+
    '#mzc .mzc-boek.fout .mzc-drop{background:#FF4D2E;color:#111;border-style:solid}'+
    '#mzc .mzc-status{padding:8px 14px;border-top:2px solid #111;font-size:12px;min-height:18px}';
  document.head.appendChild(css);
  var p=document.createElement('div'); p.id='mzc';
  p.innerHTML='<header><b>MOZA covers</b><span><button data-a="min" title="Kleiner">–</button> <button data-a="sluit" title="Sluiten">×</button></span></header>'+
    '<div class="mzc-uitleg">Boeken met maar één foto. Klik op het ISBN om het te kopiëren en zoek het op bij het CB. Sleep daarna de achterkant (of een binnenpagina) op het boek. Sleep bestanden van je computer; een plaatje uit een ander browservenster lukt meestal niet.</div>'+
    '<input class="mzc-zoek" placeholder="Zoek op titel of ISBN">'+
    '<div class="mzc-lijst">Laden…</div><div class="mzc-status"></div>';
  document.body.appendChild(p);
  var lijstEl=p.querySelector('.mzc-lijst'), statusEl=p.querySelector('.mzc-status');
  function status(t){statusEl.textContent=t;}
  p.querySelector('[data-a=sluit]').onclick=function(){p.style.display='none';};
  p.querySelector('[data-a=min]').onclick=function(){var m=p.style.bottom==='auto';p.style.bottom=m?'12px':'auto';lijstEl.style.display=m?'':'none';};
  window.__mzCovers={toon:function(){p.style.display='flex';}};

  /* ---------- boeken laden ---------- */
  var BOEKEN=[];
  function alles(url,acc){return fetch(url).then(function(r){return r.json();}).then(function(j){acc=acc.concat(j.items||[]);var n=j.pagination&&j.pagination.nextPage;return n?alles(j.pagination.nextPageUrl+'&format=json',acc):acc;});}
  function isbnVan(it){var d=document.createElement('div');d.innerHTML=it.excerpt||'';var l=[].map.call(d.querySelectorAll('li'),function(x){return x.textContent.replace(/[-\s]/g,'');});for(var i=0;i<l.length;i++){if(/^97[89]\d{10}$/.test(l[i]))return l[i];}return '';}
  function teken(){
    var q=p.querySelector('.mzc-zoek').value.trim().toLowerCase();
    var zicht=BOEKEN.filter(function(b){return !q||b.titel.toLowerCase().indexOf(q)>=0||b.isbn.indexOf(q)>=0;});
    lijstEl.innerHTML=zicht.length?'':'Geen boeken gevonden.';
    zicht.forEach(function(b){
      var el=document.createElement('div'); el.className='mzc-boek'+(b.klaar?' klaar':'');
      el.innerHTML='<img src="'+esc(b.thumb)+'" alt=""><div><div class="mzc-t">'+esc(b.titel)+'</div><div class="mzc-isbn" title="Kopieer ISBN">'+esc(b.isbn)+'</div><div>'+b.fotos+' foto'+(b.fotos===1?'':"'s")+'</div></div>'+
        '<div class="mzc-drop">'+(b.klaar?'Toegevoegd ✓ — sleep hier nog meer':'Sleep hier de achterkant')+'</div>';
      el.querySelector('.mzc-isbn').onclick=function(){try{navigator.clipboard.writeText(b.isbn);status('ISBN '+b.isbn+' gekopieerd.');}catch(e){}};
      var dz=el.querySelector('.mzc-drop');
      el.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('over');});
      el.addEventListener('dragleave',function(){dz.classList.remove('over');});
      el.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('over');neem(e.dataTransfer,b,el);});
      b.el=el; lijstEl.appendChild(el);
    });
  }
  p.querySelector('.mzc-zoek').addEventListener('input',teken);
  alles('/store?format=json',[]).then(function(items){
    items.forEach(function(it){
      var isbn=isbnVan(it); var n=(it.items||[]).length;
      if(!isbn||n>=2)return;
      var u=(it.items&&it.items[0]&&it.items[0].assetUrl)||it.assetUrl||'';
      BOEKEN.push({id:it.id,titel:(it.title||'').trim(),isbn:isbn,fotos:n,thumb:u?u.split('?')[0]+'?format=100w':''});
    });
    BOEKEN.sort(function(a,b){return a.titel.localeCompare(b.titel,'nl');});
    status(BOEKEN.length+' boeken met maar één foto.'); teken();
  }).catch(function(){lijstEl.textContent='Laden lukte niet. Ververs de pagina en probeer opnieuw.';});

  /* ---------- bestanden ontvangen ---------- */
  function neem(dt,b,el){
    var files=[].filter.call(dt.files||[],function(f){return /^image\/(jpeg|png|webp|gif)$/.test(f.type);});
    if(files.length){wachtrij(b,el,files);return;}
    var url=(dt.getData('text/uri-list')||'').split('\n').filter(function(x){return /^https?:/.test(x);})[0];
    if(!url){status('Dat is geen afbeelding. Sleep een jpg- of png-bestand.');return;}
    status('Afbeelding ophalen…');
    fetch(url).then(function(r){if(!r.ok)throw 0;return r.blob();}).then(function(bl){
      if(!/^image\//.test(bl.type))throw 0;
      wachtrij(b,el,[new File([bl],b.isbn+'_extra.'+(bl.type.split('/')[1]||'jpg'),{type:bl.type})]);
    }).catch(function(){status('Die afbeelding mag ik niet ophalen vanaf die site. Sla hem eerst op en sleep dan het bestand.');});
  }
  var rij=Promise.resolve();
  function wachtrij(b,el,files){
    el.className='mzc-boek bezig'; el.querySelector('.mzc-drop').textContent='Wacht op beurt…';
    rij=rij.then(function(){return voegToe(b,el,files);}).catch(function(){});
  }

  /* ---------- via de editor van Squarespace ---------- */
  function klik(e){var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,view:window};
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){e.dispatchEvent(t.indexOf('pointer')===0?new PointerEvent(t,o):new MouseEvent(t,o));});}
  function wacht(fn,ms){var t0=Date.now();return new Promise(function(res,rej){(function k(){var v;try{v=fn();}catch(e){}if(v)return res(v);if(Date.now()-t0>ms)return rej(new Error('time-out'));setTimeout(k,300);})();});}
  function editorOpen(t){var k=t.slice(0,25);return leaf(/^Edit /).some(function(e){return e.textContent.trim().slice(5).indexOf(k)===0;});}
  function product(id){return fetch('/api/commerce/products/'+id).then(function(r){return r.json();});}
  async function sluitAlles(){
    for(var i=0;i<3&&leaf(/^Edit /).length;i++){
      sluitEditor(); await sleep(1200);
      var l=[].filter.call(document.querySelectorAll('button,[role=button]'),function(x){return x.textContent.trim()==='Leave'&&zichtbaar(x);})[0];
      if(l){l.click(); await sleep(1200);}
    }
  }
  function sluitEditor(){var c=[].filter.call(document.querySelectorAll('button,[role=button],a,div,span'),function(e){return e.textContent.trim().toUpperCase()==='CANCEL'&&zichtbaar(e)&&e.children.length<=1;}).pop();if(c)c.click();}

  async function voegToe(b,el,files){
    var drop=el.querySelector('.mzc-drop');
    function stap(t){drop.textContent=t;status(b.titel+': '+t);}
    try{
      var voor=await product(b.id); var n0=(voor.images||[]).length;
      if(location.pathname!==LIJST){stap('Naar de productlijst…');history.pushState({},'',LIJST);dispatchEvent(new PopStateEvent('popstate'));await sleep(2000);}
      if(leaf(/^Edit /).length){await sluitAlles();}
      stap('Boek zoeken…');
      var zoek=await wacht(function(){return document.querySelector('input[placeholder^="Search by products"]');},10000);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(zoek,b.titel.slice(0,40));
      zoek.dispatchEvent(new Event('input',{bubbles:true}));
      var naam=await wacht(function(){return leaf(/./).filter(function(e){return e.textContent.trim()===b.titel&&!e.closest('#mzc');})[0];},10000);
      var rijEl=naam; while(rijEl&&!rijEl.querySelector('img'))rijEl=rijEl.parentElement;
      stap('Editor openen…'); klik(rijEl.querySelector('img'));
      await wacht(function(){return editorOpen(b.titel)&&document.querySelector('input[type=file][accept*="image"]');},15000);
      stap('Foto uploaden…');
      var inp=document.querySelector('input[type=file][accept*="image"]'); var d=new DataTransfer();
      files.forEach(function(f){d.items.add(f);}); inp.files=d.files; inp.dispatchEvent(new Event('change',{bubbles:true}));
      await sleep(1500);
      await wacht(function(){return ![].some.call(document.querySelectorAll('img'),function(i){return /^blob:/.test(i.src)&&zichtbaar(i);});},45000);
      await sleep(1500);
      stap('Opslaan…');
      var save=await wacht(function(){return [].filter.call(document.querySelectorAll('button,[role=button]'),function(e){return /^save/i.test(e.textContent.trim())&&zichtbaar(e);})[0];},10000);
      save.click(); await sleep(800);
      var keus=voor.visibility&&voor.visibility.state==='VISIBLE'?'Publish':'Save as Hidden';
      var optie=[].filter.call(document.querySelectorAll('body *'),function(e){return e.textContent.trim()===keus&&zichtbaar(e)&&!e.closest('#mzc');}).pop();
      if(optie)optie.click();
      stap('Controleren…');
      var na=null;
      for(var i=0;i<30&&!na;i++){await sleep(1000);var x=await product(b.id);if((x.images||[]).length>=n0+files.length)na=x;}
      if(!na){var y=await product(b.id);if((y.images||[]).length>n0)na=y;}
      await sleep(800); if(leaf(/^Edit /).length){await sluitAlles();}
      if(!na)throw new Error('foto niet gevonden na opslaan');
      b.fotos=na.images.length; b.klaar=true; el.className='mzc-boek klaar';
      drop.textContent='Toegevoegd ✓ ('+b.fotos+" foto's)";
      status(b.titel+': '+files.length+' foto'+(files.length>1?"'s":'')+' toegevoegd.');
    }catch(e){
      el.className='mzc-boek fout'; drop.textContent='Niet gelukt. Probeer opnieuw of doe het met de hand.';
      status(b.titel+': niet gelukt ('+(e&&e.message||e)+').');
      try{await sluitAlles();}catch(_){}
    }
  }
})();
