import {buildStreetLife} from './street-scene.mjs';
import {createAmbience} from './ambience.mjs';
import {buildEnvironment} from './environment.mjs';
import {buildCustomers} from './customers.mjs';
import {createShopLife,choreographChef,resetChef} from './life-scene.mjs';
import * as THREE from './vendor/three.module.min.js';
import {buildZones} from './zones.mjs';
import {makeBread} from './bread.mjs';
import {views,cameraTrack} from './camera-paths.mjs';
import {move as advance,direction,pathTo,nearby,ovenPosition,regionAt,walkable} from './navigation.mjs';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
export {makeBread} from './bread.mjs';
const C={paper:0xefe8d5,cream:0xe4d5b7,green:0x234e43,orange:0xd96839,wood:0xb88957,lightwood:0xd4ad79,dark:0x243c32};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,...extra});
function mesh(parent,geo,color,x=0,y=0,z=0){const m=new THREE.Mesh(geo,typeof color==='number'||typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(p,w,h,d,c,x,y,z)=>mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(.045,w/3,h/3,d/3)),c,x,y,z);
const sphere=(p,r,c,x,y,z,sx=1,sy=1,sz=1)=>{let m=mesh(p,new THREE.SphereGeometry(r,24,16),c,x,y,z);m.scale.set(sx,sy,sz);return m;};
const cylinder=(p,rt,rb,h,c,x,y,z)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,24),c,x,y,z);
function tube(p,points,r,color){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),24,r,8,false),color);}
function label(p,text,w,h,x,y,z,bg='#234e43',fg='#efe8d5',size=70){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=fg;c.font=`600 ${size}px Noto, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,canvas.height/2,970);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}),x,y,z);m.castShadow=false;return m;
}
function dispose(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});}
export function createWorkshop(canvas,{onAction,onLost,onNearby=()=>{},onMove=()=>{},onSpeech=()=>{},onAudio=()=>{},onRegion=()=>{},onStreetSpeech=()=>{},onStreetStatus=()=>{}}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(C.paper,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(46,1,.045,90),target=new THREE.Vector3(2,1.3,0);
 const hemi=new THREE.HemisphereLight(0xfff5dc,0xb0b99b,1.9);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffebc8,2.9);sun.position.set(-4,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:35});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xffffff,.5);fill.position.set(8,4,-5);scene.add(fill);
 const world=new THREE.Group(),shell=new THREE.Group(),interior=new THREE.Group();scene.add(world);world.add(interior,shell);
 // Original procedural miniature. No scanned building, stock scene or generated 3D model.
 const ground=box(world,14.6,.28,8.1,0xc5b89b,2.2,-.24,.1);ground.receiveShadow=true;
 box(world,14.3,.1,2.05,0xa9b3a0,2,-.07,3.2);
 for(let x=-4.5;x<9;x+=.7)box(world,.66,.025,1.62,0xd8cdb2,x,0,3.35);
 // Corner path motif cut into the pavement.
 box(world,2.25,.03,.14,C.green,2.9,.025,3.25);box(world,.14,.03,1.05,C.green,3.95,.025,2.76);
 box(interior,12.1,.2,5.7,C.lightwood,2,.1,-.6);
 for(let x=-3.75;x<8;x+=.55)box(interior,.015,.016,5.5,0xc39865,x,.21,-.6);
 box(interior,12.1,3.1,.17,C.cream,2,1.78,-3.3);
 box(interior,.17,3.1,5.5,C.cream,-4,1.78,-.6);
 box(interior,12.1,.13,.28,C.green,2,3.34,-3.23);
 box(interior,.25,.13,5.5,C.green,-3.98,3.34,-.6);
 const backDecor=new THREE.Group();backDecor.position.z=-1.2;interior.add(backDecor);
 // Paneled back wall, hanging shelves and a warm bakery clock.
 for(let x=-2.7;x<3;x+=.48)box(backDecor,.018,1.0,.03,0xc7b795,x,.74,-1.99);
 box(backDecor,2.3,.11,.52,C.wood,1.3,2.15,-1.72);box(backDecor,2.3,.1,.48,C.wood,1.3,2.86,-1.72);
 for(let i=0;i<5;i++){cylinder(backDecor,.115,.115,.26,[0xe4bfa0,0xf4e6c7,0xa6b49b][i%3],.38+i*.26,2.35,-1.74);cylinder(backDecor,.12,.12,.055,C.wood,.38+i*.26,2.52,-1.74);}
 label(backDecor,'今天这一炉',1.3,.24,.95,2.65,-1.59,'#e4d5b7','#234e43',110).name='shelf-label';
 const clock=mesh(backDecor,new THREE.CircleGeometry(.27,32),mat('#faf0d7'),-1.3,2.8,-1.97);clock.castShadow=false;
 box(backDecor,.025,.18,.03,C.green,-1.3,2.87,-1.94);let hand=box(backDecor,.14,.023,.03,C.green,-1.24,2.81,-1.93);hand.rotation.z=-.3;
 // Front facade splits around a real hinged door.
 // Side wall is built around an actual window opening, not behind a painted pane.
 box(shell,.2,1.02,5.5,C.cream,8.02,.71,-.6);box(shell,.2,1.055,5.5,C.cream,8.02,2.8025,-.6);
 box(shell,.2,1.055,1.89,C.cream,8.02,1.7475,-2.405);box(shell,.2,1.055,2.09,C.cream,8.02,1.7475,1.105);
 box(shell,.22,.75,5.5,C.green,8.04,.58,-.6);
 const sideSign=label(shell,'顺路 · 带点香',2.2,.38,8.15,2.76,.05,'#e4d5b7','#234e43',85);sideSign.rotation.y=Math.PI/2;
 box(shell,6.35,.56,.3,C.cream,0,3.06,2.12);box(shell,.36,2.65,.32,C.cream,-2.97,1.62,2.12);box(shell,.34,2.65,.32,C.cream,2.98,1.62,2.12);box(shell,.32,2.65,.32,C.cream,.86,1.62,2.12);
 box(shell,3.7,.64,.32,C.green,-1.03,.53,2.14);
 box(shell,3.42,1.6,.035,mat(0xa8c7bb,{transparent:true,opacity:.4,roughness:.2}),-1.04,1.7,2.13);
 for(let x of [-2.8,-1.05,.68])box(shell,.08,1.8,.16,C.green,x,1.76,2.23);
 for(let y of [.87,2.65])box(shell,3.58,.07,.16,C.green,-1.05,y,2.23);
 const door=new THREE.Group();door.position.set(1.05,.26,2.15);shell.add(door);
 box(door,1.62,2.4,.14,C.green,.81,1.2,0);box(door,1.36,1.51,.05,0xacc3ad,.81,1.53,.095);box(door,1.48,.08,.06,C.cream,.81,.6,.11);cylinder(door,.055,.055,.3,C.wood,1.42,1.06,.16).rotation.x=Math.PI/2;
 label(door,'推门 · 今天这一炉',1.27,.26,.81,1.51,.13,'#acc3ad','#234e43',65);
 const sign=box(shell,4.15,.46,.14,C.green,-.35,3.23,2.34);label(shell,'顺 路 面 包',2.8,.34,-.02,3.23,2.42,'#234e43','#efe8d5',106);
 const brandCanvas=document.createElement('canvas');brandCanvas.width=brandCanvas.height=256;const brandContext=brandCanvas.getContext('2d');brandContext.fillStyle='#efe8d5';brandContext.fill(new Path2D('M64 220Q44 220 44 200V108C35 101 32 88 38 75C48 47 83 30 128 30C173 30 208 47 218 75C224 88 221 101 212 108V200Q212 220 192 220ZM79 178H132Q160 178 160 150V102H134V148Q134 152 130 152H79Z'),'evenodd');const brandTexture=new THREE.CanvasTexture(brandCanvas);brandTexture.colorSpace=THREE.SRGBColorSpace;const brandSymbol=mesh(shell,new THREE.PlaneGeometry(.41,.41),new THREE.MeshBasicMaterial({map:brandTexture,transparent:true,depthWrite:false}),-1.99,3.23,2.423);brandSymbol.name='brand-symbol-a';brandSymbol.castShadow=false;
 const roof=box(shell,12.6,.22,5.95,C.green,2,3.55,-.6);
 box(shell,12.66,.12,.16,0x173b31,2,3.69,2.31);
 // Curved fabric canopy with a scalloped hem and rounded metal rail.
 for(let i=0;i<12;i++){
  const color=i%2===0?C.orange:C.paper,shape=new THREE.Shape();
  shape.moveTo(0,0);shape.quadraticCurveTo(.72,.06,1.08,-.35);shape.lineTo(1.08,-.4);shape.quadraticCurveTo(.7,0,0,-.055);shape.closePath();
  const awn=mesh(shell,new THREE.ExtrudeGeometry(shape,{depth:.525,bevelEnabled:false,curveSegments:16}),color,-3.18+i*.53,2.98,2.26);awn.rotation.y=-Math.PI/2;
  const hem=box(shell,.525,.19,.065,color,-2.915+i*.53,2.53,3.34);sphere(shell,.263,color,-2.915+i*.53,2.46,3.34,1,.28,.13);
 }
 const canopyRail=cylinder(shell,.035,.035,6.3,0xb99456,0,2.61,3.3);canopyRail.rotation.z=Math.PI/2;
 // Cornices, joinery and a quiet cream window on the side elevation.
 box(shell,12.78,.13,6.03,0x315b49,2,3.76,-.6);box(shell,12.55,.08,5.81,0x527563,2,3.85,-.6);
 for(let z=-3.3;z<2.2;z+=.32)box(shell,12.38,.012,.016,0x2c5445,2,3.9,z);
 for(let x of [-2.95,.87,2.98])box(shell,.095,2.62,.04,0xf3e6cb,x,1.6,2.31);
 for(let x=-2.63;x<.6;x+=.65){box(shell,.52,.36,.04,0x315e4e,x,.51,2.33);box(shell,.41,.25,.03,C.green,x,.51,2.36);}
 for(const z of [-1.5,.1])box(shell,.07,1.24,.08,C.green,8.16,1.75,z);
 for(const y of [1.16,2.34])box(shell,.07,.08,1.65,C.green,8.16,y,-.7);
 box(shell,.045,1.05,1.44,mat(0xadc2ac,{transparent:true,opacity:.18,depthWrite:false}),8.205,1.75,-.7);
 for(let y of [1.2,1.74,2.3])box(shell,.09,.06,1.6,C.cream,8.25,y,-.7);
 box(shell,.09,1.12,.06,C.cream,8.25,1.75,-.7);box(shell,.34,.14,1.86,C.wood,8.23,1.14,-.7);
 for(let z=-1.4;z<.01;z+=.24){cylinder(shell,.1,.08,.2,C.orange,8.25,1.29,z);sphere(shell,.14,0x647d50,8.25,1.5,z,.7,1.3,.8);}
 // Porcelain shades, brass stems and a small bell at the door.
 for(let x of [-2.63,2.67]){tube(shell,[[x,3.24,2.38],[x,3.3,2.58],[x,3.16,2.68]],.027,0xb59054);cylinder(shell,.065,.16,.13,C.green,x,3.12,2.68);sphere(shell,.075,mat(0xffe2a2,{emissive:0xffd082,emissiveIntensity:.45}),x,3.035,2.68,1,.5,1);}
 const bell=new THREE.Group();bell.position.set(2.7,2.46,2.52);shell.add(bell);
 cylinder(bell,.055,.17,.22,0xb8914c,0,-.13,0);sphere(bell,.045,0x936d36,0,-.28,0);tube(shell,[[2.7,2.54,2.26],[2.7,2.57,2.52],[2.7,2.46,2.52]],.021,C.dark);
 // Door has raised lower panels and a brass pull, rather than a flat painted slab.
 for(let x of [.4,1.2])box(door,.6,.4,.035,0x376650,x,.31,.095);
 tube(door,[[1.4,.84,.19],[1.4,.87,.29],[1.4,1.17,.29],[1.4,1.2,.19]],.025,0xc9a768);
 box(shell,1.72,.1,.58,0xcbb997,1.88,.25,2.5);
 box(shell,1.03,3.1,.3,C.cream,-3.53,1.78,2.12);box(shell,1.03,3.1,.3,C.cream,3.53,1.78,2.12);
 box(shell,1.03,.67,.32,C.green,-3.53,.53,2.14);box(shell,1.03,.67,.32,C.green,3.53,.53,2.14);
 box(interior,12,.08,5.6,0xf0e5cc,2,3.37,-.6);
 for(const x of [-2.35,1.65,5.65]){const light=new THREE.PointLight(0xffe8bd,3.5,8,1.7);light.position.set(x,2.95,-.35);scene.add(light);cylinder(interior,.12,.3,.18,C.green,x,3.12,-.35);sphere(interior,.15,mat(0xffe5aa,{emissive:0xffdf9f,emissiveIntensity:.8}),x,3.0,-.35,1,.4,1);}
 const windowLight=new THREE.PointLight(0xdceada,2.2,8,1.5);windowLight.position.set(1.8,2,2.5);scene.add(windowLight);
 // Keep the window-side floor open: the main bread display is in the sales zone.
 // Workbench with tools, ingredients and a central tray.
 const bench=new THREE.Group();interior.add(bench);
 box(bench,2.65,.2,1.22,C.lightwood,.6,1.11,.2);box(bench,2.48,.72,1.05,C.green,.6,.66,.2);
 for(let x of [-.33,.48,1.29]){box(bench,.73,.52,.035,0x2e5c4e,x,.68,.742);sphere(bench,.032,C.lightwood,x,.87,.78);}
 cylinder(bench,.55,.55,.05,0xe6d3ad,.45,1.245,.25); // circular board
 const contact=mesh(bench,new THREE.CircleGeometry(.34,40),new THREE.MeshBasicMaterial({color:0x806943,transparent:true,opacity:.12,depthWrite:false}),.45,1.272,.25);contact.rotation.x=-Math.PI/2;contact.castShadow=false;
 const flour=cylinder(bench,.15,.13,.25,0xe9dfbd,1.49,1.35,-.05);cylinder(bench,.13,.13,.04,C.wood,1.49,1.49,-.05);
 const rolling=cylinder(bench,.067,.067,.64,C.wood,-.49,1.28,.2);rolling.rotation.x=Math.PI/2;
 box(bench,.24,.025,.36,0xf1e8d4,1.42,1.235,.51);
 // Oven, its door pivot, tray and emissive cavity are independent animation targets.
 const oven=new THREE.Group();oven.position.set(ovenPosition[0],.2,ovenPosition[1]);interior.add(oven);
 const enamel=mat(0x687669,{roughness:.42,metalness:.12}),steel=mat(0x898c7a,{roughness:.36,metalness:.55});
 // Five housing panels leave a real cavity for the tray and bread.
 for(const x of [-.77,.77])box(oven,.14,1.65,1.3,enamel,x,.83,0);
 box(oven,1.4,.12,1.3,enamel,0,.065,0);box(oven,1.4,.12,1.3,enamel,0,1.595,0);box(oven,1.4,1.41,.12,enamel,0,.83,-.59);
 box(oven,1.53,.15,1.35,C.lightwood,0,1.73,0);box(oven,1.4,.3,.1,enamel,0,1.405,.68);box(oven,1.4,.27,.1,enamel,0,.2,.68);
 const heat=mat(0xd58a37,{emissive:0xe98424,emissiveIntensity:.08});box(oven,1.29,.9,.035,heat,0,.81,-.505);
 for(const x of [-.65,.65])box(oven,.045,.035,1.04,steel,x,.485,.05);
 for(let x of [-.5,0,.5]){let k=cylinder(oven,.08,.08,.08,0xe6d9b9,x,1.39,.73);k.rotation.x=Math.PI/2;}
 const ovenDoor=new THREE.Group();ovenDoor.position.set(0,.37,.75);oven.add(ovenDoor);
 box(ovenDoor,1.4,.92,.08,C.dark,0,.46,0);box(ovenDoor,1.16,.57,.03,mat(0x47463b,{roughness:.23,metalness:.2}),0,.45,.065);box(ovenDoor,1.14,.06,.16,C.lightwood,0,.77,.12);
 label(ovenDoor,'SHUNLU',.65,.13,0,.7,.087,'#243c32','#efe8d5',120);
 const tray=box(oven,1.3,.04,.86,steel,0,.5,.1);
 // Exterior props: a stool, A-board, bicycle and planted street tree.
 const outside=new THREE.Group();world.add(outside);
 cylinder(outside,.27,.2,.4,C.orange,8.53,.2,1.63);
 for(let i=0;i<7;i++){let a=i*2.4;const leaf=sphere(outside,.2,0x687c4d,8.53+Math.cos(a)*.17,.67+(i%2)*.12,1.63+Math.sin(a)*.16,.55,1.5,.6);leaf.rotation.z=Math.cos(a)*.5;}
 const board=box(outside,.74,.95,.09,C.wood,-3.65,.63,2.2);board.rotation.x=-.15;label(outside,'今天\nOPEN',.59,.62,-3.65,.73,2.31,'#234e43','#efe8d5',90);
 cylinder(outside,.105,.15,2.65,C.wood,-4.85,1.28,-1.05);
 for(let i=0;i<9;i++){let a=i*2.4;const leaf=mesh(outside,new THREE.SphereGeometry(.38+(i%2)*.1,16,12),[0x8d9f71,0x6e8759,0x9eac81][i%3],-4.85+Math.cos(a)*.23,2.7+(i%3)*.31,-1.05+Math.sin(a)*.28);leaf.rotation.y=a;}
 const bicycle=new THREE.Group();bicycle.position.set(8.57,.12,-.64);bicycle.rotation.y=Math.PI/2;outside.add(bicycle);
 for(let x of [-.6,.6]){let wheel=mesh(bicycle,new THREE.TorusGeometry(.36,.035,8,30),C.dark,x,.39,0);for(let i=0;i<4;i++){let spoke=box(bicycle,.68,.012,.012,0xc3c5b5,x,.39,0);spoke.rotation.z=i*Math.PI/4;}}
 tube(bicycle,[[-.6,.39,0],[-.2,.98,0],[.1,.4,0],[-.6,.39,0]],.027,C.orange);tube(bicycle,[[.1,.4,0],[.46,1,0],[-.2,.98,0]],.027,C.orange);tube(bicycle,[[.6,.39,0],[.43,1.16,0],[.25,1.16,0]],.026,C.dark);box(bicycle,.3,.07,.18,C.dark,-.22,1.07,0);
 // Warm craft details: tiled backsplash, shelf brackets, woven trays and utensils.
 for(let x=-2.7;x<2.9;x+=.44)for(let y=1.37;y<2.01;y+=.22)box(backDecor,.41,.19,.025,(Math.round(x*10+y*10)%3===0?0xe2d2ad:0xf0e4c9),x,y,-1.995);
 for(let x of [.35,2.24]){tube(backDecor,[[x,2.05,-1.98],[x,2.05,-1.49],[x,1.77,-1.98]],.019,C.green);}
 for(let z=-.31;z<.8;z+=.16)box(bench,2.48,.009,.006,0xbd905c,.6,1.219,z);
 for(let z of [-.2,.6]){const handle=cylinder(bench,.035,.035,.15,0x9a6c3d,-.49,1.28,z);handle.rotation.x=Math.PI/2;}
 // Fluted mixing bowl and tiny flour bag on the shelf.
 const bowl=mesh(backDecor,new THREE.LatheGeometry([new THREE.Vector2(.08,0),new THREE.Vector2(.21,.05),new THREE.Vector2(.3,.25),new THREE.Vector2(.31,.27),new THREE.Vector2(.275,.26),new THREE.Vector2(.18,.07),new THREE.Vector2(.08,.035)],48),mat(0xd17a4a,{roughness:.38}),2.0,2.22,-1.7);
 box(backDecor,.28,.4,.22,C.paper,.42,3.12,-1.72);label(backDecor,'麦',.18,.18,.42,3.12,-1.598,'#efe8d5','#234e43',210);
 for(let x of [-.56,.56])box(oven,.075,.18,.13,C.dark,x,.04,.37);
 for(let x=-.48;x<.6;x+=.16)box(oven,.06,.018,.04,0x37483d,x,1.61,.68);
 // Expanded shopfront: a second large display window, while the original entrance stays legible.
 box(shell,4,.56,.3,C.cream,6,3.06,2.12);box(shell,.22,2.65,.32,C.cream,7.96,1.62,2.12);
 box(shell,3.8,.64,.32,C.green,5.95,.53,2.14);
 box(shell,3.65,1.65,.035,mat(0xa8c7bb,{transparent:true,opacity:.38,roughness:.2}),5.98,1.73,2.13);
 for(const x of [4.05,5.97,7.88])box(shell,.08,1.84,.16,C.green,x,1.76,2.23);
 for(const y of [.87,2.65])box(shell,3.86,.07,.16,C.green,5.97,y,2.23);
 label(shell,'慢慢挑 · 顺路带走',3.25,.29,5.95,3.11,2.3,'#e4d5b7','#234e43',90);
 const zones=buildZones(interior,{box,sphere,cylinder,tube,label,mat,C});
 const guests=buildCustomers(interior,{box,sphere,cylinder,tube,C});
 // The chef works on a separate practice dough; automatic life never advances the player's order.
 zones.dough=sphere(interior,.19,0xecc896,.1,1.29,-.13,1,.65,1);
 let streetLife=null,life=null,environment=null,inViewport=true,weather='clear';
 const ambience=createAmbience({onState:onAudio});

 // Steam only plays after an action; it does not keep the renderer alive at rest.
 const steam=new THREE.Group();steam.position.set(.45,1.92,.25);interior.add(steam);steam.visible=false;
 for(let i=0;i<3;i++){const sm=mat(0xfff3dd,{transparent:true,opacity:0,depthWrite:false});const w=tube(steam,[[i*.19-.2,0,0],[i*.19-.25,.17,.025],[i*.19-.15,.35,0],[i*.19-.2,.53,.03]],.013,sm);w.castShadow=false;}
 let bread=makeBread({}),stage='outside',bounds,activeTimeline=null,rotation=0,recipe={},destroyed=false,smallTimeline=null,activeView='entry',lastRegion='overview';
 bread.scale.setScalar(.58);bread.position.set(.45,1.25,.25);interior.add(bread);
 camera.position.set(14,8.2,14);camera.lookAt(target);
 const keys=new Set(),events=new AbortController();let walkFrame=0,walkTime=0,nearItem=null,drag=null,wasDrag=false,role='customer',orderStep='browse';
 const hotspot=document.querySelector('#hotspot');
 function render(){if(destroyed||document.hidden)return;syncRegion();camera.updateProjectionMatrix();camera.lookAt(target);renderer.render(scene,camera);syncNearby();life?.refreshSpeech(speechPoint);life?.wake();environment?.sync();streetLife?.refreshSpeech(streetPoint);streetLife?.sync();syncAudio();if(hotspot&&!hotspot.hidden){const point=stage==='outside'?[1.85,1.15,2.5]:activeView==='oven'?[ovenPosition[0],1.5,ovenPosition[1]+.76]:[.45,1.96,.3];const v=new THREE.Vector3(...point).project(camera);hotspot.style.visibility=(v.z>1||Math.abs(v.x)>.92||Math.abs(v.y)>.9)?'hidden':'';hotspot.style.left=((v.x+1)/2*bounds.width)+'px';hotspot.style.top=((-v.y+1)/2*bounds.height)+'px';}}
 function isInside(){return stage!=='outside'&&regionAt([camera.position.x,camera.position.z])==='inside';}
 function syncRegion(){const next=stage==='outside'?'overview':isInside()?'inside':'street';if(next===lastRegion)return;lastRegion=next;if(next!=='inside')life?.stop();onRegion(next);}
 function syncAudio(){ambience.sync({visible:inViewport&&!document.hidden,inside:isInside(),weather,distance:Math.round(Math.hypot(camera.position.x-ovenPosition[0],camera.position.z-ovenPosition[1])*10)/10,baking:heat.emissiveIntensity>.3});}
 function resize(){bounds=canvas.parentElement.getBoundingClientRect();camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();renderer.setSize(bounds.width,bounds.height,false);render();}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);
 function stopSmall(){life?.suspend();smallTimeline?.kill();smallTimeline=null;window.gsap?.killTweensOf(bread.rotation);bread.scale.setScalar(.58);bell.rotation.z=0;steam.visible=false;resetProps();}
 function finish(){for(let i=0;i<4&&activeTimeline;i++){const current=activeTimeline;current.progress(1);if(activeTimeline===current)break;}smallTimeline?.progress(1);render();}
 function timeline(done){stopWalking();stopSmall();activeTimeline?.kill();const g=window.gsap;if(!g)return null;activeTimeline=g.timeline({defaults:{ease:'power2.inOut'},onUpdate:render,onComplete:()=>{activeTimeline=null;done();render();}});return activeTimeline;}
 function pose(id){activeView=id;camera.position.fromArray(views[id].position);target.fromArray(views[id].target);camera.fov=60;camera.zoom=1;render();}
 function cameraTravel(tl,points,endTarget,duration,fov=60,open=stage==='result'){
  const track=cameraTrack([camera.position.toArray(),...points],open),progress={value:0},start=target.clone().sub(camera.position),end=new THREE.Vector3(...endTarget).sub(new THREE.Vector3(...points.at(-1)));
  const yaw=Math.atan2(start.x,-start.z),delta=Math.atan2(Math.sin(Math.atan2(end.x,-end.z)-yaw),Math.cos(Math.atan2(end.x,-end.z)-yaw)),pitch=Math.asin(start.y/start.length()),endPitch=Math.asin(end.y/end.length()),startFov=camera.fov;
  tl.to(progress,{value:1,duration,ease:'sine.inOut',onUpdate:()=>{const p=progress.value;camera.position.fromArray(track.at(p));const a=yaw+delta*p,b=pitch+(endPitch-pitch)*p;target.copy(camera.position).add(new THREE.Vector3(Math.sin(a)*Math.cos(b),Math.sin(b),-Math.cos(a)*Math.cos(b)).multiplyScalar(start.length()+(end.length()-start.length())*p));camera.fov=startFov+(fov-startFov)*p;}},0);
  return duration;
 }
 function addRoute(tl,id,points){const route=points.map(([x,z])=>[x,views[id].position[1],z]),length=cameraTrack([camera.position.toArray(),...route],stage==='result').length;
  return cameraTravel(tl,route,views[id].target,Math.min(5,Math.max(.6,length*.42)));
 }
 function visit(id,reduced,done=()=>{}){if(!Object.hasOwn(views,id))return;stopWalking();const complete=()=>{pose(id);done(true);};
  const points=pathTo([camera.position.x,camera.position.z],[views[id].position[0],views[id].position[2]],stage==='result');
  if(!points.length){done(false);return;}
  if(reduced||!window.gsap){stopSmall();complete();return;}const tl=timeline(complete);addRoute(tl,id,points);
 }
 function resumeExploration(){
  stage=['ready','collected'].includes(orderStep)?'result':'work';door.rotation.y=-1.32;
  if(stage==='result'){bread.position.set(ovenPosition[0],.71,ovenPosition[1]+1.14);bread.scale.setScalar(.58);ovenDoor.rotation.x=1.5;tray.position.z=1.15;heat.emissiveIntensity=.08;}
 }
 function startStreet(reduced,done){
  const finish=()=>{resumeExploration();pose('street');done(true);};
  if(reduced||!window.gsap){finish();return;}const tl=timeline(finish);
  tl.to(camera.position,{x:1.9,y:1.72,z:4.65,duration:1.6},0).to(target,{x:1.9,y:1.6,z:1.55,duration:1.6},0).to(camera,{fov:60,duration:1.6},0).to(door.rotation,{y:-1.32,duration:.65},.7);
 }
 function enter(reduced,done){
  const complete=()=>{resumeExploration();pose('entry');visit('display',reduced,()=>done());};
  if(reduced||!window.gsap){complete();return;}
  const tl=timeline(complete);
  tl.to(camera.position,{x:1.87,y:1.72,z:4.4,duration:1.25},0).to(target,{x:1.87,y:1.66,z:.5,duration:1.25},0).to(camera,{fov:60,duration:1.25},0)
   .to(door.rotation,{y:-1.32,duration:.65},.7).to(bell.rotation,{z:.25,duration:.12,yoyo:true,repeat:3},.8)
   .to(camera.position,{x:1.9,y:1.72,z:1.55,duration:1.45,ease:'sine.inOut'},1.25)
   .to(target,{x:-1.3,y:1.3,z:-.1,duration:1.1},2.45);
 }
 function setRecipe(value){stopSmall();recipe=value;const old=bread;bread=makeBread(recipe);bread.scale.setScalar(.58);bread.position.set(.45,1.25,.25);bread.rotation.y=rotation;interior.add(bread);interior.remove(old);dispose(old);render();}
 function bake(reduced,done){
  const start=[camera.position.x,camera.position.z],points=pathTo(start,[views.oven.position[0],views.oven.position[2]],walkable(start,true));
  if(!points.length){done(false);return;}
  const complete=()=>{bread.position.set(ovenPosition[0],.71,ovenPosition[1]+1.14);bread.rotation.y=0;bread.scale.setScalar(.58);heat.emissiveIntensity=.08;ovenDoor.rotation.x=1.5;tray.position.z=1.15;steam.visible=false;stage='result';pose('oven');done();};
  if(reduced||!window.gsap){complete();return;}
  const tl=timeline(complete);steam.children.forEach(o=>o.material.opacity=0);steam.position.set(ovenPosition[0],1.15,ovenPosition[1]+1.14);steam.visible=true;
  const route=points.map(([x,z])=>[x,1.8,z]),length=cameraTrack([camera.position.toArray(),...route],true).length,approach=Math.min(4,length*.4);let offset=Math.max(0,approach-.55);
  // One camera move continues through the reveal, instead of completing a visit first.
  route[route.length-1]=[-2.6,1.88,1.12];route.push(views.oven.position);
  // If free walking ended in the closed door's future sweep, keep it shut until
  // this continuous camera track has cleared it. Invert the same sine ease.
  const track=cameraTrack([camera.position.toArray(),...route],true);let clearance=0;
  for(let i=0;i<300;i++){const [x,,z]=track.at(i/300);if(!walkable([x,z],true))clearance=(i+1)/300;}
  if(clearance){const fraction=Math.acos(1-2*clearance)/Math.PI;offset=Math.max(offset,(4.65*fraction+.05)/(1-fraction));}
  cameraTravel(tl,route,views.oven.target,offset+4.65,60,true);
  tl.to(ovenDoor.rotation,{x:1.5,duration:.4},offset).to(bread.rotation,{y:0,duration:.45},offset).to(bread.position,{y:1.55,duration:.3},offset).to(bread.position,{x:ovenPosition[0],z:ovenPosition[1]+1.44,duration:.7},offset+.25).to(bread.position,{y:.71,duration:.35},offset+.95).to(bread.position,{z:ovenPosition[1]+.1,duration:.45},offset+1.3).to(bread.scale,{x:.55,y:.55,z:.55,duration:.3},offset)
   .to(ovenDoor.rotation,{x:0,duration:.35},offset+1.75).to(heat,{emissiveIntensity:2.2,duration:.4},offset+1.9).to(heat,{emissiveIntensity:.14,duration:.4},offset+2.45)
   .to(ovenDoor.rotation,{x:1.5,duration:.45},offset+2.8).to(tray.position,{z:1.15,duration:.8},offset+3.05).to(bread.position,{z:ovenPosition[1]+1.14,duration:.8},offset+3.05).to(bread.scale,{x:.58,y:.58,z:.58,duration:.8},offset+3.05)
   .to(steam.children.map(o=>o.material),{opacity:.4,duration:.25},offset+3.65).to(steam.position,{y:1.6,duration:.9,ease:'sine.out'},offset+3.65).to(steam.children.map(o=>o.material),{opacity:0,duration:.45},offset+4.2);
 }
 function reset(){stopWalking();stopSmall();activeTimeline?.kill();activeTimeline=null;stage='outside';door.rotation.y=0;ovenDoor.rotation.x=0;tray.position.z=.1;heat.emissiveIntensity=.08;camera.position.set(14,8.2,14);target.set(2,1.3,0);camera.fov=46;camera.zoom=1;bread.position.set(.45,1.25,.25);bread.scale.setScalar(.58);resize();}
 function exit(reduced,done){
  if(reduced||!window.gsap){reset();done();return;}
  const points=camera.position.z>=4.25?[]:pathTo([camera.position.x,camera.position.z],[1.9,4.25],stage==='result');
  if(camera.position.z<4.25&&!points.length){done(false);return;}
  const route=points.map(([x,z])=>[x,1.72,z]);route.push([14,8.2,14]);
  const duration=Math.min(7,Math.max(3.2,cameraTrack([camera.position.toArray(),...route],stage==='result').length*.24));
  const tl=timeline(()=>{reset();done();});cameraTravel(tl,route,[2,1.3,0],duration,46);tl.to(door.rotation,{y:0,duration:.5},duration-.5);
 }
 function work(reduced=false,done=()=>{}){visit('work',reduced,ok=>{if(!ok){done(false);return;}stage='work';bread.position.set(.45,1.25,.25);bread.scale.setScalar(.58);ovenDoor.rotation.x=0;tray.position.z=.1;done();render();});}
 function turn(delta,reduced){rotation+=delta;if(reduced||!window.gsap){bread.rotation.y=rotation;render();}else window.gsap.to(bread.rotation,{y:rotation,duration:.45,ease:'power3.out',overwrite:true,onUpdate:render});}
 function play(action,reduced){if(activeTimeline||destroyed)return;stopSmall();if(reduced||!window.gsap){render();return;}smallTimeline=window.gsap.timeline({onUpdate:render,onComplete:()=>{smallTimeline=null;render();}});
  if(action==='bell')smallTimeline.to(bell.rotation,{z:.32,duration:.14,ease:'sine.inOut'}).to(bell.rotation,{z:-.24,duration:.23}).to(bell.rotation,{z:.12,duration:.2}).to(bell.rotation,{z:0,duration:.22});
  else smallTimeline.to(bread.scale,{x:.66,y:.44,z:.66,duration:.17}).to(bread.scale,{x:.56,y:.61,z:.56,duration:.3}).to(bread.scale,{x:.58,y:.58,z:.58,duration:.22});
 }
 function resetProps(){resetChef(zones);zones.stamp.position.y=1.3;zones.bag.scale.setScalar(1);zones.deskBell.scale.setScalar(1);}
 function antics(action,reduced,done=()=>{}){
  if(activeTimeline||destroyed){done(false);return;}stopWalking();stopSmall();
  const complete=()=>{resetProps();done(true);render();};
  if(reduced||!window.gsap){if(['chef','bellcounter'].includes(action))life?.speakChef(action==='bellcounter'?'rush':'approach');complete();return;}
  const tl=timeline(complete);
  if(action==='stamp')tl.to(zones.stamp.position,{y:1.6,duration:.2}).to(zones.stamp.position,{y:1.23,duration:.15,ease:'power3.in'}).to(zones.stamp.position,{y:1.3,duration:.25});
  else if(action==='pickup')tl.to(zones.bag.scale,{x:1.1,y:.85,z:1.1,duration:.15}).to(zones.bag.scale,{x:1,y:1.12,z:1,duration:.25}).to(zones.bag.scale,{y:1,duration:.2});
  else {
   const kneading=action==='knead',kind=action==='bellcounter'?'rush':kneading?'knead':'approach';
   life?.speakChef(kind);choreographChef(tl,zones,kind);
   if(kneading)tl.to(bread.scale,{x:.7,y:.38,z:.7,duration:.19,yoyo:true,repeat:7},0);
   if(action==='bellcounter')tl.to(zones.deskBell.scale,{y:.6,duration:.15,yoyo:true,repeat:5},0);
  }
 }
 function setRole(value){role=value;render();}
 function setOrder(value){orderStep=value.step;zones.bag.visible=value.step==='ready';render();}
 function breadImage(value){
  const s=new THREE.Scene();s.background=new THREE.Color(C.paper);s.add(new THREE.HemisphereLight(0xfff5dd,0xb8a389,1.9));const l=new THREE.DirectionalLight(0xffe3b5,2.9);l.position.set(-3,5,4);s.add(l);
  const b=makeBread(value);s.add(b);b.rotation.y=-.35;const c=new THREE.OrthographicCamera(-1.3,1.3,1.3,-1.3,.1,20);c.position.set(2.7,2.1,3.7);c.lookAt(0,.4,0);
  renderer.setSize(800,800,false);renderer.render(s,c);const url=canvas.toDataURL('image/png');dispose(b);resize();return url;
 }
 function syncNearby(){
  if(destroyed||activeTimeline||stage==='outside'){nearItem=null;onNearby(null);return;}
  const d=target.clone().sub(camera.position);const n=Math.hypot(d.x,d.z)||1;
  const items=[{id:'door',action:isInside()?'walk-out':'walk-in',title:isInside()?'走到街道 · 也可直接WASD':'走进店内 · 也可直接WASD',position:[1.9,2.15],range:2.1}];
  items.push({id:'sales',action:'select:loaf',title:'挑一款面包 · 也可点具体面包',position:[5.2,.2],range:2.5,obstacle:'sales'},
   {id:'register',action:role==='clerk'?'stamp':'order',title:role==='clerk'?'盖章接单':'前台下单',position:[5.45,-2.1],range:2.25,obstacle:'register'},
   {id:'pickup',action:'pickup',title:'取走今天的面包',position:[6.5,-2.1],range:1.9,obstacle:'register'},
   {id:'chef',action:'chef',title:'和酵躁师傅聊两句',position:[-.2,-.91],range:2,obstacle:'chef',ignoreObstacles:['bench']});
  if(stage==='work')items.push({id:'bread',action:role==='baker'?'knead':'press',title:role==='baker'?'揉面 · 让面团听话':'轻按面包，感受松软',position:[.45,.25],range:3,obstacle:'bench'},{id:'oven',action:'bake',title:'送进烤炉，烤这一份',position:[ovenPosition[0],ovenPosition[1]+.82],range:2.2,obstacle:'oven'});
  if(stage==='result')items.push({id:'oven',action:orderStep==='ready'?'collect-order':'work',title:orderStep==='ready'?'这一炉好了，去取餐':'回到烘焙台，再做一份',position:[ovenPosition[0],ovenPosition[1]+1.14],range:2,obstacle:'oven'});
  items.push(...(streetLife?.items()||[]));
  items.push(...guests.map(g=>({id:g.id,action:'chat:'+g.id,title:'和'+g.name+'聊聊',position:g.position,range:2.1,obstacle:g.id,ignoreObstacles:['sales','register']})));
  const visible=items.filter(item=>{if(item.id==='pickup'&&(role!=='customer'||orderStep!=='ready'))return false;const p=new THREE.Vector3(item.position[0],item.id==='chef'?1.8:item.id==='bread'?1.55:1.35,item.position[1]).project(camera);return p.z>-1&&p.z<1&&Math.abs(p.x)<.95&&Math.abs(p.y)<.92;});
  nearItem=nearby([camera.position.x,camera.position.z],[d.x/n,d.z/n],visible,stage==='result');onNearby(nearItem);
 }
 function stopWalking(cancelLook=true){keys.clear();cancelAnimationFrame(walkFrame);walkFrame=0;walkTime=0;if(cancelLook)drag=null;}
 function tickWalk(now){
  walkFrame=0;if(destroyed||activeTimeline||stage==='outside'||document.hidden||!keys.size)return;
  const dt=Math.min(.05,walkTime?(now-walkTime)/1000:1/60);walkTime=now;
  const d=target.clone().sub(camera.position),yaw=Math.atan2(d.x,-d.z),v=direction(keys,yaw),p=advanceWithPeople([camera.position.x,camera.position.z],[v[0]*1.65*dt,v[1]*1.65*dt],stage==='result');
  const dx=p[0]-camera.position.x,dz=p[1]-camera.position.z;
  if(Math.abs(dx)+Math.abs(dz)>1e-8){camera.position.x=p[0];camera.position.z=p[1];target.x+=dx;target.z+=dz;activeView=null;onMove();}
  render(); // Keep ambient life visible even when movement is blocked.
  walkFrame=requestAnimationFrame(tickWalk);
 }
 function walk(code,down){if(destroyed||activeTimeline||stage==='outside')return;if(down)keys.add(code);else keys.delete(code);if(keys.size&&!walkFrame){walkTime=0;walkFrame=requestAnimationFrame(tickWalk);}if(!keys.size)stopWalking(false);}
 function interact(){if(activeTimeline||destroyed)return;syncNearby();if(nearItem){stopWalking();onAction(nearItem.action);}}
 function advanceWithPeople(start,delta,open){
  const end=advance(start,delta,open),people=streetLife?.collisionPositions()||[];
  return people.some(p=>Math.hypot(end[0]-p[0],end[1]-p[1])<.43&&Math.hypot(end[0]-p[0],end[1]-p[1])<Math.hypot(start[0]-p[0],start[1]-p[1]))?start:end;
 }
 function nudge(code){if(activeTimeline||destroyed||stage==='outside')return;const d=target.clone().sub(camera.position),v=direction(new Set([code]),Math.atan2(d.x,-d.z)),p=advanceWithPeople([camera.position.x,camera.position.z],[v[0]*.28,v[1]*.28],stage==='result');target.x+=p[0]-camera.position.x;target.z+=p[1]-camera.position.z;camera.position.x=p[0];camera.position.z=p[1];activeView=null;onMove();render();}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function hit(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(activeTimeline||destroyed)return null;
  const hits=ray.intersectObjects(stage==='outside'?[door,bell]:[bread,oven,door,zones.sales,zones.register,zones.chef,...guests.map(g=>g.root),...(streetLife?.actors||[]).map(g=>g.root),...(streetLife?.props||[]).map(g=>g.root)],true);if(!hits.length)return null;let obj=hits[0].object;
  while(obj){const streetItem=[...(streetLife?.actors||[]),...(streetLife?.props||[])].find(g=>g.root===obj);if(streetItem&&nearItem?.id===streetItem.id)return 'street:'+streetItem.id;const guest=guests.find(g=>g.root===obj);if(guest&&nearItem?.id===guest.id)return 'chat:'+guest.id;const sample=zones.samples.find(s=>s.object===obj);if(sample&&nearItem?.id==='sales')return sample.action;if(obj===zones.chef&&nearItem?.id==='chef')return 'chef';if(obj===zones.register&&['register','pickup'].includes(nearItem?.id))return nearItem.action;if(stage==='outside'){if(obj===bell)return 'bell';if(obj===door)return 'enter';}else{if(obj===door&&nearItem?.id==='door')return nearItem.action;if(obj===bread&&nearItem?.id==='bread')return nearItem.action;if(obj===oven&&nearItem?.id==='oven')return nearItem.action;}obj=obj.parent;}return null;
 }
 const listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:events.signal});
 listen(canvas,'pointerdown',e=>{if(stage==='outside'||activeTimeline||destroyed||e.button!==0)return;canvas.focus({preventScroll:true});const d=target.clone().sub(camera.position).normalize();drag={x:e.clientX,y:e.clientY,yaw:Math.atan2(d.x,-d.z),pitch:Math.asin(d.y)};wasDrag=false;canvas.setPointerCapture(e.pointerId);});
 listen(canvas,'pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)wasDrag=true;const yaw=drag.yaw-dx*.004,pitch=THREE.MathUtils.clamp(drag.pitch-dy*.003,-.7,.6);target.copy(camera.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(3));render();}else canvas.style.cursor=hit(e)?'pointer':stage==='outside'?'default':'grab';});
 listen(canvas,'pointerup',()=>{drag=null;});listen(canvas,'pointercancel',()=>{drag=null;wasDrag=true;});listen(canvas,'click',e=>{if(wasDrag){wasDrag=false;return;}const action=hit(e);if(action)onAction(action);});
 listen(canvas,'keydown',e=>{if(stage==='outside'||activeTimeline||destroyed||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.code==='Escape'){e.preventDefault();stopWalking();canvas.blur();return;}
  if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();walk(e.code,true);return;}
  if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)interact();return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=target.clone().sub(camera.position).normalize(),yaw=Math.atan2(d.x,-d.z)+(e.key==='ArrowLeft'?-.14:e.key==='ArrowRight'?.14:0),pitch=THREE.MathUtils.clamp(Math.asin(d.y)+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0),-.7,.6);target.copy(camera.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(3));render();
 });
 listen(window,'keyup',e=>{if(keys.has(e.code))walk(e.code,false);});listen(window,'blur',stopWalking);listen(canvas,'blur',stopWalking);
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();stopWalking();activeTimeline?.kill();activeTimeline=null;onLost();});
 listen(document,'visibilitychange',()=>{stopWalking();if(document.hidden){streetLife?.stop();life?.stop();environment?.sync();syncAudio();activeTimeline?.pause();smallTimeline?.pause();}else{activeTimeline?.resume();smallTimeline?.resume();render();}});
 function projected(x,y,z){const p=new THREE.Vector3(x,y,z).project(camera);return p.z>-1&&p.z<1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.94?{x:(p.x+1)*bounds.width/2,y:(1-p.y)*bounds.height/2}:null;}
 function streetPoint(item){
  if(!inViewport||activeTimeline||stage==='outside')return null;
  const pos=[camera.position.x,camera.position.z],d=target.clone().sub(camera.position),n=Math.hypot(d.x,d.z)||1;
  if(!nearby(pos,[d.x/n,d.z/n],[{...item,range:4.5}],stage==='result'))return null;
  return projected(item.position[0],item.y,item.position[1]);
 }
 function speechPoint(id){
  if(!isInside()||!inViewport)return null;
  const g=guests.find(g=>g.id===id),pos=g?.position||[-.2,-.91];
  if(Math.hypot(camera.position.x-pos[0],camera.position.z-pos[1])>4.8)return null;
  const pt=projected(pos[0],id==='chef'?2.25:1.7,pos[1]);if(!pt)return null;
  return {...pt,name:id==='chef'?'酵躁师傅':g.name};
 }
 function lifeContext(){
  const d=target.clone().sub(camera.position),n=Math.hypot(d.x,d.z)||1,position=[camera.position.x,camera.position.z],forward=[d.x/n,d.z/n];
  return {inside:isInside(),visible:inViewport,busy:!!activeTimeline||!!smallTimeline,walking:!!keys.size,
   chefDistance:Math.hypot(camera.position.x+.2,camera.position.z+.91),chefVisible:!!projected(-.2,1.85,-.91),
   guests:guests.filter(g=>projected(g.position[0],1.55,g.position[1])&&nearby(position,forward,[{...g,range:4.4,obstacle:g.id,ignoreObstacles:['sales','register']}],stage==='result'))};
 }
 streetLife=buildStreetLife(world,{box,sphere,cylinder,tube,C,label},{
  context:()=>({visible:inViewport,busy:!!activeTimeline||!!smallTimeline,rendering:!!activeTimeline||!!keys.size||!!life?.isRunning(),player:stage==='outside'?null:[camera.position.x,camera.position.z]}),render,speech:onStreetSpeech,status:onStreetStatus,bell:()=>ambience.bell(),
  door:open=>{if(stage==='outside'&&!activeTimeline)door.rotation.y+=((open?-1.32:0)-door.rotation.y)*.14;}
 });
 life=createShopLife({zones,guests,context:lifeContext,render,speech:onSpeech});
 environment=buildEnvironment({scene,world,hemi,sun,fill,ground,context:()=>({outside:stage==='outside',visible:inViewport,busy:!!activeTimeline||!!keys.size||!!life.isRunning()||!!streetLife.isRunning()}),render,box,sphere,cylinder,mat,C});
 const visibility=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;if(inViewport){render();life.wake();}else life.stop();streetLife.sync();environment.sync();syncAudio();},{threshold:.05});visibility.observe(canvas);
 resize();environment.set({time:'day',weather:'clear'},true);
 return {streetInteract:id=>streetLife.interact(id),setSoundEnabled:value=>ambience.setEnabled(value),setSoundVolume:value=>ambience.setVolume(value),setEnvironment:(s,r)=>{weather=s.weather;streetLife.setWeather(weather);life.setWeather(weather);environment.set(s,r);syncAudio();},setLifeOptions:o=>{streetLife.setOptions(o);life.setOptions(o);if('reduced'in o)environment.setReduced(o.reduced);},chat:id=>life.chat(id),antics,setRole,setOrder,nudge,walk,interact,stopWalking,startStreet,enter,exit,visit,bake,play,setRecipe,reset,work,turn,finish,resize,breadImage,render,stats:()=>({triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,version:THREE.REVISION}),dispose(){streetLife.dispose();ambience.dispose();environment.dispose();life.dispose();visibility.disconnect();stopWalking();events.abort();destroyed=true;observer.disconnect();activeTimeline?.kill();smallTimeline?.kill();window.gsap?.killTweensOf(bread.rotation);dispose(world);renderer.dispose();}};
}


