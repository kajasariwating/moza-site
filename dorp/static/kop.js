/* Kabar Maluku Live, kop op de computer: Ander dorp op de startpagina brengt je naar het zoekveld */
(function(){
  function ander(){var a=document.querySelector('#mzd a.ander'),q=document.getElementById('q');if(a&&q)a.addEventListener('click',function(e){e.preventDefault();q.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(function(){q.focus()},300)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ander);else ander();
})();
