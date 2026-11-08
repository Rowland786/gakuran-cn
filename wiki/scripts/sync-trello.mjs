import fs from 'node:fs';
import crypto from 'node:crypto';
const root='.';
const r=await fetch('https://trello.com/b/v3WatB1P.json',{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Official Trello HTTP '+r.status);const board=await r.json();if(!Array.isArray(board.cards)||!Array.isArray(board.lists))throw Error('Invalid board response');
const snapshot=JSON.stringify(board);fs.writeFileSync(root+'/research/board-live.json',snapshot);
fs.writeFileSync(root+'/research/board-sync.json',JSON.stringify({checkedAt:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),fetchedAt:new Date().toISOString(),sourceLastActivity:board.dateLastActivity,sourceSHA256:crypto.createHash('sha256').update(snapshot).digest('hex')},null,2));
const plain=s=>s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/https?:\/\/\S+/g,'').replace(/[\s#*_>~`|\-]/g,'');
console.log(JSON.stringify({name:board.name,activity:board.dateLastActivity,cards:board.cards.length,attachments:board.cards.reduce((n,c)=>n+c.attachments.length,0),lists:board.lists.map(l=>({id:l.id,name:l.name,count:board.cards.filter(c=>c.idList===l.id).length,chars:board.cards.filter(c=>c.idList===l.id).reduce((n,c)=>n+plain(c.desc).length,0)})),prefs:board.prefs},null,2));
const packs=[['Information','Combat','Stats','Names'],['Features','Clubs','Sports','Phone','Locations','Private Servers'],['Fighting Styles','Cosmetics','Faces (both genders)','Updates','Credits']];
for(let i=0;i<packs.length;i++){const cards=board.cards.filter(c=>packs[i].includes(board.lists.find(l=>l.id===c.idList)?.name)).map(c=>({id:c.shortLink,title:c.name,list:board.lists.find(l=>l.id===c.idList)?.name,desc:c.desc}));fs.writeFileSync(root+`/research/board-source-${i+1}.json`,JSON.stringify({cards},null,2));console.log(JSON.stringify({pack:i+1,cards:cards.length,chars:cards.reduce((n,c)=>n+plain(c.desc).length,0)}));}
