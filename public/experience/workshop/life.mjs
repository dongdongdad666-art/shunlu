export const residents=[
 {id:'picker',name:'挑包的阿栗',position:[6.98,.45],radius:.27,color:0x788c67,yaw:-1.15,lines:['这个香，那个也香……全都怪鼻子。','我只买一个。一个纸袋那么多。']},
 {id:'queue',name:'等餐的小陆',position:[3.26,-2.4],radius:.26,color:0xd96839,yaw:.9,lines:['不着急，我只是每三秒看一次烤箱。','师傅的脾气，比面包先出炉。']},
 {id:'reader',name:'窗边的周叔',position:[7.25,1.46],radius:.28,color:0x56746a,yaw:-1.5,lines:['书翻了两页，面包已经吃完了。','这家店的背景音乐，是师傅的碎碎念。']}
];
const weatherLines={
 rain:{chef:['雨点别敲了！你也想催单？！','外面下雨，我在里面下脾气。面包还是热的！'],picker:['面包躲进纸袋，我躲进面包店。安排得明明白白。','雨伞可以湿，刚出炉的面包不可以。'],queue:['雨还没停？太好了，又有理由多等一炉。','今天的排队背景音：滴答，咕噜。后面那个是我。'],reader:['雨翻街道，我翻书。今天慢一点也行。','窗外下雨，杯里冒热气，这页值得多看一会儿。']},
 snow:{chef:['谁在外面筛面粉？！给我留点！','雪花都能落地，面团为什么还不起床？！'],picker:['雪是白的，面包是金的。今天我选金的。','给面包捂好，我的手也顺便暖一暖。'],queue:['要是雪花能排号，我今天怕是吃不上了。','外面在降温，我的食欲在升温。'],reader:['雪落得很轻，师傅喊得很响。刚刚好。','窗外像撒了糖粉。这本书突然变甜了。']},
 clear:{chef:['太阳负责晒，我负责烤。谁都别抢活！','天气放晴！面团也给我精神一点！'],picker:['太阳晒面包，我晒好心情。','今天适合散步，顺便散进这家店。'],queue:['天这么好，我愿意再等三分钟。最多四分钟。','阳光到了，面包怎么还没到？'],reader:['阳光替我夹住这一页。','今天这窗光，很配一块刚出炉的面包。']}
};
export function weatherLine(who,weather,index=0){const list=weatherLines[weather]?.[who];return list?.[Math.abs(index)%list.length]||'';}

export function createLifeDirector(){
 let time=0,next=1.2,cycle=0,latched=false,cooldown=0;
 return {tick(dt,{active,blocked,near}){
  if(!active||blocked){next=Math.max(next,time+.8);return null;}
  time+=Math.max(0,dt);if(!near)latched=false;
  if(near&&!latched&&time>=cooldown){latched=true;cooldown=time+12;next=time+5;return {kind:'approach'};}
  if(time<next)return null;
  next=time+6;return {kind:['knead','tidy','mutter'][cycle++%3],cycle};
 }};
}
