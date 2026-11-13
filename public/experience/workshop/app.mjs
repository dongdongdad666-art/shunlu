import {normalizeEnvironment} from './environment-state.mjs';
import {roles,steps,newOrder,act,recoverOrder} from './experience.mjs';
import {views} from './camera-paths.mjs';
import {shapes,tones,moods,normalizeRecipe,describeRecipe} from './recipe.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
let region='overview';
let station='display',role='customer',order=newOrder(),quip=0,lifeEnabled=true;
const chefLines=['面团不许躺平！起来发酵！','别催！酵母正在组织语言。','我没生气，我在给面团做心理建设。','你看这团面，怎么比我还会摸鱼？'];
let stage='outside',recipe=normalizeRecipe(),scene=null,ready=false,busy=false,flat=false,cardURL='',generation=0,exportBusy=false,layoutTween=null;
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');let manualReduce=false;try{manualReduce=localStorage.getItem('shunlu-workshop-motion')==='reduce';}catch{}
let environment=normalizeEnvironment();try{environment=normalizeEnvironment(JSON.parse(localStorage.getItem('shunlu-workshop-environment')));}catch{}
const reduced=()=>systemMotion.matches||manualReduce;
function status(message){$('#status').textContent=message;clearTimeout(status.timer);status.timer=setTimeout(()=>$('#status').textContent='',4500);}
function motionPreference(){scene?.setLifeOptions({reduced:reduced(),enabled:lifeEnabled});document.documentElement.dataset.reduced=String(reduced());$('#motion').textContent=systemMotion.matches?'系统减少动态':manualReduce?'恢复动态':'减少动态';$('#motion').setAttribute('aria-pressed',String(reduced()));$('#motion').disabled=systemMotion.matches;$('#life-toggle').disabled=reduced();$('#life-toggle').textContent=reduced()?'自动演出已暂停':lifeEnabled?'街坊动态：开':'街坊动态：关';$('#life-toggle').setAttribute('aria-pressed',String(lifeEnabled&&!reduced()));if(reduced()){layoutTween?.progress(1);scene?.finish();}}
$('#motion').addEventListener('click',()=>{manualReduce=!manualReduce;try{localStorage.setItem('shunlu-workshop-motion',manualReduce?'reduce':'full');}catch{}motionPreference();});systemMotion.addEventListener('change',motionPreference);motionPreference();
function primary(text,action,disabled=false){return `<button class="primary" data-action="${action}" ${disabled?'disabled':''}><span>${text}</span>${arrow}</button>`;}
function choices(items,key){return `<div class="choices">${items.map(x=>`<button class="choice" data-key="${key}" data-value="${x.id}" aria-pressed="${recipe[key]===x.id}">${x.color?`<span class="swatch" style="background:${x.color}" aria-hidden="true"></span>`:''}${x.name}</button>`).join('')}</div>`;}
function render(focus=false){
 document.body.dataset.stage=stage;document.body.dataset.region=region;$('#street-status').hidden=flat||!ready;$('#environment-panel').hidden=flat||!ready;syncEnvironment();$('#life-toggle').hidden=flat;$('#life-toggle').disabled=reduced();$('#life-toggle').textContent=reduced()?'自动演出已暂停':lifeEnabled?'街坊动态：开':'街坊动态：关';$('#life-toggle').setAttribute('aria-pressed',String(lifeEnabled&&!reduced()));
 const d=describeRecipe(recipe),p=$('#panel');
 if(stage==='outside')p.innerHTML=`<div class="corner-mark" aria-hidden="true"></div><h1>推开门，<br><span class="keep">烤一份</span><br><span class="warm">好心情。</span></h1><p class="intro">街角的小店，今天为你开炉。<br>挑面包、接订单、和酵躁师傅一起开炉。<br>这间小店，每个角落都有点脾气。</p>${primary(ready?'推门进店':'正在搭好小店…','enter',!ready)}${!flat?'<button class="street-start" data-action="street" '+(!ready?'disabled':'')+'>先在街边走走 ↗</button>':''}<p class="small">也可以点击店门进入 · 三种角色，一张小票</p><a class="quiet-link" href="/experience/order/#menu">只想挑面包？直接看菜单 <span aria-hidden="true">↗</span></a>`;
 if(stage==='work')p.innerHTML=workPanel();
 if(stage==='result')p.innerHTML=`<div class="result-panel">${roleTabs()}${ticket()}${order.step==='ready'?primary(role==='customer'?'去取餐口，带走这一袋':'切换顾客去取餐','collect-order'):''}<h2>这一炉，<br>为今天而烤。</h2>${cardURL?`<img class="result-preview" src="${cardURL}" alt="你的${esc(d.toneName+d.shapeName)}作品卡">`:'<p role="status">正在排好你的作品卡…</p>'}<p class="result-copy">${esc(d.title)}<br>${esc(d.line)}</p><p class="current-recipe">${d.shapeName} · ${d.toneName}</p>${primary(exportBusy?'正在准备下载…':'保存我的作品卡','save',!cardURL||exportBusy)}<div class="result-actions"><button class="subtle" data-action="new-order">再逛一轮</button><button class="subtle" data-action="outside">回到街角</button></div><p class="small">1080 × 1440 PNG · 浏览器下载<br>虚拟创作，不对应可兑换的实体商品。</p></div>`;
 if(region==='street'&&stage!=='outside'&&!flat)p.innerHTML=streetPanel();
 $('#hotspot').hidden=!ready||busy||flat||stage!=='outside';$('#hotspot-text').textContent=stage==='outside'?'推门进店':'转一转面包';$('#scene-label').textContent=region==='street'&&stage!=='outside'?'街道探索 · 从店门走回店里':stage==='outside'?'愚园路灵感 · 虚构街角':stage==='work'?(flat?'简化体验':station?views[station].name+' · 可自由探索':'自由探索 · 靠近物件试试看'):'今天这一炉 · 已出炉';
 $('#steps').querySelectorAll('li').forEach((el,i)=>{if(i===(stage==='outside'?0:stage==='work'?1:2))el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 $('#scene-tools').hidden=!ready||busy||flat||stage==='result'||(stage==='work'&&station!=='work');$('#play-scene').textContent=stage==='outside'?'摇摇门铃':'轻按面包';$('#play-scene').setAttribute('aria-label',stage==='outside'?'摇摇店门旁的门铃':'轻按面包，看看松软回弹');$('#turn-scene').hidden=stage!=='work';
 $('#explore-controls').hidden=flat||stage==='outside'||busy;$('#walk-pad').hidden=flat||stage==='outside'||busy;
 $('#room-nav').hidden=flat||stage==='outside'||busy;$('#look-help').hidden=flat||stage==='outside'||busy;$('#room-nav').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===station)));
 if(focus){p.scrollTop=0;$('#scene-feedback').textContent='';p.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}requestAnimationFrame(()=>scene?.resize());
}
function streetPanel(){return `<p class="eyebrow">STREET / 顺路走走</p><h2>走出门，<br>换口新鲜空气。</h2><p class="zone-note">WASD 沿街行走，拖动环顾。<br>对准店门走进去，就回到店里。</p>${ticket()}<p class="small">你的面包与体验单仍在店里等你。</p>${primary('走回店内','walk-in')}<button class="return" data-action="outside">↗ 店外总览</button><div class="street-discover"><p>顺路发现 · 靠近后按 E</p><button data-view="neighbors">看看街坊逛店 <span>↗</span></button><button data-view="notice">街坊留言 <span>翻一页</span></button><button data-view="pinwheel">花盆风车 <span>转一下</span></button><button data-view="bikebell">自行车铃 <span>叮一声</span></button></div><p class="small">当前开放店前街道与两侧小径</p>`;}
 function changedRegion(next){region=next;if(!busy&&stage!=='outside'&&!flat)render();}
 function explorationStage(){return ['ready','collected'].includes(order.step)?'result':'work';}
 function streetExplore(){if(!ready||busy||flat)return;if(stage!=='outside'){visitStation('street');return;}transition('走到街道，开始自由探索。');scene.startStreet(reduced(),()=>{station='street';endTransition(explorationStage());});}
 function transition(label){scene?.stopWalking();$('#nearby-action').hidden=true;$('#explore-controls').hidden=true;$('#walk-pad').hidden=true;$('#scene-feedback').textContent='';busy=true;$('#room-nav').hidden=true;$('#look-help').hidden=true;$('#panel').inert=true;$('#hotspot').hidden=true;$('#scene-tools').hidden=true;$('#transition').hidden=false;$('#transition-label').textContent=label;}
