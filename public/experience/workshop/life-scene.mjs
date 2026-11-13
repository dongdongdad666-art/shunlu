import {createLifeDirector,weatherLine} from './life.mjs';
const lines={
 knead:['一揉二揉，烦恼揉走。面团留下！','你已经是个成熟的面团了，要学会自己发酵。'],
 tidy:['铲子归铲子，脾气归脾气。','谁把我的面粉，放进了面粉袋？！'],
 mutter:['这一炉的灵魂，还差一点点倔强。','酵母在上班，我也不能输。'],
 approach:['哎哟！先闻香，别盯着我的帽子！','站稳了！接下来是面团的思想教育！'],
 rush:['别催！我已经在用眉毛加热了！','叮叮叮！你是点面包，还是点我的火？！']
};
export function resetChef(z){z.body.rotation.set(0,0,0);z.body.position.y=.2;z.head.rotation.set(0,0,0);z.hat.rotation.z=-.19;z.hat.position.y=.27;z.arms.forEach(a=>a.rotation.set(0,0,0));z.puff.visible=false;z.puff.scale.setScalar(1);z.dough?.scale.set(1,.65,1);}
export function choreographChef(tl,z,kind){
 const rush=kind==='rush',react=rush||kind==='approach';
 if(kind==='rain'){
  tl.to(z.head.rotation,{y:-.7,x:-.2,duration:.35,yoyo:true,repeat:3},0).to(z.arms[1].rotation,{x:-2.3,z:.4,duration:.27,yoyo:true,repeat:5},0).to(z.hat.rotation,{z:.25,duration:.3,yoyo:true,repeat:5},0);
 }else if(kind==='snow'){
  tl.to(z.body.rotation,{z:.055,duration:.1,yoyo:true,repeat:13},0).to(z.arms[0].rotation,{x:-1.65,z:-.65,duration:.3,yoyo:true,repeat:3},0).to(z.arms[1].rotation,{x:-1.65,z:.65,duration:.3,yoyo:true,repeat:3},0).to(z.head.rotation,{x:-.25,y:.45,duration:.4,yoyo:true,repeat:3},0).to(z.hat.position,{y:.38,duration:.18,yoyo:true,repeat:7},0);
 }else if(kind==='clear'){
  tl.to(z.head.rotation,{x:-.25,y:-.4,duration:.4,yoyo:true,repeat:3},0).to(z.arms[1].rotation,{x:-2.1,duration:.4,yoyo:true,repeat:3},0);
 }else if(kind==='tidy'){
  tl.to(z.head.rotation,{y:.48,x:.14,duration:.4},0).to(z.arms[0].rotation,{x:-.95,z:-.55,duration:.4,yoyo:true,repeat:3},.15).to(z.body.rotation,{y:-.13,duration:.45,yoyo:true,repeat:3},0);
 }else if(kind==='mutter'){
  tl.to(z.head.rotation,{z:.13,y:-.3,duration:.4,yoyo:true,repeat:3},0).to(z.arms[1].rotation,{x:-1.3,z:.3,duration:.45,yoyo:true,repeat:3},0).to(z.hat.rotation,{z:.04,duration:.45,yoyo:true,repeat:3},0);
 }else{
  z.puff.visible=true;
  tl.to(z.body.rotation,{x:react?-.12:.18,z:rush?.24:react?.13:-.055,duration:.19,yoyo:true,repeat:7},0)
   .to(z.arms[1].rotation,{x:rush?-2.7:react?-2.15:-1.7,z:react?.6:.12,duration:.19,yoyo:true,repeat:7},0)
   .to(z.arms[0].rotation,{x:react?-2:-1.2,z:react?-.55:-.1,duration:.19,yoyo:true,repeat:7},.1)
   .to(z.head.rotation,{y:react?.42:0,x:react?-.12:.08,duration:.32,yoyo:true,repeat:5},0)
   .to(z.hat.rotation,{z:rush?.4:.1,duration:.23,yoyo:true,repeat:7},0)
   .fromTo(z.puff.scale,{x:.2,y:.2,z:.2},{x:rush?2.4:1.6,y:rush?2.4:1.6,z:rush?2.4:1.6,duration:1.6},.2);
  if(react)tl.to(z.body.position,{y:rush?.42:.31,duration:.17,yoyo:true,repeat:7},0).to(z.hat.position,{y:rush?.49:.33,duration:.22,yoyo:true,repeat:7},0);
  else if(z.dough)tl.to(z.dough.scale,{x:1.3,y:.36,z:1.15,duration:.19,yoyo:true,repeat:7},0);
 }
 tl.to(z.head.rotation,{x:0,y:0,z:0,duration:.3}).to(z.body.rotation,{x:0,y:0,z:0,duration:.2},'<');
 return tl;
}

