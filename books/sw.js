/* Public pages and authenticated ciphertext only. No password or plaintext from the locked reader is cached. */
'use strict';
const SHELL='hhq-books-shell-20261104-symphony-1', STATE='hhq-books-state-v1';
const SHELL_URLS=['/books/','/books/index.html','/books/books.css','/books/catalog.json','/books/offline.html','/books/offline.js','/books/offline.css','/books/manifest.webmanifest','/books/icon.svg','/books/site-bridge.js','/assets/symphony-serif.woff2'];
const jobs=new Set();
const validSlug=s=>typeof s==='string'&&/^[a-z0-9-]{1,64}$/.test(s);
const stateUrl=slug=>new URL('/books/__saved__/'+slug,location.origin).href;
const canonical=request=>{const u=new URL(typeof request==='string'?request:request.url,location.origin);u.search='';u.hash='';return u.href;};
async function states(){const c=await caches.open(STATE);const out=[];for(const r of await c.keys()){try{out.push(await(await c.match(r)).json());}catch{}}return out;}
async function saved(slug){const r=await(await caches.open(STATE)).match(stateUrl(slug));return r?await r.json():null;}
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(SHELL);await c.addAll(SHELL_URLS);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();for(const k of await caches.keys())if(k.startsWith('hhq-books-shell-')&&k!==SHELL)await caches.delete(k);})()));
async function findCached(request){const key=canonical(request);for(const s of await states()){const r=await(await caches.open(s.cache)).match(key);if(r)return r;}return(await caches.open(SHELL)).match(key);}
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==location.origin||(!u.pathname.startsWith('/books/')&&u.pathname!=='/assets/symphony-serif.woff2'))return;event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok)return response;const cached=await findCached(event.request);return cached||response;}catch{const cached=await findCached(event.request);if(cached)return cached;if(event.request.mode==='navigate')return new Response('<!doctype html><meta charset="utf-8"><title>尚未离线保存</title><p>这一页还没有保存到本机。</p><p><a href="/books/offline.html">打开离线书架</a></p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});return Response.error();}})());});
const sha=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),x=>x.toString(16).padStart(2,'0')).join('');
async function saveBook(slug,port){
 if(!validSlug(slug))throw Error('书籍标识无效');if(jobs.has(slug))throw Error('这本书正在保存，请稍候');jobs.add(slug);
 let staging,committed=false;
 try{
  const mr=await fetch('/books/offline-packs/'+slug+'.json',{cache:'no-store'});if(!mr.ok)throw Error('暂时无法取得书籍清单，请联网后再试');const manifest=await mr.json();
  if(manifest.slug!==slug||!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>1000||!/^[a-f0-9]{16}$/.test(manifest.revision))throw Error('书籍清单无效');
  staging='hhq-book-'+slug+'-'+manifest.revision+'-'+Date.now();const cache=await caches.open(staging);let count=0,bytes=0;
  for(const entry of manifest.files){
   const u=new URL(entry.url,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/books/'+slug+'/')||u.search||u.hash||! /^[a-f0-9]{64}$/.test(entry.sha256))throw Error('书籍清单包含无效资源');
   const r=await fetch(u.href,{cache:'no-store'});if(!r.ok)throw Error('部分内容未能下载，请保持网络后重试');const buffer=await r.arrayBuffer();
   if(buffer.byteLength!==entry.bytes||await sha(buffer)!==entry.sha256)throw Error('书籍版本正在更新，请稍后重新保存');
   await cache.put(u.href,new Response(buffer,{status:200,headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}}));
   // Directory URLs need their own key for offline navigation.
   if(u.pathname.endsWith('/index.html'))await cache.put(u.href.slice(0,-10),(await cache.match(u.href)).clone());
   bytes+=buffer.byteLength;port.postMessage({type:'progress',count:++count,total:manifest.files.length});
  }
  const value={slug,cache:staging,revision:manifest.revision,bytes,files:count,savedAt:Date.now()};
  await(await caches.open(STATE)).put(stateUrl(slug),new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}}));committed=true;
  for(const k of await caches.keys())if(k.startsWith('hhq-book-'+slug+'-')&&k!==staging)await caches.delete(k);
  return value;
 }finally{jobs.delete(slug);if(staging&&!committed)await caches.delete(staging);}
}
self.addEventListener('message',event=>{const port=event.ports[0];if(!port)return;event.waitUntil((async()=>{try{const {type,slug}=event.data||{};if(type==='LIST')return port.postMessage({type:'done',data:await states()});if(!validSlug(slug))throw Error('书籍标识无效');if(type==='SAVE')return port.postMessage({type:'done',data:await saveBook(slug,port)});if(type==='REMOVE'){if(jobs.has(slug))throw Error('正在保存，请完成后再移除');const value=await saved(slug);if(value)await caches.delete(value.cache);await(await caches.open(STATE)).delete(stateUrl(slug));return port.postMessage({type:'done',data:true});}throw Error('不支持的操作');}catch(error){port.postMessage({type:'error',message:error.message||'保存未完成，请联网后重试'});}})());});
