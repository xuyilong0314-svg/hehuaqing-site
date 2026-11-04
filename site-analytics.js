import {ANALYTICS_URL,ANALYTICS_KEY,PREFERENCE_KEY,OWNER_DEVICE_KEY} from './analytics/config.js?v=20261031-20';
import {canonicalPath,sourceCategory,deviceCategory} from './analytics/metrics.js?v=20261031-20';

// One anonymous row per page view. Never read forms, account sessions or URL queries/hashes.
if(!window.__hhqAnalyticsStarted){
  window.__hhqAnalyticsStarted=true;
  const base=new URL('./',import.meta.url),path=canonicalPath(location.pathname,base.pathname);
  let timer,viewId,visitorId,seconds=0,depth=0,lastTick=performance.now(),lastActivity=Date.now(),lastSent=-1,lastFlush=0,stopped=false;
  const storeGet=k=>{try{return localStorage.getItem(k);}catch{return null;}};
  const storeSet=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
  const allowed=()=>!stopped&&storeGet(PREFERENCE_KEY)!=='off'&&storeGet(OWNER_DEVICE_KEY)!=='yes'&&navigator.doNotTrack!=='1'&&!navigator.globalPrivacyControl;
  const production=(location.hostname==='xuyilong0314-svg.github.io'&&base.pathname==='/hehuaqing-site/')||(['www.hehuaqing.com','hehuaqing.com'].includes(location.hostname)&&base.pathname==='/');
  const day=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const uuid=()=>crypto.randomUUID();
  const updateDepth=()=>{const h=document.documentElement.scrollHeight;depth=Math.max(depth,Math.min(100,Math.round((scrollY+innerHeight)/Math.max(h,1)*100)));};
  const tick=()=>{const now=performance.now();if(document.visibilityState==='visible'&&Date.now()-lastActivity<60000)seconds=Math.min(7200,seconds+Math.min(10,(now-lastTick)/1000));lastTick=now;};
  const stop=()=>{stopped=true;clearInterval(timer);};
  async function send(final=false){
    if(!allowed()||!production||!path||!viewId)return;
    tick();updateDepth();const n=Math.floor(seconds);
    if(n===lastSent&&!final)return;
    lastSent=n;
    try{
      const response=await fetch(ANALYTICS_URL+'/rest/v1/rpc/record_site_visit',{
        method:'POST',headers:{'Content-Type':'application/json',apikey:ANALYTICS_KEY},credentials:'omit',
        referrerPolicy:'no-referrer',keepalive:final,
        body:JSON.stringify({p_view_id:viewId,p_visitor_id:visitorId,p_path:path,
          p_device:deviceCategory(navigator.userAgent,screen.width),p_source:sourceCategory(document.referrer,navigator.userAgent,location.origin),
          p_seconds:n,p_depth:depth})
      });
      if(!response.ok&&response.status<500)stop();
    }catch{lastSent=-1;}
  }
  function start(){
    if(!production||!path||!allowed()||/bot|crawler|spider|headless/i.test(navigator.userAgent))return;
    try{
      const saved=JSON.parse(storeGet('hhq-analytics-day')||'null');
      visitorId=saved?.day===day()&&/^[0-9a-f-]{36}$/.test(saved.id)?saved.id:uuid();
      storeSet('hhq-analytics-day',JSON.stringify({day:day(),id:visitorId}));viewId=uuid();
    }catch{return;}
    send();lastFlush=Date.now();timer=setInterval(()=>{tick();if(document.visibilityState==='visible'&&Date.now()-lastActivity<60000&&Date.now()-lastFlush>=30000){lastFlush=Date.now();send();}},5000);
  }
  // A visible choice is available on every measured page, without obstructing reading.
  function preferenceLink(){
    if(!path||!production)return;
    const footer=document.createElement('div');footer.style.cssText='text-align:center;padding:18px 12px 24px;font:12px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#657365';
    if(path==='/zhongyi/aform/index.html')footer.style.paddingBottom='110px';
    const link=document.createElement('a');link.href=new URL('analytics/privacy.html',base).href;
    link.textContent='匿名访问统计 · 设置';link.style.cssText='color:inherit;text-decoration:underline;text-underline-offset:3px';
    footer.append(link);document.body.append(footer);
  }
  ['pointerdown','keydown','scroll','touchstart'].forEach(type=>addEventListener(type,()=>{tick();lastActivity=Date.now();},{passive:true}));
  document.addEventListener('visibilitychange',()=>{tick();if(document.visibilityState==='hidden')send(true);else{lastActivity=Date.now();lastTick=performance.now();if(!viewId)start();}});
  addEventListener('pagehide',()=>send(true));
  addEventListener('storage',event=>{if([PREFERENCE_KEY,OWNER_DEVICE_KEY].includes(event.key)&&!allowed())stop();});
  addEventListener('hhq-analytics-optout',stop);
  preferenceLink();if(document.visibilityState==='visible')start();
}
