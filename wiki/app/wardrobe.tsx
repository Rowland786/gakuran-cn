"use client";
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,ChevronLeft,ChevronRight,SlidersHorizontal,X} from 'lucide-react';
import {DemoVideo} from './media';
import {asset,safeURL,type WardrobeData,type WardrobeItem} from './wiki-types';

export type WardrobeFilters={category:string;gender:string;rarity:string;slot:string;availability:string;ethnicity:string};
export const initialWardrobeFilters:WardrobeFilters={category:'全部',gender:'全部',rarity:'全部',slot:'全部',availability:'全部',ethnicity:'全部'};
export const categoryList=(items:WardrobeItem[])=>[...new Set(items.map(item=>item.category))].sort((a,b)=>['制服','发型','面部','配饰','滑板','终结动作'].indexOf(a)-['制服','发型','面部','配饰','滑板','终结动作'].indexOf(b));
export const itemTitle=(item:WardrobeItem)=>{if(item.name&&item.originalName){for(const suffix of ['（'+item.originalName+'）','('+item.originalName+')'])if(item.name.endsWith(suffix)&&item.name.length>suffix.length)return item.name.slice(0,-suffix.length).trim();}if(item.name)return item.name;if(item.kind==='gallery'){if(item.ethnicity)return item.ethnicity+item.category;if(item.sourceGroup==='其他配图')return item.sourceCardTitle.replace(/ID$/,'')+'配图';if(item.sourceGroup&&item.sourceGroup!=='正文配图')return item.sourceGroup+item.category;return item.sourceCardTitle;}return item.slot||item.sourceCardTitle;};
export function Wardrobe({data,query,filters,onFilters,onOpen,onReset}:{data:WardrobeData;query:string;filters:WardrobeFilters;onFilters:(value:WardrobeFilters)=>void;onOpen:(item:WardrobeItem)=>void;onReset:()=>void}){
 const [page,setPage]=useState(1),[more,setMore]=useState(false);
 const patch=(key:keyof WardrobeFilters,value:string)=>onFilters({...filters,[key]:value,...(key==='category'?{slot:'全部',ethnicity:'全部'}:{})});
 useEffect(()=>setPage(1),[query,filters]);
 const categories=['全部',...categoryList(data.items)];
 const slots=[...new Set(data.items.filter(item=>filters.category==='全部'||item.category===filters.category).map(item=>item.slot).filter(Boolean))] as string[];
 const ethnicities=[...new Set(data.items.filter(item=>filters.category==='全部'||item.category===filters.category).map(item=>item.ethnicity).filter(Boolean))] as string[];
 const rarities=['普通','少见','非凡','优良','稀有','史诗','传说','独特','隐藏','常规','未标注'].filter(value=>value==='未标注'||data.items.some(item=>item.rarity===value));
 const found=useMemo(()=>data.items.filter(item=>
  (filters.category==='全部'||item.category===filters.category)&&
  (filters.gender==='全部'||item.gender===filters.gender)&&
  (filters.rarity==='全部'||(item.rarity||'未标注')===filters.rarity)&&
  (filters.slot==='全部'||item.slot===filters.slot)&&
  (filters.ethnicity==='全部'||item.ethnicity===filters.ethnicity)&&
  (filters.availability==='归档'?item.availability==='archived':filters.availability==='限定'?item.availability==='limited':item.availability!=='archived')&&
  `${item.name||''} ${item.originalName||''} ${item.category} ${item.slot||''} ${item.sourceGroup||''} ${item.ethnicity||''} ${item.assetIds.join(' ')} ${item.sourceCardTitle}`.toLowerCase().includes(query.trim().toLowerCase())
 ).sort((a,b)=>categories.indexOf(a.category)-categories.indexOf(b.category)||(a.availability==='current'?0:1)-(b.availability==='current'?0:1)||(a.kind==='gallery'?1:0)-(b.kind==='gallery'?1:0)),[data.items,filters,query]);
 const pages=Math.max(1,Math.ceil(found.length/24)),safePage=Math.min(page,pages);
 const filtered=Object.values(filters).some(v=>v!=='全部');
 const select=(key:keyof WardrobeFilters,label:string,values:string[])=> <label className="filter-select"><span>{label}</span><select aria-label={label} value={filters[key]} onChange={e=>patch(key,e.target.value)}><option value="全部">全部</option>{values.map(value=><option key={value} value={value}>{value}</option>)}</select></label>;
 return <section className="wardrobe-view">
  <header className="page-heading"><div><p className="eyebrow">官方 Trello</p><h1>衣柜</h1></div><span className="quiet-meta">同步 {data.checkedAt}</span></header>
  <nav className="collection-tabs" aria-label="衣柜分类">{categories.map(category=><button key={category} aria-current={filters.category===category?'page':undefined} onClick={()=>patch('category',category)}>{category}</button>)}</nav>
  <div className="collection-toolbar"><div className="primary-filters">{select('gender','性别',['男性','女性','通用','未标注'])}{select('rarity','稀有度',rarities)}<button className={`filter-more ${more?'active':''}`} onClick={()=>setMore(!more)} aria-expanded={more}><SlidersHorizontal size={14}/>更多筛选</button></div><span className="quiet-meta" aria-live="polite">{found.length} 条资料</span></div>
  {more&&<div className="secondary-filters">{filters.category==='配饰'&&slots.length>1&&select('slot','部位',slots)}{!!ethnicities.length&&select('ethnicity','族裔',ethnicities)}{select('availability','范围',['限定','归档'])}{(filtered||query)&&<button className="text-action" onClick={()=>{onReset();setMore(false)}}><X size={13}/>清除筛选</button>}</div>}
  <div className="wardrobe-grid">{found.slice((safePage-1)*24,safePage*24).map(item=>{const media=item.media[0];return <button className="wardrobe-card" key={item.id} onClick={()=>onOpen(item)} aria-label={itemTitle(item)+(item.gender==='未标注'?'':' '+item.gender)}><div className="wardrobe-image">{(media?.posterLocal||media?.local)&&<img src={asset(media.posterLocal||media.local!)} alt={itemTitle(item)} loading="lazy" decoding="async"/>}{item.kind==='gallery'&&<span className="gallery-label">图集 · {item.media.length}张</span>}{item.availability==='limited'&&<span className="limited-label">限定</span>}</div><div className="wardrobe-caption"><h2>{itemTitle(item)}</h2><p><span>{item.gender==='未标注'?item.category:item.gender}</span><span>{item.rarity||item.chance||''}</span></p></div></button>})}</div>
  {!found.length&&<div className="empty-state"><h2>没有匹配资料</h2><p>试试其他名称、资产ID或筛选条件。</p><button className="subtle-button" onClick={()=>{onReset();setMore(false)}}>重置</button></div>}
  {pages>1&&<nav className="pagination" aria-label="衣柜分页"><button disabled={safePage===1} onClick={()=>{setPage(safePage-1);document.getElementById('main')?.scrollTo(0,0)}}><ChevronLeft size={16}/>上一页</button><span>{safePage} / {pages}</span><button disabled={safePage===pages} onClick={()=>{setPage(safePage+1);document.getElementById('main')?.scrollTo(0,0)}}>下一页<ChevronRight size={16}/></button></nav>}
 </section>;
}

