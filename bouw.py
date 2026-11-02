"""Bouwt dist/header.js en dist/footer.js uit bron/header.html en bron/footer.html.
Elk bestand zet de oorspronkelijke code-injectie terug op precies dezelfde plek,
in dezelfde volgorde, met elk script als los script (zoals in de injectie)."""
import json, re, pathlib

LOADER = """/* MOZA %(naam)s — gebouwd uit bron/%(naam)s.html. Niet hier bewerken. */
(function(){var cs=document.currentScript,p=cs.parentNode,t=document.createElement('template');
t.innerHTML=%(html)s;
[].slice.call(t.content.childNodes).forEach(function(n){
 if(n.nodeName==='SCRIPT'){var s=document.createElement('script');
  for(var i=0;i<n.attributes.length;i++){s.setAttribute(n.attributes[i].name,n.attributes[i].value);}
  s.text=n.textContent;p.insertBefore(s,cs);}
 else{p.insertBefore(n,cs);}});%(extra)s})();
"""

# Testschakelaar (haalt altijd de nieuwste testversie van main, max. 5 minuten oud in de browser): ?nieuw=1 zet de nieuwe vormgeving aan (onthouden in deze browser), ?nieuw=0 zet hem uit.
SCHAKELAAR = r"""
try{var q=location.search,ls=window.localStorage;
 if(/[?&]nieuw=1(&|$)/.test(q))ls.setItem('mzNieuw','1');
 if(/[?&]nieuw=0(&|$)/.test(q))ls.removeItem('mzNieuw');
 if(ls.getItem('mzNieuw')==='1'){
  document.documentElement.classList.add('mz-nieuw');
  /* Laad de nieuwste commit (niet @main: dat houdt jsDelivr uren vast). Commit 5 minuten onthouden. */
  var laad=function(sha){var B='https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@'+sha+'/nieuw/';
   var l=document.createElement('link');l.rel='stylesheet';l.href=B+'nieuw.css';document.head.appendChild(l);
   var j=document.createElement('script');j.src=B+'nieuw.js';j.async=true;document.head.appendChild(j);};
  var c=(ls.getItem('mzNieuwSha')||'').split('|');
  if(c[0]&&Date.now()-(+c[1]||0)<300000)laad(c[0]);
  else fetch('https://api.github.com/repos/kajasariwating/moza-site/commits/main',{headers:{Accept:'application/vnd.github.sha'}})
   .then(function(r){if(!r.ok)throw 0;return r.text()})
   .then(function(t){t=t.trim();if(!/^[0-9a-f]{40}$/.test(t))throw 0;ls.setItem('mzNieuwSha',t+'|'+Date.now());laad(t)})
   .catch(function(){laad(c[0]||'main')});}}catch(e){}
"""

# Deze stukken blijven als echte HTML in de injectie staan (zoekmachines en lettertypes).
HOUD = [r'<meta name="google-site-verification"[^>]*>', r'<script type="application/ld\+json"[^>]*>.*?</script>',
        r'<link rel="preconnect" href="https://fonts\.googleapis\.com">', r'<link[^>]*fonts\.googleapis\.com/css2[^>]*>']

def js_string(s):
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')

blijft = []
for naam in ('header', 'footer'):
    html = pathlib.Path(f'bron/{naam}.html').read_text()
    if naam == 'header':
        for pat in HOUD:
            for m in re.finditer(pat, html, re.S):
                if m.group(0) not in blijft: blijft.append(m.group(0))
            html = re.sub(pat, '', html, flags=re.S)
    pathlib.Path(f'dist/{naam}.js').write_text(LOADER % {'naam': naam, 'html': js_string(html), 'extra': SCHAKELAAR if naam == 'header' else ''})
pathlib.Path('dist/blijft-in-header.html').write_text('\n'.join(blijft) + '\n')
print('klaar', [ (p.name, p.stat().st_size) for p in pathlib.Path('dist').iterdir()])
