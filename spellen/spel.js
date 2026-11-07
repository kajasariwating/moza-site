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

  function start(el){
    if (el.getAttribute('data-geladen')) return;
    el.setAttribute('data-geladen', '1');
    var naam = (el.getAttribute('data-spel') || '').replace(/[^a-z0-9-]/g, '');
    if (!naam) return;
    el.innerHTML = '<p style="font-family:inherit;opacity:.7;padding:24px 0">Spel laden…</p>';
    fetch(BASE + naam + '.html').then(function(r){ if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(html){ bouw(el, html); })
      .catch(function(){ el.innerHTML = '<p style="padding:24px 0">Het spel kon niet laden. Probeer het later nog eens.</p>'; });
  }

  function bouw(el, html){
    var f = document.createElement('iframe');
    f.title = 'MOZA spel';
    f.setAttribute('scrolling', 'no');
    f.style.cssText = 'display:block;width:100%;border:0;height:700px;overflow:hidden;background:transparent';
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>[hidden]{display:none!important}' + SHIM_CSS + '</style></head><body>' + html + '</body></html>';
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
    plek.appendChild(div);
  }

  function alles(){ try { auto(); } catch(e){} [].forEach.call(document.querySelectorAll('.mz-spel[data-spel]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alles); else alles();
  window.addEventListener('mercury:load', alles); /* Squarespace laadt pagina's soms zonder herladen */
})();
