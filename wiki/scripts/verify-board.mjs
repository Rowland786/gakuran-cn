import fs from 'node:fs';
import assert from 'node:assert/strict';
import {mediaRefs} from './layout-media.mjs';
const b=JSON.parse(fs.readFileSync('public/data/board.json','utf8'));
const raw=JSON.parse(fs.readFileSync('research/board-live.json','utf8'));
assert.equal(b.cards.length,raw.cards.length);assert.equal(b.stats.translatedCards,raw.cards.length);
assert.deepEqual(new Set(b.cards.map(c=>c.id)),new Set(raw.cards.map(c=>c.shortLink)));
assert.equal(b.stats.perks,108);
const perfect=b.cards.find(c=>c.id==='kBzBnqqM');
assert.equal(perfect.perks.length,4);
assert.deepEqual(perfect.perks.map(p=>p.english),['Copycat','Adaption','Master Copy','Perfect Technique']);
const expectedDemos=raw.cards.flatMap(c=>c.attachments.filter(a=>a.mimeType==='image/gif').map(a=>a.id));
const demos=b.cards.flatMap(c=>c.attachments.filter(a=>a.videoLocal));
assert.equal(b.stats.videos,expectedDemos.length);
assert.deepEqual(new Set(demos.map(a=>a.id)),new Set(expectedDemos));
for(const c of b.cards){const markers=[...c.body.matchAll(/\[\[(?:demo|media):([a-f0-9]+)\]\]/g)].map(m=>m[1]);assert.equal(new Set(markers).size,markers.length,'Duplicate inline media '+c.id);for(const a of c.attachments){assert.equal(markers.includes(a.id),!!a.inline,'Inline media placement '+a.id);if(a.videoLocal){for(const key of ['videoLocal','posterLocal'])assert.ok(fs.existsSync('public/'+a[key]),'Missing demo '+a[key]);assert.ok(Math.abs(a.duration-a.sourceDuration)<=0.15,'Demo timing changed '+a.id);}}if(c.body)for(const ref of mediaRefs(raw.cards.find(r=>r.shortLink===c.id).desc)){const a=c.attachments.find(a=>a.id===ref.id);assert.ok(a?.inline||a?.placement==='awakening','Referenced media is still in appendix '+c.id+' '+ref.id);}}
assert.equal(perfect.attachments.filter(a=>a.inline&&a.videoLocal).length,perfect.attachments.filter(a=>a.videoLocal).length);
assert.match(perfect.body,/轻击连段[^\n]*\n+\[\[(?:demo|media):/);
assert.match(perfect.body,/重击[^\n]*\n+\[\[(?:demo|media):/);
for(const id of ['kBzBnqqM','thAfRDEL','Roh6sIpv','OGlBZDUb']){const c=b.cards.find(c=>c.id===id);assert.match(c.body,/觉醒天赋/);assert.match(c.body,/觉醒重击\n+\[\[demo:/);}
assert.ok(b.cards.find(c=>c.id==='MIZn5wk2').body.includes('2.5倍'));
assert.ok(b.cards.find(c=>c.id==='AmPmoREx').body.includes('- strays'));
assert.ok(b.cards.find(c=>c.id==='YSBt05lI').body.includes('88302441610364'));
assert.match(b.cards.find(c=>c.id==='KxGUwMZF').notes.join(''),/撤回/);
const guide=b.cards.find(c=>c.id==='d71UNOzJ').awakeningGuide;
assert.equal(guide.length,21);
const current=guide.filter(f=>!f.historical),historical=guide.filter(f=>f.historical);
assert.equal(current.filter(f=>f.stages.length===3&&f.stages.every(s=>!s.pending)).length,15);
assert.equal(current.filter(f=>f.stages.length===0).length,2);
assert.equal(historical.length,4);
for(const flow of historical){assert.match(flow.notice,/2026-11-13.*移除/);assert.match(flow.source,/github\.com/);}
const expectedQuests={
 'style-jin':[/150/,/200次反击.*2秒/,/5分钟/],
 'style-kure':[/120次重击/,/25%.*15名/,/公共.*4名.*不能死亡/],
 'style-slugger':[/120名.*2次/,/250次/,/袭击.*5名.*不能死亡/],
 'style-kickboxing':[/第3、4段.*未填写/,/150套/,/变红.*5秒/],
 'style-striker':[/150次/,/首领.*穿过.*击倒/,/3名.*汽车不计入/],
 'style-aikido':[/300次/,/轻击.*5次/,/地毯.*4分钟/],
 'style-kyokushin-karate':[/500次.*不能自己先出手/,/前摇.*350次/,/10名.*不能死亡/],
 'style-cqc':[/1000点重击伤害/,/2名.*5次/,/5名.*黑色.*不能死亡/]
};
for(const [articleId,patterns] of Object.entries(expectedQuests)){const flow=current.find(f=>f.articleId===articleId);for(let i=0;i<3;i++)assert.match(flow.stages[i].body,patterns[i]);}
assert.match(b.cards.find(c=>c.id==='AmPmoREx').body,/- VET/);
const patch=b.cards.find(c=>c.id==='Lje7HJrQ');for(const text of ['6只猫和5只狗','羁绊会保存','校医','兽医','Ryu','Systema','篮板清道夫'])assert.ok(patch.body.includes(text),'Missing v14 detail '+text);
assert.ok(!b.cards.some(c=>c.id==='4aLGlV3L'),'Removed Halloween event remains current');
for(const [id,count] of [['XUGizHXx',4],['o1jj63YB',3]]){const c=b.cards.find(c=>c.id===id);assert.equal(c.perks.length,count);assert.match(c.updates.join(''),/归档/);}
assert.match(b.cards.find(c=>c.articleId==='style-hakari').perks.find(p=>p.english==='Guard Pierce III').body,/20%/);
assert.match(b.cards.find(c=>c.articleId==='style-capoeira').perks.find(p=>p.english==='Guard Pierce IV').body,/25%/);
for(const id of ['6af38202f487ccb4cdc3507e','6af382e4304a5f59a0390aae','6af382864f042bdfa369f600','6af383960bb8795770650277','6af383f92e4a1d06f5ea9d02','6af384594a61646717a9904b','6af384a949df4946c76692b9'])assert.ok(demos.some(a=>a.id===id&&a.inline),'Existing inline demo lost '+id);
for(const flow of guide){const style=b.cards.find(c=>c.id===flow.cardId);assert.deepEqual(style.awakening,flow,'Style quest missing '+flow.articleId);for(const stage of flow.stages)assert.ok(stage.body.trim());if(flow.reference)assert.ok(fs.existsSync('public/'+flow.reference));}
assert.equal(guide.reduce((n,f)=>n+f.media.length,0),6);
for(const flow of guide)for(const media of flow.media){assert.ok(fs.existsSync('public/'+media.local));if(media.videoLocal)assert.ok(fs.existsSync('public/'+media.videoLocal));}
const cqc=b.cards.find(c=>c.articleId==='style-cqc').awakening;
assert.match(cqc.stages[0].body,/1000点重击伤害/);
assert.ok(!cqc.historical);
assert.match(cqc.notes.join(''),/1000点重击伤害/);
const kick=b.cards.find(c=>c.articleId==='style-kickboxing').awakening;
assert.match(kick.stages[0].body,/未填写所需次数/);
assert.match(kick.stages[2].body,/变红.*5秒/);
assert.ok(!kick.stages[2].body.includes('25秒'));
assert.equal(b.stats.attachments,raw.cards.reduce((n,c)=>n+c.attachments.length,0));
for(const c of raw.cards){const rendered=b.cards.find(x=>x.id===c.shortLink);for(const a of c.attachments)if(a.mimeType?.startsWith('image/'))assert.ok(rendered.attachments.find(x=>x.id===a.id)?.local,'Missing source image '+a.id);for(const match of c.desc.matchAll(/!\[[^\]]*\]\((https:\/\/trello\.com\/[^)]+)\)/g)){const id=/\/attachments\/([a-f0-9]+)/.exec(match[1])?.[1];if(!id)continue;const a=rendered.attachments.find(x=>x.id===id);assert.ok(a,'Missing embedded attachment '+id);assert.ok(a.local||a.unavailable&&/^HTTP (404|410)$/.test(a.unavailableReason),'Unresolved source reference '+id);}}
assert.match(b.cards.find(c=>c.id==='fLtMVx9J').body,/6种猫/);
assert.match(b.cards.find(c=>c.id==='fLtMVx9J').body,/城镇动物/);assert.ok(!b.cards.find(c=>c.id==='fLtMVx9J').body.includes('## 驯养乌鸦'));
assert.match(b.cards.find(c=>c.id==='juZtli72').body,/9种玩法/);
for(const word of ['足球设置','躲避球设置','橄榄球设置'])assert.ok(b.cards.find(c=>c.id==='juZtli72').body.includes(word));
assert.ok(!b.cards.find(c=>c.id==='9iTXlxpG').body.includes('## 第一斗士'));
for(const c of b.cards){assert.ok(!/[。！？]/.test(c.title),'Sentence title: '+c.title);assert.ok(!/!\[[^\]]*\]\(/.test(c.body),'Image syntax in translation '+c.id);for(const p of c.perks){assert.ok(/[\u3400-\u9fff]/.test(p.title));assert.ok(/[\u3400-\u9fff]/.test(p.body));}for(const a of c.attachments)if(a.local)assert.ok(fs.existsSync('public/'+a.local),'Missing local attachment '+a.local);}
const page=fs.readFileSync('app/page.tsx','utf8');for(const phrase of ['从这里，','重新入学','每个问题','衣柜里，','另一个你','每句话，','有些线索'])assert.ok(!page.includes(phrase),'Promotional heading '+phrase);
assert.ok(!page.includes('英文原文')&&!page.includes('original-section'),'English original section is still visible');
assert.match(fs.readFileSync('app/media.tsx','utf8'),/<video controls playsInline loop preload="none"/);
const bytes=fs.readdirSync('public/board-assets').reduce((n,f)=>n+fs.statSync('public/board-assets/'+f).size,0);
assert.ok(bytes<500*1024*1024,'Board media exceeds deployment budget');
console.log(JSON.stringify({cards:b.cards.length,translated:b.stats.translatedCards,active:b.stats.activeCards,perks:b.stats.perks,attachments:b.stats.attachments,localImages:b.stats.localImages,demos:b.stats.videos,videoPlacements:demos.length,inlineDemos:demos.filter(a=>a.inline).length,mediaBytes:bytes,titles:'short',sourceIds:'matched',missingFiles:0}));
