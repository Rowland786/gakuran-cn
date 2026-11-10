import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {placeMedia} from './layout-media.mjs';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=process.argv.includes('--draft');
const board=read('research/board-live.json'),assets=read('research/board-attachments.json');
const demos=read('research/board-demos.json').records;
const embedded=read('research/board-embedded.json').records;
const mediaLayout=read('research/media-layout.json').cards;
const sync=read('research/board-sync.json'),annotations=read('research/board-annotations.json').cards;
if(crypto.createHash('sha256').update(fs.readFileSync('research/board-live.json')).digest('hex')!==sync.sourceSHA256)throw Error('Source snapshot does not match sync record');
const articles=read('public/data/wiki.json').articles;
const awakening=read('research/awakening-quests.json');
const awakeningSource=board.cards.find(c=>c.shortLink===awakening.sourceCard);
if(!awakeningSource||crypto.createHash('sha256').update(JSON.stringify({name:awakeningSource.name,desc:awakeningSource.desc})).digest('hex')!==awakening.sourceHash)throw Error('Awakening source changed; review quest conditions');
if(crypto.createHash('sha256').update(fs.readFileSync(path.join('public',awakening.reference.local))).digest('hex')!==awakening.reference.sha256)throw Error('Awakening reference changed');
const translations={};
for(let n=1;n<=3;n++){const p=`research/board-zh-${n}.json`;if(fs.existsSync(p))Object.assign(translations,read(p).cards);else if(!draft)throw Error('Missing translation pack '+n);}
const perks={...read('research/perks-a.json').byArticle,...read('research/perks-b.json').byArticle};
const notes={
 'style-perfect-copy':[],
 'style-jin':[],
 'style-mishima':['Consistency 天赋图未标明减速比例；战斗天赋卡正文将减速写为50%。'],
 'style-cqc':['v13更新为CQC V2的反击加入摔击收尾。'],
 'style-ali':['v13更新后，闪避重击使用独立冷却，且不能再与普通重击连锁。'],
 'style-wingchun':['v13更新后，成功触发反击时，反击连段全程具有无敌帧。','快手天赋的基础截图写6%，战斗天赋卡正文写8%，两处数值不同。'],
 'style-dragon':['Heat Mode 原图未标明增伤倍率和持续时间。'],
 'style-kyokushin-karate':[],
 'style-capoeira':[],
 'style-wrestling':['v13使脑震荡持续时间缩短30%；原图未给出固定秒数。'],
 'style-hakari':['Momentum Rush 天赋图写连续3次轻击触发，觉醒任务卡写连续4次干净轻击，保留两处原文差异。'],
 'style-kure':['Last Stand 原图的触发条件为生命值低于25%。','v13为吴V2增加抓取后举起砸地的动作。'],
 'style-jason':['原卡未列出具名天赋，重击描述和演示见正文及附件。'],
 'style-scarecrow':['原卡提到完整轻击连段有额外奖励，但未给出奖励名称和数值。'],
 'style-boxing':['Untouchable截图写为重击全程具有无敌帧；v13增加了无敌帧生效前摇。','旧卡的重击冷却为7秒，v13已提高到9秒，并增加重击打空后的自身眩晕。v13还说明，V2重击连打不再穿透格挡。']
};
const missing=board.cards.filter(c=>!translations[c.shortLink]);
if(missing.length&&!draft)throw Error('Untranslated cards: '+missing.map(c=>c.shortLink).join(','));
const stale=board.cards.filter(c=>translations[c.shortLink]?.sourceHash!==crypto.createHash('sha256').update(JSON.stringify({name:c.name,desc:c.desc})).digest('hex'));
if(stale.length&&!draft)throw Error('Stale translations: '+stale.map(c=>c.shortLink).join(','));
const listNames={Information:'游戏指南',Combat:'战斗机制','Fighting Styles':'战斗风格',Stats:'角色属性',Names:'姓名',Cosmetics:'装扮','Faces (both genders)':'面部',Features:'生活系统',Clubs:'社团',Sports:'运动',Phone:'手机',Locations:'地点','Private Servers':'私服',Updates:'更新日志',Credits:'制作名单'};
const articleMap=Object.fromEntries(articles.map(a=>[a.id,a.sources[0]?.url.match(/trello\.com\/c\/([^/]+)/)?.[1]]).filter(x=>x[1]));
const styleMap=new Map(articles.filter(a=>a.id.startsWith('style-')&&a.id!=='style-rarity').map(a=>[articleMap[a.id],a]));
const awakeningFlows=Object.entries(awakening.byArticle).map(([articleId,flow])=>{const style=articles.find(a=>a.id===articleId);if(!style||!articleMap[articleId])throw Error('Unknown awakening style '+articleId);if(flow.stages.length!==0&&flow.stages.length!==3)throw Error('Incomplete awakening stages '+articleId);const media=(flow.mediaIds||[]).map(id=>{const a=assets.attachments[id]||embedded[id];if(!a)throw Error('Unknown flow media '+id);return {...a,...(demos[id]?{...demos[id],type:'video'}:{}),label:style.title+(demos[id]?' · 觉醒重击':' · 觉醒配图')};});return {...flow,articleId,cardId:articleMap[articleId],title:style.title,media};});
const allImagePaths=new Set([...Object.values(assets.attachments),...Object.values(embedded)].filter(a=>a.local).map(a=>a.local));
const cards=[...board.cards].sort((a,b)=>a.pos-b.pos).map(c=>{
 const tr=translations[c.shortLink],style=styleMap.get(c.shortLink);
 const p=style?perks[style.id]:null;
 if(p&&style.id in notes)p.notes=notes[style.id];
 const cover=assets.attachments[c.cover?.idAttachment]?.local;
 const attachments=c.attachments.map(a=>({...assets.attachments[a.id]||{id:a.id,name:a.name,url:a.url,type:'link'},...(demos[a.id]?{...demos[a.id],type:'video'}:{})}));
 for(const match of c.desc.matchAll(/!\[[^\]]*\]\((https:\/\/trello\.com\/[^)]+)\)/g)){const id=/\/attachments\/([a-f0-9]+)/.exec(match[1])?.[1];if(id&&!attachments.some(a=>a.id===id)){const a=embedded[id];if(!a)throw Error('Unresolved embedded attachment '+id);attachments.push({...a,...(demos[id]?{...demos[id],type:'video'}:{})});}}
 if(c.shortLink===awakening.sourceCard)for(const a of attachments){const names={kure:'吴',slugger:'重拳手',kickboxing:'踢拳',striker:'突击者',kyokushin:'极真空手道',cqc:'近身格斗'};for(const [key,name] of Object.entries(names))if(a.videoLocal&&a.name.toLowerCase().startsWith(key))a.label=name+' · 觉醒重击';}
 const separator=/^[-_\s]{3,}$/.test(c.name);
 const withMedia=tr?.body?.trim()?placeMedia(c.desc,tr.body,attachments,mediaLayout[c.shortLink]||{},style?.title||tr.title).body:tr?.body||'';
 const mediaLines=withMedia.split('\n');
 const cleaned=mediaLines.filter((line,i)=>{if(!/^#{1,6}\s/.test(line))return true;let end=i+1;while(end<mediaLines.length&&!/^#{1,6}\s/.test(mediaLines[end]))end++;return mediaLines.slice(i+1,end).join('\n').replace(/[\s\u200c]/g,'').length>0}).join('\n');
 const body=cleaned.trim()?cleaned:(tr?.body||'');
 const result={id:c.shortLink,title:style?.title||tr?.title||c.name,english:c.name,listId:c.idList,body,original:c.desc,source:c.shortUrl,closed:!!c.closed,separator,cover:cover||null,coverColor:c.cover?.color||null,coverSize:c.cover?.size||'normal',attachments,perks:p?.perks||[],notes:[...(p?.notes||[]),...(annotations[c.shortLink]||[])],articleId:style?.id||null,updated:c.dateLastActivity};
 if(style&&awakening.byArticle[style.id])result.awakening=awakeningFlows.find(f=>f.articleId===style.id);
 if(c.shortLink===awakening.sourceCard)result.awakeningGuide=awakeningFlows;
 if(result.id==='kBzBnqqM')result.notes=result.notes.map(n=>n.includes('失败惩罚')?'原卡正文写明：重击落空会令自己倒地。':n);
 return result;
});
for(const c of cards){if(!c.title)throw Error('Missing title '+c.id);if(!draft&&c.original.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/[\s‌#*_>~-]/g,'').length&&!c.body)throw Error('Missing translated body '+c.id);for(const a of c.attachments)if(a.local&&!fs.existsSync(path.join('public',a.local)))throw Error('Missing attachment '+a.local);}
const data={title:'学乱 Wiki',checkedAt:sync.checkedAt,source:'https://trello.com/b/v3WatB1P',background:assets.background,lists:[...board.lists].sort((a,b)=>a.pos-b.pos).map(l=>({id:l.id,title:listNames[l.name]||l.name,closed:!!l.closed})),cards,articleMap,stats:{sourceCards:cards.length,activeCards:cards.filter(c=>!c.closed&&!board.lists.find(l=>l.id===c.listId)?.closed).length,translatedCards:cards.filter(c=>translations[c.id]).length,attachments:Object.keys(assets.attachments).length,localImages:allImagePaths.size,perks:cards.reduce((n,c)=>n+c.perks.length,0),videos:new Set(cards.flatMap(c=>c.attachments.filter(a=>a.videoLocal).map(a=>a.id))).size}};
fs.writeFileSync('public/data/board.json',JSON.stringify(data));
fs.writeFileSync('public/data/research-report.md',`# 学乱 Wiki 资料说明\n\n同步日期：${sync.checkedAt}。源看板最后活动：${sync.sourceLastActivity}。\n\n来源：https://trello.com/b/v3WatB1P 。读取官方公开JSON，保留${cards.length}张卡片、${data.lists.length}个分类和${data.stats.attachments}个附件记录；默认显示${data.lists.filter(l=>!l.closed).length}个未归档分类及${data.stats.activeCards}张未归档卡片。归档资料可切换查看。\n\n中文正文按卡片对应，天赋图另译${data.stats.perks}项具名效果。本次复核同步了四种新V2的第一阶段、私服管理与运动设置、动物互动和驯养乌鸦，并更新战斗配图与制服图片。官方单卡未随公告修订的身高、抓取和觉醒名单等内容，另列版本说明。数值和兑换码未经游戏内实测。\n\n觉醒总页和各风格页共整理15种三阶段任务，另补入4种新V2的第一阶段，第二、三阶段按原卡空缺标为待补。7种流程另对照维护者提供的任务图；该图未标注版本，踢拳与CQC等和Trello旧正文的差异在流程旁保留，不将其当作已确认的官方统一修订。\n\n${allImagePaths.size}个附件预览与${data.stats.videos}个MP4演示由本站提供。演示保留原始时序，在对应卡片中直接播放；原始附件仍有Trello来源链接。另补入正文跨卡引用的图片与演示；3处原引用链接返回404，保留不可用标记和来源链接。背景图与游戏资料归原权利人。\n\n衣柜原作者Kaglorn：https://kaglorn.github.io/gakuran-clothes/ ，仓库：https://github.com/Kaglorn/gakuran-clothes 。图鉴快照2026-10-21，共1,097项，保留原图和署名。\n\n本站为非官方中文资料库，通过GitHub Pages公开部署。国内各网络可用性需单独实测。\n`);
console.log(JSON.stringify({...data.stats,missing:missing.length,draft}));
