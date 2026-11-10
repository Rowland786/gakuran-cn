import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const board=JSON.parse(fs.readFileSync('research/board-live.json','utf8'));
const assets=JSON.parse(fs.readFileSync('research/board-attachments.json','utf8')).attachments;
const priorResult=spawnSync('git',['show','HEAD:research/board-attachments.json'],{encoding:'utf8',maxBuffer:8*1024*1024});
const previous=priorResult.status===0?JSON.parse(priorResult.stdout).attachments:{};
const oldEmbedded=fs.existsSync('research/board-embedded.json')?JSON.parse(fs.readFileSync('research/board-embedded.json','utf8')).records:{};
const jobs=new Map(),records={},failed=[];
for(const card of board.cards)for(const match of card.desc.matchAll(/!\[[^\]]*\]\((https:\/\/trello\.com\/[^)]+)\)/g)){
 const url=match[1],id=/\/attachments\/([a-f0-9]+)/.exec(url)?.[1];if(!id||card.attachments.some(a=>a.id===id))continue;
 jobs.set(id,{id,url});
}
await Promise.all([...jobs.values()].map(async({id,url})=>{
 const existing=assets[id]||oldEmbedded[id]||previous[id];
 if(existing?.local&&fs.existsSync('public/'+existing.local)){records[id]={...existing,embedded:true};return;}
 const file=crypto.createHash('sha256').update(url).digest('hex').slice(0,24)+'.'+(/\.(webp|png|jpe?g|gif)(?:\?|$)/i.exec(url)?.[1]||'webp');
 let error='';for(let attempt=0;attempt<3;attempt++)try{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok){error='HTTP '+r.status;await r.body?.cancel();if(r.status===404||r.status===410)break;throw Error(error);}
  if(!r.headers.get('content-type')?.startsWith('image/'))throw Error('Not an image');const bytes=Buffer.from(await r.arrayBuffer());fs.writeFileSync('public/board-assets/'+file,bytes);records[id]={id,name:'引用图片',url,type:'image',local:'board-assets/'+file,embedded:true};return;
 }catch(e){error=e.message;}
 records[id]={id,name:'引用图片',url,type:'link',unavailable:true,unavailableReason:error,embedded:true};if(!/HTTP (404|410)/.test(error))failed.push({id,error});
}));
fs.writeFileSync('research/board-embedded.json',JSON.stringify({records,failed},null,2));
console.log(JSON.stringify({referenced:jobs.size,local:Object.values(records).filter(r=>r.local).length,unavailable:Object.values(records).filter(r=>r.unavailable).map(r=>({id:r.id,reason:r.unavailableReason})),failed}));
if(failed.length)process.exitCode=1;
