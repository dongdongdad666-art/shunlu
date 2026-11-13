const {exportCard,validate}=require('../server/cards.cjs'),{send,readBody}=require('../server/http.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'},undefined,{Allow:'POST'});
 let input;try{input=validate(await readBody(req));}catch(e){return send(res,e.message==='BODY_TOO_LARGE'?413:400,{error:e.message==='BODY_TOO_LARGE'?'BODY_TOO_LARGE':'INVALID_REQUEST'});}
 if(input.scenario==='error')return send(res,503,{error:'SIMULATED_EXPORT_FAILURE'});
 try{const out=await exportCard(input.id,input.format,input.note);if(out.bytes.length>=4500000)return send(res,413,{error:'EXPORT_TOO_LARGE'});return send(res,200,out.bytes,out.type,{'Content-Disposition':'attachment; filename="SHUNLU-'+input.id+'-'+input.format+'.'+out.ext+'"'});}catch{return send(res,500,{error:'EXPORT_FAILED'});}
};
