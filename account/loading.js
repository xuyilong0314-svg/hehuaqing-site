import {resolveLoadingTheme,loadingBlessing,loadingArt} from './loading-themes.js?v=20261118-loading-2';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themeFor=options=>resolveLoadingTheme({pathname:globalThis.location?.pathname||'',hash:globalThis.location?.hash||'',...options});
export function loadingMarkup(title='正在打开页面',detail='已经收到您的点击，请稍候。',options={}){
 const theme=themeFor({...options,title}),wish=options.blessing??loadingBlessing(theme);
 return `<div class="hhq-loading" data-loading-theme="${theme}" role="status" aria-live="polite" aria-atomic="true">${loadingArt(theme)}<strong data-loading-title>${esc(title)}</strong><p data-loading-detail>${esc(detail)}</p><p class="hhq-loading-wish" data-loading-wish>${esc(wish)}</p><small data-loading-note>${esc(options.note??'无需重复点击，完成后会自动显示。')}</small><div class="hhq-loading-breath" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
}
export function singleFlight(){const tasks=new Map();return (key,work)=>{if(tasks.has(key))return tasks.get(key);const job=Promise.resolve().then(work);const pending=job.finally(()=>{if(tasks.get(key)===pending)tasks.delete(key);});tasks.set(key,pending);return pending;};}
// One foreground wait owns the visual until all nested work is finished.
export function createLoadingController(doc=globalThis.document,{delay=160,slowAfter=8000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const tasks=new Map();let serial=0,host=null,showTimer=null,slowTimer=null,previousFocus=null,installed=false,busyRegion=null,wasInert=false,session=null;
 const blocked=e=>{if(tasks.size&&e.target?.closest?.('button,a,input,select,textarea,form')){e.preventDefault();e.stopImmediatePropagation();}};
 function mount(){const parent=doc.querySelector('dialog[open]')||doc.body;if(host.parentElement!==parent)parent.append(host);}
 function ensure(){if(!installed){doc.addEventListener('click',blocked,true);doc.addEventListener('submit',blocked,true);doc.addEventListener('cancel',e=>{if(tasks.size)e.preventDefault();},true);installed=true;}if(!host){host=doc.createElement('div');host.className='hhq-loading-overlay';host.hidden=true;}mount();}
 function draw(){const current=[...tasks.values()].at(-1);if(!current)return;mount();host.querySelector('[data-loading-title]').textContent=current.title;host.querySelector('[data-loading-detail]').textContent=current.detail;host.querySelector('[data-loading-note]').textContent=current.slow?'这次连接有些慢，仍在处理中，请不要重复提交。':'无需重复点击，完成后会自动显示。';}
 function end(id){const entry=tasks.get(id);if(!entry)return;tasks.delete(id);if(entry.button){entry.button.disabled=entry.wasDisabled;entry.button.innerHTML=entry.label;entry.button.removeAttribute('aria-busy');}if(tasks.size){draw();return;}clearTimer(showTimer);clearTimer(slowTimer);showTimer=slowTimer=null;host.hidden=true;doc.body.append(host);if(busyRegion){busyRegion.removeAttribute('aria-busy');busyRegion.inert=wasInert;busyRegion=null;}doc.body.classList.remove('hhq-is-loading');if(previousFocus?.isConnected&&doc.activeElement===doc.body)previousFocus.focus?.({preventScroll:true});previousFocus=null;session=null;}
 function begin({title='正在打开页面',detail='已经收到您的点击，请稍候。',button=null,theme}={}){
  ensure();const id=++serial,wasEmpty=!tasks.size,entry={title,detail,button,wasDisabled:button?.disabled,label:button?.innerHTML,slow:false};tasks.set(id,entry);
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=title+'…';}
  if(wasEmpty){session={theme:themeFor({title,theme})};session.blessing=loadingBlessing(session.theme);host.innerHTML=loadingMarkup(title,detail,session);previousFocus=doc.activeElement;busyRegion=doc.querySelector('#app')||doc.querySelector('#account-app')||doc.querySelector('#workspace');if(busyRegion&&!busyRegion.contains?.(host)){wasInert=busyRegion.inert;busyRegion.inert=true;busyRegion.setAttribute('aria-busy','true');}else busyRegion=null;doc.body.classList.add('hhq-is-loading');showTimer=setTimer(()=>{if(tasks.size){host.hidden=false;draw();}},delay);slowTimer=setTimer(()=>{for(const entry of tasks.values())entry.slow=true;draw();},slowAfter);}
  draw();return {update(nextTitle,nextDetail){if(!tasks.has(id))return;entry.title=nextTitle;if(nextDetail!==undefined)entry.detail=nextDetail;draw();},finish(){end(id);}};
 }
 return {begin,isBusy:()=>tasks.size>0};
}
let shared;
export function beginLoading(options){return (shared||(shared=createLoadingController())).begin(options);}
export async function withLoading(options,work){const feedback=beginLoading(options);try{return await work(feedback);}finally{feedback.finish();}}
