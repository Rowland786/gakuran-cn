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
console.log(JSON.stringify({articles:articles.length,styles:articles.filter(a=>a.category==='战斗风格').length,sourceCards:index.length,translatedSourceCards:used.size}));
