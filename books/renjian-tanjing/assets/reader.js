(()=>{
'use strict';
const $=id=>document.getElementById(id),data=JSON.parse($('reader-data').textContent),key='hehuaqing.tanjing.reader.v2';
let state={size:20,theme:'light',font:'serif',position:null},active=null,saveTimer=0,frame=0,restoring=false,dialogPosition=null;
try{Object.assign(state,JSON.parse(localStorage.getItem(key)||'{}'));}catch(e){}
state.size=Math.max(16,Math.min(28,Number(state.size)||20));
if(!['light','dark'].includes(state.theme))state.theme='light';
if(!['serif','sans'].includes(state.font))state.font='serif';
const units=data.units,byId=new Map(units.map(u=>[u.id,u])),anchors=new Map();
units.forEach(u=>{anchors.set(u.id,u.id);document.querySelectorAll('#'+u.id+' [id]').forEach(el=>anchors.set(el.id,u.id));});
const store=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}};
const fontsReady=document.fonts?document.fonts.ready:Promise.resolve();
function applySettings(){
 document.documentElement.dataset.theme=state.theme;
 document.documentElement.style.setProperty('--reading-size',state.size+'px');
 document.documentElement.style.setProperty('--reading-face',state.font==='serif'?'var(--serif)':'var(--sans)');
 $('size-value').textContent=state.size+' px';$('size-down').disabled=state.size<=16;$('size-up').disabled=state.size>=28;
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===state.theme)));
 document.querySelectorAll('[data-font-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fontChoice===state.font)));
}
function currentLabel(){const u=byId.get(active);if(!u)return '';let label=u.title;for(const h of u.heads){if($(h.id)?.getBoundingClientRect().top<=150)label=h.label;}return label;}
function getPosition(){
 if(!active)return null;
 const nodes=[...$(active).querySelectorAll('[data-reader-block]')];let chosen=nodes[0];
 for(const el of nodes){if(el.getBoundingClientRect().top<=105)chosen=el;else break;}
 return {unit:active,block:chosen?.id||active,offset:chosen?105-chosen.getBoundingClientRect().top:0,label:currentLabel(),time:Date.now()};
}
function restorePosition(p){if(!p||!$(p.block))return;const top=$(p.block).getBoundingClientRect().top+scrollY-105+p.offset;scrollTo({top:Math.max(0,top),behavior:'instant'});}
function persist(){if(!active||restoring||document.querySelector('dialog[open]'))return;state.position=getPosition();store();}
function findSection(){const u=byId.get(active);let id=active;for(const h of u.heads){if($(h.id)?.getBoundingClientRect().top<=150)id=h.id;}return id;}
function updateProgress(){
 if(!active)return;const u=byId.get(active),index=units.indexOf(u),height=Math.max(1,$(active).offsetHeight-innerHeight+150),fraction=Math.max(0,Math.min(1,(scrollY-$('reader').offsetTop)/height)),before=units.slice(0,index).reduce((a,b)=>a+b.weight,0),total=units.reduce((a,b)=>a+b.weight,0),percent=Math.max(0,Math.min(100,Math.round((before+u.weight*fraction)/total*100)));
 $('current-label').textContent=currentLabel();$('reading-percent').textContent=percent+'%';$('progress-fill').style.width=percent+'%';$('progress-track').setAttribute('aria-valuenow',percent);
 document.querySelectorAll('.contents-nav a').forEach(a=>{if(a.hash==='#'+active||a.hash==='#'+findSection())a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
function renderResume(){const saved=state.position&&byId.has(state.position.unit)&&$(state.position.block);$('begin-text').textContent=saved?'继续阅读':'开始阅读';$('resume-detail').textContent=saved?'上次读到 · '+state.position.label:'';$('restart').hidden=!saved;$('cover-contents').hidden=!!saved;}
function showLanding(){persist();active=null;$('landing').hidden=false;$('reader').hidden=true;document.body.classList.remove('reading');$('current-label').textContent='';$('reading-percent').hidden=true;$('settings-button').hidden=true;$('progress-track').hidden=true;history.replaceState(null,'',location.pathname+location.search);renderResume();scrollTo({top:0,behavior:'instant'});}
async function navigate(id,{push=true,position=null,focus=true}={}){
 const unitId=anchors.get(id);if(!unitId)return false;
 persist();active=unitId;restoring=true;
 document.querySelectorAll('.book-unit').forEach(a=>a.hidden=a.id!==active);$('landing').hidden=true;$('reader').hidden=false;document.body.classList.add('reading');$('reading-percent').hidden=false;$('settings-button').hidden=false;$('progress-track').hidden=false;
 const index=units.findIndex(u=>u.id===active),prev=units[index-1],next=units[index+1];$('previous-unit').hidden=!prev;$('next-unit').hidden=!next;
 if(prev){$('previous-title').textContent=prev.title;$('previous-unit').dataset.target=prev.id;}if(next){$('next-title').textContent=next.title;$('next-unit').dataset.target=next.id;}
 if(push)history.pushState({unit:active},'', '#'+id);
 // Font swapping changes line count; locate the requested paragraph after fonts settle.
 await fontsReady;await new Promise(requestAnimationFrame);
 if(active!==unitId)return false;
 if(position)restorePosition(position);else{const target=$(id),top=target?target.getBoundingClientRect().top+scrollY-100:0;scrollTo({top:Math.max(0,top),behavior:'instant'});}
 if(focus)$('reader').focus({preventScroll:true});
 restoring=false;updateProgress();persist();return true;
}
function openDialog(id){dialogPosition={reading:getPosition(),y:scrollY};$(id).showModal();}
function closeDialog(id){$(id).close();}
function restoreAfterDialog(){if(!dialogPosition)return;const p=dialogPosition;dialogPosition=null;requestAnimationFrame(()=>{if(active&&p.reading)restorePosition(p.reading);else scrollTo({top:p.y,behavior:'instant'});updateProgress();persist();});}
$('brand').onclick=showLanding;
['contents-button','cover-contents','footer-contents'].forEach(id=>$(id).onclick=()=>openDialog('contents-dialog'));
$('settings-button').onclick=()=>openDialog('settings-dialog');
document.querySelector('.skip-link').onclick=e=>{e.preventDefault();navigate(active||'preface');};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',restoreAfterDialog);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
function chooseTarget(id){dialogPosition=null;closeDialog('contents-dialog');navigate(id);}
document.querySelectorAll('.contents-nav a').forEach(a=>a.onclick=e=>{e.preventDefault();chooseTarget(a.hash.slice(1));});
$('begin').onclick=()=>{const p=state.position;if(p&&byId.has(p.unit)&&$(p.block))navigate(p.unit,{position:p});else navigate('preface');};
$('restart').onclick=()=>{state.position=null;store();navigate('preface');};
['previous-unit','next-unit'].forEach(id=>$(id).onclick=()=>navigate($(id).dataset.target));
function adjust(change){const p=getPosition();state.size=Math.max(16,Math.min(28,state.size+change));applySettings();store();if(p){restorePosition(p);if(dialogPosition)dialogPosition.reading=p;}}
$('size-down').onclick=()=>adjust(-1);$('size-up').onclick=()=>adjust(1);
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{const y=scrollY;state.theme=b.dataset.themeChoice;applySettings();store();scrollTo({top:y,behavior:'instant'});});
document.querySelectorAll('[data-font-choice]').forEach(b=>b.onclick=()=>{const p=getPosition();state.font=b.dataset.fontChoice;applySettings();store();if(p){restorePosition(p);if(dialogPosition)dialogPosition.reading=p;}});
$('book-search').addEventListener('input',()=>{
 const query=$('book-search').value.trim(),results=$('search-results'),nav=document.querySelector('.contents-nav');results.replaceChildren();results.hidden=!query;nav.hidden=!!query;
 if(!query){$('search-status').textContent='';return;}
 const matches=data.search.filter(row=>row.text.includes(query));$('search-status').textContent=matches.length?'找到 '+matches.length+' 处'+(matches.length>60?'，先显示前 60 处':''):'没有找到这段文字';
 for(const row of matches.slice(0,60)){const a=document.createElement('a');a.href='#'+row.anchor;const title=document.createElement('strong');title.textContent=row.title;const excerpt=document.createElement('span'),i=row.text.indexOf(query),start=Math.max(0,i-30);excerpt.textContent=(start?'…':'')+row.text.slice(start,Math.min(row.text.length,start+100))+(row.text.length>start+100?'…':'');a.append(title,excerpt);a.onclick=e=>{e.preventDefault();chooseTarget(row.anchor);};results.append(a);}
});
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{updateProgress();frame=0;});clearTimeout(saveTimer);saveTimer=setTimeout(persist,350);},{passive:true});
addEventListener('pagehide',persist);addEventListener('resize',()=>{if(active)updateProgress();});
addEventListener('popstate',()=>{const id=decodeURIComponent(location.hash.slice(1));if(id)navigate(id,{push:false});else showLanding();});
applySettings();renderResume();const initial=decodeURIComponent(location.hash.slice(1));if(initial)navigate(initial,{push:false});
})();
