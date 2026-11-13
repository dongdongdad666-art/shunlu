const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../server-assets');
process.env.FONTCONFIG_FILE=path.join(assets,'fonts/fonts.conf');
const sharp=require('sharp'),{PDFDocument}=require('pdf-lib');
const cards=JSON.parse(fs.readFileSync(path.join(assets,'cards.json'),'utf8'));
const byId=Object.fromEntries(cards.map(card=>[card.id,card]));
const escape=s=>s.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_BODY');
 if(typeof value.id!=='string'||!Object.hasOwn(byId,value.id))throw Error('UNKNOWN_CARD');
 if(!['share','wallpaper','print'].includes(value.format))throw Error('INVALID_FORMAT');
 const note=value.note===undefined?'':value.note;
 if(typeof note!=='string'||Array.from(note).length>40||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note))throw Error('INVALID_NOTE');
 return{...value,note:note.replace(/[\r\n]/g,' ')};
}
async function exportCard(id,format,note=''){
 ({id,format,note}=validate({id,format,note}));let bytes;
 if(note){
  const h={share:1440,wallpaper:1920,print:1598.4}[format];
  const chars=Array.from('“'+note+'”'),lines=[chars.slice(0,31).join(''),chars.slice(31).join('')].filter(Boolean);
  const overlay='<g><rect x="72" y="'+(h-173)+'" width="936" height="110" fill="#EFE8D5"/>'+lines.map((line,i)=>'<text x="72" y="'+(h-132+i*39)+'" font-family="Noto Sans SC" font-weight="400" font-size="28" fill="#234E43">'+escape(line)+'</text>').join('')+'</g>';
  const width=format==='print'?1200:1080,height=format==='print'?1776:h;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 1080 '+h+'">'+overlay+'</svg>';
  const raster=sharp(path.join(assets,id+'-'+format+(format==='print'?'.jpg':'.webp'))).composite([{input:Buffer.from(svg)}]);
  bytes=await(format==='print'?raster.jpeg({quality:94}):raster.png()).toBuffer();
 }else bytes=format==='print'?fs.readFileSync(path.join(assets,id+'-print.jpg')):await sharp(path.join(assets,id+'-'+format+'.webp')).png().toBuffer();
 if(format==='print'){
  const pdf=await PDFDocument.create(),mm=72/25.4,page=pdf.addPage([106*mm,154*mm]),image=await pdf.embedJpg(bytes);
  page.drawImage(image,{x:8*mm,y:10.4*mm,width:90*mm,height:133.2*mm});page.setTrimBox(3*mm,3*mm,100*mm,148*mm);page.setBleedBox(0,0,106*mm,154*mm);pdf.setTitle('SHUNLU '+id+' DEMO print proof');
  return{bytes:Buffer.from(await pdf.save()),type:'application/pdf',ext:'pdf'};
 }
 return{bytes,type:'image/png',ext:'png'};
}
module.exports={cards,byId,exportCard,validate};
