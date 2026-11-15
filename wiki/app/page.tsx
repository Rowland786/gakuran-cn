"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Bookmark,BookOpen,ChevronRight,Clock3,Link as LinkIcon,Menu,Search,Shirt,X} from 'lucide-react';
import {EntryReader} from './entry-reader';
import {Wardrobe,WardrobeReader,initialWardrobeFilters,categoryList,type WardrobeFilters} from './wardrobe';
import {routeFromHash,type Route} from './navigation';
import {asset,type Board,type Card,type WardrobeData,type WardrobeItem} from './wiki-types';

function readSaved():string[]{try{const value=JSON.parse(localStorage.getItem('gaku-saved')||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function preview(card:Card){return card.body.split('\n').filter(line=>line.trim()&&!/^\s*(?:#|\[\[|---|\|)/.test(line)).slice(0,2).join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*`>]/g,'').replace(/^[-\s]+/,'')||card.perks?.[0]?.body||''}
function isLabel(card:Card){return !card.body&&!card.attachments.length&&!card.perks?.length&&!card.awakening}

export default function Page(){
 const [board,setBoard]=useState<Board|null>(null),[wardrobe,setWardrobe]=useState<WardrobeData|null>(null);
 const [failed,setFailed]=useState(false),[route,setRoute]=useState<Route>({view:'board'}),[saved,setSaved]=useState<string[]>([]);
 const [query,setQuery]=useState(''),[clothesQuery,setClothesQuery]=useState(''),[archive,setArchive]=useState(false),[drawer,setDrawer]=useState(false);
 const [filters,setFilters]=useState<WardrobeFilters>(initialWardrobeFilters);
 const searchRef=useRef<HTMLInputElement>(null),mainRef=useRef<HTMLElement>(null),menuRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const controller=new AbortController();
  Promise.all(['board','wardrobe'].map(name=>fetch(asset(`data/${name}.json`),{cache:'no-cache',signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Load failed');return r.json()}))).then(([b,w])=>{const data=b as Board;setBoard(data);setWardrobe(w as WardrobeData);setSaved(readSaved().map(id=>data.articleMap[id]||id))}).catch(error=>{if(error.name!=='AbortError')setFailed(true)});
  const sync=()=>{setRoute(routeFromHash(location.hash));setDrawer(false)};sync();window.addEventListener('hashchange',sync);
  return()=>{controller.abort();window.removeEventListener('hashchange',sync)};
 },[]);
 useEffect(()=>{mainRef.current?.scrollTo(0,0);if(route.card||route.item)mainRef.current?.focus()},[route]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if((event.key==='/'||((event.ctrlKey||event.metaKey)&&event.key==='k'))&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)){event.preventDefault();searchRef.current?.focus()}
   if(event.key==='Escape'){if(drawer){setDrawer(false);menuRef.current?.focus()}else if(route.item)navigate('/wardrobe');else if(route.card)navigate(card?'/category/'+card.listId:'/board')}
  };
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 });
 useEffect(()=>{
  if(!drawer)return;
  const navigation=document.getElementById('category-navigation'),openingHash=location.hash;
  const controls=()=>Array.from(navigation?.querySelectorAll<HTMLButtonElement>('button')||[]).filter(button=>button.offsetParent!==null);
  controls()[0]?.focus();
  const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const buttons=controls();if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0]?.focus()}};
  document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);if(location.hash===openingHash)menuRef.current?.focus()};
 },[drawer]);
 function navigate(hash:string){setDrawer(false);setRoute(routeFromHash('#'+hash));location.hash=hash}
 function top(view:Route['view']){setQuery('');setClothesQuery('');navigate('/'+view)}
 function bookmark(id:string){setSaved(previous=>{const next=previous.includes(id)?previous.filter(value=>value!==id):[...previous,id];try{localStorage.setItem('gaku-saved',JSON.stringify(next))}catch{}return next})}
 const cardId=route.card?.startsWith('@')?board?.articleMap[route.card.slice(1)]:route.card;
 const card=board?.cards.find(c=>c.id===cardId),item=wardrobe?.items.find(value=>value.id===route.item);
 const categoryId=route.category||card?.listId;
 const categories=board?.lists.filter(list=>!list.closed)||[];
 const activeCategory=board?.lists.find(list=>list.id===categoryId);
 const visible=useMemo(()=>board?.cards.filter(c=>!c.separator&&!isLabel(c)&&(archive||(!c.closed&&!board.lists.find(list=>list.id===c.listId)?.closed)))||[],[board,archive]);
 const matching=useMemo(()=>visible.filter(c=>`${c.title} ${c.english} ${c.body} ${c.perks?.map(p=>p.title+' '+p.english+' '+p.body).join(' ')} ${c.awakening?.stages.map(stage=>stage.body).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())),[visible,query]);
 const latest=visible.find(c=>board?.lists.find(list=>list.id===c.listId)?.title==='更新日志'&&c.body);
 const open=(value:Card)=>{setQuery('');navigate('/card/'+value.id)};
 const openItem=(value:WardrobeItem)=>navigate('/wardrobe/item/'+value.id);
 const titleForCategory=(id:string)=>board?.lists.find(list=>list.id===id)?.title||'百科';
 const cardTile=(value:Card)=><button className="index-entry" key={value.id} onClick={()=>open(value)}><div><h3>{value.title}</h3>{saved.includes(value.id)&&<Bookmark size={13} fill="currentColor"/>}</div>{preview(value)&&<p>{preview(value)}</p>}<span className="entry-kind">{value.closed?'归档':value.awakening?.historical?'含历史记录':value.awakening?'觉醒':value.perks?.length?'天赋':titleForCategory(value.listId)}<ChevronRight size={13}/></span></button>;
 const indexCards=route.view==='saved'?board?.cards.filter(c=>saved.includes(c.id)&&`${c.title} ${c.english} ${c.body}`.toLowerCase().includes(query.toLowerCase()))||[]:matching.filter(c=>!route.category||c.listId===route.category);
 const home=route.view==='board'&&!route.card&&!route.category&&!query;
 return <div className="app">
  <a className="skip-link" href="#main" onClick={event=>{event.preventDefault();mainRef.current?.focus()}}>跳到内容</a>
  <header className="topbar" inert={drawer}><div className="brand-wrap"><button className="mobile-menu icon-action" ref={menuRef} aria-label={drawer?'关闭分类':'打开分类'} aria-expanded={drawer} aria-controls="category-navigation" onClick={()=>setDrawer(!drawer)}>{drawer?<X size={20}/>:<Menu size={20}/>}</button><button className="brand" onClick={()=>top('board')} aria-label="学乱Wiki首页"><span>学</span><b>学乱 Wiki</b></button></div><nav className="primary-nav" aria-label="主导航">{[{view:'board' as const,title:'百科',icon:BookOpen},{view:'wardrobe' as const,title:'衣柜',icon:Shirt},{view:'saved' as const,title:'收藏',icon:Bookmark}].map(tab=><button key={tab.view} onClick={()=>top(tab.view)} aria-current={route.view===tab.view?'page':undefined}><tab.icon size={16}/>{tab.title}</button>)}</nav><label className="global-search"><Search size={16}/><input ref={searchRef} value={route.view==='wardrobe'?clothesQuery:query} aria-label={route.view==='wardrobe'?'搜索衣柜':'搜索条目'} placeholder={route.view==='wardrobe'?'名称、资产ID':'搜索条目'} onChange={event=>{if(route.view==='wardrobe'){setClothesQuery(event.target.value);if(route.item)navigate('/wardrobe')}else{setQuery(event.target.value);if(route.card||route.view==='sources')navigate('/board')}}}/>{(route.view==='wardrobe'?clothesQuery:query)?<button aria-label="清空搜索" onClick={()=>route.view==='wardrobe'?setClothesQuery(''):setQuery('')}><X size={14}/></button>:<kbd>/</kbd>}</label></header>
  <div className="app-shell">{drawer&&<button className="drawer-shade" aria-label="关闭分类导航" onClick={()=>{setDrawer(false);menuRef.current?.focus()}}/>}<aside className={`sidebar ${drawer?'is-open':''}`} id="category-navigation" role={drawer?'dialog':undefined} aria-modal={drawer||undefined} aria-label="分类导航"><div className="sidebar-heading"><span>{route.view==='wardrobe'?'外观':'百科'}</span><button className="mobile-menu icon-action" aria-label="关闭分类" onClick={()=>{setDrawer(false);menuRef.current?.focus()}}><X size={18}/></button></div>{route.view==='wardrobe'?<nav>{['全部',...categoryList(wardrobe?.items||[])].map(category=><button key={category} aria-current={filters.category===category?'page':undefined} onClick={()=>{setFilters({...filters,category,slot:'全部',ethnicity:'全部'});navigate('/wardrobe')}}>{category==='全部'?'全部外观':category}</button>)}</nav>:<nav><button aria-current={home?'page':undefined} onClick={()=>top('board')}><BookOpen size={15}/>总览</button><div className="sidebar-divider"/>{categories.map(category=><button key={category.id} aria-current={categoryId===category.id?'page':undefined} onClick={()=>{setQuery('');navigate('/category/'+category.id)}}>{category.title}</button>)}</nav>}<div className="sidebar-footer"><button aria-current={route.view==='sources'?'page':undefined} onClick={()=>top('sources')}><LinkIcon size={14}/>资料来源</button><span>非官方中文版</span>{board&&<small>同步 {board.checkedAt}</small>}</div></aside>
  <main id="main" inert={drawer} tabIndex={-1} ref={mainRef}>
   {failed?<div className="empty-state"><h1>资料载入失败</h1><button className="subtle-button" onClick={()=>location.reload()}>重试</button></div>:!board||!wardrobe?<div className="loading">载入资料</div>:<div className="main-content">
    {route.card?(card?<EntryReader card={card} board={board} saved={saved.includes(card.id)} onBookmark={()=>bookmark(card.id)} onBack={()=>navigate('/category/'+card.listId)}/>:<div className="empty-state"><h1>条目不存在</h1><button className="subtle-button" onClick={()=>top('board')}>返回总览</button></div>):<>
     {route.view==='board'&&<>{home?<><header className="page-heading"><div><p className="eyebrow">学乱 Wiki</p><h1>百科</h1></div><span className="quiet-meta">同步 {board.checkedAt}</span></header><div className="home-top">{latest&&<button className="latest-entry" onClick={()=>open(latest)}><span className="small-label"><Clock3 size={13}/>最近更新</span><h2>{latest.title}</h2><span className="text-action">查看更新<ArrowRight size={15}/></span></button>}<section className="quick-links"><h2>常用条目</h2>{['入门指南','觉醒','操作按键','举报指南'].map(title=>{const value=visible.find(c=>c.title===title);return value?<button key={value.id} onClick={()=>open(value)}>{value.title}<ArrowRight size={15}/></button>:null})}</section></div><section><div className="section-heading"><h2>分类</h2></div><div className="category-grid">{categories.map(category=><button key={category.id} onClick={()=>navigate('/category/'+category.id)}><h3>{category.title}</h3><span>{visible.filter(c=>c.listId===category.id).length} 条目<ChevronRight size={14}/></span></button>)}</div></section></>:<><header className="page-heading"><div><p className="eyebrow">百科</p><h1>{query?'搜索':activeCategory?.title||'条目'}</h1></div><span className="quiet-meta" aria-live="polite">{indexCards.length} 条目</span></header><div className="index-toolbar">{query?<span className="search-term">“{query}”</span>:<span className="quiet-meta">{activeCategory?.closed?'归档分类':''}</span>}<label className="archive-control"><input type="checkbox" checked={archive} onChange={event=>setArchive(event.target.checked)}/>显示归档</label></div><div className="entry-grid">{indexCards.map(cardTile)}</div>{!indexCards.length&&<div className="empty-state"><h2>没有匹配条目</h2><p>试试其他关键词或分类。</p></div>}</>}</>}
     {route.view==='wardrobe'&&<><div hidden={!!route.item}><Wardrobe data={wardrobe} query={clothesQuery} filters={filters} onFilters={setFilters} onOpen={openItem} onReset={()=>{setFilters(initialWardrobeFilters);setClothesQuery('')}}/></div>{route.item&&(item?<WardrobeReader item={item} onBack={()=>navigate('/wardrobe')}/>:<div className="empty-state"><h1>外观不存在</h1><button className="subtle-button" onClick={()=>navigate('/wardrobe')}>返回衣柜</button></div>)}</>}
     {route.view==='saved'&&<><header className="page-heading"><div><p className="eyebrow">当前浏览器</p><h1>收藏</h1></div><span className="quiet-meta">{indexCards.length} 条目</span></header><div className="entry-grid">{indexCards.map(cardTile)}</div>{!indexCards.length&&<div className="empty-state"><Bookmark size={28}/><h2>{query?'没有匹配收藏':'尚无收藏'}</h2><p>打开条目后可收藏。</p></div>}</>}
     {route.view==='sources'&&<section className="sources-page"><header className="page-heading"><div><p className="eyebrow">学乱 Wiki</p><h1>来源</h1></div><span className="quiet-meta">{board.checkedAt}</span></header><section className="source-block"><h2>官方资料</h2><p>条目、衣柜、图片与演示均整理自官方公开 Trello。原卡未给出的名称、稀有度和资产ID保持空缺；未逐项标注的外观以图集展示。</p><div className="source-stats"><span><b>{board.stats.sourceCards}</b>来源卡片</span><span><b>{board.stats.perks}</b>天赋译文</span><span><b>{board.stats.videos}</b>演示</span></div><div className="source-links"><a href={board.source} target="_blank" rel="noreferrer">官方 Trello<ArrowUpRight size={15}/></a><a href="https://www.roblox.com/games/128736949265057/Gakuran" target="_blank" rel="noreferrer">Roblox 游戏<ArrowUpRight size={15}/></a><a href="https://discord.gg/gakuran" target="_blank" rel="noreferrer">官方 Discord<ArrowUpRight size={15}/></a><a href="https://github.com/Rowland786/gakuran-cn" target="_blank" rel="noreferrer">本站源码<ArrowUpRight size={15}/></a></div></section><section className="source-block"><h2>版本与差异</h2><p>更新公告与旧卡片不一致时，在相关条目中注明。已从原卡移除的觉醒条件保留为历史记录。兑换码及数值未经游戏内实测。</p><p>收藏保存在当前浏览器。图像与游戏资料归原权利人。</p></section></section>}
    </>}
   </div>}
  </main></div>
 </div>;
}
