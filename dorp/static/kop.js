/* Kabar Maluku Live, kop op de computer: Meer klapt uit zoals op moza.nu. Ander dorp op de startpagina brengt je naar het zoekveld. */
(function(){
  function meer(){
    var b=document.querySelector('#mzd .meer'),mp=document.getElementById('mzd-mp');if(!b||!mp)return;
    b.addEventListener('click',function(){var o=mp.hidden;mp.hidden=!o;b.setAttribute('aria-expanded',String(o));b.querySelector('span').textContent=o?'Minder':'Meer'});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mp.hidden)b.click()});
  }
  function ander(){var a=document.querySelector('#mzd a.ander'),q=document.getElementById('q');if(a&&q)a.addEventListener('click',function(e){e.preventDefault();q.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(function(){q.focus()},300)})}
  function start(){meer();ander()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
