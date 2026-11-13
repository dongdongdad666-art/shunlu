export const roles={customer:'顾客',clerk:'前台',baker:'烘焙师'};
export const steps={browse:'挑一款面包',selected:'去前台下单',ordered:'等待前台盖章',accepted:'揉面准备中',baking:'正在出炉',ready:'可以取餐啦',collected:'这一袋，顺路带走'};
export function newOrder(){return {step:'browse',shape:'loaf',kneads:0};}
export function recoverOrder(state){return state.step==='baking'?{...state,step:'accepted'}:state;}
export function act(state,action,role,value){
 const deny=message=>({ok:false,state,message});
 const required={select:'customer',order:'customer',stamp:'clerk',knead:'baker',bake:'baker',baked:'system',pickup:'customer'}[action];
 if(!required)return deny('这个动作还没有准备好。');
 if(role!==required)return deny(`请先切换为${roles[required]||'对应角色'}。`);
 const s={...state};
 if(action==='select'){if(!['browse','selected'].includes(s.step))return deny('这一单已经提交，取餐后可以再选。');if(!['loaf','round','ring'].includes(value))return deny('请选择展示架上的面包。');s.shape=value;s.step='selected';}
 if(action==='order'){if(s.step!=='selected')return deny('先在展示区挑一款面包。');s.step='ordered';}
 if(action==='stamp'){if(s.step!=='ordered')return deny('还没有待接的体验订单。');s.step='accepted';}
 if(action==='knead'){if(s.step!=='accepted')return deny('先请前台盖章接单。');if(s.kneads>=3)return deny('面团已经松软，送去烤炉吧。');s.kneads++;}
 if(action==='bake'){if(s.step!=='accepted'||s.kneads<3)return deny('接单后揉面三次，再送进烤炉。');s.step='baking';}
 if(action==='baked'){if(s.step!=='baking')return deny('没有正在烘焙的订单。');s.step='ready';}
 if(action==='pickup'){if(s.step!=='ready')return deny('这一炉还没好，再逛一会儿。');s.step='collected';}
 return {ok:true,state:s};
}
