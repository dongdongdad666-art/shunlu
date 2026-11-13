import test from 'node:test';
import assert from 'node:assert/strict';
import {adapt} from '../../src/edgeone/adapter.mjs';

test('preserves URL, headers, streamed bytes and binary response',async()=>{
 const bytes=Uint8Array.from([0,255,1,13,10]);
 const handler=adapt(async(req,res)=>{
  assert.equal(req.url,'/api/export?x=1');assert.equal(req.method,'POST');
  let size=0;for await(const b of req)size+=b.length;assert.equal(size,bytes.length);
  res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="test.pdf"'});res.end(Buffer.from(bytes));
 });
 const r=await handler({request:new Request('https://example.com/api/export?x=1',{method:'POST',body:bytes})});
 assert.equal(r.headers.get('Content-Type'),'application/pdf');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);
});
test('oversize rejection can stop request stream without buffering whole body',async()=>{
 const handler=adapt(async(req,res)=>{let size=0;for await(const b of req){size+=b.length;if(size>4096){res.writeHead(413);res.end('too large');return;}}throw Error('expected oversize');});
 const r=await handler({request:new Request('https://example.com/api/export',{method:'POST',body:'x'.repeat(4097)})});assert.equal(r.status,413);
});
test('platform buffered string bodies are delivered as UTF-8 bytes',async()=>{
 const handler=adapt(async(req,res)=>{const chunks=[];for await(const b of req)chunks.push(b);assert.equal(Buffer.concat(chunks).toString(),'中文留言');res.writeHead(200);res.end('ok');});
 const r=await handler({request:{url:'https://example.com/api/export',method:'POST',headers:new Headers(),body:'中文留言'}});assert.equal(r.status,200);
});
test('platform parsed JSON retains original wire length for legacy validation',async()=>{
 const body={id:'A01',format:'share',note:'中文'};
 const handler=adapt(async(req,res)=>{assert.deepEqual(req.body,body);assert.equal(req.headers['content-length'],'9000');res.writeHead(413);res.end('too large');});
 const r=await handler({request:{url:'https://example.com/api/export',method:'POST',headers:new Headers({'content-length':'9000'}),body}});assert.equal(r.status,413);
});
