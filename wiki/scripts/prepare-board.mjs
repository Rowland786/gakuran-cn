import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=process.argv.includes('--draft');
const board=read('research/board-live.json'),assets=read('research/board-attachments.json');
const demos=read('research/board-demos.json').records;
const articles=read('public/data/wiki.json').articles;
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
const listNames={Information:'游戏指南',Combat:'战斗机制','Fighting Styles':'战斗风格',Stats:'角色属性',Names:'姓名',Cosmetics:'装扮','Faces (both genders)':'面部',Features:'生活系统',Clubs:'社团',Sports:'运动',Phone:'手机',Locations:'地点','Private Servers':'私服',Updates:'更新日志',Credits:'制作名单'};
const articleMap=Object.fromEntries(articles.map(a=>[a.id,a.sources[0]?.url.match(/trello\.com\/c\/([^/]+)/)?.[1]]).filter(x=>x[1]));
const styleMap=new Map(articles.filter(a=>a.id.startsWith('style-')&&a.id!=='style-rarity').map(a=>[articleMap[a.id],a]));
const allImagePaths=new Set(Object.values(assets.attachments).filter(a=>a.local).map(a=>a.local));
function insertDemos(original,translated,attachments){
 const sourceHeads=[...original.matchAll(/^#{1,6}\s+(.+)$/gm)];
 const translatedHeads=[...translated.matchAll(/^#{1,6}\s+(.+)$/gm)];
 const inserts=new Map();
 let number=0;
 for(const a of attachments.filter(a=>a.videoLocal)){
  number++;a.label=/m1/i.test(a.name)?'轻击连段':/m2/i.test(a.name)?'重击':'演示 '+number;
  const image=[...original.matchAll(/!\[[^\]]*\]\([^)]*\)/g)].find(m=>m[0].includes(a.id));
  if(!image)continue;
  let headIndex=-1;for(let i=0;i<sourceHeads.length;i++)if(sourceHeads[i].index<image.index)headIndex=i;
  if(headIndex<0)continue;
  const sourceLabel=sourceHeads[headIndex][1].replace(/[*:]/g,'').trim();
  let targetIndex=sourceHeads.length===translatedHeads.length?headIndex:-1;
  if(targetIndex<0){const pattern=/m1|light|combo/i.test(sourceLabel)?/轻击|M1/:/m2|heavy/i.test(sourceLabel)?/重击|M2/:/perk/i.test(sourceLabel)?/天赋/:null;if(pattern)targetIndex=translatedHeads.findIndex(h=>pattern.test(h[1]));}
  if(targetIndex<0)continue;
  a.label=translatedHeads[targetIndex][1].replace(/[*:]/g,'').trim();a.inline=true;
  const position=translatedHeads[targetIndex+1]?.index??translated.length;
  inserts.set(position,(inserts.get(position)||'')+`\n\n[[demo:${a.id}]]\n\n`);
 }
 let body=translated;for(const [position,text] of [...inserts].sort((a,b)=>b[0]-a[0]))body=body.slice(0,position)+text+body.slice(position);
 return body;
}
const cards=[...board.cards].sort((a,b)=>a.pos-b.pos).map(c=>{
 const tr=translations[c.shortLink],style=styleMap.get(c.shortLink);
 const p=style?perks[style.id]:null;
 if(p&&style.id in notes)p.notes=notes[style.id];
 const cover=assets.attachments[c.cover?.idAttachment]?.local;
 const attachments=c.attachments.map(a=>({...assets.attachments[a.id]||{id:a.id,name:a.name,url:a.url,type:'link'},...(demos[a.id]?{...demos[a.id],type:'video'}:{})}));
 const separator=/^[-_\s]{3,}$/.test(c.name);
 const withMedia=insertDemos(c.desc,tr?.body||'',attachments);
 const mediaLines=withMedia.split('\n');
 const cleaned=mediaLines.filter((line,i)=>{if(!/^#{1,6}\s/.test(line))return true;let end=i+1;while(end<mediaLines.length&&!/^#{1,6}\s/.test(mediaLines[end]))end++;return mediaLines.slice(i+1,end).join('\n').replace(/[\s\u200c]/g,'').length>0}).join('\n');
 const body=cleaned.trim()?cleaned:(tr?.body||'');
 const result={id:c.shortLink,title:style?.title||tr?.title||c.name,english:c.name,listId:c.idList,body,original:c.desc,source:c.shortUrl,closed:!!c.closed,separator,cover:cover||null,coverColor:c.cover?.color||null,coverSize:c.cover?.size||'normal',attachments,perks:p?.perks||[],notes:p?.notes||[],articleId:style?.id||null,updated:c.dateLastActivity};
 if(result.id==='kBzBnqqM')result.notes=result.notes.map(n=>n.includes('失败惩罚')?'原卡正文写明：重击落空会令自己倒地。':n);
 return result;
});
for(const c of cards){if(!c.title)throw Error('Missing title '+c.id);if(!draft&&c.original.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/[\s‌#*_>~-]/g,'').length&&!c.body)throw Error('Missing translated body '+c.id);for(const a of c.attachments)if(a.local&&!fs.existsSync(path.join('public',a.local)))throw Error('Missing attachment '+a.local);}
const data={title:'学乱 Wiki',checkedAt:'2026-11-07',source:'https://trello.com/b/v3WatB1P',background:assets.background,lists:[...board.lists].sort((a,b)=>a.pos-b.pos).map(l=>({id:l.id,title:listNames[l.name]||l.name,closed:!!l.closed})),cards,articleMap,stats:{sourceCards:cards.length,activeCards:cards.filter(c=>!c.closed&&!board.lists.find(l=>l.id===c.listId)?.closed).length,translatedCards:Object.keys(translations).length,attachments:Object.keys(assets.attachments).length,localImages:allImagePaths.size,perks:cards.reduce((n,c)=>n+c.perks.length,0),videos:Object.keys(demos).length}};
fs.writeFileSync('public/data/board.json',JSON.stringify(data));
fs.writeFileSync('public/data/research-report.md',`# 学乱 Wiki 资料说明\n\n同步日期：2026-11-07。\n\n来源：https://trello.com/b/v3WatB1P 。直接读取公开 JSON，保留 ${cards.length} 张卡片、19 个分类及 1,630 个附件记录；默认显示13个未归档分类和236张未归档卡片，归档数据通过开关查看。\n\n中文译文按原卡逐项对应，天赋图另译 ${data.stats.perks} 项具名效果。数值、条件、版本和原卡图文差异分别保留；兑换码和数值未在游戏内实测。姓名、歌曲、代码和资产 ID 保留原拼写。纯图片或视频内容保留附件；未把未识别的图片文字冒充已翻译。\n\n${allImagePaths.size} 个附件预览已本地保存，原始文件链接仍指向 Trello。背景图来自原看板，游戏图片与资料归原权利人，本站提供非官方中文翻译。187个动态演示另转为MP4，保留原始时序，在对应说明下直接播放；不再展示英文原文折叠区。\n\n衣柜原作者 Kaglorn：https://kaglorn.github.io/gakuran-clothes/ ，仓库：https://github.com/Kaglorn/gakuran-clothes 。图鉴快照 2026-10-21，共1,097项，原图及来源保持。\n\n所有界面资源与数据由本站提供；公开部署采用 GitHub Pages。国内各网络可用性需单独实测。\n`);
console.log(JSON.stringify({...data.stats,missing:missing.length,draft}));
