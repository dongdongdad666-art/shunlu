const fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),dest=path.join(root,'dist');
if(fs.existsSync(dest))throw Error('dist exists; build in a fresh checkout');
const base=new URL(process.env.ASSET_BASE_URL||'');
if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('ASSET_BASE_URL must be an HTTPS directory');
if(!base.pathname.endsWith('/'))base.pathname+='/';
const mappings=JSON.parse(fs.readFileSync(path.join(root,'media-manifest.json'),'utf8'));
const replacements=mappings.map(m=>{if(!/^\/files\//.test(m.local)||!/^brand-film-[a-f0-9]{16}\.mp4$/.test(m.key))throw Error('Invalid media mapping');return{...m,url:new URL(m.key,base).href,hits:0};});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.isSymbolicLink()||e.name.startsWith('.'))throw Error('Unexpected file');return e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)];});}
const files=walk(path.join(root,'public'));if(files.length>20000)throw Error('Too many files');
for(const file of files){let data=fs.readFileSync(file);if(data.length>=25000000)throw Error('Oversized static file');
 if(/\.(html|json|js|mjs|css)$/.test(file)){let text=data.toString('utf8');for(const m of replacements)for(const needle of new Set([m.local,encodeURI(m.local)])){const n=text.split(needle).length-1;m.hits+=n;text=text.replaceAll(needle,m.url);}data=Buffer.from(text);}
 const target=path.join(dest,path.relative(path.join(root,'public'),file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data,{flag:'wx'});
}
for(const m of replacements)if(!m.hits)throw Error('Unreferenced media mapping: '+m.local);
console.log(JSON.stringify({files:files.length,externalMedia:replacements.map(({key,hits})=>({key,hits}))},null,2));
