import * as THREE from './vendor/three.module.min.js';
import {describeRecipe} from './recipe.mjs';

// Deterministic sculpting keeps the live model and exported card identical.
export function makeBread(recipe={}){
 const d=describeRecipe(recipe),g=new THREE.Group(),isRing=d.shape==='ring';
 const scale=d.shape==='loaf'?[1.02,.34,.43]:[.72,.44,.66],cy=d.shape==='loaf'?.37:.47;
 const geo=isRing?new THREE.TorusGeometry(.47,.215,28,80):new THREE.SphereGeometry(1,96,64);
 if(isRing){geo.rotateX(-Math.PI/2);geo.scale(1,.87,1);geo.translate(0,.24,0);}
 else geo.scale(...scale),geo.translate(0,cy,0);
 const positions=geo.attributes.position,colors=[],base=new THREE.Color(d.color),gold=new THREE.Color('#f6d48e'),burnt=new THREE.Color('#99501f');
 for(let i=0;i<positions.count;i++){
  let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  const wobble=1+.014*Math.sin(x*11+z*7)+.009*Math.cos(z*17-y*8);
  x*=wobble;z*=wobble;y+=.008*Math.sin(x*12)*Math.cos(z*9);
  let score=0;
  if(!isRing&&y>cy+.09){
   const cuts=d.shape==='loaf'?[-.62,-.22,.2,.59]:[-.19,.16];
   for(const cut of cuts){const dist=d.shape==='loaf'?Math.abs(x-cut-z*.3077):Math.abs(z-cut-Math.sin((x/1.03+.5)*Math.PI)*.045);
    const extent=d.shape==='loaf'?Math.max(0,1-(Math.abs(z)/.36)**8):Math.max(0,1-(Math.abs(x)/.57)**8);
    score=Math.max(score,Math.exp(-((dist/.034)**2))*extent);
   }
  }
  y-=score*.043;positions.setXYZ(i,x,Math.max(.022,y),z);
  const height=isRing?(y-.05)/.39:(y-.03)/(scale[1]*2);
  const baked=.5+.24*Math.sin(x*7+z*3)+.2*Math.cos(z*9-x*2);
  const c=base.clone().lerp(gold,.1+Math.max(0,.6-height)*.42).lerp(burnt,Math.max(0,height-.45)*.28*baked);
  const pore=Math.sin(x*113+z*69)*Math.cos(z*127+y*77);
  c.multiplyScalar(1+pore*.024).lerp(new THREE.Color('#f6d99c'),score*.91);colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const crust=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.64,metalness:0}));crust.name='crust';crust.castShadow=crust.receiveShadow=true;g.add(crust);
 const top=(x,z)=>isRing?.24+.187*Math.sqrt(Math.max(0,1-((Math.hypot(x,z)-.47)/.215)**2)):cy+scale[1]*Math.sqrt(Math.max(0,1-(x/scale[0])**2-(z/scale[2])**2));
 // Instanced sesame and flour flecks keep surface detail to two draw calls.
 for(const flour of [false,true]){
  const count=flour?64:22,seed=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({color:flour?'#f2dfbb':'#f6d7a0',roughness:.9}),count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const a=i*2.399963,r=.12+Math.sqrt((i+.5)/count)*.7;
   let x,z;if(isRing){const radius=.47+.115*Math.sin(i*4.17);x=Math.cos(a)*radius;z=Math.sin(a)*radius;}else{x=Math.cos(a)*r*scale[0];z=Math.sin(a)*r*scale[2];}
   dummy.position.set(x,top(x,z)+.012,z);dummy.rotation.set(.08,a,.08);const s=flour?.009:.019;
   dummy.scale.set(s*(flour?1.2:1.7),s*.35,s*(flour?.8:.65));dummy.updateMatrix();seed.setMatrixAt(i,dummy.matrix);
  }seed.castShadow=!flour;g.add(seed);
 }
 return g;
}
