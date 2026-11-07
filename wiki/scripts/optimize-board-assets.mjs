import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
sharp.concurrency(2);
sharp.cache(false);
const folder=path.resolve('public/board-assets');
const cache=path.resolve('../raw-board-assets');
if(!cache.startsWith(path.resolve('..')+path.sep))throw Error('Unexpected cache path');
fs.mkdirSync(cache,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('research/board-attachments.json','utf8'));
const queue=fs.readdirSync(folder).filter(f=>/\.(gif|png)$/i.test(f));
let done=0,before=0,after=0,failed=[];
async function worker(){while(queue.length){const file=queue.shift(),input=path.join(folder,file),output=path.join(folder,file.replace(/\.(gif|png)$/i,'.webp')),raw=path.join(cache,file);if(path.dirname(input)!==folder||path.dirname(output)!==folder||path.dirname(raw)!==cache)throw Error('Unexpected asset path');try{const bytes=fs.readFileSync(input);const old=await sharp(bytes,{animated:true,limitInputPixels:false}).metadata();const oldBytes=bytes.length;if(!fs.existsSync(output))await sharp(bytes,{animated:true,limitInputPixels:false}).resize({width:720,withoutEnlargement:true}).webp({quality:74,effort:3}).toFile(output);const next=await sharp(fs.readFileSync(output),{animated:true,limitInputPixels:false}).metadata();const oldTime=(old.delay||[]).reduce((a,b)=>a+b,0),nextTime=(next.delay||[]).reduce((a,b)=>a+b,0);if((old.pages||1)!==(next.pages||1)&&Math.abs(oldTime-nextTime)>10)throw Error('Animation timing mismatch');for(const a of Object.values(manifest.attachments))if(a.local==='board-assets/'+file)a.local='board-assets/'+path.basename(output);before+=oldBytes;after+=fs.statSync(output).size;fs.renameSync(input,raw);done++;if(done%25===0)console.log(JSON.stringify({done,before,after}));}catch(e){failed.push({file,error:e.message});}}}
await Promise.all(Array.from({length:3},worker));
fs.writeFileSync('research/board-attachments.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({done,before,after,failed:failed.length,examples:failed.slice(0,4)}));
