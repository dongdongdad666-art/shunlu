export function normalizeEnvironment(value){return {time:value?.time==='night'?'night':'day',weather:['rain','snow'].includes(value?.weather)?value.weather:'clear'};}
export function environmentLook(value){
 const s=normalizeEnvironment(value),night=s.time==='night',snow=s.weather==='snow',wet=s.weather==='rain';
 return {night,snow,wet,sky:night?(snow?0x263b50:0x172c3c):wet?0xa8b9bc:snow?0xd7e1df:0xefe8d5,
  sun:night?.35:wet?.8:snow?1.45:2.9,hemi:night?.65:wet?1.35:1.9,
  sunColor:night?0x9dbbe3:wet?0xc1d1db:snow?0xe8eff6:0xffebc8,
  ground:wet?0x738480:snow?0xd6ded4:0xc5b89b,road:wet?0x465b5b:snow?0x8eaaa7:0x94a498};
}
export function isSheltered(x,z){return (x>-4.3&&x<8.35&&z>-3.6&&z<2.4)||(x>-3.3&&x<3.35&&z>=2.4&&z<3.5);}
export function outdoorSeeds(count){
 let seed=721;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},result=[];
 while(result.length<count){const x=-6+random()*16,z=-4.5+random()*11;if(!isSheltered(x,z))result.push([x,random()*7,z]);}
 return result;
}