export function createShopLife({zones,guests,context,render,speech}){
 const director=createLifeDirector();let frame=0,last=0,time=0,timeline=null,reduced=false,enabled=true,dead=false,close=false,sequence=0,saying=null,quietUntil=0,weather='clear',weatherPending=false,weatherAfter=0;
 function speak(who,text,kind='idle'){saying={who,text,kind,until:performance.now()+4700};}
 function speakChef(kind){const options=lines[kind]||lines.approach;const useWeather=kind==='weather'||(weather!=='clear'&&(['approach','rush'].includes(kind)||sequence%3===0));speak('chef',useWeather?weatherLine('chef',weather,sequence++):options[sequence++%options.length],kind);quietUntil=saying.until;}
 function clear(){saying=null;speech(null);}
 function stopAction(){timeline?.kill();timeline=null;resetChef(zones);}
 function suspend(){stopAction();quietUntil=performance.now()+1000;clear();}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;stopAction();guests.forEach(g=>g.animate(time,true));clear();}
 function allowed(c){return !dead&&enabled&&!reduced&&c.inside&&c.visible&&!document.hidden;}
 function wake(){if(!frame&&allowed(context())){last=0;frame=requestAnimationFrame(tick);}}
 function tick(now){
  const c=context();if(!allowed(c)){stop();return;}
  if(last&&now-last<1000/30){frame=requestAnimationFrame(tick);return;}
  const dt=Math.min(.1,last?(now-last)/1000:1/30);last=now;time+=dt;
  guests.forEach(g=>g.animate(time,false,weather));
  if(c.chefDistance>2.8)close=false;else if(c.chefDistance<2.25&&c.chefVisible)close=true;
  const weatherReady=weatherPending&&now>=weatherAfter&&!timeline&&!c.busy&&now>=quietUntil&&(c.chefVisible||c.guests.length);
  const event=weatherReady?{kind:'weather'}:director.tick(dt,{active:true,blocked:!!timeline||c.busy||now<quietUntil,near:close});
  if(weatherReady){weatherPending=false;weatherAfter=now+8000;quietUntil=now+4800;}
  if(event&&c.chefVisible&&window.gsap){
   const kind=event.kind;speakChef(kind);timeline=window.gsap.timeline({defaults:{ease:'sine.inOut'},onComplete:()=>{timeline=null;resetChef(zones);}});choreographChef(timeline,zones,kind==='weather'?weather:kind);
  }else if(event&&c.guests.length&&(weatherReady||now>=quietUntil)){const g=c.guests[sequence++%c.guests.length];speak(g.id,weatherLine(g.id,weather,sequence)||g.lines[sequence%g.lines.length],event.kind);}
  if(!c.busy&&!c.walking)render();
  frame=requestAnimationFrame(tick);
 }
 function refreshSpeech(project){
  if(!saying||performance.now()>saying.until){if(saying)clear();return;}
  const point=project(saying.who);speech(point?{...saying,...point}:null);
 }
 return {wake,stop,suspend,refreshSpeech,speakChef,isRunning:()=>!!frame,
  setWeather(value){if(value===weather)return;weather=value;weatherPending=true;weatherAfter=Math.max(weatherAfter,performance.now()+700);wake();},
  chat(id){const g=guests.find(g=>g.id===id);if(!g)return;quietUntil=performance.now()+5500;speak(g.id,weatherLine(g.id,weather,sequence++)||g.lines[sequence%g.lines.length],'chat');render();},
  setOptions(options){if('reduced'in options)reduced=options.reduced;if('enabled'in options)enabled=options.enabled;if(!allowed(context()))stop();else wake();render();},
  dispose(){dead=true;stop();}
 };
}
