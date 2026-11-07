/* MOZA Woord van de dag (voorpagina). Vervangt de tegel Woord van de week.
   Zondag: altijd "selamat hari minggu". Andere dagen: om de beurt een woord uit de lijst hieronder.
   Geluid: woord/audio/<bestand>.mp3 in deze repo. */
(function(){
if((location.pathname.replace(/\/+$/,'')||'/')!=='/')return;
var SRC=(document.currentScript&&document.currentScript.src)||'';
var BASE=SRC?SRC.replace(/woord\.js(\?.*)?$/,'audio/'):'https://cdn.jsdelivr.net/gh/kajasariwating/moza-site@main/woord/audio/';
var ZONDAG=['selamat hari minggu','fijne zondag','selamat-hari-minggu'];
var W=[
 ['pulang',"'Naar huis gaan': terugkeren naar de Molukken, tijdelijk of voorgoed.",'pulang'],
 ['jemput','iemand ophalen, bijvoorbeeld van het vliegveld','jemput'],
 ['papeda','Pap van sagomeel, van oudsher een basisgerecht op de Molukken.','papeda'],
 ['kewang','Groep dorpsbewakers in een Molukse negeri. De kewang ziet toe op de regels van sasi en beschermt land, zee en dorp.','kewang'],
 ['ale','jij (tegen mensen van je eigen leeftijd of jonger)','ale'],
 ['kapata','Oude gezongen verzen uit Centraal-Maluku. Met kapata geven mensen verhalen, geschiedenis en adat van hun dorp door, vaak in de bahasa tanah.','kapata'],
 ['selamat malam','goedenavond','selamat-malam'],
 ['sagu','Sago: zetmeel uit de sagopalm en van oudsher basisvoedsel op de Molukken.','sagu'],
 ['cakalele','Traditionele Molukse krijgsdans met parang en schild.','cakalele'],
 ['bandara','vliegveld','bandara'],
 ['gandong','Broederschap tussen twee dorpen op de Molukken, soms al eeuwenlang.','gandong'],
 ['capeu','hoed, pet','capeu'],
 ['amato','tot ziens','amato'],
 ['totobuang','Een rek met kleine koperen gongs waarop je een melodie slaat. Speelt vaak samen met de tifa: samen heet dat tifa totobuang.','totobuang']
];
var START=Date.UTC(2026,10,7); /* zaterdag 7 november 2026 = eerste woord (pulang) */
var DAG=['zo','ma','di','wo','do','vr','za'],MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function vandaag(){var s;try{s=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}catch(e){s=new Date().toISOString().slice(0,10)}var p=s.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2])}
function kies(t){var d=new Date(t);if(d.getUTCDay()===0)return ZONDAG;var i=0;for(var x=START;x<t;x+=864e5){if(new Date(x).getUTCDay()!==0)i++}return W[i%W.length]}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var css='#mzmob .mzx-e.wd{background:#E9F25A;color:#111;padding:22px;gap:10px;display:flex;flex-direction:column;justify-content:flex-start}'+
'#mzmob .mzx-e.wd .tg{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;position:static}'+
'#mzmob .mzx-e.wd .wd-r{display:flex;align-items:center;gap:14px}'+
'#mzmob .mzx-e.wd b.w{font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:600;font-size:40px;line-height:1.05;overflow-wrap:anywhere}'+
'#mzmob .mzx-e.wd .wd-p{flex:0 0 44px;width:44px;height:44px;border-radius:50%;border:3px solid #111;background:#FF7AB6;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:#111}'+
'#mzmob .mzx-e.wd .wd-p svg{width:20px!important;height:20px!important;min-width:0!important;stroke-width:2.5px!important;display:block!important;position:static!important;margin:0!important}'+
'#mzmob .mzx-e.wd b.w,#mzmob .mzx-e.wd:hover b.w{text-decoration:none!important;border:0!important}'+
'#mzmob .mzx-e.wd .wd-p:focus-visible{outline:3px solid #1F3BD1;outline-offset:3px}'+
'#mzmob .mzx-e.wd .wd-p.speelt{background:#fff}'+
'#mzmob .mzx-e.wd span.x{display:block!important;font-size:16px;line-height:1.45;color:#111}'+
'#mzmob .mzx-e.wd a.wd-l{color:#111;font-weight:800;font-size:14px;text-decoration:underline;text-underline-offset:3px;margin-top:auto}'+
'#mzmob .mzx-g:has(> .mzx-e.wd) > .mzx-e.nw{display:none!important}'+
'@media (max-width:767px){#mzmob .mzx-e.wd{padding:16px}#mzmob .mzx-e.wd b.w{font-size:30px}}';
function maak(){var t=vandaag(),w=kies(t),d=new Date(t);
 var el=document.createElement('div');el.className='mzx-e wv wd';el.setAttribute('role','group');el.setAttribute('aria-label','Woord van de dag');
 el.innerHTML='<span class="tg">Woord van de dag · '+DAG[d.getUTCDay()]+' '+d.getUTCDate()+' '+MND[d.getUTCMonth()]+'</span>'+
  '<div class="wd-r"><b class="w" lang="ms">'+esc(w[0])+'</b><button type="button" class="wd-p" aria-label="Luister hoe je '+esc(w[0])+' zegt"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg></button></div>'+
  '<span class="x">'+esc(w[1])+'</span>'+
  '<a class="wd-l" href="/begrippen">Alle begrippen →</a>';
 var b=el.querySelector('.wd-p'),au=null;
 b.addEventListener('click',function(){try{if(!au){au=new Audio(BASE+w[2]+'.mp3');au.addEventListener('ended',function(){b.classList.remove('speelt')})}au.currentTime=0;b.classList.add('speelt');var p=au.play();if(p&&p.catch)p.catch(function(){b.classList.remove('speelt')})}catch(e){}});
 return el}
function zet(g){if(g.querySelector('.mzx-e.wd'))return true;g.__wv=1;var oud=g.querySelector('a.mzx-e.wv');var el=maak();if(oud)g.replaceChild(el,oud);else g.insertBefore(el,g.firstChild);return true}
function start(){if(!document.getElementById('mz-woord-css')){var s=document.createElement('style');s.id='mz-woord-css';s.textContent=css;document.head.appendChild(s)}
 var n=0;(function w(){var g=document.querySelector('#mzmob .mzx-g');if(g){zet(g);new MutationObserver(function(){var o=g.querySelector('a.mzx-e.wv');if(o)o.remove();if(!g.querySelector('.mzx-e.wd'))zet(g)}).observe(g,{childList:true});return}if(++n<100)setTimeout(w,150)})()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
