import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {mediaRefs} from './layout-media.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const wardrobe=read('public/data/wardrobe.json'),raw=read('research/board-live.json'),board=read('public/data/board.json');
const listIds=new Set(raw.lists.filter(l=>['Cosmetics','Faces (both genders)'].includes(l.name)).map(l=>l.id));
const cards=raw.cards.filter(c=>listIds.has(c.idList)&&c.attachments.length),sourceById=new Map(cards.map(c=>[c.shortLink,c]));
assert.equal(wardrobe.source,'https://trello.com/b/v3WatB1P');
assert.equal(wardrobe.checkedAt,board.checkedAt);
assert.equal(wardrobe.sourceSHA256,crypto.createHash('sha256').update(fs.readFileSync('research/board-live.json')).digest('hex'));
assert.equal(wardrobe.stats.sourceCards,cards.length);
assert.equal(wardrobe.stats.items,wardrobe.items.length);
assert.equal(wardrobe.stats.sourceMedia,cards.reduce((n,c)=>n+c.attachments.length,0));
assert.equal(new Set(wardrobe.items.map(i=>i.id)).size,wardrobe.items.length,'Stable IDs collide');
const all=new Set();
for(const item of wardrobe.items){
 const card=sourceById.get(item.sourceCardId),rendered=board.cards.find(c=>c.id===item.sourceCardId);
 assert.ok(card,'Nonofficial card in wardrobe '+item.id);
 assert.equal(item.sourceURL,card.shortUrl);
 assert.ok(['制服','发型','面部','配饰','滑板','终结动作'].includes(item.category));
 assert.ok(['男性','女性','通用','未标注'].includes(item.gender));
 assert.ok(['current','limited','archived'].includes(item.availability));
 assert.ok(item.media.length,'Empty gallery '+item.id);
 if(item.kind==='gallery')assert.equal(item.name,null,'Gallery masquerades as named item');
 if(item.kind==='gallery')assert.ok(item.sourceGroup,'Source gallery group missing '+item.id);
 if(item.name)assert.ok(item.name.length<95&&!/%/.test(item.name),'Probability prose used as item name');
 let plain=card.desc;for(const ref of [...mediaRefs(card.desc)].reverse())plain=plain.slice(0,ref.index)+plain.slice(ref.end);
 for(const id of item.assetIds){assert.match(id,/^\d{11,16}$/);assert.ok(plain.includes(id),'Asset ID is absent from source prose '+id);}
 for(const media of item.media){
  const original=rendered.attachments.find(a=>a.id===media.id);assert.ok(original,'Media from another card '+media.id);
  assert.equal(media.url,original.url);assert.match(media.url,/^https:\/\/trello\.com\//);
  assert.equal(media.local,original.local);assert.equal(media.videoLocal,original.videoLocal);
  for(const key of ['local','posterLocal','videoLocal'])if(media[key])assert.ok(fs.existsSync('public/'+media[key]),'Missing official media '+media[key]);
  assert.ok(media.local||media.videoLocal,'No usable preview '+media.id);all.add(media.id);
 }
}
for(const card of cards){
 const included=new Set(wardrobe.items.filter(i=>i.sourceCardId===card.shortLink).flatMap(i=>i.media.map(a=>a.id)));
 for(const a of card.attachments)assert.ok(included.has(a.id),'Dropped source attachment '+card.shortLink+' '+a.id);
 for(const ref of mediaRefs(card.desc))assert.ok(included.has(ref.id),'Dropped source prose image '+card.shortLink+' '+ref.id);
}
assert.equal(wardrobe.stats.media,all.size);
assert.equal(wardrobe.stats.galleries,wardrobe.items.filter(i=>i.kind==='gallery').length);
const byMedia=id=>wardrobe.items.find(i=>i.media.some(a=>a.id===id));
const soft=byMedia('6af8d1f2345a2dbaebfca1c6');
assert.match(soft.name,/柔和脸/);assert.deepEqual(soft.assetIds,['75028497774945']);assert.equal(soft.gender,'女性');assert.equal(soft.rarity,'传说');
const black=byMedia('6af8d3bc18bb4ee15b7c57dd');assert.match(black.name,/黑色西装/);assert.equal(black.rarity,'稀有');assert.equal(black.gender,'男性');
const collar=byMedia('6af8d4ddcc9ab7f84253cc03');assert.match(collar.name,/敞领/);assert.equal(collar.rarity,'稀有');assert.equal(collar.gender,'女性');
for(const elite of wardrobe.items.filter(i=>i.name?.startsWith('精英（')))assert.equal(elite.rarity,'隐藏','Previous rarity heading leaked into hidden section');
const mogger=wardrobe.items.find(i=>i.sourceCardId==='cwA4JuN7'&&i.assetIds.includes('84805184855387'));assert.equal(mogger.rarity,null,'Chance was converted into unsupported rarity');assert.equal(mogger.chance,'1%');
const lonecat=wardrobe.items.find(i=>i.name?.startsWith('独猫（'));assert.equal(lonecat.media.length,2,'Named multiview item was split');
const europeanHair=wardrobe.items.find(i=>i.sourceCardId==='uT6J4Bmq'&&i.slot==='欧洲裔发型');assert.equal(europeanHair.kind,'gallery');assert.equal(europeanHair.name,null);assert.equal(europeanHair.media.length,3);
assert.equal(europeanHair.sourceGroup,'欧洲裔');assert.equal(europeanHair.ethnicity,'欧洲裔');
for(const sourceCardId of ['uT6J4Bmq','MwwGjyDp']){
 const hair=wardrobe.items.filter(i=>i.sourceCardId===sourceCardId);
 assert.equal(hair.length,7,'Hair source groups were merged or split');
 assert.deepEqual(new Set(hair.filter(i=>i.ethnicity).map(i=>i.ethnicity)),new Set(['欧洲裔','日本裔','印度裔','中东裔','非洲裔','拉丁裔']));
 const spare=hair.find(i=>i.sourceGroup==='其他配图');assert.ok(spare);assert.equal(spare.ethnicity,undefined,'Unreferenced spare gallery acquired an unsupported ethnicity');
 for(const i of hair.filter(i=>i.ethnicity))assert.equal(i.sourceGroup,i.ethnicity);
}
console.log(JSON.stringify({sourceCards:cards.length,entries:wardrobe.items.length,namedItems:wardrobe.stats.namedItems,galleries:wardrobe.stats.galleries,sourceMedia:wardrobe.stats.sourceMedia,media:all.size,assetIds:wardrobe.stats.assetIds,sourceCoverage:'complete',metadata:'source-backed'}));
