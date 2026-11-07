import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import sharp from 'sharp';
const board=JSON.parse(fs.readFileSync('research/board-live.json','utf8'));
const assets=JSON.parse(fs.readFileSync('research/board-attachments.json','utf8'));
const out=path.resolve('public/board-videos'),cache=path.resolve('../raw-board-assets');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});
const queue=board.cards.flatMap(c=>c.attachments.filter(a=>a.mimeType==='image/gif').map(a=>({card:c.shortLink,attachment:a})));
const total=queue.length,records={},failed=[];
let done=0;
function run(binary,args){return new Promise((resolve,reject)=>{const p=spawn(binary,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',error='';p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>error+=d);p.on('error',reject);p.on('close',code=>code===0?resolve(output):reject(Error(error.slice(-1500))));});}
async function worker(){while(queue.length){const {card,attachment:a}=queue.shift();try{const media=assets.attachments[a.id];const stem=path.basename(media.local,path.extname(media.local));const input=path.join(cache,stem+'.gif');const video=path.join(out,stem+'.mp4'),poster=path.join(out,stem+'.jpg');if(!fs.existsSync(input)){const r=await fetch(a.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('GIF HTTP '+r.status);fs.writeFileSync(input,Buffer.from(await r.arrayBuffer()));}
 if(!fs.existsSync(video))await run('ffmpeg',['-hide_banner','-loglevel','error','-ignore_loop','1','-i',input,'-an','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-threads','2','-fps_mode','vfr','-movflags','+faststart','-y',video]);
 if(!fs.existsSync(poster))await sharp(fs.readFileSync(input)).resize({width:720,withoutEnlargement:true}).jpeg({quality:82}).toFile(poster);
 const sourceMeta=await sharp(fs.readFileSync(input),{animated:true,limitInputPixels:false}).metadata();const sourceDuration=(sourceMeta.delay||[]).reduce((n,d)=>n+d,0)/1000;
 const probe=async()=>JSON.parse(await run('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height:format=duration','-of','json',video]));
 let info=await probe();
 if(sourceDuration&&Math.abs(sourceDuration-Number(info.format.duration))>0.15){await run('ffmpeg',['-hide_banner','-loglevel','error','-ignore_loop','1','-i',input,'-an','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2,tpad=stop_mode=clone:stop_duration=1,fps=30','-t',String(sourceDuration),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart','-y',video]);info=await probe();}
 const stream=info.streams[0],duration=Number(info.format.duration);if(stream.codec_name!=='h264'||!duration||!stream.width||!stream.height||Math.abs(duration-sourceDuration)>0.15)throw Error('Invalid video or timing');
 records[a.id]={id:a.id,card,videoLocal:'board-videos/'+path.basename(video),posterLocal:'board-videos/'+path.basename(poster),duration,sourceDuration,width:stream.width,height:stream.height,mime:'video/mp4',sourceURL:a.url};done++;if(done%25===0)console.log(JSON.stringify({done,total}));
 }catch(e){failed.push({id:a.id,card,error:e.message});}}}
await Promise.all(Array.from({length:4},worker));
fs.writeFileSync('research/board-demos.json',JSON.stringify({records,failed},null,2));
console.log(JSON.stringify({done,total,failed:failed.length,examples:failed.slice(0,3)}));
if(failed.length)process.exitCode=1;
