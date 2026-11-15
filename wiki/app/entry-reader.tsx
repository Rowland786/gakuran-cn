"use client";
import {ArrowLeft,ArrowUpRight,Bookmark,ChevronDown} from 'lucide-react';
import {Markdown} from './content';
import {Media} from './media';
import {AwakeningFlow,AwakeningGuide} from './awakening';
import type {Board,Card} from './wiki-types';

export function EntryReader({card,board,saved,onBookmark,onBack}:{card:Card;board:Board;saved:boolean;onBookmark:()=>void;onBack:()=>void}){
 const extra=card.attachments.filter(a=>!a.inline&&a.placement!=='awakening');
 const images=extra.filter(a=>!a.videoLocal),videos=extra.filter(a=>a.videoLocal);
 const prefix=`entry-${card.id}`;
 const headings=[...card.body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>m[1].replace(/\*\*/g,''));
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 return <article className="entry-reader" aria-label={card.title}>
  <div className="reader-toolbar"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/>返回目录</button><button className={`icon-action ${saved?'is-saved':''}`} onClick={onBookmark} aria-label={saved?'取消收藏':'收藏条目'} aria-pressed={saved}><Bookmark size={17} fill={saved?'currentColor':'none'}/><span>{saved?'已收藏':'收藏'}</span></button></div>
  <header className="entry-heading"><p className="eyebrow">{board.lists.find(l=>l.id===card.listId)?.title}{card.closed&&' / 归档'}</p><h1>{card.title}</h1>{card.english!==card.title&&<p className="entry-alias">{card.english}</p>}<div className="entry-meta"><span>同步 {board.checkedAt}</span><a href={card.source} target="_blank" rel="noreferrer">官方原卡<ArrowUpRight size={13}/></a></div></header>
  {!!card.updates?.length&&<aside className="version-note"><span className="small-label">v14</span><div>{card.updates.map((text,i)=><p key={i}>{text}</p>)}<a href="#/card/Lje7HJrQ">更新日志<ArrowUpRight size={12}/></a></div></aside>}
  {headings.length>3&&<details className="entry-contents"><summary>目录<ChevronDown size={14}/></summary><nav aria-label="条目目录">{card.awakening&&<button onClick={()=>jump(prefix+'-awakening')}>觉醒流程</button>}{!!card.perks?.length&&<button onClick={()=>jump(prefix+'-perks')}>天赋</button>}{headings.map((title,i)=><button key={i} onClick={()=>jump(`${prefix}-s${i}`)}>{title}</button>)}</nav></details>}
  {card.awakening&&<section className="reader-section" id={prefix+'-awakening'}><AwakeningFlow flow={card.awakening}/></section>}
  {!!card.perks?.length&&<section className="reader-section" id={prefix+'-perks'}><h2>天赋</h2><div className="perks-list">{card.perks.map(p=><div className="perk" key={p.english}><h3>{p.title}</h3><small>{p.english}</small><p>{p.body}</p></div>)}</div></section>}
  {card.body&&<section className="reader-section"><Markdown text={card.body} attachments={card.attachments} headingPrefix={prefix}/></section>}
  {card.awakeningGuide&&<section className="reader-section"><AwakeningGuide key={card.id} flows={card.awakeningGuide}/></section>}
  {!!card.notes?.length&&<aside className="translation-notes"><h2>资料差异</h2>{card.notes.map((text,i)=><p key={i}>{text}</p>)}</aside>}
  {!card.body&&!card.perks?.length&&<p className="muted">原卡未填写文字说明。</p>}
  {!!videos.length&&<details className="attachment-section"><summary>补充演示<span>{videos.length}</span><ChevronDown size={15}/></summary><div className="supplemental-demos-list">{videos.map(media=><Media key={media.id} media={media}/>)}</div></details>}
  {!!images.length&&<details className="attachment-section" open={!card.body&&!card.perks?.length}><summary>{card.body?'补充图片':'图片'}<span>{images.length}</span><ChevronDown size={15}/></summary><div className="attachment-grid">{images.map(media=><Media key={media.id} media={media}/>)}</div></details>}
  <footer className="reader-footer"><a href={card.source} target="_blank" rel="noreferrer">查看官方原卡<ArrowUpRight size={13}/></a><span>{board.checkedAt}</span></footer>
 </article>;
}
