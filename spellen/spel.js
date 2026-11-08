/* MOZA Spellen: laadt een spel uit deze map in een blok op moza.nu.
   Gebruik in een Squarespace-codeblok:
     <div class="mz-spel" data-spel="woord"></div>
     <script src="https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@COMMIT/spellen/spel.js"></script>
   data-spel is de naam van het bestand in spellen/ zonder .html (woord, puzzel).
   Het spel draait in een iframe, zodat de opmaak van de site en het spel elkaar niet raken.
   Dit script zorgt dat de iframe meegroeit, nachtmodus volgt, vensters in beeld komen
   en het toetsenbord werkt zonder eerst in het spel te klikken. */
(function(){
  var cs = document.currentScript;
  var BASE = (cs && cs.src) ? cs.src.replace(/spel\.js(\?.*)?$/, '') : 'https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@main/spellen/';
  var H = document.documentElement;

  var SHIM_CSS =
    'html,body{overflow:hidden!important;height:auto!important}' +
    'body{position:relative!important;min-height:0!important}' +
    '.sluier,.klaarscherm{position:absolute!important;top:var(--mz-vt,0px)!important;height:var(--mz-vh,100vh)!important;bottom:auto!important;left:0!important;right:0!important}' +
    '.melding{position:absolute!important;top:calc(var(--mz-vt,0px) + 72px)!important;bottom:auto!important}' +
    '.app{min-height:0!important}' +
    '.raster{--tile:min(58px, calc((100vw - 32px - (var(--cols) - 1) * var(--gap)) / var(--cols)), calc((var(--mz-ph,800px) - 330px) / 6))!important}';

  /* Titel en intro staan al in het bericht zelf: in het spel verbergen. */
  var DUBBEL = {
    puzzel: 'header.kop,header.kop+p.intro{display:none!important}',
    woord: '.kop .titel{display:none!important}.kop{justify-content:flex-end!important}'
  };

  function start(el){
    if (el.getAttribute('data-geladen')) return;
    el.setAttribute('data-geladen', '1');
    var naam = (el.getAttribute('data-spel') || '').replace(/[^a-z0-9-]/g, '');
    if (!naam) return;
    el.innerHTML = '<p style="font-family:inherit;opacity:.7;padding:24px 0">Spel laden…</p>';
    fetch(BASE + naam + '.html').then(function(r){ if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(html){ bouw(el, html, naam); })
      .catch(function(){ el.innerHTML = '<p style="padding:24px 0">Het spel kon niet laden. Probeer het later nog eens.</p>'; });
  }

  /* ---------- Telefoon: spel opent schermvullend, als een app ---------- */
  var NAMEN = {woord:'Raad het woord', puzzel:'Kruiswoordpuzzel'};
  var APP_CSS = {
    puzzel:
      'html.mz-app .wrap{padding-block:8px 24px!important}' +
      'html.mz-app .spelkop{margin-bottom:6px!important;gap:8px!important}' +
      'html.mz-app .spelkop .knop{padding:6px 10px!important}' +
      'html.mz-app .spelkop .titel{font-size:16px!important}' +
      'html.mz-app .tijd{font-size:18px!important}' +
      'html.mz-app .speelveld{gap:16px!important}' +
      'html.mz-app .links{gap:8px!important;min-height:calc(100dvh - 16px)}' +
      'html.mz-app .balk{min-height:48px!important}html.mz-app .balk .tekst{font-size:15px!important}' +
      'html.mz-app .puzzelkaart{padding:8px!important;box-shadow:4px 4px 0 var(--schaduw)!important}' +
      'html.mz-app .raster{width:min(100%, calc((100dvh - 400px) * var(--n) / var(--r)))!important;margin:0 auto!important}' +
      'html.mz-app .gereedschap .knop{padding:7px 10px!important;font-size:14px!important}' +
      'html.mz-app .toets{display:flex!important;margin-top:auto!important;position:sticky;bottom:0;z-index:4;background:var(--bg);padding:6px 0 calc(6px + env(safe-area-inset-bottom,0px))}' +
      'html.mz-app .wrap{padding-left:max(8px,env(safe-area-inset-left,0px))!important;padding-right:max(8px,env(safe-area-inset-right,0px))!important}' +
      'html.mz-app .toets{gap:6px!important}html.mz-app .toets div{gap:4px!important}' +
      'html.mz-app .toets button{height:54px!important;max-width:none!important;font-size:20px!important}html.mz-app .toets button.wis{max-width:none!important;font-size:15px!important}',
    woord:
      'html.mz-app .toetsenbord{gap:7px!important}html.mz-app .toetsrij{gap:4px!important}' +
      'html.mz-app .toets{max-width:none!important;height:clamp(50px,7.5dvh,60px)!important;font-size:19px!important}' +
      'html.mz-app .toets.breed{max-width:none!important;font-size:13px!important}'
  };
  var APP_KADER =
    '.mzsp-app{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:#F4F2EC;color:#111}' +
    'html.moza-dark .mzsp-app{background:#121212;color:#F4F2EC}' +
    '.mzsp-app .bar{display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));border-bottom:3px solid currentColor;font-family:"Hanken Grotesk",system-ui,sans-serif}' +
    '.mzsp-app .bar b{flex:1;font-weight:900;font-size:18px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.mzsp-app .bar span{font-weight:900;font-size:12px;letter-spacing:.1em;background:#111;color:#E9F25A;padding:4px 8px}' +
    '.mzsp-app .bar button{font:inherit;font-weight:900;font-size:22px;line-height:1;width:40px;height:40px;border:2px solid currentColor;background:transparent;color:inherit;cursor:pointer}' +
    '.mzsp-app iframe{flex:1;width:100%;border:0;display:block;background:transparent}' +
    'html.mzsp-open,html.mzsp-open body{overflow:hidden!important;overscroll-behavior:none}' +
    '.mzsp-start{border:3px solid currentColor;padding:20px;display:flex;flex-direction:column;gap:12px;font-family:"Hanken Grotesk",system-ui,sans-serif}' +
    '.mzsp-start p{margin:0;font-size:16px}' +
    '.mzsp-start button{font:inherit;font-weight:900;font-size:18px;padding:14px 18px;background:#1F3BD1;color:#fff;border:3px solid #111;box-shadow:4px 4px 0 #111;cursor:pointer}' +
    'html.moza-dark .mzsp-start button{border-color:#F4F2EC;box-shadow:4px 4px 0 #FF7AB6}';
  /* Delen vanuit de pagina zelf: hier werken het deelmenu en de app-links het best. */
  window.mzDeel = function(doel, t, u, blob){
    var mobiel = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var tekst = t + '\n' + u;
    var file = null; try { if (blob) file = new File([blob], 'moza-score.png', {type: 'image/png'}); } catch(e){}
    if (doel === 'opslaan' && blob){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moza-score.png'; document.body.appendChild(a); a.click(); a.remove(); return 'opgeslagen'; }
    if (doel === 'whatsapp'){
      if (mobiel){ location.href = 'whatsapp://send?text=' + encodeURIComponent(tekst); return 'ok'; }
      window.open('https://wa.me/?text=' + encodeURIComponent(tekst), '_blank', 'noopener'); return 'ok';
    }
    if (mobiel && navigator.share){
      if (file && navigator.canShare && navigator.canShare({files: [file]})){ try { navigator.clipboard.writeText(tekst); } catch (e){} navigator.share({files: [file], text: tekst}).catch(function(){}); return 'ok'; }
      navigator.share({text: t, url: u}).catch(function(){}); return 'ok';
    }
    if (doel === 'facebook'){ try { navigator.clipboard.writeText(tekst); } catch (e){} window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u), '_blank', 'noopener'); return 'fb'; }
    try { navigator.clipboard.writeText(tekst); return 'gekopieerd'; } catch(e){ return false; }
  };

  function isTelefoon(){ return window.matchMedia('(max-width: 760px)').matches; }

  function launcher(el, html, naam){
    if (!document.getElementById('mzsp-app-css')){ var st = document.createElement('style'); st.id = 'mzsp-app-css'; st.textContent = APP_KADER; document.head.appendChild(st); }
    var held = el.closest && el.closest('.mzsp-held');
    el.innerHTML = held
      ? '<button type="button" class="mzsp-speel">' + (naam === 'puzzel' ? 'Start de puzzel' : 'Start het spel') + ' <span aria-hidden="true">\u2192</span></button>'
      : '<div class="mzsp-start"><p>Het spel opent schermvullend. Met het kruisje ga je terug.</p><button type="button">Speel ' + (NAMEN[naam] || 'het spel') + '</button></div>';
    el.querySelector('button').addEventListener('click', function(){ openApp(html, naam); });
    if (location.hash === '#spelen') openApp(html, naam);
  }

  function openApp(html, naam){
    if (document.querySelector('.mzsp-app')) return;
    var ov = document.createElement('div'); ov.className = 'mzsp-app'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', NAMEN[naam] || 'Spel');
    ov.innerHTML = '<div class="bar"><span>MOZA</span><b>' + (NAMEN[naam] || 'Spel') + '</b><button type="button" aria-label="Spel sluiten">✕</button></div>';
    var f = document.createElement('iframe'); f.title = NAMEN[naam] || 'Spel'; f.setAttribute('allow', 'web-share; clipboard-write');
    f.srcdoc = '<!doctype html><html class="mz-app"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
      '<style>[hidden]{display:none!important}' + (DUBBEL[naam] || '') + (APP_CSS[naam] || '') + '</style></head><body>' + html + '</body></html>';
    ov.appendChild(f); document.body.appendChild(ov);
    H.classList.add('mzsp-open');
    var dicht = false;
    function sluit(viaTerug){
      if (dicht) return; dicht = true;
      ov.remove(); H.classList.remove('mzsp-open');
      window.removeEventListener('popstate', terug);
      if (!viaTerug && history.state && history.state.mzspApp) history.back();
    }
    function terug(){ sluit(true); }
    try { history.pushState({mzspApp:1}, ''); window.addEventListener('popstate', terug); } catch(e){}
    ov.querySelector('.bar button').addEventListener('click', function(){ sluit(false); });
    f.addEventListener('load', function(){
      var d = f.contentDocument; if (!d) return;
      var r = d.documentElement;
      function thema(){ r.setAttribute('data-theme', H.classList.contains('moza-dark') ? 'dark' : 'light'); }
      thema();
      try { f.contentWindow.focus(); } catch(e){}
    });
  }

  function bouw(el, html, naam){
    if (isTelefoon()) return launcher(el, html, naam);
    var f = document.createElement('iframe');
    f.title = 'MOZA spel';
    f.setAttribute('scrolling', 'no');
    f.setAttribute('allow', 'web-share; clipboard-write');
    f.style.cssText = 'display:block;width:100%;border:0;height:700px;overflow:hidden;background:transparent';
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>[hidden]{display:none!important}' + SHIM_CSS + (DUBBEL[naam] || '') + '</style></head><body>' + html + '</body></html>';
    el.innerHTML = '';
    el.appendChild(f);

    f.addEventListener('load', function(){
      var w = f.contentWindow, d = f.contentDocument;
      if (!d) return;
      var r = d.documentElement;

      function thema(){ r.setAttribute('data-theme', H.classList.contains('moza-dark') ? 'dark' : 'light'); }
      thema();
      try { new MutationObserver(thema).observe(H, {attributes:true, attributeFilter:['class']}); } catch(e){}

      function hoogte(){
        var h = Math.ceil(d.body.getBoundingClientRect().height);
        if (Math.abs(h - f.offsetHeight) > 2) f.style.height = h + 'px';
      }
      function zicht(){
        var b = f.getBoundingClientRect(), vh = window.innerHeight;
        var top = Math.max(0, -b.top), zichtbaar = Math.max(200, Math.min(vh, b.bottom) - Math.max(0, b.top));
        r.style.setProperty('--mz-vt', top + 'px');
        r.style.setProperty('--mz-vh', zichtbaar + 'px');
        r.style.setProperty('--mz-ph', vh + 'px');
      }
      try { new ResizeObserver(function(){ hoogte(); zicht(); }).observe(d.body); } catch(e){ setInterval(hoogte, 500); }
      window.addEventListener('scroll', zicht, {passive:true});
      window.addEventListener('resize', function(){ hoogte(); zicht(); });
      hoogte(); zicht();

      /* Het spel springt naar boven bij een nieuw scherm: laat dan de pagina naar het spel scrollen. */
      w.scrollTo = function(){ var b = f.getBoundingClientRect(); if (b.top < 0) f.scrollIntoView({block:'start'}); };

      /* Toetsen die op de pagina vallen doorgeven aan het spel, behalve als iemand in een veld typt. */
      document.addEventListener('keydown', function(e){
        var t = e.target, tag = (t && t.tagName) || '';
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var b = f.getBoundingClientRect();
        if (b.bottom < 0 || b.top > window.innerHeight) return;
        var ev = new w.KeyboardEvent('keydown', {key:e.key, code:e.code, shiftKey:e.shiftKey, bubbles:true, cancelable:true});
        d.dispatchEvent(ev);
        if (ev.defaultPrevented) e.preventDefault();
      });
    });
  }

  /* Automatisch: in de pagina-injectie van de blog /spellen staat
       window.mzSpellen = {'raad-het-woord':'woord', 'kruiswoordpuzzel':'puzzel'};
     Op een bericht met zo'n adres zet dit script het spel onder de tekst van het bericht. */
  /* Klein tegelbeeld in de kop, in de stijl van het spel zelf */
  function tegels(spel){
    var h = '';
    if (spel === 'puzzel'){
      var cel = {}; 'PUZZEL'.split('').forEach(function(l, i){ cel['1,' + i] = l; });
      'KENNIS'.split('').forEach(function(l, i){ cel[i + ',4'] = l; });
      h = '<div class="tg tg-p">';
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++){
        var l = cel[r + ',' + c];
        h += l ? '<i class="' + (r === 1 && c === 4 ? 'ge' : 'wi') + '">' + l + '</i>' : '<i class="lg"></i>';
      }
      return h + '</div>';
    }
    var rij = [['mi','ge','mi','mi'], ['bl','mi','ge','mi'], ['bl','bl','bl','bl']], woord = 'MOZA';
    h = '<div class="tg tg-w">';
    rij.forEach(function(k, r){ k.forEach(function(x, c){ h += '<i class="' + x + '">' + (r === 2 ? woord[c] : '') + '</i>'; }); });
    return h + '</div>';
  }

  function auto(){
    var map = window.mzSpellen || {};
    var slug = location.pathname.replace(/\/+$/, '').split('/').pop();
    var spel = map[slug];
    if (!spel || document.querySelector('.mz-spel[data-spel]')) return;
    var plek = document.querySelector('.blog-item-content') || document.querySelector('article .sqs-layout') || document.querySelector('article');
    if (!plek) return;
    var div = document.createElement('div');
    div.className = 'mz-spel'; div.setAttribute('data-spel', spel);
    div.style.cssText = 'margin:24px 0';
    /* Leestijd heeft geen zin bij een spel */
    var st = document.createElement('style'); st.id = 'mzsp-post-css';
    st.textContent =
      '.mzsp-regels{margin:8px 0 0;border:2px solid currentColor}' +
      '.mzsp-regels>summary{cursor:pointer;font-weight:800;padding:12px 16px;list-style:none;display:flex;justify-content:space-between;gap:12px}' +
      '.mzsp-regels>summary::-webkit-details-marker{display:none}' +
      '.mzsp-regels>summary::after{content:"+";font-weight:900}' +
      '.mzsp-regels[open]>summary::after{content:"\\2212"}' +
      '.mzsp-regels>div{padding:0 16px 8px}';
    document.head.appendChild(st);
    /* De site zet de leestijd met een zeer sterke regel; inline met !important wint altijd. */
    var weg = function(){ [].forEach.call(document.querySelectorAll('.blog-item-top-wrapper .moza-leestijd'), function(e){ e.style.setProperty('display', 'none', 'important'); }); };
    weg(); var n = 0, t = setInterval(function(){ weg(); if (++n > 20) clearInterval(t); }, 250);
    /* Spelregels inklappen, zodat het spel op de telefoon meteen in beeld is. */
    try {
      var kop = [].slice.call(plek.querySelectorAll('p, h2, h3, h4')).filter(function(p){ return /^\s*zo werkt het spel/i.test(p.textContent); })[0];
      if (kop) {
        var det = document.createElement('details'); det.className = 'mzsp-regels';
        var sum = document.createElement('summary'); sum.textContent = 'Zo werkt het spel'; det.appendChild(sum);
        var inh = document.createElement('div'); det.appendChild(inh);
        var blok = kop.closest('.sqs-html-content') || kop.parentNode;
        var n2 = kop.nextElementSibling;
        while (n2 && n2.parentNode === kop.parentNode) { var volg = n2.nextElementSibling; inh.appendChild(n2); n2 = volg; }
        kop.parentNode.replaceChild(det, kop);
      }
    } catch(e){}
    /* Uitnodigende kop bovenaan: beeld, titel, korte belofte en een grote startknop. */
    var info = INFO[slug] || {};
    H.classList.add('mzsp-post');
    var hst = document.createElement('style'); hst.id = 'mzsp-held-css'; hst.textContent = HELD_CSS; document.head.appendChild(hst);
    var held = document.createElement('section'); held.className = 'mzsp-held';
    held.innerHTML =
      '<div class="beeld b-' + spel + '" aria-hidden="true">' + tegels(spel) + '</div>' +
      '<div class="tekst"><span class="lbl"><b>MOZA</b>' + (info.label || 'Spel van vandaag') + '</span>' +
      '<h1>' + (info.titel || NAMEN[spel] || '') + '</h1>' +
      '<p class="belofte">' + (info.belofte || '') + '</p>' +
      '<div class="plek"></div>' +
      '<ul class="feit">' + (info.feiten || []).map(function(f){ return '<li>' + f + '</li>'; }).join('') + '</ul></div>';
    plek.insertBefore(held, plek.firstChild);
    if (isTelefoon()) { div.style.cssText = ''; held.querySelector('.plek').appendChild(div); }
    else { held.querySelector('.plek').innerHTML = '<a class="mzsp-speel" href="#mzsp-spel">' + (info.knop || 'Speel') + ' <span aria-hidden="true">\u2193</span></a>'; div.id = 'mzsp-spel'; held.parentNode.insertBefore(div, held.nextSibling); }
  }

  /* Overzicht op /spellen: vervangt de standaard bloglijst door kaarten met cover. */
  var INFO = {
    'raad-het-woord': {cover:'cover/cover-woord.png', tekst:'Raad in zes pogingen het woord van de dag. Elk woord heeft een Molukse knipoog.', knop:'Raad het woord',
      label:'Woord van de dag', titel:'Raad het <em>woord</em>', belofte:'Zes pogingen. E\u00e9n woord met een Molukse knipoog. Lukt het jou?',
      feiten:['Elke dag nieuw om 06:00', 'Duurt een paar minuten', 'Daag je vrienden uit']},
    'kruiswoordpuzzel': {cover:'cover/cover-puzzel.png', tekst:'Test je kennis van de Molukken en Molukkers in Nederland. Elke dag een makkelijke en een moeilijke puzzel, met bij elk woord een weetje.', knop:'Test je kennis',
      label:'Puzzel van vandaag', titel:'Kruiswoord<em>puzzel</em>', belofte:'Hoeveel weet jij van de Molukken? Kies makkelijk of moeilijk en leer bij elk woord iets nieuws.',
      feiten:['Elke dag nieuw om 06:00', 'Makkelijk of moeilijk', 'Bij elk woord een weetje']}
  };
  var HELD_CSS =
    /* Lege ruimte boven het bericht weg, de eigen kop vervangt titel en datum */
    'html.mzsp-post section.content-collection{padding-top:12px!important}' +
    'html.mzsp-post article.entry{padding-top:0!important}' +
    'html.mzsp-post .blog-item-top-wrapper{display:none!important}' +
    '.mzsp-held{margin:0 0 28px;border:3px solid #111;background:#fff;color:#111;box-shadow:8px 8px 0 #1F3BD1;font-family:"Hanken Grotesk",system-ui,sans-serif;display:grid;grid-template-columns:1fr}' +
    '.mzsp-held .beeld{border-bottom:3px solid #111;background:#1F3BD1;display:flex;align-items:center;justify-content:center;padding:14px}.mzsp-held .beeld.b-woord{background:#F4F2EC}' +
    '.mzsp-held .tg{display:grid;gap:4px}.mzsp-held .tg-p{grid-template-columns:repeat(6,22px);grid-auto-rows:22px;gap:3px}.mzsp-held .tg-p i{font-size:13px}.mzsp-held .tg-w{grid-template-columns:repeat(4,34px);grid-auto-rows:34px;gap:5px}' +
    '.mzsp-held .tg i{display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:15px;border:2px solid #111;color:#111}' +
    '.mzsp-held .tg-w i{font-size:20px;box-shadow:2px 2px 0 #111}' +
    '.mzsp-held .tg .lg{border:0;background:transparent}.mzsp-held .tg .wi{background:#fff}.mzsp-held .tg .ge{background:#E9F25A}' +
    '.mzsp-held .tg .mi{background:#8A877F}.mzsp-held .tg .bl{background:#1F3BD1;color:#fff}' +
    '.mzsp-held .tekst{padding:18px 18px 20px;display:flex;flex-direction:column;gap:12px;min-width:0}' +
    '.mzsp-held .lbl{display:flex;align-items:center;gap:10px;font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase}' +
    '.mzsp-held .lbl b{background:#111;color:#E9F25A;padding:3px 8px;font-weight:900;letter-spacing:.02em}' +
    '.mzsp-held h1{margin:0!important;font-weight:900!important;font-size:clamp(34px,9vw,56px)!important;line-height:1!important;letter-spacing:-.02em!important;color:#111!important;text-wrap:balance;overflow-wrap:anywhere}' +
    '.mzsp-held h1 em{font-family:"Fraunces",Georgia,serif;font-style:italic;font-weight:600;color:#1F3BD1;letter-spacing:0}' +
    '.mzsp-held .belofte{margin:0!important;font-size:17px!important;line-height:1.45!important;color:#3a3935!important}' +
    '.mzsp-held .plek{margin-top:4px}.mzsp-held .plek .mz-spel{margin:0}' +
    '.mzsp-held .mzsp-speel{display:flex;width:100%;justify-content:center;align-items:center;gap:10px;box-sizing:border-box;font:inherit;font-weight:900;font-size:20px;padding:16px 18px;background:#E9F25A;color:#111!important;border:3px solid #111;box-shadow:5px 5px 0 #111;cursor:pointer;text-decoration:none!important}' +
    '.mzsp-held .mzsp-speel:active{transform:translate(3px,3px);box-shadow:2px 2px 0 #111}' +
    '.mzsp-held .mzsp-speel:focus-visible{outline:3px solid #FF7AB6;outline-offset:3px}' +
    '.mzsp-held .feit{list-style:none;margin:2px 0 0!important;padding:0!important;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px;font-weight:700;color:#5B5A55}' +
    '.mzsp-held .feit li{margin:0!important;padding:0!important}.mzsp-held .feit li::before{content:"";display:inline-block;width:8px;height:8px;background:#FF7AB6;margin-right:7px;vertical-align:1px}' +
    '@media (min-width:761px){.mzsp-held{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}.mzsp-held .beeld{order:2;border-bottom:0;border-left:3px solid #111}.mzsp-held .tg-p{grid-template-columns:repeat(6,40px);grid-auto-rows:40px;gap:5px}.mzsp-held .tg-p i{font-size:22px}.mzsp-held .tg-w{grid-template-columns:repeat(4,56px);grid-auto-rows:56px;gap:8px}.mzsp-held .tg-w i{font-size:28px}.mzsp-held .tekst{padding:28px 30px;justify-content:center}.mzsp-held .mzsp-speel{width:auto;align-self:flex-start}}' +
    'html.moza-dark .mzsp-held{background:#1b1b1b;color:#F4F2EC;border-color:#F4F2EC;box-shadow:8px 8px 0 #FF7AB6}' +
    'html.moza-dark .mzsp-held h1{color:#F4F2EC!important}html.moza-dark .mzsp-held h1 em{color:#8FA0FF}' +
    'html.moza-dark .mzsp-held .belofte{color:#CFCDC5!important}html.moza-dark .mzsp-held .feit{color:#B4B2AA}' +
    'html.moza-dark .mzsp-held .beeld{border-color:#F4F2EC}html.moza-dark .mzsp-held .lbl b{background:#F4F2EC;color:#111}';
  var OV_CSS =
    '.mzsp-ov{max-width:1100px;margin:40px auto 64px;padding:0 max(16px,env(safe-area-inset-left,0px));font-family:"Hanken Grotesk",system-ui,sans-serif;color:#111}' +
    '.mzsp-ov h1{font-weight:900;font-size:clamp(40px,7vw,64px);letter-spacing:-.02em;line-height:1;margin:0 0 12px}' +
    '.mzsp-ov h1 em{font-family:"Fraunces",Georgia,serif;font-style:italic;font-weight:600;color:#1F3BD1;letter-spacing:0}' +
    '.mzsp-ov .intro{font-size:18px;line-height:1.5;max-width:60ch;margin:0 0 32px;color:#3a3935}' +
    '.mzsp-ov .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:32px}' +
    '.mzsp-ov a.kaart{display:flex;flex-direction:column;border:3px solid #111;background:#fff;box-shadow:8px 8px 0 #1F3BD1;color:#111;text-decoration:none;transition:transform .1s,box-shadow .1s}' +
    '.mzsp-ov a.kaart:hover{transform:translate(-2px,-2px);box-shadow:10px 10px 0 #1F3BD1}' +
    '.mzsp-ov a.kaart:focus-visible{outline:3px solid #FF7AB6;outline-offset:3px}' +
    '.mzsp-ov .beeld{aspect-ratio:3/2;border-bottom:3px solid #111;background:#F4F2EC;overflow:hidden}' +
    '.mzsp-ov .beeld img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.mzsp-ov .tekst{padding:20px 22px 24px;display:flex;flex-direction:column;gap:12px;flex:1}' +
    '.mzsp-ov h2{font-weight:900;font-size:28px;margin:0;line-height:1.1}' +
    '.mzsp-ov p{margin:0;font-size:16px;line-height:1.5}' +
    '.mzsp-ov .knop{align-self:flex-start;margin-top:auto;background:#E9F25A;color:#111;border:2px solid #111;box-shadow:3px 3px 0 #111;font-weight:800;padding:10px 16px}' +
    '.mzsp-ov .klein{font-size:14px;color:#5B5A55;margin-top:24px}' +
    'html.moza-dark .mzsp-ov{color:#F4F2EC}html.moza-dark .mzsp-ov .intro,html.moza-dark .mzsp-ov .klein{color:#B4B2AA}' +
    'html.moza-dark .mzsp-ov h1 em{color:#FF7AB6}' +
    'html.moza-dark .mzsp-ov a.kaart{background:#1C1C1C;color:#F4F2EC;border-color:#F4F2EC;box-shadow:8px 8px 0 #FF7AB6}' +
    'html.moza-dark .mzsp-ov a.kaart:hover{box-shadow:10px 10px 0 #FF7AB6}html.moza-dark .mzsp-ov .beeld{border-color:#F4F2EC}' +
    '@media (prefers-reduced-motion:reduce){.mzsp-ov a.kaart{transition:none}}';

  function overzicht(){
    var pad = location.pathname.replace(/\/+$/, '');
    if (pad !== '/spellen' || document.querySelector('.mzsp-ov')) return;
    var arts = [].slice.call(document.querySelectorAll('article.blog-item, .blog-item'));
    if (!arts.length) return;
    var items = [];
    arts.forEach(function(a){
      var link = a.querySelector('a[href*="/spellen/"]'); if (!link) return;
      var href = link.getAttribute('href'), slug = href.replace(/\/+$/, '').split('/').pop();
      if (items.some(function(i){ return i.slug === slug; })) return;
      var titel = (a.querySelector('.blog-title, h1, h2, h3') || link).textContent.trim();
      var img = a.querySelector('img'); var info = INFO[slug] || {};
      items.push({slug:slug, href:href, titel:titel,
        cover: info.cover ? BASE + info.cover : (img && (img.getAttribute('data-src') || img.src)) || '',
        tekst: info.tekst || '', knop: info.knop || 'Spelen'});
    });
    if (!items.length) return;
    var st = document.createElement('style'); st.id = 'mzsp-ov-css'; st.textContent = OV_CSS; document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'mzsp-ov';
    var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    box.innerHTML = '<h1>Speel <em>mee</em></h1>' +
      '<p class="intro">Elke dag nieuwe spellen over de Molukken en Molukkers in Nederland. Gratis, zonder inloggen. Elke ochtend om 06:00 staat er iets nieuws klaar.</p>' +
      '<div class="grid">' + items.map(function(i){
        return '<a class="kaart" href="' + esc(i.href) + '">' +
          (i.cover ? '<div class="beeld"><img src="' + esc(i.cover) + '" alt="" loading="lazy"></div>' : '') +
          '<div class="tekst"><h2>' + esc(i.titel) + '</h2>' + (i.tekst ? '<p>' + esc(i.tekst) + '</p>' : '') +
          '<span class="knop">' + esc(i.knop) + ' →</span></div></a>';
      }).join('') + '</div>' +
      '<p class="klein">Deel je tijd of je uitslag in de reacties onder het spel.</p>';
    var lijst = arts[0].closest('.blog-side-by-side-wrapper, .blog-basic-grid, .blog-alternating-side-by-side-wrapper, .blog-list, section') || arts[0].parentNode;
    lijst.parentNode.insertBefore(box, lijst);
    lijst.style.display = 'none';
  }

  function alles(){ try { auto(); } catch(e){} try { overzicht(); } catch(e){} [].forEach.call(document.querySelectorAll('.mz-spel[data-spel]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alles); else alles();
  window.addEventListener('mercury:load', alles); /* Squarespace laadt pagina's soms zonder herladen */
})();
