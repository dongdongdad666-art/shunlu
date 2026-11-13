import {pathTo,walkable} from './navigation.mjs';
export const views={
 neighbors:{name:'街坊日常',position:[-.6,1.85,5.6],target:[2.1,1.1,2.1]},
 notice:{name:'街坊留言',position:[-3.3,1.72,4.4],target:[-3.65,1.1,2.5]},
 pinwheel:{name:'花盆风车',position:[8.65,1.72,2.75],target:[8.52,1.6,1.65]},
 bikebell:{name:'自行车铃',position:[8.65,1.72,.92],target:[8.62,1.24,-.48]},
 entry:{name:'店门',position:[1.9,1.72,1.55],target:[4.8,1.3,.1]},
 doorway:{name:'门口',position:[1.9,1.72,1.55],target:[1.9,1.6,5.5]},
 street:{name:'街道探索',position:[1.9,1.72,4.65],target:[1.9,1.6,1.55]},
 display:{name:'面包展示',position:[3.25,1.9,1.45],target:[5.1,1.28,-.2]},
 window:{name:'窗边看天气',position:[3.65,1.85,-.65],target:[6,1.4,3.8]},
 counter:{name:'点单前台',position:[4.1,1.72,-1.05],target:[5.5,1.2,-2.1]},
 register:{name:'前台内侧',position:[6.95,1.75,-2.88],target:[5.2,1.1,-1.8]},
 pickup:{name:'取餐口',position:[7.25,1.72,-.8],target:[6.5,1.35,-2.1]},
 work:{name:'烘焙台',position:[1.5,1.92,-2.1],target:[.2,1.38,.2]},
 chef:{name:'酵躁师傅',position:[-1.12,1.82,.79],target:[-.2,1.55,-.9]},
 oven:{name:'烤炉前',position:[-2.45,1.8,.9],target:[-2.8,1.05,-.7]}
};
export function routeTo(from,to){
 if(!Object.hasOwn(views,from)||!Object.hasOwn(views,to))throw new Error('Unknown station');
 const a=views[from].position,b=views[to].position;
 return pathTo([a[0],a[2]],[b[0],b[2]]).map(([x,z])=>[x,b[1],z]);
}

// Round only corners whose complete curve clears the same walking footprint.
// Arc-length sampling avoids a new stop/ease at every navigation waypoint.
export function cameraTrack(points,open=false){
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),rounded=[points[0]];
 for(let i=1;i<points.length-1;i++){
  const [a,b,c]=points.slice(i-1,i+2),ab=distance(a,b),bc=distance(b,c),r=Math.min(.28,ab*.28,bc*.28);
  if(r<.001){rounded.push(b);continue;}
  const before=mix(b,a,r/ab),after=mix(b,c,r/bc),curve=[];
  for(let j=0;j<=16;j++){const t=j/16;curve.push(mix(mix(before,b,t),mix(b,after,t),t));}
  const safe=curve.every(([x,y,z])=>(z>4&&y>=1.7)||walkable([x,z],open));
  rounded.push(...(safe?curve:[b]));
 }
 rounded.push(points.at(-1));
 const lengths=[0];for(let i=1;i<rounded.length;i++)lengths.push(lengths.at(-1)+distance(rounded[i-1],rounded[i]));
 const length=lengths.at(-1);
 return {length,points:rounded,at(progress){if(progress<=0)return [...rounded[0]];if(progress>=1)return [...rounded.at(-1)];const d=progress*length;let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;return mix(rounded[i-1],rounded[i],(d-lengths[i-1])/Math.max(1e-9,lengths[i]-lengths[i-1]));}};
}