function clearLayout(){layoutTween?.kill();layoutTween=null;$('#scene-frame').style.transform='';$('#panel').style.visibility='';}
function endTransition(next){clearLayout();busy=false;$('#panel').inert=false;$('#transition').hidden=true;stage=next;render(true);}
function enter(){if(!ready||busy||stage!=='outside')return;transition('门开了，进来看看。');const done=()=>{station='display';if(explorationStage()==='work')scene?.setRecipe(recipe);endTransition(explorationStage());};if(scene)scene.enter(reduced(),done);else done();}
function visitStation(id){if(busy||stage==='outside'||!views[id]||flat)return;const previous=stage;transition('走向'+views[id].name+'。');scene.visit(id,reduced(),ok=>{if(ok)station=id;endTransition(previous);if(!ok)status('这里暂时无法通行，请先沿过道退回一点。');});}
function fallback(message){
 order=recoverOrder(order);clearLayout();generation++;flat=true;scene?.dispose();scene=null;$('#scene').hidden=true;$('#fallback').hidden=false;$('#loading').hidden=true;$('#simple').disabled=true;$('#simple').textContent='已使用简化体验';ready=true;
 const keepResult=stage==='result'&&['ready','collected'].includes(order.step);if(busy){busy=false;$('#panel').inert=false;$('#transition').hidden=true;if(!keepResult)stage='work';}
 render();if(keepResult&&!cardURL){const token=generation;createCard(recipe).then(url=>{if(token===generation){cardURL=url;render();}}).catch(()=>status('作品卡未能完成，请开始下一轮重试。'));}if(message)status(message);
}
async function bake(){if(!ready||busy||stage!=='work')return;const check=act(order,'bake',role);if(!check.ok){status(check.message);return;}const before=order;order=check.state;recipe=normalizeRecipe(recipe);cardURL='';const token=++generation;transition('正在演示出炉，请稍候。');const complete=async(ok)=>{if(ok===false){order=before;endTransition('work');status('无法走到烤炉，请先沿过道退回一点。');return;}station='oven';order=act(order,'baked','system').state;scene?.setOrder(order);endTransition('result');try{const url=await createCard(recipe);if(token!==generation)return;cardURL=url;render();}catch{if(token!==generation)return;stage='result';render();status('作品卡未能完成；仍可取餐并开始下一单。');}};if(scene)scene.bake(reduced(),complete);else complete();}
function goOutside(){if(busy)return;transition('走出小店，回到街角。');const done=ok=>{if(ok===false){endTransition(stage);status('无法走到店门，请先回到烘焙台。');return;}station='counter';endTransition('outside');};if(scene)scene.exit(reduced(),done);else done();}
function goWork(){if(busy)return;if(['ready','collected'].includes(order.step)){startNewOrder();return;}generation++;cardURL='';transition('回到烘焙台，再做一份。');const done=ok=>{if(ok===false){endTransition(stage);status('无法走到工作台，请沿过道退回一点。');return;}station='work';endTransition('work');};if(scene)scene.work(reduced(),done);else done();}
async function save(){if(!cardURL||exportBusy)return;exportBusy=true;render();try{const bytes=Uint8Array.from(atob(cardURL.split(',')[1]),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'image/png'})),a=document.createElement('a');a.href=url;a.download=`SHUNLU-workshop-${recipe.shape}-${recipe.tone}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status('已请求下载；若浏览器未保存，可长按或右键作品卡保存。');}catch{status('未能开始下载，可长按或右键作品卡保存。');}finally{exportBusy=false;render();}}
function turn(dir){if(stage!=='work'||busy)return;if(flat)status('简化模式保留造型选择，三维转动暂不可用。');else if(station!=='work')visitStation('work');else scene.turn(dir*Math.PI/3,reduced());}
function play(action){if(busy||flat||!ready)return;if((action==='bell'&&stage!=='outside')||(action==='press'&&stage!=='work'))return;scene?.play(action,reduced());const message=action==='bell'?'叮，欢迎顺路。':'轻轻按一下，松软慢慢回来。';$('#scene-feedback').textContent=message;if($('#scene-tools').hidden)status(message);clearTimeout(play.timer);play.timer=setTimeout(()=>$('#scene-feedback').textContent='',2400);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.role){switchRole(b.dataset.role);return;}if(b.dataset.game){gameAction(b.dataset.game,b.dataset.shape);return;}if(b.dataset.view){visitStation(b.dataset.view);return;}if(b.dataset.key&&!busy&&stage==='work'&&role==='baker'&&order.step==='accepted'){recipe=normalizeRecipe({...recipe,[b.dataset.key]:b.dataset.value});scene?.setRecipe(recipe);const key=b.dataset.key,value=b.dataset.value;render();document.querySelector(`[data-key="${key}"][data-value="${value}"]`)?.focus({preventScroll:true});if(!flat&&station!=='work')visitStation('work');return;}const action=b.dataset.action;if(action==='collect-order')collectOrder();if(action==='new-order')startNewOrder();if(action==='street')streetExplore();if(action==='walk-in')visitStation('entry');if(action==='enter')enter();if(action==='bake')bake();if(action==='outside')goOutside();if(action==='work')goWork();if(action==='save')save();if(action==='left')turn(-1);if(action==='right')turn(1);});
$('#hotspot').addEventListener('click',()=>stage==='outside'?enter():turn(1));$('#skip-motion').addEventListener('click',()=>scene?.finish());
$('#simple').addEventListener('click',()=>fallback('已切换到简化体验，刷新页面可重新尝试三维画面。'));
$('#play-scene').addEventListener('click',()=>play(stage==='outside'?'bell':'press'));$('#turn-scene').addEventListener('click',()=>turn(1));
document.addEventListener('input',e=>{if(e.target.id==='note'){recipe=normalizeRecipe({...recipe,note:e.target.value});e.target.value=recipe.note;$('#note-count').textContent=`${[...recipe.note].length}/28 · 可选`;}});
function freeMoved(){if(station===null)return;station=null;$('#room-nav').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));$('#scene-tools').hidden=true;$('#scene-label').textContent=region==='street'?'街道探索 · 从店门走回店里':'自由探索 · 靠近物件试试看';}
function showNearby(item){const b=$('#nearby-action'),hidden=!item||busy||flat||stage==='outside';if(b.hidden!==hidden)b.hidden=hidden;if(item&&b.dataset.object!==item.id+':'+item.action){$('#nearby-text').textContent=item.title;b.dataset.object=item.id+':'+item.action;}}
$('#nearby-action').addEventListener('click',()=>{scene?.interact();if(!busy)$('#scene').focus({preventScroll:true});});
$('#explore-focus').addEventListener('click',()=>$('#scene').focus({preventScroll:true}));
$('#scene').addEventListener('focus',()=>{$('#explore-focus').textContent='探索中 · Esc 暂停';});
$('#scene').addEventListener('blur',()=>{$('#explore-focus').textContent='开始自由探索';});
for(const b of document.querySelectorAll('[data-walk]')){
 b.addEventListener('pointerdown',e=>{if(busy||flat)return;e.preventDefault();b.setPointerCapture(e.pointerId);scene?.walk(b.dataset.walk,true);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>scene?.walk(b.dataset.walk,false));
 b.addEventListener('click',e=>{if(e.detail===0&&!busy&&!flat)scene?.nudge(b.dataset.walk);});
}
function roleTabs(){return `<div class="role-tabs" role="group" aria-label="体验身份">${Object.entries(roles).map(([id,name],i)=>`<button data-role="${id}" aria-pressed="${role===id}"><span>0${i+1}</span>${name}</button>`).join('')}</div>`;}
function ticket(){const n={browse:0,selected:0,ordered:1,accepted:2,baking:2,ready:3,collected:4}[order.step];return `<div class="order-ticket"><div class="ticket-top"><span>顺路体验单</span><b>No. 001</b></div><p>${order.step==='browse'?'还空着，去挑喜欢的面包':esc(shapes.find(s=>s.id===order.shape).name)}<strong>${steps[order.step]}</strong></p><div class="order-track" aria-label="订单进度">${['挑选','接单','烘焙','取餐'].map((t,i)=>`<span class="${i<n?'done':i===n?'current':''}">${i<n?'✓':String(i+1).padStart(2,'0')} ${t}</span>`).join('')}</div></div>`;}
function gameButton(text,action,disabled=false,shape=''){return `<button class="game-button" data-game="${action}" ${shape?`data-shape="${shape}"`:''} ${disabled?'disabled':''}>${text}<span aria-hidden="true">↗</span></button>`;}
function workPanel(){
 let body='';
 if(role==='customer')body=`<p class="eyebrow">CUSTOMER / 慢慢逛</p><h2>今天，带哪一款？</h2><p class="zone-note">展示架挑面包，前台留下一张小票。<br>烘焙的事，可以亲自上阵。</p><div class="menu-picks">${shapes.map((x,i)=>`<button data-game="select" data-shape="${x.id}" aria-pressed="${order.step!=='browse'&&order.shape===x.id}" ${!['browse','selected'].includes(order.step)?'disabled':''}><span class="bread-glyph bread-${x.id}" aria-hidden="true"></span><span><b>${x.name}</b><small>${{loaf:'一条，留给散步的路',round:'圆一点，心情也松一点',ring:'把好心情圈起来'}[x.id]}</small></span><em>${order.step!=='browse'&&order.shape===x.id?'✓':'+'}</em></button>`).join('')}</div>${gameButton('去前台下单','order',order.step!=='selected')}${['ordered','accepted'].includes(order.step)?`<p class="next-hint">下一步：${order.step==='ordered'?'切换「前台」，为自己盖章接单。':'切换「烘焙师」，揉好今天的面团。'}</p>`:''}${gameButton('叮一下，催催这一炉','bellcounter')}`;
 if(role==='clerk')body=`<p class="eyebrow">COUNTER / 一纸一炉</p><h2>欢迎，今天你值班。</h2><p class="zone-note">前台内侧看店，把小票盖好章，<br>交给隔壁那位有点脾气的师傅。</p><div class="stamp-card"><span class="stamp-seal">顺路<br>接单</span><p>${order.step==='ordered'?'来新单了！':'等一张新小票'}<small>${order.step==='ordered'?'印章落下，烘焙区就可以开工。':'顾客先挑选，再到前台提交。'}</small></p></div>${gameButton('咚！盖章接单','stamp',order.step!=='ordered')}${order.step==='accepted'?'<p class="next-hint">已盖章。切换「烘焙师」，去揉面吧。</p>':''}${gameButton('叫一声师傅，听他怎么说','chef')}`;
 if(role==='baker')body=`<p class="eyebrow">BAKERY / 酵躁工坊</p><h2>面团，不许躺平。</h2><p class="chef-quote">“${chefLines[quip%chefLines.length]}”<span>— 酵躁师傅</span></p><div class="knead-meter"><span>揉面进度</span><strong>${order.kneads} / 3</strong><div>${[0,1,2].map(i=>`<i class="${i<order.kneads?'filled':''}"></i>`).join('')}</div></div>${gameButton(order.kneads<3?['第一揉 · 叫醒面团','第二揉 · 师傅上头','第三揉 · 松软投降'][order.kneads]:'面团已就绪','knead',order.step!=='accepted'||order.kneads>=3)}${order.step!=='accepted'?'<p class="next-hint">先以顾客下单，再由前台盖章。</p>':`<fieldset><legend>烘焙色</legend>${choices(tones,'tone')}</fieldset><fieldset><legend>这一炉的心情</legend>${choices(moods,'mood')}</fieldset><label class="note-label" for="note">小票留句话 <span id="note-count">${[...recipe.note].length}/28 · 可选</span></label><input id="note" value="${esc(recipe.note)}" placeholder="写给今天的自己" maxlength="56" autocomplete="off">${primary('送进烤箱，看看这一炉','bake',order.kneads<3)}`}${gameButton('逗逗师傅','chef')}`;
 return `${roleTabs()}${ticket()}${order.step==='ready'?primary('去取餐口，带走这一袋','collect-order'):order.step==='collected'?primary('换张小票，再逛一轮','new-order'):''}${body}<div class="street-links"><button class="return" data-action="street">走到街道 ↗</button><button class="return" data-action="outside">店外总览 ↗</button></div><p class="small">虚拟体验订单 · 无支付、无真实兑换</p>`;
}
function switchRole(next,done=()=>{}){
 if(busy||stage==='outside'||!roles[next])return;const previous=stage,id={customer:order.step==='ready'?'pickup':'display',clerk:'register',baker:'work'}[next];
 transition('换个身份，走到'+views[id].name+'。');
 const finish=ok=>{if(ok!==false){role=next;station=id;scene?.setRole(role);}endTransition(previous);if(ok===false)status('通道暂时受阻，请先退回过道。');else done();};
 if(scene)scene.visit(id,reduced(),finish);else finish(true);
}
function gameAction(action,value,local=false){
 if(busy||stage==='outside')return;
 const playful=['chef','bellcounter'].includes(action),check=playful?{ok:true,state:order}:act(order,action,role,value);
 if(!check.ok){status(check.message);return;}
 const previous=stage,id={select:'display',order:'counter',stamp:'register',knead:'work',pickup:'pickup',chef:'chef',bellcounter:'chef'}[action];
 if(!id)return;transition(playful?'师傅好像有话要说…':'走向'+views[id].name+'。');
 const complete=ok=>{if(ok===false){endTransition(previous);status('通道暂时受阻，请沿过道退回一点。');return;}
  order=check.state;station=local?null:id;
  if(action==='select'){recipe=normalizeRecipe({...recipe,shape:order.shape});scene?.setRecipe(recipe);}
  scene?.setOrder(order);if(playful||action==='knead')quip++;
  endTransition(previous);
  const text={select:'选好了，去前台留一张小票。',order:'001 号体验单已提交。切换「前台」盖章接单。',stamp:'咚！接单完成。切换「烘焙师」开工。',knead:order.kneads===3?'面团揉好了，送进烤炉吧。':'面团更松软了，再揉一下。',pickup:'拿好，今天的好心情已打包。',chef:chefLines[quip%chefLines.length],bellcounter:chefLines[quip%chefLines.length]}[action];status(text);if(local&&!flat)$('#scene').focus({preventScroll:true});
 };
 const arrived=ok=>{if(ok===false){complete(false);return;}if(scene&&['stamp','knead','pickup','chef','bellcounter'].includes(action))scene.antics(action,reduced(),complete);else complete(true);};
 if(scene&&!local)scene.visit(id,reduced(),arrived);else arrived(true);
}
function collectOrder(){if(busy)return;if(role!=='customer')switchRole('customer',()=>gameAction('pickup'));else gameAction('pickup');}
function startNewOrder(){if(busy)return;generation++;const previous=stage;transition('换张小票，再逛一轮。');const finish=ok=>{if(ok===false){endTransition(previous);return;}order=newOrder();role='customer';recipe=normalizeRecipe();cardURL='';scene?.setRole(role);scene?.setOrder(order);scene?.setRecipe(recipe);const end=()=>{station='display';endTransition('work');};if(scene)scene.visit('display',reduced(),end);else end();};if(scene)scene.work(reduced(),finish);else finish(true);}
function sceneAction(a){if(a.startsWith('street:')){scene?.streetInteract(a.split(':')[1]);return;}if(a==='walk-in'){visitStation('entry');return;}if(a==='walk-out'){visitStation('street');return;}if(a.startsWith('chat:'))scene?.chat(a.split(':')[1]);else if(a.startsWith('select:'))gameAction('select',a.split(':')[1],true);else if(['order','stamp','knead','chef','pickup'].includes(a))gameAction(a,undefined,true);else if(a==='collect-order')collectOrder();else if(a==='enter')enter();else if(a==='bake')bake();else if(a==='outside')goOutside();else if(a==='work')goWork();else play(a);}
function showAudio(value){
  const b=$('#sound-toggle');b.setAttribute('aria-pressed',String(value.enabled));b.textContent=value.enabled?'关闭环境音':'开启环境音';b.dataset.audioState=value.state;
  $('#sound-status').textContent=value.enabled?(value.state==='running'?'正在聆听 · 窗外天气与炉火':value.state==='closed'?'环境音已关闭':'暂时静音 · 回到画面继续'):'雨 · 风 · 烤炉，点击后聆听';
 }
 $('#sound-toggle').addEventListener('click',async()=>{const b=$('#sound-toggle');b.disabled=true;const wanted=b.getAttribute('aria-pressed')!=='true';try{const ok=await scene?.setSoundEnabled(wanted);if(wanted&&!ok)$('#sound-status').textContent='声音暂未开启，请再次点击或检查浏览器。';}finally{b.disabled=false;}});
 $('#sound-volume').addEventListener('input',e=>{$('#sound-value').textContent=e.target.value+'%';scene?.setSoundVolume(Number(e.target.value)/100);});
 function syncEnvironment(){const names={day:'白天',night:'夜晚',clear:'晴天',rain:'雨天',snow:'下雪'};$('#environment-summary').textContent=names[environment.time]+' · '+names[environment.weather];$('#environment-panel').querySelectorAll('[data-env]').forEach(b=>b.setAttribute('aria-pressed',String(environment[b.dataset.env]===b.dataset.value)));}
$('#environment-panel').addEventListener('click',e=>{const b=e.target.closest('[data-env]');if(!b)return;environment=normalizeEnvironment({...environment,[b.dataset.env]:b.dataset.value});try{localStorage.setItem('shunlu-workshop-environment',JSON.stringify(environment));}catch{}scene?.setEnvironment(environment,reduced());syncEnvironment();});
$('#environment-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){$('#environment-panel').open=false;$('#environment-panel summary').focus();}});
function showSpeech(value,prefix='resident'){
 const b=$('#'+prefix+'-speech');if(!value){b.hidden=true;return;}
 const key=value.who+':'+value.until;if(b.dataset.key!==key){b.dataset.key=key;b.querySelector('span').textContent=value.name;b.querySelector('p').textContent=value.text;b.dataset.kind=value.kind;clearTimeout(b.hideTimer);b.hideTimer=setTimeout(()=>{b.hidden=true;},Math.max(0,value.until-performance.now()));}
 const frame=$('#scene-frame'),half=Math.min(124,frame.clientWidth/2-12),x=Math.max(half+12,Math.min(frame.clientWidth-half-12,value.x)),y=Math.max(114,Math.min(frame.clientHeight-220,value.y-95));
 b.style.left=Math.round(x)+'px';b.style.top=Math.round(y)+'px';b.hidden=false;
}
$('#life-toggle').addEventListener('click',()=>{lifeEnabled=!lifeEnabled;scene?.setLifeOptions({enabled:lifeEnabled});render();});
function flatBread(c,r){const d=describeRecipe(r);c.fillStyle=d.color;c.beginPath();if(r.shape==='loaf')c.ellipse(540,650,310,140,-.12,0,Math.PI*2);else c.ellipse(540,650,r.shape==='ring'?220:250,190,0,0,Math.PI*2);c.fill();if(r.shape==='ring'){c.fillStyle='#efe8d5';c.beginPath();c.ellipse(540,650,75,62,0,0,Math.PI*2);c.fill();}else{c.strokeStyle='#f4dbaa';c.lineWidth=16;c.lineCap='round';for(let i=-1;i<2;i++){c.beginPath();c.moveTo(430+i*105,580);c.quadraticCurveTo(460+i*105,650,430+i*105,715);c.stroke();}}}
async function createCard(value){
 await document.fonts.ready;const d=describeRecipe(value),cvs=document.createElement('canvas');cvs.width=1080;cvs.height=1440;const c=cvs.getContext('2d');c.fillStyle='#efe8d5';c.fillRect(0,0,1080,1440);
 if(scene){const img=new Image();img.src=scene.breadImage(value);await img.decode();c.drawImage(img,40,275,1000,1000);}else flatBread(c,value);
 c.fillStyle='#234e43';c.font='700 64px Noto';c.fillText('顺路面包',76,125);c.font='400 24px Noto';c.fillText('今天这一炉 / 创意工坊',76,176);
 c.font='600 46px Noto';c.fillText(d.title,76,282,930);
 c.strokeStyle='#234e43';c.lineWidth=30;c.lineJoin='round';c.beginPath();c.moveTo(840,1110);c.lineTo(985,1110);c.lineTo(985,990);c.stroke();
 c.fillStyle='#234e43';c.font='600 36px Noto';c.fillText(d.toneName+' · '+d.shapeName,76,1132);c.font='400 26px Noto';c.fillText(d.line,76,1190,930);
 if(value.note){c.font='400 27px Noto';const chars=[...value.note];c.fillText(chars.slice(0,19).join(''),76,1250,920);if(chars.length>19)c.fillText(chars.slice(19).join(''),76,1292,920);}
 c.fillStyle='#59675e';c.font='400 20px Noto';c.fillText('虚构品牌 · 本地组合演示 · 无在线 AI 调用',76,1378);c.textAlign='right';c.fillText(flat?'2D 预览':'3D 创作',1004,1378);return cvs.toDataURL('image/png');
}
render();
try{await document.fonts.ready;if(!flat){const module=await import('./scene.mjs');if(!flat){scene=module.createWorkshop($('#scene'),{onAction:sceneAction,onMove:freeMoved,onNearby:showNearby,onSpeech:showSpeech,onStreetSpeech:v=>showSpeech(v,'street'),onStreetStatus:t=>{$('#street-status').textContent=t;},onAudio:showAudio,onRegion:changedRegion,onLost:()=>fallback('三维画面暂时中断，已切换到简化创作模式。')});ready=true;scene.setLifeOptions({reduced:reduced(),enabled:lifeEnabled});scene.setEnvironment(environment,reduced());$('#loading').hidden=true;render();}}}catch(error){console.error('Workshop initialization failed',error);if(!flat)fallback('当前无法显示三维场景，仍可进入简化创作体验。');}
window.__workshop={state:()=>({stage,station,role,order:{...order},recipe:{...recipe},busy,flat,ready,cardReady:!!cardURL,reduced:reduced(),stats:scene?.stats()||null})};
window.addEventListener('pagehide',e=>{if(!e.persisted){generation++;scene?.dispose();}});
window.addEventListener('pageshow',e=>{if(e.persisted)scene?.resize();});




