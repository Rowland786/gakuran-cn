export function mediaRefs(text){
 const refs=[];for(const match of text.matchAll(/!\[([^\]]*)\]\(/g)){let end=match.index+match[0].length,depth=1;for(;end<text.length;end++){if(text[end]==='(')depth++;if(text[end]===')'&&--depth===0)break;}const url=text.slice(match.index+match[0].length,end),id=/\/attachments\/([a-f0-9]+)/.exec(url)?.[1];if(id)refs.push({id,index:match.index,end:end+1,alt:match[1]});}return refs;
}
export function headings(text,bold=false){const out=[];let offset=0;for(const line of text.split('\n')){const match=/^#{1,6}\s+(.+)$/.exec(line)||(bold?/^\s*\*\*([^*\n]{1,100})\*\*\s*:?\s*$/.exec(line):null);if(match)out.push({index:offset,end:offset+line.length,label:match[1].replace(/[*:‌]/g,'').trim()});offset+=line.length+1;}return out;}
function blocks(text,start,end){const value=text.slice(start,end),removed=mediaRefs(value);let clean=value;for(const ref of [...removed].reverse())clean=clean.slice(0,ref.index)+' '.repeat(ref.end-ref.index)+clean.slice(ref.end);const out=[];let offset=start,current=null;for(const line of clean.split('\n')){const text=line.trim();if(!text||/^[-_*‌\s]{1,}$/.test(text)||/^\[\[(?:media|demo):/.test(text)){if(current){out.push(current);current=null;}}else if(/^\s*(?:[-*+]\s+|\d+[.)、]\s*)/.test(line)){if(current){out.push(current);current=null;}out.push({start:offset,end:offset+line.length});}else{if(!current)current={start:offset,end:offset+line.length};else current.end=offset+line.length;}offset+=line.length+1;}if(current)out.push(current);return out;}
export function placeMedia(original,translated,attachments,config={},cardTitle=''){
 let sourceHeads=headings(original),targetHeads=headings(translated);
 if(config.bold){sourceHeads=headings(original,true);targetHeads=headings(translated,true);}
 const refs=mediaRefs(original),inserts=new Map();
 const add=(position,token)=>inserts.set(position,(inserts.get(position)||'')+'\n\n'+token+'\n\n');
 const mapped=[],unresolved=[];
 for(const a of attachments){delete a.inline;delete a.placement;}
 for(const a of attachments){const explicit=new RegExp(`\\[\\[(?:demo|media):${a.id}\\]\\]`).exec(translated);if(explicit){a.inline=true;a.placement='body';a.label=targetHeads.filter(h=>h.index<explicit.index).at(-1)?.label||cardTitle;mapped.push(a.id);}}
 for(const ref of refs){const a=attachments.find(a=>a.id===ref.id);if(!a)throw Error('Missing referenced attachment '+ref.id);if(mapped.includes(a.id))continue;if(config.flowIds?.includes(a.id)){a.placement='awakening';mapped.push(a.id);continue;}
  let sourceIndex=-1;for(let i=0;i<sourceHeads.length;i++)if(sourceHeads[i].index<ref.index)sourceIndex=i;
  let targetIndex=config.headMap?config.headMap[sourceIndex]??(sourceIndex===-1?-1:undefined):sourceHeads.length===targetHeads.length?sourceIndex:undefined;
  const explicit=config.refs?.[a.id];if(explicit){targetIndex=explicit.heading==='intro'?-1:targetHeads.findIndex(h=>h.label===explicit.heading);if(targetIndex===-1&&explicit.heading!=='intro')throw Error('Unknown media heading '+explicit.heading);}
  if(targetIndex===undefined||targetIndex>=targetHeads.length){unresolved.push({id:a.id,sourceIndex,label:sourceHeads[sourceIndex]?.label});continue;}
  const sourceStart=sourceHeads[sourceIndex]?.end||0,sourceEnd=sourceHeads[sourceIndex+1]?.index??original.length;
  const targetStart=targetHeads[targetIndex]?.end||0,targetEnd=targetHeads[targetIndex+1]?.index??translated.length;
  const sb=blocks(original,sourceStart,sourceEnd),tb=blocks(translated,targetStart,targetEnd);
  const before=sb.filter(b=>b.end<=ref.index).length;
  let position=targetEnd;
  const sourceCaption=before>0?original.slice(sb[before-1].start,sb[before-1].end).trim():'';
  const key=sourceCaption.replace(/\((?:Common|Unique|Unobtainable)[^)]*\)/ig,'').replace(/[^a-z0-9]/ig,'').toLowerCase();
  const candidateLines=[];let lineOffset=targetStart;for(const line of translated.slice(targetStart,targetEnd).split('\n')){if(key.length>=3&&/[a-z]{3}/i.test(key)&&sourceCaption.length<90&&line.replace(/[^a-z0-9]/ig,'').toLowerCase().includes(key))candidateLines.push({end:lineOffset+line.length});lineOffset+=line.length+1;}
  if(explicit?.after){const at=translated.indexOf(explicit.after,targetStart);if(at<0||at+explicit.after.length>targetEnd)throw Error('Unknown media paragraph '+explicit.after);position=at+explicit.after.length;}
  else if(candidateLines.length===1)position=candidateLines[0].end;
  else if(sb.length===tb.length&&before>0)position=tb[before-1].end;
  else if(before===0&&sb.length>0)position=targetStart;
  a.inline=true;a.placement='body';a.label=explicit?.label||targetHeads[targetIndex]?.label||cardTitle;
  add(position,`[[media:${a.id}]]`);mapped.push(a.id);
 }
 if(unresolved.length)throw Error('Unmapped media: '+JSON.stringify(unresolved));
 for(const [id,target] of Object.entries(config.extras||{})){const a=attachments.find(a=>a.id===id);if(!a||mapped.includes(id))continue;const index=target.heading==='intro'?-1:targetHeads.findIndex(h=>h.label===target.heading);if(index<0&&target.heading!=='intro')throw Error('Unknown supplemental media heading '+target.heading);const position=targetHeads[index+1]?.index??translated.length;a.inline=true;a.placement='body';a.label=target.label||target.heading;add(position,`[[media:${id}]]`);mapped.push(id);}
 let body=translated;for(const [at,insert] of [...inserts].sort((a,b)=>b[0]-a[0]))body=body.slice(0,at)+insert+body.slice(at);
 return {body,mapped};
}
