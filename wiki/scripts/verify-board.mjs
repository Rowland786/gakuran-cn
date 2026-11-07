import fs from 'node:fs';
import assert from 'node:assert/strict';
const b=JSON.parse(fs.readFileSync('public/data/board.json','utf8'));
const raw=JSON.parse(fs.readFileSync('research/board-live.json','utf8'));
assert.equal(b.cards.length,294);assert.equal(b.stats.translatedCards,294);
assert.deepEqual(new Set(b.cards.map(c=>c.id)),new Set(raw.cards.map(c=>c.shortLink)));
assert.equal(b.stats.perks,101);
const perfect=b.cards.find(c=>c.id==='kBzBnqqM');
assert.equal(perfect.perks.length,4);
assert.deepEqual(perfect.perks.map(p=>p.english),['Copycat','Adaption','Master Copy','Perfect Technique']);
const expectedDemos=raw.cards.flatMap(c=>c.attachments.filter(a=>a.mimeType==='image/gif').map(a=>a.id));
const demos=b.cards.flatMap(c=>c.attachments.filter(a=>a.videoLocal));
assert.equal(b.stats.videos,187);
assert.deepEqual(new Set(demos.map(a=>a.id)),new Set(expectedDemos));
for(const c of b.cards){const markers=[...c.body.matchAll(/\[\[demo:([a-f0-9]+)\]\]/g)].map(m=>m[1]);assert.equal(new Set(markers).size,markers.length,'Duplicate inline demo '+c.id);for(const a of c.attachments.filter(a=>a.videoLocal)){assert.equal(markers.includes(a.id),!!a.inline,'Inline demo placement '+a.id);for(const key of ['videoLocal','posterLocal'])assert.ok(fs.existsSync('public/'+a[key]),'Missing demo '+a[key]);assert.ok(Math.abs(a.duration-a.sourceDuration)<=0.15,'Demo timing changed '+a.id);}}
assert.equal(perfect.attachments.filter(a=>a.inline).length,2);
assert.match(perfect.body,/轻击连段[^\n]*\n+\[\[demo:/);
assert.match(perfect.body,/重击[^\n]*\n+\[\[demo:/);
for(const c of b.cards){assert.ok(!/[。！？]/.test(c.title),'Sentence title: '+c.title);assert.ok(!/!\[[^\]]*\]\(/.test(c.body),'Image syntax in translation '+c.id);for(const p of c.perks){assert.ok(/[\u3400-\u9fff]/.test(p.title));assert.ok(/[\u3400-\u9fff]/.test(p.body));}for(const a of c.attachments)if(a.local)assert.ok(fs.existsSync('public/'+a.local),'Missing local attachment '+a.local);}
const page=fs.readFileSync('app/page.tsx','utf8');for(const phrase of ['从这里，','重新入学','每个问题','衣柜里，','另一个你','每句话，','有些线索'])assert.ok(!page.includes(phrase),'Promotional heading '+phrase);
assert.ok(!page.includes('英文原文')&&!page.includes('original-section'),'English original section is still visible');
assert.match(page,/<video controls playsInline loop preload="none"/);
const bytes=fs.readdirSync('public/board-assets').reduce((n,f)=>n+fs.statSync('public/board-assets/'+f).size,0);
assert.ok(bytes<500*1024*1024,'Board media exceeds deployment budget');
console.log(JSON.stringify({cards:b.cards.length,translated:b.stats.translatedCards,active:b.stats.activeCards,perks:b.stats.perks,attachments:b.stats.attachments,localImages:b.stats.localImages,demos:demos.length,inlineDemos:demos.filter(a=>a.inline).length,mediaBytes:bytes,titles:'short',sourceIds:'matched',missingFiles:0}));
