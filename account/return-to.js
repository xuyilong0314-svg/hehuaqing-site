// Only allow known same-site entry points. A destination never grants access.
const key='hhq-login-return-v1',ttl=30*60*1000;
function sessionStore(){try{return globalThis.sessionStorage;}catch{return null;}}
export function safeHealthRoute(value=''){
 const route=String(value).replace(/^#/,'');
 if(route.length>600||/[\\\s<>]/.test(route))return '';
 if(!/^\/(home|new|due|clients|records|collect|students|account|trash|library|comparisons|member\/[a-zA-Z0-9_-]+|(?:case|edit)\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)(?:\?[^#]*)?$/.test(route))return '';
 const [path,query='']=route.split('?');const clean=new URLSearchParams();
 for(const [k,v] of new URLSearchParams(query))if(['stage','visit','owner'].includes(k)&&/^[a-zA-Z0-9_-]{1,100}$/.test(v))clean.set(k,v);
 return path+(clean.size?'?'+clean:'');
}
export function safeReturn(value=''){
 if(typeof value!=='string'||value.length>900||!value.startsWith('/')||value.startsWith('//')||/[\\\s<>]/.test(value))return '';
 let url;try{url=new URL(value,'https://return.invalid');}catch{return '';}
 if(url.origin!=='https://return.invalid'||url.search||url.username||url.password)return '';
 if(url.pathname==='/zhongyi/aform/'){const route=safeHealthRoute(url.hash);return route?url.pathname+'#'+route:'';}
 if(url.pathname==='/zhongyi/aform/numbers/'&&/^(?:#(?:permissions|case\/[a-zA-Z0-9_-]+))?$/.test(url.hash))return url.pathname+url.hash;
 if(url.pathname==='/team/'&&/^(?:#[a-zA-Z0-9_/?=&%-]*)?$/.test(url.hash))return url.pathname+url.hash;
 return '';
}
export function rememberReturn(value,storage=sessionStore(),now=Date.now()){
 const target=safeReturn(value);if(!target)return '';try{storage?.setItem(key,JSON.stringify({target,at:now}));}catch{}return target;
}
export function pendingReturn(storage=sessionStore(),now=Date.now()){
 try{const entry=JSON.parse(storage?.getItem(key)||'null');return entry&&now-entry.at>=0&&now-entry.at<ttl?safeReturn(entry.target):'';}catch{return '';}
}
export function clearReturn(storage=sessionStore()){try{storage?.removeItem(key);}catch{}}
export function captureReturn(loc=globalThis.location){
 const explicit=safeReturn(new URLSearchParams(loc.search||'').get('return')||'');
 const route=safeHealthRoute(loc.hash);
 return rememberReturn(explicit||(route?'/zhongyi/aform/#'+route:''))||pendingReturn();
}
export function loginHref(target){const safe=safeReturn(target);return '/zhongyi/aform/'+(safe?'?return='+encodeURIComponent(safe):'')+'#/auth';}
