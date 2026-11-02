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
 else{p.insertBefore(n,cs);}});})();
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
    pathlib.Path(f'dist/{naam}.js').write_text(LOADER % {'naam': naam, 'html': js_string(html)})
pathlib.Path('dist/blijft-in-header.html').write_text('\n'.join(blijft) + '\n')
print('klaar', [ (p.name, p.stat().st_size) for p in pathlib.Path('dist').iterdir()])
