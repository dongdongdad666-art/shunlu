// Local GSAP enhancement. Content and transactions work without the library.
const g=window.gsap;
const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
let manualReduce=false;
try{manualReduce=localStorage.getItem('shunlu-motion')==='reduce';}catch{}
let context=null,previous={},pending='',filterSnapshot=null,finishCompletion=null;
const reduced=()=>manualReduce||reduceQuery.matches;
const q=s=>document.querySelector(s);
let pressedChoice=null;
function clearChoicePress(){pressedChoice?.classList.remove('is-pressed');pressedChoice=null;}
function pressChoice(choice){
 if(!choice||choice.disabled||reduced())return;
 clearChoicePress();g?.killTweensOf(choice);
 choice.style.removeProperty('transform');choice.style.removeProperty('transition');
 pressedChoice=choice;choice.classList.add('is-pressed');
}
document.addEventListener('pointerdown',e=>{
 if(e.button===0&&e.isPrimary)pressChoice(e.target.closest('.aroma-form button.option'));
});
document.addEventListener('keydown',e=>{if(e.key===' '&&!e.repeat)pressChoice(e.target.closest('.aroma-form button.option'));});
document.addEventListener('keyup',e=>{if(e.key===' ')clearChoicePress();});
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,clearChoicePress,true);
document.addEventListener('pointerout',e=>{if(pressedChoice?.contains(e.target)&&!pressedChoice.contains(e.relatedTarget))clearChoicePress();});
window.addEventListener('blur',clearChoicePress);
function stop(){
 clearChoicePress();
 finishCompletion?.();finishCompletion=null;
 context?.revert();context=null;
 document.querySelectorAll('.paper-sleeve').forEach(el=>el.hidden=true);
 // Revert animated selection to the CSS marker, including preference/visibility changes.
 document.querySelectorAll('.filter-indicator').forEach(el=>el.remove());
 document.querySelectorAll('.filters[data-enhanced]').forEach(el=>delete el.dataset.enhanced);
}
function inContext(callback){if(!g||reduced()||document.hidden)return;if(!context)context=g.context(()=>{});context.add(callback);}
function syncPreference(){
 stop();document.documentElement.dataset.motion=reduced()?'reduced':'full';
 document.querySelectorAll('[data-motion-toggle]').forEach(toggle=>{toggle.setAttribute('aria-pressed',String(reduced()));toggle.textContent=reduceQuery.matches?'已跟随系统减少动态':manualReduce?'恢复动态效果':'减少动态效果';toggle.disabled=reduceQuery.matches;});
}
reduceQuery.addEventListener('change',syncPreference);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
document.addEventListener('click',e=>{if(!e.target.closest('[data-motion-toggle]'))return;manualReduce=!manualReduce;try{localStorage.setItem('shunlu-motion',manualReduce?'reduce':'full');}catch{}syncPreference();});
syncPreference();

