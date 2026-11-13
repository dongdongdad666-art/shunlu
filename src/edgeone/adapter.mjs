import {Readable} from 'node:stream';

// Keep the existing streamed request validation and binary export handlers.
export function adapt(handler){
 return async function({request}){
  const url=new URL(request.url);
  const bodyIn=request.body;
  const parsed=bodyIn!=null&&typeof bodyIn==='object'&&!(bodyIn instanceof Uint8Array)&&typeof bodyIn.getReader!=='function';
  const req=bodyIn==null?Readable.from([]):
   typeof bodyIn==='string'||Buffer.isBuffer(bodyIn)||bodyIn instanceof Uint8Array
    ?Readable.from([Buffer.from(bodyIn)]):parsed?Readable.from([]):Readable.fromWeb(bodyIn);
  Object.assign(req,{method:request.method,url:url.pathname+url.search,headers:Object.fromEntries(request.headers)});
  if(parsed)req.body=bodyIn;
  let status=200,headers={},body;
  const res={writeHead(s,h={}){status=s;headers=h;},end(value){body=value;}};
  try{await handler(req,res);return new Response(body,{status,headers});}
  finally{req.destroy();}
 };
}
