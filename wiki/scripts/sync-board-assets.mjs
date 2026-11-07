import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const board=JSON.parse(fs.readFileSync(root+'/research/board-live.json','utf8'));
const dest=root+'/public/board-assets';fs.mkdirSync(dest,{recursive:true});
const jobs=new Map(),attachments={};
for(const c of board.cards)for(const a of c.attachments){
 const isImage=(a.mimeType||'').startsWith('image/')||/\.(png|webp|jpg|jpeg|gif)(\?|$)/i.test(a.url);
 const previews=[...(a.previews||[])].sort((a,b)=>b.width-a.width);
 const preview=previews.find(p=>p.width<=1280)||previews.at(-1);
 if(!isImage&&!preview){attachments[a.id]={id:a.id,name:a.name,url:a.url,type:'link',bytes:a.bytes||0};continue;}
 const url=preview?.url||a.url;
 const ext=/\.(webp|png|jpe?g|gif)(?:\?|$)/i.exec(url)?.[1]||'webp';
 const file=crypto.createHash('sha256').update(url).digest('hex').slice(0,24)+'.'+ext;
 attachments[a.id]={id:a.id,name:a.name,url:a.url,type:isImage?'image':'video',local:'board-assets/'+file,width:preview?.width||null,height:preview?.height||null,bytes:a.bytes||0};
 jobs.set(file,{file,url});
}
const bg=board.prefs.backgroundImageScaled?.find(p=>p.width===1920)?.url||board.prefs.backgroundImage;
if(bg)jobs.set('board-background.webp',{file:'board-background.webp',url:bg});
console.log(JSON.stringify({cards:board.cards.length,activeCards:board.cards.filter(c=>!c.closed&&!board.lists.find(l=>l.id===c.idList)?.closed).length,lists:board.lists.filter(l=>!l.closed).map(l=>({name:l.name,id:l.id})),attachments:Object.keys(attachments).length,uniqueImages:jobs.size}));
let done=0,failed=[];const queue=[...jobs.values()];
async function worker(){while(queue.length){const job=queue.shift();const p=dest+'/'+job.file;const optimized=p.replace(/\.(gif|png)$/i,'.webp');if((fs.existsSync(p)&&fs.statSync(p).size>0)||(optimized!==p&&fs.existsSync(optimized))){done++;continue}try{const r=await fetch(job.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);if(!(r.headers.get('content-type')||'').startsWith('image/'))throw Error('not image');const bytes=Buffer.from(await r.arrayBuffer());fs.writeFileSync(p,bytes);done++;if(done%100===0)console.log(JSON.stringify({done,total:jobs.size}));}catch(e){failed.push({file:job.file,url:job.url,error:e.message});}}}
await Promise.all(Array.from({length:10},worker));
for(const a of Object.values(attachments))if(a.local&&!fs.existsSync(root+'/public/'+a.local)){const optimized=a.local.replace(/\.(gif|png)$/i,'.webp');if(fs.existsSync(root+'/public/'+optimized))a.local=optimized;else{a.local=null;a.unavailable=true;}}
fs.writeFileSync(root+'/research/board-attachments.json',JSON.stringify({background:'board-assets/board-background.webp',attachments,failed},null,2));
console.log(JSON.stringify({done,total:jobs.size,failed:failed.length,failedItems:failed.slice(0,8)}));