export function WardrobeReader({item,onBack}:{item:WardrobeItem;onBack:()=>void}){
 const [index,setIndex]=useState(0);
 useEffect(()=>setIndex(0),[item.id]);
 const media=item.media[index]||item.media[0];
 return <article className="wardrobe-detail"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/>返回衣柜</button><div className="item-layout"><section className="item-gallery" aria-label="外观图片"><div className="item-stage">{media?.videoLocal?<DemoVideo media={media}/>:media?.local?<a href={asset(media.local)} target="_blank" rel="noreferrer"><img src={asset(media.local)} alt={itemTitle(item)}/></a>:<p className="muted">原附件不可用。</p>}</div>{item.media.length>1&&<><div className="gallery-controls"><button onClick={()=>setIndex((index-1+item.media.length)%item.media.length)} aria-label="上一张"><ChevronLeft size={17}/></button><span>{index+1} / {item.media.length}</span><button onClick={()=>setIndex((index+1)%item.media.length)} aria-label="下一张"><ChevronRight size={17}/></button></div><div className="item-thumbnails">{item.media.map((part,i)=><button key={part.id} aria-label={`图片${i+1}`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{(part.posterLocal||part.local)&&<img src={asset(part.posterLocal||part.local!)} alt="" loading="lazy"/>}</button>)}</div></>}</section><section className="item-information"><p className="eyebrow">{item.category}{item.kind==='gallery'?' / 图集':''}</p><h1>{itemTitle(item)}</h1>{item.originalName&&item.originalName!==itemTitle(item)&&<p className="entry-alias">{item.originalName}</p>}<dl>{item.gender!=='未标注'&&<><dt>性别</dt><dd>{item.gender}</dd></>}{item.slot&&item.slot!==item.category&&item.slot!==itemTitle(item)&&<><dt>部位</dt><dd>{item.slot}</dd></>}{item.ethnicity&&<><dt>族裔</dt><dd>{item.ethnicity}</dd></>}{item.rarity&&<><dt>稀有度</dt><dd>{item.rarity}</dd></>}{item.chance&&<><dt>概率</dt><dd>{item.chance}</dd></>}{item.availability!=='current'&&<><dt>状态</dt><dd>{item.availability==='limited'?'限定':'归档'}</dd></>}{!!item.assetIds.length&&<><dt>资产ID</dt><dd className="asset-ids">{item.assetIds.map(id=><code key={id}>{id}</code>)}</dd></>}</dl>{item.description&&<p className="item-description">{item.description}</p>}<div className="item-links"><a href={`#/card/${item.sourceCardId}`}>查看说明<ArrowRight size={15}/></a>{media?.local&&<a href={asset(media.local)} target="_blank" rel="noreferrer">查看原图<ArrowUpRight size={15}/></a>}<a href={safeURL(item.sourceURL)} target="_blank" rel="noreferrer">官方原卡<ArrowUpRight size={15}/></a></div></section></div></article>;
}
