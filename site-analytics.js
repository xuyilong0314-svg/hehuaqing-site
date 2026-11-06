import {ANALYTICS_URL,ANALYTICS_KEY,PREFERENCE_KEY,OWNER_DEVICE_KEY} from './analytics/config.js?v=20261031-20';
import {sourceCategory,deviceCategory} from './analytics/metrics.js?v=20261031-20';
import {readingPath,progressDepth,isReading} from './analytics/routing.js?v=20261105-reading-1';
import {readingAuthorization} from './account/client.js?v=20261106-auth-regression-1';
import './account/nav.js?v=20261105-session-1';
if(!window.__hhqAnalyticsStarted){
 window.__hhqAnalyticsStarted=true;const base=new URL('./',import.meta.url);
 const production=(location.hostname==='xuyilong0314-svg.github.io'&&base.pathname==='/hehuaqing-site/')||(['www.hehuaqing.com','hehuaqing.com'].includes(location.hostname)&&base.pathname==='/');
 let current=null,lastActivity=Date.now(),lastTick=performance.now(),routeTimer;
 const read=k=>{try{return localStorage.getItem(k);}catch{return null;}},write=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
 const allowed=()=>production&&read(PREFERENCE_KEY)!=='off'&&read(OWNER_DEVICE_KEY)!=='yes'&&navigator.doNotTrack!=='1'&&!navigator.globalPrivacyControl&&!/bot|crawler|spider|headless/i.test(navigator.userAgent);
 const day=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const path=()=>readingPath(location.pathname,location.hash,document.querySelector('.locked-chapter[data-reading-id]')?.dataset.readingId,base.pathname);
 function tick(){const now=performance.now();if(current&&document.visibilityState==='visible'&&Date.now()-lastActivity<60000)current.seconds=Math.min(7200,current.seconds+Math.min(10,(now-lastTick)/1000));lastTick=now;}
 function depth(){
  if(!current||current.path!==path())return;
  const element=document.querySelector('article.reading-prose');
  if(isReading(current.path)&&current.path.startsWith('/books/')&&element?.dataset.readingId!==current.path.replace(/^\/books\//,'').replace(/\.html$/,''))return;
  if(isReading(current.path)&&!current.path.startsWith('/books/')&&element?.dataset.articleId!==current.path.split('/').pop().replace(/\.html$/,''))return;
  const rect=element?.getBoundingClientRect();current.depth=Math.max(current.depth,progressDepth(rect,innerHeight,document.documentElement.scrollHeight,scrollY,isReading(current.path)));
 }
 async function send(view,final=false){
  if(!view||!allowed())return;const seconds=Math.floor(view.seconds),depth=view.depth;
  if(seconds===view.sentSeconds&&depth===view.sentDepth&&!final)return;view.sentSeconds=seconds;view.sentDepth=depth;view.lastFlush=Date.now();
  try{const token=await readingAuthorization();if(!allowed())return;const headers={'Content-Type':'application/json',apikey:ANALYTICS_KEY};if(token)headers.Authorization='Bearer '+token;
   const response=await fetch(ANALYTICS_URL+'/rest/v1/rpc/record_site_reading',{method:'POST',headers,credentials:'omit',referrerPolicy:'no-referrer',keepalive:final,body:JSON.stringify({p_view_id:view.id,p_visitor_id:view.visitor,p_path:view.path,p_device:deviceCategory(navigator.userAgent,screen.width),p_source:view.source,p_seconds:seconds,p_depth:depth})});
   if(!response.ok){view.sentSeconds=-1;view.sentDepth=-1;}
  }catch{view.sentSeconds=-1;view.sentDepth=-1;}
 }
 function navigate(force=false){
  const next=path();if(!force&&current?.path===next&&current.day===day())return;
  tick();if(current)send(current,true);current=null;if(!next||!allowed()||document.visibilityState!=='visible')return;
  try{let saved=JSON.parse(read('hhq-analytics-day')||'null');if(saved?.day!==day()||!/^[0-9a-f-]{36}$/.test(saved?.id))saved={day:day(),id:crypto.randomUUID()};write('hhq-analytics-day',JSON.stringify(saved));current={id:crypto.randomUUID(),visitor:saved.id,path:next,day:day(),seconds:0,depth:0,sentSeconds:-1,sentDepth:-1,lastFlush:0,source:sourceCategory(document.referrer,navigator.userAgent,location.origin)};lastTick=performance.now();lastActivity=Date.now();send(current);}catch{}
 }
 const check=()=>{clearTimeout(routeTimer);routeTimer=setTimeout(()=>{navigate();depth();},100);};
 ['pointerdown','keydown','scroll','touchstart'].forEach(type=>addEventListener(type,()=>{tick();lastActivity=Date.now();depth();},{passive:true}));
 addEventListener('hashchange',check);new MutationObserver(check).observe(document.querySelector('#root')||document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{tick();depth();if(document.visibilityState==='hidden')send(current,true);else{lastActivity=Date.now();lastTick=performance.now();navigate();}});
 addEventListener('pagehide',()=>{tick();depth();send(current,true);});addEventListener('pageshow',e=>{if(e.persisted)navigate(true);});
 addEventListener('hhq-account-change',()=>navigate(true));addEventListener('hhq-analytics-optout',()=>{current=null;});
 addEventListener('storage',e=>{if([PREFERENCE_KEY,OWNER_DEVICE_KEY].includes(e.key))navigate(true);});
 setInterval(()=>{if(!allowed()){current=null;return;}navigate();tick();depth();if(current&&document.visibilityState==='visible'&&Date.now()-lastActivity<60000&&Date.now()-current.lastFlush>=30000)send(current);},5000);check();
}
