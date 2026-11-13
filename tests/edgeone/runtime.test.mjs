import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const req=createRequire(path.join(root,'package.json'));
const sharp=req('sharp'),{PDFDocument}=req('pdf-lib');
const card=(await import('../../cloud-functions/api/card.js')).default;
const exp=(await import('../../cloud-functions/api/export.js')).default;
function request(handler,method,url,body){return handler({request:new Request('https://shunlu.example'+url,{method,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})})});}

test('metadata and request validation preserve template demo behavior',async()=>{
 for(let i=1;i<=12;i++){const r=await request(card,'GET','/api/card?id=A'+String(i).padStart(2,'0'));assert.equal(r.status,200);assert.equal((await r.json()).model_call_made,false);}
 assert.equal((await request(card,'POST','/api/card')).status,405);
 assert.equal((await request(card,'GET','/api/card?id=../../A01')).status,400);
 assert.equal((await request(card,'GET','/api/card?id=A01&scenario=error')).status,503);
 for(const body of ['{',[],null,{id:'A13',format:'share'},{id:'A01',format:'bad'},{id:'A01',format:'share',note:'好'.repeat(41)},{id:'A01',format:'share',note:'\u0000'}])assert.equal((await request(exp,'POST','/api/export',body)).status,400);
 assert.equal((await request(exp,'POST','/api/export','x'.repeat(4097))).status,413);
 assert.equal((await request(exp,'GET','/api/export')).status,405);
});
test('three real binary exports retain dimensions, print boxes and Chinese note',async()=>{
 fs.mkdirSync(path.join(root,'work'),{recursive:true});
 const out=fs.mkdtempSync(path.join(root,'work/export-check-'));
 for(const format of ['share','wallpaper','print']){
  const note='今天把香气留给朋友，顺路带走麦香。';
  const r=await request(exp,'POST','/api/export',{id:'A01',format,note});assert.equal(r.status,200);
  const bytes=Buffer.from(await r.arrayBuffer());assert(bytes.length>10000&&bytes.length<4500000);
  fs.writeFileSync(path.join(out,'A01-'+format+(format==='print'?'.pdf':'.png')),bytes);
  if(format==='print'){assert.equal(r.headers.get('content-type'),'application/pdf');const pdf=await PDFDocument.load(bytes);const p=pdf.getPage(0);assert.equal(pdf.getPageCount(),1);assert(Math.abs(p.getTrimBox().width-100*72/25.4)<.001);}
  else {const m=await sharp(bytes).metadata();assert.equal(m.width,1080);assert.equal(m.height,format==='share'?1440:1920);const blank=await request(exp,'POST','/api/export',{id:'A01',format});assert(!bytes.equals(Buffer.from(await blank.arrayBuffer())),'note must affect pixels');}
 }
 console.log('Export evidence:',out);
});
