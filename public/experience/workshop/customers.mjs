import * as THREE from './vendor/three.module.min.js';
import {residents} from './life.mjs';
// Fixed, collision-aware standing spots; only limbs and props move within their personal space.
export function buildCustomers(parent,{box,sphere,cylinder,tube,C},specs=residents){
 return specs.map((spec,i)=>{
  const root=new THREE.Group();root.position.set(spec.position[0],.2,spec.position[1]);root.rotation.y=spec.yaw;parent.add(root);
  const body=new THREE.Group();root.add(body);
  const feet=[],legs=[];for(const s of [-1,1]){const leg=new THREE.Group();leg.position.set(s*.115,.44,0);body.add(leg);legs.push(leg);const foot=box(leg,.16,.14,.26,C.dark,0,-.36,.045);feet.push(foot);cylinder(leg,.068,.075,.34,0x7b6959,0,-.16,0);}
  sphere(body,.25,spec.color,0,.68,0,1.05,1.3,.72);
  const head=new THREE.Group();head.position.set(0,1.17,0);body.add(head);
  sphere(head,.235,[0xe2b692,0xd5a47f,0xe9c4a3][i],0,0,0,1,1.05,.94);
  sphere(head,.052,0xc99774,0,-.025,.215,1,.85,1);
  const eyes=[];for(const s of [-1,1])eyes.push(sphere(head,.023,C.dark,s*.079,.035,.208,1,1.2,.45));
  box(head,.075,.016,.015,C.dark,0,-.095,.212);
  if(i===0){sphere(head,.245,C.green,0,.18,-.02,1.14,.34,1.03);sphere(head,.025,C.green,.04,.27,0);sphere(head,.12,0x53493a,0,-.07,-.21);}
  if(i===1){sphere(head,.24,C.orange,0,.135,0,1,.7,1);cylinder(head,.237,.238,.055,0xe3ad73,0,.12,0);box(body,.16,.44,.04,C.paper,.13,.76,.195);}
  if(i===2){for(const s of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.058,.009,6,16),new THREE.MeshStandardMaterial({color:C.dark}));ring.position.set(s*.083,.025,.223);head.add(ring);}box(head,.07,.012,.012,C.dark,0,.025,.225);sphere(head,.235,0xb6b5a0,0,.16,-.06,1,.48,.95);}
  const arms=[];for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.24,.88,0);body.add(arm);sphere(arm,.078,spec.color,s*.025,-.12,0,1,1.9,1);sphere(arm,.07,0xe1b58d,s*.03,-.27,.04);arms.push(arm);}
  if(i===0){const bag=new THREE.Group();arms[0].add(bag);bag.position.set(-.02,-.44,.05);box(bag,.2,.29,.13,C.paper,0,0,0);tube(bag,[[-.06,.14,0],[-.06,.24,0],[.06,.24,0],[.06,.14,0]],.009,C.green);}
  if(i===1){box(arms[1],.11,.17,.012,C.paper,.02,-.27,.095);box(arms[1],.075,.016,.014,C.orange,.02,-.24,.104);}
  if(i===2){const book=box(arms[0],.28,.035,.23,C.orange,.06,-.18,.23);book.rotation.x=-.4;box(arms[0],.25,.012,.21,C.paper,.06,-.151,.23);cylinder(arms[1],.054,.043,.13,C.paper,0,-.22,.14);}
  function animate(t,reduced=false,weather='clear'){
   const phase=t+i*1.7,sway=reduced?0:Math.sin(phase*1.2);
   body.rotation.z=sway*.018;body.position.y=reduced?0:Math.sin(phase*1.7)*.008;
   head.rotation.y=reduced?0:Math.sin(phase*.7)*.17;head.rotation.x=i===2?.2:(reduced?0:Math.sin(phase)*.045);
   arms[0].rotation.x=i===2?-.55:0;
   arms[1].rotation.x=i===0?-.7+(reduced?0:Math.sin(phase*.8)*.3):i===2?-.8+(reduced?0:Math.sin(phase*.8)*.2):-.4;
   feet[1].rotation.x=i===1&&!reduced?Math.max(0,Math.sin(phase*5))*.17:0;
   if(!reduced&&weather==='snow'){
    body.rotation.z+=Math.sin(phase*16)*.014;arms[0].rotation.x=-1.05;arms[1].rotation.x=-1.05;head.rotation.x=.13;
   }else if(!reduced&&weather==='rain'){
    head.rotation.y=-.35+Math.sin(phase*.55)*.16;arms[0].rotation.x=i===2?-.55:-.7;arms[1].rotation.x=-.65;
   }
   const blink=!reduced&&phase%4.7<.12;eyes.forEach(e=>e.scale.y=blink?.16:1.2);
  }
  animate(0,true);return {...spec,root,body,head,arms,legs,animate};
 });
}
