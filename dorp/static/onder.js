/* Kabar Maluku Live: menubalk onderin (zoals op moza.nu), delen en Meer-menu */
(function(){
  var H=document.documentElement,D=window.MZK_DEEL||{};
  function url(bron){var u=(document.querySelector('link[rel=canonical]')||{}).href||location.href.split('#')[0].split('?')[0];return u+'?utm_source='+bron+'&utm_medium=deel'}
  function tekst(bron){return (D.t||document.title)+'\n'+(D.e||'')+'\n'+url(bron)}
  function vel(id){var z=document.getElementById(id);if(!z)return null;
    [].forEach.call(z.querySelectorAll('[data-x]'),function(b){b.addEventListener('click',function(){dicht(z)})});return z}
  function open(z){z.classList.add('on');H.classList.add('mzk-vel');var f=z.querySelector('a,button.x');if(f)setTimeout(function(){f.focus()},50)}
  function dicht(z){z.classList.remove('on');H.classList.remove('mzk-vel')}
  function plausible(n){try{if(window.plausible)window.plausible(n)}catch(e){}}
  var deel=vel('mzk-deel'),meer=vel('mzk-meer');
  function deelOpen(){
    if(!deel)return;
    var m=deel.querySelector('.msg');m.innerHTML='';var b=document.createElement('b');b.textContent=D.t||document.title;m.appendChild(b);
    if(D.e){m.appendChild(document.createElement('br'));m.appendChild(document.createTextNode(D.e))}
    m.appendChild(document.createElement('br'));var l=document.createElement('span');l.className='u';l.textContent=url('whatsapp').replace(/^https?:\/\//,'').split('?')[0];m.appendChild(l);
    deel.querySelector('.wa').href='https://wa.me/?text='+encodeURIComponent(tekst('whatsapp'));
    deel.querySelector('.fb').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url('facebook'));
    var kp=deel.querySelector('.kp');kp.textContent='Kopieer link';kp.onclick=function(){
      var u=url('link'),ok=function(){kp.textContent='Link gekopieerd';plausible('Kabar delen: link')};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(ok,function(){prompt('Kopieer de link',u)});else prompt('Kopieer de link',u)};
    var an=deel.querySelector('.ander');an.style.display=navigator.share?'':'none';
    an.onclick=function(){navigator.share({title:D.t,text:(D.t||'')+'\n'+(D.e||''),url:url('app')}).then(function(){dicht(deel)},function(){})};
    open(deel);plausible('Kabar delen: open');
  }
  if(deel){
    deel.querySelector('.wa').addEventListener('click',function(){plausible('Kabar delen: WhatsApp');setTimeout(function(){dicht(deel)},300)});
    deel.querySelector('.fb').addEventListener('click',function(){setTimeout(function(){dicht(deel)},300)});
  }
  [].forEach.call(document.querySelectorAll('[data-deel]'),function(b){b.addEventListener('click',function(ev){ev.preventDefault();deelOpen()})});
  [].forEach.call(document.querySelectorAll('[data-meer]'),function(b){b.addEventListener('click',function(){if(meer)open(meer)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(deel)dicht(deel);if(meer)dicht(meer)}});
})();
