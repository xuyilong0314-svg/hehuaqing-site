(() => {
 'use strict';
 const ROOT='/books/',slug=location.pathname.match(/^\/books\/([a-z0-9-]+)\//)?.[1];
 if(!document.querySelector('link[href$="offline.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href=ROOT+'offline.css';document.head.append(l);}
 if(!document.querySelector('link[rel="manifest"]')){const l=document.createElement('link');l.rel='manifest';l.href=ROOT+'manifest.webmanifest';document.head.append(l);}
 let registrationPromise;
 async function worker(){
  if(!('serviceWorker' in navigator)||!isSecureContext)throw Error('此浏览器暂不支持离线保存，请用 Safari 或 Chrome 打开本站');
  if(!registrationPromise)registrationPromise=navigator.serviceWorker.register(ROOT+'sw.js',{scope:ROOT,updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready);
  const reg=await registrationPromise;return reg.active;
 }
 function request(type,book,onProgress){return new Promise(async(resolve,reject)=>{let timer;try{const sw=await worker(),channel=new MessageChannel();const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>{channel.port1.close();reject(Error('保存超时，请确认网络后重试'));},60000);};reset();channel.port1.onmessage=({data})=>{reset();if(data.type==='progress'){onProgress?.(data);return;}clearTimeout(timer);channel.port1.close();if(data.type==='error')reject(Error(data.message));else resolve(data.data);};sw.postMessage({type,slug:book},[channel.port2]);}catch(e){clearTimeout(timer);reject(e);}});}
 const size=bytes=>bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':Math.ceil(bytes/1024)+' KB';
 async function attachPanel(parent,book){
  const section=document.createElement('section');section.className='offline-panel';section.setAttribute('aria-label','离线阅读');
  const p=document.createElement('p');p.textContent=book.access==='password'?'保存加密副本，断网后输入密码阅读。':'将整本书保存到当前设备，断网后也能继续阅读。';
  const button=document.createElement('button');button.type='button';button.textContent='保存整书，离线阅读';
  const remove=document.createElement('button');remove.type='button';remove.textContent='移除本机副本';remove.className='offline-remove';remove.hidden=true;
  const a=document.createElement('a');a.href=ROOT+'offline.html';a.textContent='打开离线书架 →';
  const status=document.createElement('small');status.className='offline-status';status.setAttribute('role','status');status.textContent='首次保存需要网络。';section.append(p,button,remove,a,status);parent.append(section);
  const show=state=>{remove.hidden=!state;button.textContent=state?'更新离线副本':'保存整书，离线阅读';status.textContent=state?`已完整保存 · ${size(state.bytes)} · ${new Date(state.savedAt).toLocaleDateString('zh-CN')}。可断网阅读。`:'尚未保存。首次保存需要网络。';};
  try{show((await request('LIST')).find(x=>x.slug===book.slug));}catch(e){status.textContent=e.message;button.disabled=true;}
  button.addEventListener('click',async()=>{button.disabled=true;remove.disabled=true;status.textContent='正在准备完整保存…';try{const state=await request('SAVE',book.slug,({count,total})=>status.textContent=`正在保存 ${count} / ${total}，请保持本页打开…`);show(state);try{await navigator.storage?.persist?.();}catch{}}catch(e){status.textContent=e.message+'；已有完整副本会保留。';}finally{button.disabled=false;remove.disabled=false;}});
  remove.addEventListener('click',async()=>{remove.disabled=true;try{await request('REMOVE',book.slug);show(null);}catch(e){status.textContent=e.message;}finally{remove.disabled=false;}});
 }
 async function init(){
  const library=document.querySelector('[data-offline-library]');
  if(library){const box=document.querySelector('#offline-books');try{const r=await fetch(ROOT+'catalog.json');if(!r.ok)throw Error();const catalog=await r.json();box.replaceChildren();for(const book of catalog.books.filter(b=>b.published)){const article=document.createElement('article');article.className='offline-card';const img=document.createElement('img');img.src=new URL(book.cover,new URL(ROOT,location.origin)).href;img.alt=book.title+'封面';const body=document.createElement('div');const h=document.createElement('h2');h.textContent=book.title;const a=document.createElement('a');a.href=new URL(book.reader,new URL(ROOT,location.origin)).href;a.textContent=book.access==='password'?'输入密码阅读 →':'打开阅读 →';const p=document.createElement('p');p.textContent=book.contents;body.append(h,p,a);article.append(img,body);box.append(article);await attachPanel(body,book);}}catch{box.textContent='尚未载入书架。请联网打开本页一次，再保存需要的书。';}return;}
  if(slug){const book={slug,access:document.body.dataset.access||'free'};if(document.body.dataset.page==='book'||document.body.dataset.page==='locked'){const target=document.querySelector('[data-offline-slot]')||document.querySelector('.book-intro')||document.querySelector('main');if(target)await attachPanel(target,book);}else{const header=document.querySelector('.book-header, .reader-header');if(header&&!header.querySelector('.offline-nav')){const a=document.createElement('a');a.href=ROOT+'offline.html';a.textContent='离线书架';a.className='offline-nav';header.append(a);}worker().catch(()=>{});}}
 }
 let installPrompt;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const b=document.querySelector('#install-books');if(b){b.hidden=false;b.onclick=async()=>{await installPrompt.prompt();installPrompt=null;b.hidden=true;};}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
