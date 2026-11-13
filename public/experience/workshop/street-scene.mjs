import * as THREE from './vendor/three.module.min.js';
import {buildCustomers} from './customers.mjs';
import {people,createWalker,streetLines} from './street-life.mjs';
import {regionAt} from './navigation.mjs';

export function buildStreetLife(world,helpers,{context,render,speech,status,door,bell}){
 const {box,sphere,cylinder,tube,C,label}=helpers;
 const actors=buildCustomers(world,helpers,people.map(p=>({...p,position:p.route[0].p,yaw:0})));
 const walkers=people.map(createWalker),props=[];
 for(const a of actors){
  const umbrella=new THREE.Group();umbrella.position.set(.35,1.8,0);a.root.add(umbrella);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(.52,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:a.id==='neighbor'?C.orange:C.green,side:THREE.DoubleSide}));umbrella.add(canopy);cylinder(umbrella,.015,.015,1.1,C.wood,0,-.5,0);a.umbrella=umbrella;
  if(a.id==='visitor'){const bag=new THREE.Group();a.arms[1].add(bag);bag.position.set(.03,-.43,.12);box(bag,.27,.32,.16,C.paper,0,0,0);tube(bag,[[-.08,.16,0],[-.07,.27,0],[.07,.27,0],[.08,.16,0]],.012,C.green);box(bag,.16,.05,.015,C.orange,0,0,.085);a.bag=bag;}
 }
 const notice=new THREE.Group();notice.position.set(-3.65,.1,2.5);world.add(notice);
 const note=label(notice,'街坊留言 · 翻一页',.65,.34,0,1,0,'#efe8d5','#234e43',65);
 props.push({id:'notice',name:'街坊留言',root:notice,position:[-3.65,2.5],obstacle:'signboard',range:2.6,y:1.3});
 const pinwheel=new THREE.Group();pinwheel.position.set(8.52,1.6,1.65);world.add(pinwheel);
 cylinder(pinwheel,.016,.016,.9,C.wood,0,-.38,0);const rotor=new THREE.Group();pinwheel.add(rotor);
 for(let i=0;i<4;i++){const blade=box(rotor,.13,.32,.035,i%2?C.orange:C.paper,Math.sin(i*Math.PI/2)*.17,Math.cos(i*Math.PI/2)*.17,0);blade.rotation.z=-i*Math.PI/2+.25;}sphere(rotor,.055,C.green,0,0,.04);
 props.push({id:'pinwheel',name:'花盆里的风车',root:pinwheel,position:[8.52,1.65],obstacle:'planter',range:2.5,y:1.8});
 const bikeBell=new THREE.Group();bikeBell.position.set(8.62,1.24,-.48);world.add(bikeBell);sphere(bikeBell,.085,C.orange,0,0,0,1,.55,1);cylinder(bikeBell,.028,.028,.16,C.green,0,-.08,0);
 props.push({id:'bikebell',name:'街边自行车铃',root:bikeBell,position:[8.62,-.48],obstacle:'bicycle',range:2.3,y:1.6});
 let frame=0,last=0,time=0,dead=false,enabled=true,reduced=false,weather='clear',saying=null,sequence=0,spin=0,ring=0,lastStatus='';
 const active=()=>{const c=context();return !dead&&enabled&&!reduced&&c.visible&&!document.hidden;};
 function say(item,text){saying={who:item.id,name:item.name,text,kind:'street',until:performance.now()+5200};}
 function pose(){actors.forEach((a,i)=>{
  const w=walkers[i],inside=regionAt(w.position)==='inside',step=w.moving?Math.sin(time*8)*.5:0;
  a.root.position.set(w.position[0],inside?.2:0,w.position[1]);a.root.rotation.y=w.yaw;
  a.animate(time,reduced,weather);a.legs.forEach((leg,k)=>leg.rotation.x=(k?-1:1)*step);if(w.moving){a.arms[0].rotation.x=-step*.65;a.arms[1].rotation.x=step*.65;a.body.position.y=Math.abs(Math.sin(time*8))*.025;}
  if(saying?.who===a.id&&performance.now()<saying.until){const player=context().player;if(player)a.root.rotation.y=Math.atan2(player[0]-w.position[0],player[1]-w.position[1]);a.arms[0].rotation.x=-2.1+(reduced?0:Math.sin(time*5)*.2);a.head.rotation.y=0;}
  a.umbrella.visible=weather==='rain'&&!inside;if(a.bag)a.bag.visible=w.bag;
 });}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;walkers.forEach(w=>w.moving=false);pose();}
 function sync(){if(!active()){stop();return;}if(!frame)frame=requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!active()){stop();return;}if(last&&now-last<1000/30){frame=requestAnimationFrame(tick);return;}
  const dt=Math.min(.1,last?(now-last)/1000:1/30);last=now;time+=dt;const c=context();
  walkers.forEach((w,i)=>w.tick(dt,{paused:c.busy||(saying?.who===people[i].id&&now<saying.until),player:c.player,others:walkers.filter((_,k)=>k!==i).map(v=>v.position)}));
  pose();rotor.rotation.z+=dt*(spin*4+(weather==='clear'?.55:2));spin=Math.max(0,spin-dt);ring=Math.max(0,ring-dt);bikeBell.rotation.z=ring?Math.sin(time*40)*.25:0;note.rotation.y=saying?.who==='notice'?Math.sin(Math.min(1,(saying.until-now)/5200)*Math.PI)*.13:0;
  const visitor=walkers[2],message='林姐 · '+visitor.activity+(visitor.moving?'，顺路走走':visitor.wait>0?'，停一小会儿':'，让你先走');
  if(message!==lastStatus){lastStatus=message;status(message);}
  door(regionAt(visitor.position)==='inside'||Math.hypot(visitor.position[0]-1.9,visitor.position[1]-2.15)<2.7);
  if(!c.rendering)render();sync();
 }
 pose();
 return {actors,props,sync,stop,isRunning:()=>!!frame,
  positions:()=>walkers.map(w=>w.position),
  collisionPositions:()=>enabled&&!reduced?walkers.map(w=>w.position):[],
  items:()=>[...actors.map((a,i)=>({id:a.id,name:a.name,position:walkers[i].position,range:2.4,y:1.85})),...props].map(p=>({...p,action:'street:'+p.id,title:p.id==='notice'?'翻翻街坊留言':p.id==='pinwheel'?'拨动小风车':p.id==='bikebell'?'叮一下自行车铃':'和'+p.name+'聊两句'})),
  interact(id){const a=actors.find(a=>a.id===id),p=props.find(p=>p.id===id);if(!a&&!p)return;
   if(a){const lines=streetLines[id][weather];say(a,lines[sequence++%lines.length]);}
   else if(id==='notice'){const lines=['今日失物：一袋烦恼。拾到请勿归还。','本街散步建议：慢一点，香气在前面。','友情提示：师傅的脾气比面包先出炉。'];say(p,lines[sequence++%lines.length]);}
   else if(id==='pinwheel'){spin=2.4;if(reduced)rotor.rotation.z+=Math.PI/2;say(p,weather==='rain'?'风车：雨天也要转个好心情。':'把今天的小烦恼，转走一点。');}
   else {ring=1.2;bell();say(p,'叮铃！借过一下，面包香先走。');}pose();render();
  },
  refreshSpeech(project){if(!saying||performance.now()>saying.until){saying=null;speech(null);return;}const item=this.items().find(i=>i.id===saying.who),point=item&&project(item);speech(point?{...saying,...point}:null);},
  setWeather(w){weather=w;pose();},
  setOptions(o){if('enabled'in o)enabled=o.enabled;if('reduced'in o)reduced=o.reduced;sync();},
  dispose(){dead=true;stop();speech(null);}
 };
}
