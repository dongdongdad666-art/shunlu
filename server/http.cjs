function send(res,status,body,type='application/json',headers={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(Buffer.isBuffer(body)?body:JSON.stringify(body));}
async function readBody(req){
 const contentLength=req.headers?.['content-length'];
 if(contentLength!==undefined){const size=Number(contentLength);if(!Number.isSafeInteger(size)||size<0)throw Error('INVALID_CONTENT_LENGTH');if(size>4096)throw Error('BODY_TOO_LARGE');}
 if(req.body!==undefined&&typeof req.body!=='string'&&!Buffer.isBuffer(req.body)&&contentLength===undefined)throw Error('LENGTH_REQUIRED');
 if(req.body!==undefined){const raw=typeof req.body==='string'||Buffer.isBuffer(req.body)?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>4096)throw Error('BODY_TOO_LARGE');return typeof raw==='string'||Buffer.isBuffer(raw)?JSON.parse(raw.toString()):raw;}
 let size=0,chunks=[];for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>4096)throw Error('BODY_TOO_LARGE');chunks.push(Buffer.from(chunk));}return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
module.exports={send,readBody};
