import {pages,routes} from './catalog.js?v=20261105-reading-1';
export function readingPath(pathname,hash,readingId='',base='/') {
 if(!pathname.startsWith(base))return null;
 const relative='/'+pathname.slice(base.length);
 if(/^\/(analytics|account|team)(\/|$)/.test(relative))return null;
 if(relative.startsWith('/zhongyi/aform/'))return '/zhongyi/aform/index.html';
 const route=String(hash||'').split('?')[0];
 // Only catalogue IDs; never inspect protected prose, forms, or search text.
 if(/^geming-de-zuzhi-luoji\/(?:[0-9]|[12][0-9]|3[0-3])$/.test(readingId)){const p='/books/'+readingId+'.html';if(pages[p])return p;}
 if(routes[route])return routes[route];
 if(/^#articles\//.test(route))return '/articles.html';
 if(/^#music\//.test(route))return routes[route.split('/').slice(0,2).join('/')]||null;
 if(/^#(?:read|books|article|music|search)(?:\/|$)/.test(route))return null;
 if((relative==='/'||relative==='/index.html')&&(!route||route==='#entrance'))return '/entrance.html';
 let p=relative.endsWith('/')?relative+'index.html':relative;if(p==='/index.html')p='/home.html';return pages[p]?p:null;
}
export function progressDepth(rect,viewport,documentHeight,scroll,reading=false){
 if(reading&&!rect)return 0;
 if(rect)return Math.max(0,Math.min(100,Math.round((viewport-rect.top)/Math.max(1,rect.height)*100)));
 return Math.max(0,Math.min(100,Math.round((scroll+viewport)/Math.max(1,documentHeight)*100)));
}
export function isReading(path){return ['chapter','article','poetry'].includes(pages[path]?.kind);}
