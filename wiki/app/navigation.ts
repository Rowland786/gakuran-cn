export type Route={view:'board'|'wardrobe'|'saved'|'sources';category?:string;card?:string;item?:string};
export function routeFromHash(hash:string):Route{
 let value='';try{value=decodeURIComponent(hash.replace(/^#/,''))}catch{return {view:'board'}}
 if(value.startsWith('/card/'))return {view:'board',card:value.slice(6)};
 if(value.startsWith('/entry/'))return {view:'board',card:'@'+value.slice(7)};
 if(value.startsWith('/category/'))return {view:'board',category:value.slice(10)};
 if(value.startsWith('/wardrobe/item/'))return {view:'wardrobe',item:value.slice(15)};
 if(value==='/wardrobe')return {view:'wardrobe'};
 if(value==='/saved'||value==='/notebook')return {view:'saved'};
 if(value==='/sources')return {view:'sources'};
 return {view:'board'};
}
