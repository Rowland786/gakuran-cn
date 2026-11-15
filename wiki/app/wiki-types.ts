import type {Attachment} from './media';
import type {Awakening} from './awakening';

export type Card = {
 id:string;title:string;english:string;listId:string;body:string;original:string;source:string;
 closed:boolean;separator:boolean;cover?:string;coverColor?:string;attachments:Attachment[];
 perks?:{title:string;english:string;body:string}[];notes?:string[];updates?:string[];
 awakening?:Awakening;awakeningGuide?:Awakening[];articleId?:string;updated:string;
};
export type Board = {
 title:string;checkedAt:string;source:string;lists:{id:string;title:string;closed:boolean}[];cards:Card[];
 articleMap:Record<string,string>;stats:{sourceCards:number;activeCards:number;translatedCards:number;attachments:number;perks:number;videos:number};
};
export type WardrobeItem = {
 id:string;name:string|null;originalName?:string;sourceGroup?:string;ethnicity?:string;kind?:'item'|'gallery';category:string;slot?:string;
 gender:string;rarity:string|null;chance?:string;availability:'current'|'limited'|'archived';
 assetIds:string[];media:Attachment[];sourceCardId:string;sourceCardTitle:string;sourceURL:string;description?:string;
};
export type WardrobeData = {checkedAt:string;source:string;items:WardrobeItem[];stats:Record<string,number>};
export const asset=(file:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}/${file.replace(/^\//,'')}`;
export const safeURL=(url:string)=>/^https?:\/\//i.test(url)?url:'#';