function reveal(){
 const stage=q('.reveal-stage'),sleeve=q('.paper-sleeve');if(!stage||!sleeve)return;
 if(!g||reduced()||document.hidden){sleeve.hidden=true;return;}
 stop();
 inContext(()=>{
  sleeve.hidden=false;
  const card=stage.querySelector('.result-card'),top=sleeve.querySelector('.sleeve-top'),bottom=sleeve.querySelector('.sleeve-bottom');
  const tl=g.timeline({defaults:{ease:'power3.inOut'},onComplete:()=>{sleeve.hidden=true;}});
  tl.addLabel('unwrap',0)
   .fromTo(card,{rotation:-2,scale:.96},{rotation:0,scale:1,duration:.8,clearProps:'transform'},'unwrap')
   .fromTo(top,{yPercent:0},{yPercent:-104,duration:.68},'unwrap+=.06')
   .fromTo(bottom,{yPercent:0},{yPercent:104,duration:.7},'unwrap+=.1');
 });
}
function completeButton(){
 const button=q('dialog[open] [data-action="add"]')||q('[data-action="add"]');
 if(!button||!g||reduced()||document.hidden)return;
 const label=button.querySelector('.button-label'),icon=button.querySelector('.button-icon');
 const bg=document.createElement('span');bg.className='completion-bg';bg.setAttribute('aria-hidden','true');
 const check=document.createElementNS('http://www.w3.org/2000/svg','svg');check.setAttribute('viewBox','0 0 24 24');check.setAttribute('class','completion-check');check.setAttribute('aria-hidden','true');
 check.innerHTML='<path d="m5 12 4 4L19 6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>';
 const dots=Array.from({length:5},()=>{const dot=document.createElement('span');dot.className='completion-dot';dot.setAttribute('aria-hidden','true');return dot;});
 button.append(bg,check,...dots);button.classList.add('completion-active');button.disabled=true;button.dataset.complete='true';
 const cleanup=()=>{button.disabled=false;delete button.dataset.complete;button.classList.remove('completion-active');[bg,check,...dots].forEach(el=>el.remove());if(label)label.style.removeProperty('opacity');if(icon)icon.style.removeProperty('opacity');finishCompletion=null;
  const active=document.activeElement,dialog=button.closest('dialog');
  if(button.isConnected&&(!dialog||dialog.open)&&[document.body,q('#main'),q('#dialog')].includes(active))button.focus({preventScroll:true});
 };
 finishCompletion=cleanup;
 inContext(()=>{
  const ratio=Math.min(1,button.offsetHeight/button.offsetWidth);
  g.set([label,icon].filter(Boolean),{opacity:0});g.set(dots,{opacity:0});
  const tl=g.timeline({defaults:{ease:'power3.out'},onComplete:cleanup});
  tl.to(bg,{scaleX:ratio,borderRadius:'50%',duration:.22},0)
   .to(check.querySelector('path'),{strokeDashoffset:0,duration:.28},.18)
   .to(dots,{x:i=>Math.cos(i*Math.PI*2/5)*49,y:i=>Math.sin(i*Math.PI*2/5)*40,opacity:1,duration:.32},.3)
   .to(dots,{opacity:0,duration:.24},.65)
   .to(check,{opacity:0,duration:.18},.76)
   .to(bg,{scaleX:1,borderRadius:'12px',duration:.26},.82)
   .to([label,icon].filter(Boolean),{opacity:1,duration:.2},.94);
 });
}
export const motion={
 cancel(){stop();},
 intent(action){pending=action;},
 beforeRender(){
  const filters=q('.filters'),active=filters?.querySelector('.chip.active');
  filterSnapshot=filters?{scroll:filters.scrollLeft,x:active?.offsetLeft||0,width:active?.offsetWidth||44}:null;
  stop();
 },
 afterRender(state){
  syncPreference();
  const old=previous;previous={...state};
  const action=pending;pending='';
  const filters=q('.filters'),active=filters?.querySelector('.chip.active');
  if(filters&&filterSnapshot&&old.route===state.route)filters.scrollLeft=filterSnapshot.scroll;
  if(g&&filters&&active&&!reduced()&&!document.hidden){
   const indicator=document.createElement('span');indicator.className='filter-indicator';indicator.setAttribute('aria-hidden','true');filters.append(indicator);filters.dataset.enhanced='true';
   const x=active.offsetLeft,width=active.offsetWidth;indicator.style.width=width+'px';
   inContext(()=>{g.set(indicator,{x,transformOrigin:'left center'});if(action==='filter'&&filterSnapshot)g.fromTo(indicator,{x:filterSnapshot.x,scaleX:filterSnapshot.width/width},{x,scaleX:1,duration:.3,ease:'power3.out'});});
  }
  if(!g||reduced()||document.hidden){
   // A full re-render replaces the focused button even when motion is disabled.
   if(action==='add'&&state.count>old.count){
    const button=q('dialog[open] [data-action="add"]')||q('[data-action="add"]');
    if(button&&[document.body,q('#main'),q('#dialog')].includes(document.activeElement))button.focus({preventScroll:true});
   }
   return;
  }
  inContext(()=>{
   if(old.route&&old.route!==state.route)g.fromTo(q('#main'),{opacity:.65},{opacity:1,duration:.2,clearProps:'opacity'});
   if(['state','taste'].includes(action)){
    // render() replaces the pressed node; release on the new selected button.
    const choice=q(`.aroma-form [data-action="${action}"][aria-pressed="true"]`);
    if(choice){
     // One transform owner while GSAP runs; context reverts this on interruption.
     g.set(choice,{transition:'none'});
     g.fromTo(choice,{scale:.98,y:1},{scale:1,y:0,duration:.28,ease:'back.out(1.2)',clearProps:'transform,transition'});
    }
    const ring=q('.progress-arc'),number=q('.progress-number');
    if(ring)g.fromTo(ring,{strokeDashoffset:100-(old.choices||0)*50},{strokeDashoffset:100-state.choices*50,duration:.65,ease:'power2.inOut'});
    if(number&&old.choices!==state.choices)g.fromTo(number,{y:18,opacity:0},{y:0,opacity:1,duration:.48,clearProps:'transform,opacity'});
   }
   if(action==='filter')g.fromTo(document.querySelectorAll('.grid .product'),{y:10,opacity:.65},{y:0,opacity:1,duration:.3,stagger:.025,ease:'power3.out',clearProps:'transform,opacity'});
   if(['state','taste'].includes(action)){const summary=q('.selection-summary strong');if(summary)g.fromTo(summary,{y:4,opacity:.65},{y:0,opacity:1,duration:.22,clearProps:'transform,opacity'});}
   if(action==='qty')g.fromTo(document.querySelectorAll('.quantity output,.purchase-total strong'),{y:3,opacity:.65},{y:0,opacity:1,duration:.18,clearProps:'transform,opacity'});
   if(old.count!==undefined&&state.count>old.count){
    const target=matchMedia('(max-width:700px)').matches?q('.bottom-nav a[href="#bag"] svg'):q('#top-bag');
    if(target)g.timeline().to(target,{scale:1.15,rotation:-9,duration:.14}).to(target,{scale:1,rotation:0,duration:.3,ease:'power3.out',clearProps:'transform'});
   }
  });
  if(action==='add'&&state.count>old.count)completeButton();
  if(state.route==='aroma'&&state.phase==='result'&&(old.phase!=='result'||old.route!=='aroma'))reveal();
 },
 openDialog(dialog){inContext(()=>{g.fromTo(dialog,{y:matchMedia('(max-width:700px)').matches?45:18,opacity:.65},{y:0,opacity:1,duration:.28,ease:'power3.out',clearProps:'transform,opacity'});});},
 reveal
};
