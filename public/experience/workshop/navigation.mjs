import {residents} from './life.mjs';
// Floor-plan collision: a walking circle, fixed eye height, no rigid-body physics.
export const radius=.16;
export const room=[-3.9,7.92,-3.2,1.97];
export const streetBounds=[-5.1,9.5,-3.2,6.25];
export function regionAt([x,z]){return x>-4&&x<8.02&&z<2.15?'inside':'street';}
// Continuous doorway; all other shopfront and side windows remain solid to walking.
const exterior=[
 {id:'wall-left',box:[-4.1,-3.9,-3.4,2.3]},
 {id:'wall-right',box:[7.92,8.16,-3.4,2.3]},
 {id:'wall-back',box:[-4.1,8.16,-3.4,-3.2]},
 {id:'facade-left',box:[-4.1,1.03,1.97,2.3]},
 {id:'facade-right',box:[2.67,8.16,1.97,2.3]},
 {id:'open-door',box:[.97,1.51,2.08,3.79]},
 {id:'lamp-left',box:[-4.58,-4.12,3.67,4.13]},
 {id:'lamp-right',box:[8.37,8.83,3.67,4.13]},
 {id:'planter',box:[8.26,8.8,1.36,1.9]},
 {id:'bicycle',box:[8.32,8.82,-1.64,.36]},
 {id:'tree',box:[-5,-4.7,-1.2,-.9]},
 {id:'signboard',box:[-4.05,-3.25,2.12,2.48]}
];
export const ovenPosition=[-2.8,-1.56];
// New zone meshes read these bounds, keeping geometry and collision together.
export const fixtures=[
 {id:'partition',box:[2.34,2.46,-3.2,-1.65]},
 {id:'sales',box:[3.85,6.55,-.225,.625]},
 {id:'register',box:[4.3,6.9,-2.46,-1.74]},
 {id:'chef',box:[-.62,.22,-1.27,-.55]}
];
export function obstacles(open=false){return [
 {id:'bench',box:[-.725,1.925,-.41,.81]},
 {id:'oven',box:[ovenPosition[0]-.84,ovenPosition[0]+.84,ovenPosition[1]-.65,ovenPosition[1]+(open?1.74:.82)]},...fixtures,...exterior,
 ...residents.map(({id,position:[x,z],radius:r})=>({id,box:[x-r,x+r,z-r,z+r]}))
];}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function walkable([x,z],open=false){
 if(!Number.isFinite(x+z)||x<streetBounds[0]+radius||x>streetBounds[1]-radius||z<streetBounds[2]+radius||z>streetBounds[3]-radius)return false;
 return !obstacles(open).some(({box:[a,b,c,d]})=>Math.hypot(x-clamp(x,a,b),z-clamp(z,c,d))<radius-1e-8);
}
export function move(position,[dx,dz],open=false){
 let [x,z]=position;const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.04)||1;
 for(let i=0;i<steps;i++){if(walkable([x+dx/steps,z],open))x+=dx/steps;if(walkable([x,z+dz/steps],open))z+=dz/steps;}
 return [x,z];
}
export function direction(keys,yaw){
 const forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS')),right=Number(keys.has('KeyD'))-Number(keys.has('KeyA')),n=Math.hypot(forward,right)||1;
 return [(Math.sin(yaw)*forward+Math.cos(yaw)*right)/n,(-Math.cos(yaw)*forward+Math.sin(yaw)*right)/n];
}
function clear(a,b,open){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.025)||1;for(let i=0;i<=n;i++){const t=i/n;if(!walkable([a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t],open))return false;}return true;}
export function pathTo(start,end,open=false){
 if(!walkable(start,open)||!walkable(end,open))return [];
 if(clear(start,end,open))return [end];
 const nodes=[start,end],pad=radius+.025;
 for(const {box:[a,b,c,d]} of obstacles(open))for(const p of [[a-pad,c-pad],[b+pad,c-pad],[a-pad,d+pad],[b+pad,d+pad]])if(walkable(p,open))nodes.push(p);
 const dist=nodes.map(()=>Infinity),previous=[],used=new Set();dist[0]=0;
 for(let count=0;count<nodes.length;count++){
  let u=-1;for(let i=0;i<nodes.length;i++)if(!used.has(i)&&(u<0||dist[i]<dist[u]))u=i;
  if(u<0||!Number.isFinite(dist[u]))break;if(u===1){const route=[];for(let i=1;i!==0;i=previous[i])route.unshift(nodes[i]);return route;}
  used.add(u);for(let v=0;v<nodes.length;v++){if(used.has(v))continue;const d=dist[u]+Math.hypot(nodes[u][0]-nodes[v][0],nodes[u][1]-nodes[v][1]);if(d<dist[v]&&clear(nodes[u],nodes[v],open)){dist[v]=d;previous[v]=u;}}
 }
 return [];
}
function crosses(a,b,[xmin,xmax,zmin,zmax]){
 let near=0,far=1;
 for(const [k,min,max] of [[0,xmin,xmax],[1,zmin,zmax]]){const delta=b[k]-a[k];if(Math.abs(delta)<1e-9){if(a[k]<min||a[k]>max)return false;}else{let t1=(min-a[k])/delta,t2=(max-a[k])/delta;if(t1>t2)[t1,t2]=[t2,t1];near=Math.max(near,t1);far=Math.min(far,t2);if(near>far)return false;}}
 return far>0&&near<1;
}
export function nearby(position,forward,items,open=false){
 let found=null,best=Infinity;
 for(const item of items){const dx=item.position[0]-position[0],dz=item.position[1]-position[1],distance=Math.hypot(dx,dz);
  const facing=distance>.05?(dx*forward[0]+dz*forward[1])/distance:1,score=distance*(1+2*(1-facing));
  if(distance>item.range||score>best||facing<.2)continue;
  if(obstacles(open).some(o=>o.id!==item.obstacle&&!item.ignoreObstacles?.includes(o.id)&&crosses(position,item.position,o.box)))continue;
  found=item;best=score;
 }return found;
}
