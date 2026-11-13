const stop=(x,z,hold=0,activity='散步')=>({p:[x,z],hold,activity});
export const people=[
 {id:'stroll',name:'散步的阿棠',color:0x9ca77d,speed:.48,route:[stop(-3,5.45,2),stop(7.1,5.45,3),stop(-3,5.45,3)]},
 {id:'neighbor',name:'遛弯的小周',color:0xd96839,speed:.58,route:[stop(6.7,4.6,3),stop(-2.8,4.6,4),stop(6.7,4.6,3)]},
 {id:'visitor',name:'顺路买包的林姐',color:0x749589,speed:.65,route:[stop(2.1,4.25,2,'闻到麦香'),stop(2.1,1.3,0,'进店'),stop(3.15,1.25,6,'挑面包'),stop(3.2,-1.15,5,'等打包'),stop(3.15,1.25,1,'提袋离店'),stop(2.1,1.3),stop(2.1,4.25,0,'回到街道'),stop(7.1,3.25,5,'散步回家'),stop(7.1,3.95),stop(2.1,3.95)]}
];
export const streetLines={
 stroll:{clear:['今天走了一万步，刚好抵一口面包。','我不是来买的，我是被香味拐来的。'],rain:['雨伞挡雨，面包挡饿。'],snow:['雪落慢一点，我的面包还热着。']},
 neighbor:{clear:['说好只遛一圈，怎么又绕到面包店了？','这条街，我用鼻子导航。'],rain:['天气预报说下雨，我预报想吃。'],snow:['脚印是我留的，面包屑不是。']},
 visitor:{clear:['先挑一款，再替明天挑一款。','师傅，少一点脾气，多一点黄油。'],rain:['进店躲个雨，顺便躲进麦香里。'],snow:['这袋热面包，就是我的暖手宝。']}
};
export function createWalker(spec){
 const state={position:[...spec.route[0].p],index:0,wait:spec.route[0].hold,activity:spec.route[0].activity,bag:false,moving:false,yaw:0};
 return Object.assign(state,{tick(delta,{paused=false,player,others=[]}={}){
  state.moving=false;if(paused)return;const dt=Math.min(.1,Math.max(0,delta));
  if(state.wait>0){state.wait=Math.max(0,state.wait-dt);return;}
  const next=spec.route[(state.index+1)%spec.route.length],dx=next.p[0]-state.position[0],dz=next.p[1]-state.position[1],d=Math.hypot(dx,dz),step=Math.min(d,spec.speed*dt);
  const p=d?[state.position[0]+dx/d*step,state.position[1]+dz/d*step]:[...state.position];
  const approaching=(o,r)=>Math.hypot(p[0]-o[0],p[1]-o[1])<r&&Math.hypot(p[0]-o[0],p[1]-o[1])<Math.hypot(state.position[0]-o[0],state.position[1]-o[1]);
  if((player&&approaching(player,.78))||others.some(o=>approaching(o,.55)))return;
  if(d>.001){state.position=p;state.yaw=Math.atan2(dx,dz);state.moving=true;}
  if(d<=step+.001){state.index=(state.index+1)%spec.route.length;state.wait=next.hold;state.activity=next.activity;if(next.activity==='提袋离店')state.bag=true;if(state.index===0)state.bag=false;}
 }});
}

