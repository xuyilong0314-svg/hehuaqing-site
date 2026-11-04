(()=>{
  'use strict';
  const chapters=Array.from(document.querySelectorAll('.reader-chapter'));
  const key='mengzhongdeng-reading-v1', prefKey='mengzhongdeng-preferences-v1';
  const readStore=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const writeStore=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const prefs=readStore(prefKey)||{};
  let size=Number.isFinite(prefs.size)?Math.max(18,Math.min(30,prefs.size)):21;
  let theme=['light','dark'].includes(prefs.theme)?prefs.theme:null;
  let active=0,ready=false,saveTimer;
  const root=document.documentElement, dialog=document.getElementById('toc-dialog');
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const previous=document.getElementById('previous-chapter'),next=document.getElementById('next-chapter');
  const minus=document.getElementById('font-less'),plus=document.getElementById('font-more'),themeButton=document.getElementById('theme-toggle');
  const scheme=window.matchMedia('(prefers-color-scheme: dark)');
  function updatePreferences(){
    root.style.setProperty('--reader-size',size+'px');
    if(theme)root.dataset.theme=theme;else delete root.dataset.theme;
    const dark=theme==='dark'||(!theme&&scheme.matches);
    themeButton.textContent=dark?'日间':'夜间';
    themeButton.setAttribute('aria-label',dark?'切换日间模式':'切换夜间模式');
    themeButton.setAttribute('aria-pressed',String(dark));
    minus.disabled=size<=18;plus.disabled=size>=30;
    writeStore(prefKey,{size,theme});
  }
  function bookmark(){
    const ps=Array.from(chapters[active].querySelectorAll('.reader-text p'));
    const line=document.querySelector('.reader-bar').getBoundingClientRect().bottom+24;
    let index=ps.findIndex(p=>p.getBoundingClientRect().bottom>line);if(index<0)index=ps.length-1;
    const rect=ps[index].getBoundingClientRect();
    return {chapter:chapters[active].id,paragraph:index,offset:Math.max(0,Math.min(1,(line-rect.top)/rect.height)),atStart:window.scrollY<55,updatedAt:Date.now()};
  }
  function save(){if(ready)writeStore(key,bookmark());}
  function restore(mark){
    if(!mark||mark.atStart){window.scrollTo({top:0,behavior:'instant'});return;}
    const p=chapters[active].querySelector('[data-paragraph="'+Math.max(0,Number(mark.paragraph)||0)+'"]');
    if(!p){window.scrollTo({top:0,behavior:'instant'});return;}
    const offset=Math.max(0,Math.min(1,Number(mark.offset)||0));
    const top=p.getBoundingClientRect().top+window.scrollY+p.getBoundingClientRect().height*offset-document.querySelector('.reader-bar').offsetHeight-24;
    window.scrollTo({top:Math.max(0,top),behavior:'instant'});
  }
  function select(id,{restoreMark=null,focus=false,updateURL=true}={}){
    const found=chapters.findIndex(c=>c.id===id);active=found<0?0:found;
    for(let i=0;i<chapters.length;i++)chapters[i].hidden=i!==active;
    const current=chapters[active];
    document.title=current.querySelector('h1').textContent+'｜梦中灯 · 何华清';
    document.getElementById('chapter-position').textContent=(active+1)+' / '+chapters.length;
    previous.setAttribute('aria-disabled',String(active===0));previous.tabIndex=active===0?-1:0;
    previous.href=active>0?'#'+chapters[active-1].id:'#'+current.id;
    next.href=active<chapters.length-1?'#'+chapters[active+1].id:'index.html';
    next.textContent=active<chapters.length-1?'下一篇 →':'返回书页 →';
    for(const a of document.querySelectorAll('[data-select]')){
      if(a.dataset.select===current.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    }
    if(updateURL)history.replaceState(null,'','#'+current.id);
    if(dialog.open)dialog.close();
    if(focus)current.querySelector('h1').focus({preventScroll:true});
    restore(restoreMark);save();
  }
  updatePreferences();
  scheme.addEventListener('change',()=>{if(!theme)updatePreferences()});
  minus.addEventListener('click',()=>{const mark=bookmark();size=Math.max(18,size-2);updatePreferences();restore(mark);save()});
  plus.addEventListener('click',()=>{const mark=bookmark();size=Math.min(30,size+2);updatePreferences();restore(mark);save()});
  themeButton.addEventListener('click',()=>{theme=(theme==='dark'||(!theme&&scheme.matches))?'light':'dark';updatePreferences()});
  document.getElementById('toc-toggle').addEventListener('click',()=>{dialog.showModal();const a=dialog.querySelector('[aria-current="page"]');if(a)a.focus({preventScroll:true});});
  document.getElementById('toc-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    if(!(a.dataset.select||a===previous||a===next))return;
    const href=a.getAttribute('href');if(!href||!href.startsWith('#'))return;
    e.preventDefault();if(a.getAttribute('aria-disabled')==='true')return;
    select(href.slice(1),{focus:true});
  });
  window.addEventListener('hashchange',()=>select(location.hash.slice(1),{focus:true,updateURL:false}));
  window.addEventListener('scroll',()=>{clearTimeout(saveTimer);saveTimer=setTimeout(save,180)},{passive:true});
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
  const saved=readStore(key);
  const isReload=performance.getEntriesByType('navigation')[0]?.type==='reload';
  const resume=new URLSearchParams(location.search).get('resume')==='1'||(isReload&&saved&&(!location.hash||location.hash.slice(1)===saved.chapter));
  const initial=resume&&saved&&chapters.some(c=>c.id===saved.chapter)?saved.chapter:location.hash.slice(1)||chapters[0].id;
  select(initial,{restoreMark:resume?saved:null});
  const loaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  Promise.all([document.fonts.ready,loaded]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    ready=true;restore(resume?saved:null);save();document.body.dataset.readerReady='true';
  })));
})();
