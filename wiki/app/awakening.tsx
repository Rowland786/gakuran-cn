"use client";
import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';

export type Awakening={articleId:string;cardId:string;title:string;stages:{body:string}[];notice?:string;notes:string[];source:string;reference?:string};
const referenceURL=(file:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}/${file}`;

export function AwakeningFlow({flow,linked=false}:{flow:Awakening;linked?:boolean}){
 const Heading=linked?'h3':'h2';
 return <article className="awakening-flow"><header><Heading>{linked?<a href={`#/card/${flow.cardId}`}>{flow.title}<ArrowUpRight size={14}/></a>:'觉醒流程'}</Heading>{!linked&&<a href="#/card/d71UNOzJ">通用规则<ArrowUpRight size={13}/></a>}</header>
 {flow.stages.length?<ol className="awakening-stages">{flow.stages.map((stage,i)=><li key={i}><h4>阶段{['一','二','三'][i]}</h4><p>{stage.body}</p></li>)}</ol>:<p className="awakening-pending">{flow.notice}</p>}
 {!!flow.notes.length&&<div className="awakening-notes"><h4>资料差异</h4>{flow.notes.map((note,i)=><p key={i}>{note}</p>)}</div>}
 <footer><a href={flow.source} target="_blank" rel="noreferrer">{flow.stages.length?'Trello任务卡':'更新公告'}<ArrowUpRight size={12}/></a>{flow.reference&&<a href={referenceURL(flow.reference)} target="_blank" rel="noreferrer">任务图（版本未标注）<ArrowUpRight size={12}/></a>}</footer>
 </article>
}

export function AwakeningGuide({flows}:{flows:Awakening[]}){
 const [selected,setSelected]=useState('all');
 return <section className="awakening-guide"><header><h2>觉醒流程</h2><select aria-label="筛选觉醒风格" value={selected} onChange={e=>setSelected(e.target.value)}><option value="all">全部风格</option>{flows.map(flow=><option key={flow.articleId} value={flow.articleId}>{flow.title}{!flow.stages.length?'（条件待补）':''}</option>)}</select></header><div className="awakening-flow-list">{flows.filter(flow=>selected==='all'||flow.articleId===selected).map(flow=><AwakeningFlow key={flow.articleId} flow={flow} linked/>)}</div></section>
}
