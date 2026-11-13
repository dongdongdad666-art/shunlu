import * as THREE from './vendor/three.module.min.js';
import {fixtures} from './navigation.mjs';
import {makeBread} from './bread.mjs';

// Original toy-like character and shop props, built from the existing geometry vocabulary.
export function buildZones(interior,{box,sphere,cylinder,tube,label,mat,C}){
 const root=new THREE.Group();interior.add(root);
 const groups={};
 for(const {id,box:[a,b,c,d]} of fixtures){
  const g=new THREE.Group();g.position.set((a+b)/2,0,(c+d)/2);root.add(g);groups[id]=g;
  if(id==='chef')continue;
  const width=b-a,depth=d-c;
  if(id==='partition'){
   box(g,width,1.02,depth,C.green,0,.72,0);
   box(g,width*.5,1.85,depth,mat(0xc4d5bf,{transparent:true,opacity:.22,roughness:.15,depthWrite:false}),0,2.13,0);
   for(const z of [-depth/2,0,depth/2])box(g,.14,2.83,.08,C.green,0,1.65,z);
   box(g,.16,.09,depth,C.green,0,3.08,0);
  }else{
   box(g,width, .82,depth,C.green,0,.66,0);box(g,width,.11,depth,C.lightwood,0,1.13,0);
   for(let x=-width/2+.12;x<width/2;x+=.17)box(g,.024,.65,.025,0x43705b,x,.65,depth/2+.012);
  }
 }
 const sales=groups.sales,register=groups.register;
 const samples=[];
 for(let i=0;i<3;i++){
  const x=(i-1)*.86,shape=['loaf','round','ring'][i];
  box(sales,.78,.04,.65,C.paper,x,1.215,0);
  const b=makeBread({shape,tone:['gold','light','deep'][i]});b.scale.setScalar(.34);b.position.set(x,1.25,0);sales.add(b);samples.push({object:b,action:'select:'+shape,id:'sales'});
  label(sales,['小长条','圆圆包','暖心圈'][i],.63,.17,x,1.03,.443,'#efe8d5','#234e43',115);
 }
 for(const x of [-1.3,1.3])cylinder(sales,.026,.026,1.08,0xb59456,x,1.74,-.35);
 box(sales,2.7,.07,.18,C.green,0,2.26,-.35);
 label(sales,'慢慢挑 · 都是今天的',2.05,.22,0,2.27,-.24,'#234e43','#efe8d5',80);
 const till=new THREE.Group();till.position.set(-.67,1.2,0);register.add(till);
 box(till,.55,.07,.35,C.dark,0,0,0);box(till,.08,.33,.09,C.green,0,.17,-.06);
 const screen=box(till,.5,.34,.045,C.dark,0,.37,-.04);screen.rotation.x=-.2;
 label(till,'顺路 · 001',.44,.23,0,.37,0,'#e4d5b7','#234e43',135);
 const stamp=new THREE.Group();stamp.position.set(0,1.3,.02);register.add(stamp);
 box(stamp,.19,.08,.19,C.orange,0,0,0);cylinder(stamp,.055,.07,.16,C.wood,0,.1,0);
 box(register,.43,.015,.48,C.paper,0,1.197,.03);
 const deskBell=new THREE.Group();deskBell.position.set(.35,1.23,.13);register.add(deskBell);
 cylinder(deskBell,.15,.17,.06,C.green,0,0,0);sphere(deskBell,.12,0xc5a164,0,.07,0,1,.7,1);cylinder(deskBell,.025,.025,.08,C.dark,0,.15,0);
 const bag=new THREE.Group();bag.position.set(.88,1.22,0);register.add(bag);bag.visible=false;
 box(bag,.4,.55,.27,C.paper,0,.28,0);tube(bag,[[-.12,.56,0],[-.12,.69,0],[.12,.69,0],[.12,.56,0]],.018,C.green);
 label(bag,'顺路',.29,.2,0,.31,.145,'#efe8d5','#234e43',220);
 label(root,'01  选面包',1.9,.32,5.1,2.85,-3.19,'#e4d5b7','#234e43',110);
 label(root,'02  点单 / 取餐',2.3,.4,5.6,2.4,-3.18,'#234e43','#efe8d5',100);
 const bakerySign=label(root,'03  酵躁工坊',1.3,.3,2.49,2.8,-2.45,'#234e43','#efe8d5',110);bakerySign.rotation.y=Math.PI/2;
 // A crooked mushroom toque, flour brows and an oversized wooden peel: no borrowed character assets.
 const chef=groups.chef,body=new THREE.Group();chef.add(body);body.position.y=.2;
 for(const x of [-.18,.18]){box(body,.22,.23,.32,C.dark,x,.13,.02);cylinder(body,.1,.1,.37,C.green,x,.38,0);}
 sphere(body,.37,C.paper,0,.84,0,1.08,1.15,.8);
 sphere(body,.34,C.orange,0,.78,.17,1,.93,.45);
 box(body,.37,.32,.04,C.orange,0,1.02,.28);label(body,'酵',.21,.21,0,.85,.329,'#d96839','#efe8d5',200);
 const head=new THREE.Group();body.add(head);head.position.set(0,1.43,0);
 sphere(head,.34,0xe5b388,0,0,0,1.13,1,.92);sphere(head,.1,0xd68d67,0,-.03,.34,1.2,.8,1);
 for(const s of [-1,1]){
  sphere(head,.075,0xf7efdc,s*.14,.06,.288,1.2,.73,.55);sphere(head,.034,C.dark,s*.13,.052,.34,.65,1,.5);
  const brow=box(head,.21,.055,.055,C.dark,s*.15,.155,.32);brow.rotation.z=s*.27;
  sphere(head,.04,0xd48667,s*.22,-.075,.285,1.4,.6,.3);
 }
 box(head,.17,.025,.018,C.dark,0,-.17,.3);
 const hat=new THREE.Group();hat.position.set(.035,.27,0);hat.rotation.z=-.19;head.add(hat);
 cylinder(hat,.27,.3,.23,C.paper,0,.1,0);
 for(const [x,y,z,r] of [[0,.32,0,.29],[-.2,.26,0,.2],[.2,.29,0,.2],[.02,.47,-.04,.2]])sphere(hat,r,0xf9f0db,x,y,z);
 const arms=[];
 for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.36,1.04,0);body.add(arm);sphere(arm,.13,C.paper,s*.08,-.1,.03,1,1.5,1);sphere(arm,.11,0xe5b388,s*.13,-.28,.12);arms.push(arm);}
 const paddle=new THREE.Group();arms[1].add(paddle);paddle.position.set(.14,-.28,.17);paddle.rotation.x=.5;
 cylinder(paddle,.023,.025,.46,C.wood,0,.06,0);box(paddle,.22,.29,.045,C.lightwood,0,.36,0);
 const puff=new THREE.Group();puff.position.set(0,1.35,.6);chef.add(puff);puff.visible=false;
 for(let i=0;i<9;i++){const a=i*2.4;sphere(puff,.075+(i%3)*.025,mat(0xfaf2df,{transparent:true,opacity:.7,depthWrite:false}),Math.cos(a)*.36,(i%3)*.18,Math.sin(a)*.23);}
 label(root,'面团不许躺平！',1.25,.22,-.2,2.88,-1.6,'#d96839','#efe8d5',95);
 return {root,sales,register,samples,stamp,bag,deskBell,chef,body,head,hat,arms,puff};
}
