"use client";
import {ArrowUpRight,ExternalLink} from 'lucide-react';
export type Attachment={id:string;name:string;url:string;type:string;local?:string|null;unavailable?:boolean;unavailableReason?:string;embedded?:boolean;videoLocal?:string;posterLocal?:string;duration?:number;width?:number;height?:number;label?:string;inline?:boolean;placement?:'body'|'awakening'};
const asset=(file:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}/${file.replace(/^\//,'')}`;
const sourceURL=(url:string)=>/^https?:\/\//i.test(url)?url:'#';
export function DemoVideo({media}:{media:Attachment}){return <figure className="demo-video"><video controls playsInline loop preload="none" poster={asset(media.posterLocal!)} src={asset(media.videoLocal!)} width={media.width} height={media.height} tabIndex={0} aria-label={media.label||'演示'} onPlay={e=>{document.querySelectorAll<HTMLVideoElement>('.demo-video video').forEach(v=>{if(v!==e.currentTarget)v.pause()})}}/><figcaption><span>{media.label||'演示'}</span><a href={sourceURL(media.url)} target="_blank" rel="noreferrer">原始附件<ArrowUpRight size={11}/></a></figcaption></figure>}
export function Media({media}:{media:Attachment}){
 if(media.videoLocal)return <DemoVideo media={media}/>;
 return <figure className="inline-image">{media.local?<a href={asset(media.local)} target="_blank" rel="noreferrer"><img src={asset(media.local)} alt={media.label||'配图'} loading="lazy" decoding="async"/></a>:<div className="media-unavailable"><ExternalLink size={17}/><span>原附件不可用{media.unavailableReason?' · '+media.unavailableReason:''}</span></div>}<figcaption><span>{media.label||'配图'}</span><a href={sourceURL(media.url)} target="_blank" rel="noreferrer">原始附件<ArrowUpRight size={11}/></a></figcaption></figure>
}
