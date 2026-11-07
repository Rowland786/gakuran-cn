import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const packs=['mechanics.json','styles.json','life-extra.json'].map(f=>read('research/'+f));
const articles=packs.flatMap(p=>p.articles);
const ids=new Set();
for(const a of articles){
 if(ids.has(a.id))throw Error('Duplicate article '+a.id);
 ids.add(a.id);
 if(!a.title||!a.sections.length||!a.sources.length)throw Error('Incomplete article '+a.id);
 for(const s of a.sources)if(!s.url.startsWith('https://trello.com/c/'))throw Error('Non-card source '+s.url);
 if(a.image&&!fs.existsSync(path.join(root,'public',a.image)))throw Error('Missing image '+a.image);
 if(a.images){a.images=a.images.map(im=>typeof im==='string'?im:im.src||im.file);for(const im of a.images)if(!im||!fs.existsSync(path.join(root,'public',im)))throw Error('Missing gallery image '+im);}
}
const board=read('research/board-mechanics.json');
const used=new Set(articles.flatMap(a=>a.sources.map(s=>s.url.match(/trello\.com\/c\/([^/]+)/)?.[1])));
const index=board.cards.map(c=>({title:c.name,category:board.lists.find(l=>l.id===c.idList)?.name||'Unsorted',url:c.shortUrl,updated:c.dateLastActivity,translated:used.has(c.shortLink)}));
fs.writeFileSync('public/data/wiki.json',JSON.stringify({checkedAt:'2026-11-07',articles},null,2));
fs.writeFileSync('public/data/source-index.json',JSON.stringify(index,null,2));
const catalog=read('public/data/catalog.json');
for(const c of catalog)for(const p of [c.local_file,c.thumbnail])if(!fs.existsSync(path.join(root,'public',p.replace(/^\//,''))))throw Error('Missing cosmetic '+p);
fs.writeFileSync('public/data/research-report.md',`# 学乱档案室资料说明\n\n资料核对日期：2026-11-07（北京时间）。\n\n本次抓取官方 Trello 294 张卡片，整理 ${articles.length} 篇中文词条；${used.size} 张不同来源卡片有对应中文整理。来源索引完整列出 294 张卡片，不代表所有卡片均已全文翻译。\n\n优先顺序：官方 Roblox 页面用于游戏身份和简介；官方 Trello 具体卡片用于机制；新更新公告与旧单卡冲突时分别说明。外部 Wiki 和搜索结果仅用于发现入口，不据此声称游戏实测。未获取的私人 Discord 频道、付费内容与登录后内容不属于本次覆盖。\n\n官方公开资料存在手机手柄按键、重击冷却、姓氏总数、部分风格天赋文字与图片的差异，详见各词条。兑换码仅表示本次官方卡片列出，没有游戏内兑换验证。万圣节卡写活动至 11 月 8 日但未给时区，糖果获取已关闭，保留此时间边界。\n\n图鉴原作者 Kaglorn：https://kaglorn.github.io/gakuran-clothes/ ，仓库 https://github.com/Kaglorn/gakuran-clothes 。图鉴采集于 2026-10-21，共 1,097 项、10 分类、4 GIF。原字段与本地原图保持；正文没有名称的项目不虚构文本名称。\n\n中文说明、原创校园氛围插画和网站界面由本站制作。插画使用内置 ImageGen 生成，提示为“2007 年日本雨后校园街区，表现性油画与纸张肌理，青绿暗色和铁锈橙夕照，无人物、文字或标志”，不代表游戏实景。\n\n本站所有展示用脚本、样式、图像、数据均随站点部署，无运行时第三方字体、CDN或统计请求。外部来源链接仍需访问原服务。清除浏览器站点数据会移除个人收藏和任务记录。\n\n维护：在 research 目录保存新的来源快照与中文条目，执行 node scripts/prepare-content.mjs，再运行构建和校验。当前没有后台协作编辑、自动更新或举报代投服务。\n\n部署状态与中国大陆公网可用性必须分别核验；私人预览或海外托管上线不能证明中国大陆稳定访问。\n`);
console.log(JSON.stringify({articles:articles.length,styles:articles.filter(a=>a.category==='战斗风格').length,sourceCards:index.length,translatedSourceCards:used.size,cosmetics:catalog.length,imagesVerified:catalog.length*2}));
