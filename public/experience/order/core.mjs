export const menu=[
{id:'P01',name:'原味长条餐包',taste:'原味麦香',price:1200,stock:6,spec:'标准装 · 1个',note:'金色表皮，三道斜割口。把熟悉的麦香顺路带回家。'},
{id:'P02',name:'圆形谷物面包',taste:'谷物烘香',price:1800,stock:6,spec:'标准装 · 1个',note:'圆润轮廓与片状谷物的层次，留给喜欢慢慢咀嚼的时刻。'},
{id:'P03',name:'切片吐司',taste:'柔软吐司',price:2600,stock:6,spec:'标准装 · 1份',note:'一份方正、柔软的日常。多留一片，给想见的人。'},
{id:'P04',name:'黄油可颂',taste:'层叠酥香',price:1600,stock:6,spec:'标准装 · 1个',note:'把层层酥香留给早晨。拐个弯，带走一份金色的日常。'},
{id:'P05',name:'海盐卷',taste:'咸香柔软',price:1000,stock:6,spec:'标准装 · 1个',note:'卷起一点咸香，把简单的满足放进纸袋。'},
{id:'P06',name:'肉桂卷',taste:'肉桂暖香',price:1800,stock:6,spec:'标准装 · 1个',note:'一圈一圈的暖香，适合给午后留个空隙。'}];
export const aromaProducts=menu.filter(p=>['P01','P02','P03'].includes(p.id));
export const states=[{id:'S01',name:'慢一点',desc:'给今天留一点空隙'},{id:'S02',name:'想出发',desc:'带上熟悉的味道'},{id:'S03',name:'想分享',desc:'把这一刻分给你'},{id:'S04',name:'留给自己',desc:'安静地享受一会儿'}];
export const money=cents=>'¥'+(cents/100).toFixed(2);
export function chooseCard(state,product){const s=states.findIndex(x=>x.id===state),p=aromaProducts.findIndex(x=>x.id===product);if(s<0||p<0)throw Error('请选择状态与口味');return 'A'+String(s*3+p+1).padStart(2,'0');}
export function totals(bag,coupon=false){let subtotal=0,count=0;for(const x of bag){const p=menu.find(p=>p.id===x.id);if(!p||!Number.isInteger(x.qty)||x.qty<1||x.qty>6)throw Error('购物袋商品无效');subtotal+=p.price*x.qty;count+=x.qty;}const discount=coupon&&subtotal>=2000?300:0;return{subtotal,discount,total:subtotal-discount,count};}
export function validateBag(bag,inventory=menu){if(!bag.length)return'购物袋还是空的，先挑一份面包吧。';for(const x of bag){const p=inventory.find(p=>p.id===x.id);if(!p)return'有商品已下架，请从购物袋移除。';if(!Number.isInteger(x.qty)||x.qty<1||x.qty>6)return'每款请选择1至6份。';if(x.qty>p.stock)return p.name+'的演示库存不足，请调整数量。';}return null;}
export function validateCheckout(bag,inventory,date,slot){const error=validateBag(bag,inventory);if(error)return error;if(!['today','tomorrow'].includes(date))return'请选择演示取货日期。';if(!['afternoon','evening'].includes(slot))return'请选择可用的演示取货时段。';return null;}
export function redeemCoupon(coupon,code,now=Date.now()){if(!coupon||code!==coupon.code)throw Error('演示券码无效，请核对。');if(coupon.status==='used')throw Error('这张演示券已经使用，不能重复核销。');if(coupon.expires<=now)throw Error('演示券已过期。');return{...coupon,status:'used'};}
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function validPickupDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number);return y>=1000&&localDate(new Date(y,m-1,d))===value;}
export const pickupDateLabel=order=>validPickupDate(order.pickupDate)?order.pickupDate:'旧演示订单 · 取货日期待确认';
export function createOrder(req,inventory=menu,previous,now=new Date()){if(previous?.key===req.key)return previous;const error=validateCheckout(req.bag,inventory,req.date,req.slot);if(error)throw Error(error);const amount=totals(req.bag,req.coupon),pickup=new Date(now);pickup.setDate(pickup.getDate()+(req.date==='tomorrow'?1:0));return{id:'DEMO-'+req.key.toUpperCase(),key:req.key,items:req.bag.map(x=>({...x,name:menu.find(p=>p.id===x.id).name,price:menu.find(p=>p.id===x.id).price})),date:req.date,pickupDate:localDate(pickup),slot:req.slot,status:'reserved',...amount};}
export function transitionOrder(order,status){if(order.status!=='reserved')throw Error('该演示订单已结束，不能重复操作。');if(!['picked','cancelled'].includes(status))throw Error('无效订单状态');return{...order,status};}
export function restoreSnapshot(raw){
 const validItems=xs=>Array.isArray(xs)&&xs.length<=menu.length&&new Set(xs.map(x=>x?.id)).size===xs.length&&xs.every(x=>x&&menu.some(p=>p.id===x.id)&&Number.isInteger(x.qty)&&x.qty>=1&&x.qty<=6);
 const bag=validItems(raw?.bag)?raw.bag.map(({id,qty})=>({id,qty})):[];
 const c=raw?.coupon,coupon=c&&c.code==='DEMO-003'&&['available','used'].includes(c.status)&&Number.isFinite(c.expires)?{code:c.code,status:c.status,expires:c.expires}:null;
 const o=raw?.order;let order=null;
  if(o&&typeof o.id==='string'&&typeof o.key==='string'&&o.id==='DEMO-'+o.key.toUpperCase()&&['reserved','picked','cancelled'].includes(o.status)&&['today','tomorrow'].includes(o.date)&&(o.pickupDate===undefined||validPickupDate(o.pickupDate))&&['afternoon','evening'].includes(o.slot)&&validItems(o.items)&&o.items.length&&o.items.every(x=>menu.some(p=>p.id===x.id&&p.name===x.name&&p.price===x.price))){const a=totals(o.items,o.discount===300);if(['subtotal','discount','total','count'].every(k=>o[k]===a[k]))order=o;}
 return{bag,coupon,order};
}
export function abortable(promise,signal){return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Cancelled','AbortError'));if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});promise.then(v=>{signal.removeEventListener('abort',abort);resolve(v);},e=>{signal.removeEventListener('abort',abort);reject(e);});});}
export function validateCouponIntent(selected,valid,subtotal){return selected&&!valid&&subtotal>=2000?'演示券状态已变化，优惠已移除。请核对新金额后重新确认。':null;}

