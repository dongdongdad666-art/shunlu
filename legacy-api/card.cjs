const {byId}=require('../server/cards.cjs'),{send}=require('../server/http.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return send(res,405,{error:'METHOD_NOT_ALLOWED'},undefined,{Allow:'GET'});
 const u=new URL(req.url,'https://shunlu.invalid'),id=u.searchParams.get('id'),scenario=u.searchParams.get('scenario');
 if(!Object.hasOwn(byId,id))return send(res,400,{error:'UNKNOWN_CARD'});
 if(scenario==='error')return send(res,503,{error:'SIMULATED_RESOURCE_FAILURE'});
 if(scenario==='delay'||scenario==='timeout')await new Promise(r=>setTimeout(r,scenario==='delay'?3000:9000));
 return send(res,200,{...byId[id],generation_mode:'template_demo',model_call_made:false,fallback_used:true,model_version:null,cost_status:'unknown'});
};
