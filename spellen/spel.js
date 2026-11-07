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

  function bouw(el, html, naam){
    var f = document.createElement('iframe');
    f.title = 'MOZA spel';
    f.setAttribute('scrolling', 'no');
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
    st.textContent = '.blog-item-top-wrapper .moza-leestijd{display:none!important}';
    document.head.appendChild(st);
    plek.appendChild(div);
  }

  /* Overzicht op /spellen: vervangt de standaard bloglijst door kaarten met cover. */
  var INFO = {
    'raad-het-woord': {cover:'cover/cover-woord.png', tekst:'Raad in zes pogingen het woord van de dag. Elk woord heeft een Molukse knipoog.', knop:'Raad het woord'},
    'kruiswoordpuzzel': {cover:'cover/cover-puzzel.png', tekst:'Elke dag een makkelijke en een moeilijke puzzel over de Molukken en Molukkers in Nederland.', knop:'Start de puzzel'}
  };
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
