(() => {
 'use strict';
 const dialog = document.querySelector('#lightbox');
 document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  if (!dialog) return;
  const image = dialog.querySelector('img'); image.src = button.dataset.zoom; image.alt = button.querySelector('img')?.alt || '作品大图';
  dialog.querySelector('p').textContent = button.dataset.caption || image.alt;
  dialog.showModal();
 }));
 dialog?.querySelector('button').addEventListener('click', () => dialog.close());
 dialog?.addEventListener('click', event => { if(event.target === dialog) {const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();} });
 const start = document.querySelector('#start-demo');
 start?.addEventListener('click', () => {
  if (matchMedia('(max-width: 767px)').matches) { remember(); location.assign('/experience/order/#menu'); return; }
  const frame = document.createElement('iframe'); frame.title = '顺路面包可操作点餐原型'; frame.src = '/experience/order/?embedded=1#menu';
  const phone = document.querySelector('#phone-preview'); phone.replaceChildren(frame);
  document.querySelector('.phone-help').textContent = '已进入原型 · 可加购、制作香气卡与模拟预订。';
 });
 function remember(){try{sessionStorage.setItem('shunlu-case-scroll',JSON.stringify({y:window.scrollY,time:Date.now()}));}catch{}}
 document.querySelectorAll('[data-remember]').forEach(link => link.addEventListener('click', remember));
 if(location.pathname==='/'&&location.search.includes('return=1')) {
  try { const saved=JSON.parse(sessionStorage.getItem('shunlu-case-scroll')); if(saved&&Date.now()-saved.time<3600000) {addEventListener('load',()=>{window.scrollTo({top:saved.y,behavior:'instant'});history.replaceState(null,'','/');},{once:true});} } catch{}
 }
 document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();})));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
})();
