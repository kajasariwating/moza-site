/* Kabar Maluku Live, kop op de computer: 1-op-1 zoals moza.nu (Nu in, Meer-menu). Plaatsen en weer gelijk aan header.html van moza.nu. */
(function(){
  var ICON={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',part:'<path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5M17.4 6.6l1-1"/><path d="M8.5 11a4 4 0 0 1 7.3-2.2"/><path d="M8 20h9a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 8 20z"/>',cloud:'<path d="M7 19h10a5 5 0 0 0 0-10 6 6 0 0 0-11.6 2A4 4 0 0 0 7 19z"/>',fog:'<path d="M7 6h10M4 10h16M6 14h12M4 18h16"/>',rain:'<path d="M7 15h10a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.6 1.8A3.6 3.6 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',storm:'<path d="M7 15h10a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.6 1.8A3.6 3.6 0 0 0 7 15z"/><path d="M12 15l-2 4h3l-2 4"/>'};
  var WMO={0:['Onbewolkt','sun'],1:['Vrijwel onbewolkt','part'],2:['Half bewolkt','part'],3:['Bewolkt','cloud'],45:['Mist','fog'],48:['Mist','fog'],51:['Motregen','rain'],53:['Motregen','rain'],55:['Motregen','rain'],61:['Lichte regen','rain'],63:['Regen','rain'],65:['Zware regen','rain'],80:['Buien','rain'],81:['Buien','rain'],82:['Zware buien','rain'],95:['Onweer','storm'],96:['Onweer','storm'],99:['Onweer','storm']};
  function tijd(tz){try{return new Intl.DateTimeFormat('nl-NL',{timeZone:tz||'Asia/Jayapura',hour:'2-digit',minute:'2-digit'}).format(new Date())}catch(e){var d=new Date(Date.now()+9*3600000);return ('0'+d.getUTCHours()).slice(-2)+':'+('0'+d.getUTCMinutes()).slice(-2)}}
  function nuIn(){
    var bar=document.querySelector('#mzd .mzv-wx');if(!bar)return;
    var MAL=[['Ambon',-3.6954,128.1814,'Asia/Jayapura'],['Masohi',-3.2989,128.9599,'Asia/Jayapura'],['Ternate',0.7893,127.3842,'Asia/Jayapura'],['Tual',-5.6431,132.7487,'Asia/Jayapura'],['Saumlaki',-7.98,131.30,'Asia/Jayapura']];
    var NL=[["Appingedam",53.32,6.86],["Delfzijl",53.33,6.92],["Groningen",53.22,6.57],["Foxhol",53.17,6.71],["Marum",53.14,6.26],["Drachten",53.11,6.1],["Oosterwolde",52.99,6.29],["Assen",52.99,6.56],["Hoogeveen",52.72,6.48],["Bovensmilde",52.97,6.48],["Almelo",52.36,6.66],["Deventer",52.25,6.16],["Nijverdal",52.36,6.47],["Rijssen",52.31,6.52],["Rouveen",52.61,6.19],["Wierden",52.36,6.59],["Zwolle",52.51,6.09],["Apeldoorn",52.21,5.97],["Barneveld",52.14,5.59],["Bemmel",51.89,5.9],["Culemborg",51.96,5.23],["Doesburg",52.01,6.14],["Elst",51.92,5.85],["Eerbeek",52.1,6.06],["Lunteren",52.08,5.62],["Hatert",51.81,5.82],["Opheusden",51.93,5.63],["Tiel",51.89,5.43],["Twello",52.24,6.1],["Vaassen",52.29,5.97],["Winterswijk",51.97,6.72],["Zevenaar",51.93,6.07],["Breukelen",52.17,5.0],["Maarssen",52.14,5.04],["Loosdrecht",52.2,5.11],["Lelystad",52.52,5.47],["Amsterdam",52.37,4.9],["Rotterdam",51.92,4.48],["Den Helder",52.96,4.76],["Huizen",52.3,5.24],["Wormerveer",52.49,4.79],["Alphen a/d Rijn",52.13,4.66],["Capelle a/d IJssel",51.93,4.58],["Den Haag",52.08,4.3],["Gouda",52.01,4.71],["Krimpen a/d IJssel",51.92,4.6],["Leerdam",51.89,5.09],["Moordrecht",51.99,4.67],["Ridderkerk",51.87,4.6],["Woerden",52.09,4.88],["Breda",51.59,4.78],["Cuijk",51.73,5.88],["Den Bosch",51.69,5.3],["Helmond",51.48,5.66],["Nistelrode",51.7,5.56],["Tilburg",51.56,5.09],["Vught",51.66,5.29],["Waalwijk",51.69,5.07],["Koudekerke",51.48,3.55],["Middelburg",51.5,3.61],["Vlissingen",51.44,3.57],["Echt",51.1,5.87],["Geleen",50.97,5.83],["Gennep",51.7,5.97],["Heer",50.84,5.72],["Sittard",51.0,5.87],["Venlo",51.37,6.17],["Venray",51.53,5.97],["Weert",51.25,5.71]];
    var PLACES=MAL.concat(NL.map(function(p){return [p[0],p[1],p[2],'Europe/Amsterdam']}));
    var nl=NL.map(function(_,k){return k});for(var q=nl.length-1;q>0;q--){var r=Math.floor(Math.random()*(q+1)),t=nl[q];nl[q]=nl[r];nl[r]=t}
    var SEQ=[],mi=0;nl.forEach(function(n){SEQ.push(mi%MAL.length,(mi+1)%MAL.length,MAL.length+n);mi+=2});
    var data=null,i=0,pos=0;
    function icon(k){return ICON[k]?'<svg class="am-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[k]+'</svg> ':''}
    function paint(){
      bar.querySelector('.am-time').textContent=tijd(PLACES[i][3])+' uur';
      bar.querySelector('.am-place').textContent=PLACES[i][0];
      var w=data&&data[i];if(!w){bar.querySelector('.am-w').innerHTML='';return}
      var d=WMO[w.code]||['',''];
      bar.querySelector('.am-w').innerHTML='<span class="am-sep">·</span> '+icon(d[1])+Math.round(w.temp)+'°C'+(d[0]?' · '+d[0]:'');
    }
    paint();
    setInterval(function(){
      if(!data||data.length<2){paint();return}
      if(document.hidden)return;
      bar.style.opacity='0';
      setTimeout(function(){pos=(pos+1)%SEQ.length;i=SEQ[pos];paint();requestAnimationFrame(function(){requestAnimationFrame(function(){bar.style.opacity='1'})})},320);
    },5000);
    function got(v){data=v;paint()}
    try{var c=JSON.parse(sessionStorage.getItem('moza-maluku4')||'null');if(c&&Date.now()-c.t<15*60000){got(c.v);return}}catch(e){}
    var u='https://api.open-meteo.com/v1/forecast?latitude='+PLACES.map(function(p){return p[1]}).join(',')+'&longitude='+PLACES.map(function(p){return p[2]}).join(',')+'&current=temperature_2m,weather_code&timezone=Asia%2FJayapura';
    fetch(u).then(function(r){return r.json()}).then(function(j){
      var arr=Array.isArray(j)?j:[j];
      var v=arr.map(function(x){return {temp:x.current.temperature_2m,code:x.current.weather_code}});
      got(v);try{sessionStorage.setItem('moza-maluku4',JSON.stringify({t:Date.now(),v:v}))}catch(e){}
    }).catch(function(){});
  }
  function meer(){
    var b=document.querySelector('#mztabs .meer'),mp=document.getElementById('mztabs-mp');if(!b||!mp)return;
    b.addEventListener('click',function(){var o=mp.hidden;mp.hidden=!o;b.setAttribute('aria-expanded',String(o));b.querySelector('span').textContent=o?'Minder':'Meer';document.documentElement.classList.toggle('mzd-meer',o)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mp.hidden)b.click()});
  }
  /* Tip van MOZA stopt op dezelfde tijd als op moza.nu; daarna het laatste nieuws */
  function tip(){var t=document.querySelector('#mzd .mzt-d[data-eind]');if(t&&Date.now()>+t.getAttribute('data-eind')){t.remove();var n=document.querySelector('#mzd .mzt-n');if(n)n.hidden=false}}
  /* Ander dorp op de startpagina: naar het zoekveld */
  function ander(){var a=document.querySelector('.kop a.ander'),q=document.getElementById('q');if(a&&q)a.addEventListener('click',function(e){e.preventDefault();q.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(function(){q.focus()},300)})}
  function start(){tip();nuIn();meer();ander()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
