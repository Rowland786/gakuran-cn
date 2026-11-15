import fs from 'node:fs';
import crypto from 'node:crypto';
import {mediaRefs,headings} from './layout-media.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=read('research/board-live.json'),board=read('public/data/board.json');
const targets=new Set(raw.lists.filter(l=>['Cosmetics','Faces (both genders)'].includes(l.name)).map(l=>l.id));
const translations=new Map(board.cards.map(c=>[c.id,c]));
const sourceCards=raw.cards.filter(c=>targets.has(c.idList)&&c.attachments.length).sort((a,b)=>a.pos-b.pos);
const rules=read('research/wardrobe-rules.json');
const clean=s=>(s||'').replace(/\\([_*#[\]])/g,'$1').replace(/[*`]/g,'').replace(/^[#>\s|]+/,'').replace(/[:：\s]+$/,'').trim();
const key=s=>clean(s).replace(/[^a-z0-9]/gi,'').toLowerCase();
const numericIds=s=>[...s.matchAll(/\b\d{11,16}\b/g)].map(m=>m[0]);
const rarityName=s=>{
 const value=clean(s);
 for(const [pattern,name] of [[/\bUncommon\b|少见|非凡/i,'少见'],[/\bCommon\b|普通/i,'普通'],[/\bRare\b|稀有/i,'稀有'],[/\bEpic\b|史诗/i,'史诗'],[/\bLegendary\b|传说/i,'传说'],[/\bUnique\b|独特/i,'独特'],[/\bSecret\b|\?\?\?|隐藏/i,'隐藏'],[/\bRegular\b|常规/i,'常规']])if(pattern.test(value))return name;
 return null;
};
const chance=s=>clean(s).match(/\b\d+(?:\.\d+)?%/)?.[0]||null;
const sectionName=s=>clean(s).replace(/\([^)]*\)/g,'').replace(/[:：]/g,'').trim();
const ethnicity=s=>Object.entries(rules.ethnicities).find(([english])=>new RegExp('^'+english+'(?:\\b|$)','i').test(clean(s)))?.[1]||null;
function sourceGroup(label){
 const value=clean(label);if(!value)return '正文配图';
 const ethnic=ethnicity(value);if(ethnic)return ethnic;
 const rarity=rarityName(value);if(rarity)return rarity+(chance(value)?'（'+chance(value)+'）':'');
 return rules.groups?.[sectionName(value)]||sectionName(value);
}
function shortName(s){
 let value=clean(s).replace(/^[-+]\s+/,'').replace(/\s*\((?:Common|Uncommon|Rare|Epic|Legendary|Unique|Unobtainable)[^)]*\)/ig,'').replace(/[:：\s]+$/,'').trim();
 if(!value||value.length>90||/^\d{8,}$/.test(value)||/%/.test(value)||/https?:|\[[^\]]+\]\(/.test(value))return null;
 if(/^(?:Common|Uncommon|Rare|Epic|Legendary|Unique|Secret|Regular|\?\?\?|European|Japanese|Indian|Middle Eastern|African|Latino|Latin|Halloween|Winner|Skate Decks)(?:\s|[:(/]|$)/i.test(value))return null;
 if(/^(?:When |Note|Click|The following|This |There |It is |All |No current|Covers |For )/i.test(value)||/[。！？]/.test(value))return null;
 return value;
}
function translatedName(tr,original,ids){
 const lines=tr.body.split('\n').map(s=>clean(s).replace(/^[-+]\s+/,''));
 for(const id of ids){const line=lines.find(line=>line.includes(id));if(!line)continue;const prefix=line.split(/[:：]/)[0].trim();if(prefix!==id&&!/^\d+$/.test(prefix)&&prefix.length<95)return prefix;}
 if(!original)return null;
 const wanted=key(original);
 for(const line of lines){
  const candidate=line.replace(/[:：].*$/,'').replace(/[,，].*$/,'').trim();
  const roman=candidate.match(/[（(]([^()（）]+)[）)]/)?.[1];
  if(roman&&key(roman)===wanted)return candidate;
  if(key(candidate)===wanted&&candidate.length<95)return candidate;
 }
 return original;
}
function genderFor(card,tr,context){
 if(/^Female\b/i.test(card.name)||/女性/.test(tr.title))return '女性';
 if(/^Male\b/i.test(card.name)||/男性/.test(tr.title))return '男性';
 const intro=card.desc.slice(0,650).replace(/[*_`]/g,'');
 if(/exclusive[^.\n]{0,35}(?:females?|women)|for females|female only/i.test(intro))return '女性';
 if(/exclusive[^.\n]{0,35}(?:males?|men)|for males|to the male/i.test(intro))return '男性';
 return context||'未标注';
}
function categoryFor(card,list){
 if(list.name==='Faces (both genders)')return {category:'面部',slot:'面部'};
 if(/Skate Deck/i.test(card.name))return {category:'滑板',slot:'板面'};
 if(/Finishers/i.test(card.name))return {category:'终结动作',slot:'终结动作'};
 if(/Uniform/i.test(card.name))return {category:'制服',slot:'制服'};
 if(/Hair/i.test(card.name))return {category:'发型',slot:'发型'};
 return {category:'配饰',slot:rules.slots[card.name]||'配饰'};
}

const items=[],contexts=new Map();
// Gender and rarity section cards are public grouping metadata, even when they have no attachments.
const metadata=new Map();
for(const list of raw.lists.filter(l=>targets.has(l.id))){
 let currentGender=list.name==='Cosmetics'?'通用':null,currentRarity=null,currentGroup=null;
 for(const card of raw.cards.filter(c=>c.idList===list.id).sort((a,b)=>a.pos-b.pos)){
  if(!card.attachments.length){
   if(/^Both Genders$/i.test(card.name))currentGender='通用';
   if(/^Male$/i.test(card.name))currentGender='男性';
   if(/^Female$/i.test(card.name))currentGender='女性';
   if(list.name==='Faces (both genders)'&&!/^[-_\s]+$/.test(card.name)){currentRarity=rarityName(card.name);currentGroup=clean(card.name);}
  }
  metadata.set(card.shortLink,{gender:currentGender,rarity:currentRarity,group:currentGroup});
 }
}
for(const card of sourceCards){
 const tr=translations.get(card.shortLink),list=raw.lists.find(l=>l.id===card.idList),section=metadata.get(card.shortLink);
 if(!tr||tr.original!==card.desc)throw Error('Current translated source missing '+card.shortLink);
 const refs=mediaRefs(card.desc),heads=headings(card.desc),assets=new Map(tr.attachments.map(a=>[a.id,a]));
 const cardMeta=categoryFor(card,list),gender=genderFor(card,tr,section.gender);
 const baseRarity=rarityName(card.name)||section.rarity,baseChance=chance(card.name)||chance(section.group||'');
 const groups=new Map(),assigned=new Set();
 const baseAvailability=card.closed||list.closed?'archived':/limited/i.test(card.name)?'limited':'current';
 let inheritedCaption=null,inheritedHead=-2;
 const append=(groupKey,info,media)=>{
  if(assigned.has(media.id))return;
  let item=groups.get(groupKey);
  if(!item){item={id:card.shortLink+'-'+media.id,kind:info.kind,name:info.name,category:cardMeta.category,slot:info.slot||cardMeta.slot,gender,rarity:info.rarity,availability:info.availability||baseAvailability,assetIds:info.assetIds||[],media:[],sourceCardId:card.shortLink,sourceCardTitle:tr.title,sourceURL:card.shortUrl,...(info.originalName?{originalName:info.originalName}:{}),...(info.chance?{chance:info.chance}:{}),...(info.sourceGroup?{sourceGroup:info.sourceGroup}:{}),...(info.ethnicity?{ethnicity:info.ethnicity}:{}),...(info.description?{description:info.description}:{})};groups.set(groupKey,item);}
  for(const id of info.assetIds||[])if(!item.assetIds.includes(id))item.assetIds.push(id);
  const {inline,placement,...attachment}=media;
  item.media.push(attachment);assigned.add(media.id);
 };
 for(let i=0;i<refs.length;i++){
  const ref=refs[i],media=assets.get(ref.id);if(!media)throw Error('Missing official reference '+ref.id);
  let h=-1;for(let j=0;j<heads.length;j++)if(heads[j].index<ref.index)h=j;
  const heading=heads[h]?.label||'',preceding=card.desc.slice(refs[i-1]?.end||0,ref.index),ids=numericIds(preceding);
  let caption=null,captionLine='';
  const lines=preceding.split('\n').filter(line=>line.trim()&&!/^#{1,6}\s/.test(line));
  for(let n=lines.length-1;n>=0;n--){const line=lines[n].trim();if(/^[>|\s]*\d{11,16}\s*$/.test(line)||/^[-_\s]+$/.test(line)||line==='‌')continue;
   if(/:\s*(?:\*\*)?$|\*\*\s*$/.test(line)||cardMeta.category==='面部'&&ids.length||cardMeta.category==='制服'&&line.length<65){caption=shortName(line);if(caption){captionLine=line;break;}}
  }
  const headingIsItem=heading&&!rarityName(heading)&&!ethnicity(heading)&&!/^Halloween$/i.test(clean(heading));
  if(!caption&&headingIsItem&&['制服','面部'].includes(cardMeta.category))caption=shortName(heading);
  if(h!==inheritedHead){inheritedCaption=null;inheritedHead=h;}
  if(caption)inheritedCaption=caption;
  else if(!ids.length)caption=inheritedCaption;
  else inheritedCaption=null;
  const contextRarity=rarityName(heading)||baseRarity;
  const localRarity=rarityName(preceding.split('\n').filter(s=>s.trim()).at(-1)||'')||contextRarity;
  const captionRarity=caption?rarityName(captionLine):null;
  const actualRarity=captionRarity||localRarity;
  const name=translatedName(tr,caption,ids);
  const availability=/Unobtainable|no longer obtainable|已停止获取/i.test(preceding)||/Unobtainable/i.test(heading)?'limited':baseAvailability;
  const eth=ethnicity(heading)||ethnicity(card.name),slot=eth&&cardMeta.category==='发型'?eth+'发型':cardMeta.slot;
  const group=sourceGroup(heading);
  const localChance=chance(preceding.split('\n').filter(s=>s.trim()).at(-1)||'')||chance(heading)||baseChance;
  if(name||ids.length){
   const groupKey='item:'+h+':'+key(caption||name||ids.join('-'))+':'+ids.join(',');
   append(groupKey,{kind:'item',name,originalName:caption,rarity:actualRarity,assetIds:ids,slot,availability,chance:localChance,sourceGroup:group,ethnicity:eth},media);
  }else{
   append('gallery:'+h,{kind:'gallery',name:null,rarity:contextRarity,assetIds:[],slot,availability,chance:chance(heading)||baseChance,sourceGroup:group,ethnicity:eth},media);
  }
 }
 // Attachments without a prose association remain an explicitly labelled source gallery.
 for(const original of card.attachments){if(assigned.has(original.id))continue;const media=assets.get(original.id);if(!media)throw Error('Missing source attachment '+original.id);append('gallery:other',{kind:'gallery',name:null,rarity:baseRarity,slot:cardMeta.slot,assetIds:[],sourceGroup:'其他配图',description:'原卡附图未逐项标注名称。'},media);}
 items.push(...groups.values());
 contexts.set(card.shortLink,{gender,category:cardMeta.category,sourceAttachments:card.attachments.length,entries:groups.size});
}
const uniqueMedia=new Set(items.flatMap(i=>i.media.map(a=>a.id)));
const result={checkedAt:board.checkedAt,source:'https://trello.com/b/v3WatB1P',sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync('research/board-live.json')).digest('hex'),items,stats:{sourceCards:sourceCards.length,items:items.length,entries:items.length,media:uniqueMedia.size,sourceMedia:sourceCards.reduce((n,c)=>n+c.attachments.length,0),named:items.filter(i=>i.name).length,namedItems:items.filter(i=>i.kind==='item'&&i.name).length,galleries:items.filter(i=>i.kind==='gallery').length,assetIds:new Set(items.flatMap(i=>i.assetIds)).size,videos:new Set(items.flatMap(i=>i.media.filter(a=>a.videoLocal).map(a=>a.id))).size,categories:Object.fromEntries([...new Set(items.map(i=>i.category))].map(category=>[category,items.filter(i=>i.category===category).length]))}};
fs.writeFileSync('public/data/wardrobe.json',JSON.stringify(result));
fs.writeFileSync('research/wardrobe-coverage.json',JSON.stringify({checkedAt:board.checkedAt,source:result.source,sourceSHA256:result.sourceSHA256,stats:result.stats,cards:Object.fromEntries(contexts)},null,2));
console.log(JSON.stringify(result.stats));
