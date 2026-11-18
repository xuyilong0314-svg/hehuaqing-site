const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function loadingMarkup(title='正在打开页面',detail='已经收到您的点击，请稍候。'){
 return `<div class="hhq-loading" role="status" aria-live="polite" aria-atomic="true"><div class="hhq-loading-art" aria-hidden="true"><svg viewBox="0 0 120 104"><path class="hhq-loading-track" d="M60 14 106 88 14 88Z"/><path class="hhq-loading-draw" d="M60 14 106 88 14 88Z"/><circle class="hhq-loading-dot dot-one" cx="60" cy="14" r="6"/><circle class="hhq-loading-dot dot-two" cx="106" cy="88" r="6"/><circle class="hhq-loading-dot dot-three" cx="14" cy="88" r="6"/></svg><span>上</span></div><strong data-loading-title>${esc(title)}</strong><p data-loading-detail>${esc(detail)}</p><small data-loading-note>无需重复点击，完成后会自动显示。</small><div class="hhq-loading-breath" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
}
export function singleFlight(){const tasks=new Map();return (key,work)=>{if(tasks.has(key))return tasks.get(key);const job=Promise.resolve().then(work);const pending=job.finally(()=>{if(tasks.get(key)===pending)tasks.delete(key);});tasks.set(key,pending);return pending;};}
// Nested operations share one indicator; an older completion never hides newer work.
export function createLoadingController(doc=globalThis.document,{delay=160,slowAfter=8000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const tasks=new Map();let serial=0,host=null,showTimer=null,slowTimer=null,previousFocus=null,installed=false,busyRegion=null,wasInert=false;
 const blocked=e=>{if(tasks.size&&e.target?.closest?.('button,a,input,select,textarea,form')){e.preventDefault();e.stopImmediatePropagation();}};
 function ensure(){if(!installed){doc.addEventListener('click',blocked,true);doc.addEventListener('submit',blocked,true);installed=true;}if(!host){host=doc.createElement('div');host.className='hhq-loading-overlay';host.hidden=true;host.innerHTML=loadingMarkup();doc.body.append(host);}}
 function draw(){const current=[...tasks.values()].at(-1);if(!current)return;host.querySelector('[data-loading-title]').textContent=current.title;host.querySelector('[data-loading-detail]').textContent=current.detail;host.querySelector('[data-loading-note]').textContent=current.slow?'这次连接有些慢，仍在处理中，请不要重复提交。':'无需重复点击，完成后会自动显示。';}
 function end(id){const entry=tasks.get(id);if(!entry)return;tasks.delete(id);if(entry.button){entry.button.disabled=entry.wasDisabled;entry.button.innerHTML=entry.label;entry.button.removeAttribute('aria-busy');}if(tasks.size){draw();return;}clearTimer(showTimer);clearTimer(slowTimer);showTimer=slowTimer=null;host.hidden=true;if(busyRegion){busyRegion.removeAttribute('aria-busy');busyRegion.inert=wasInert;busyRegion=null;}doc.body.classList.remove('hhq-is-loading');if(previousFocus?.isConnected&&doc.activeElement===doc.body)previousFocus.focus?.({preventScroll:true});previousFocus=null;}
 function begin({title='正在打开页面',detail='已经收到您的点击，请稍候。',button=null}={}){
  ensure();const id=++serial,wasEmpty=!tasks.size,entry={title,detail,button,wasDisabled:button?.disabled,label:button?.innerHTML,slow:false};tasks.set(id,entry);
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=title+'…';}
  if(wasEmpty){previousFocus=doc.activeElement;busyRegion=doc.querySelector('#app')||doc.querySelector('#account-app')||doc.querySelector('#workspace');if(busyRegion){wasInert=busyRegion.inert;busyRegion.inert=true;busyRegion.setAttribute('aria-busy','true');}doc.body.classList.add('hhq-is-loading');showTimer=setTimer(()=>{if(tasks.size){host.hidden=false;draw();}},delay);slowTimer=setTimer(()=>{for(const entry of tasks.values())entry.slow=true;draw();},slowAfter);}
  draw();return {update(nextTitle,nextDetail){if(!tasks.has(id))return;entry.title=nextTitle;if(nextDetail!==undefined)entry.detail=nextDetail;draw();},finish(){end(id);}};
 }
 return {begin,isBusy:()=>tasks.size>0};
}
let shared;
export function beginLoading(options){return (shared||(shared=createLoadingController())).begin(options);}
