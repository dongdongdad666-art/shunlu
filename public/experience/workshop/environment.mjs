import * as THREE from './vendor/three.module.min.js';
import {normalizeEnvironment,environmentLook,outdoorSeeds} from './environment-state.mjs';

// Small outdoor stage. Its objects share the main scene's disposal pass.
export function buildEnvironment({scene,world,hemi,sun,fill,ground,context,render,box,sphere,cylinder,mat,C}){
 const root=new THREE.Group();root.name='street-environment';world.add(root);
 const road=box(root,24,.12,16.4,0x94a498,2,-.075,11.9);
 box(root,15,.14,.15,C.cream,2,.02,3.69);
 for(let x=-4;x<9;x+=1.8)box(root,.8,.009,.055,0xcbd2b9,x,-.007,5.45);
 // Eye-level street backdrop: a planted verge marks the end of the walkable lane.
 // Muted opposite facades give the outward view depth without competing with the bakery.
 box(root,24,.16,2.1,C.cream,2,-.005,16.55);
 box(root,14.6,.48,.5,C.cream,2,.24,6.65);
 const foliage=mat(0x708b70),brick=mat(0xbcac92),plaster=mat(0xd5c5a4);
 for(let x=-5;x<9.5;x+=.72)sphere(root,.48,foliage,x,.65,6.65,1,.7,.65);
 for(const [x,w,h,m]of [[-4.7,3.2,4.8,plaster],[-1.1,3.5,5.6,brick],[2.8,3.6,4.8,plaster],[6.7,3.4,5.4,brick],[10.1,2.8,4.7,plaster]]){
  box(root,w,h,1.3,m,x,h/2,18.8);box(root,w+.18,.18,1.6,C.green,x,h+.04,18.8);
  box(root,w,.14,.12,C.cream,x,2.8,18.08);
  for(const dx of [-.75,.75])for(const y of [1.25,3.8]){
   box(root,.79,1.16,.1,C.cream,x+dx,y,18.09);
   box(root,.62,.99,.06,0x708b83,x+dx,y,18.02);
   box(root,.045,1.02,.04,C.cream,x+dx,y,17.98);
  }
 }
 const lights=[],bulbs=[],windowMaterials=[],indoor=[];
 scene.traverse(o=>{if(o.isPointLight)indoor.push(o);});
 world.traverse(o=>{if(o.material?.color&&[0xa8c7bb,0xacc3ad,0xadc2ac].includes(o.material.color.getHex())){windowMaterials.push(o.material);if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}};});
 for(const [x,z]of [[-4.35,3.9],[8.6,3.9]]){
  cylinder(root,.065,.085,2.7,C.green,x,1.35,z);cylinder(root,.18,.23,.1,C.green,x,.06,z);
  box(root,.44,.11,.44,C.green,x,2.95,z);
  const globe=sphere(root,.19,mat(0xffe5b8,{emissive:0xffc879,emissiveIntensity:.15}),x,2.73,z,1,1.25,1);bulbs.push(globe.material);
  const light=new THREE.PointLight(0xffce86,0,5,1.6);light.position.set(x,2.7,z);scene.add(light);lights.push(light);
 }
 const doorway=new THREE.PointLight(0xffd194,0,6,1.6);doorway.position.set(1.85,2.7,3);scene.add(doorway);lights.push(doorway);
 const sunDisc=sphere(root,.58,new THREE.MeshBasicMaterial({color:0xf1c16d}),-5.6,7,-4);
 const moon=sphere(root,.42,new THREE.MeshBasicMaterial({color:0xffe6ba}),-5.6,7,-4);
 for(const [x,y,r]of [[-.12,.15,.065],[.1,-.13,.09],[.14,.13,.04]])sphere(moon,r,new THREE.MeshBasicMaterial({color:0xe1d5bb}),x,y,.38,1,1,.15);
 const snow=new THREE.Group();root.add(snow);
 box(snow,12.55,.15,5.8,0xf4f3e8,2,3.95,-.6);
 // Small overhanging drifts and soft street-edge banks, with no changes to navigation.
 for(let x=-3.7;x<8.2;x+=.57)sphere(snow,.23,0xf4f3e8,x,3.89,2.27,1.5,.35,.68);
 for(let x=-2.9;x<3.2;x+=.55)sphere(snow,.25,0xf4f3e8,x,2.66,3.33,1.2,.24,.42);
 for(const [x,z,sx,sz]of [[-3.7,3.35,1.1,.42],[5.4,3.47,2.9,.35],[8.6,2.9,.8,.5],[-4.8,-1.1,.7,.5]])sphere(snow,.5,0xe5eee6,x,.03,z,sx,.16,sz);
 box(snow,.4,.1,1.89,0xf4f3e8,8.25,1.23,-.7);
 const puddles=new THREE.Group();root.add(puddles);
 for(const [x,z,sx,sz]of [[-.2,4.45,1.3,.24],[3.7,4.95,.8,.31],[7.3,4.22,.65,.25],[-4.1,5.1,.7,.25]]){
  const p=new THREE.Mesh(new THREE.CircleGeometry(1,40),mat(0x90b1b6,{roughness:.12,metalness:.35,transparent:true,opacity:.65}));p.rotation.x=-Math.PI/2;p.position.set(x,.004,z);p.scale.set(sx,sz,1);puddles.add(p);
 }
 const glows=new THREE.Group();root.add(glows);
 for(const [x,z]of [[-4.35,4.3],[8.6,4.3],[1.85,3.6]]){
  const p=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:0xe8b970,transparent:true,opacity:.16,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.set(x,.015,z);p.scale.set(.38,.8,1);glows.add(p);
 }
 const seeds=outdoorSeeds(640),rainArray=new Float32Array(seeds.length*6),snowArray=new Float32Array(seeds.length*3);
 const rainGeo=new THREE.BufferGeometry(),snowGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));snowGeo.setAttribute('position',new THREE.BufferAttribute(snowArray,3));
 const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xb5d2dc,transparent:true,opacity:.48,depthWrite:false}));rain.frustumCulled=false;rain.renderOrder=1;root.add(rain);
 const dot=document.createElement('canvas');dot.width=32;dot.height=32;const dc=dot.getContext('2d');dc.fillStyle='white';dc.beginPath();dc.arc(16,16,13,0,Math.PI*2);dc.fill();const texture=new THREE.CanvasTexture(dot);
 const flakes=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xf8f8ef,size:.085,map:texture,transparent:true,alphaTest:.2,opacity:.85,depthWrite:false}));flakes.frustumCulled=false;flakes.renderOrder=1;root.add(flakes);
 let state=normalizeEnvironment(),reduced=false,frame=0,last=0,time=0,dead=false,transition=null;
 scene.background=new THREE.Color(C.paper);
 function particles(){for(let i=0;i<seeds.length;i++){const [x,y,z]=seeds[i],rainY=(y-time*6%7+7)%7,snowY=(y-time*.65%7+7)%7;rainArray.set([x,rainY,z,x,rainY+.28,z],i*6);snowArray.set([x,snowY,z],i*3);}rainGeo.attributes.position.needsUpdate=true;snowGeo.attributes.position.needsUpdate=true;}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
 function sync(){
  const c=context(),visible=!dead&&c.visible&&!document.hidden;
  if(transition){if(visible)transition.resume();else transition.pause();}
  rain.visible=visible&&!reduced&&state.weather==='rain';flakes.visible=visible&&!reduced&&state.weather==='snow';
  if((rain.visible||flakes.visible)&&!frame)frame=requestAnimationFrame(tick);else if(!rain.visible&&!flakes.visible)stop();
 }
 function tick(now){
  const c=context();if(dead||document.hidden||!c.visible||reduced||state.weather==='clear'){stop();return;}
  if(!last||now-last>=1000/30){time+=Math.min(.1,last?(now-last)/1000:1/30);last=now;particles();if(!c.busy)render();}
  frame=requestAnimationFrame(tick);
 }
 function set(value,reduce=reduced){
  state=normalizeEnvironment(value);reduced=reduce;transition?.kill();transition=null;const look=environmentLook(state);
  snow.visible=look.snow;puddles.visible=look.wet;glows.visible=look.night;sunDisc.visible=!look.night&&state.weather==='clear';moon.visible=look.night&&state.weather==='clear';
  const tl=!reduced&&window.gsap?window.gsap.timeline({defaults:{duration:.8,ease:'sine.inOut'},onUpdate:render,onComplete:()=>{transition=null;render();}}):null;
  const change=(object,values)=>tl?tl.to(object,values,0):Object.assign(object,values);
  const color=(object,hex)=>{const c=new THREE.Color(hex);change(object,{r:c.r,g:c.g,b:c.b});};
  color(scene.background,look.sky);color(sun.color,look.sunColor);color(ground.material.color,look.ground);color(road.material.color,look.road);
  change(sun,{intensity:look.sun});change(hemi,{intensity:look.hemi});change(fill,{intensity:look.night?.3:.5});change(road.material,{roughness:look.wet?.22:.88});
  for(const l of indoor)change(l,{intensity:look.night?5.3:state.weather==='clear'?3.5:4});
  for(const l of lights)change(l,{intensity:look.night?10:look.wet?2.2:0});
  for(const m of bulbs)change(m,{emissiveIntensity:look.night?2:.15});
  for(const m of windowMaterials){m.emissive.set(0xffb866);change(m,{emissiveIntensity:m.transparent?(look.night?.08:0):(look.night?.75:look.wet?.15:0)});if(m.transparent)change(m,{opacity:look.night?.2:.18});}
  transition=tl;particles();sync();render();
 }
 return {set,sync,setReduced(value){set(state,value);},dispose(){dead=true;stop();transition?.kill();transition=null;lights.forEach(l=>scene.remove(l));}};
}
