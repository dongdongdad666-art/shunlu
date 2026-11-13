// Original procedural ambience: no recordings or third-party audio assets.
export function ambienceMix({weather='clear',inside=false,distance=10,baking=false}={}){
 const near=inside?1/(1+Math.max(0,Number.isFinite(distance)?distance:10)**2*.22):0;
 return {rain:weather==='rain'?(inside?.075:.19):0,wind:(weather==='snow'?.16:weather==='rain'?.09:.025)*(inside?.3:1),oven:near*(baking?.22:.13),hum:near*(baking?.025:.014),cutoff:inside?1350:8500};
}
export function createAmbience({AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext,onState=()=>{}}={}){
 let ctx=null,master,rain,wind,oven,hum,rainFilter,enabled=false,dead=false,volume=.35,active=null,pending=null,lastMix='';
 let state={visible:true,inside:false,weather:'clear',distance:10,baking:false};const sources=[];
 const report=()=>onState({enabled,state:dead?'closed':ctx?.state||'off',volume});
 function create(){
  ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let seed=731;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
  function noise(type,freq,q){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=buffer;s.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.value=0;s.connect(f);f.connect(g);g.connect(master);s.start();sources.push(s);return {filter:f,gain:g};}
  const r=noise('lowpass',8500,.5);rain=r.gain;rainFilter=r.filter;
  wind=noise('bandpass',320,.6).gain;oven=noise('lowpass',230,.6).gain;
  const oscillator=ctx.createOscillator();oscillator.type='sine';oscillator.frequency.value=86;hum=ctx.createGain();hum.gain.value=0;oscillator.connect(hum);hum.connect(master);oscillator.start();sources.push(oscillator);
  // A slow filter sweep gives wind gentle gusts without a JS timer.
  const gust=ctx.createOscillator(),depth=ctx.createGain();gust.frequency.value=.13;depth.gain.value=80;
  const gustFilter=ctx.createBiquadFilter();gustFilter.type='lowpass';gustFilter.frequency.value=640;
  wind.disconnect();wind.connect(gustFilter);gustFilter.connect(master);gust.connect(depth);depth.connect(gustFilter.frequency);gust.start();sources.push(gust);
 }
 function fade(param,value){param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(value,ctx.currentTime,.3);}
 function fail(){enabled=false;active=false;if(master)master.gain.value=0;report();}
 function sync(next={}){
  state={...state,...next};if(dead||!ctx)return;
  const audible=enabled&&state.visible;
  const mix=ambienceMix(state),key=JSON.stringify([mix,audible,volume]);
  if(key!==lastMix){lastMix=key;fade(master.gain,audible?volume:0);fade(rain.gain,mix.rain);fade(wind.gain,mix.wind);fade(oven.gain,mix.oven);fade(hum.gain,mix.hum);fade(rainFilter.frequency,mix.cutoff);}
  if(active!==audible&&!pending){
   active=audible;pending=(audible?ctx.resume():ctx.suspend()).catch(fail).finally(()=>{pending=null;if(!dead){report();sync();}});
  }
 }
 return {
  sync,
  bell(){
   if(dead||!enabled||!ctx||ctx.state!=='running'||!state.visible)return;
   const tone=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
   tone.type='sine';tone.frequency.setValueAtTime(1760,now);tone.frequency.exponentialRampToValueAtTime(1320,now+.18);
   gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.001,now+.65);
   tone.connect(gain);gain.connect(master);tone.onended=()=>{tone.disconnect();gain.disconnect();};tone.start();tone.stop(now+.7);
  },
  async setEnabled(value){
   if(dead)return false;enabled=!!value;
   try{if(enabled&&!ctx){if(!AudioContext)throw new Error('Audio unavailable');create();}sync();if(pending)await pending;report();return enabled;}
   catch{fail();if(ctx){await ctx.close().catch(()=>{});ctx=null;sources.length=0;active=null;lastMix='';}return false;}
  },
  setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));sync();report();},
  dispose(){if(dead)return;dead=true;enabled=false;sources.forEach(s=>{try{s.stop();}catch{}});if(ctx){master.gain.value=0;ctx.close().catch(()=>{});}report();}
 };
}
